export const DEG=Math.PI/180;
export const RAD=180/Math.PI;
export const G=9.80665;
export const R=287.05287;
export const GAMMA=1.4;
export const RHO0=1.225;

// Generic trainer profile. These are public-data-inspired engineering targets,
// not manufacturer or flight-test data. Replace the profile to model a specific aircraft.
export const AIRCRAFT={
  id:'trainer-172', name:'CBR Trainer 172',
  dryMass:930, fuelCapacityL:200, fuelDensity:0.72,
  S:16.2,b:10.97,c:1.493,
  Ixx:1285,Iyy:1825,Izz:2667,Ixz:0,
  cg:{x:0,y:0,z:0},
  prop:{diameter:1.90,rpmMax:2700,maxPower:134000,maxStaticThrust:2800,eta:0.78,ctScale:0.66,gearRatio:1},
  aero:{
    CL0:.30,CLa:5.15,CLq:7.4,CLde:.46,
    CD0:.031,k:.045,CDgear:.018,CDflap:[0,.012,.028],
    CYb:-.72,CYp:-.12,CYr:.25,CYda:.025,CYdr:.18,
    Clb:-.11,Clp:-.48,Clr:.15,Clda:.16,Cldr:.02,
    Cm0:.035,Cma:-1.05,Cmq:-12.5,Cmde:-1.20,
    Cnb:.19,Cnp:-.06,Cnr:-.24,Cnda:.015,Cndr:-.12,
    stallAlphaUp:15*DEG,stallAlphaDown:-12*DEG,CLmax:[1.55,1.78,1.98],CLmin:-.75
  },
  perf:{stallKtsClean:48,stallKtsFull:40,cruiseKts:122,climbFpm:700,maxKts:140}
};

export function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
export function wrapPi(a){return ((a+Math.PI)%(2*Math.PI)+2*Math.PI)% (2*Math.PI)-Math.PI;}
export function wrap2Pi(a){return (a%(2*Math.PI)+2*Math.PI)%(2*Math.PI);}
export function lerp(a,b,t){return a+(b-a)*t;}

export class Quat{
  constructor(w=1,x=0,y=0,z=0){this.w=w;this.x=x;this.y=y;this.z=z;}
  static identity(){return new Quat();}
  static fromEuler(phi,theta,psi){
    const cr=Math.cos(phi/2),sr=Math.sin(phi/2),cp=Math.cos(theta/2),sp=Math.sin(theta/2),cy=Math.cos(psi/2),sy=Math.sin(psi/2);
    return new Quat(cr*cp*cy+sr*sp*sy,sr*cp*cy-cr*sp*sy,cr*sp*cy+sr*cp*sy,cr*cp*sy-sr*sp*cy).norm();
  }
  mul(q){return new Quat(
    this.w*q.w-this.x*q.x-this.y*q.y-this.z*q.z,
    this.w*q.x+this.x*q.w+this.y*q.z-this.z*q.y,
    this.w*q.y-this.x*q.z+this.y*q.w+this.z*q.x,
    this.w*q.z+this.x*q.y-this.y*q.x+this.z*q.w);
  }
  conj(){return new Quat(this.w,-this.x,-this.y,-this.z);}
  norm(){const n=Math.hypot(this.w,this.x,this.y,this.z)||1;return new Quat(this.w/n,this.x/n,this.y/n,this.z/n);}
  rotate(v){const qv=new Quat(0,v.x,v.y,v.z);const r=this.mul(qv).mul(this.conj());return{x:r.x,y:r.y,z:r.z};}
  invRotate(v){return this.conj().rotate(v);}
  derivative(p,q,r){
    return {w:.5*(-this.x*p-this.y*q-this.z*r),x:.5*(this.w*p+this.y*r-this.z*q),y:.5*(this.w*q+this.z*p-this.x*r),z:.5*(this.w*r+this.x*q-this.y*p)};
  }
  euler(){const{w,x,y,z}=this;return{
    phi:Math.atan2(2*(w*x+y*z),1-2*(x*x+y*y)),
    theta:Math.asin(clamp(2*(w*y-z*x),-1,1)),
    psi:Math.atan2(2*(w*z+x*y),1-2*(y*y+z*z))
  };}
}

