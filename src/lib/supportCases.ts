import { MOVE_POLICY } from "./movePolicy.ts";
// Report Problem categories, shared by recognition and report labels.
export const SUPPORT_CASES = [
  { id: 'no_internet', label: 'No Internet', mode: 'ticket', pattern: /\b(no internet|internet (?:is )?not working|offline|disconnected)\b/, advice: 'Check one thing at a time: can you see your usual Wi-Fi network? Do not press RESET or touch the fibre connector.' },
  { id: 'slow_speed', label: 'Slow Speed', mode: 'ticket', pattern: /\b(slow|slowly|buffering|lagging|speed (?:is |seems |has become )?(?:slow|low|poor|bad|dropp?ing)|internet speed problem)\b/, advice: 'Check whether one device or all devices are slow. A speed test near the router can help; record the results in Options. The report form can capture results for support.' },
  { id: 'los_light', label: 'LOS Light Red', mode: 'ticket', pattern: /\b(red los|los (?:is |light is |light )?red|los light)\b/, advice: 'A red LOS can indicate loss of fibre signal, but I cannot confirm a cut remotely. Do not touch the fibre connector or press RESET. Review a support report with the indicators you observed.' },
  { id: 'router_issue', label: 'Router / Wi-Fi Issue', mode: 'ticket', pattern: /\b(router|wi-?fi|wlan)\b/, advice: 'We can check network visibility, another device and router indicators. Describe what is happening so we can choose the next check.' },
  { id: 'payment_not_reflected', label: 'Payment Not Reflected', mode: 'ticket', pattern: /\b(payment not reflected|missing payment|paid but|payment.{0,45}not (?:showing|received|credited|reflected)|renewal (?:failed|missing|not reflected)|billing (?:error|problem|issue)|invoice (?:wrong|missing|incorrect)|balance (?:wrong|incorrect|not updated))\b/, advice: 'Finance must verify payment or renewal issues. Keep the transaction reference, date and amount ready for the report form. Do not share a PIN, OTP or full financial account details here. I cannot confirm payment receipt.' },
  { id: 'wrong_router_payment', label: 'Paid on Wrong Router', mode: 'ticket', pattern: /\b(?:paid|payment|money|pay)\b.{0,60}\bwrong\b|\bwrong (?:router|account)\b.{0,40}\b(?:paid|payment|money)\b/, advice: 'Finance needs to review a payment made to the wrong router/account. Keep the transaction reference, amount, date, and intended router details ready for the secure report form. I cannot transfer payment or promise a reversal. Never share your payment PIN.' },
  { id: 'move_eligibility', label: 'Moving / Location Check', mode: 'ticket', pattern: /\b(moving|relocat(?:e|ing|ion)|move (?:my |the )?(?:router|house|home|to|service)|new (?:location|address|home|house)|transfer.{0,20}(?:service|connection))\b/, advice: MOVE_POLICY },
  { id: 'password_reset', label: 'Wi-Fi Password Reset', mode: 'ticket', pattern: /\b(password|passphrase|ssid)\b|\bchange.{0,20}(?:wi-?fi|network) name\b/, advice: 'If you forgot your Wi-Fi password or cannot connect, request a support-assisted Wi-Fi password reset. Do not press the router RESET button or share a password in chat. CanalBox requires at least 24 hours between changes or resets. If you are connected and only want to change it, use the approved CanalBox portal guidance.' },
  { id: 'other', label: 'Other Account Issue', mode: 'ticket', pattern: /\b(account issue|account details|wrong (?:name|phone|details)|subscription issue|login|log in|sign in|myconnect password)\b/, advice: 'For a MyConnect login problem, use the sign-in page recovery option; this is separate from a Wi-Fi reset. For another account issue, describe what needs correcting in the support report. Staff must verify account changes. Never share passwords, PINs or OTPs.' },
  { id: 'knocked_pole', label: 'Knocked Pole', mode: 'incident', pattern: /\b(?:fallen|knocked|damaged|broken|down) (?:power |network |internet )?pole\b|\bpole.{0,15}(?:fallen|knocked|broken|down)\b/, advice: 'Stay away from the pole and any fallen cables; do not touch or try to repair them. Use the network incident form to record the location and a photo only if safe. If there is immediate danger, contact the appropriate local emergency service.' },
  { id: 'fiber_cut', label: 'Cable Cut / Vandalism', mode: 'incident', pattern: /\b(?:fibre|fiber|cable).{0,20}(?:cut|vandal|broken|severed)|\bvandalism\b/, advice: 'Do not touch or repair damaged cables or look into a fibre end. Report the observed cable damage as a network incident with its location and an optional photo from a safe distance. A red router light alone does not confirm a cable cut.' },
  { id: 'damaged_cabinet', label: 'Damaged Cabinet', mode: 'incident', pattern: /\b(?:damaged|broken|open|vandalised|vandalized) (?:network )?cabinet\b|\bcabinet.{0,20}(?:damaged|broken|open)\b/, advice: 'Do not open, touch or attempt to repair the cabinet. Use the network incident report to provide the location and describe the visible damage. Take photos only from a safe distance.' },
  { id: 'area_outage', label: 'Area Outage', mode: 'incident', pattern: /\b(area outage|whole area|neighbou?rs?.{0,30}(?:offline|no internet|affected)|everyone.{0,20}(?:offline|no internet))\b/, advice: 'Several nearby customers being affected may indicate an area issue, but I cannot verify a live outage. Report an Area Outage with the area and approximate start time. Do not include neighbours’ personal information.' },
  { id: 'outage', label: 'Road Construction Damage', mode: 'incident', pattern: /\b(?:road|construction|digging|excavat).{0,50}(?:damage|cut|cable|internet|outage)|\broad construction\b/, advice: 'Stay clear of excavation equipment and exposed cables. Report Road Construction Damage with the location and what you observed. Do not attempt repairs; a photo is optional and only if safe.' },
  { id: 'other', label: 'Other Network Issue', mode: 'incident', pattern: /\b(other network issue|network damage|exposed cable|hanging cable|network incident)\b/, advice: 'Keep clear of exposed or hanging cables. Use Other Network Issue in the incident form and describe the location and what you observed, with a photo only if safe.' },
] as const;
export type SupportCase = typeof SUPPORT_CASES[number];
export function recognizeSupportCase(input: string): SupportCase | null {
  const t = input.toLowerCase();
  if (/myconnect|login|log in|sign in/.test(t) && /password|login|log in|sign in/.test(t)) return SUPPORT_CASES.find(c => c.mode === 'ticket' && c.id === 'other')!;
  // Specific cases must win over a generic mention of router, password or outage.
  const order = ['wrong_router_payment', 'outage', 'knocked_pole', 'damaged_cabinet', 'fiber_cut', 'area_outage', 'move_eligibility', 'password_reset', 'payment_not_reflected', 'los_light', 'slow_speed', 'no_internet', 'other', 'router_issue'];
  for (const id of order) {
    const found = SUPPORT_CASES.find(c => c.id === id && c.pattern.test(t));
    if (found) return found;
  }
  return null;
}
export function isRouterPlacement(input: string) {
  if (/new (?:address|home|house|location)|relocat|moving (?:house|home|to)|move (?:house|home|to)/i.test(input)) return false;
  return /\b(?:router|wi-?fi).{0,45}(?:placement|position|corner|cupboard|floor|location|too far|bedroom)|\b(?:weak signal|dead spot|poor coverage|within same home|move.{0,15}router.{0,20}(?:room|inside|upstairs))\b/i.test(input);
}
export const PLACEMENT_GUIDANCE = 'For weak Wi-Fi in part of the home, keep the router upright, ventilated and in an open central position, away from metal, thick walls and appliances, only within the existing cables’ safe reach. Do not pull, bend or disconnect fibre. If repositioning needs cable work, support must arrange it. Does the connection work better near the router?';

export function wantsStaffContact(input: string) {
  return /\b(?:whats\s?app|helpline|help line|support (?:number|phone)|customer (?:care|service)|human agent|real person|staff member)\b|\b(?:talk|speak|chat|connect|contact|call|reach).{0,35}\b(?:staff|support|agent|human|person|someone|canalbox)\b|\b(?:phone|telephone|contact) number\b/i.test(input);
}
export function staffContactReply(phone: string, whatsapp: string) {
  return `To speak with CanalBox staff, call ${phone}${whatsapp ? ` or use WhatsApp at +${whatsapp}` : ''}. Use the Call support or WhatsApp staff link below. You do not need to create a ticket first. Never share passwords, PINs or OTPs.`;
}
