import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js";

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xa7cfe4);
scene.fog=new THREE.FogExp2(0xa7cfe4,.0022);

const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,700);
camera.rotation.order="YXZ";
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.08;
document.querySelector("#game").appendChild(renderer.domElement);

const hemi=new THREE.HemisphereLight(0xeaf6ff,0x6f7659,2.0);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffefd2,3.0);sun.position.set(-75,105,45);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-90;sun.shadow.camera.right=90;sun.shadow.camera.top=90;sun.shadow.camera.bottom=-90;scene.add(sun);

const solids=[],nightLights=[];
const M=(c,r=.82,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
function box(x,y,z,w,h,d,c,solid=false,material=null){
 const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material||M(c));o.position.set(x,y,z);o.castShadow=h>1;o.receiveShadow=true;scene.add(o);
 if(solid)solids.push({a:x-w/2,b:x+w/2,c:z-d/2,d:z+d/2});return o;
}
function cyl(x,y,z,r,h,c,n=12){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,n),M(c));o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o}
function texture(draw,rx=1,ry=1){
 const c=document.createElement("canvas");c.width=c.height=256;const g=c.getContext("2d");draw(g,256);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const asphalt=texture((g,s)=>{g.fillStyle="#565a59";g.fillRect(0,0,s,s);for(let i=0;i<2200;i++){const q=55+Math.random()*55;g.fillStyle="rgb("+q+","+q+","+q+")";g.fillRect(Math.random()*s,Math.random()*s,1,1)}},4,55);
const pavers=texture((g,s)=>{g.fillStyle="#aaa69b";g.fillRect(0,0,s,s);g.strokeStyle="#7d7b73";g.lineWidth=1;for(let y=0;y<s;y+=18){g.beginPath();g.moveTo(0,y);g.lineTo(s,y);g.stroke()}for(let y=0;y<s;y+=36)for(let x=0;x<s;x+=36){g.strokeRect(x+(y%72?18:0),y,36,18)}},3,55);
const grass=texture((g,s)=>{g.fillStyle="#70875c";g.fillRect(0,0,s,s);for(let i=0;i<900;i++){g.fillStyle=Math.random()>.5?"#667e52":"#7f9369";g.fillRect(Math.random()*s,Math.random()*s,2,2)}},18,25);
const concrete=texture((g,s)=>{g.fillStyle="#b9b3a7";g.fillRect(0,0,s,s);for(let i=0;i<450;i++){g.fillStyle="#9f9a90";g.fillRect(Math.random()*s,Math.random()*s,1,1)}},3,3);
function slab(x,z,w,d,map,y=.05){const o=new THREE.Mesh(new THREE.BoxGeometry(w,.1,d),new THREE.MeshStandardMaterial({map,roughness:.95}));o.position.set(x,y,z);o.receiveShadow=true;scene.add(o);return o}

// terrain and a real street network rather than one corridor
slab(0,0,360,430,grass,-.03);
slab(0,0,23,390,asphalt,.03);
slab(-15.2,0,7,390,pavers,.09);slab(15.2,0,7,390,pavers,.09);
for(const z of[-110,-35,55,135]){slab(0,z,150,15,asphalt,.04);slab(0,z-10,150,5,pavers,.08);slab(0,z+10,150,5,pavers,.08)}
// road markings
for(let z=-185;z<190;z+=13){box(-5.6,.13,z,.16,.025,5.5,0xf0eee3);box(5.6,.13,z,.16,.025,5.5,0xf0eee3)}
for(const z of[-110,-35,55,135])for(let x=-68;x<70;x+=13)box(x,.14,z,5.5,.025,.16,0xf0eee3);
for(const z of[-110,-35,55,135])for(let x=-8;x<=8;x+=2.2){box(x,.15,z-8,1.25,.025,3.4,0xf4f1e6);box(x,.15,z+8,1.25,.025,3.4,0xf4f1e6)}

// façade helpers
function plane(x,y,z,w,h,color,side){
 const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),M(color,.45,.08));o.position.set(x,y,z);o.rotation.y=side>0?Math.PI/2:-Math.PI/2;scene.add(o);return o
}
function canvasSign(text,bg="#2e5b42",fg="#fff"){
 const c=document.createElement("canvas");c.width=512;c.height=128;const g=c.getContext("2d");g.fillStyle=bg;g.fillRect(0,0,512,128);
 g.fillStyle=fg;g.font="700 45px Arial";g.textAlign="center";g.textBaseline="middle";g.fillText(text,256,64);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t});
}
const facadeColors=[0xc4aa83,0xd0c8ae,0xb9825d,0xa9afa4,0xd0a270,0xb8b39f,0xd8c8b2];
const shops=["MARKET","ECZANE","FIRIN","LOKANTA","KAFE","PASTANE","BERBER","TEKSTİL"];
function building(x,z,w,d,floors,seed){
 const side=x<0?1:-1, h=3.4+floors*3.05, color=facadeColors[seed%facadeColors.length];
 box(x,h/2,z,w,h,d,color,true);
 const face=x+side*(w/2+.025);
 // ground-floor stone strip + deep storefront
 box(face-side*.03,1.65,z,.18,3.3,d*.93,0x353a3a);
 for(let s=-1;s<=1;s++){
  const zz=z+s*d*.29;
  plane(face+side*.11,1.65,zz,2.15,2.25,0x58727a,side);
 }
 // shop sign
 const sm=canvasSign(shops[seed%shops.length],["#286244","#a62626","#a2672e","#5b493c"][seed%4]);
 const sg=new THREE.Mesh(new THREE.PlaneGeometry(5.4,1.0),sm);sg.position.set(face+side*.14,3.0,z);sg.rotation.y=side>0?Math.PI/2:-Math.PI/2;scene.add(sg);
 // floors: framed windows, balconies, AC units
 for(let floor=0;floor<floors;floor++){
  const yy=5.05+floor*3.05;
  for(let k=-2;k<=2;k++){
   const zz=z+k*(d*.145);
   box(face,yy,zz,.16,1.6,1.35,0xe5ddce);
   box(face+side*.08,yy,zz,.12,1.28,1.05,0x526d78);
   box(face+side*.13,yy-.87,zz,.22,.09,1.55,0x8d877b);
  }
  if(floor%2===seed%2){
   box(face+side*.58,yy-.65,z,.95,.16,d*.42,0xb7b1a4);
   // balcony rail
   box(face+side*1.02,yy-.08,z,.07,1.0,d*.42,0x4b5050);
   for(let q=-2;q<=2;q++)box(face+side*.78,yy-.08,z+q*d*.095,.08,1,.08,0x4b5050);
  }
  if((floor+seed)%3===0){
   box(face+side*.26,yy-.55,z+d*.35,.48,.5,.85,0xe7e4da);
   box(face+side*.52,yy-.55,z+d*.35,.05,.34,.58,0x777b79);
  }
 }
 // roof parapet, water tank, antenna
 box(x,h+.28,z,w+.25,.55,d+.25,0xa49d90);
 box(x-side*2.1,h+1.05,z+d*.2,2.0,1.1,1.5,0xc4c0b6);
 cyl(x+side*2.3,h+1.45,z-d*.18,.05,2.5,0x55595a,8);
}
// main avenue buildings with varied setbacks/heights
let seed=0;
for(let z=-170;z<=170;z+=27){
 if([-110,-35,55,135].some(q=>Math.abs(z-q)<13))continue;
 building(-28-(seed%3)*1.3,z,17,21,3+(seed%4),seed++);
 building(28+(seed%2)*1.5,z+7,18,22,3+(seed%5),seed++);
}
// buildings visible down side streets
for(const z of[-110,-35,55,135])for(const x of[-60,-46,46,60]){
 building(x,z+(x<0?-18:18),16,17,3+((Math.abs(x)+Math.abs(z))%3),seed++);
}

