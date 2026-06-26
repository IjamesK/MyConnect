# Plan: ISP Customer Portal — High-Fidelity Clickable Prototype

## Context

Build a 14-screen, fully-navigable web prototype for an ISP customer portal using React + Tailwind + shadcn/ui. The prototype tells a single demo story: customer loses internet → checks portal → diagnoses fiber outage via ZTE ONT → sees ETA → gets notifications → avoids calling support. A parallel staff dashboard shows executive KPIs.

No backend. All data is static/mock. Navigation uses React Router 7 (already installed).

---

## Project Stack (confirmed from codebase)

- **Components**: shadcn/ui (49 components in `src/app/components/ui/`)
- **Charts**: recharts 2.15.2
- **Icons**: lucide-react
- **Router**: react-router-dom 7.13.0
- **Animation**: motion/react
- **Theme**: CSS vars in `src/styles/theme.css` — will extend with ISP brand colors

---

## Aesthetic Stance: Kinetic-Professional

Committed stance: Cloudflare/UISP data-forward — clean, status-always-visible, numbers with weight. No gradients on data cards, no editorial warmth. Infrastructure software that looks excellent.

**Fonts** (loaded in `src/styles/fonts.css` via Google Fonts):
- Display: **Inter Tight** 700–800 — KPI numbers, screen titles
- Body: **Inter** 400–600 — all UI text
- Mono: **JetBrains Mono** — incident IDs, ticket #s, timestamps

**Color vars** (added to `src/styles/theme.css`):
```css
--isp-blue: #0057B8;    --isp-blue-dark: #003D82;   --isp-blue-50: #EBF2FF;
--isp-green: #16A34A;   --isp-green-50: #F0FDF4;
--isp-orange: #F59E0B;  --isp-orange-50: #FFFBEB;
--isp-red: #DC2626;     --isp-red-50: #FEF2F2;
```

**Theme tokens** updated in `src/styles/theme.css`:
```css
--background: #F8FAFC;  --foreground: #0F172A;
--card: #FFFFFF;        --primary: #0057B8;
--muted: #F1F5F9;       --muted-foreground: #64748B;
--border: #E2E8F0;      --radius: 0.75rem;
```

---

## File Structure

```
src/app/
├── App.tsx                        ← router setup with all routes
├── components/
│   ├── ui/                        ← existing shadcn/ui (untouched)
│   ├── figma/
│   │   └── ImageWithFallback.tsx  ← existing (untouched)
│   ├── isp/
│   │   ├── Layout.tsx             ← shared mobile shell (status bar, nav)
│   │   ├── StaffLayout.tsx        ← staff sidebar layout
│   │   └── StatusBadge.tsx        ← reusable online/outage/warning badge
│   └── screens/
│       ├── LoginScreen.tsx
│       ├── CustomerDashboard.tsx
│       ├── ServiceStatus.tsx
│       ├── OutageDetails.tsx
│       ├── Troubleshooter.tsx
│       ├── ZTEDiagnostic.tsx
│       ├── DiagnosisResult.tsx
│       ├── SubscriptionPage.tsx
│       ├── RenewalInstructions.tsx
│       ├── TicketTracking.tsx
│       ├── NotificationsCenter.tsx
│       ├── StaffDashboard.tsx
│       ├── OutageManagement.tsx
│       └── AnalyticsDashboard.tsx
```

---

## Routing (App.tsx)

Use `<BrowserRouter>` with `<Routes>`:

| Path | Screen |
|------|--------|
| `/` | LoginScreen |
| `/dashboard` | CustomerDashboard |
| `/service-status` | ServiceStatus |
| `/outage/:id` | OutageDetails |
| `/troubleshoot` | Troubleshooter |
| `/troubleshoot/zte` | ZTEDiagnostic |
| `/troubleshoot/result` | DiagnosisResult |
| `/subscription` | SubscriptionPage |
| `/renewal` | RenewalInstructions |
| `/ticket/:id` | TicketTracking |
| `/notifications` | NotificationsCenter |
| `/staff` | StaffDashboard |
| `/staff/outages` | OutageManagement |
| `/staff/analytics` | AnalyticsDashboard |

