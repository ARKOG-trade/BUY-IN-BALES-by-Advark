# BUY-IN-BALES-by-Advark
this is a website designed for  BUY IN BALES. An advark subsidiary. Advark has full control.

## Live site

[BUY IN BALES by Advark](https://buyinbales-k6cyigpr.manus.space)

## Project overview

A bale-to-business portal for okrika retailers, bale buyers, wholesalers and sourcing partners.

## What’s included

- Public landing page explaining self-operated bale purchases and the two retailer deal structures: agreed fixed return, or a 40% buyer / 60% retailer profit split.
- Email/password retailer and wholesaler registration and sign-in. Passwords are scrypt-hashed; sessions use random opaque tokens stored by hash and HttpOnly cookies.
- Retailer dashboard for bale records, sales, expense and item-count progress updates.
- Wholesaler dashboard showing performance only for retailers who opt in to share it; private account details are not exposed.
- Supplier/retailer partnership enquiry form plus a member-only direct-contact directory. Businesses must explicitly opt in before their contact card is listed.
- Drizzle/MySQL schema and migrations for accounts, sessions, bale deals, progress reports and partnership enquiries.

## Develop

The web app uses React, Express, tRPC and Drizzle.

```sh
pnpm dev
pnpm check
pnpm test
pnpm build
```

The dev server honors `PORT` and defaults to `3000`. The platform supplies the managed MySQL `DATABASE_URL`; apply checked-in migrations with `pnpm db:migrate`. The website’s static route declaration lives at `client/public/manus-routes.json`.

Amounts in the current portal are recorded and displayed in Nigerian naira (NGN). Retailer performance and supplier-directory contact visibility are opt-in. Do not enter test accounts or test business activity in the shared managed database.
