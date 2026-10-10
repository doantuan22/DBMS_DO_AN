import {createJourney} from './journey-fixture.mjs';
import {helpers} from './journey-helpers.mjs';
import {customer} from './customer.mjs';
import {support} from './support.mjs';
import {admin} from './admin.mjs';
import {manager} from './manager.mjs';
export async function run(t){
 const f=await createJourney(t),h=helpers(t);
 await customer(t,h,f);await support(t,h,f);await admin(t,h,f);await manager(t,h,f);
 t.save('journey-result.json',{status:'PASS',scope:'Cross-role owned journey; cleanup in guarded harness finally',fixtureIDs:f});
}
