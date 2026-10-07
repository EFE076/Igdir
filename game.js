import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const scene=new THREE.Scene();
scene.background=new THREE.Color(0xa7cfe4);
scene.fog=new THREE.FogExp2(0xa7cfe4,.002);

const camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,.1,900);
camera.rotation.order="YXZ";

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:"high-performance"});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.05;
document.querySelector("#game").appendChild(renderer.domElement);

const hemi=new THREE.HemisphereLight(0xeaf6ff,0x667052,2);
scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffefd2,3);
sun.position.set(-80,110,50);
sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-130;sun.shadow.camera.right=130;
sun.shadow.camera.top=130;sun.shadow.camera.bottom=-130;
scene.add(sun);

const solids=[],nightLights=[],walkers=[];
const mat=(c,r=.82,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});

function box(x,y,z,w,h,d,c,solid=false,custom=null){
  const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),custom||mat(c));
  o.position.set(x,y,z);o.castShadow=h>1;o.receiveShadow=true;scene.add(o);
  if(solid)solids.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
  return o;
}
function cyl(x,y,z,r,h,c,n=12){
  const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,n),mat(c));
  o.position.set(x,y,z);o.castShadow=true;scene.add(o);return o;
}
function canvasTexture(draw,rx=1,ry=1){
  const c=document.createElement("canvas");c.width=c.height=256;
  const g=c.getContext("2d");draw(g,256);
  const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.colorSpace=THREE.SRGBColorSpace;return t;
}
const asphalt=canvasTexture((g,s)=>{
  g.fillStyle="#555958";g.fillRect(0,0,s,s);
  for(let i=0;i<1000;i++){const q=55+Math.random()*45;g.fillStyle=`rgb(${q},${q},${q})`;g.fillRect(Math.random()*s,Math.random()*s,1,1)}
},4,35);
const paving=canvasTexture((g,s)=>{
  g.fillStyle="#aaa69b";g.fillRect(0,0,s,s);g.strokeStyle="#807d75";
  for(let y=0;y<s;y+=20){g.beginPath();g.moveTo(0,y);g.lineTo(s,y);g.stroke()}
  for(let x=0;x<s;x+=30){g.beginPath();g.moveTo(x,0);g.lineTo(x,s);g.stroke()}
},4,35);
const grass=canvasTexture((g,s)=>{
  g.fillStyle="#71865d";g.fillRect(0,0,s,s);
  for(let i=0;i<700;i++){g.fillStyle=Math.random()>.5?"#667c52":"#81936a";g.fillRect(Math.random()*s,Math.random()*s,2,2)}
},20,20);

const ground=new THREE.Mesh(new THREE.PlaneGeometry(520,520),new THREE.MeshStandardMaterial({map:grass,roughness:1}));
ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

function road(x1,z1,x2,z2,width=9){
  const dx=x2-x1,dz=z2-z1,len=Math.hypot(dx,dz),a=Math.atan2(dx,dz);
  const r=new THREE.Mesh(new THREE.BoxGeometry(width,.12,len),new THREE.MeshStandardMaterial({map:asphalt,roughness:.96}));
  r.position.set((x1+x2)/2,.06,(z1+z2)/2);r.rotation.y=a;r.receiveShadow=true;scene.add(r);
  for(const side of[-1,1]){
    const sw=new THREE.Mesh(new THREE.BoxGeometry(2.4,.18,len),new THREE.MeshStandardMaterial({map:paving,roughness:1}));
    sw.position.set((x1+x2)/2+Math.cos(a)*side*(width/2+1.2),.1,(z1+z2)/2-Math.sin(a)*side*(width/2+1.2));
    sw.rotation.y=a;sw.receiveShadow=true;scene.add(sw);
  }
}
road(0,-220,0,220,22);
road(-140,-210,-30,210,14);
for(const [x1,x2,w] of [[-90,-75,9],[-55,-45,8],[50,55,9],[90,105,9],[130,145,8]])road(x1,-210,x2,210,w);
for(const z of[-180,-145,-110,-70,-35,10,55,95,135,175])road(-160,z,160,z,8);
road(-145,130,-60,30,7);road(45,160,140,100,7);road(45,80,140,20,7);road(45,-10,130,-80,7);road(45,-90,120,-175,7);

for(let z=-200;z<=200;z+=13){box(-5.5,.14,z,.15,.03,5,0xf1efe5);box(5.5,.14,z,.15,.03,5,0xf1efe5)}

function tree(x,z,s=1){
  cyl(x,2*s,z,.35*s,4*s,0x5b4430,10);
  for(const q of[[0,5.1,0,2.2],[1,5.2,0,1.5],[-1,5,.2,1.5],[0,6.3,0,1.5]]){
    const o=new THREE.Mesh(new THREE.IcosahedronGeometry(q[3]*s,1),mat(Math.random()>.5?0x426d32:0x527b39));
    o.position.set(x+q[0]*s,q[1]*s,z+q[2]*s);o.castShadow=true;scene.add(o);
  }
}
for(let z=-190;z<=190;z+=18){tree(-17,z,.85);tree(17,z+9,.9)}

