import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';

const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const state = { riding: !reducedMotion, speed: 1, mood: 'day', distance: 0, sound: false, phase: 0, ready: false };
const canvas = $('world');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
} catch (error) {
  $('loading').hidden = true;
  $('fallback').hidden = false;
  $('ride').disabled = true;
  throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, .1, 80);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = .065;
controls.enablePan = false;
controls.minDistance = 8;
controls.maxDistance = 22;
controls.minPolarAngle = .3;
controls.maxPolarAngle = Math.PI / 2.07;
controls.rotateSpeed = .65;
controls.zoomSpeed = .7;
const home = new THREE.Vector3(8.8, 6.6, 12.8);
function resetCamera() {
  const damping = controls.enableDamping;
  controls.enableDamping = false;
  controls.update();
  camera.position.copy(home); controls.target.set(0, 1.2, 0); controls.update();
  controls.enableDamping = damping;
}
resetCamera();

const hemi = new THREE.HemisphereLight(0xc7e6ec, 0xc9b18b, 2.7);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffedd2, 3.5);
sun.position.set(-3, 8, 5);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -7; sun.shadow.camera.right = 7;
sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7;
sun.shadow.normalBias = .035;
sun.shadow.bias = -.0002;
sun.shadow.radius = 3;
scene.add(sun);
const rim = new THREE.DirectionalLight(0xbddcde, 1.3);
rim.position.set(3, 5, -6); scene.add(rim);

const mat = (color, roughness = .7, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const M = {
  cream: mat('#fff4dc'), feather: mat('#ecdfc4'), wing: mat('#fff8e8'),
  ink: mat('#263b35'), eye: mat('#182525', .22), white: mat('#ffffff'),
  bill: mat('#efa54c', .43), pouch: mat('#eec66e'), foot: mat('#d88c3a'),
  red: mat('#d76a49', .38, .12), teal: mat('#3d8277', .36, .3), tire: mat('#283d36'),
  chrome: mat('#f3ebd7', .25, .6), leather: mat('#83563c'), sand: mat('#ddc69c'),
  sandTop: mat('#eddbb3'), road: mat('#c4b694'), paint: mat('#fcf2d1'),
  leaf: mat('#638b65'), leafLight: mat('#8da574'), trunk: mat('#aa7951'),
  sea: mat('#79bcb6', .3, .08), seaEdge: mat('#aed4c9', .6), foam: mat('#ebf6e3'),
  rock: mat('#b7b69a'), coral: mat('#e19973'), sky: mat('#fff8e7'),
  light: new THREE.MeshStandardMaterial({ color: '#ffde8a', emissive: '#ffd985', emissiveIntensity: .8 }),
};
const sphereGeo = new THREE.SphereGeometry(1, 28, 20);
const cylinderGeo = new THREE.CylinderGeometry(1, 1, 1, 12);
function mesh(geometry, material, parent = scene) {
  const m = new THREE.Mesh(geometry, material); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function ellipsoid(pos, scale, material, parent = scene) {
  const m = mesh(sphereGeo, material, parent); m.position.set(...pos); m.scale.set(...scale); return m;
}
function rod(a, b, radius, material, parent = scene) {
  const m = mesh(cylinderGeo, material, parent); setRod(m, a, b, radius); return m;
}
const up = new THREE.Vector3(0, 1, 0);
function setRod(m, a, b, radius) {
  const av = a.isVector3 ? a : new THREE.Vector3(...a), bv = b.isVector3 ? b : new THREE.Vector3(...b);
  const delta = bv.clone().sub(av);
  m.position.copy(av).add(bv).multiplyScalar(.5); m.scale.set(radius, delta.length(), radius);
  m.quaternion.setFromUnitVectors(up, delta.normalize());
}
function tube(points, radius, material, parent = scene, segments = 32) {
  return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), segments, radius, 10, false), material, parent);
}
function torus(radius, thickness, material, parent = scene, segments = 64) { return mesh(new THREE.TorusGeometry(radius, thickness, 10, segments), material, parent); }
function box(pos, size, material, parent = scene) { const m = mesh(new THREE.BoxGeometry(...size), material, parent); m.position.set(...pos); return m; }
function cylinder(pos, radiusTop, radiusBottom, height, material, parent = scene, segments = 64) {
  const m = mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material, parent); m.position.set(...pos); return m;
}
let seed = 31;
function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

