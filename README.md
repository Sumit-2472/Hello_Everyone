# Amazon ReLife 🔄

> AI-Powered Circular Commerce Ecosystem

**Prevent unnecessary returns, intelligently process unavoidable returns, and ensure every product finds its next best owner.**

---

## Architecture

```
amazon-relife/
├── frontend/                    # React + Tailwind + Redux Toolkit
└── backend/
    ├── auth-service/            # Authentication & Authorization (Port 4001)
    ├── return-service/          # Return Prevention Engine (Port 4002)
    ├── passport-service/        # AI Product Passport (Port 4003)
    ├── routing-service/         # Intelligent Routing + Recovery Optimizer (Port 4004)
    └── marketplace-service/     # Second Life Marketplace + Green Credits (Port 4005)
```

## Modules

| Module | Service | Description |
|--------|---------|-------------|
| Return Prevention Engine | `return-service` | ML-based return risk prediction, size advisor, compatibility checker |
| Universal Product Passport | `passport-service` | AI grading via Gemini Vision — health score, cosmetic/functional grade |
| Intelligent Routing Engine | `routing-service` | Routes products to Resell / Refurbish / Donate / Recycle / Exchange |
| Recovery Value Optimizer | `routing-service` | Maximizes recovery value across all disposal routes |
| Second Life Marketplace | `marketplace-service` | AI-verified listings with Trust Cards + recommendation engine |
| Green Credit System | `marketplace-service` | Credits for sustainable actions, redeemable for discounts/cashback |
| Sustainability Dashboard | `frontend` | CO₂ saved, waste prevented, products reused, credits earned |

## Tech Stack

- **Frontend**: React, Tailwind CSS, Redux Toolkit
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Storage**: AWS S3
- **AI**: Google Gemini API (Vision + Pro)

## Quick Start

```bash
# Install all dependencies
npm install

# Start all services + frontend
npm run dev

# Start individual services
npm run dev:frontend
npm run dev:auth
npm run dev:return
npm run dev:passport
npm run dev:routing
npm run dev:marketplace
```

## Environment Setup

Copy `.env.example` to `.env` in each service directory and fill in your credentials.