export function isa(alt){
  const h=Math.max(0,alt),T0=288.15,p0=101325,L=.0065;
  if(h<=11000){const T=T0-L*h,p=p0*Math.pow(T/T0,G/(L*R));return{T,p,rho:p/(R*T),a:Math.sqrt(GAMMA*R*T)};}
  const T=216.65,p11=p0*Math.pow(T/T0,G/(L*R)),p=p11*Math.exp(-G*(h-11000)/(R*T));
  return{T,p,rho:p/(R*T),a:Math.sqrt(GAMMA*R*T)};
}

export function metersPerDeg(lat){const r=DEG;return{
  lat:111132.92-559.82*Math.cos(2*lat*r)+1.175*Math.cos(4*lat*r),
  lng:111412.84*Math.cos(lat*r)-93.5*Math.cos(3*lat*r)
};}

export function makeInitial({lat,lng,alt,heading=90,onGround=false}={}){
  return{
    lat,lng,alt,groundAlt:onGround?alt:alt-0.5,
    u:onGround?0:46,v:0,w:onGround?0:3.2,
    p:0,q:0,r:0,quat:Quat.fromEuler(0,onGround?0:2.5*DEG,heading*DEG),
    elevator:0,aileron:0,rudder:0,flaps:onGround?2:0,gear:true,brake:0,
    throttle:onGround?0:.65,rpm:onGround?0:2300,engineRunning:!onGround,
    battery:onGround?true:true,starter:false,startTimer:0,mixture:1,
    trimPitch:.02,trimRoll:0,
    fuel:180,
    windN:0,windE:0,windD:0,
    alpha:0,beta:0,Va:0,qbar:0,mach:0,CL:0,CD:0,CY:0,
    phi:0,theta:onGround?0:2.5*DEG,psi:heading*DEG,heading,ias:0,tas:0,vs:0,g:1,
    loadNz:1,onGround,crashed:false,phase:onGround?'PREFLIGHT':'ENROUTE',score:0,
    touchdown:false,landingGrade:null
  };
}

function massOf(X){return AIRCRAFT.dryMass+Math.max(0,X.fuel)*AIRCRAFT.fuelDensity;}
function flapLift(f){return f===0?0:f===1?.22:.42;}
function flapCLMax(f){return AIRCRAFT.aero.CLmax[Math.max(0,Math.min(2,f))];}
function flapDrag(f){return AIRCRAFT.aero.CDflap[Math.max(0,Math.min(2,f))];}

function liftCoefficient(alpha,qHat,de,flaps){
  const base=AIRCRAFT.aero.CL0+flapLift(flaps)+AIRCRAFT.aero.CLa*alpha+AIRCRAFT.aero.CLq*qHat+AIRCRAFT.aero.CLde*de;
  const aCrit=alpha>=0?AIRCRAFT.aero.stallAlphaUp:AIRCRAFT.aero.stallAlphaDown;
  if(alpha<=AIRCRAFT.aero.stallAlphaUp&&alpha>=AIRCRAFT.aero.stallAlphaDown)return clamp(base,AIRCRAFT.aero.CLmin,flapCLMax(flaps));
  const d=Math.abs(alpha-aCrit)/(10*DEG);
  const s=clamp(Math.exp(-1.35*d)*(1-0.20*d),.08,1);
  const sign=Math.sign(base||alpha||1);
  return clamp(sign*flapCLMax(flaps)*s,AIRCRAFT.aero.CLmin,flapCLMax(flaps)*1.03);
}

