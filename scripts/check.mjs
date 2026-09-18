import fs from 'node:fs';
import {makeInitial,performanceStep,isa,Quat} from '../src/fdm.js';
import {START,AIRPORT,ils,distanceM,ROUTE} from '../src/navigation.js';

for(const f of ['index.html','controller.html','src/fdm.js','src/input.js','src/navigation.js','src/world.js','src/weather.js','src/traffic.js','src/ui.js','src/main.js','server.mjs'])if(!fs.existsSync(f))throw new Error(`Missing ${f}`);
const q=Quat.fromEuler(.2,.1,1).norm();if(Math.abs(Math.hypot(q.w,q.x,q.y,q.z)-1)>1e-9)throw new Error('Quaternion normalization failed');
const at=isa(1000);if(!(at.rho>0&&at.a>0))throw new Error('ISA failed');
let s=makeInitial({lat:START.lat,lng:START.lng,alt:START.alt,heading:90,onGround:false});s.groundAlt=AIRPORT.elev;
const world={windN:0,windE:0,windD:0};const input={pitch:0,roll:0,yaw:0,throttle:.65,flaps:0,gear:true,brake:0,trimPitch:0,battery:true,mixture:1,engineRunning:true,engineStart:false,engineStop:false};
for(let i=0;i<7200;i++){s=performanceStep(s,input,world,1/120);if(!Number.isFinite(s.alt)||!Number.isFinite(s.lat)||!Number.isFinite(s.lng)||!Number.isFinite(s.u))throw new Error(`Non-finite state at ${i}`);}
if(s.crashed)throw new Error('Cruise stability regression: aircraft crashed with neutral controls');
let c=makeInitial({lat:AIRPORT.runway23.lat,lng:AIRPORT.runway23.lng,alt:AIRPORT.elev,onGround:true});c.groundAlt=AIRPORT.elev;
let startInput={...input,throttle:0,engineRunning:false,engineStart:true,gear:true,flaps:2};
c=performanceStep(c,startInput,world,1/120);
startInput.engineStart=false;
for(let i=0;i<2400;i++)c=performanceStep(c,startInput,world,1/120);
if(!c.engineRunning)throw new Error('Engine start regression');
const nav=ils(s,AIRPORT.runway23);if(!Number.isFinite(nav.distance)||distanceM(ROUTE[0],ROUTE[1])<=0)throw new Error('Navigation failed');
console.log('CBR VFR-09 checks passed');console.log(JSON.stringify({alt:s.alt,ias:s.ias,heading:s.heading,aoa:s.alpha*180/Math.PI,phase:s.phase,dme:nav.dmeNm},null,2));