// greenery based on Iğdır's tree-lined central streets
function tree(x,z,s=1){
 cyl(x,2.1*s,z,.38*s,4.2*s,0x5c4531,10);
 const a=[[0,5.2,0,2.25],[1.15,5.25,.15,1.55],[-1.1,5.05,.2,1.6],[.1,6.45,0,1.6]];
 for(const q of a){const o=new THREE.Mesh(new THREE.IcosahedronGeometry(q[3]*s,1),M(Math.random()>.45?0x426d32:0x527b39));o.position.set(x+q[0]*s,q[1]*s,z+q[2]*s);o.castShadow=true;scene.add(o)}
}
for(let z=-178;z<=180;z+=15){if(![-110,-35,55,135].some(q=>Math.abs(z-q)<11)){tree(-18.3,z,.9);tree(18.3,z+7,.94)}}

// lamps with actual emissive fixtures + point lights only nearby
function lamp(x,z,flip=1){
 cyl(x,3.8,z,.085,7.6,0x44494a,8);box(x+flip*.55,7.52,z,1.15,.08,.08,0x44494a);
 const bulb=box(x+flip*1.05,7.43,z,.35,.16,.3,0xffd890,false,new THREE.MeshStandardMaterial({color:0xffdf9c,emissive:0xffa52e,emissiveIntensity:.3}));
 const light=new THREE.PointLight(0xffb65b,0,18,2);light.position.set(x+flip*1.05,7.25,z);scene.add(light);nightLights.push(light);
}
for(let z=-170;z<=170;z+=27){lamp(-10,z,1);lamp(10,z+13,-1)}

