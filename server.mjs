import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer} from 'ws';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
loadDotEnv(path.join(ROOT,'.env'));
const PORT=Number(process.env.PORT||4173),WS_PORT=Number(process.env.WS_PORT||3001);
const GOOGLE_MAPS_API_KEY=String(process.env.GOOGLE_MAPS_API_KEY||'').trim();
const CESIUM_ION_TOKEN=String(process.env.CESIUM_ION_TOKEN||'').trim();
const OS_CLIENT_ID=String(process.env.OPENSKY_CLIENT_ID||'').trim();
const OS_CLIENT_SECRET=String(process.env.OPENSKY_CLIENT_SECRET||'').trim();
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.ico':'image/x-icon','.md':'text/markdown; charset=utf-8','.txt':'text/plain; charset=utf-8'};
function loadDotEnv(file){if(!fs.existsSync(file))return;for(const raw of fs.readFileSync(file,'utf8').split(/\r?\n/)){const line=raw.trim();if(!line||line.startsWith('#'))continue;const i=line.indexOf('=');if(i<1)continue;const key=line.slice(0,i).trim(),value=line.slice(i+1).trim().replace(/^['"]|['"]$/g,'');if(!process.env[key])process.env[key]=value;}}
function json(res,status,data){const body=JSON.stringify(data);res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','access-control-allow-origin':'*'});res.end(body);}
function config(){return{googleMapsApiKey:GOOGLE_MAPS_API_KEY,cesiumIonToken:CESIUM_ION_TOKEN,wsPort:WS_PORT,version:'VFR-09'};}
function safeFile(requestPath){let decoded;try{decoded=decodeURIComponent(requestPath)}catch{throw new Error('bad path')};const candidate=path.resolve(ROOT,'.'+(decoded==='/'?'/index.html':decoded));if(candidate!==ROOT&&!candidate.startsWith(ROOT+path.sep))throw Object.assign(new Error('forbidden'),{code:403});return candidate;}
function fetchText(target,headers={}){return new Promise((resolve,reject)=>{const u=new URL(target);if(u.protocol!=='https:')return reject(new Error('HTTPS only'));const req=https.get(u,{headers:{'user-agent':'CBR-VFR09/0.9 educational simulator',...headers},timeout:15000},r=>{let d='';r.setEncoding('utf8');r.on('data',c=>d+=c);r.on('end',()=>{if(r.statusCode>=200&&r.statusCode<300)resolve(d);else reject(new Error(`Upstream HTTP ${r.statusCode}`));});});req.on('timeout',()=>req.destroy(new Error('upstream timeout')));req.on('error',reject);});}
async function proxyMetar(icao){return cacheGet(`metar:${icao}`,30000,async()=>JSON.parse(await fetchText(`https://aviationweather.gov/api/data/metar?ids=${encodeURIComponent(icao)}&format=json`)));}
async function openSkyToken(){if(!OS_CLIENT_ID||!OS_CLIENT_SECRET)return null;const body='grant_type=client_credentials';return new Promise((resolve,reject)=>{const req=https.request('https://auth.opensky-network.org/auth/realms/opensky-network/protocol/openid-connect/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','content-length':Buffer.byteLength(body)},timeout:12000},r=>{let d='';r.setEncoding('utf8');r.on('data',c=>d+=c);r.on('end',()=>{if(r.statusCode>=200&&r.statusCode<300){try{resolve(JSON.parse(d).access_token)}catch{resolve(null)}}else reject(new Error(`OpenSky auth ${r.statusCode}`));});});req.on('timeout',()=>req.destroy(new Error('auth timeout')));req.on('error',reject);req.write(body);req.end();});}
let tokenCache={value:null,expires:0};async function getToken(){if(tokenCache.value&&Date.now()<tokenCache.expires)return tokenCache.value;try{const value=await openSkyToken();tokenCache={value,expires:value?Date.now()+8*60*1000:0};return value;}catch{return null;}}
async function proxyOpenSky(query){return cacheGet(`opensky:${query.toString()}`,15000,async()=>{const token=await getToken();return JSON.parse(await fetchText(`https://opensky-network.org/api/states/all?${query}`,token?{authorization:`Bearer ${token}`}:{ }));});}
async function proxyBuildings(bbox){return cacheGet(`buildings:${bbox}`,600000,async()=>{const q=`[out:json][timeout:25];way[building](${bbox});out geom;`;const body=`data=${encodeURIComponent(q)}`;const txt=await new Promise((resolve,reject)=>{const req=https.request('https://overpass-api.de/api/interpreter',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded','content-length':Buffer.byteLength(body),'user-agent':'CBR-VFR09/0.9 educational simulator'},timeout:30000},r=>{let d='';r.setEncoding('utf8');r.on('data',c=>d+=c);r.on('end',()=>r.statusCode>=200&&r.statusCode<300?resolve(d):reject(new Error(`Overpass HTTP ${r.statusCode}`)));});req.on('timeout',()=>req.destroy(new Error('Overpass timeout')));req.on('error',reject);req.write(body);req.end();});return JSON.parse(txt);});}
const caches=new Map();function cacheGet(key,ttl,fn){const hit=caches.get(key);if(hit&&Date.now()-hit.t<ttl)return hit.v;return Promise.resolve(fn()).then(v=>{caches.set(key,{t:Date.now(),v});return v;});}

const server=http.createServer(async(req,res)=>{try{const u=new URL(req.url,`http://${req.headers.host}`);
 if(u.pathname==='/config.js'){res.writeHead(200,{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'});return res.end(`window.CBR_CONFIG=${JSON.stringify(config())};`);}
 if(u.pathname==='/api/health')return json(res,200,{ok:true,version:'VFR-09',time:new Date().toISOString(),photoreal:!!GOOGLE_MAPS_API_KEY||!!CESIUM_ION_TOKEN});
 if(u.pathname==='/api/metar'){const icao=(u.searchParams.get('icao')||'VOCB').toUpperCase().replace(/[^A-Z0-9]/g,'');return json(res,200,await proxyMetar(icao));}
 if(u.pathname==='/api/opensky'){const q=new URLSearchParams();for(const k of ['lamin','lomin','lamax','lomax'])if(u.searchParams.has(k))q.set(k,u.searchParams.get(k));return json(res,200,await proxyOpenSky(q));}
 if(u.pathname==='/api/buildings'){const bbox=u.searchParams.get('bbox');if(!bbox)return json(res,400,{error:'bbox required'});return json(res,200,await proxyBuildings(bbox));}
 const file=safeFile(u.pathname);if(!fs.existsSync(file)||fs.statSync(file).isDirectory())return json(res,404,{error:'not found'});res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-cache'});fs.createReadStream(file).pipe(res);
 }catch(e){const status=e.code===403?403:502;console.error('[CBR]',e);return json(res,status,{error:e.message||'server error'});}});
server.listen(PORT,'0.0.0.0',()=>console.log(`CBR VFR-09 → http://localhost:${PORT}`));
const wss=new WebSocketServer({port:WS_PORT});const peers=new Set();wss.on('connection',ws=>{peers.add(ws);ws.on('message',raw=>{for(const p of peers){if(p!==ws&&p.readyState===1)p.send(raw.toString())}});ws.on('close',()=>peers.delete(ws));ws.on('error',()=>peers.delete(ws));});console.log(`Phone/multiplayer WebSocket → ws://localhost:${WS_PORT}`);
