import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9bc8e4);
scene.fog=new THREE.Fog(0x9bc8e4,100,310);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.1,600);
camera.rotation.order="YXZ";
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;
document.querySelector("#game").appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xe9f6ff,0x77835d,2.4));
const sun=new THREE.DirectionalLight(0xfff3d8,2.5);
sun.position.set(-80,120,40);sun.castShadow=true;scene.add(sun);

const solids=[];
function box(x,y,z,w,h,d,color,solid=true){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.9}));
 m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);
 if(solid)solids.push({a:x-w/2,b:x+w/2,c:z-d/2,d:z+d/2});
 return m;
}
function cylinder(x,y,z,r,h,color){
 const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),new THREE.MeshStandardMaterial({color}));
 m.position.set(x,y,z);m.castShadow=true;scene.add(m);return m;
}

// terrain + long Iğdır-style boulevard
box(0,-.5,0,300,1,420,0x809b61,false);
box(0,.02,0,24,.12,380,0x55585a,false);
box(-15,.08,0,6,.16,380,0xb8b1a3,false);
box(15,.08,0,6,.16,380,0xb8b1a3,false);
box(0,.12,0,1.5,.18,380,0xd6c66a,false);

// road markings
for(let z=-180;z<190;z+=14){
 box(-5.5,.16,z,0.18,.03,6,0xe9e6d8,false);
 box(5.5,.16,z,0.18,.03,6,0xe9e6d8,false);
}

// apartment/shop blocks
const colors=[0xd3b18a,0xb9b6aa,0xc88f68,0xd1c4a7,0xaeb8b6];
function building(x,z,w,h,d,color){
 const b=box(x,h/2,z,w,h,d,color);
 // dark shopfront at street level
 if(Math.abs(x)<45){
   const side=x<0?1:-1;
   box(x+side*(w/2+.03),1.6,z,0.12,3,d*.72,0x45484a,false);
 }
 // simple windows
 const front=x<0?x+w/2+.07:x-w/2-.07;
 for(let yy=5;yy<h-1;yy+=3.3)for(let zz=z-d*.35;zz<=z+d*.35;zz+=3.4)
   box(front,yy,zz,.13,1.25,1.45,0x6d8792,false);
 return b;
}
for(let z=-160,i=0;z<=160;z+=28,i++){
 const h1=12+(i%4)*2.2,h2=13+((i+2)%4)*2;
 building(-28,z,16,h1,21,colors[i%colors.length]);
 building(28,z+6,17,h2,22,colors[(i+2)%colors.length]);
}

// trees characteristic of the broad green streets
function tree(x,z,s=1){
 cylinder(x,2.3*s,z,.45*s,4.6*s,0x5b4630);
 const crown=new THREE.Mesh(new THREE.SphereGeometry(2.6*s,9,7),new THREE.MeshStandardMaterial({color:0x426b32,roughness:1}));
 crown.position.set(x,5.5*s,z);crown.scale.y=1.25;crown.castShadow=true;scene.add(crown);
}
for(let z=-170;z<=175;z+=15){
 tree(-18,z,.9+(Math.abs(z)%3)*.06);tree(18,z+7,1);
}

// street lamps
for(let z=-165;z<=170;z+=30){
 cylinder(-9.5,4.2,z,.09,8.4,0x55595b);
 cylinder(9.5,4.2,z+15,.09,8.4,0x55595b);
}

// plaza at one end
box(0,.1,-190,75,.2,42,0xb8aa91,false);
for(let x=-25;x<=25;x+=12) tree(x,-196,.9);

// stylized Ağrı Dağı / Mount Ararat landmark in the distance
const mountainMat=new THREE.MeshStandardMaterial({color:0x6d6a67,roughness:1});
const mountain=new THREE.Mesh(new THREE.ConeGeometry(72,95,32),mountainMat);
mountain.position.set(0,38,-315);mountain.scale.x=1.75;scene.add(mountain);
const snow=new THREE.Mesh(new THREE.ConeGeometry(29,34,32),new THREE.MeshStandardMaterial({color:0xeee9df,roughness:1}));
snow.position.set(0,86,-315);snow.scale.x=1.75;scene.add(snow);

// player
const p={pos:new THREE.Vector3(0,1.72,145),velY:0,ground:true,r:.38};
camera.position.copy(p.pos);
let yaw=0,pitch=0,locked=false;
const keys={};
const start=document.querySelector("#start");
document.querySelector("#play").onclick=()=>renderer.domElement.requestPointerLock();
document.addEventListener("pointerlockchange",()=>{locked=document.pointerLockElement===renderer.domElement;start.style.display=locked?"none":"grid"});
document.addEventListener("mousemove",e=>{
 if(!locked)return;
 yaw-=e.movementX*.0021;pitch-=e.movementY*.0021;
 pitch=Math.max(-1.45,Math.min(1.45,pitch));
 camera.rotation.set(pitch,yaw,0);
});
document.addEventListener("keydown",e=>{
 keys[e.code]=true;
 if(e.code==="Space"&&p.ground){p.velY=6.6;p.ground=false}
});
document.addEventListener("keyup",e=>keys[e.code]=false);
function hit(x,z){
 for(const o of solids)if(x+p.r>o.a&&x-p.r<o.b&&z+p.r>o.c&&z-p.r<o.d)return true;
 return false;
}
const clock=new THREE.Clock();
function loop(){
 requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.04);
 if(locked){
  const f=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const r=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  const v=new THREE.Vector3();
  if(keys.KeyW)v.add(f);if(keys.KeyS)v.sub(f);if(keys.KeyD)v.add(r);if(keys.KeyA)v.sub(r);
  if(v.lengthSq())v.normalize().multiplyScalar((keys.ShiftLeft?9:5.8)*dt);
  if(!hit(p.pos.x+v.x,p.pos.z))p.pos.x+=v.x;
  if(!hit(p.pos.x,p.pos.z+v.z))p.pos.z+=v.z;
  p.velY-=18*dt;p.pos.y+=p.velY*dt;
  if(p.pos.y<=1.72){p.pos.y=1.72;p.velY=0;p.ground=true}
  camera.position.copy(p.pos);
 }
 renderer.render(scene,camera);
}
loop();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
