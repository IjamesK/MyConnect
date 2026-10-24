import { test } from 'node:test';
import assert from 'node:assert/strict';
import { advanceSupport, initialSupportFlow } from '../src/lib/assistantFlow.ts';

test('uncertainty after a model light question switches to an accessible check', () => {
  const r = advanceSupport('Not sure', initialSupportFlow(), 'Is the Wi-Fi light on or off on your router?');
  assert.equal(r.flow.step, 'network');
  assert.match(r.text, /phone's Wi-Fi settings/);
  assert.doesNotMatch(r.text, /light on or off/);
});
test('repeated uncertainty advances then offers support without looping', () => {
  let r = advanceSupport('My WiFi is not working', initialSupportFlow());
  const steps = [r.flow.step];
  for (const reply of ["I can't check", "I can't check", 'Not sure']) {
    r = advanceSupport(reply, r.flow, r.text);
    steps.push(r.flow.step);
  }
  assert.deepEqual(steps, ['network', 'otherDevice', 'power', 'ticket']);
  assert.equal(r.ticket, true);
  assert.equal(r.flow.checks.length, 4);
});
test('failed restart preserves evidence and hands off instead of repeating', () => {
  let flow = initialSupportFlow();
  let r;
  for (const reply of ['My Wi-Fi is not working', 'Network is visible', 'No devices work', 'Light is ON', 'No red LOS', 'Already tried restart', 'Still not working']) {
    r = advanceSupport(reply, flow);
    assert.ok(r, reply);
    flow = r.flow;
  }
  assert.equal(flow.step, 'ticket');
  assert.ok(flow.checks.includes('Power restart reported completed'));
  assert.ok(flow.checks.includes('Connection still not working'));
  assert.equal(r.ticket, true);
});
test('red LOS goes to support without claiming a confirmed cut', () => {
  const r = advanceSupport('LOS is red', { step:'signal', checks:['POWER reported on'] });
  assert.equal(r.flow.step, 'ticket');
  assert.match(r.text, /isn't a confirmed diagnosis/);
  assert.match(r.text, /Do not touch/);
});
test('single-device recovery can resolve without restarting the router', () => {
  const r = advanceSupport('Another device works', {step:'otherDevice', checks:[]});
  assert.match(r.text, /affected phone/);
  const done = advanceSupport('Yes', r.flow);
  assert.equal(done.flow.step, 'resolved');
});
test('new issue clears previous checks; unrelated requests can use the model', () => {
  assert.deepEqual(advanceSupport('New issue', {step:'ticket',checks:['old']}).flow, initialSupportFlow());
  assert.equal(advanceSupport('Some websites do not open', initialSupportFlow()), null);
});
