import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {isHomeRouterRelocation,startRelocation,advanceRelocation} from '../src/lib/assistantRelocation.ts';
test('recognizes relocation, not address transfers',()=>{assert.equal(isHomeRouterRelocation('My router I want it moved to another room'),true);assert.equal(isHomeRouterRelocation('I am moving to a new address'),false)});
test('extension to report preserves context',()=>{
 let x=startRelocation();
 x=advanceRelocation(x.state,'No, need extension');assert.equal(x.state.step,'offer_ticket');
 x=advanceRelocation(x.state,'Yes, request ticket');assert.equal(x.state.step,'destination');
 x=advanceRelocation(x.state,'Bedroom');assert.equal(x.state.destination,'Bedroom');
 x=advanceRelocation(x.state,'Review report');assert.equal(x.reviewTicket,true);
});
test('cancellation does not create ticket',()=>{let x=startRelocation();x=advanceRelocation(x.state,'no, need extension');x=advanceRelocation(x.state,'Not now');assert.equal(x.state,null)});
