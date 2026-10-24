import { describe, expect, it } from "vitest";
import { RE, classifyIssueType, maskPersonalData, redactSecrets } from "./assistantRules";

const cls = (s: string, cur = "no_internet") => classifyIssueType(s, cur);

describe("classifyIssueType", () => {
  it("does not treat 'close'/'lost'/'closed' as LOS", () => {
    expect(cls("I'm close to the router but it is slow")).toBe("slow_speed");
    expect(cls("my phone is lost")).toBe("no_internet");
    expect(cls("the shop is closed")).toBe("no_internet");
  });
  it("detects real LOS wording", () => {
    expect(cls("LOS light is red")).toBe("los_light");
    expect(cls("red LOS on my router")).toBe("los_light");
    expect(cls("I think the fibre cut happened")).toBe("fiber_cut");
  });
  it("does not treat 'I forgot to pay' as a password reset", () => {
    expect(cls("I forgot to pay")).toBe("no_internet");
    expect(cls("I forgot my wifi password")).toBe("password_reset");
    expect(cls("need to reset the password")).toBe("password_reset");
  });
  it("detects payment problems", () => {
    expect(cls("payment not reflected")).toBe("payment_not_reflected");
    expect(cls("I paid but still offline")).toBe("payment_not_reflected");
  });
  it("detects slow speed, websites and wifi", () => {
    expect(cls("internet is so slow")).toBe("slow_speed");
    expect(cls("some websites will not open")).toBe("other");
    expect(cls("wifi name is missing")).toBe("router_issue");
  });
  it("keeps the current type when nothing matches", () => {
    expect(cls("thanks", "slow_speed")).toBe("slow_speed");
  });
});

describe("RE", () => {
  it("restart only on whole words or a bare 'not yet'", () => {
    expect(RE.restart.test("my payment has not yet reflected")).toBe(false);
    expect(RE.restart.test("not yet")).toBe(true);
    expect(RE.restart.test("should i restart it")).toBe(true);
  });
  it("greeting only on whole words", () => {
    expect(RE.greeting.test("this isn't what i asked")).toBe(false);
    expect(RE.greeting.test("which plan")).toBe(false);
    expect(RE.greeting.test("hi there")).toBe(true);
    expect(RE.greeting.test("i need help")).toBe(true);
  });
  it("lag does not match village", () => {
    expect(RE.slow.test("i live in a village")).toBe(false);
    expect(RE.slow.test("video is lagging")).toBe(true);
  });
});

describe("redactSecrets", () => {
  it("removes stated passwords, pins and card numbers", () => {
    expect(redactSecrets("my wifi password is hunter2 please help")).not.toContain("hunter2");
    expect(redactSecrets("otp: 482913")).not.toContain("482913");
    expect(redactSecrets("my pin 4821 was used")).not.toContain("4821");
    expect(redactSecrets("card 4111 1111 1111 1111")).not.toContain("4111");
  });
  it("leaves normal text alone", () => {
    expect(redactSecrets("router lights: power on, LOS red")).toBe("router lights: power on, LOS red");
    expect(redactSecrets("I paid 90000 yesterday")).toBe("I paid 90000 yesterday");
  });
});

describe("RE.wifiMissing", () => {
  it.each([
    "I am not seeing my WiFi", "i can't see my wifi", "cannot find the CanalBox network", "my wifi is missing",
    "wifi name is missing", "WiFi not showing", "wifi disappeared", "no wifi", "wifi light is off", "I don't see my network",
    "the wi-fi isn't showing",
  ])("matches: %s", s => expect(RE.wifiMissing.test(s.toLowerCase())).toBe(true));
  it.each([
    "I can't see my payment", "the website is not showing", "I paid but not seeing it", "my wifi password is forgotten",
    "wifi is slow", "internet not working", "how do I change wifi name",
  ])("does not match: %s", s => expect(RE.wifiMissing.test(s.toLowerCase())).toBe(false));
});

describe("maskPersonalData", () => {
  it("masks phone numbers and e-mail addresses only", () => {
    expect(maskPersonalData("call me on 0772 123 456 or a.b@mail.com")).toBe("call me on [number] or [email]");
    expect(maskPersonalData("the light blinks every 5 seconds")).toBe("the light blinks every 5 seconds");
  });
});
