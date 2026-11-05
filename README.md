# BUY-IN-BALES-by-Advark
this is a website designed for  BUY IN BALES. An advark subsidiary. Advark has full control.

## Existing live deployment

[BUY IN BALES by Advark](https://buyinbales-k6cyigpr.manus.space) is the current live deployment. The marketplace redesign is being prepared in Preview; it is not published automatically.

## Project overview

BUY IN BALES by Advark is a marketplace for okrika bales, connecting suppliers, local retailers, thrifters, and buyers. The marketplace flow is designed to show real supplier listings and NGN prices, support guest order requests, and offer a retailer-backed fixed-return option.

## Business workflow

- The first page is the bale marketplace, with published stock, prices, seller/location details, and Add to cart.
- Retailer and supplier registration are separate. Retailers provide business name, retailer name, and physical store location, then wait for approval before receiving funded bales. Suppliers provide company name, physical location, CEO name, and business contact details, then publish their own listings and prices.
- Guest checkout records an NGN order request as payment pending. The initial implementation does not charge money or collect card/bank credentials.
- Under the retailer-backed fixed-return option, the buyer's capital is returned plus a 50% return on the bale investment. That is a 150% total payout; for example, NGN 100,000 invested means NGN 150,000 total payout. The new flow does not offer a 60/40 split. Existing historical records are preserved.
- Retailers record bale sales/progress and buyer remittances. Existing wholesaler accounts and performance views remain available to their current users.

## Development

The web app uses React, Express, tRPC, Drizzle, and the managed MySQL database.

```sh
pnpm dev
pnpm check
pnpm test
pnpm build
```

The dev server honors `PORT` and defaults to `3000`. Apply reviewed, additive migrations with the repository's migration workflow. The website's static route declaration lives at `client/public/manus-routes.json`.

Do not seed fake listings or write test accounts/orders: development and production share the managed database. Supplier photos are stored in project storage and indexed in the database; large media does not belong in Git.