// street furniture
function bench(x,z,r=0){const g=new THREE.Group();for(const zz of[-.18,.18]){const s=new THREE.Mesh(new THREE.BoxGeometry(2.1,.12,.25),M(0x76533c));s.position.set(0,.68,zz);g.add(s)}for(const xx of[-.75,.75]){const l=new THREE.Mesh(new THREE.BoxGeometry(.1,.65,.1),M(0x353a3b,.5,.3));l.position.set(xx,.34,0);g.add(l)}g.position.set(x,0,z);g.rotation.y=r;scene.add(g)}
for(let z=-145;z<=150;z+=58){bench(-16,z,Math.PI/2);bench(16,z+22,-Math.PI/2)}
for(let z=-160;z<165;z+=20){cyl(-11.8,.35,z,.1,.7,0x4d5353,8);cyl(11.8,.35,z+10,.1,.7,0x4d5353,8)}

// traffic lights
function trafficLight(x,z,rot=0){
 const g=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,5.4,8),M(0x3b4142));pole.position.y=2.7;g.add(pole);
 const h=new THREE.Mesh(new THREE.BoxGeometry(.48,1.35,.48),M(0x202526));h.position.y=5.1;g.add(h);
 for(const [y,c] of [[5.5,0xd63b31],[5.1,0xd5a42f],[4.7,0x3a9b55]]){const l=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:.35}));l.position.set(0,y,.25);g.add(l)}
 g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);
}
for(const z of[-110,-35,55,135]){trafficLight(-10,z);trafficLight(10,z,Math.PI)}

// parked cars with wheels/windows
function car(x,z,color,rot=0){
 const g=new THREE.Group(),body=M(color,.45,.12),glass=M(0x354d58,.22,.1),rubber=M(0x1d2020,.9);
 const b=new THREE.Mesh(new THREE.BoxGeometry(3.8,.72,1.72),body);b.position.y=.72;g.add(b);
 const top=new THREE.Mesh(new THREE.BoxGeometry(2.05,.68,1.48),glass);top.position.set(-.25,1.35,0);g.add(top);
 for(const xx of[-1.15,1.15])for(const zz of[-.9,.9]){const w=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.18,12),rubber);w.rotation.x=Math.PI/2;w.position.set(xx,.43,zz*.82);g.add(w)}
 g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);
}
const carColors=[0xe3e1db,0x30383c,0x8f302b,0x64757a,0xb8b9b6];
[-150,-86,-8,82,160].forEach((z,i)=>car(-7.9,z,carColors[i%5]));
[-132,-58,22,108].forEach((z,i)=>car(7.9,z,carColors[(i+2)%5]));

// small square / landscaped area
slab(-48,78,28,34,pavers,.1);
for(const p of [[-56,68],[-42,67],[-55,88],[-41,89]])tree(p[0],p[1],1.0);
for(const p of [[-49,69],[-49,87]])bench(p[0],p[1],0);
const monument=box(-48,1.0,78,4.5,2,4.5,0xbab3a2);box(-48,3.0,78,1.1,4,1.1,0x8b8170);

// broad custom Ağrı Dağı + Küçük Ağrı silhouettes
function mountain(cx,cz,radius,height,color,snow=false){
 const seg=64,rings=22,verts=[],idx=[];
 for(let j=0;j<=rings;j++){const t=j/rings,rad=radius*(1-Math.pow(t,1.55));const y=t*height;for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2;const noise=(Math.sin(i*2.7+j*1.8)+Math.sin(i*.8-j*2.2))*.8*(1-t);verts.push(cx+Math.cos(a)*(rad+noise),y,cz+Math.sin(a)*(rad+noise*.55))}}
 for(let j=0;j<rings;j++)for(let i=0;i<seg;i++){const n=(i+1)%seg,a=j*seg+i,b=j*seg+n,c=(j+1)*seg+i,d=(j+1)*seg+n;idx.push(a,c,b,b,c,d)}
 const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));geo.setIndex(idx);geo.computeVertexNormals();
 const o=new THREE.Mesh(geo,M(color,1));scene.add(o);
 if(snow){const cap=new THREE.Mesh(new THREE.ConeGeometry(radius*.24,height*.23,48),M(0xf0eee7,.9));cap.position.set(cx,height*.885,cz);cap.scale.z=.58;scene.add(cap)}
}
mountain(-5,-360,112,125,0x716d68,true);mountain(108,-354,52,72,0x77716b,false);


