export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { image, mediaType } = req.body;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType || 'image/png', data: image }
            },
            {
              type: 'text',
              text: `Extract ALL expense transactions from this Alipay/WeChat Pay screenshot.

Return ONLY a JSON array (no markdown, no backticks, no explanation) with objects having:
- "date": "YYYY-MM-DD"
- "description": merchant/item name (keep original Chinese characters)
- "category": exactly one of: "Food & Beverage", "Entertainment", "Education Needs", "Shopping", "Transportation", "Health & Medical", "Communication & Internet", "Laundry & Cleaning", "Others"
- "amount": positive number (RMB spent)
- "payment": "Alipay" or "WeChat Pay"
- "remarks": brief English description of what it is

Rules:
- SKIP income/refunds (green positive amounts, transfers received)
- ONLY include expenses (negative amounts / spending)
- Return ONLY the JSON array, nothing else`
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (data.error) {
      return res.status(400).json({ error: data.error.message });
    }

    const text = (data.content || []).map(c => c.text || '').join('');
    const clean = text.replace(/```json|```/g, '').trim();

    let transactions;
    try {
      transactions = JSON.parse(clean);
    } catch {
      return res.status(400).json({ error: 'Could not parse transactions', raw: clean });
    }

    return res.status(200).json({ transactions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
