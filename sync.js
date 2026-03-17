import { kv } from '@vercel/kv';

const USER_KEY = 'xian-expenses';
const SETTINGS_KEY = 'xian-settings';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // GET = fetch all data from cloud
    if (req.method === 'GET') {
      const expenses = await kv.get(USER_KEY) || [];
      const settings = await kv.get(SETTINGS_KEY) || { rate: 2450, budget: 3000 };
      return res.status(200).json({ expenses, settings, synced: new Date().toISOString() });
    }

    // POST = save data to cloud
    if (req.method === 'POST') {
      const { expenses, settings } = req.body;
      if (expenses) await kv.set(USER_KEY, expenses);
      if (settings) await kv.set(SETTINGS_KEY, settings);
      return res.status(200).json({ ok: true, synced: new Date().toISOString(), count: expenses?.length || 0 });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
