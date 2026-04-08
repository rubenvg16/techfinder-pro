# TechFinder Pro - Configuration Guide

This guide walks you through setting up all external services required by TechFinder Pro.

## Prerequisites

- Node.js 18+ installed
- npm or pnpm package manager
- Git for cloning the repository

---

## Environment Variables

Create a `.env.local` file in the project root with the following variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Upstash Redis (Required)
UPSTASH_REDIS_REST_URL=https://your-database.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token-here

# Resend Email (Required for alerts)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# eBay API (Optional - for eBay search)
EBAY_CLIENT_ID=your-ebay-client-id
EBAY_CLIENT_SECRET=your-ebay-client-secret

# Amazon via RapidAPI (Optional - for Amazon search)
AMAZON_PAAPI_KEY=your-rapidapi-key

# Google Shopping via Serper (Optional - for Google Shopping search)
SERPER_API_KEY=your-serper-api-key
```

---

## Service Setup Instructions

### 1. Supabase (Database & Auth)

**Free tier available**

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New project"
3. Enter project details:
   - **Name**: techfinder-pro
   - **Database password**: Choose a strong password
   - **Region**: Select closest to your users
4. Wait for project to initialize (~2 minutes)
5. Navigate to **Settings → API**
6. Copy the following:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Go to **SQL Editor** in the sidebar
8. Run the following to create tables:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price alerts table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  product_title TEXT NOT NULL,
  target_price NUMERIC NOT NULL,
  current_price NUMERIC,
  source TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT NOT NULL,
  source TEXT NOT NULL,
  price NUMERIC NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust as needed for your auth setup)
CREATE POLICY "Public users are viewable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can insert their own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Anyone can view alerts" ON price_alerts FOR SELECT USING (true);
CREATE POLICY "Anyone can view price history" ON price_history FOR SELECT USING (true);
```

---

### 2. Upstash Redis (Caching)

**Free tier available**

1. Go to [upstash.com](https://upstash.com) and sign up (use GitHub for quick auth)
2. Click **Create Database**
3. Configure:
   - **Name**: techfinder-cache
   - **Type**: Redis
   - **Region**: Select closest to you
4. Click **Create**
5. On the database page, find:
   - **REST URL** → `UPSTASH_REDIS_REST_URL`
   - **REST Token** → `UPSTASH_REDIS_REST_TOKEN`
6. Copy both values to your `.env.local`

---

### 3. Resend (Email Alerts)

**Free tier: 3,000 emails/month**

1. Go to [resend.com](https://resend.com) and sign up
2. Verify your email address
3. Go to **Dashboard → API Keys**
4. Click **Create API Key**
5. Copy the key → `RESEND_API_KEY`
6. (Optional) For custom sender addresses, add your domain:
   - Go to **Dashboard → Domains**
   - Click **Add Domain**
   - Follow DNS verification steps

---

### 4. eBay API (Product Search)

**Free tier available (production requires approval)**

1. Go to [developer.ebay.com](https://developer.ebay.com)
2. Sign in with your eBay account
3. Go to **Application → Create Application**
4. Configure:
   - **Application Name**: TechFinder Pro
   - **eBay Sandbox**: Enable for testing
   - **Production**: Request after testing
5. Copy:
   - **App ID (Client ID)** → `EBAY_CLIENT_ID`
   - **App Secret (Client Secret)** → `EBAY_CLIENT_SECRET`

**Note**: Production access requires eBay approval. Use Sandbox for development.

---

### 5. Amazon Product Search (via RapidAPI)

**IMPORTANT**: Amazon PA-API is being deprecated on April 30, 2026. Use RapidAPI alternatives instead.

**Option A: RapidAPI Amazon Products**

1. Go to [rapidapi.com](https://rapidapi.com) and sign up
2. Search for "Amazon Product API"
3. Recommended options:
   - **Amazon Product Reviews API** (used in this project)
   - **Amazon Price API**
4. Subscribe to a free tier plan
5. Copy your API key → `AMAZON_PAAPI_KEY`

**Option B: Alternative APIs**
- Use eBay and Google Shopping as primary sources
- The app works with partial API configuration

---

### 6. Google Shopping via Serper

**Free tier: 1,500 searches/month**

1. Go to [serper.dev](https://serper.dev) and sign up
2. Go to **Dashboard**
3. Copy your API key → `SERPER_API_KEY`

**Note**: The free tier provides 1,500 searches/month, suitable for development and light production use.

---

## Step-by-Step Setup

### Phase 1: Create All Accounts

1. [ ] Create Supabase project
2. [ ] Create Upstash Redis database
3. [ ] Create Resend account and get API key
4. [ ] Create eBay developer account
5. [ ] (Optional) Set up RapidAPI for Amazon
6. [ ] Create Serper account

### Phase 2: Configure Environment

1. Copy the template from **Environment Variables** section
2. Replace all placeholder values with your actual keys
3. Save as `.env.local` in the project root

### Phase 3: Run Migrations

1. Open Supabase SQL Editor
2. Execute the SQL commands from the Supabase section

### Phase 4: Test the Build

```bash
# Install dependencies
npm install

# Run type check
npm run typecheck

# Build the project
npm run build
```

---

## Troubleshooting

### "Missing Supabase configuration"
- Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Verify Supabase project is active

### "Missing Redis configuration"
- Ensure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set
- Check Upstash database is not paused

### Email not sending
- Verify `RESEND_API_KEY` is valid
- Check Resend dashboard for sent emails
- Ensure sender domain is verified (for production)

### eBay returns 401 errors
- Verify Client ID and Secret are correct
- Sandbox keys differ from production keys
- Production access requires eBay approval

### Amazon returns no results
- Verify RapidAPI key is valid
- Check subscription is active
- Some endpoints may require paid plans

---

## Security Notes

- Never commit `.env.local` to version control
- Add `.env.local` to `.gitignore` if not already there
- Rotate API keys periodically
- Use environment-specific keys (sandbox vs production)