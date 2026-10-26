import { RE } from "./assistantRules.ts";
export type SupportStep = "idle" | "network" | "otherDevice" | "power" | "signal" | "restart" | "restartResult" | "ticket" | "resolved";
export type SupportFlow = { step: SupportStep; checks: string[] };
export const initialSupportFlow = (): SupportFlow => ({ step: "idle", checks: [] });
type Result = { flow: SupportFlow; text: string; chips: string[]; ticket?: boolean };

// Keep the current check independent of the model and available during API failures.
export function advanceSupport(input: string, flow: SupportFlow, previous = ""): Result | null {
  const text = input.trim().toLowerCase();
  const unsure = /not sure|don.?t know|do not know|can.?t (check|tell|see the light)|cannot check|unsure/.test(text);
  const yes = /^(yes|on|light is on|it works|working|resolved|network is visible|another device works)[.! ]*$/.test(text);
  const no = /^(no|off|light is off|still not working|still offline|not working|no devices work|network is missing)[.! ]*$/.test(text);
  const result = (step: SupportStep, message: string, chips: string[], note?: string, ticket = false): Result => ({
    flow: { step, checks: note ? [...flow.checks, note] : flow.checks }, text: message, chips, ticket,
  });
  if (/^(start over|new issue)$/.test(text)) return { flow: initialSupportFlow(), text: "What is happening with your connection?", chips: ["My Wi-Fi is not working", "My internet is slow"] };
  if (/^(it works now|connection restored|problem solved)$/.test(text)) return result("resolved", "Good, you reported that the connection is working again. If it returns, you can start a new check.", ["New issue"], "Customer reports service restored");
  if (/^(report issue|contact support|i need support)$/.test(text)) return result("ticket", "We can pass the checks below to support. Review the report before submitting; no ticket has been created yet.", ["Start over"], undefined, true);
  // Recognize uncertainty from an existing model-led light question as well.
  if (unsure && flow.step === "idle") {
    if (/wi.?fi|wlan|light/i.test(previous)) return result("network", "That's okay. We can check without identifying the lights. Open your phone's Wi-Fi settings near the router. Can you see your usual CanalBox network name? Don't share its password.", ["Network is visible", "Network is missing", "I can't check"], "Router lights not identified");
    return result("otherDevice", "That's okay. Let's try a simpler check: can another device use the internet on the same CanalBox Wi-Fi? You can also choose 'I can't check'.", ["Another device works", "No devices work", "I can't check"], "Previous check could not be confirmed");
  }
  if (flow.step === "network") {
    if (yes || /network.*visible|can see.*network/.test(text)) return result("otherDevice", "The network is visible. Can another device use the internet on that same Wi-Fi?", ["Another device works", "No devices work", "I can't check"], "Wi-Fi network visible");
    if (no || /network.*missing/.test(text)) return result("power", "Your network isn't showing. Is the router's POWER light on? Check visually without touching cables.", ["Light is ON", "Light is OFF", "Not sure"], "Wi-Fi network missing");
    if (unsure) return result("otherDevice", "No problem; we'll skip that check. Can another device use the same Wi-Fi? If you have no other device available, choose 'I can't check'.", ["Another device works", "No devices work", "I can't check"], "Network visibility not checked");
  }
  if (flow.step === "otherDevice") {
    if (yes) return result("restartResult", "Since another device works, try turning Wi-Fi off and back on on the affected phone, then reconnect to your usual network. Does internet work now?", ["It works now", "Still not working", "I can't check"], "Another device has internet");
    if (no || unsure) return result("power", "Let's check the router next. Is its POWER indicator lit? You do not need to identify the other lights yet.", ["Light is ON", "Light is OFF", "Not sure"], no ? "No devices have internet" : "Another device unavailable for testing");
  }
  if (flow.step === "power") {
    if (no) return result("ticket", "Check that the power adapter is connected and the wall socket is switched on, only if safe. If POWER remains off, use Report issue for a router power fault. Do not press RESET or handle the fibre connector.", ["It works now", "Report issue"], "POWER reported off", true);
    if (yes) return result("signal", "Power is on. Can you see a red LOS indicator? If your router has no LOS label or you can't identify it, choose 'Not sure'.", ["LOS is red", "No red LOS", "Not sure"], "POWER reported on");
    if (unsure) return result("ticket", "We can stop the visual checks. If you can't safely identify the indicators, support can help. Use Report issue and review the checks we've recorded. Don't press RESET or touch the fibre connector.", ["Report issue", "Start over"], "POWER could not be identified", true);
  }
  if (flow.step === "signal") {
    if (!/no red|not red|isn.t red/.test(text) && /los is red|red los|los.*red/.test(text)) return result("ticket", "A red LOS may indicate loss of fibre signal; this isn't a confirmed diagnosis. Do not touch the fibre connector or press RESET. Report the issue so support can investigate.", ["Report issue"], "Red LOS reported", true);
    if (/no red|not red/.test(text) || no || unsure) return result("restart", "If you haven't already tried a power restart and can safely reach the power adapter, turn the router OFF for 5 full minutes, then ON and let the lights settle. Do not press RESET or touch the fibre cable. Have you completed this?", ["Restart completed", "Already tried restart", "I can't check"], unsure ? "Signal indicators not identified" : "No red LOS reported");
  }
  if (flow.step === "restart") {
    if (/restart completed|already tried|restarted/.test(text) || yes) return result("restartResult", "Thanks; we won't repeat the restart. Does your internet work now?", ["It works now", "Still not working"], "Power restart reported completed");
    if (unsure || no) return result("ticket", "We'll skip the restart. Use Report issue to send support the checks already recorded; review the description before submitting.", ["Report issue"], "Power restart not completed", true);
  }
  if (flow.step === "restartResult" && yes) return result("resolved", "Good, you reported that the connection is working again. Start a new check if the problem returns.", ["New issue"], "Customer reports service restored");
  if (flow.step === "restartResult" && (no || unsure)) return result("ticket", "The checks haven't confirmed a fix. Use Report issue to pass the symptoms and completed checks to support. You won't need to repeat them here.", ["Report issue"], no ? "Connection still not working" : "Result could not be checked", true);
  if (RE.wifiMissing.test(text) || /wi.?fi.*(not working|missing|not showing)|can.?t see.*(wi.?fi|network)|no internet|internet.*not working/.test(text)) return result("network", "Let's check one thing at a time. Open Wi-Fi settings on your phone near the router. Can you see your usual CanalBox network name?", ["Network is visible", "Network is missing", "I can't check"], "Wi-Fi / internet problem reported");
  return null;
}