---

## Screen Details

### Layout.tsx (shared customer shell)
- Fixed bottom nav: Home, Status, Support, Account (lucide icons)
- Notification bell top-right
- ISP logo top-left ("NetConnect Uganda")
- White background, mobile-width (max-w-sm centered on desktop)

### StaffLayout.tsx
- Left sidebar: Dashboard, Outages, Tickets, Analytics, Settings
- Top bar with "Staff Portal" branding and admin avatar
- Full-width layout

---

### Screen 1: LoginScreen
- Full-screen blue gradient background (#0057B8)
- White card centered
- Company logo (wifi icon + "NetConnect" wordmark)
- "Customer ID / Phone" input
- Password input
- Login button → navigates to `/dashboard`
- "Staff Login" link at bottom → navigates to `/staff`

### Screen 2: CustomerDashboard
- Greeting: "Good Afternoon, James 👋"
- Hero card: Internet Status (🟢 ONLINE, pulsing green dot)
- Package card: "Home Premium 20Mbps · Expires in 14 days"
- Warning banner if days < 15 (yellow, "Renew soon")
- Quick Actions grid (4 buttons): Renew → `/renewal`, Troubleshoot → `/troubleshoot`, Report Issue → `/ticket/3021`, Service Status → `/service-status`
- Recent activity list

### Screen 3: ServiceStatus
- Header with last updated time
- Planned maintenance banner (amber, dismissable)
- Area list with status indicators:
  - 🟢 Kampala East — Operational
  - 🟠 Ntinda — Partial Outage (tappable → `/outage/INC-2026-0045`)
  - 🟢 Naalya — Operational
  - 🟢 Kisaasi — Operational
  - 🟢 Entebbe — Operational
- Summary stats: 1 Active Incident, 1 Planned Maintenance

### Screen 4: OutageDetails
- Incident badge + number (INC-2026-0045)
- Status pill: "Investigating" (orange)
- Timeline component: Reported → Investigating → Resolving → Resolved
- Details: Affected Areas (Ntinda, Bukoto), Cause (Fiber Cut), ETA (4:30 PM)
- "Get Notified" toggle
- "Run Diagnostics" → `/troubleshoot`

### Screen 5: Troubleshooter
- "What's happening?" prompt with radio options:
  - No Internet
  - Slow Internet
  - WiFi Issues
  - Other
- "Select Your Device" radio:
  - ZTE ZXHN F670L (image of ONT)
  - Nokia ONT
  - I'm not sure
- "Start Diagnosis" → `/troubleshoot/zte`

### Screen 6: ZTEDiagnostic
- Visual ONT device (drawn with HTML/divs — white box, LEDs as colored circles)
- LEDs labeled: Power, PON, LOS, Internet, WiFi, LAN 1-4
- Instruction: "Tap the LEDs that are currently ON or flashing"
- Interactive LED toggle (click to activate)
- Default state: Power=green, PON=off, LOS=red, Internet=off, WiFi=off
- "Analyze" button → `/troubleshoot/result`

### Screen 7: DiagnosisResult
- Result card with confidence bar
- "Fiber Signal Loss" — 95% confidence
- Cause: "Fiber Cut on PON line"
- Recommended: "View Active Outage in Ntinda area"
- 2 action buttons: "View Outage Status" → `/outage/INC-2026-0045`, "Open Ticket" → `/ticket/3021`

### Screen 8: SubscriptionPage
- Current package card: "Home Premium", 20 Mbps, Expiry 30 June 2026, UGX 120,000/month
- Usage meter (recharts RadialBar or progress bar)
- "Upgrade Package" section with 3 tier cards (Basic 10Mbps / Premium 20Mbps / Ultra 50Mbps)
- "Renew Package" button → `/renewal`
- Billing history table (last 3 entries)

### Screen 9: RenewalInstructions
- "Renew Using Mobile Money" header
- MTN MoMo logo + Airtel Money logo (color blocks)
- Step-by-step card with numbered steps
- Account number highlighted: **UG-20038-NET**
- Amount due: UGX 120,000
- "I've Completed Payment" confirmation button → back to dashboard
- "Set Auto-Renewal Reminder" toggle

### Screen 10: TicketTracking
- Ticket header: #INC-3021 with status "Engineer Assigned" (blue pill)
- Progress stepper: Submitted → Assigned → In Progress → Resolved
- Engineer card: "Patrick Muwanga · Field Technician · ETA: Tomorrow 10AM"
- Timeline of updates
- "Add Comment" input
- Contact engineer button

### Screen 11: NotificationsCenter
- Grouped notifications (Today / Earlier)
- Each with icon, title, time, unread dot
  - 🔵 Planned Maintenance · Ntinda · Tomorrow 2AM (unread)
  - 🟢 Service Restored · Kampala East (read)
  - 🟡 Subscription Reminder · Expires in 14 days (unread)
  - 📋 Ticket Update · Engineer Assigned (unread)
- Mark all read button
- Notification settings shortcut

### Screen 12: StaffDashboard
- Uses StaffLayout
- 4 KPI cards with trend arrows:
  - Customers Online: 12,458 ↑
  - Open Tickets: 148 ↓
  - Active Outages: 3
  - Expiring This Week: 892
- Recharts LineChart: Online customers over 24h
- Recharts BarChart: Tickets by area
- Active incidents table with severity pills
- Recent ticket feed

### Screen 13: OutageManagement
- "Create Incident" form:
  - Title input
  - Affected Areas (multi-select checkboxes: Ntinda, Bukoto, Kireka...)
  - Severity select (Critical / High / Medium / Low)
  - Cause input
  - ETA datetime picker
  - Notify customers toggle
- Existing incidents table with edit/resolve actions
- Bulk action toolbar

### Screen 14: AnalyticsDashboard
- 4 metric cards: Support calls reduced (-34%), Renewals online (67%), Avg resolution time (4.2h), CSAT (4.6/5)
- Recharts AreaChart: Monthly support call volume (showing downward trend)
- Recharts PieChart: Ticket categories
- Recharts BarChart: Renewals by channel (MoMo vs. bank vs. other)
- Data table: Top issue types

---

## Key Implementation Notes

1. **Mobile-first prototype**: Customer screens use `max-w-sm mx-auto` with phone-like chrome. Staff screens are full-width.
2. **Navigation**: Use `useNavigate()` from react-router-dom. All "Back" buttons and action buttons are wired.
3. **ZTE ONT visual**: Pure HTML/CSS div-based device mockup — white rectangle, colored LED dots with labels, no canvas or external image needed.
4. **Charts**: Recharts with ISP brand colors. Keep charts clean and minimal.
5. **Status colors**: Use CSS vars `--isp-green`, `--isp-orange`, `--isp-red` inline rather than one-off hex.
6. **No Make Kit installed**: Use shadcn/ui components (`Button`, `Card`, `Input`, `Badge`, `Tabs`, `Progress`, `RadioGroup`, `Switch`, etc.)

---

## Verification

1. Navigate to `/` — login screen loads, clicking "Login" goes to `/dashboard`
2. From dashboard, click each Quick Action — all navigate correctly
3. Service Status → tap Ntinda outage → OutageDetails loads
4. From OutageDetails → "Run Diagnostics" → Troubleshooter → ZTE screen → Result
5. Result → "View Outage Status" loops back to outage
6. Dashboard → Account → Subscription → Renew → Renewal Instructions
7. Staff login link on login screen → Staff Dashboard → all sidebar links work
8. Charts render on Staff Dashboard and Analytics screens
9. ZTE LEDs are clickable and toggle state
