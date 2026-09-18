import {DEG,clamp,metersPerDeg} from './fdm.js';

// Current VOCB geometry and radio-aid reference data are based on AAI eAIP material.
// These values are for simulator use and are not a substitute for operational charts.
export const START={lat:11.025546,lng:77.003978,alt:1980*0.3048};
export const AIRPORT={
  icao:'VOCB',name:'Coimbatore International Airport',elevFt:1330,elev:1330*0.3048,
  runway05:{name:'05',lat:11 + 1/60 + 20.39/3600,lng:77 + 2/60 + 5.44/3600,heading:48.50,length:2990,width:45,thresholdElevFt:1330},
  runway23:{name:'23',lat:11 + 1/60 + 48.32/3600,lng:77 + 3/60 + 15.96/3600,heading:228.50,length:2990,width:45,thresholdElevFt:1277},
  ils23:{ident:'ICMB',locMHz:109.100,gsMHz:331.400,dmeChannel:'28X',glideDeg:3,locLat:11+1/60+13.4/3600,locLng:77+1/60+58.2/3600,gsLat:11+2/60+17.3/3600,gsLng:77+3/60+10.6/3600},
  vor:{ident:'CCB',freqMHz:112.900,channel:'76X'},
  ndb:{ident:'CB',freqKHz:354}
};
export const ROUTE=[
 {name:'PSG COLLEGE OF TECHNOLOGY',lat:11.025546,lng:77.003978,alt:650,mission:'DEPART PSG TECH'},
 {name:'CODISSIA TRADE FAIR',lat:11.03049,lng:77.02819,alt:800,mission:'PASS CODISSIA'},
 {name:'SINGANALLUR',lat:11.00242,lng:77.02909,alt:1200,mission:'PASS SINGANALLUR'},
 {name:'VOCB AIRPORT SECTOR',lat:11.02636,lng:77.04100,alt:1800,mission:'JOIN AIRPORT SECTOR'},
 {name:'ILS RWY 23 FINAL',lat:11.0198,lng:77.0134,alt:1400,mission:'ESTABLISH ICMB LOC / G/S'},
 {name:'RUNWAY 23',lat:AIRPORT.runway23.lat,lng:AIRPORT.runway23.lng,alt:AIRPORT.runway23.thresholdElevFt*0.3048+2,mission:'LAND RUNWAY 23'}
];
export function distanceM(a,b){const m=metersPerDeg((a.lat+b.lat)/2);return Math.hypot((b.lng-a.lng)*m.lng,(b.lat-a.lat)*m.lat);}
export function bearingDeg(a,b){const y=(b.lng-a.lng)*Math.cos(((a.lat+b.lat)/2)*DEG),x=b.lat-a.lat;return((Math.atan2(y,x)/DEG)+360)%360;}
export function runwayRelative(ac,rwy=AIRPORT.runway23){
 const m=metersPerDeg((ac.lat+rwy.lat)/2),east=(ac.lng-rwy.lng)*m.lng,north=(ac.lat-rwy.lat)*m.lat,h=rwy.heading*DEG;
 const along=north*Math.cos(h)+east*Math.sin(h),cross=-north*Math.sin(h)+east*Math.cos(h);return{along,cross,dist:Math.hypot(along,cross)};
}
export function ils(ac,rwy=AIRPORT.runway23){
 const rr=runwayRelative(ac,rwy);const d=Math.max(1,-rr.along);const locDeg=Math.atan2(rr.cross,Math.max(100,d))/DEG;
 const idealAlt=AIRPORT.elev+d*Math.tan(AIRPORT.ils23.glideDeg*DEG),gsErr=ac.alt-idealAlt;const angle=Math.atan2(Math.max(0,ac.alt-AIRPORT.elev),d)/DEG;
 return{distance:rr.dist,along:rr.along,cross:rr.cross,locDeg,gsErr,glideAngle:angle,dhFt:Math.max(0,(ac.alt-AIRPORT.elev)*3.28084),dmeNm:rr.dist/1852};
}
export function papi(ac,rwy=AIRPORT.runway23){
 const i=ils(ac,rwy),err=i.glideAngle-AIRPORT.ils23.glideDeg; if(i.along>0||i.distance>16000)return['W','W','W','W'];
 if(err>1.0)return['W','W','W','W'];if(err>0.35)return['W','W','W','R'];if(err>0.10)return['W','W','R','R'];if(err>-0.10)return['W','W','R','R'];if(err>-0.35)return['W','R','R','R'];return['R','R','R','R'];
}
