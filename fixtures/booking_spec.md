# Feature Spec — Property Booking & Scheduling

## Summary

Tenants browsing properties on TRP today must individually request showings on each property and then exchange messages with the listing agent or rental specialist to find a working time. This is high-friction: a tenant comparing five units may spend two days coordinating viewings before they can see any of them. Listing agents and rental specialists also lose hours per week to scheduling overhead.

This feature replaces that flow with a cart-and-checkout model. The tenant adds properties to a "viewing cart," picks a candidate day, and the system generates a feasible viewing schedule that respects each property's availability, the assigned agent's calendar, and realistic travel time across Toronto. The tenant reviews and confirms in one step.

## Stakeholders

- **Tenant** — the primary actor. Wants to view multiple properties efficiently in one outing.
- **Rental specialist** — TRP-employed agent who chaperones tenant viewings. Has a working calendar; can be assigned to multiple tenants per day.
- **Listing agent** — the property's listing-side agent (often external to TRP). Sets per-property viewing windows.
- **System** — generates the schedule, surfaces conflicts, sends confirmations.

## Flows

### 1. Browse and add to cart

1. Tenant opens the property browse view (existing surface, lightly modified).
2. On each property card, an "Add to viewings" button is shown.
3. Adding a property opens a sticky bottom bar showing cart count and a "View cart" button.
4. The cart persists across navigation (localStorage in prototype).

### 2. Cart review and date selection

1. Tenant opens the cart and sees each property they've added (address, neighborhood, price, primary photo).
2. Tenant can remove individual properties.
3. Tenant picks a candidate viewing date from a calendar (today + 14 days).
4. Tenant clicks "Generate schedule".

### 3. Schedule generation

1. The system computes a candidate ordering of viewings that:
   - respects each property's listing-agent availability windows on the chosen date,
   - leaves realistic travel time between properties (use straight-line distance + 1.5x buffer for Toronto traffic — fake math is fine in the prototype),
   - assigns a single rental specialist for the full outing,
   - stays within a 4-hour total window if possible.
2. The system shows the proposed schedule.

### 4. Schedule review

1. Tenant sees an ordered list: time, address, agent, travel time to next.
2. Tenant can drag to reorder, remove a property, or pick a different date (which restarts step 3).
3. If a property cannot fit, it's surfaced separately with the reason ("agent unavailable until 4pm" / "too far from previous stop").

### 5. Confirmation

1. Tenant clicks "Confirm bookings".
2. System shows a confirmation screen with the full schedule and a calendar export link (fake `.ics` download in prototype).
3. Tenant returns to a "My viewings" page that lists upcoming outings.

## Edge Cases

1. Cart is empty when the tenant opens it.
2. All properties on the cart have the same listing agent (no conflict possible — schedule is trivial).
3. No agent has any availability on the chosen date — show empty-state with a "pick another day" CTA.
4. One property cannot fit the schedule (travel time, agent gap, viewing-window conflict).
5. Multiple properties cannot fit — system shows the best-effort schedule plus an "excluded" list.
6. Tenant changes the date after a schedule is already generated.
7. Two properties are at the same address (different units in one building) — group them as one stop.
8. Tenant tries to confirm a schedule containing a now-stale property (listing went off-market between schedule generation and confirmation).

## Data Requirements

- **Properties** — id, address, neighborhood, photo URL, monthly rent in CAD, beds, baths, listing agent id, viewing windows for the next 14 days.
  - Use real Toronto neighborhoods: Queen West, Liberty Village, The Annex, Riverdale, Leslieville, Yonge & Eglinton, Junction Triangle, Cabbagetown.
  - Rents in the $2,200–$4,500 range for 1–3 bed units.
- **Agents** — id, name, role (rental specialist | listing agent), working windows for the next 14 days, photo (optional).
  - At least 4 rental specialists and 8 listing agents.
- **Schedules** — id, tenant id, date, ordered list of stops (each with property id, agent id, start time, duration), excluded properties with reason.

## Screens

| Name | Route | States |
|---|---|---|
| Browse | `/` | default, loading, empty (no properties) |
| Property Detail | `/properties/:id` | default, in-cart, off-market |
| Cart | `/cart` | empty, has-items, date-selected, no-availability |
| Schedule Review | `/schedule/:id` | default, has-conflicts, all-excluded, stale-property |
| Confirmation | `/confirmation/:id` | default |
| My Viewings | `/viewings` | empty, has-upcoming, has-past |

Every page has a top nav with: TRP logo, "Browse", "Cart" (with badge count), "My viewings".

## Open Questions

- Does the prototype need a "tenant signed-in" affordance (avatar, name) or can it be implicit?
- Should rejected/excluded properties stay in the cart for a future date, or get dropped automatically?
- For Phase 1, do we need to model brokerage admin oversight at all, or is that purely Phase 2?
- How aggressive should the schedule's travel-time buffer be? 1.5x straight-line is a placeholder — confirm with the rental ops team.
