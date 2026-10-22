# Vehicle image gallery update (V5)

- 62 original photos extracted from the 28-page fleet catalog PDF embedded attachments.
- 21 photo groups loaded from fleet-manifest.json; covers shown only if website_cover_approved=true.
- Clicking a vehicle card opens a keyboard-accessible gallery with previous/next, thumbnails, and preserved manifest image order.
- Unconfirmed U-prefixed gallery groups remain separately labeled, and never masquerade as a specific numbered vehicle.
- Interior-only groups use a neutral card placeholder, but interiors remain viewable after opening.
- All actual photographic assets live under assets/fleet/; no generated substitutions.
- Data is photographic, not confirmation of present fleet availability.
- No booking/availability functionality introduced.