const colors=[0xc6ae88,0xd1c7ac,0xba835e,0xaeb2a7,0xd1a371,0xb9b39f,0xd5c4ae];
const shops=["MARKET","ECZANE","FIRIN","LOKANTA","KAFE","PASTANE","BERBER","TEKSTIL"];
function signMaterial(text,bg){
  const c=document.createElement("canvas");c.width=512;c.height=128;const g=c.getContext("2d");
  g.fillStyle=bg;g.fillRect(0,0,512,128);g.fillStyle="#fff";g.font="bold 44px Arial";g.textAlign="center";g.textBaseline="middle";g.fillText(text,256,64);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:t});
}
function building(x,z,w,d,floors,seed=0){
  const h=3.5+floors*3,side=x<0?1:-1,front=x+side*(w/2+.03);
  box(x,h/2,z,w,h,d,colors[seed%colors.length],true);
  box(front,1.7,z,.2,3.4,d*.92,0x343939);
  for(let i=-1;i<=1;i++)box(front+side*.1,1.7,z+i*d*.28,.15,2.3,d*.2,0x5c7881);
  const sm=signMaterial(shops[seed%shops.length],["#286244","#a62d2d","#9a682f","#55453b"][seed%4]);
  const sg=new THREE.Mesh(new THREE.PlaneGeometry(5,1),sm);sg.position.set(front+side*.15,3.2,z);sg.rotation.y=side>0?Math.PI/2:-Math.PI/2;scene.add(sg);
  for(let f=0;f<floors;f++){
    const y=5+f*3;
    for(let j=-2;j<=2;j++){const wz=z+j*d*.14;box(front,y,wz,.16,1.6,1.35,0xe3dccf);box(front+side*.08,y,wz,.1,1.25,1.05,0x526f79)}
    if(f%2===seed%2){box(front+side*.55,y-.65,z,1,.15,d*.45,0xb7b1a4);box(front+side*1,y-.1,z,.08,1,d*.45,0x484d4e)}
  }
  box(x,h+.25,z,w+.2,.5,d+.2,0xa39c90);
}
let seed=0;
for(let z=-190;z<=190;z+=30){building(-29,z,17,22,3+seed%4,seed++);building(29,z+8,18,22,3+seed%5,seed++)}
const blocks=[[-125,-155],[-100,-130],[-75,-155],[-130,-70],[-100,-50],[-70,-75],[-130,10],[-100,35],[-70,10],[-130,90],[-100,115],[-70,90],[-130,165],[-100,150],[-70,170],[70,-155],[100,-135],[130,-155],[70,-70],[100,-50],[130,-75],[70,10],[100,35],[130,10],[70,90],[100,115],[130,90],[70,165],[100,150],[130,170]];
blocks.forEach((p,i)=>building(p[0],p[1],15+i%3,17,3+i%4,i));

function lamp(x,z,dir=1){
  cyl(x,3.8,z,.08,7.6,0x44494a,8);box(x+dir*.5,7.5,z,1,.08,.08,0x44494a);
  const bulbMat=new THREE.MeshStandardMaterial({color:0xffdf9c,emissive:0xffa52e,emissiveIntensity:.25});
  box(x+dir,7.4,z,.3,.18,.3,0xffffff,false,bulbMat);
  const l=new THREE.PointLight(0xffb65b,0,18,2);l.position.set(x+dir,7.2,z);scene.add(l);nightLights.push(l);
}
for(let z=-180;z<=180;z+=30){lamp(-10,z,1);lamp(10,z+15,-1)}

function mountain(cx,cz,r,h,c){
  const seg=56,rings=20,v=[],ind=[];
  for(let y=0;y<=rings;y++){const t=y/rings,rr=r*(1-Math.pow(t,1.45));for(let i=0;i<seg;i++){const a=i/seg*Math.PI*2,n=(Math.sin(i*2.7+y*1.8)+Math.sin(i*.8-y*2.1))*.8*(1-t);v.push(cx+Math.cos(a)*(rr+n),t*h,cz+Math.sin(a)*(rr+n*.5))}}
  for(let y=0;y<rings;y++)for(let i=0;i<seg;i++){const n=(i+1)%seg,a=y*seg+i,b=y*seg+n,c1=(y+1)*seg+i,d=(y+1)*seg+n;ind.push(a,c1,b,b,c1,d)}
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.Float32BufferAttribute(v,3));geo.setIndex(ind);geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,mat(c,1));m.receiveShadow=true;scene.add(m);
}
mountain(-10,-420,130,135,0x716e69);
const snow=new THREE.Mesh(new THREE.ConeGeometry(31,31,48),mat(0xf2f0ea,.95));snow.position.set(-10,120,-420);snow.scale.z=.6;scene.add(snow);

