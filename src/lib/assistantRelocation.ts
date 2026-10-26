/** Deterministic customer journey for moving a router within the same home.
 * No cable work or support ticket is performed by this module.
 */
export type RelocationState = {
  step: 'cable_reach' | 'offer_ticket' | 'destination' | 'review';
  extensionRequired?: boolean;
  destination?: string;
};
export type RelocationReply = { state: RelocationState | null; text: string; chips?: string[]; reviewTicket?: boolean };

export function isHomeRouterRelocation(input: string): boolean {
  const t = input.toLowerCase().trim();
  if (/\b(new address|new home|moving house|moving home|change address|relocate service|transfer service)\b/.test(t)) return false;
  return /\b(move|moving|relocate|reposition|shift)\b.{0,60}\b(router|wi-?fi|box)\b|\b(router|wi-?fi|box)\b.{0,60}\b(move|moving|relocate|reposition|another room|other room)\b/.test(t);
}

export function startRelocation(): RelocationReply {
  return {state: { step: 'cable_reach' }, text: 'I can help arrange moving your router within your home. Can the existing fibre cable safely reach the new room without stretching, sharp bends or disconnection? Please do not move or extend the fibre yourself.', chips: ['Yes, cable reaches', 'No, need extension', 'Not sure']};
}

const yes = /^(yes|yes,? (?:request|create|open|please|go ahead)|request ticket|create ticket|review report|continue|confirm|submit|proceed)\b/i;
const no = /^(no|nope|not now|cancel|stop)\b/i;
export function advanceRelocation(state: RelocationState, input: string): RelocationReply {
  const t = input.trim().slice(0, 160);
  if (/^(cancel|stop|start over|new issue)$/i.test(t)) return {state: null, text: 'Okay, I have stopped the relocation request. Nothing was submitted.'};
  if (state.step === 'cable_reach') {
    if (/\b(no|not sure|extension|cannot reach|can.t reach|doesn.t reach|too short|need more cable)\b/i.test(t)) return {state: {step:'offer_ticket', extensionRequired:true}, text:'A technician will need to assess the cable route and any extension. Do not disconnect, bend or extend the fibre yourself. Would you like to prepare a support request?', chips:['Yes, request ticket','Not now']};
    if (/\b(yes|reaches|long enough)\b/i.test(t)) return {state: {step:'offer_ticket', extensionRequired:false}, text:'If the existing cable reaches safely, keep it free of tension and sharp bends. Would you like staff to review the relocation before you move it?', chips:['Yes, request ticket','Not now']};
    return {state, text:'Does your current cable reach the new room safely, without tension or sharp bends?', chips:['Yes, cable reaches','No, need extension','Not sure']};
  }
  if (state.step === 'offer_ticket') {
    if (yes.test(t)) return {state: {...state, step:'destination'}, text:'Which room would you like the router moved to? For example: bedroom, sitting room, or upstairs.', chips:['Bedroom','Sitting room','Upstairs']};
    if (no.test(t)) return {state:null, text:'Understood. Nothing has been submitted. You can request a technician later if needed.'};
    return {state, text:'Would you like to prepare a technician support request for the router relocation?', chips:['Yes, request ticket','Not now']};
  }
  if (state.step === 'destination') {
    const destination = t.replace(/^(?:to |(?:the )?room is |i want (?:it )?(?:moved )?to )/i,'').trim();
    if (!destination || destination.length < 2 || /^(yes|no|not sure)$/i.test(destination)) return {state, text:'Please name the destination room so it can be included in your support report.'};
    return {state:{...state, step:'review', destination}, text:`Here's the request ready for your review:\n• Router relocation within the same home\n• Destination: ${destination}\n• Cable extension: ${state.extensionRequired ? 'Needed; technician to assess' : 'Not reported as needed'}\n\nSelect “Review report” to open the existing support form. No ticket has been submitted.`, chips:['Review report','Change room','Cancel']};
  }
  if (/^(change room|edit room)$/i.test(t)) return {state:{...state,step:'destination'},text:'What is the correct destination room?'};
  if (/^(review report|review ticket|yes,? request ticket|create ticket|confirm)$/i.test(t)) return {state, text:'Opening the support form so you can review and submit the request.', reviewTicket:true};
  return {state, text:'Your relocation request is ready. Choose “Review report” to check it before submitting, or “Change room” to edit.',chips:['Review report','Change room','Cancel']};
}
