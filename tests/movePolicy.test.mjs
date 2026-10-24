import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MOVE_POLICY, canInitiateMove, parseMoveCoordinates, hasMoveCoordinates } from '../src/lib/movePolicy.ts';
test('move policy states free relocation, active account, resubscription and both coordinate methods', () => {
  assert.match(MOVE_POLICY, /does not charge/);
  assert.match(MOVE_POLICY, /account must be active/);
  assert.match(MOVE_POLICY, /resubscribe first/);
  assert.match(MOVE_POLICY, /At the new premises/);
  assert.match(MOVE_POLICY, /Google Maps/);
});
test('only a confirmed active status permits initiating a move', () => {
  assert.equal(canInitiateMove('ACTIVE'), true);
  for (const status of ['inactive','expired','suspended','',null,undefined]) assert.equal(canInitiateMove(status),false);
});
test('Google Maps decimal coordinate pairs are parsed without treating zero as missing', () => {
  assert.deepEqual(parseMoveCoordinates('0, 32.5825'),{latitude:0,longitude:32.5825});
  assert.deepEqual(parseMoveCoordinates('-1.2, +32.5'),{latitude:-1.2,longitude:32.5});
  assert.equal(hasMoveCoordinates({currentLatitude:0,currentLongitude:32.5}),true);
});
test('rejects missing coordinates, out-of-range values and links instead of numeric pairs', () => {
  for (const value of ['','abc','91,32','0,181','NaN,32','https://maps.google.com/','1,2,3']) assert.equal(parseMoveCoordinates(value),null);
  assert.equal(hasMoveCoordinates(null),false);
  assert.equal(hasMoveCoordinates({currentLatitude:null,currentLongitude:32}),false);
});
