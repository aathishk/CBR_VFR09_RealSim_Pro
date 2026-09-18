import {createWindFromMetar} from './fdm.js';
export class WeatherManager{
 constructor(){this.metar=null;this.wind=createWindFromMetar(null);this.source='SIMULATED';this.lastAt=0;this.tempC=15;this.altimeter=1013.25;this.visibilityKm=null;this.ceilingFt=null;this.error='';}
 async refresh(){try{const r=await fetch('/api/metar?icao=VOCB',{cache:'no-store'});if(!r.ok)throw new Error('METAR '+r.status);const d=await r.json();this.metar=Array.isArray(d)?d[0]:d;this.wind=createWindFromMetar(this.metar);this.tempC=Number.isFinite(Number(this.metar?.temp))?Number(this.metar.temp):15;this.altimeter=Number.isFinite(Number(this.metar?.altim))?Number(this.metar.altim):1013.25;this.source='VOCB METAR';this.lastAt=Date.now();this.error='';return this.metar;}catch(e){this.source='SIMULATED';this.error=e.message;return null;}}
 gust(t){const base=this.wind;const gustDelta=Math.max(0,(this.wind.gustKt||0)-(this.wind.speedKt||0))*.514444;const f=gustDelta>0?1:0;const n=Math.sin(t*1.63)*gustDelta*.26*f+Math.sin(t*.37)*gustDelta*.10*f;const e=Math.cos(t*1.17)*gustDelta*.18*f;const d=Math.sin(t*.29)*gustDelta*.06*f;return{windN:base.windN+n,windE:base.windE+e,windD:base.windD+d};}
}
