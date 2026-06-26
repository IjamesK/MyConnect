# NetConnect Uganda — ISP Portal Design Guidelines

## Stance: Kinetic-Professional

Clean, data-forward, always in motion. Think Cloudflare's dashboard meets Ubiquiti UISP — every status is live-feeling, every number has weight, every action is obvious. The UI communicates trust and uptime. No playful gradients, no editorial warmth — this is infrastructure software that happens to look excellent.

---

## Typography

- **Display / Headings**: Inter Tight (condensed, weight 700–800) — assertive KPI numbers, screen titles
- **UI / Body**: Inter (weight 400–600) — all readable text, labels, descriptions
- **Mono / Data**: JetBrains Mono — incident IDs, ticket numbers, timestamps, status codes

Load via Google Fonts in `src/styles/fonts.css`.

Apply:
- `font-family: 'Inter', system-ui, sans-serif` — base
- `font-family: 'Inter Tight', system-ui, sans-serif` — display headings
- `font-family: 'JetBrains Mono', monospace` — data labels

---

## Color Palette

### Brand Colors
```
--isp-blue:     #0057B8   /* primary actions, links, nav active */
--isp-blue-dark:#003D82   /* hover states */
--isp-blue-50:  #EBF2FF   /* tints, selected states */
--isp-green:    #16A34A   /* online, operational, success */
--isp-green-50: #F0FDF4   /* green surface tints */
--isp-orange:   #F59E0B   /* partial outage, warning, expiring */
--isp-orange-50:#FFFBEB   /* orange tints */
--isp-red:      #DC2626   /* outage, error, critical */
--isp-red-50:   #FEF2F2   /* red tints */
```

### Neutral Scale
```
--isp-gray-50:  #F8FAFC
--isp-gray-100: #F1F5F9
--isp-gray-200: #E2E8F0
--isp-gray-400: #94A3B8
--isp-gray-600: #475569
--isp-gray-900: #0F172A
```

---

## Design Tokens (src/styles/theme.css)

```css
--background:              #F8FAFC
--foreground:              #0F172A
--card:                    #FFFFFF
--card-foreground:         #0F172A
--primary:                 #0057B8
--primary-foreground:      #FFFFFF
--secondary:               #EBF2FF
--secondary-foreground:    #0057B8
--muted:                   #F1F5F9
--muted-foreground:        #64748B
--accent:                  #0057B8
--accent-foreground:       #FFFFFF
--border:                  #E2E8F0
--ring:                    #0057B8
--radius:                  0.75rem
```

---

## Layout Principles

### Customer Portal (Mobile-First)
- Max width: `max-w-sm` (384px) centered on desktop
- Top bar: 56px with logo + notification bell
- Bottom nav: 60px fixed, 4 tabs (Home, Status, Support, Account)
- Cards: `rounded-xl shadow-sm`, 16px padding
- Section spacing: 16px between cards

### Staff Dashboard (Full-Width)
- Left sidebar: 240px fixed, dark navy `#0F172A`
- KPI cards: 4-column grid desktop, 2-column tablet
- Charts: min-height 240px

---

## Component Patterns

### Status Indicators
- 🟢 Operational: green dot `#16A34A` + "Operational" text `#15803D`
- 🟠 Partial: orange dot `#F59E0B` + "Partial Outage" text `#B45309`
- 🔴 Down: red dot `#DC2626` + "Service Down" text `#B91C1C`
- Active incident dots use CSS pulse animation

### Status Pills
- Investigating: `bg-[#FFFBEB] text-[#B45309]`
- Resolved: `bg-[#F0FDF4] text-[#15803D]`
- Assigned: `bg-[#EBF2FF] text-[#1D4ED8]`
- Critical: `bg-[#FEF2F2] text-[#B91C1C]`

### Cards
- White background, `border border-[#E2E8F0] rounded-xl shadow-sm`
- No gradients on data cards

### Primary Button
- `bg-[#0057B8] text-white rounded-xl` hover `bg-[#003D82]`
- Full-width on mobile

### KPI Numbers (Staff)
- Font: Inter Tight 800, `text-3xl`
- Trend: green ↑ or red ↓ with percentage

---

## Data Realism

Use real Ugandan context:
- Currency: UGX (Ugandan Shillings)
- Areas: Kampala East, Ntinda, Naalya, Kisaasi, Bukoto, Kireka, Entebbe, Mukono
- Mobile money: MTN MoMo (*165#), Airtel Money (*185#)
- Names: James Okello, Patrick Muwanga, Sarah Namukasa
- Packages: Basic 10Mbps UGX 60,000 / Home Premium 20Mbps UGX 120,000 / Ultra 50Mbps UGX 250,000
