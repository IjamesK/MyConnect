# MyConnect assistant: website and slow-speed support

Changes:
- Guidance for specific websites not loading, including comparison with mobile data, browser/device testing, and error codes. Do not prescribe DNS changes without diagnosis.
- Opens https://www.speedtest.net/ from the assistant; customer enters download, upload, ping and Wi-Fi/Ethernet. Figures are labelled customer-reported, not verified.
- "Create / View support ticket" transfers speedtest results to the existing Report Issue description using sessionStorage. The customer reviews and submits; the assistant does NOT silently create tickets.
- Removed simulated browser speed measurements from ReportIssue ticket submission; they were not real network speed tests.
- Existing duplicate-ticket detection, ticket workflow, and Firebase rules still apply; test ticket permissions in the new ijkjames project.
- Existing WhatsApp escalation remains the last resort.

## Test checklist
1. Sign in as a test customer; ask "I can't access some websites" and answer the follow-up questions.
2. Ask "Internet is slow" and open speedtest.net. Enter 12.4 Mbps, 4.1 Mbps, 58 ms and click "Use these results in my report".
3. Click "Create / View support ticket"; verify Slow Speed and the description includes all three figures before submitting.
4. Check Firestore ticket and any duplicate ticket flow; permission denied requires scoped rules for `tickets`.
5. Test other existing ticket types, logout, and UI on mobile.
