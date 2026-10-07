import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x9bc8e4);
scene.fog=new THREE.FogExp2(0x9bc8e4,0.0028);
const camera=new THREE.PerspectiveCamera(72,innerWidth/innerHeight,.1,600);
camera.rotation.order="YXZ";
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;\nrenderer.shadowMap.type=THREE.PCFSoftShadowMap;\nrenderer.outputColorSpace=THREE.SRGBColorSpace;\nrenderer.toneMapping=THREE.ACESFilmicToneMapping;\nrenderer.toneMappingExposure=1.05;
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


// procedural asphalt/paving textures
function tex(draw){const c=document.createElement("canvas");c.width=c.height=256;const g=c.getContext("2d");draw(g);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.colorSpace=THREE.SRGBColorSpace;return t}
const asphalt=tex(g=>{g.fillStyle="#55585a";g.fillRect(0,0,256,256);for(let i=0;i<1600;i++){let v=60+Math.random()*50;g.fillStyle="rgb("+v+","+v+","+v+")";g.fillRect(Math.random()*256,Math.random()*256,1,1)}});asphalt.repeat.set(3,45);
const paving=tex(g=>{g.fillStyle="#aaa397";g.fillRect(0,0,256,256);g.strokeStyle="#777269";g.lineWidth=2;for(let y=0;y<256;y+=24){g.beginPath();g.moveTo(0,y);g.lineTo(256,y);g.stroke()}for(let x=0;x<256;x+=40){g.beginPath();g.moveTo(x,0);g.lineTo(x,256);g.stroke()}});paving.repeat.set(2,45);
function slab(x,z,w,d,map){const m=new THREE.Mesh(new THREE.BoxGeometry(w,.14,d),new THREE.MeshStandardMaterial({map,roughness:.96}));m.position.set(x,.07,z);m.receiveShadow=true;scene.add(m)}
function sign(x,y,z,text,color="#a52c26"){const c=document.createElement("canvas");c.width=512;c.height=128;const g=c.getContext("2d");g.fillStyle=color;g.fillRect(0,0,512,128);g.fillStyle="#fff";g.font="bold 46px Arial";g.textAlign="center";g.textBaseline="middle";g.fillText(text,256,64);const m=new THREE.Mesh(new THREE.PlaneGeometry(6,1.5),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));m.position.set(x,y,z);m.rotation.y=x<0?Math.PI/2:-Math.PI/2;scene.add(m)}
function car(x,z,color){const g=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color,roughness:.5});const b=new THREE.Mesh(new THREE.BoxGeometry(3.5,.8,1.65),mat);b.position.y=.65;g.add(b);const t=new THREE.Mesh(new THREE.BoxGeometry(1.9,.65,1.45),new THREE.MeshStandardMaterial({color:0x82939a}));t.position.set(-.2,1.35,0);g.add(t);g.position.set(x,0,z);scene.add(g)}
\n// terrain + long Iğdır-style boulevard
box(0,-.5,0,300,1,420,0x809b61,false);
slab(0,0,24,380,asphalt);
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

sign(-19,3,-52,"GENÇLER PİDE");sign(19,3,35,"IĞDIR MARKET","#316849");sign(-19,3,62,"KAFE","#76513a");car(-7,-25,0x30363b);car(7,8,0xe2e0d8);car(-7,73,0x8f2d29);car(7,-105,0xbdbdb9);\n// stylized Ağrı Dağı / Mount Ararat landmark in the distance
const mountainMat=new THREE.MeshStandardMaterial({color:0x6d6a67,roughness:1});
const mountain=new THREE.Mesh(new THREE.ConeGeometry(72,95,32),mountainMat);
mountain.position.set(0,38,-315);mountain.scale.x=1.75;scene.add(mountain);
const snow=new THREE.Mesh(new THREE.ConeGeometry(29,34,32),new THREE.MeshStandardMaterial({color:0xeee9df,roughness:1}));
snow.position.set(0,86,-315);snow.scale.x=1.75;scene.add(snow);


