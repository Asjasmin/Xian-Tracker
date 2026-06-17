export default async function handler(req, res) {
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

    // Universal prompt structure to satisfy any frontend variable naming keys
    const universalPrompt = `
      Analyze this receipt image and extract the data into a flat JSON object.
      You must include all of the following keys to guarantee frontend compatibility:
      - For the store: include "merchant", "merchantName", and "merchant_name" (use the same store string value for all three).
      - For the date: include "date" (formatted as YYYY-MM-DD if possible).
      - For the price: include "amount", "total", and "total_amount" (use the same numeric value for all three).
      
      Example format:
      {
        "merchant": "Starbucks",
        "merchantName": "Starbucks",
        "merchant_name": "Starbucks",
        "date": "2026-06-17",
        "amount": 5.75,
        "total": 5.75,
        "total_amount": 5.75
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
            text: prompt || universalPrompt 
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
    
    let jsonString = data.candidates[0].content.parts[0].text;
    jsonString = jsonString.replace(/^```json\s*/i, '').replace(/
```\s*$/, '').trim();
    
    const parsedData = JSON.parse(jsonString);
    res.status(200).json(parsedData);

  } catch (error) {
    console.error("Scanner Error:", error);
    res.status(500).json({ error: 'Failed to scan image', details: error.message });
  }
}
