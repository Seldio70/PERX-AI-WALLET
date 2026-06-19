# PerX AI Wallet

Mobile-first Expo React Native app for an AI-powered employee benefits marketplace.

Adapted to the Perx challenge brief: Albania-first setup, Albanian Lek pricing, provider-created
offers, employee-curated perk selections, employer point wallet cards, challenges, and simulated
payout routing to providers.

## Core Loop

1. Provider signs up and publishes product-style offers with images, descriptions, ALL price, and point price.
2. Employee signs up, browses providers/offers, and selects what should be shown to their employer.
3. Employer logs in and sees wallet cards with points, employee-selected perks, and employee-posted challenges.
4. Employer approves selected perks and the provider sees simulated routed payout.

## Run

```bash
npm install
npm start
```

Optional AI backend:

```bash
cp .env.example .env
npm run server
```

Keep real keys in `.env`. The checked-in `.env.example` intentionally uses placeholders only.

The app now starts from live Supabase data only. If no providers, offers, wallet cards, selections,
or challenges exist, those areas show empty states so you can add your own data.

When the Supabase schema is present, the app attempts to load live companies, users, provider
offers, invites, selection requests, wallet cards, and challenges through `src/lib/perxRepository.ts`.
Provider offer publishing, employee package selection, and employer approval also attempt Supabase
writes while keeping the current mobile session updated.
Employee/provider/employer signup upserts rows in the app `users` table. If a password is entered
and Supabase is configured, the app also attempts Supabase Auth signup/sign-in and stores the
resulting Auth user id in `users.auth_user_id`. The login screen has explicit Log in and Sign up
modes.
Employee-posted challenges also attempt Supabase writes and show up in the employer wallet view.
Provider profiles are first-class marketplace merchants, and employers get a points-priced perks
catalog in addition to their wallet cards.
Selecting a provider now includes that provider's perks in the employee package, and employers can
complete employee-posted challenges to add points to their wallet cards.
Challenge completion attempts to update the challenge status, increment the first employer wallet
card, and insert a `points_ledger` record.
Providers can edit their merchant profile with name, description, category, city, and logo image.
Saving the profile attempts a Supabase upsert and updates the employee marketplace locally.
Approving an employee-selected package attempts to approve the request, spend points from the
first employer wallet card, write a negative `points_ledger` entry, and create paid `redemptions`
for the selected perks.
Approval is guarded by available points in the first wallet card; employers must complete challenges
to earn more points before approving packages they cannot afford.
Offers carry provider profile ids so selection items and redemption rows can route back to the
correct merchant profile.

The SQL file includes permissive demo read/insert/update RLS policies so the Expo app can prototype
with the anon key. Replace these policies before production.

## Supabase

The current Supabase schema is in:

```text
supabase/test-schema.sql
```

Run it in the Supabase SQL Editor to create the schema. It includes:

- `companies`
- `users`
- `provider_profiles`
- `benefits`
- `employer_invites`
- `selection_requests`
- `selection_items`
- `employer_wallet_cards`
- `points_ledger`
- `challenges`
- `redemptions`

After running the SQL, verify the live project from this repo:

```bash
npm run verify:supabase
```

To clear the seeded/demo rows and create the three starter accounts, run:

```bash
npm run setup:accounts
```

The verifier checks every required table and runs a disposable end-to-end write test
for employer, employee, provider, invite, offer, selection, wallet card, and challenge records.
The schema includes uniqueness constraints needed by the seed script, such as company name,
provider business name, invite code, wallet card title per employer, and offer title per provider.
It also includes an optional `auth_user_id` bridge for future Supabase Auth, nonnegative checks for
budgets/prices/points, duplicate protection for selected perks and QR codes, and indexes for the
core mobile queries: provider discovery, employer approval queues, wallet cards, challenges, and
provider redemption stats.

If you already ran an older version of the schema and want to keep the current demo rows, run this
patch file in the Supabase SQL Editor instead of dropping everything:

```text
supabase/upgrade-schema.sql
```

To remove all demo tables later, run:

```text
supabase/drop-test-schema.sql
```

## Product Notes

Research notes and feature ideas from Perks at Work and Fringe are in:

```text
docs/feature-ideas.md
```
