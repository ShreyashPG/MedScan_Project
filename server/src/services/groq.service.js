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

/**
 * Check drug interactions between multiple medicines
 * @param {Array} medicines - Array of medicine objects or strings
 * @returns {Object} Interaction analysis
 */
const checkDrugInteractions = async (medicines) => {
  const medListStr = medicines.map(m => typeof m === 'string' ? m : `${m.name} (${m.dosage || 'dosage unspecified'})`).join(', ');
  
  const prompt = `You are a clinical pharmacologist expert. Analyze these medicines for drug-drug interactions: ${medListStr}.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "interactions": [
    {
      "drug_a": "Medicine A",
      "drug_b": "Medicine B",
      "severity": "critical|moderate|mild",
      "description": "Clear explanation of the interaction mechanism and risk",
      "recommendation": "Clinical advice or precaution"
    }
  ],
  "safe_combinations": ["Pair or list of medicines that have no significant interaction"],
  "overall_risk": "high|moderate|low|none",
  "summary": "Concise executive summary of safety findings"
}`;

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 1500,
    temperature: 0.1,
  });

  const content = response.choices[0].message.content;
  try {
    const cleaned = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return { interactions: [], safe_combinations: [], overall_risk: 'none', summary: 'Could not analyze interactions.' };
  }
};

/**
 * Chat with AI Health Assistant with patient history context
 * @param {Array} messages - Array of message history objects [{role, content}]
 * @param {Array} patientContext - Array of recent prescription records
 * @returns {Object} AI response and follow-up suggestions
 */
const chatWithHealthAssistant = async (messages, patientContext = []) => {
  const contextText = patientContext.length > 0
    ? patientContext.map(p => `- Doctor: ${p.doctor_name || 'Unknown'}, Diagnosis: ${p.diagnosis || 'None'}, Medicines: ${JSON.stringify(p.medicines_json || p.medicines || [])}`).join('\n')
    : 'No recent prescription history on file.';

  const systemPrompt = `You are MedScan AI, an empathetic, highly knowledgeable medical AI assistant for patients and doctors.
Patient's Known Prescription History:
${contextText}

Instructions:
1. Provide helpful, accurate medical/pharmaceutical information based on user questions.
2. If discussing their medications, reference their history if relevant.
3. Keep responses concise, clear, and easy for patients to understand.
4. ALWAYS include a brief safety disclaimer when offering advice.

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "reply": "Your detailed answer here...",
  "suggestions": ["Follow-up question prompt 1", "Follow-up question prompt 2", "Follow-up question prompt 3"]
}`;

  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))
  ];

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: formattedMessages,
    max_tokens: 1500,
    temperature: 0.3,
  });

  const content = response.choices[0].message.content;
  try {
    const cleaned = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return { reply: content, suggestions: ['Can you explain more?', 'What are side effects?'] };
  }
};

/**
 * Generate AI Clinical Summary for a patient record history
 * @param {Object} patientData - Patient info and records
 * @returns {Object} Structured clinical summary
 */
const generateClinicalSummary = async (patientData) => {
  const prompt = `You are a senior physician consultant. Generate a comprehensive, professional clinical summary for referral letters and medical records based on the following patient history:

Patient Details: Name: ${patientData.patient_name || 'N/A'}, Phone: ${patientData.patient_phone || 'N/A'}
Visit Records:
${JSON.stringify(patientData.records || [], null, 2)}

Return ONLY a valid JSON object with this exact structure (no markdown, no explanation):
{
  "patient_overview": "Concise clinical narrative of patient demographic and health state",
  "diagnosis_history": ["Chronological list of diagnoses"],
  "medication_timeline": [
    {
      "period": "e.g. Jan 2024 - Present",
      "medications": ["Med 1", "Med 2"],
      "prescriber": "Doctor name"
    }
  ],
  "current_medications": ["Active current medications list"],
  "key_observations": ["Clinical insight 1", "Clinical insight 2"],
  "recommendations": ["Actionable medical recommendation 1", "Recommendation 2"],
  "summary_text": "Complete multi-paragraph clinical referral summary narrative"
}`;

  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.2,
  });

  const content = response.choices[0].message.content;
  try {
    const cleaned = content.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    return { patient_overview: 'Summary unavailable', summary_text: content };
  }
};

module.exports = {
  extractPrescription,
  getMedicineInfo,
  findAlternatives,
  checkDrugInteractions,
  chatWithHealthAssistant,
  generateClinicalSummary
};