function propThrust(X,atm,Va){
  if(!X.engineRunning||X.throttle<=0||X.fuel<=0||X.mixture<=.02)return{T:0,shaftPower:0,torque:0};
  const shaftPower=clamp(AIRCRAFT.prop.maxPower*X.throttle*(.70+.30*clamp(X.rpm/AIRCRAFT.prop.rpmMax,0,1))*X.mixture,0,AIRCRAFT.prop.maxPower);
  const omega=Math.max(20,X.rpm*2*Math.PI/60),torque=shaftPower/omega;
  // Power/airspeed thrust estimate with a static-thrust cap. This behaves like a
  // propeller efficiency envelope: high thrust at low speed, then decreasing
  // thrust as airspeed rises. The model remains intentionally generic.
  const eta=clamp(AIRCRAFT.prop.eta*(.90+.10*clamp(1-Va/70,.0,1)),.45,.82);
  const ideal=eta*shaftPower/Math.max(18,Va);
  const rhoScale=Math.pow(atm.rho/RHO0,.70);
  const T=clamp(ideal,0,AIRCRAFT.prop.maxStaticThrust*rhoScale);
  return{T,shaftPower,torque};
}

export function aeroForces(X,ctrl,world){
  const atm=isa(X.alt);
  const windBody=X.quat.invRotate({x:world.windN||0,y:world.windE||0,z:world.windD||0});
  const va={x:X.u-windBody.x,y:X.v-windBody.y,z:X.w-windBody.z};
  const Va=Math.max(.1,Math.hypot(va.x,va.y,va.z));
  const alpha=Math.atan2(va.z,Math.max(.2,va.x));
  const beta=Math.asin(clamp(va.y/Va,-.999,.999));
  const qbar=.5*atm.rho*Va*Va;
  const pHat=X.p*AIRCRAFT.b/(2*Va),qHat=X.q*AIRCRAFT.c/(2*Va),rHat=X.r*AIRCRAFT.b/(2*Va);
  const mass=massOf(X);
  const hWing=Math.max(.1,X.alt-X.groundAlt);
  const ge=clamp(1/(1+(16*hWing/AIRCRAFT.b)**2),0,.8);
  const clRaw=liftCoefficient(alpha,qHat,ctrl.elevator,X.flaps);
  const CL=clRaw*(1+.08*ge);
  const AR=AIRCRAFT.b*AIRCRAFT.b/AIRCRAFT.S;
  const CDi=AIRCRAFT.aero.k*CL*CL*(1-.55*ge);
  const CD=AIRCRAFT.aero.CD0+flapDrag(X.flaps)+CDi+(X.gear?AIRCRAFT.aero.CDgear:0)+.0025*Math.abs(beta);
  const slip=1+.25*clamp(X.rpm/AIRCRAFT.prop.rpmMax,0,1)*(Va<38?1:(38/Va));
  const CY=AIRCRAFT.aero.CYb*beta+AIRCRAFT.aero.CYp*pHat+AIRCRAFT.aero.CYr*rHat+AIRCRAFT.aero.CYda*ctrl.aileron+AIRCRAFT.aero.CYdr*ctrl.rudder*slip;
  const Cl=AIRCRAFT.aero.Clb*beta+AIRCRAFT.aero.Clp*pHat+AIRCRAFT.aero.Clr*rHat+AIRCRAFT.aero.Clda*ctrl.aileron+AIRCRAFT.aero.Cldr*ctrl.rudder;
  const Cm=AIRCRAFT.aero.Cm0+AIRCRAFT.aero.Cma*alpha+AIRCRAFT.aero.Cmq*qHat+AIRCRAFT.aero.Cmde*ctrl.elevator*slip+ctrl.trimPitch;
  const Cn=AIRCRAFT.aero.Cnb*beta+AIRCRAFT.aero.Cnp*pHat+AIRCRAFT.aero.Cnr*rHat+AIRCRAFT.aero.Cnda*ctrl.aileron+AIRCRAFT.aero.Cndr*ctrl.rudder*slip;
  const L=qbar*AIRCRAFT.S*CL,D=qbar*AIRCRAFT.S*CD,Y=qbar*AIRCRAFT.S*CY;
  const ca=Math.cos(alpha),sa=Math.sin(alpha);
  let Fx=-D*ca+L*sa,Fz=-L*ca-D*sa,Fy=Y;
  const prop=propThrust(X,atm,Va); Fx+=prop.T;
  // Torque and small asymmetric propwash/P-factor terms make the single-engine trainer behave directionally.
  const pFactor=prop.T*Math.sin(alpha)*.025;
  const yawP=prop.T*Math.sin(beta)*.008;
  const Mx=qbar*AIRCRAFT.S*AIRCRAFT.b*Cl-prop.torque*.10;
  const My=qbar*AIRCRAFT.S*AIRCRAFT.c*Cm;
  const Mz=qbar*AIRCRAFT.S*AIRCRAFT.b*Cn+pFactor+yawP;
  const gravityBody=X.quat.invRotate({x:0,y:0,z:G*mass});
  const du=(Fx/mass)+gravityBody.x/mass-X.q*X.w+X.r*X.v;
  const dv=(Fy/mass)+gravityBody.y/mass-X.r*X.u+X.p*X.w;
  const dw=(Fz/mass)+gravityBody.z/mass-X.p*X.v+X.q*X.u;
  const pd=(Mx+(AIRCRAFT.Iyy-AIRCRAFT.Izz)*X.q*X.r)/AIRCRAFT.Ixx;
  const qd=(My+(AIRCRAFT.Izz-AIRCRAFT.Ixx)*X.r*X.p)/AIRCRAFT.Iyy;
  const rd=(Mz+(AIRCRAFT.Ixx-AIRCRAFT.Iyy)*X.p*X.q)/AIRCRAFT.Izz;
  const qdQuat=X.quat.derivative(X.p,X.q,X.r);
  const nedVel=X.quat.rotate({x:X.u,y:X.v,z:X.w});
  const mdeg=metersPerDeg(X.lat);
  const nz=Math.max(.05,Math.hypot(Fy,Fz)/(mass*G));
  return{du,dv,dw,dp:pd,dq:qd,dr:rd,dqw:qdQuat.w,dqx:qdQuat.x,dqy:qdQuat.y,dqz:qdQuat.z,
    dlat:nedVel.x/mdeg.lat,dlng:nedVel.y/mdeg.lng,dalt:-nedVel.z,
    Va,qbar,alpha,beta,CL,CD,CY,T:prop.T,shaftPower:prop.shaftPower,torque:prop.torque,nz,atm,mass,AR,du0:du};
}

