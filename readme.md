# Above & Beyond Savannah — Premium V2

Open `index.html` for the full website preview. Includes six static pages.

## Local development

Run `npm install`, then `npm run dev` from this directory. Open
`http://127.0.0.1:5173/` and leave the terminal running. CSS updates in place;
HTML, JavaScript and JSON changes reload the page automatically after saving.
Use this address instead of Live Server's port 5500 for Vite hot updates.

## Improvements
- Responsive readability and touch target pass, visible keyboard focus and reduced-motion support.
- Accessible fleet filter buttons with `aria-pressed` state.
- Explicit illustrative-image warnings for fleet; do not imply generic art depicts owned vehicles.
- Reservation page links to the company’s existing official booking page. Email composer remains for inquiries, never implies a reservation is confirmed.
- Improved mobile navigation Escape-key dismissal and source metadata.

## Production blockers
- The ZIP does **not** contain verified vehicle photography. Replace SVGs with licensed photos of vehicles in the actual fleet once supplied.
- Forms do not submit to a backend. Connect to an approved reservation/CRM service and test before deploying.
- Verify company details, published amenities, and photography licensing with the owner.
- Full cross-browser/device and live booking tests still required.

This is an independent redesign preview, not the currently deployed site.
