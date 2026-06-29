"""
Download Medical Prescription OCR Dataset images from HuggingFace
using the Hub file download API (works with LFS-stored images).

Usage:
    python download_dataset.py
    python download_dataset.py --max 40
    python download_dataset.py --max 100 --split train
"""

import argparse
import json
import os
import sys
import time

# Fix Windows console encoding
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

REPO_ID = "chinmays18/medical-prescription-dataset"
BASE_URL = "https://huggingface.co/datasets/{repo}/resolve/main/{path}"
API_TREE_URL = "https://huggingface.co/api/datasets/{repo}/tree/main/{folder}"


def get_file_list(split="train", max_count=40):
    """List image files from HuggingFace API."""
    import urllib.request
    import urllib.error

    folder = f"{split}/images"
    url = API_TREE_URL.format(repo=REPO_ID, folder=folder)

    print(f"[INFO] Fetching file list from: {url}")
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except Exception as e:
        print(f"[ERROR] Failed to fetch file list: {e}")
        sys.exit(1)

    # Filter PNG files and extract paths
    files = [
        item["path"] for item in data
        if item.get("type") == "file" and item["path"].endswith(".png")
    ]
    files.sort()
    print(f"[INFO] Found {len(files)} images in {split}/images")
    return files[:max_count]


def get_annotations(split="train", max_count=40):
    """List annotation files from HuggingFace API."""
    import urllib.request

    folder = f"{split}/annotations"
    url = API_TREE_URL.format(repo=REPO_ID, folder=folder)
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            data = json.loads(resp.read().decode('utf-8'))
    except Exception:
        return {}

    ann_map = {}
    for item in data:
        if item.get("type") == "file" and item["path"].endswith(".json"):
            basename = os.path.basename(item["path"]).replace(".json", "")
            ann_map[basename] = item["path"]
    return ann_map


def download_file(repo_path, local_path, retries=3):
    """Download a single file from HuggingFace."""
    import urllib.request

    url = BASE_URL.format(repo=REPO_ID, path=repo_path)
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(url, timeout=60) as resp:
                content = resp.read()
            with open(local_path, "wb") as f:
                f.write(content)
            return True
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                return False, str(e)
    return False


def download_dataset(split="train", max_samples=40, output_dir=None):
    if output_dir is None:
        script_dir = os.path.dirname(os.path.abspath(__file__))
        output_dir = os.path.join(script_dir, "server", "uploads", "samples")

    os.makedirs(output_dir, exist_ok=True)

    print(f"[INFO] Downloading Medical Prescription Dataset")
    print(f"       Source: huggingface.co/datasets/{REPO_ID}")
    print(f"       Split:  {split}")
    print(f"       Max:    {max_samples}")
    print(f"       Output: {output_dir}")
    print()

    # Get file lists
    image_files = get_file_list(split, max_samples)
    ann_map = get_annotations(split, max_samples)
    total = len(image_files)

    if total == 0:
        print("[ERROR] No image files found. Check dataset access.")
        sys.exit(1)

    print(f"[INFO] Downloading {total} images + annotations...")
    print()

    metadata_list = []
    saved = 0

    for i, img_path in enumerate(image_files):
        # Derive output filename: use sequential numbering
        basename = os.path.basename(img_path).replace(".png", "")  # e.g. prescription_00000
        out_img = os.path.join(output_dir, f"prescription_{saved:04d}.png")
        out_json = os.path.join(output_dir, f"prescription_{saved:04d}.json")

        # Download image
        ok = download_file(img_path, out_img)
        if ok is not True and ok is False:
            print(f"  [SKIP] {img_path}: download failed")
            continue

        # Download annotation
        gt_parsed = {}
        raw_gt = ""
        ann_path = ann_map.get(basename)
        if ann_path:
            tmp_ann = out_json + ".tmp"
            ok2 = download_file(ann_path, tmp_ann)
            if ok2 is True or ok2 is not False:
                try:
                    with open(tmp_ann, "r", encoding="utf-8") as f:
                        ann_data = json.load(f)
                    gt_parsed = ann_data
                    raw_gt = json.dumps(ann_data)
                    os.remove(tmp_ann)
                except Exception:
                    pass

        # If no annotation file, use ground_truth text from parquet (already in cache)
        # Fall back to empty
        meta = {
            "id": saved,
            "filename": f"prescription_{saved:04d}.png",
            "original_filename": os.path.basename(img_path),
            "ground_truth": gt_parsed,
            "raw_ground_truth": raw_gt,
            "split": split,
            "source_path": img_path,
        }
        metadata_list.append(meta)

        with open(out_json, "w", encoding="utf-8") as f:
            json.dump(meta, f, indent=2, ensure_ascii=False)

        saved += 1
        if (saved % 5 == 0) or saved == total:
            print(f"  [{saved}/{total}] prescription_{saved-1:04d}.png")

    # Now also grab ground_truth text from the parquet dataset
    print()
    print("[INFO] Enriching with text annotations from dataset parquet...")
    try:
        from datasets import load_dataset
        ds = load_dataset(REPO_ID, split=split)
        gt_col = ds["ground_truth"] if "ground_truth" in ds.column_names else []

        for i, meta in enumerate(metadata_list):
            if i < len(gt_col) and gt_col[i]:
                meta["raw_ground_truth"] = gt_col[i]
                try:
                    gt_parsed = json.loads(gt_col[i].replace("<s_ocr>", "").replace("</s_ocr>", "").strip())
                    meta["ground_truth"] = gt_parsed
                except Exception:
                    meta["ground_truth"] = {"raw_text": gt_col[i]}

                # Update sidecar JSON
                json_path = os.path.join(output_dir, f"prescription_{i:04d}.json")
                with open(json_path, "w", encoding="utf-8") as f:
                    json.dump(meta, f, indent=2, ensure_ascii=False)

        print(f"[OK] Added ground truth text for {min(len(metadata_list), len(gt_col))} samples")
    except Exception as e:
        print(f"[WARN] Could not enrich with parquet annotations: {e}")

    # Write index
    index_path = os.path.join(output_dir, "index.json")
    index_data = {
        "total": saved,
        "split": split,
        "source": f"huggingface.co/datasets/{REPO_ID}",
        "samples": metadata_list,
    }
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index_data, f, indent=2, ensure_ascii=False)

    print()
    print(f"[DONE] Saved {saved} samples to: {output_dir}")
    print(f"       Index: {index_path}")
    print()
    print("[NEXT] The MedScan server will auto-detect the samples (nodemon restart not needed).")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download Medical Prescription Dataset from HuggingFace")
    parser.add_argument("--split", default="train", choices=["train", "val", "test"],
                        help="Dataset split (default: train)")
    parser.add_argument("--max", type=int, default=40,
                        help="Max samples to download (default: 40)")
    parser.add_argument("--output", type=str, default=None,
                        help="Output directory (default: server/uploads/samples/)")
    args = parser.parse_args()

    download_dataset(split=args.split, max_samples=args.max, output_dir=args.output)