function addState(X,D,h){return{...X,
  u:X.u+D.du*h,v:X.v+D.dv*h,w:X.w+D.dw*h,p:X.p+D.dp*h,q:X.q+D.dq*h,r:X.r+D.dr*h,
  quat:new Quat(X.quat.w+D.dqw*h,X.quat.x+D.dqx*h,X.quat.y+D.dqy*h,X.quat.z+D.dqz*h).norm(),
  lat:X.lat+D.dlat*h,lng:X.lng+D.dlng*h,alt:X.alt+D.dalt*h
};}

export function rk4(X,ctrl,world,dt){
  const k1=aeroForces(X,ctrl,world);
  const k2=aeroForces(addState(X,k1,dt/2),ctrl,world);
  const k3=aeroForces(addState(X,k2,dt/2),ctrl,world);
  const k4=aeroForces(addState(X,k3,dt),ctrl,world);
  const h=dt/6;
  const N={...X,
    u:X.u+h*(k1.du+2*k2.du+2*k3.du+k4.du),v:X.v+h*(k1.dv+2*k2.dv+2*k3.dv+k4.dv),w:X.w+h*(k1.dw+2*k2.dw+2*k3.dw+k4.dw),
    p:X.p+h*(k1.dp+2*k2.dp+2*k3.dp+k4.dp),q:X.q+h*(k1.dq+2*k2.dq+2*k3.dq+k4.dq),r:X.r+h*(k1.dr+2*k2.dr+2*k3.dr+k4.dr),
    quat:new Quat(X.quat.w+h*(k1.dqw+2*k2.dqw+2*k3.dqw+k4.dqw),X.quat.x+h*(k1.dqx+2*k2.dqx+2*k3.dqx+k4.dqx),X.quat.y+h*(k1.dqy+2*k2.dqy+2*k3.dqy+k4.dqy),X.quat.z+h*(k1.dqz+2*k2.dqz+2*k3.dqz+k4.dqz)).norm(),
    lat:X.lat+h*(k1.dlat+2*k2.dlat+2*k3.dlat+k4.dlat),lng:X.lng+h*(k1.dlng+2*k2.dlng+2*k3.dlng+k4.dlng),alt:X.alt+h*(k1.dalt+2*k2.dalt+2*k3.dalt+k4.dalt)
  };
  const e=N.quat.euler(),atm=isa(N.alt),ned=N.quat.rotate({x:N.u,y:N.v,z:N.w});
  N.phi=e.phi;N.theta=e.theta;N.psi=wrap2Pi(e.psi);N.heading=N.psi*RAD;N.tas=Math.max(0,Math.hypot(N.u,N.v,N.w));N.Va=N.tas;
  N.ias=N.tas*Math.sqrt(Math.max(.05,atm.rho/RHO0));N.mach=N.tas/atm.a;N.vs=-ned.z;
  N.alpha=Math.atan2(N.w,Math.max(.2,N.u));N.beta=Math.asin(clamp(N.v/Math.max(N.tas,.1),-.999,.999));N.qbar=.5*atm.rho*N.tas*N.tas;
  const snap=aeroForces(N,ctrl,world);N.CL=snap.CL;N.CD=snap.CD;N.CY=snap.CY;N.g=snap.nz;N.loadNz=snap.nz;N.thrust=snap.T;N.shaftPower=snap.shaftPower;
  return N;
}

