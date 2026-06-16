# MarginalBridge

Premium B2B SaaS MVP for cross-border dropshipping sellers. Protects net profit margins with real-time customs duties, freight costs, marketplace commissions, and automated buybox repricing.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Lucide React**

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the landing page links to `/dashboard`.

## Core Features

### Dynamic Cost Matrix

```
Total Cost = Base Cost + Customs Tax + Shipping + Marketplace Commission
```

- USD/TRY exchange rate: **33** (fixed)
- Customs: category-based (e.g. Electronics 20%, Cosmetics 40%)
- Shipping: **$5 USD per desi**

### Price Warrior (Buybox Repricer)

- Minimum profit margin floor: **15%**
- Auto-lowers price to **1 TL below competitor** when margin allows
- Locks price and flags **Loss Prevented** when competitor would force sub-threshold pricing

## API

`POST /api/marginal-bot`

```json
{
  "productCostUsd": 28.5,
  "weightDesi": 1.2,
  "category": "Electronics",
  "marketplace": "Trendyol",
  "currentPriceTl": 1900,
  "competitorPriceTl": 1850
}
```

`GET /api/marginal-bot` returns API documentation.
