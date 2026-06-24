# SIDRAT MVP Backlog

## Epic 1. Foundation
- Lock the MVP data model around `User`, `ProductFamily`, `ProductVariant`, `GroupBuyingSession`, `Participation`, `Order`, `Wallet`, and `WithdrawalRequest`.
- Replace the old mixed feature set with a single marketplace flow: catalog -> session -> slot -> payment -> wallet -> order.
- Seed local demo data for buyer, seller, admin, products, and active sessions.

## Epic 2. Catalog and Product Families
- Show product family cards in the catalog.
- Add product detail pages with allowed variants, GB rules, and active sessions.
- Surface current slot price, savings, and slot capacity.

## Epic 3. Group Buying Sessions
- Create public and invite-link sessions.
- Allow users and sellers to create sessions with snapshot pricing rules.
- Allow users to join a session by choosing an allowed size/color variant.
- Show slot progress, participants, and price ladder.

## Epic 4. Wallet and Payments
- Charge the slot at join time.
- Track price deltas in the internal wallet.
- Allow wallet spend on other products.
- Allow withdrawal with fee and admin approval flow.

## Epic 5. Orders and Fulfillment
- Create an order from a paid participation.
- Track order status through fulfillment.
- Expose order history in the profile page.

## Epic 6. Roles and Panels
- Add buyer profile, seller panel, and admin panel views.
- Let the seller manage product families, variants, and session parameters.
- Let the admin edit deadlines and resolve conflicts.

## Epic 7. MVP Hardening
- Add explicit empty states and error states.
- Keep active session parameters frozen with a snapshot.
- Verify the app runs locally and builds cleanly.