export function applyGround(X,dt){
  const height=X.alt-X.groundAlt;
  if(X.onGround){
    X.alt=X.groundAlt+.35;X.w=0;
    const decel=0.9+X.brake*3.2;X.u=Math.max(0,X.u-decel*dt);X.v*=Math.max(0,1-7*dt);X.p*=Math.max(0,1-7*dt);X.q*=Math.max(0,1-7*dt);X.r*=Math.max(0,1-3*dt);
    const e=X.quat.euler();X.quat=Quat.fromEuler(e.phi*.94,0,e.psi+X.r*dt);
    if(X.u>25 && X.throttle>.48 && !X.gear)X.onGround=false;
    return X;
  }
  if(height<=.2){
    const speed=Math.max(0,X.Va),sink=Math.abs(X.vs),bank=Math.abs(X.phi*RAD);
    const hard=speed>24 || sink>3.0 || bank>25;
    if(hard){X.crashed=true;X.phase='CRASHED';X.engineRunning=false;X.onGround=true;X.alt=X.groundAlt+.2;return X;}
    X.touchdown=true;X.onGround=true;X.alt=X.groundAlt+.35;X.phase='LANDING';X.gear=true;X.flaps=Math.max(X.flaps,1);
  }
  return X;
}

export function flightControl(X,input){
  const maxQ=.55,maxP=.95,maxR=.42;
  // Mild SAS/FBW: with centered controls the trainer tends to hold wings-level
  // and near-zero pitch rather than behaving like an unstable point-mass toy.
  // Neutral stick should settle the trainer into a shallow, trimmed cruise attitude
  // rather than commanding an arbitrary zero-pitch attitude. The vertical-speed term
  // adds a gentle phugoid damper so the default flight remains stable without an
  // arcade-style altitude clamp.
  const cruisePitch=4.0*DEG;
  const pitchHold=clamp((cruisePitch-X.theta)*1.15-X.vs*0.035,-.32,.32);
  const rollHold=clamp(-X.phi*.85,-.55,.55);
  const coordinatedTurn=clamp(Math.sin(X.phi)*.18,-.25,.25);
  const qCmd=input.pitch*maxQ+pitchHold;
  const pCmd=input.roll*maxP+rollHold;
  const rCmd=input.yaw*maxR+coordinatedTurn;
  // Physical surface signs follow conventional body-axis derivatives: Cm_de and Cn_dr are negative,
  // so pilot nose-up / yaw-right commands are applied with the opposite surface-deflection sign.
  const de=clamp(-(qCmd-X.q)*1.02-X.q*.18-input.trimPitch-X.trimPitch,-.38,.38);
  const da=clamp((pCmd-X.p)*.60-X.p*.11,-.30,.30);
  const dr=clamp(-(rCmd-X.r)*.92-X.r*.12-X.beta*.25,-.32,.32);
  return{elevator:de,aileron:da,rudder:dr,flaps:X.flaps,gear:X.gear,trimPitch:X.trimPitch};
}

