You are an expert UI/UX designer and frontend developer. Design a complete, visually breathtaking, dark‑theme dashboard for **ResilientRoute – AI‑Powered Supply Chain Disruption Preemption & Dynamic Rerouting for Indian Ocean Trade**.

The dashboard MUST be centered on India and South Asia. Do NOT use Shanghai, New York, Rotterdam or any non‑Indian ports. Use ONLY these locations in the map, routes, and data:

**Indian Ports & Hubs:**
Mumbai (JNPT), Nhava Sheva, Mundra, Kandla, Pipavav, Hazira, Chennai, Ennore, Visakhapatnam, Kolkata (Syama Prasad Mookerjee Port), Haldia, Paradip, Kochi, New Mangalore, Tuticorin (V.O. Chidambaranar), Goa (Mormugao), Krishnapatnam, Dhamra.

**Inland Logistics Hubs / ICDs:**
Delhi (Tughlakabad), Bengaluru (Whitefield), Hyderabad, Ahmedabad, Pune, Nagpur, Lucknow, Guwahati.

**Neighbouring International Nodes (for multi‑modal routes):**
Colombo (Sri Lanka), Chittagong (Bangladesh), Karachi (Pakistan), Dubai (Jebel Ali), Singapore, Port Klang (Malaysia), Salalah (Oman).

**Trade Lanes to Visualise:**
- Mumbai – Colombo – Singapore (sea)
- Mundra – Dubai (sea)
- Kolkata – Chittagong (river/sea)
- Chennai – Singapore (sea)
- Kochi – Salalah (sea)
- Delhi (ICD) – Mumbai (port) – Dubai (multi‑modal rail+sea)
- Visakhapatnam – Kolkata (coastal shipping)
- Bengaluru (ICD) – Chennai (port) – Singapore (rail+sea)

---

## Dashboard Pages & Components

### 1. Main Map View (Hero)
- Full‑screen interactive map using Google Maps dark‑mode style centered on India (lat 20.5, lng 79).
- Shipment icons (small cargo ships/trucks) moving along real routes. Animate them smoothly.
- **Lane risk ribbons**: each trade lane shown as a glowing strip with:
  - Green (< 20% disruption risk)
  - Amber (20‑60%)
  - Red (> 60%)
  - Pulse animation on high‑risk lanes.
- On map load, auto‑focus on a problematic lane, e.g., “Mumbai – Colombo” with red ribbon and a cyclone symbol approaching.

### 2. Shipment Detail Sliding Panel (opens from right when a shipment icon is clicked)
- Header: Shipment ID, Origin → Destination, Current Status.
- **ETA Probability Curve**: a bell chart showing current delivery date distribution (peaked at April 28) vs. a new distribution if rerouted (peaked earlier with lower variance).
- **Alternative Routes Comparison**: three cards side‑by‑side (Current Route, Fastest Alternative, Greenest Alternative). Each card shows:
  - Map thumbnail of the route.
  - Mode icons (ship, rail, truck).
  - Metrics: Total Cost (₹), Transit Time (days), Carbon (kg CO₂), Risk (%).
  - Highlight the recommended alternative with a subtle glow and a “Gemini’s pick” badge.
- **AI Explainability Block**: styled as a chat bubble from “ResilientRoute AI (Gemini)”. Text example: *“Cyclone Mandous near Colombo is 85% likely to close the port for 48h. Rerouting via Kochi–Salalah avoids the storm and saves ₹18L in potential delay penalties, adding only ₹1.2L to freight cost.”*

### 3. One‑Click Approve Reroute
- A prominent “Approve Reroute” button at the bottom of the panel.
- On click, show a quick animation: the map route snaps to the new path, confetti bursts (use subtle ‘rangoli’‑style particles to give an Indian flavor), and a confirmation toast: “Shipment AMZ‑4501 rerouted via Kochi. New ETA: April 26 ± 0.8 days.”

### 4. “What‑If” Sandbox (Critical for Wow Factor)
- A floating action button (icon: magic wand) that activates **What‑If Mode**.
- In this mode, a toolbar appears with draggable disruption tokens: Cyclone, Port Strike, Bridge Collapse, Customs Hold.
- The user can drag a Cyclone token onto the Bay of Bengal near Visakhapatnam. Instantly:
  - All lanes passing through that area recalculate risk (turn red).
  - Affected shipment icons bounce or glow.
  - A counter shows: “14 shipments at risk”.
  - The AI automatically suggests reroutes for the top 3 high‑value shipments, displayed in a summary bar at the bottom.
- Undo button to reset the scenario.

### 5. Top Bar & KPI Cards
- Top bar: ResilientRoute logo, date/time, overall supply‑chain health score (0‑100), number of active disruptions.
- Three KPI cards below the top bar:
  - **Disruptions Preempted** (e.g., 23 today)
  - **Cost Saved** (₹1.42 Cr)
  - **Carbon Avoided** (1,280 tonnes CO₂)
- Use Indian numbering (Lakhs, Crores) and locale‑appropriate currency formatting (₹).

### 6. Shipment List Sidebar (left, collapsible)
- Sortable table of active shipments with columns: ID, Origin, Destination, Risk Level (colored dot), Current ETA, Next Action (e.g., “Reroute Recommended”).
- Click a row to jump to that shipment on the map.

---

## Visual Style
- **Theme**: Dark futuristic with subtle Indian accent colors (saffron #FF9933, green #138808, white #FFFFFF for text).
- **Typography**: Clean sans‑serif (like Inter or Plus Jakarta Sans).
- **Animations**: Framer Motion‑style smooth transitions; map markers pulse gently; lane ribbons animate flow direction.
- **Responsive**: Design for 1440px width (laptop/projector), but also show how it adapts to tablet for on‑the‑go logistics managers.

---

## Data & Backend Notes (for integration context)
- The design should feel real: use realistic shipment IDs, Indian company names (e.g., “Reliance SCM”, “Tata Logistics”), and actual port names.
- All map interactions should be clickable/hoverable with tooltips showing risk percentages, congestion indices, and weather alerts.

---

Generate the Figma design as a fully linked prototype, with interactive components for the What‑If sandbox, shipment panel, and approve flow. If you also generate code, produce a React app with Google Maps JavaScript API, Material‑UI, Recharts, and Framer Motion.

---

**End of prompt.**