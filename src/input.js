const DEAD=.12;
function clamp(v,a,b){return Math.max(a,Math.min(b,v));}
export class InputFusion{
 constructor(){this.keys={};this.gamepad=null;this.phone={active:false,pitch:0,roll:0,yaw:0,neutral:{p:0,r:0,y:0},throttle:.65,boost:false};this.imu={active:false,pitch:0,roll:0,yaw:0,neutral:{p:0,r:0,y:0}};this.throttle=.65;this.flaps=0;this.gear=true;this.brake=0;this.trim=.02;this.ap=false;this.pulses={};this.prevButtons={};this.bind();}
 bind(){addEventListener('keydown',e=>{const k=e.key.toLowerCase();this.keys[k]=true;if([' ','shift','control','tab','arrowup','arrowdown','arrowleft','arrowright'].includes(k))e.preventDefault();});addEventListener('keyup',e=>this.keys[e.key.toLowerCase()]=false);addEventListener('gamepadconnected',e=>{this.gamepad=e.gamepad;});addEventListener('gamepaddisconnected',e=>{if(this.gamepad?.index===e.gamepad.index)this.gamepad=null;});}
 dz(v){return Math.abs(v)<DEAD?0:Math.sign(v)*(Math.abs(v)-DEAD)/(1-DEAD);}
 poll(){const g=this.gamepad||(navigator.getGamepads?.()||[]).find(x=>x?.connected);if(g)this.gamepad=g;const k=this.keys;
  let pitch=(k.w?1:0)-(k.s?1:0),roll=(k.d?1:0)-(k.a?1:0),yaw=(k.e?1:0)-(k.q?1:0);
  if(g){pitch=-this.dz(g.axes[1]||0);roll=this.dz(g.axes[0]||0);yaw=this.dz(g.axes[2]||0);const rt=g.buttons[7]?.value||0,lt=g.buttons[6]?.value||0;this.throttle=clamp(.5+.5*(rt-lt),0,1);
   const mapping={0:'A',1:'B',2:'X',3:'Y',4:'LB',5:'RB',8:'SEL',9:'STA',10:'L3',11:'R3',12:'UP',13:'DOWN',14:'LEFT',15:'RIGHT'};
   for(const [idx,name] of Object.entries(mapping)){const now=!!g.buttons[Number(idx)]?.pressed;if(now&&!this.prevButtons[name])this.pulses[name]=true;this.prevButtons[name]=now;}
   if(this.pulses.A)this.pulses.view=true;if(this.pulses.B)this.pulses.reset=true;if(this.pulses.X)this.pulses.calibrate=true;if(this.pulses.Y)this.pulses.autopilot=true;if(this.pulses.RB)this.gear=!this.gear;if(this.pulses.LB)this.flaps=(this.flaps+1)%3;
  }
  if(this.phone.active){pitch=this.phone.pitch;roll=this.phone.roll;yaw=this.phone.yaw;this.throttle=this.phone.throttle;}
  if(this.imu.active){pitch=this.imu.pitch;roll=this.imu.roll;yaw=this.imu.yaw;}
  if(k.shift)this.throttle=clamp(this.throttle+.32/60,0,1);if(k.control)this.throttle=clamp(this.throttle-.32/60,0,1);
  if(k.f&&!this._f)this.flaps=(this.flaps+1)%3;this._f=!!k.f;if(k.g&&!this._g)this.gear=!this.gear;this._g=!!k.g;
  if(k.z)this.trim=clamp(this.trim-.0015,-.22,.22);if(k.x)this.trim=clamp(this.trim+.0015,-.22,.22);this.brake=k.b?1:0;
  if(k.p&&!this._p)this.ap=!this.ap;this._p=!!k.p;
  const input={pitch:clamp(pitch,-1,1),roll:clamp(roll,-1,1),yaw:clamp(yaw,-1,1),throttle:this.throttle,flaps:this.flaps,gear:this.gear,brake:this.brake,trimPitch:this.trim,engineStart:!!(k.i&&!this._engineKey),engineStop:!!(k.m&&!this._m),source:this.imu.active?'ESP32 / MPU6050':this.phone.active?'PHONE GYRO':g?'GAMEPAD':'KEYBOARD'};
  this._engineKey=!!k.i;this._m=!!k.m;
  input.boost=this.phone.boost||!!this.pulses.L3;input.events={...this.pulses};this.pulses={};return input;
 }
 applyPhone(d){if(d.type==='phone-calibrate'){this.phone.neutral={p:d.pitch||0,r:d.roll||0,y:d.yaw||0};return;}if(d.type==='phone-data'){const p=(d.pitch||0)-this.phone.neutral.p,r=(d.roll||0)-this.phone.neutral.r,y=((d.yaw||0)-this.phone.neutral.y+540)%360-180;this.phone={...this.phone,active:true,pitch:clamp(p/28,-1,1),roll:clamp(r/34,-1,1),yaw:clamp(y/45,-1,1),throttle:Number.isFinite(d.throttle)?clamp(d.throttle,0,1):this.phone.throttle,boost:!!d.boost};}}
 applyIMU(d){this.imu={...this.imu,active:true,pitch:clamp(((d.pitch||0)-this.imu.neutral.p)/30,-1,1),roll:clamp(((d.roll||0)-this.imu.neutral.r)/35,-1,1),yaw:clamp(((d.yaw||0)-this.imu.neutral.y)/45,-1,1),raw:{p:d.pitch||0,r:d.roll||0,y:d.yaw||0}};}
 calibrateIMU(){const raw=this.imu.raw||{p:0,r:0,y:0};this.imu.neutral={...raw};}
}
