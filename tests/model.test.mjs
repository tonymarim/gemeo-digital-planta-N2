import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {acceptance} from '../commissioning.mjs';
import {io} from '../data/catalog.mjs';
const robot=JSON.parse(readFileSync(new URL('../data/robot.json',import.meta.url)));
for(const r of acceptance(robot).results)test(r.name,()=>assert.ok(r.passed,r.error));
test('Endereços físicos únicos por estação e direção',()=>{const physical=io.filter(x=>x.kind==='documentado');assert.equal(new Set(physical.map(x=>x.station+x.address)).size,physical.length);assert.equal(new Set(io.map(x=>x.id)).size,io.length);});
