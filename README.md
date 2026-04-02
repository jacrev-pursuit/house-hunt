# North Fork House Hunt

A mobile-first PWA for house hunting on the North Fork of Long Island. Parents independently rank priorities, score houses, and track tours. Family members get a read-only view.

## Getting Started

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) on your phone or browser.

## Accounts

| Name   | Passcode     | Role   |
|--------|-------------|--------|
| Mom    | northfork1  | Parent |
| Dad    | northfork2  | Parent |
| Family | viewer      | Viewer |

## Features

- **Priority ranking** — each parent stack-ranks must-haves and nice-to-haves
- **House management** — add properties via listing URL (auto-fills from Zillow/Redfin/Realtor.com) or manually
- **Scoring engine** — weighted scores based on priority rankings, dealbreaker warnings for unmet must-haves
- **Tour schedule** — track upcoming, visited, and passed properties
- **Photo uploads** — capture tour photos from your phone
- **Side-by-side comparison** — compare up to 3 houses
- **Family view** — read-only access for family members to follow along

## Tech Stack

- Next.js 16 (App Router)
- Prisma + SQLite
- Tailwind CSS v4
- PWA (add to home screen)