// A miniature coast, built entirely from geometry so every angle remains real 3D.
const island = new THREE.Group(); scene.add(island);
cylinder([0, -.62, 0], 4.45, 4.2, .22, M.seaEdge, island, 96);
cylinder([0, -.49, 0], 4.24, 4.3, .12, M.sea, island, 96);
cylinder([0, -.29, 0], 3.48, 3.15, .36, M.sand, island, 96);
cylinder([0, -.095, 0], 3.48, 3.48, .06, M.sandTop, island, 96);
const road = box([0, -.048, .36], [6.7, .035, 1.55], M.road, island);
for (const z of [-.37, 1.09]) box([0, -.018, z], [6.55, .012, .035], M.paint, island);
const dashes = [];
for (let i = 0; i < 10; i++) { const d = box([i * .68 - 3.1, -.021, .39], [.29, .014, .032], M.paint, island); dashes.push(d); }
const foam = [];
for (let i = 0; i < 18; i++) {
  const angle = i / 18 * Math.PI * 2;
  const r = 3.65 + rand() * .4;
  const f = torus(.3 + rand() * .3, .009, M.foam, island, 26);
  f.geometry.dispose(); f.geometry = new THREE.TorusGeometry(r, .011, 5, 25, .13 + rand() * .16);
  f.rotation.x = -Math.PI / 2; f.rotation.z = angle; f.position.y = -.412;
  f.userData = { angle, r }; foam.push(f);
}
for (let i = 0; i < 23; i++) {
  const a = rand() * Math.PI * 2, r = 2.75 + rand() * .55;
  const x = Math.cos(a) * r, z = Math.sin(a) * r;
  if (Math.abs(z - .36) < 1.1) continue;
  const rock = ellipsoid([x, .01, z], [.13 + rand() * .12, .1 + rand() * .11, .1 + rand() * .1], i % 3 === 0 ? M.coral : M.rock, island);
  rock.rotation.y = rand() * 5;
}
function grass(x, z, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, -.035, z); g.scale.setScalar(scale); island.add(g);
  for (let j = 0; j < 5; j++) { const leaf = ellipsoid([Math.sin(j * 2) * .08, .13, Math.cos(j * 2) * .08], [.025, .24 + rand() * .13, .018], j % 2 ? M.leaf : M.leafLight, g); leaf.rotation.z = Math.sin(j * 2) * .45; leaf.rotation.x = Math.cos(j * 2) * .45; }
}
for (const p of [[-2.7,-1.5],[-2.8,1.6],[-1.6,2.4],[.7,2.7],[2.9,1.5],[1.6,-2.2],[-.7,-2.5]]) grass(...p, .6 + rand() * .4);

const palmLeaves = [];
function palm(x, z, scale, tilt) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(scale); g.rotation.z = tilt; island.add(g);
  tube([[0,0,0],[.03,.7,0],[.19,1.5,.02],[.35,2.3,0]], .105, M.trunk, g);
  for (let j = 0; j < 8; j++) {
    const ring = torus(.105, .015, M.sand, g, 12); ring.rotation.x = Math.PI / 2; ring.position.set(.02 + j * .036, .2 + j * .26, 0);
  }
  const crown = new THREE.Group(); crown.position.set(.35, 2.29, 0); g.add(crown); palmLeaves.push(crown);
  for (let j = 0; j < 7; j++) {
    const a = j * Math.PI * 2 / 7;
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.bezierCurveTo(.2,.15,.76,.12,1.06,-.2); shape.bezierCurveTo(.72,-.12,.26,-.24,0,0);
    const leaf = mesh(new THREE.ExtrudeGeometry(shape, { depth: .035, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 2, steps: 1, curveSegments: 10 }), j % 2 ? M.leaf : M.leafLight, crown);
    leaf.rotation.y = a; leaf.rotation.z = .22;
    tube([[0,0,0],[.55,.01,0],[1.03,-.18,0]], .013, M.leaf, leaf, 12);
  }
  for (let j = 0; j < 3; j++) ellipsoid([.35 + Math.sin(j*2)*.11,2.2,Math.cos(j*2)*.11],[.11,.13,.11],M.leather,g);
}
palm(-2.35, -1.35, 1.02, -.14);
palm(-2.9, -.75, .64, .13);

