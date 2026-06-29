"""
Debug script - inspect dataset column names and structure
"""
import io
import sys
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

from datasets import load_dataset

print("[INFO] Loading dataset...")
ds = load_dataset("chinmays18/medical-prescription-dataset", split="train")

print(f"\n[INFO] Dataset type: {type(ds)}")
print(f"[INFO] Dataset length: {len(ds)}")
print(f"[INFO] Column names: {ds.column_names}")
print(f"[INFO] Features: {ds.features}")

print("\n[INFO] Inspecting first sample (raw):")
sample = ds[0]
print(f"  Type of sample: {type(sample)}")
print(f"  Keys: {list(sample.keys()) if hasattr(sample, 'keys') else 'N/A'}")

for k, v in sample.items():
    print(f"  [{k}] type={type(v).__name__}, value={repr(v)[:200]}")
