# Mawashi Plus — Saudi livestock store

Next.js 15 (App Router, TypeScript, Tailwind) + Supabase (Postgres, Auth, Storage, RLS).
Arabic (RTL) by default with full English. Home delivery only.

- **Live:** https://mawashi-plus-store.vercel.app — admin: https://mawashi-plus-store.vercel.app/admin
- **Vercel project:** `mawashi-plus-store` · **Supabase project:** `saudi-livestock-store` (ref `rscnzcalnnzmgzpsppud`)

## Admin access
Register on the store with the owner email configured in `private.config` (`owner_email`). Once the
email is verified, the account is granted the `owner` role automatically. Owners grant `admin`/`staff`
to other registered users from **/admin/staff**. `/admin` requires login and a role; customers get 403.

## Architecture
- All prices, discounts, VAT, delivery fees and stock are computed and enforced **in Postgres**
  (`private.compute_pricing`, `public.place_order`) — the browser total is only a preview.
- Atomic stock: product rows are locked `FOR UPDATE`; individually identified animals are reserved per order.
- Orders are idempotent (`idempotency_key`), rate limited, and every status change is logged.
- Payments are only marked paid by `svc_confirm_payment`, called server-side after re-fetching the
  payment from the provider API (never from a browser redirect). Webhook events are de-duplicated.
- Invoices/credit notes are numbered sequentially; a ZATCA Phase-1 TLV QR is generated when the store
  has a VAT number. ZATCA Phase-2 (Fatoora API) is **not** integrated yet.

## Environment variables
See `.env.example`. Public: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`.
Server-only secrets are set in Vercel → Project → Settings → Environment Variables (type *Sensitive*).

`INTERNAL_RPC_SECRET` (needed for online payments / webhooks / notification dispatch):
```bash
openssl rand -hex 32
```
Put the value in Vercel, then store its SHA-256 in Supabase (SQL editor):
```sql
insert into private.config(key, value)
values ('server_secret_sha256', encode(extensions.digest('PASTE_SECRET_HERE', 'sha256'), 'hex'))
on conflict (key) do update set value = excluded.value;
```

## Deploy
Production deploys are created from GitHub with the Vercel project above. After connecting GitHub
in Vercel (Account → Authentication → GitHub) and linking the repo, every push to the production
branch deploys automatically.

## Local development
```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```
