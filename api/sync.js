// Use the updated, stable connection method for Vercel KV / Upstash Redis
const { createClient } = require('@vercel/kv');

// Automatically looks for your new database variables even if they have prefixes
const kv = createClient({
  url: process.env.XianTrackerV2_KV_REST_API_URL || process.env.KV_REST_API_URL,
  token: process.env.XianTrackerV2_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN,
});

const USER_KEY = 'xian-expenses';
const SETTINGS_KEY = 'xian-settings';

module.exports = async function handler(req, res) {
  // CORS Setup
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    // Parse body safely in case it comes in as a string
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // GET = fetch all data from cloud
    if (req.method === 'GET') {
      const expenses = await kv.get(USER_KEY) || [];
      const settings = await kv.get(SETTINGS_KEY) || { rate: 2450, budget: 3000 };
      return res.status(200).json({ expenses, settings, synced: new Date().toISOString() });
    }

    // POST = save data to cloud
    if (req.method === 'POST') {
      const expenses = body?.expenses;
      const settings = body?.settings;
      
      if (expenses) await kv.set(USER_KEY, expenses);
      if (settings) await kv.set(SETTINGS_KEY, settings);
      
      return res.status(200).json({ 
        ok: true, 
        synced: new Date().toISOString(), 
        count: expenses?.length || 0 
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error("Sync Error:", err);
    return res.status(500).json({ error: err.message });
  }
};
