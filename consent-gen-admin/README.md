# ConsentGen Admin

Internal admin dashboard for ConsentGen. Provides platform-wide analytics and user management for operators.

## What it does

- **Dashboard** — Overview stats: total users, credits issued, forms generated (success/failed), and total revenue
- **Revenue Charts** — Recharts area and bar charts for generation trends and payment data
- **User Management** — Browse registered users (`/users`)
- **Generation Logs** — View all consent generation events (`/generations`)
- **Payment Records** — Track Razorpay transactions (`/payments`)
- **Audit Log** — Platform-wide audit trail (`/audit-log`)

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | Supabase (shared with main app) |
| Charts | Recharts |
| Styling | Tailwind CSS v4 |
| React | React 19 |

## Project Structure

```
app/
  page.tsx        # Dashboard with stats + charts
  users/          # User listing
  generations/    # Generation log
  payments/       # Payment records
  audit-log/      # Audit trail
  login/          # Admin login
components/
  Header.tsx
  Sidebar.tsx
  ThemeProvider.tsx
lib/
  supabase/       # Supabase client helpers
```

## Getting Started

This app runs on port **3001** to avoid conflicts with the main app.

```bash
npm install
npm run dev      # → http://localhost:3001
```

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Use the same Supabase project as the main `consent-gen` app.

## Notes

- This is an internal tool — deploy behind auth or restrict access by IP
- No public-facing routes; all pages assume an authenticated admin session
