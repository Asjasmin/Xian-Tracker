export default async function handler(req, res) {
  // Only allow POST requests from your frontend
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  try {
    // This expects your frontend to send the raw Base64 string and an optional prompt
    const { base64Image, prompt } = req.body; 
    
    // Pulling your secure key from Vercel's Environment Variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY in Vercel settings" });
    }
    
    // Using the Pro model for high-accuracy OCR receipt scanning
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        role: "user",
        parts: [
          {
            // Gemini vision requires the image as an inlineData object
            inlineData: {
              mimeType: "image/jpeg", 
              data: base64Image 
            }
          },
          { 
            text: prompt || "Extract the merchant name, date, and total amount from this receipt into JSON format." 
          }
        ]
      }],
      // Forcing the Pro model to return perfectly structured JSON for your database
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
    const jsonString = data.candidates[0].content.parts[0].text;
    
    // Parsing the string into an actual JSON object to send back to your frontend
    const parsedData = JSON.parse(jsonString);
    
    res.status(200).json(parsedData);

  } catch (error) {
    console.error("Scanner Error:", error);
    res.status(500).json({ error: 'Failed to scan image', details: error.message });
  }
}
