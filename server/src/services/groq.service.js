const groq = require('../config/groq');

/**
 * Extract prescription data from image using Groq Vision API
 * @param {string} base64Image - Base64 encoded image string
 * @param {string} mimeType - Image MIME type (e.g., 'image/jpeg')
 * @returns {Object} Extracted prescription data
 */
const extractPrescription = async (base64Image, mimeType = 'image/jpeg') => {
  const prompt = `You are a medical prescription OCR assistant. Analyze this prescription image carefully and extract all information.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "doctor_name": "string or null",
  "doctor_qualification": "string or null",
  "doctor_clinic": "string or null",
  "patient_name": "string or null",
  "patient_age": "string or null",
  "patient_gender": "string or null",
  "date": "string or null",
  "diagnosis": "string or null",
  "medicines": [
    {
      "name": "medicine name",
      "dosage": "dosage strength e.g. 500mg",
      "frequency": "how many times per day e.g. twice daily",
      "duration": "how long e.g. 5 days",
      "instructions": "special instructions e.g. after meals",
      "quantity": "total quantity if mentioned"
    }
  ],
  "instructions": "general instructions from doctor or null",
  "follow_up": "follow up date if mentioned or null",
  "raw_text": "all text extracted from the prescription verbatim"
}

Extract every medicine mentioned. If any field is not visible or unclear, set it to null. Be precise about medicine names.`;

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 2000,
    temperature: 0.1,
  });

  const content = response.choices[0].message.content;

  // Parse JSON from response
  try {
    // Remove markdown code blocks if present
    const cleaned = content
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    // Return partial data with raw text if JSON parsing fails
    return {
      doctor_name: null,
      patient_name: null,
      diagnosis: null,
      medicines: [],
      instructions: null,
      raw_text: content,
      parse_error: true,
    };
  }
};

/**
 * Get detailed information about a medicine using Groq
 * @param {string} medicineName - Name of the medicine
 * @returns {Object} Medicine information
 */
const getMedicineInfo = async (medicineName) => {
  const prompt = `You are a pharmaceutical expert. Provide detailed information about the medicine "${medicineName}".

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "brand_names": ["list of common brand names"],
  "generic_name": "generic/chemical name",
  "drug_class": "pharmacological class",
  "active_ingredients": ["list of active ingredients"],
  "uses": ["list of medical uses/indications"],
  "how_it_works": "brief mechanism of action",
  "dosage_forms": ["tablet", "capsule", "syrup", etc.],
  "common_dosage": "typical dosage ranges",
  "side_effects": {
    "common": ["list of common side effects"],
    "serious": ["list of serious side effects to watch for"]
  },
  "contraindications": ["conditions where this medicine should NOT be used"],
  "interactions": ["important drug interactions"],
  "precautions": ["important precautions"],
  "storage": "storage instructions",
  "availability": "OTC or Prescription required"
}`;

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 1500,
    temperature: 0.1,
  });

  const content = response.choices[0].message.content;

  try {
    const cleaned = content
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return { name: medicineName, raw_info: content, parse_error: true };
  }
};

/**
 * Find alternative medicines from inventory with same/similar ingredients
 * @param {string} medicineName - The unavailable medicine
 * @param {string} ingredients - Active ingredients of the medicine
 * @param {Array} inventory - Chemist's inventory array
 * @returns {Array} List of alternatives from inventory
 */
const findAlternatives = async (medicineName, ingredients, inventory) => {
  if (!inventory || inventory.length === 0) {
    return [];
  }

  const inventoryList = inventory
    .map(
      (item) =>
        `- ${item.medicine_name} (Generic: ${item.generic_name || 'N/A'}, Ingredients: ${item.ingredients || 'N/A'}, Qty: ${item.quantity})`
    )
    .join('\n');

  const prompt = `You are a pharmacist expert. A patient needs "${medicineName}" (ingredients: ${ingredients || 'unknown'}).
This medicine is NOT available in inventory.

Available inventory:
${inventoryList}

Find medicines from the inventory that can serve as alternatives for "${medicineName}" based on:
1. Same active ingredients
2. Same drug class/pharmacological action
3. Equivalent therapeutic effect

Return ONLY a valid JSON array (no markdown, no explanation):
[
  {
    "medicine_name": "name from inventory",
    "reason": "why this is an alternative",
    "similarity": "high/medium/low",
    "note": "any important note for the pharmacist"
  }
]

If NO suitable alternatives exist, return an empty array: []`;

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 1000,
    temperature: 0.1,
  });

  const content = response.choices[0].message.content;

  try {
    const cleaned = content
      .replace(/```json\n?/gi, '')
      .replace(/```\n?/gi, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return [];
  }
};

module.exports = { extractPrescription, getMedicineInfo, findAlternatives };
