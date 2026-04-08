# TechFinder Pro

A meta-search engine for technology products that compares prices across eBay, Amazon, and Google Shopping. Built with Next.js, Supabase, Redis, and Resend.

## Features

- **Multi-source product search** - Search products across eBay, Amazon, and Google Shopping simultaneously
- **Price comparison table** - View all prices side-by-side with source links
- **Price history tracking** - Track price changes over time for each product
- **User authentication** - Secure sign up and login with NextAuth.js
- **Price alerts** - Get email notifications when prices drop below your target
- **Favorites & search history** - Save favorite products and track your searches
- **Dark mode with mint branding** - Sleek dark theme with mint green accents

## Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 14 (App Router), React 18 |
| Backend | Next.js API Routes (BFF pattern) |
| Database | Supabase (PostgreSQL) |
| Cache | Upstash Redis |
| Auth | NextAuth.js with Supabase credentials |
| Email | Resend |
| Testing | Vitest |
| E2E | Playwright |
| Styling | CSS Modules |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Upstash account (Redis)
- Resend account (email)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/techfinder-pro.git
cd techfinder-pro

# Install dependencies
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Supabase (Database & Auth)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# NextAuth.js
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_min_32_chars

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token

# Resend (Email)
RESEND_API_KEY=re_your_resend_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Cron Job (for price alerts)
CRON_SECRET=your_cron_secret_min_32_chars
```

### Database Setup

1. Create a new Supabase project
2. Run the following SQL to create tables:

```sql
-- Users profile extension
create table profiles (
  id uuid references auth.users not null primary key,
  email text,
  created_at timestamptz default now()
);

-- Products table
create table products (
  id uuid default gen_random_uuid() primary key,
  source text not null,
  source_id text not null,
  title text not null,
  price numeric not null,
  currency text default 'USD',
  url text not null,
  image_url text,
  created_at timestamptz default now(),
  unique(source, source_id)
);

-- Price history
create table price_history (
  id uuid default gen_random_uuid() primary key,
  product_id uuid references products(id) on delete cascade,
  price numeric not null,
  recorded_at timestamptz default now()
);

-- Alerts
create table alerts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  product_id uuid references products(id) on delete cascade,
  target_price numeric not null,
  is_active boolean default true,
  created_at timestamptz default now(),
  last_notified_at timestamptz
);

-- Favorites
create table favorites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  product_id uuid references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Search history
create table search_history (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  query text not null,
  created_at timestamptz default now()
);
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   │   ├── login/        # Login page
│   │   └── register/     # Registration page
│   ├── (main)/           # Main application routes
│   │   ├── search/       # Search page
│   │   └── dashboard/    # User dashboard
│   ├── api/              # API routes
│   │   ├── search/       # Product search endpoint
│   │   ├── alerts/       # Price alerts CRUD
│   │   ├── cron/         # Cron job for checking alerts
│   │   └── auth/         # NextAuth.js routes
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   ├── search/           # Search-related components
│   │   ├── SearchBar.tsx
│   │   ├── ResultsTable.tsx
│   │   └── FilterPanel.tsx
│   ├── product/          # Product display components
│   │   ├── ProductCard.tsx
│   │   ├── PriceComparison.tsx
│   │   └── PriceHistory.tsx
│   └── dashboard/        # Dashboard components
│       ├── DashboardLayout.tsx
│       └── StatsCards.tsx
├── hooks/                # Custom React hooks
│   ├── useAuth.ts
│   ├── useSearch.ts
│   └── useAlerts.ts
├── lib/                   # Business logic
│   ├── api/              # External API clients
│   │   ├── ebay.ts
│   │   ├── amazon.ts
│   │   └── google-shopping.ts
│   ├── aggregator.ts     # Product search aggregation
│   ├── alerts.ts         # Price alert logic
│   ├── cache.ts          # Redis caching
│   ├── auth.ts           # NextAuth configuration
│   └── supabase.ts       # Supabase client
├── styles/                # Global styles
│   ├── globals.css
│   └── variables.css
└── types/                 # TypeScript type definitions
    └── index.ts
```

## API Documentation

### Search Products

```http
GET /api/search?q=query
```

Search for products across all configured sources.

**Parameters:**
| Name | Type | Description |
|------|------|-------------|
| q | string | Search query (required, max 200 chars) |

**Response:**
```json
{
  "products": [
    {
      "id": "uuid",
      "source": "amazon",
      "title": "Product Title",
      "price": 99.99,
      "currency": "USD",
      "url": "https://...",
      "image_url": "https://..."
    }
  ]
}
```

### Manage Alerts

```http
GET /api/alerts
```

Get all alerts for the authenticated user.

**Headers:** Requires authentication via NextAuth.js session.

---

```http
POST /api/alerts
```

Create a new price alert.

**Headers:** Requires authentication.

**Body:**
```json
{
  "productId": "uuid",
  "targetPrice": 79.99
}
```

**Response:**
```json
{
  "alert": {
    "id": "uuid",
    "product_id": "uuid",
    "target_price": 79.99,
    "is_active": true
  }
}
```

---

```http
DELETE /api/alerts?id=alert-id
```

Delete an alert. Requires authentication.

### Cron Job - Check Alerts

```http
GET /api/cron/check-alerts
```

Checks all active alerts and sends email notifications when prices drop below target.

**Headers:**
```
Authorization: Bearer your_cron_secret
```

**Response:**
```json
{
  "processed": 50,
  "triggered": 3,
  "errors": []
}
```

> **Note:** This endpoint should be protected by a secret and called via a scheduler (e.g., Vercel Cron, GitHub Actions) at regular intervals.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run test` | Run unit tests (Vitest) |
| `npm run test:ui` | Run tests with UI |
| `npm run test:e2e` | Run E2E tests (Playwright) |

## Testing

### Unit Tests

```bash
npm run test
```

### E2E Tests

```bash
npm run test:e2e
```

## License

MIT