// external GLB population assets
const loader=new GLTFLoader();
const walkers=[];
function fitModel(obj,targetHeight){
 const b=new THREE.Box3().setFromObject(obj),s=new THREE.Vector3();b.getSize(s);
 const k=targetHeight/Math.max(s.y,.001);obj.scale.setScalar(k);
 const b2=new THREE.Box3().setFromObject(obj);obj.position.y-=b2.min.y;
}
function loadPopulation(){
 loader.load("./assets/human.glb",g=>{
  const template=g.scene;fitModel(template,1.72);
  const spots=[[-14,142,Math.PI],[-17,105,0],[14,82,Math.PI],[17,22,0],[-16,-12,Math.PI],[15,-70,0],[-17,-145,Math.PI],[16,-160,0]];
  spots.forEach((p,i)=>{const o=template.clone(true);o.position.x=p[0];o.position.z=p[1];o.rotation.y=p[2];o.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});scene.add(o);walkers.push({o,dir:i%2?1:-1,speed:.35+(i%3)*.08,baseX:p[0]})});
 },undefined,e=>console.warn("human.glb kon niet laden",e));
 loader.load("./assets/generic_80s_european_car.glb",g=>{
  const template=g.scene;fitModel(template,1.45);
  const spots=[[-7.7,126,0],[7.7,65,Math.PI],[-7.7,-52,0],[7.7,-142,Math.PI],[-50,-103,Math.PI/2],[50,60,-Math.PI/2]];
  spots.forEach(p=>{const o=template.clone(true);o.position.set(p[0],0,p[1]);o.rotation.y=p[2];o.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});scene.add(o)});
 },undefined,e=>console.warn("car.glb kon niet laden",e));
}
loadPopulation();

// menu cinematic / player
const p={pos:new THREE.Vector3(0,1.72,165),velY:0,ground:true,r:.38};camera.position.copy(p.pos);
let yaw=0,pitch=0,locked=false,isNight=false;const keys={};
const start=document.querySelector("#start"),transition=document.querySelector("#transition");
document.querySelector("#play").onclick=()=>{transition.classList.add("show");setTimeout(()=>renderer.domElement.requestPointerLock(),380);setTimeout(()=>transition.classList.remove("show"),820)};
document.addEventListener("pointerlockchange",()=>{locked=document.pointerLockElement===renderer.domElement;start.style.display=locked?"none":"block"});
document.addEventListener("mousemove",e=>{if(!locked)return;yaw-=e.movementX*.002;pitch-=e.movementY*.002;pitch=Math.max(-1.45,Math.min(1.45,pitch));camera.rotation.set(pitch,yaw,0)});
function setNight(v){isNight=v;scene.background.set(v?0x17263b:0xa7cfe4);scene.fog.color.set(v?0x17263b:0xa7cfe4);hemi.intensity=v?.48:2;sun.intensity=v?.22:3;renderer.toneMappingExposure=v?.72:1.08;nightLights.forEach(l=>l.intensity=v?7:0)}
document.addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="Space"&&p.ground){p.velY=6.4;p.ground=false}if(e.code==="KeyN")setNight(!isNight)});
document.addEventListener("keyup",e=>keys[e.code]=false);
function hit(x,z){for(const o of solids)if(x+p.r>o.a&&x-p.r<o.b&&z+p.r>o.c&&z-p.r<o.d)return true;return false}
const clock=new THREE.Clock();
function loop(){
 requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04);
 if(locked){
  const f=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),r=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),v=new THREE.Vector3();
  if(keys.KeyW)v.add(f);if(keys.KeyS)v.sub(f);if(keys.KeyD)v.add(r);if(keys.KeyA)v.sub(r);
  if(v.lengthSq())v.normalize().multiplyScalar((keys.ShiftLeft?8.5:5.3)*dt);
  if(!hit(p.pos.x+v.x,p.pos.z))p.pos.x+=v.x;if(!hit(p.pos.x,p.pos.z+v.z))p.pos.z+=v.z;
  p.velY-=18*dt;p.pos.y+=p.velY*dt;if(p.pos.y<=1.72){p.pos.y=1.72;p.velY=0;p.ground=true}
  camera.position.copy(p.pos);if(v.lengthSq()&&p.ground)camera.position.y+=Math.sin(performance.now()*.011)*.024;
 }else{
  const t=performance.now()*.0001;camera.position.set(Math.sin(t)*42,10,128+Math.cos(t)*25);camera.lookAt(0,5,-45);
 }
 walkers.forEach(w=>{w.o.position.z+=w.dir*w.speed*dt;if(w.o.position.z>178||w.o.position.z<-178){w.dir*=-1;w.o.rotation.y+=Math.PI}});\n renderer.render(scene,camera);
}
loop();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