// --- Iğdır finishing pass: dense street detail, warm lighting, local greenery ---
function mat(c,rough=.85,metal=0){return new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal})}
function meshBox(parent,x,y,z,w,h,d,m){
 const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
}
function detailedTree(x,z,s=1){
 const g=new THREE.Group(), trunk=mat(0x5a402d), leaf1=mat(0x416b31),leaf2=mat(0x557b39);
 meshBox(g,0,2.2*s,0,.55*s,4.4*s,.55*s,trunk);
 for(const q of [[0,5.1,0,2.3],[1.25,5.2,.3,1.65],[-1.2,5,.15,1.7],[.2,6.5,0,1.8]]){
  const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(q[3]*s,1),Math.random()>.5?leaf1:leaf2);crown.position.set(q[0]*s,q[1]*s,q[2]*s);crown.castShadow=true;g.add(crown);
 }
 g.position.set(x,0,z);scene.add(g);
}
function lamp(x,z,side=1){
 const g=new THREE.Group();meshBox(g,0,3.8,0,.12,7.6,.12,mat(0x3b4143,.45,.35));
 meshBox(g,side*.7,7.48,0,1.45,.09,.09,mat(0x3b4143,.45,.35));
 const bulb=meshBox(g,side*1.35,7.35,0,.34,.16,.28,new THREE.MeshStandardMaterial({color:0xffe0a0,emissive:0xffbd55,emissiveIntensity:1.4}));
 g.position.set(x,0,z);scene.add(g);
}
function bollard(x,z){const m=new THREE.Mesh(new THREE.CylinderGeometry(.11,.14,.7,8),mat(0x55595a,.65,.2));m.position.set(x,.35,z);m.castShadow=true;scene.add(m)}
function planter(x,z){
 const g=new THREE.Group();meshBox(g,0,.35,0,1.45,.7,1.45,mat(0xc7b98e));
 const bush=new THREE.Mesh(new THREE.IcosahedronGeometry(.75,1),mat(0x496f35));bush.position.y=1.05;g.add(bush);g.position.set(x,0,z);scene.add(g);
}
function awning(x,y,z,color){
 const a=meshBox(scene,x,y,z,.22,1.1,6,mat(color));a.rotation.z=.08;
}
function balcony(x,y,z,side){
 const g=new THREE.Group();meshBox(g,0,0,0,.8,.12,3,mat(0xaaa69d));meshBox(g,side*.38,.55,0,.06,1.05,3,mat(0x4c4d4b,.5,.3));
 g.position.set(x,y,z);scene.add(g);
}
// denser leafy boulevard similar to central Iğdır references
for(let z=-160;z<=160;z+=23){detailedTree(-12.1,z,0.72);detailedTree(12.1,z+11,0.72)}
for(let z=-160;z<=160;z+=26){lamp(-9.2,z,1);lamp(9.2,z+13,-1)}
for(let z=-155;z<=155;z+=18){bollard(-11.2,z);bollard(11.2,z+9)}
for(let z=-130;z<=130;z+=52){planter(-16,z);planter(16,z+20)}
// storefront canopies and apartment balconies
for(let z=-135;z<=135;z+=56){awning(-19.9,3.25,z,0x7f2623);awning(19.9,3.25,z+18,0x315c45)}
for(let z=-145;z<=145;z+=56)for(let y=5.3;y<=10;y+=2.6){balcony(-19.9,y,z,1);balcony(19.9,y,z+18,-1)}
// traffic signs
function trafficSign(x,z,label){
 const g=new THREE.Group();meshBox(g,0,1.4,0,.08,2.8,.08,mat(0x55585a,.5,.3));
 const c=document.createElement("canvas");c.width=c.height=128;const q=c.getContext("2d");q.fillStyle="#225b9a";q.fillRect(0,0,128,128);q.strokeStyle="#fff";q.lineWidth=7;q.strokeRect(5,5,118,118);q.fillStyle="#fff";q.font="bold 50px Arial";q.textAlign="center";q.textBaseline="middle";q.fillText(label,64,64);
 const p=new THREE.Mesh(new THREE.PlaneGeometry(1.1,1.1),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c)}));p.position.set(0,2.7,.05);g.add(p);g.position.set(x,0,z);scene.add(g);
}
trafficSign(-10.7,-72,"P");trafficSign(10.7,94,"P");
// distant layered foothills to make Ağrı Dağı sit naturally in the horizon
for(const cfg of [[-95,-292,45,42,0x66705f],[92,-300,55,48,0x707166]]){
 const h=new THREE.Mesh(new THREE.ConeGeometry(cfg[2],cfg[3],18),mat(cfg[4]));h.position.set(cfg[0],cfg[3]/2-2,cfg[1]);h.scale.x=2.4;scene.add(h);
}
// a small landscaped central strip / square
for(let z=-35;z<=35;z+=14){const g=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.25,.25,12),mat(0xd5cfb9));g.position.set(0,.22,z);scene.add(g);const b=new THREE.Mesh(new THREE.IcosahedronGeometry(.75,1),mat(0x3e7035));b.position.set(0,1,z);scene.add(b)}

// player
const p={pos:new THREE.Vector3(0,1.72,145),velY:0,ground:true,r:.38};
camera.position.copy(p.pos);
let yaw=0,pitch=0,locked=false;
const keys={};
const start=document.querySelector("#start");
const transition=document.querySelector("#transition");document.querySelector("#play").onclick=()=>{transition.classList.add("show");setTimeout(()=>renderer.domElement.requestPointerLock(),400);setTimeout(()=>transition.classList.remove("show"),850)};
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
 sun.position.x=Math.sin(performance.now()*.000015)*90;\n if(!locked){const t=performance.now()*.00012;camera.position.set(Math.sin(t)*34,8.5,112+Math.cos(t)*18);camera.lookAt(0,4,-25)}\n renderer.render(scene,camera);
}
loop();
addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
