# 🌸 Xi'an Life Expense Tracker

A personal expense tracker for student life in Xi'an, China.

## Features
- 📸 **Screenshot Scanner** — Upload Alipay/WeChat screenshots, AI reads all transactions
- ✏️ **Manual Input** — Quick expense entry with category dropdowns
- 📊 **Dashboard** — Weekly/monthly charts, category breakdown, budget tracking
- 💱 **RMB ↔ IDR** — Auto currency conversion with editable exchange rate
- 📄 **PDF Report** — Download monthly summary to send to parents
- ⚙️ **Settings** — Exchange rate, monthly budget, data management

## Deploy to Vercel (Free)

### Step 1: Get a Claude API Key
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up / Sign in
3. Go to **API Keys** → **Create Key**
4. Copy the key (starts with `sk-ant-...`)

### Step 2: Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. In this project folder, run: `vercel`
3. Follow the prompts (select defaults)
4. When asked, add environment variable:
   - Name: `ANTHROPIC_API_KEY`
   - Value: your API key from Step 1

### Or Deploy via GitHub:
1. Push this folder to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → Import Project → Select your repo
3. In **Environment Variables**, add `ANTHROPIC_API_KEY` = your key
4. Click **Deploy**

### Step 3: Bookmark on iPhone
1. Open your Vercel URL on Safari
2. Tap Share → Add to Home Screen
3. Name it "Xi'an Life" 🌸

## Project Structure
```
├── index.html          # The full app (single page)
├── api/
│   └── scan.js         # Vercel serverless function for screenshot scanning
├── vercel.json         # Vercel config
└── README.md           # This file
```
