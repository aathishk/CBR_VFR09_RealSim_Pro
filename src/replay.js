export class ReplayRecorder{
 constructor(){this.recording=false;this.playing=false;this.data=[];this.playIndex=0;this.t=0;this.maxSeconds=900;}
 start(){this.data=[];this.recording=true;this.playing=false;this.t=0;}
 stop(){this.recording=false;}
 sample(state,input,dt){if(!this.recording)return;this.t+=dt;if(this.data.length===0||this.t-this.data[this.data.length-1].t>=.10)this.data.push({t:this.t,state:snapshot(state),input:{...input}});const cutoff=this.t-this.maxSeconds;while(this.data[0]&&this.data[0].t<cutoff)this.data.shift();}
 play(){if(!this.data.length)return false;this.recording=false;this.playing=true;this.playIndex=0;return true;}
 stopPlay(){this.playing=false;}
 next(dt){if(!this.playing)return null;this.playIndex+=dt*10;const i=Math.floor(this.playIndex);if(i>=this.data.length){this.playing=false;return null;}return this.data[i]?.state||null;}
 clear(){this.data=[];this.recording=false;this.playing=false;this.playIndex=0;}
}
function snapshot(s){return JSON.parse(JSON.stringify(s));}
