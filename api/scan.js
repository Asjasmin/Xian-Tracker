module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { base64Image, image, prompt } = req.body; 
    const finalImage = base64Image || image; 
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in Vercel settings" });
    }

    if (!finalImage) {
      return res.status(400).json({ error: "Missing base64Image or image in request body" });
    }

    const cleanBase64 = finalImage.replace(/^data:image\/[a-z]+;base64,/, "");
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

    const exactPrompt = `
      Analyze this receipt/screenshot and extract all expenses into a structured JSON object.
      You MUST return a root object with a single key called "transactions" containing an array of items.
      Each item in the array MUST contain these exact keys to prevent the app from crashing:
      - "description": The merchant name or specific item name.
      - "date": The date of the purchase (format: YYYY-MM-DD).
      - "amount": The total price as a pure number.
      - "category": A short 1-2 word category (e.g., "Food", "Transport", "Shopping").
      - "remarks": Any extra context, or just an empty string "".

      Example format:
      {
        "transactions": [
          {
            "description": "Starbucks",
            "date": "2026-06-17",
            "amount": 5.75,
            "category": "Food",
            "remarks": "Morning coffee"
          }
        ]
      }
    `;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: req.body.mediaType || "image/jpeg", 
              data: cleanBase64 
            }
          },
          { 
            text: prompt || exactPrompt 
          }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json" 
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Gemini API Error');
    }
    
    // Safe text-extraction block
    const rawText = data.candidates[0].content.parts[0].text;
    const jsonMatch = rawText.match(/\{[\s\S]*\}/); 
    
    if (!jsonMatch) {
      throw new Error("Model did not return valid JSON.");
    }
    
    const parsedData = JSON.parse(jsonMatch[0]);
    res.status(200).json(parsedData);

  } catch (error) {
    console.error("Scanner Error:", error);
    res.status(500).json({ error: 'Failed to scan image', details: error.message });
  }
}