const loader=new GLTFLoader();
function normalize(obj,h){
  obj.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(obj),s=new THREE.Vector3();b.getSize(s);
  if(!Number.isFinite(s.y)||s.y<=0)return;
  obj.scale.multiplyScalar(h/s.y);obj.updateMatrixWorld(true);const b2=new THREE.Box3().setFromObject(obj);obj.position.y-=b2.min.y;
}
loader.load("./assets/human.glb",g=>{
  const t=g.scene;normalize(t,1.75);
  [[-15,150,-1],[-16,110,1],[15,80,-1],[16,30,1],[-15,-20,-1],[15,-75,1],[-16,-130,-1],[16,-170,1]].forEach((p,i)=>{
    const o=t.clone(true);o.position.set(p[0],0,p[1]);o.rotation.y=p[2]>0?0:Math.PI;o.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});scene.add(o);
    walkers.push({o,dir:p[2],speed:.38+(i%3)*.08});
  });
},undefined,e=>console.warn("human.glb kon niet laden; game blijft werken.",e));

loader.load("./assets/generic_80s_european_car.glb",g=>{
  const t=g.scene;normalize(t,1.45);
  [[-7.5,130,0],[7.5,70,Math.PI],[-7.5,-50,0],[7.5,-145,Math.PI],[-80,-105,Math.PI/2],[95,55,-Math.PI/2]].forEach(p=>{
    const o=t.clone(true);o.position.set(p[0],0,p[1]);o.rotation.y=p[2];o.traverse(n=>{if(n.isMesh){n.castShadow=true;n.receiveShadow=true}});scene.add(o);
  });
},undefined,e=>console.warn("car.glb kon niet laden; game blijft werken.",e));

const player={pos:new THREE.Vector3(0,1.72,185),vy:0,ground:true,r:.4};
camera.position.copy(player.pos);
let yaw=0,pitch=0,locked=false,night=false;
const keys={};
const start=document.querySelector("#start"),transition=document.querySelector("#transition"),play=document.querySelector("#play");

play.addEventListener("click",()=>{
  start.style.display="none";
  transition.classList.add("show");
  renderer.domElement.requestPointerLock();
  setTimeout(()=>transition.classList.remove("show"),500);
});
document.addEventListener("pointerlockchange",()=>{
  locked=document.pointerLockElement===renderer.domElement;
  if(!locked)start.style.display="block";
});
document.addEventListener("mousemove",e=>{
  if(!locked)return;yaw-=e.movementX*.002;pitch-=e.movementY*.002;pitch=Math.max(-1.45,Math.min(1.45,pitch));camera.rotation.set(pitch,yaw,0);
});
document.addEventListener("keydown",e=>{
  keys[e.code]=true;
  if(e.code==="Space"&&player.ground){player.vy=6.5;player.ground=false}
  if(e.code==="KeyN"){night=!night;scene.background.set(night?0x17263b:0xa7cfe4);scene.fog.color.set(night?0x17263b:0xa7cfe4);hemi.intensity=night?.45:2;sun.intensity=night?.2:3;renderer.toneMappingExposure=night?.7:1.05;nightLights.forEach(l=>l.intensity=night?7:0)}
});
document.addEventListener("keyup",e=>keys[e.code]=false);

function collides(x,z){return solids.some(o=>x+player.r>o.minX&&x-player.r<o.maxX&&z+player.r>o.minZ&&z-player.r<o.maxZ)}
const clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.04);
  if(locked){
    const f=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw)),r=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw)),v=new THREE.Vector3();
    if(keys.KeyW)v.add(f);if(keys.KeyS)v.sub(f);if(keys.KeyD)v.add(r);if(keys.KeyA)v.sub(r);
    if(v.lengthSq()){v.normalize().multiplyScalar((keys.ShiftLeft?8.5:5.2)*dt);if(!collides(player.pos.x+v.x,player.pos.z))player.pos.x+=v.x;if(!collides(player.pos.x,player.pos.z+v.z))player.pos.z+=v.z}
    player.vy-=18*dt;player.pos.y+=player.vy*dt;if(player.pos.y<=1.72){player.pos.y=1.72;player.vy=0;player.ground=true}
    camera.position.copy(player.pos);if(v.lengthSq()&&player.ground)camera.position.y+=Math.sin(performance.now()*.011)*.025;
  }else{
    const t=performance.now()*.0001;camera.position.set(Math.sin(t)*45,11,140+Math.cos(t)*28);camera.lookAt(0,5,-40);
  }
  walkers.forEach(w=>{w.o.position.z+=w.dir*w.speed*dt;if(w.o.position.z>195||w.o.position.z<-195){w.dir*=-1;w.o.rotation.y+=Math.PI}});
  renderer.render(scene,camera);
}
animate();

addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
console.log("Iğdır game gestart zonder merge conflicts.");
