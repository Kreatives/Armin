/* =========================================================
   OGL page-curl — laat head-top.webp wegkrullen als papier.
   Expose: window.HeadCurl = { setProgress(p), resize(), ready }
   ========================================================= */
import { Renderer, Camera, Transform, Plane, Program, Mesh, Texture }
  from 'https://cdn.jsdelivr.net/npm/ogl@1.0.11/+esm';

const CFG = {
  texture: 'assets/head/head-top.webp',
  radius: 0.16,   // krulstraal (groter = dikkere, duidelijkere rol)
  angle: 1.6,     // rolrichting (radialen); ~1.57 = recht omhoog
  back: [0.961, 0.953, 0.933] // #F5F3EE off-white papier-achterkant
};

const canvas = document.querySelector('[data-curl-canvas]');
const DEBUG = new URLSearchParams(location.search).has('debug');

const vertex = /* glsl */`
  precision highp float;
  attribute vec3 position;
  attribute vec2 uv;
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uProgress;
  uniform float uRadius;
  uniform float uAngle;
  varying vec2 vUv;
  varying vec3 vNormal;
  const float PI = 3.141592653589793;
  void main() {
    vUv = uv;
    vec2 dir = vec2(cos(uAngle), sin(uAngle));       // 'omhoog' = rolrichting
    // Vouwlijn stijgt vanaf de scheur naar boven; het papier peelt/rolt op en gaat
    // aan het eind volledig het beeld uit (geen wegvliegen, gewoon oprollen).
    float fold = mix(0.1, 2.7, uProgress);
    float d = fold - dot(position.xy, dir);          // >0 = ónder de vouwlijn -> rolt op
    vec3 pos = position.xyz;
    vec3 nrm = vec3(0.0, 0.0, 1.0);
    float R = max(uRadius, 0.002);
    if (d > 0.0) {
      // Doorlopende wikkeling om een cilinder op de vouwlijn -> papier rolt op tot een buis
      float ang = d / R;
      pos.xy = position.xy + dir * (d - R * sin(ang));
      pos.z = R * (1.0 - cos(ang));                  // echte kromming (z)
      nrm = normalize(vec3(-dir * sin(ang), cos(ang)));
    }
    vNormal = nrm;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragment = /* glsl */`
  precision highp float;
  uniform sampler2D tMap;
  uniform vec3 uBack;
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vec3 L = normalize(vec3(-0.4, 0.5, 0.75));       // licht van linksboven
    vec3 N = normalize(vNormal);
    if (!gl_FrontFacing) N = -N;
    float diff = clamp(dot(N, L), 0.0, 1.0);
    vec4 tex = texture2D(tMap, vUv);
    if (gl_FrontFacing) {                            // voorkant: de foto
      gl_FragColor = vec4(tex.rgb * (0.5 + 0.5 * diff), tex.a);
    } else {                                         // achterkant: donkere onderkant van het haar (geen wit papier-cutout)
      gl_FragColor = vec4(tex.rgb * (0.22 + 0.30 * diff), tex.a);
    }
  }
`;

let renderer, gl, camera, scene, program, ready = false, progress = 0;

function render() {
  if (!ready) return;
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  if (progress <= 0.0002) return;                    // p=0 -> leeg canvas, geen render
  renderer.render({ scene, camera });
}

function resize() {
  if (!renderer) return;
  const parent = canvas.parentElement;            // .head (16:9 box) — bepaalt de maat
  const w = parent.clientWidth, h = parent.clientHeight;
  if (w < 1 || h < 1) return;
  renderer.setSize(w, h);
  canvas.style.width = '100%';                     // OGL zet px inline; forceer terug naar vullen
  canvas.style.height = '100%';
  render();
}

function setProgress(p) {
  progress = Math.max(0, Math.min(1, p));
  if (program) program.uniforms.uProgress.value = progress;
  render();
}

function buildPanel() {
  const panel = document.createElement('div');
  panel.className = 'curl-panel';
  panel.innerHTML = `
    <label>progress <input type="range" min="0" max="1" step="0.01" value="0" data-u="uProgress"></label>
    <label>radius <input type="range" min="0.02" max="0.4" step="0.01" value="${CFG.radius}" data-u="uRadius"></label>
    <label>angle <input type="range" min="-3.14" max="3.14" step="0.01" value="${CFG.angle}" data-u="uAngle"></label>`;
  document.body.appendChild(panel);
  panel.addEventListener('input', e => {
    const u = e.target.dataset.u;
    const v = parseFloat(e.target.value);
    if (u === 'uProgress') setProgress(v);
    else { program.uniforms[u].value = v; render(); }
  });
}

function init() {
  renderer = new Renderer({ canvas, alpha: true, premultipliedAlpha: false, dpr: 1 });
  gl = renderer.gl;
  gl.clearColor(0, 0, 0, 0);

  camera = new Camera(gl);
  camera.orthographic({ left: -1, right: 1, top: 1, bottom: -1, near: 0.01, far: 100 });
  camera.position.z = 2;

  scene = new Transform();
  const geometry = new Plane(gl, { width: 2, height: 2, widthSegments: 64, heightSegments: 64 });
  const texture = new Texture(gl, { premultiplyAlpha: false, generateMipmaps: false });

  program = new Program(gl, {
    vertex, fragment, transparent: true, cullFace: false, depthTest: false, depthWrite: false,
    uniforms: {
      uProgress: { value: 0 }, uRadius: { value: CFG.radius }, uAngle: { value: CFG.angle },
      tMap: { value: texture }, uBack: { value: CFG.back }
    }
  });
  const mesh = new Mesh(gl, { geometry, program });
  mesh.setParent(scene);

  const img = new Image();
  img.onload = () => {
    texture.image = img;
    ready = true;
    resize();
    window.dispatchEvent(new Event('headcurl-ready'));
  };
  img.src = CFG.texture;

  window.addEventListener('resize', resize);
  if (DEBUG) buildPanel();
}

init();
window.HeadCurl = { setProgress, resize, get ready() { return ready; } };
