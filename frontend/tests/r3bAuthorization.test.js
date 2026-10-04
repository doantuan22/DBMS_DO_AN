import test from 'node:test';
import assert from 'node:assert/strict';
import { userCanAct, userCanEnterArea, visibleAreasFor, loadAuthorizedSections, ADMIN_SECTION_PERMISSIONS } from '../src/utils/authorization.js';
import { ROLES, ROLE_AREAS } from '../src/constants/roles.js';
const user=(role,codes=[])=>({role,permissions:codes.map(code=>({code}))});

test('own Customer history and Manager/Admin areas do not require a representative write permission',()=>{
  for(const role of [ROLES.CUSTOMER,ROLES.MANAGER,ROLES.ADMIN]){
    assert.equal(userCanEnterArea(user(role),role,ROLE_AREAS[role].permission),true);
    assert.deepEqual(visibleAreasFor(user(role)).map(([r])=>r),[role]);
  }
  assert.equal(userCanEnterArea(user(ROLES.SUPPORT,['XULY_KHIEUNAI']),ROLES.SUPPORT,ROLE_AREAS[ROLES.SUPPORT].permission),false);
});

test('the same permission never makes a foreign role eligible and every Support combination is required',()=>{
  const all=Object.values(ADMIN_SECTION_PERMISSIONS);
  assert.deepEqual(visibleAreasFor(user(ROLES.ADMIN,all)).map(([role])=>role),[ROLES.ADMIN]);
  assert.equal(userCanAct(user(ROLES.MANAGER,['QL_SUAT_CHIEU']),ROLES.ADMIN,'QL_SUAT_CHIEU'),false);
  for(const codes of [[],['QL_KHIEUNAI'],['XULY_KHIEUNAI'],['TRA_CUU_DON'],['QL_KHIEUNAI','XULY_KHIEUNAI'],['QL_KHIEUNAI','TRA_CUU_DON']]){
    const actor=user(ROLES.SUPPORT,codes);
    assert.equal(userCanAct(actor,ROLES.SUPPORT,'QL_KHIEUNAI','XULY_KHIEUNAI'),codes.includes('QL_KHIEUNAI')&&codes.includes('XULY_KHIEUNAI'));
    assert.equal(userCanAct(actor,ROLES.SUPPORT,'QL_KHIEUNAI','TRA_CUU_DON'),codes.includes('QL_KHIEUNAI')&&codes.includes('TRA_CUU_DON'));
  }
});

test('partial-grant loads skip unauthorized APIs and an API failure cannot discard other sections',async()=>{
  const calls=[];
  const sections={rooms:{permission:'QL_PHONG',load:async()=>{calls.push('rooms');return ['room'];}},seats:{permission:'QL_GHE',load:async()=>{calls.push('seats');throw Error('403');}},showtimes:{permission:'QL_SUAT_CHIEU',load:async()=>{calls.push('showtimes');return ['show'];}}};
  const result=await loadAuthorizedSections(user(ROLES.MANAGER,['QL_GHE','QL_SUAT_CHIEU']),ROLES.MANAGER,sections);
  assert.deepEqual(calls,['seats','showtimes']);assert.equal(result.seats.status,'error');assert.equal(result.showtimes.status,'success');assert.deepEqual(result.showtimes.data,['show']);assert.equal(result.rooms,undefined);
});
