import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SUPPORT_CASES, recognizeSupportCase, isRouterPlacement, wantsStaffContact, staffContactReply } from '../src/lib/supportCases.ts';

for (const item of SUPPORT_CASES) {
  test(`report category: ${item.mode} / ${item.label}`, () => {
    const found = recognizeSupportCase(item.label);
    assert.equal(found?.id, item.id);
    assert.equal(found?.mode, item.mode);
    assert.ok(found.advice.length > 30);
  });
}
test('catalogue covers all report form categories in the correct mode', () => {
  const form = readFileSync(new URL('../src/app/components/screens/ReportIssue.tsx', import.meta.url), 'utf8');
  for (const [section, mode] of [['personalIssueTypes','ticket'], ['networkIssueTypes','incident']]) {
    const body = form.split(`const ${section} = [`)[1].split('] as const;')[0];
    const ids = [...body.matchAll(/value:\s*"([^"]+)"/g)].map(m => m[1]).sort();
    assert.deepEqual(SUPPORT_CASES.filter(c => c.mode === mode).map(c => c.id).sort(), ids);
  }
});
test('specific payment and relocation cases win over generic router wording', () => {
  assert.equal(recognizeSupportCase('I paid on the wrong router').id, 'wrong_router_payment');
  assert.equal(recognizeSupportCase('I am moving to a new location with my router').id, 'move_eligibility');
  assert.equal(isRouterPlacement('I am moving to a new location with my router'), false);
  assert.equal(isRouterPlacement('move my router upstairs'), true);
  assert.equal(isRouterPlacement('Within same home'), true);
});
test('MyConnect login password is not a Wi-Fi reset', () => {
  assert.equal(recognizeSupportCase('I forgot my MyConnect password').id, 'other');
  assert.equal(recognizeSupportCase('I forgot my WiFi password').id, 'password_reset');
});
test('network damage is routed separately from a personal LOS report', () => {
  assert.equal(recognizeSupportCase('The road construction cut the cable').id, 'outage');
  assert.equal(recognizeSupportCase('The cabinet is damaged').mode, 'incident');
  assert.equal(recognizeSupportCase('My LOS light is red').mode, 'ticket');
  assert.equal(recognizeSupportCase('Other Network Issue').mode, 'incident');
  assert.equal(recognizeSupportCase('Other Account Issue').mode, 'ticket');
});
for (const question of ['How do I talk to staff', 'I want to speak to someone', 'WhatsApp support', 'What is the helpline?', 'Call CanalBox support', 'Can I contact a human agent?']) {
  test(`direct staff request: ${question}`, () => assert.equal(wantsStaffContact(question), true));
}
test('staff answer contains the supplied contact and no portal or ticket prerequisite', () => {
  const reply = staffContactReply('032 610 6800', '256758073035');
  assert.match(reply, /032 610 6800/);
  assert.match(reply, /\+256758073035/);
  assert.match(reply, /do not need to create a ticket first/);
  assert.doesNotMatch(reply, /canalbox\.africa|Report Issue/);
  assert.equal(wantsStaffContact('I want to create a support ticket'), false);
});
