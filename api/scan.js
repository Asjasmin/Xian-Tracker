export default async function handler(req, res) {
  // Only allow POST requests from your frontend
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    const { base64Image, prompt } = req.body; 
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in Vercel settings" });
    }

    if (!base64Image) {
      return res.status(400).json({ error: "Missing base64Image in request body" });
    }

    // FIX 1: Strip the Data URI prefix if it exists (e.g., "data:image/jpeg;base64,")
    const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");
    
    // Using the Pro model for high-accuracy OCR receipt scanning
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", 
              data: cleanBase64 // Using the cleaned raw base64 data
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
    
    // Extracting the JSON text from Gemini's response structure
    let jsonString = data.candidates[0].content.parts[0].text;
    
    // FIX 2: Clean out markdown code blocks if the model accidentally includes them
    jsonString = jsonString.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
    
    // Parsing the string into an actual JSON object to send back to your frontend
    const parsedData = JSON.parse(jsonString);
    
    res.status(200).json(parsedData);

  } catch (error) {
    console.error("Scanner Error:", error);
    res.status(500).json({ error: 'Failed to scan image', details: error.message });
  }
}
