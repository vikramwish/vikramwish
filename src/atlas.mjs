import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { locations } from '../content/locations.mjs';

// Ordered Bayer and halftone passes adapted from the Canvas UI reference supplied
// with this project. The atlas builds its own globe rather than loading a model.
const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position,1.0);}`;
const fragment = `
precision highp float;
varying vec2 vUv;
uniform sampler2D tScene;
uniform vec2 resolution;
uniform float cellSize;
uniform int method;
float bayer(vec2 p){
  int x=int(mod(p.x,4.0)); int y=int(mod(p.y,4.0));
  if(y==0){if(x==0)return 0.0;if(x==1)return 8.0;if(x==2)return 2.0;return 10.0;}
  if(y==1){if(x==0)return 12.0;if(x==1)return 4.0;if(x==2)return 14.0;return 6.0;}
  if(y==2){if(x==0)return 3.0;if(x==1)return 11.0;if(x==2)return 1.0;return 9.0;}
  if(x==0)return 15.0;if(x==1)return 7.0;if(x==2)return 13.0;return 5.0;
}
void main(){
  vec2 pixel=vUv*resolution;
  vec2 uv=method==2?vUv:(floor(pixel/cellSize)+0.5)*cellSize/resolution;
  vec4 tex=texture2D(tScene,uv);
  vec3 color=pow(max(tex.rgb,vec3(0.0)),vec3(1.0/2.2));
  float light=dot(color,vec3(0.2126,0.7152,0.0722));
  float threshold=(bayer(floor(pixel/cellSize))+0.5)/16.0;
  if(method==1){vec2 p=pixel/(cellSize*3.0);vec2 rotated=vec2(p.x-p.y,p.x+p.y)*0.7071;threshold=length(fract(rotated)-0.5)*1.4142;}
  float tone=method==2?light:step(threshold,smoothstep(0.15,0.65,light));
  vec3 ink=vec3(0.055,0.065,0.055);
  vec3 paper=vec3(0.949,0.953,0.937);
  gl_FragColor=vec4(mix(ink,paper,tone)*tex.a,tex.a);
}`;

export function geoVector(lat, lon, radius = 1.3) {
  const phi = THREE.MathUtils.degToRad(lat);
  const theta = THREE.MathUtils.degToRad(lon);
  return new THREE.Vector3(Math.cos(phi)*Math.cos(theta), Math.sin(phi), -Math.cos(phi)*Math.sin(theta)).multiplyScalar(radius);
}

export function createAtlas({ canvas, onProject, onReady, onError }) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' }); }
  catch (error) { onError(error); return null; }
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 30);
  camera.position.copy(geoVector(-18, 130, 4.6));
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.09;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.65;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = Math.PI - 0.12;
  canvas.style.touchAction = 'pan-y';
  const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
  const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms: { tScene: {value: target.texture}, resolution: {value: new THREE.Vector2(1,1)}, cellSize: {value: 3}, method: {value: 0} }, depthTest: false, depthWrite: false, blending: THREE.NoBlending });
  const quadGeometry = new THREE.PlaneGeometry(2,2);
  const postScene = new THREE.Scene();
  postScene.add(new THREE.Mesh(quadGeometry, material));
  const postCamera = new THREE.Camera();
  const globeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.05 });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(1.3, 96, 64), globeMaterial);
  scene.add(globe);
  scene.add(new THREE.AmbientLight(0xffffff, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 3);
  key.position.set(-3,4,5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2);
  rim.position.set(5,-1,-3); scene.add(rim);
  const wireMaterial = new THREE.LineBasicMaterial({ color: 0x6e7a6c, transparent: true, opacity: 0.4 });
  function line(points, lineMaterial = wireMaterial) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const object = new THREE.Line(geometry, lineMaterial);
    scene.add(object); return object;
  }
  for (let lat=-60;lat<=60;lat+=30) line(Array.from({length:181},(_,i)=>geoVector(lat,i*2-180,1.307)));
  for (let lon=0;lon<360;lon+=30) line(Array.from({length:181},(_,i)=>geoVector(i-90,lon,1.307)));
  const ring = line(Array.from({length:257},(_,i)=>new THREE.Vector3(Math.cos(i/256*Math.PI*2)*1.68,0,Math.sin(i/256*Math.PI*2)*1.68)), new THREE.LineBasicMaterial({color:0x7e8a7c}));
  ring.rotation.z=0.38;
  const marker = new THREE.Mesh(new THREE.BoxGeometry(.075,.075,.075), new THREE.MeshStandardMaterial({color:0x6c7869,roughness:.4}));
  marker.position.set(1.56,.63,0); scene.add(marker);
  // Keep thin instrument rings legible; the sphere is dithered in the post pass.
  const overlayScene=new THREE.Scene();
  const depthGlobe=new THREE.Mesh(globe.geometry,new THREE.MeshBasicMaterial({colorWrite:false}));
  overlayScene.add(depthGlobe);scene.remove(ring);ring.renderOrder=1;overlayScene.add(ring);
  scene.remove(marker);marker.material.dispose();marker.material=new THREE.MeshBasicMaterial({color:0x172018});marker.renderOrder=1;overlayScene.add(marker);
  let frame=0, visible=true, disposed=false, spinning=false, loaded=false, dirty=true, focus=null, lastTime=0, grid=2, ready=false;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const projected = new THREE.Vector3();
  const direction = new THREE.Vector3();
  function project() {
    direction.copy(camera.position).normalize();
    onProject(locations.map(location=>{
      const point=geoVector(location.lat,location.lon,1.325);
      const front=point.clone().normalize().dot(direction)>0.17;
      projected.copy(point).project(camera);
      return {id:location.id,x:(projected.x+1)/2,y:(1-projected.y)/2,visible:front&&projected.z<1};
    }));
  }
  function request() { dirty=true;if(!frame&&visible&&!disposed)frame=requestAnimationFrame(tick); }
  function tick(time) {
    frame=0;
    if(disposed||!visible)return;
    const delta=lastTime?Math.min((time-lastTime)/1000,.05):0;
    lastTime=time;
    if(focus){
      const t=reduced.matches?1:Math.min((time-focus.start)/750,1);
      const eased=t*t*(3-2*t);
      const q=new THREE.Quaternion().slerpQuaternions(new THREE.Quaternion(),focus.rotation,eased);
      camera.position.copy(focus.from).applyQuaternion(q);
      if(t===1)focus=null;
      dirty=true;
    }
    if(spinning&&!reduced.matches&&!focus){camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),delta*.12);dirty=true;}
    const changed=controls.update();
    if(dirty||changed){
      renderer.setRenderTarget(target);renderer.render(scene,camera);
      renderer.setRenderTarget(null);renderer.render(postScene,postCamera);
      renderer.autoClear=false;renderer.clearDepth();renderer.render(overlayScene,camera);renderer.autoClear=true;
      project();dirty=false;
      if(loaded&&!ready){ready=true;onReady();}
    }
    if(!frame&&(focus||(spinning&&!reduced.matches)||changed))frame=requestAnimationFrame(tick);
  }
  function resize() {
    if(disposed)return;
    const width=Math.max(canvas.clientWidth,1),height=Math.max(canvas.clientHeight,1);
    const gl=renderer.getContext();
    const max=Math.min(4096,gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
    const ratio=Math.min((devicePixelRatio||1)*(visualViewport?.scale||1),1.75,max/Math.max(width,height),Math.sqrt(2400000/(width*height)));
    renderer.setPixelRatio(ratio);renderer.setSize(width,height,false);
    target.setSize(Math.max(1,Math.round(width*ratio)),Math.max(1,Math.round(height*ratio)));
    material.uniforms.resolution.value.set(width*ratio,height*ratio);
    material.uniforms.cellSize.value=grid*ratio;
    camera.aspect=width/height;camera.fov=43/Math.min(1,camera.aspect);camera.updateProjectionMatrix();request();
  }
  function goTo(location) {
    spinning=false;
    const from=camera.position.clone();
    const to=geoVector(location.lat,location.lon,1).normalize();
    focus={from,rotation:new THREE.Quaternion().setFromUnitVectors(from.clone().normalize(),to),start:performance.now()};
    request();
  }
  function handleStart(){focus=null;spinning=false;request();}
  function keydown(event){
    const moves={ArrowLeft:[-.13,0],ArrowRight:[.13,0],ArrowUp:[0,-.13],ArrowDown:[0,.13]};
    if(!moves[event.key])return;
    event.preventDefault();focus=null;spinning=false;
    const sphere=new THREE.Spherical().setFromVector3(camera.position);
    sphere.theta+=moves[event.key][0];sphere.phi=THREE.MathUtils.clamp(sphere.phi+moves[event.key][1],.12,Math.PI-.12);
    camera.position.setFromSpherical(sphere);request();
  }
  function motionChanged(){if(reduced.matches)spinning=false;request();}
  function contextLost(event){event.preventDefault();onError(new Error('The 3D view was interrupted.'));destroy();}
  const observer=new ResizeObserver(resize);observer.observe(canvas);
  const intersection=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){lastTime=0;request();}else{cancelAnimationFrame(frame);frame=0;}});intersection.observe(canvas);
  controls.addEventListener('change',request);controls.addEventListener('start',handleStart);
  canvas.addEventListener('keydown',keydown);canvas.addEventListener('webglcontextlost',contextLost);
  window.addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);reduced.addEventListener('change',motionChanged);
  const texture=new THREE.TextureLoader().load(new URL('land.svg',document.baseURI).href,()=>{
    if(disposed){texture.dispose();return;}texture.colorSpace=THREE.SRGBColorSpace;globeMaterial.map=texture;globeMaterial.needsUpdate=true;loaded=true;request();
  },undefined,error=>{if(!disposed){onError(error);destroy();}});
  function destroy(){
    if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();intersection.disconnect();controls.dispose();
    canvas.removeEventListener('keydown',keydown);canvas.removeEventListener('webglcontextlost',contextLost);window.removeEventListener('resize',resize);window.visualViewport?.removeEventListener('resize',resize);reduced.removeEventListener('change',motionChanged);
    const geometries=new Set(),materials=new Set();for(const root of [scene,overlayScene])root.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)materials.add(object.material);});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());texture.dispose();target.dispose();quadGeometry.dispose();material.dispose();renderer.dispose();
  }
  resize();request();
  return {
    focus:goTo,
    setMethod(value){material.uniforms.method.value={bayer:0,halftone:1,clean:2}[value]??0;request();},
    setGrid(value){grid=THREE.MathUtils.clamp(Number(value)||3,2,8);resize();},
    setSpin(value){spinning=Boolean(value)&&!reduced.matches;focus=null;lastTime=0;request();},
    reset(){goTo({lat:-18,lon:130});},
    destroy
  };
}
