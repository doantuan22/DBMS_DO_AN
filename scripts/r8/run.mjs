import { save,run,fixtures,fixture } from './common.mjs';
// Final replay: destructive resets are restricted to the two explicit disposable targets.
const checks=[];
try {
 for(const database of fixtures.slice(0,2))checks.push(run(database.endsWith('Regression')?'db-reset':'db-reset-flows',['scripts/db/run.mjs','reset',`--database=${fixture(database)}`]));
 for(const stage of ['regressions','flows','transactions','security','migration','performance']) {
  checks.push(run(`final-${stage}`,[`scripts/r8/${stage}.mjs`]));
  save('final-replay.json',{status:'RUNNING',checks}); console.log(`PASS ${stage}`);
 }
 save('final-replay.json',{status:'PASS',checks});
} catch(error) { save('final-replay.json',{status:'FAIL',checks,error:error.message});throw error; }
