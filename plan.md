# BUY IN BALES — implementation plan

## Product scope

Build a public-facing website and data-backed business portal for BUY IN BALES by Advark, selling bales of okrika to retailers and thrifters.

- Visitors can understand the option to buy a bale for their own business or purchase one for a retailer to sell on their behalf.
- The retailer pathway explains both deal structures: (1) return the bale buyer’s capital plus a fixed profit percentage agreed before the bale is assigned; (2) share profit 40% to the bale buyer and 60% to the retailer. The fixed rate is captured per bale arrangement instead of inventing a company-wide rate.
- Retailers and wholesalers can register with business details and role using email/password accounts, without requiring a Manus account. Retailers get a progress view and can report bale sales and proceeds. Wholesalers can compare retailer performance reported by retailers who opt in to sharing.
- Suppliers in China and London and local retailers can find one another through a registered-member partnership directory. Directory participants choose to list their business and contact details; only listed businesses appear, and their details are visible only to signed-in portal members. A separate enquiry form records interest without implying any existing supplier partnership.
- Persist registrations, sessions, bale arrangements, reports, partnership enquiries and opt-in directory listings in the project’s managed MySQL database through the existing Express/tRPC/Drizzle stack.
- Publish the completed site publicly as the requested working website, with automatic publishing left off.
- Save the finished application to the user’s existing public repository `ARKOG-trade/BUY-IN-BALES-by-Advark`, preserving its initial commit and original README. Keep the Manus-managed repository canonical; do not create a duplicate repository or change GitHub visibility.

## Implementation approach

Keep the existing React/Express/tRPC/Drizzle starter. Implement public routes for `/`, `/register`, `/partners`, `/login`, and `/dashboard`; the dashboard and member directory remain behind authenticated, role-aware server procedures. Extend `drizzle/schema.ts` with portal account/session, bale-deal, progress-report, and partnership-enquiry records; add matching Drizzle query helpers and tRPC/HTTP procedures with server-side validation and authorization. Implement email/password registration and sign-in with securely hashed passwords, expiring opaque sessions, HttpOnly cookies, and role checks. Use the existing OAuth modules only if needed for project infrastructure; portal access itself will not require a Manus account. Retailer views are scoped to the logged-in retailer; wholesaler summaries aggregate only retailers who opted into sharing and omit private contact details. Directory listings expose contact details only after explicit opt-in and only to signed-in members. Do not use test writes to the shared managed database.

## Project structure

- `client/src/pages/Home.tsx`: public landing page and model explanations.
- `client/src/pages/Register.tsx`: role selection and retailer/wholesaler registration.
- `client/src/pages/Login.tsx`: email/password sign-in.
- `client/src/pages/Partners.tsx`: China/London sourcing and local-retail connection directory, plus partnership enquiry form.
- `client/src/pages/Dashboard.tsx`: role-aware retailer progress or wholesaler performance overview.
- `client/src/components/`: responsive navigation, benefit/model cards, dashboard metrics, forms and shared UI.
- `client/src/App.tsx`, `client/src/index.css`, `client/index.html`: route wiring, visual system and site metadata.
- `drizzle/schema.ts` and `drizzle/`: durable application records and additive database migrations.
- `server/db.ts`: existing database connection; `server/portalDb.ts`: portal data-access functions.
- `server/routers.ts`, `server/portalAuth.ts`, `server/_core/context.ts`, `server/_core/portalProcedures.ts`: validated account/session logic, role-aware procedures and member directory authorization.
- `client/public/manus-routes.json`: page-route manifest served from the origin.

## Design direction

Three sampled style alternatives: Contemporary African-commerce editorial (0.04); clean warehouse ledger (0.03); retro thrift-zine collage (0.02). Choose **Contemporary African-commerce editorial**.

- **Design Movement:** contemporary African fashion-commerce editorial, informed by premium independent retail rather than generic SaaS dashboards.
- **Core Principles:** tactile and human; commercial details easy to compare; confident but not flashy; mobile-first legibility.
- **Color Philosophy:** warm paper and ink make the business feel grounded; a vivid persimmon signal color brings energy and draws attention to deal terms and actions; muted olive supports trust and progress states.
- **Layout Paradigm:** asymmetrical editorial hero with image and headline, offset comparison cards for the two deal models, a horizontal process strip, then role-specific portal panels; avoid a uniform centered-card grid.
- **Signature Elements:** bale-label number chips; stitched/rule-line dividers; large condensed display headlines paired with a calm text face.
- **Interaction Philosophy:** show plain-language economics before asking for action; make role and deal choices explicit; save and confirm forms with clear status feedback; make contact sharing opt-in.
- **Animation:** restrained, short fade/slide reveals and button feedback; respect reduced-motion preferences; no perpetual motion.
- **Typography System:** Barlow Condensed for editorial headlines, paired with DM Sans for body copy and dense portal data.
- **Brand Essence:** the practical bale-to-business partner connecting suppliers, bale buyers, and local thrifters; personality: resourceful, candid, assured.
- **Brand Voice:** direct, optimistic, numbers-forward. Example: “A bale in. A business moving.” “Choose your deal. Track every sale.”
- **Wordmark & Logo:** custom text wordmark lockup with a simple bale-tag mark, implemented as editable vector/CSS rather than relying on AI-rendered lettering.
- **Signature Brand Color:** persimmon orange.

## Dependencies and serving

Use installed React, Express, tRPC, Drizzle, MySQL, Wouter, Tailwind, and lucide-react unless implementation proves another dependency is required. The managed backend and database are enabled. Development uses the starter’s `pnpm dev` on configured port 3000; deploy the production container through the configured Dockerfile after checkpointing. Keep the page route manifest synchronized with client routes. Set project logo metadata before checkpointing. Use host-managed TypeScript diagnostics already registered for the project.
