import {makeInitial,performanceStep,clamp} from './fdm.js';
import {START,ROUTE,AIRPORT,distanceM,ils} from './navigation.js';
import {InputFusion} from './input.js';
import {World} from './world.js';
import {WeatherManager} from './weather.js';
import {TrafficManager} from './traffic.js';
import {UI} from './ui.js';
import {ReplayRecorder} from './replay.js';

const $=id=>document.getElementById(id);
const cfg=window.CBR_CONFIG||{googleMapsApiKey:'',cesiumIonToken:'',wsPort:3001};
const input=new InputFusion(),ui=new UI(),weather=new WeatherManager(),replay=new ReplayRecorder();
let worldStatus='BOOT',world=new World(cfg,s=>{worldStatus=s;}),traffic=null,ws=null,view='follow',running=false,missionIndex=1,last=performance.now(),accum=0,currentInput=input.poll(),weatherAuto=true,autopilot=false;
let state=makeInitial({lat:START.lat,lng:START.lng,alt:START.alt,heading:90,onGround:false});state.groundAlt=AIRPORT.elev;

function connectPhone(){
  try{
    ws=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.hostname}:${cfg.wsPort||3001}`);
    ws.onmessage=e=>{try{const d=JSON.parse(e.data);if(d?.type?.startsWith('phone-'))input.applyPhone(d);}catch{}};
  }catch{}
}

function start({cold=false}={}){
  ui.showHud();
  state=makeInitial({lat:cold?AIRPORT.runway23.lat:START.lat,lng:cold?AIRPORT.runway23.lng:START.lng,alt:cold?AIRPORT.runway23.thresholdElevFt*0.3048+.5:START.alt,heading:cold?AIRPORT.runway23.heading:90,onGround:cold});
  state.groundAlt=AIRPORT.elev;state.gear=true;state.flaps=cold?2:0;state.engineRunning=!cold;state.throttle=cold?0:.62;
  missionIndex=1;running=true;autopilot=false;input.ap=false;ui.toast(cold?'COLD & DARK · PRESS E TO START ENGINE':'FLIGHT INITIALIZED');
  if(world.viewer&&!world.aircraftEntity)world.spawnAircraft(state);
}

function autopilotCommand(){
  if(!autopilot)return null;
  const i=ils(state,AIRPORT.runway23),final=i.distance<18000;
  const target=final?{alt:AIRPORT.runway23.thresholdElevFt*0.3048+Math.max(45,-i.along*Math.tan(3*Math.PI/180)),hdg:AIRPORT.runway23.heading,ias:38}:{alt:1200,hdg:90,ias:60};
  const altErr=target.alt-state.alt,hdgErr=((target.hdg-state.heading+540)%360)-180,speedErr=target.ias-state.ias;
  return{pitch:clamp(altErr/180,-.55,.55),roll:clamp(hdgErr/35,-.75,.75),yaw:0,throttle:clamp(state.throttle+speedErr*.0035,0,1),flaps:final?2:state.flaps,gear:final?true:state.gear,brake:0,trimPitch:0,engineRunning:true,engineStart:false,engineStop:false,source:'AUTOPILOT',events:{}};
}

function handleEvents(inp){
  const ev=inp.events||{};
  if(ev.view){const modes=['follow','cockpit','chase','free'];view=modes[(modes.indexOf(view)+1)%modes.length];ui.toast('CAMERA · '+view.toUpperCase());}
  if(ev.reset)start({cold:false});
  if(ev.calibrate){input.calibrateIMU();ui.toast('IMU CALIBRATED');}
  if(ev.autopilot){autopilot=!autopilot;ui.toast('AUTOPILOT '+(autopilot?'ON':'OFF'));}
  if(input.keys.v&&!input._v){const modes=['follow','cockpit','chase','free'];view=modes[(modes.indexOf(view)+1)%modes.length];ui.toast('CAMERA · '+view.toUpperCase());}
  if(input.keys.c&&!input._c){input.calibrateIMU();ui.toast('IMU CALIBRATED');}
  if(input.keys.o&&!input._o){weatherAuto=!weatherAuto;ui.toast(weatherAuto?'LIVE WIND':'CALM WIND');}
  input._v=!!input.keys.v;input._c=!!input.keys.c;input._o=!!input.keys.o;
}

function step(dt){
  currentInput=input.poll();handleEvents(currentInput);
  const cmd=autopilotCommand()||currentInput;cmd.trimPitch=input.trim;
  const wind=weatherAuto?weather.gust(performance.now()/1000):{windN:0,windE:0,windD:0};
  const wasCrashed=state.crashed;state=performanceStep(state,cmd,wind,dt);replay.sample(state,currentInput,dt);if(!wasCrashed&&state.crashed)ui.toast('CRASH · R RESET');
  if(missionIndex<ROUTE.length){const target=ROUTE[missionIndex],threshold=target.name.includes('RUNWAY')?220:350;if(distanceM(state,target)<threshold){state.score+=100;missionIndex++;ui.toast('✓ '+target.mission);if(missionIndex>=ROUTE.length)ui.toast('✓ ROUTE COMPLETE');}}
  if(state.touchdown&&state.landingGrade===null){const i=ils(state,AIRPORT.runway23);const score=clamp(100-Math.abs(i.cross)*.30-Math.abs(state.vs)*8-Math.abs(state.ias-35)*1.2-(state.gear?0:50),0,100);state.landingGrade=score>=90?'A':score>=80?'B':score>=70?'C':score>=60?'D':'F';state.score+=Math.round(score);ui.toast('LANDING '+state.landingGrade);}
}

async function connectSerial(){
  if(!('serial' in navigator)){ui.toast('Web Serial requires Chrome/Edge on localhost or HTTPS');return;}
  try{const port=await navigator.serial.requestPort();await port.open({baudRate:115200});const reader=port.readable.pipeThrough(new TextDecoderStream()).getReader();let buf='';
    for(;;){const{value,done}=await reader.read();if(done)break;buf+=value;const lines=buf.split('\n');buf=lines.pop();for(const line of lines){try{const d=JSON.parse(line.trim());if(Number.isFinite(d.pitch))input.applyIMU({pitch:d.pitch,roll:d.roll,yaw:d.yaw});}catch{}}}
  }catch(e){console.error(e);ui.toast('ESP32 connection failed');}
}

$('start').onclick=()=>start();
$('cold').onclick=()=>start({cold:true});
$('demo').onclick=()=>{start();autopilot=true;ui.toast('AUTOPILOT TRAINING ENGAGED');};
$('serial').onclick=connectSerial;
$('gyro').onclick=()=>location.href='controller.html';
$('view').onclick=()=>{const modes=['follow','cockpit','chase','free'];view=modes[(modes.indexOf(view)+1)%modes.length];ui.toast('CAMERA · '+view.toUpperCase());};
$('systems').onclick=()=>$('sys').classList.toggle('sys-open');
$('ap').onclick=()=>{autopilot=!autopilot;ui.toast('AUTOPILOT '+(autopilot?'ON':'OFF'));};
$('weather').onclick=()=>{weatherAuto=!weatherAuto;ui.toast(weatherAuto?'LIVE WIND':'CALM WIND');};
$('resetHud').onclick=()=>start({cold:false});
$('rec').onclick=()=>{if(replay.recording){replay.stop();ui.toast('REPLAY SAVED');}else{replay.start();ui.toast('RECORDING STARTED');}};
$('play').onclick=()=>{if(replay.play()){ui.toast('REPLAY PLAYBACK');}else ui.toast('NO REPLAY');};

async function loop(now){
  const frameDt=Math.min(.05,(now-last)/1000);last=now;
  if(running && !replay.playing){accum+=frameDt;while(accum>=1/120){step(1/120);accum-=1/120;}}
  if(replay.playing){const rs=replay.next(frameDt);if(rs)state=rs;else ui.toast('REPLAY COMPLETE');}
  world.updateGround(state,now);
  if(world.viewer){world.frame(state,view,now);if(traffic)traffic.render();}
  ui.update(state,currentInput,weather,traffic,worldStatus,missionIndex);ui.renderPFD(state);
  requestAnimationFrame(loop);
}

(async()=>{
  try{
    connectPhone();
    const initPromise=world.init();
    initPromise.then(()=>{if(world.viewer){world.spawnAircraft(state);world.drawRoute(ROUTE);traffic=new TrafficManager(world.viewer);traffic.refresh().catch(()=>{});setInterval(()=>traffic?.refresh(),20000);}}).catch(e=>console.error(e));
    weather.refresh().catch(()=>{});setInterval(()=>weather.refresh(),60000);
  }catch(e){console.error(e);worldStatus='DEGRADED';}
  requestAnimationFrame(loop);ui.toast('READY · START FLIGHT · Cesium / GeoFS-inspired workflow');
})();