const lighthouse = new THREE.Group(); lighthouse.position.set(2.03, 0, -1.75); lighthouse.scale.setScalar(.8); island.add(lighthouse);
cylinder([0,.1,0], .57,.66,.2,M.cream,lighthouse);
cylinder([0,.95,0], .31,.45,1.6,M.cream,lighthouse);
cylinder([0,1.13,0], .349,.377,.32,M.red,lighthouse);
cylinder([0,1.77,0], .5,.5,.11,M.ink,lighthouse);
cylinder([0,2,0], .28,.28,.38,M.light,lighthouse);
for (let i=0;i<6;i++){const a=i/6*Math.PI*2;rod([Math.sin(a)*.31,1.8,Math.cos(a)*.31],[Math.sin(a)*.31,2.2,Math.cos(a)*.31],.022,M.ink,lighthouse);}
cylinder([0,2.28,0], 0,.47,.32,M.red,lighthouse);
rod([0,2.43,0],[0,2.62,0],.017,M.ink,lighthouse);
box([0,.34,.429],[.18,.4,.025],M.ink,lighthouse);
for(const y of [.76,1.44])box([0,y,.365],[.105,.15,.025],M.teal,lighthouse);
const lamp = new THREE.PointLight(0xffd28c, 0, 6); lamp.position.set(2.03, 1.6, -1.75); scene.add(lamp);
const lighthouseGlow = new THREE.Group(); lighthouseGlow.position.copy(lamp.position); scene.add(lighthouseGlow);
const beamMaterial = new THREE.MeshBasicMaterial({color:0xffdda1,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
const beam = mesh(new THREE.ConeGeometry(.85, 5, 32, 1, true),beamMaterial,lighthouseGlow); beam.rotation.z=Math.PI/2;beam.position.x=2.5;beam.castShadow=false;

// Coastal details: a tiny sign, fence, flowers and a sailboat.
rod([1,0,-2.7],[1,.67,-2.7],.033,M.trunk,island);
const sign=box([1,.58,-2.7],[.72,.22,.075],M.teal,island); sign.rotation.z=.04;
const signCanvas=document.createElement('canvas');signCanvas.width=256;signCanvas.height=80;
const signCtx=signCanvas.getContext('2d');signCtx.fillStyle='#3d8277';signCtx.fillRect(0,0,256,80);signCtx.fillStyle='#fff4dc';signCtx.font='bold 26px sans-serif';signCtx.textAlign='center';signCtx.fillText('TO THE SEA →',128,49);
const signTex=new THREE.CanvasTexture(signCanvas);signTex.colorSpace=THREE.SRGBColorSpace;
const signFace=mesh(new THREE.PlaneGeometry(.67,.205),new THREE.MeshBasicMaterial({map:signTex}),sign);signFace.position.z=.039;
for(let i=0;i<4;i++) {const x=-1.3+i*.6;rod([x,0,-2],[x,.5,-2],.035,M.cream,island);}
for(const y of [.22,.43])rod([-1.3,y,-2],[.5,y,-2],.026,M.cream,island);
for(const [x,z] of [[-1.85,1.7],[2.35,1.7],[-.95,-1.7]]){
  grass(x,z,.65);rod([x,0,z],[x,.36,z],.01,M.leaf,island);
  for(let i=0;i<5;i++)ellipsoid([x+Math.sin(i*1.257)*.07,.37,z+Math.cos(i*1.257)*.07],[.06,.025,.06],M.cream,island);
  ellipsoid([x,.389,z],[.035,.027,.035],M.bill,island);
}
const boat=new THREE.Group();boat.position.set(-2,-.3,3.25);boat.rotation.y=-.55;scene.add(boat);
ellipsoid([0,0,0],[.4,.11,.15],M.red,boat);rod([0,.04,0],[0,.8,0],.016,M.cream,boat);
const sailShape=new THREE.Shape();sailShape.moveTo(.035,.2);sailShape.lineTo(.035,.76);sailShape.lineTo(.36,.2);sailShape.closePath();
const sail=mesh(new THREE.ShapeGeometry(sailShape),new THREE.MeshStandardMaterial({color:0xfff3d8,side:THREE.DoubleSide}),boat);

// The bicycle: actual frame triangles, spokes, chain, crank and rotating wheels.
const bike=new THREE.Group();bike.position.z=.45;scene.add(bike);
const wheels=[];
for(const x of [-1.12,1.12]){
  const w=new THREE.Group();w.position.set(x,.71,0);bike.add(w);wheels.push(w);
  torus(.646,.066,M.tire,w);
  torus(.571,.027,M.chrome,w);
  for(let j=0;j<20;j++){const a=j/20*Math.PI*2;rod([0,0,j%2?.045:-.045],[Math.cos(a)*.57,Math.sin(a)*.57,0],.008,M.chrome,w);}
  const hub=cylinder([0,0,0],.085,.085,.2,M.chrome,w,16);hub.rotation.x=Math.PI/2;
  const reflector=box([.38,0,.015],[.13,.05,.027],M.bill,w);reflector.rotation.z=.6;
}
const rear=[-1.12,.71,0],crankCenter=[-.1,.78,0],seatTop=[-.59,1.68,0],headTop=[.72,1.65,0],headBottom=[.83,1.4,0],front=[1.12,.71,0];
for(const [a,b]of[[rear,seatTop],[seatTop,crankCenter],[crankCenter,rear],[seatTop,headTop],[crankCenter,headBottom],[headTop,headBottom]])rod(a,b,.046,M.teal,bike);
for(const z of [-.09,.09]){rod([.72,1.65,z],[1.12,.71,z],.035,M.teal,bike);rod([-.59,1.68,z],[-1.12,.71,z],.024,M.teal,bike);}
rod([-.59,1.58,0],[-.66,1.89,0],.027,M.chrome,bike);
ellipsoid([-.66,1.91,0],[.29,.074,.18],M.leather,bike);
rod([.72,1.65,0],[.67,1.98,0],.027,M.chrome,bike);
tube([[.67,1.98,-.38],[.82,2,-.3],[.79,2,0],[.82,2,.3],[.67,1.98,.38]],.027,M.chrome,bike);
for(const z of [-.36,.36]){const grip=cylinder([.67,1.98,z],.038,.038,.19,M.leather,bike,12);grip.rotation.z=Math.PI/2;}
ellipsoid([.81,2.06,.18],[.066,.043,.066],M.chrome,bike);
const headlight=ellipsoid([1.02,1.69,0],[.083,.086,.083],M.chrome,bike);ellipsoid([1.079,1.69,0],[.035,.065,.065],M.light,bike);
const fenderMaterial=M.teal;
for(const x of [-1.12,1.12]){const f=mesh(new THREE.TorusGeometry(.738,.023,7,32,Math.PI*.92),fenderMaterial,bike);f.position.set(x,.71,0);f.rotation.z=.12;}
tube([[-1.12,.87,.13],[-.1,1.01,.13],[.12,.78,.13],[-.1,.55,.13],[-1.12,.57,.13],[-1.26,.71,.13],[-1.12,.87,.13]],.013,M.ink,bike);
const gear=torus(.21,.022,M.chrome,bike,32);gear.position.set(-.1,.78,.16);
const crank=new THREE.Group();crank.position.set(-.1,.78,0);bike.add(crank);
rod([-.255,0,-.21],[.255,0,.21],.021,M.chrome,crank);
const pedalGroups=[];
for(const side of [-1,1]){const p=new THREE.Group();p.position.set(side*.255,0,side*.25);crank.add(p);box([0,0,0],[.18,.04,.17],M.ink,p);pedalGroups.push(p);}

// Pelican anatomy: long bill + capacious throat pouch + curved neck, with layered feathers.
const pelican=new THREE.Group();pelican.position.z=.45;scene.add(pelican);
const torso=new THREE.Group();pelican.add(torso);
const body=ellipsoid([-.57,2.27,0],[.68,.7,.43],M.cream,torso);body.rotation.z=-.32;
ellipsoid([-.37,2.27,.1],[.43,.55,.36],M.wing,torso);
for(let j=0;j<5;j++){const f=ellipsoid([-1.1-j*.07,2.16+j*.04,(j-2)*.08],[.4,.09,.075],j%2?M.feather:M.wing,torso);f.rotation.z=-.23-j*.07;}
tube([[-.2,2.5,0],[.11,2.67,0],[.07,3.05,0],[.18,3.36,0],[.49,3.54,0]],.225,M.cream,torso);
ellipsoid([.14,2.92,0],[.24,.46,.235],M.cream,torso);
const head=new THREE.Group();head.position.set(.48,3.49,0);torso.add(head);
ellipsoid([0,.06,0],[.37,.35,.29],M.wing,head);
// A tapered upper bill, gently curved below, rather than a generic duck cone.
const billShape=new THREE.Shape();billShape.moveTo(.15,.08);billShape.bezierCurveTo(.48,.12,1.15,.045,1.44,-.07);billShape.bezierCurveTo(1.42,-.14,1.28,-.17,1.19,-.15);billShape.lineTo(.2,-.08);billShape.closePath();
const bill=mesh(new THREE.ExtrudeGeometry(billShape,{depth:.18,bevelEnabled:true,bevelThickness:.075,bevelSize:.045,bevelSegments:3,curveSegments:20,steps:1}),M.bill,head);bill.position.z=-.09;
const pouch=ellipsoid([.56,-.17,0],[.68,.225,.18],M.pouch,head);pouch.rotation.z=-.1;
tube([[.23,-.08,.194],[.7,-.105,.145],[1.31,-.14,.08]],.008,M.leather,head,24);
tube([[.23,-.08,-.194],[.7,-.105,-.145],[1.31,-.14,-.08]],.008,M.leather,head,24);
const eyes=[];
for(const s of [-1,1]){
  ellipsoid([.075,.14,s*.263],[.106,.116,.035],M.pouch,head);
  const eye=ellipsoid([.091,.155,s*.291],[.055,.068,.026],M.eye,head);eyes.push(eye);
  ellipsoid([.104,.179,s*.31],[.017,.019,.012],M.white,head);
  const brow=tube([[.012,.282,s*.251],[.083,.298,s*.26],[.16,.272,s*.242]],.017,M.feather,head,12);
}
for(let j=0;j<3;j++){const f=ellipsoid([-.14-j*.075,.335+j*.016,0],[.16,.054,.055],M.cream,head);f.rotation.z=-.2-j*.16;}
// Wings reach the handlebars. Feather groups soften the hand-like contact.
for(const s of [-1,1]){
  const w=ellipsoid([-.61,2.4,s*.352],[.55,.33,.14],M.feather,torso);w.rotation.z=-.36;
  for(let j=0;j<4;j++){const f=ellipsoid([-.68-j*.07,2.23+j*.06,s*(.41+j*.003)],[.42,.065,.09],M.wing,torso);f.rotation.z=-.22-j*.06;}
  tube([[-.34,2.48,s*.36],[.03,2.31,s*.41],[.4,2.08,s*.38],[.66,1.99,s*.35]],.084,M.wing,torso);
}
// A little rust-red scarf catches the sea breeze.
const scarfBand=torus(.242,.059,M.red,torso,36);scarfBand.position.set(.105,2.88,0);scarfBand.rotation.x=Math.PI/2;scarfBand.rotation.y=.1;
ellipsoid([-.14,2.83,.13],[.11,.1,.11],M.red,torso);
const scarf=new THREE.Group();scarf.position.set(-.13,2.83,.04);torso.add(scarf);
const scarfGeo=new THREE.PlaneGeometry(.93,.18,12,1);scarfGeo.translate(-.45,0,0);
const scarfMat=new THREE.MeshStandardMaterial({color:'#d76a49',side:THREE.DoubleSide,roughness:.9});
const scarfMesh=mesh(scarfGeo,scarfMat,scarf);scarf.rotation.y=.22;scarf.rotation.z=-.12;
const scarfBase=scarfGeo.attributes.position.array.slice();

const legs=[];
for(const side of [-1,1]){
  const upper=rod([-.54,1.99,side*.21],[-.12,1.55,side*.25],.068,M.foot,pelican);
  const lower=rod([-.12,1.55,side*.25],[.1,.85,side*.25],.045,M.foot,pelican);
  const foot=ellipsoid([.1,.85,side*.25],[.21,.06,.125],M.bill,pelican);
  for(let j=-1;j<=1;j++){const toe=ellipsoid([.105,-.009,j*.035],[.105,.035,.031],M.foot,foot);toe.scale.set(.5,.5,.5);}
  legs.push({side,upper,lower,foot});
}
function updateLegs(phase){
  crank.rotation.z=-phase;
  for(let i=0;i<legs.length;i++){
    const leg=legs[i],s=leg.side;
    const foot=new THREE.Vector3(-.1+Math.cos(phase)*.255*s,.78-Math.sin(phase)*.255*s,s*.25);
    const hip=new THREE.Vector3(-.55,1.96,s*.23);
    const d=foot.clone().sub(hip),length=Math.min(d.length(),1.31),unit=d.clone().normalize();
    const along=(.69*.69-.67*.67+length*length)/(2*length);
    const bend=Math.sqrt(Math.max(0,.69*.69-along*along));
    const knee=hip.clone().addScaledVector(unit,along).addScaledVector(new THREE.Vector3(-unit.y,unit.x,0).normalize(),bend);
    setRod(leg.upper,hip,knee,.066);setRod(leg.lower,knee,foot,.043);
    leg.foot.position.copy(foot).add(new THREE.Vector3(.065,.063,0));
    pedalGroups[i].rotation.z=phase;
  }
}

// Weightless clouds and a few birds beyond the island.
const clouds=[];
function cloud(x,y,z,scale){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);scene.add(g);for(const p of [[0,0,0,.48],[.42,.025,0,.36],[-.4,-.04,0,.29],[-.12,.22,0,.35]]){const c=ellipsoid(p.slice(0,3),[p[3],p[3]*.55,p[3]*.45],M.sky,g);c.castShadow=false;}g.userData.baseX=x;clouds.push(g);}
cloud(-2.25,4.3,-2.2,.95);cloud(2.5,4.1,-2.8,.68);cloud(.1,4.7,-3.2,.48);
const gulls=[];
for(let j=0;j<3;j++){const g=new THREE.Group();scene.add(g);for(const s of [-1,1])tube([[0,0,0],[s*.16,.09,0],[s*.33,.025,0]],.019,M.cream,g,12);g.position.set(-3+j*.8,3.3+j*.24,-3);g.scale.setScalar(.6);gulls.push(g);}
const celestial=new THREE.Group();celestial.position.set(2.9,3.4,-3.2);scene.add(celestial);
const sunOrb=ellipsoid([0,0,0],[.32,.32,.15],new THREE.MeshBasicMaterial({color:0xeec581}),celestial);sunOrb.castShadow=false;
const moon=ellipsoid([0,0,0],[.28,.28,.15],new THREE.MeshBasicMaterial({color:0xffeacc}),celestial);moon.visible=false;moon.castShadow=false;
const starGeo=new THREE.BufferGeometry();const stars=[];
for(let i=0;i<65;i++)stars.push((rand()-.5)*10,2+rand()*4,-3-rand()*2);
starGeo.setAttribute('position',new THREE.Float32BufferAttribute(stars,3));
const starMat=new THREE.PointsMaterial({color:0xffebc2,size:.035,transparent:true,opacity:0});const starPoints=new THREE.Points(starGeo,starMat);scene.add(starPoints);

const moods={
  day:{hemi:0xc7e6ec,ground:0xc9b18b,sun:0xffedd2,intensity:3.5,ambient:2.7,rim:1.3,sea:0x79bcb6,edge:0xaed4c9,exposure:1.22,label:'海风正好 · SUNNY COAST'},
  sunset:{hemi:0xf4c5b0,ground:0xb99071,sun:0xffaf70,intensity:3.7,ambient:1.8,rim:1,sea:0xc1b2a5,edge:0xe2c6aa,exposure:1.15,label:'把夕阳装进口袋 · GOLDEN HOUR'},
  night:{hemi:0x819ec1,ground:0x3e5c62,sun:0xb3d7ee,intensity:1.8,ambient:1.1,rim:1.8,sea:0x315f70,edge:0x4e7c85,exposure:1.12,label:'今晚，月亮陪骑 · MOONLIGHT RIDE'},
};
let targetMood=moods.day;
function setMood(name){
  state.mood=name;targetMood=moods[name];document.body.dataset.mood=name;
  document.querySelectorAll('.mood').forEach(b=>{const active=b.dataset.mood===name;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  $('scene-label').textContent=targetMood.label;moon.visible=name==='night';sunOrb.visible=name!=='night';
  toast(name==='night'?'灯塔亮了，月亮也来陪你。':name==='sunset'?'把速度放慢一点，日落值得。':'海风正好，继续出发。');
}

// Sound starts only after an explicit click. Web Audio synthesis needs no remote media.
let audioContext,windGain,windSource;
function getAudio(){if(!audioContext)audioContext=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume().catch(()=>{});return audioContext;}
function playBell(){
  try{const ctx=getAudio(),t=ctx.currentTime;for(const offset of [0,.15])for(const [freq,volume]of [[1480,.16],[2210,.04],[2980,.016]]){const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.setValueAtTime(.0001,t+offset);gain.gain.exponentialRampToValueAtTime(volume,t+offset+.003);gain.gain.exponentialRampToValueAtTime(.0001,t+offset+1.4);osc.connect(gain).connect(ctx.destination);osc.start(t+offset);osc.stop(t+offset+1.5);}}catch{}
  bellBounce=1;toast('叮铃！借过一阵海风。');
}
function toggleSound(){
  try{const ctx=getAudio();if(!windSource){const buffer=ctx.createBuffer(1,ctx.sampleRate*4,ctx.sampleRate),data=buffer.getChannelData(0);let last=0;for(let i=0;i<data.length;i++){last=(last+(Math.random()*2-1)*.025)/1.025;data[i]=last*3;}windSource=ctx.createBufferSource();windSource.buffer=buffer;windSource.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=750;windGain=ctx.createGain();windGain.gain.value=0;windSource.connect(filter).connect(windGain).connect(ctx.destination);windSource.start();}state.sound=!state.sound;windGain.gain.setTargetAtTime(state.sound?.16:0,ctx.currentTime,.5);$('sound').setAttribute('aria-pressed',String(state.sound));$('sound').setAttribute('aria-label',state.sound?'关闭海风声音':'开启海风声音');toast(state.sound?'听，风从海上来。':'海风已静音。');}catch{toast('当前浏览器暂时无法播放声音。');}
}
let toastTimer;
function toast(message){$('toast').textContent=message;$('toast').classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('visible'),2800);}
function updateRideUI(){$('ride').setAttribute('aria-pressed',String(state.riding));$('ride-label').textContent=state.riding?'歇一会儿':'一起出发';$('ride-symbol').textContent=state.riding?'Ⅱ':'↗';}
function toggleRide(){state.riding=!state.riding;updateRideUI();}
updateRideUI();
$('ride').addEventListener('click',toggleRide);
$('speed').addEventListener('input',e=>{state.speed=Number(e.target.value);$('speed-value').value=state.speed.toFixed(1)+'×';});
document.querySelectorAll('.mood').forEach(b=>b.addEventListener('click',()=>setMood(b.dataset.mood)));
$('reset').addEventListener('click',()=>{resetCamera();toast('回到最好的看海角度。');});
$('bell').addEventListener('click',playBell);
$('sound').addEventListener('click',toggleSound);
$('camera').addEventListener('click',()=>{
  try{
    renderer.render(scene,camera);
    const shot=document.createElement('canvas');shot.width=1600;shot.height=1200;const ctx=shot.getContext('2d');
    ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--paper').trim();ctx.fillRect(0,0,1600,1200);
    const scale=Math.min(1500/canvas.width,1010/canvas.height);const w=canvas.width*scale,h=canvas.height*scale;ctx.drawImage(canvas,(1600-w)/2,(1100-h)/2,w,h);
    ctx.fillStyle=getComputedStyle(document.body).getPropertyValue('--ink').trim();ctx.font='600 23px sans-serif';ctx.textAlign='center';ctx.fillText('PELICAN CYCLING CLUB',800,1110);ctx.font='18px sans-serif';ctx.fillText('慢慢骑，去看海。',800,1148);
    shot.toBlob(blob=>{if(!blob){toast('照片生成失败，请再试一次。');return;}const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`pelican-${state.mood}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);toast('海边明信片，已保存。');},'image/png');
    $('flash').classList.remove('active');void $('flash').offsetWidth;$('flash').classList.add('active');
  }catch{toast('暂时无法保存，请使用浏览器截屏。');}
});
window.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,button,a')||e.ctrlKey||e.metaKey||e.altKey)return;if(e.code==='Space'){e.preventDefault();toggleRide();}if(e.code==='KeyB')playBell();if(e.code==='KeyR')resetCamera();});
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();state.ready=false;renderer.setAnimationLoop(null);$('fallback').hidden=false;$('fallback').querySelector('strong').textContent='3D 画面暂时断开了';});
function resize(){const {width,height}=$('stage').getBoundingClientRect();renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe($('stage'));resize();

let previous=0,time=0,bellBounce=0,uiTick=0;
const tempColor=new THREE.Color();
function animate(now){
  const delta=previous?Math.min((now-previous)/1000,.05):0;previous=now;if(document.hidden)return;
  const motion=reducedMotion?0:delta;time+=motion;
  if(state.riding){state.phase+=delta*3.3*state.speed;state.distance+=delta*.0033*state.speed;}
  const phase=state.phase;
  wheels.forEach(w=>w.rotation.z=-phase*.78);updateLegs(phase);
  torso.position.y=state.riding?Math.sin(phase*2)*.023:0;
  torso.rotation.z=state.riding?Math.sin(phase)*.012:0;
  bellBounce=Math.max(0,bellBounce-delta*1.2);head.rotation.z=Math.sin(time*1.4)*.026+Math.sin(bellBounce*14)*bellBounce*.07;
  const blink=(time%5.7)>5.53?.12:1;eyes.forEach(e=>e.scale.y=.068*blink);
  const pos=scarfGeo.attributes.position;for(let i=0;i<pos.count;i++){const x=scarfBase[i*3];pos.setZ(i,Math.sin(x*8+time*7)*Math.abs(x)*.095*(state.riding?state.speed: .25));}pos.needsUpdate=true;scarfGeo.computeVertexNormals();
  dashes.forEach((d,i)=>d.position.x=((i*.68-phase*.24)%6.8+6.8)%6.8-3.4);
  clouds.forEach((c,i)=>{c.position.x=c.userData.baseX+Math.sin(time*.15+i)*.14;c.position.y+=Math.sin(time*.4+i)*motion*.018;});
  palmLeaves.forEach((p,i)=>p.rotation.z=Math.sin(time*1.6+i)*.035);
  foam.forEach((f,i)=>{f.position.y=-.41+Math.sin(time*1.5+i)*.008;f.scale.setScalar(1+Math.sin(time*.8+i)*.012);});
  boat.rotation.z=Math.sin(time*1.8)*.065;boat.position.y=-.32+Math.sin(time*1.3)*.035;
  gulls.forEach((g,i)=>{g.position.x=-2.4+i*.8+Math.sin(time*.22+i)*.35;g.position.y=3.4+i*.24+Math.sin(time*1.2+i)*.09;g.rotation.z=Math.sin(time*2+i)*.08;});
  const blend=1-Math.exp(-delta*3),night=state.mood==='night';
  hemi.color.lerp(tempColor.set(targetMood.hemi),blend);hemi.groundColor.lerp(tempColor.set(targetMood.ground),blend);
  sun.color.lerp(tempColor.set(targetMood.sun),blend);sun.intensity=THREE.MathUtils.lerp(sun.intensity,targetMood.intensity,blend);
  hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,targetMood.ambient,blend);rim.intensity=THREE.MathUtils.lerp(rim.intensity,targetMood.rim,blend);
  M.sea.color.lerp(tempColor.set(targetMood.sea),blend);M.seaEdge.color.lerp(tempColor.set(targetMood.edge),blend);
  renderer.toneMappingExposure=THREE.MathUtils.lerp(renderer.toneMappingExposure,targetMood.exposure,blend);
  lamp.intensity=THREE.MathUtils.lerp(lamp.intensity,night?3:0,blend);M.light.emissiveIntensity=night?2:.3;
  beamMaterial.opacity=THREE.MathUtils.lerp(beamMaterial.opacity,night?.055:0,blend);lighthouseGlow.rotation.y=time*.3;
  starMat.opacity=THREE.MathUtils.lerp(starMat.opacity,night?.8:0,blend);
  if(windGain&&state.sound)windGain.gain.setTargetAtTime(.12+Math.sin(time*.6)*.035,audioContext.currentTime,.3);
  uiTick+=delta;if(uiTick>.25){$('distance').textContent=state.distance.toFixed(2);uiTick=0;}
  controls.update();renderer.render(scene,camera);
  if(!state.ready){state.ready=true;$('loading').hidden=true;document.documentElement.dataset.sceneReady='true';}
}
renderer.setAnimationLoop(animate);
// Read-only diagnostics for the page's own acceptance checks.
window.pelicanDiagnostics=()=>({ready:state.ready,riding:state.riding,speed:state.speed,mood:state.mood,distance:state.distance,phase:state.phase,meshes:renderer.info.render.calls,triangles:renderer.info.render.triangles,webgl:renderer.capabilities.isWebGL2,camera:camera.position.toArray(),revision:THREE.REVISION});