export function performanceStep(X,input,world,dt){
  X.throttle=clamp(input.throttle,0,1);X.brake=input.brake||0;X.flaps=input.flaps??X.flaps;X.gear=input.gear??X.gear;X.trimPitch=clamp(input.trimPitch??X.trimPitch,-.22,.22);
  X.battery=input.battery??X.battery;X.mixture=input.mixture??X.mixture;
  if(input.engineStart){if(X.battery&&X.fuel>1&&!X.engineRunning){X.starter=true;X.startTimer=0;}}
  if(input.engineStop){X.engineRunning=false;X.starter=false;X.rpm=Math.min(X.rpm,600);}
  if(X.starter&&!X.engineRunning){X.startTimer+=dt;X.rpm=Math.min(950,X.rpm+dt*260);if(X.rpm>650&&X.startTimer>1.8)X.engineRunning=true;if(X.startTimer>10){X.starter=false;X.rpm=Math.max(0,X.rpm-100);}}
  if(X.engineRunning)X.starter=false;
  const targetRpm=X.engineRunning?(850+1950*X.throttle*(.82+.18*X.mixture)):(X.starter?900:0);
  X.rpm+= (targetRpm-X.rpm)*Math.min(1,dt*2.6);
  if(X.rpm>AIRCRAFT.prop.rpmMax)X.rpm=AIRCRAFT.prop.rpmMax;
  const surfaces=flightControl(X,input);
  const ctrl={...surfaces,flaps:X.flaps,gear:X.gear,trimPitch:X.trimPitch};
  let n=X;const maxSub=.01,steps=Math.max(1,Math.ceil(dt/maxSub)),sub=dt/steps;
  for(let i=0;i<steps;i++){n=rk4(n,ctrl,world,sub);n=applyGround(n,sub);if(n.crashed)break;}
  const fuelRate=X.engineRunning?(.009*clamp(X.throttle,0,1)):.0;n.fuel=Math.max(0,n.fuel-fuelRate*dt);if(n.fuel<=0)n.engineRunning=false;
  n.N1=clamp(n.rpm/AIRCRAFT.prop.rpmMax*100,0,100);
  n.phase=phaseOf(n);
  return n;
}
function phaseOf(X){if(X.crashed)return'CRASHED';if(X.onGround&&X.Va<3)return'PARKED';if(X.onGround)return X.Va<18?'TAXI':'TAKEOFF';if(X.alt-X.groundAlt<180)return X.vs>1?'CLIMB':'FINAL';if(X.vs>1.0)return'CLIMB';if(X.vs<-1.0)return'DESCENT';return'CRUISE';}

export function createWindFromMetar(metar){
  if(!metar)return{windN:0,windE:0,windD:0,gustKt:0,speedKt:0,dirDeg:null};
  const dir=Number(metar.wdir),spd=Number(metar.wspd)||0,gust=Number(metar.wgst)||0;
  if(!Number.isFinite(dir)||dir>=360)return{windN:0,windE:0,windD:0,gustKt:gust,speedKt:spd,dirDeg:null};
  const kt=.514444;return{windN:-Math.cos(dir*DEG)*spd*kt,windE:-Math.sin(dir*DEG)*spd*kt,windD:0,gustKt:gust,speedKt:spd,dirDeg:dir};
}
