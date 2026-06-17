export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    // FIX: Accept both 'image' (from your frontend) or 'base64Image'
    const { base64Image, image, prompt } = req.body; 
    const finalImage = base64Image || image; // Uses whichever one is provided
    
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in Vercel settings" });
    }

    if (!finalImage) {
      return res.status(400).json({ error: "Missing base64Image or image in request body" });
    }

    // Strip the Data URI prefix if it exists
    const cleanBase64 = finalImage.replace(/^data:image\/[a-z]+;base64,/, "");
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: req.body.mediaType || "image/jpeg", // Dynamically match frontend mime type
              data: cleanBase64 
            }
          },
          { 
            text: prompt || "Extract the merchant name, date, and total amount from this receipt into JSON format." 
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
