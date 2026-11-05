# BUY IN BALES — marketplace redesign plan

> **Status: Owner-approved implementation direction.** The buyer-facing fixed-return path uses a 50% return on the bale investment plus principal: ₦100,000 invested means ₦150,000 total payout. The new flow excludes the former 60/40 option while retaining historical records. The buyer-selection interaction below is the working assumption; live publication remains a separate opt-in after Preview.

## Product and workflow

Rebuild the existing site as a bale marketplace. The root page `/` becomes the first step in shopping, not the previous story-led landing page. At the top, show **Marketplace**, **Retailer registration**, **Supplier registration**, sign-in, and a visible cart. The first screen explains the next action and shows available, real bale listings with seller, price, stock/location, and an **Add to cart** action. Include a prominent hero picture of a warehouse with clothing bales neatly arranged. Show only real published stock; do not seed false listings, seller identities, prices, or product photos. Until stock is submitted, show an honest empty state inviting suppliers to publish.

Suppliers register with **company name, physical location, CEO name, and contact info** (business email and phone/WhatsApp); suppliers can publish bales at their own prices immediately. Listing fields include bale title/type, grade/description, actual product photo, available stock, NGN price, fulfilment location, and availability. Suppliers can update price and stock; order records retain the price snapshot at checkout.

A buyer can shop as a guest. The cart and checkout collect buyer name, email, phone, and physical delivery/fulfilment location. Checkout persists an order request marked **payment pending**; no payment provider is configured, no money is charged, and the site must not claim an order is paid. A buyer can either buy a bale for their own business or choose the separate **Partner with a retailer** path.

The partner page presents approved retailer choices by **business name and physical store location only**—the working assumption is that a buyer chooses a specific eligible retailer. The buyer selects the fixed-return arrangement, set at **50% of the amount invested in that bale**, in addition to the return of the buyer's capital. Therefore total payout is **150% of the invested amount** (for example, ₦100,000 invested → ₦150,000 total payout). Apply the formula per bale, using the final NGN bale amount recorded in the order; do not add unlisted fees. **Do not offer the 60/40 split in new listings, orders, or partner screens.** Preserve existing historical records without turning them into new offers. A retailer can receive funded bales only after owner/admin approval. The retailer dashboard shows assigned bales, sales/progress updates, and the amount/status of buyer remittance. Record payout completion only after it is explicitly entered as complete.

## Accounts and eligibility

New public registrations are Retailer and Supplier. Email/password remains account sign-in and is separate from business profile data. A retailer's business profile contains exactly **business name, retailer name, physical store location**; do not ask for a retailer phone or other business-profile fields. A supplier's profile contains company name, physical location, CEO name, and business email plus phone/WhatsApp. Reuse the supplier business email as account email instead of asking twice.

New retailer applications start pending and require owner/admin approval before receiving funded bales. Supplier accounts can publish listings immediately. Preserve existing wholesaler account records and the previous performance view for existing users; do not offer Wholesaler on new public signup. The platform's existing server-side admin procedure gates retailer approvals and order administration. Guests can place order requests without creating buyer accounts.

## Implementation approach and project structure

Reuse the current React, Wouter, Express, tRPC, Drizzle, and managed MySQL stack. Keep existing email/password account security and sessions. Additive schema work will support the supplier role/profile status, bale listings, order headers/items with price snapshots, retailer approval/selection, fulfilment state, and remittance records; preserve all existing accounts, progress reports, and historic deals. Development and production share the same database, so do not drop existing tables or write demo orders/users/products.

- `client/src/pages/Home.tsx`: replace the story-led home page with the root marketplace catalogue, filters, availability, product cards, and warehouse-with-neatly-arranged-clothing-bales hero image.
- `client/src/components/SiteShell.tsx` and `client/src/index.css`: implement the compact trade-market bar, distinct Retailer/Supplier entry points, and responsive product-first visual system.
- `client/src/pages/Register.tsx`: Retailer/Supplier role-specific registration with the exact profile fields above.
- New cart, checkout, and partner-with-retailer pages: guest order request, direct-vs-partner path, eligible retailer selection, fixed-return summary, and payment-pending state.
- Supplier/retailer/owner dashboard modules: supplier listings/stock/orders; retailer assigned-bale progress/remittance; owner/admin approval and order administration; preserved legacy wholesaler performance view.
- `server/routers.ts`, `server/portalDb.ts`, `server/_core/portalProcedures.ts`, and `drizzle/schema.ts`: server-validated, role-scoped listing/order/approval/remittance persistence.
- `server/storage.ts`: authorized supplier photo upload using the existing platform storage helper; validate file type and size and store stable `/manus-storage/...` asset paths with the listing record.
- `client/public/manus-routes.json`: declare the final page route set.
- `README.md` and `client/index.html`: update project/product descriptions to match the new fixed-return-only commerce path.

TypeScript diagnostics are host-managed and already registered. Apply additive MySQL migrations only. Use the requested generated warehouse hero image from its exact managed-storage URL; do not seed demo supplier listings, orders, users, or product photos, and do not overwrite shared live business records. Checkpoint the completed code in the Manus-managed repository and sync it to the user's existing public GitHub repository `ARKOG-trade/BUY-IN-BALES-by-Advark`, preserving its current history, original README content, and `settings.html`. Automatic publishing remains off. After Preview, publish only if the owner explicitly instructs us to do so.

## Design direction

Three style candidates: **Warehouse price-board commerce** (0.05); **Global thrift-fashion editorial** (0.03); **Handmade bazaar collage** (0.02). Choose **Warehouse price-board commerce** to keep the next action, stock, price, seller, and fulfilment terms unmistakable.

- **Design Movement:** contemporary wholesale-market catalogue with the tactile character of second-hand fashion.
- **Core Principles:** product first; prices and stock clear; seller and fulfilment terms explicit; next action obvious.
- **Color Philosophy:** bright paper and deep charcoal keep prices legible; forest green signals active stock and verified partners; amber emphasizes cart and purchase actions. Move away from the current persimmon editorial treatment.
- **Layout Paradigm:** a compact high-contrast navigation bar, a market/filter rail, a wide catalogue shelf, and persistent cart/order context on desktop; stack cleanly on mobile.
- **Signature Elements:** bale-tag product labels; stock/price chips; a concise order timeline from “ordered” to “assigned,” “selling,” and “remitted.”
- **Interaction Philosophy:** direct purchase and retailer-backed purchase are separate paths; display the fixed payout equation before the order request; clarify what becomes public.
- **Animation:** brief transitions for cart updates, filters, and status changes; respect reduced-motion preferences; no auto-advancing banners or looping motion.
- **Typography System:** Space Grotesk for catalogue/display headings with DM Sans for body text, labels, and forms.
- **Brand Essence:** a transparent bale marketplace connecting suppliers, local retailers, and buyers; **direct, practical, trustworthy**.
- **Brand Voice:** concise and action-oriented. Examples: “Browse bales. Build your stock.” “Choose your bale. See the payout.”
- **Wordmark & Logo:** retain BUY IN BALES by Advark while adapting its bale-tag lockup for the trade-market design; preserve project logo metadata requirements.
- **Signature Brand Color:** deep forest green.

## Remaining release decision

After the owner reviews the redesigned Preview, explicitly ask whether to publish. Automatic publication remains disabled; no live deployment is authorized by this plan alone.
