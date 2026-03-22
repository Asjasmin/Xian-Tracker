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
              text: `You are analyzing Alipay/WeChat Pay transaction screenshots for a student in Xi'an, China.

Extract transactions and INTELLIGENTLY calculate actual expenses by detecting these patterns:

1. **SPLIT BILLS**: If someone pays a large amount to a person/merchant, then receives multiple smaller payments from friends (收款 = received), calculate: actual_expense = amount_paid - total_received_back. Group these as ONE transaction with the net amount.
   Example: Paid ¥278 to Nicholas, received ¥27.80 from 5 friends + ¥45 from another → net expense = ¥278 - ¥139 - ¥45 = ¥94

2. **REFUNDS**: If a service charges then refunds (same merchant, one negative one positive), calculate: actual_expense = charge - refund. Group as ONE transaction.
   Example: Amap charged ¥88.86, then Amap refunded ¥3.16 → net expense = ¥85.70

3. **CAMPUS QR CODES**: Payments to university names like 陕西开放大学, 陕西工商职业学院 for small amounts (under ¥50) are usually CANTEEN/FOOD purchases, NOT education. Only classify as "Education Needs" if amount is large (¥100+, likely tuition/fees).

4. **PURE INCOME**: Skip transfers received (转账) that are NOT related to split bills, e.g. money from family.

Return ONLY a JSON array (no markdown, no backticks) with objects:
- "date": "YYYY-MM-DD" (use the date of the main expense)
- "description": merchant/item name (keep original Chinese)
- "category": exactly one of: "Food & Beverage", "Entertainment", "Education Needs", "Shopping", "Transportation", "Health & Medical", "Communication & Internet", "Laundry & Cleaning", "Others"
- "amount": positive number = the NET/ACTUAL amount spent after deducting refunds or split bill returns
- "payment": "Alipay" or "WeChat Pay"
- "remarks": brief English note. If split bill, mention "Split bill: paid ¥X, received ¥Y back, net ¥Z". If refund, mention "After ¥X refund".

Return ONLY the JSON array.`
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
