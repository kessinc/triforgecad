/**
 * TriForge CAD Pro 3.0 — Full Engine
 * Three.js r128 | Draw Mode | 20+ Shapes | Pro Transform
 */
'use strict';

/* ════════════════════════════════════════
   GLOBAL STATE
════════════════════════════════════════ */
const APP = {
    // Three.js
    scene: null, camera: null, renderer: null,
    orbit: null, transform: null,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),

    // Objects
    objects: [], selected: null,

    // Scene elements
    grid: null, axesHelper: null, ambLight: null, sunLight: null,

    // Tool state
    mode: 'object',       // 'object' | 'edit' | 'sketch'
    activeTool: 'select', // 'select' | 'translate' | 'rotate' | 'scale'
    editSel: 'vertex',
    space: 'world',
    snap: false,
    snapVal: 1,
    presetSize: 20,
    uniformScale: true,
    drawTool: 'line',

    // Sketch state
    sketch: {
        active: false,
        points: [],       // [{x,y} screen coords]
        pts3d: [],        // THREE.Vector3 world coords on XZ plane
        preview: null,    // THREE.Line in scene
        editHelpers: [],  // vertex dots
        closed: true,
        color: '#58a6ff',
        strokeW: 2,
        extrudeH: 10,
    },

    // Render
    renderMode: 'solid',
    editHelpers: [],
    fps: 0, fc: 0, fpsT: performance.now(),
    w: 0, h: 0,

    // History
    history: [], histIdx: -1, MAX_HIST: 80,
};

/* ════════════════════════════════════════
   BOOT
════════════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
    initRenderer();
    initScene();
    initLights();
    initGrid();
    initCamera();
    initControls();
    initGizmo();
    initCollapsibles();
    initPanelTabs();
    bindAll();
    bindKeyboard();
    renderLoop();
    saveHist('init');
    toast('TriForge CAD Pro 3.0 — Hazır! Sol panelden şekil ekleyin veya Çizim Modu\'na geçin.', 'success', 4000);
    setStatus('Hazır');
});

/* ── Renderer ── */
function initRenderer() {
    const canvas = document.getElementById('mainCanvas');
    APP.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    APP.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    APP.renderer.shadowMap.enabled = true;
    APP.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    APP.renderer.outputEncoding = THREE.sRGBEncoding;
    APP.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    APP.renderer.toneMappingExposure = 1.0;
    resizeRenderer();
    window.addEventListener('resize', resizeRenderer);
}
function resizeRenderer() {
    const vp = document.getElementById('viewport');
    APP.w = vp.clientWidth; APP.h = vp.clientHeight;
    APP.renderer.setSize(APP.w, APP.h);
    if (APP.camera) { APP.camera.aspect = APP.w / APP.h; APP.camera.updateProjectionMatrix(); }
    const sk = document.getElementById('sketchCanvas');
    if (sk) { sk.width = APP.w; sk.height = APP.h; }
}

/* ── Scene ── */
function initScene() {
    APP.scene = new THREE.Scene();
    APP.scene.background = new THREE.Color(0x060a0e);
    APP.scene.fog = new THREE.FogExp2(0x060a0e, 0.0022);
}

/* ── Lights ── */
function initLights() {
    APP.ambLight = new THREE.AmbientLight(0x3a4a60, 1.0);
    APP.scene.add(APP.ambLight);

    APP.sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    APP.sunLight.position.set(100, 140, 80);
    APP.sunLight.castShadow = true;
    APP.sunLight.shadow.mapSize.set(2048, 2048);
    const sc = APP.sunLight.shadow.camera;
    sc.near=1; sc.far=1000; sc.left=-300; sc.right=300; sc.top=300; sc.bottom=-300;
    APP.sunLight.shadow.bias = -0.0003;
    APP.scene.add(APP.sunLight);

    const hemi = new THREE.HemisphereLight(0x4477aa, 0x112244, 0.7);
    APP.scene.add(hemi);

    const p1 = new THREE.PointLight(0x4488ff, 0.4, 400); p1.position.set(-120, 100, -120); APP.scene.add(p1);
    const p2 = new THREE.PointLight(0x44ffaa, 0.25, 400); p2.position.set(120, 60, 120); APP.scene.add(p2);
}

/* ── Grid ── */
function initGrid() {
    buildGrid(200);
    APP.axesHelper = new THREE.AxesHelper(40);
    APP.scene.add(APP.axesHelper);
    // Bed frame
    const bg = new THREE.EdgesGeometry(new THREE.BoxGeometry(200, 0.1, 200));
    const bm = new THREE.LineBasicMaterial({ color: 0x1a3a5f, transparent: true, opacity: 0.5 });
    const bf = new THREE.LineSegments(bg, bm); bf.position.y = 0.05;
    APP.scene.add(bf);
}
function buildGrid(size) {
    if (APP.grid) { APP.scene.remove(APP.grid); APP.grid.geometry.dispose(); }
    APP.grid = new THREE.GridHelper(size, Math.round(size/5), 0x1a3050, 0x0f1e30);
    APP.scene.add(APP.grid);
}

/* ── Camera ── */
function initCamera() {
    APP.camera = new THREE.PerspectiveCamera(45, APP.w / APP.h, 0.1, 10000);
    APP.camera.position.set(90, 65, 90);
    APP.camera.lookAt(0, 10, 0);
}

/* ── Controls ── */
function initControls() {
    APP.orbit = new THREE.OrbitControls(APP.camera, APP.renderer.domElement);
    APP.orbit.enableDamping = true; APP.orbit.dampingFactor = 0.06;
    APP.orbit.minDistance = 0.5; APP.orbit.maxDistance = 6000;
    APP.orbit.maxPolarAngle = Math.PI * 0.92;
    APP.orbit.screenSpacePanning = true;

    APP.transform = new THREE.TransformControls(APP.camera, APP.renderer.domElement);
    APP.transform.setSize(1.1);
    APP.transform.addEventListener('dragging-changed', e => { APP.orbit.enabled = !e.value; });
    APP.transform.addEventListener('mouseUp', () => { if (APP.selected) { applySnap(APP.selected); saveHist('tx'); refreshInspector(APP.selected); updateStatusBar(APP.selected); } });
    APP.transform.addEventListener('change', () => { if (APP.selected) { refreshInspectorLive(APP.selected); updateStatusBar(APP.selected); } });
    APP.scene.add(APP.transform);

    const cv = document.getElementById('mainCanvas');
    cv.addEventListener('pointerdown', onPointerDown);
    cv.addEventListener('mousemove', onMouseMove);
    cv.addEventListener('contextmenu', onCtxMenuShow);
    document.addEventListener('pointerdown', onDocClick);
    document.addEventListener('pointerup', onPointerUp);
}

/* ════════════════════════════════════════
   RENDER LOOP
════════════════════════════════════════ */
function renderLoop() {
    requestAnimationFrame(renderLoop);
    APP.fc++;
    const now = performance.now();
    if (now - APP.fpsT >= 1000) { APP.fps = APP.fc; APP.fc = 0; APP.fpsT = now; el('sFps').textContent = APP.fps; }
    APP.orbit.update();
    updateGizmo();
    APP.renderer.render(APP.scene, APP.camera);
}

/* ════════════════════════════════════════
   SHAPE GEOMETRY FACTORY
════════════════════════════════════════ */
const SHAPE_INFO = {
    box:     { label:'Küp',      color:0x4fc3f7 },
    cylinder:{ label:'Silindir', color:0x80cbc4 },
    sphere:  { label:'Küre',     color:0xa5d6a7 },
    cone:    { label:'Koni',     color:0xffcc80 },
    torus:   { label:'Torus',    color:0xef9a9a },
    plane:   { label:'Düzlem',   color:0xce93d8 },
    capsule: { label:'Kapsül',   color:0x90caf9 },
    pyramid: { label:'Piramit',  color:0xfff59d },
    tube:    { label:'Boru',     color:0x80deea },
    ring:    { label:'Halka',    color:0xffab91 },
    octa:    { label:'Okta',     color:0xb39ddb },
    dodeca:  { label:'Dodeka',   color:0xf48fb1 },
    icosa:   { label:'İkosa',    color:0xa5d6a7 },
    tetra:   { label:'Tetra',    color:0xffd740 },
    spring:  { label:'Yay',      color:0x69f0ae },
    arrow:   { label:'Ok',       color:0xffab91 },
    prism:   { label:'Prizma',   color:0x80cbc4 },
    sketch:  { label:'Çizim',    color:0xbc8cff },
    text3d:  { label:'Metin',    color:0xffd740 },
    mannequin:{ label:'Karakter', color:0xf48fb1 },
    tree:     { label:'Ağaç',     color:0x81c784 },
    terrain:  { label:'Arazi',    color:0xa1887f },
    stairs:   { label:'Merdiven', color:0xe0e0e0 },
    wall:     { label:'Duvar',    color:0x90a4ae },
    house:    { label:'Ev',       color:0xffb74d },
    sword:    { label:'Kılıç',     color:0xe0e0e0 },
    tower:    { label:'Kule',     color:0xb0bec5 },
    rock:     { label:'Kaya',     color:0xa1887f },
    shield:   { label:'Kalkan',   color:0x90caf9 },
    chest:    { label:'Sandık',   color:0xa1887f },
    barrel:   { label:'Varil',    color:0xd7ccc8 },
};

function buildGeo(type, p = {}) {
    const s = APP.presetSize;
    switch (type) {
        case 'box':
            return { geo: new THREE.BoxGeometry(p.w||s, p.h||s, p.d||s, cap(p.segW,1,64,Math.round((p.w||s)/5)), cap(p.segH,1,64,Math.round((p.h||s)/5)), cap(p.segD,1,64,Math.round((p.d||s)/5))), params:{ w:p.w||s, h:p.h||s, d:p.d||s } };
        case 'cylinder':
            return { geo: new THREE.CylinderGeometry(p.r||s/2, p.rb||p.r||s/2, p.h||s, p.seg||48), params:{ r:p.r||s/2, rb:p.rb||p.r||s/2, h:p.h||s, seg:p.seg||48 } };
        case 'sphere':
            return { geo: new THREE.SphereGeometry(p.r||s/2, p.ws||40, p.hs||20), params:{ r:p.r||s/2, ws:p.ws||40, hs:p.hs||20 } };
        case 'cone':
            return { geo: new THREE.ConeGeometry(p.r||s/2, p.h||s, p.seg||48), params:{ r:p.r||s/2, h:p.h||s, seg:p.seg||48 } };
        case 'torus':
            return { geo: new THREE.TorusGeometry(p.r||s/2, p.tube||s/6, p.rs||20, p.ts||72), params:{ r:p.r||s/2, tube:p.tube||s/6, rs:p.rs||20, ts:p.ts||72 } };
        case 'plane':
            return { geo: new THREE.PlaneGeometry(p.w||s*1.5, p.h||s*1.5, 10, 10), params:{ w:p.w||s*1.5, h:p.h||s*1.5 } };
        case 'capsule':
            return { geo: new THREE.CapsuleGeometry(p.r||s/4, p.len||s/2, 10, 24), params:{ r:p.r||s/4, len:p.len||s/2 } };
        case 'pyramid':
            return { geo: new THREE.ConeGeometry(p.w||s/2, p.h||s, 4), params:{ w:p.w||s/2, h:p.h||s } };
        case 'tube':
            return { geo: new THREE.CylinderGeometry(p.ro||s/2, p.ro||s/2, p.h||s, 48, 1, true), params:{ ro:p.ro||s/2, h:p.h||s } };
        case 'ring':
            return { geo: new THREE.TorusGeometry(p.r||s/2, p.tube||s/8, 4, 48), params:{ r:p.r||s/2, tube:p.tube||s/8 } };
        case 'octa':
            return { geo: new THREE.OctahedronGeometry(p.r||s/2, 0), params:{ r:p.r||s/2 } };
        case 'dodeca':
            return { geo: new THREE.DodecahedronGeometry(p.r||s/2, 0), params:{ r:p.r||s/2 } };
        case 'icosa':
            return { geo: new THREE.IcosahedronGeometry(p.r||s/2, p.detail||1), params:{ r:p.r||s/2, detail:p.detail||1 } };
        case 'tetra':
            return { geo: new THREE.TetrahedronGeometry(p.r||s/2, 0), params:{ r:p.r||s/2 } };
        case 'spring': {
            const pts = []; const turns = p.turns||5; const radius = p.r||s/3; const height = p.h||s;
            for (let i=0; i<=turns*32; i++) {
                const t = i/(turns*32), angle = t*Math.PI*2*turns;
                pts.push(new THREE.Vector3(Math.cos(angle)*radius, t*height - height/2, Math.sin(angle)*radius));
            }
            const curve = new THREE.CatmullRomCurve3(pts);
            return { geo: new THREE.TubeGeometry(curve, turns*16, p.tube||s/12, 8, false), params:{ r:radius, h:height, tube:p.tube||s/12, turns:turns } };
        }
        case 'arrow': {
            const shaftG = new THREE.CylinderGeometry(p.sw||s/8, p.sw||s/8, p.h||s*0.7, 16);
            const headG  = new THREE.ConeGeometry(p.hw||s/4, p.hh||s*0.3, 16);
            shaftG.translate(0, -(p.hh||s*0.3)/2, 0);
            headG.translate(0, (p.h||s*0.7)/2, 0);
            const merged = mergeBufferGeometries([shaftG, headG]);
            return { geo: merged || shaftG, params:{ sw:p.sw||s/8, h:p.h||s*0.7, hw:p.hw||s/4, hh:p.hh||s*0.3 } };
        }
        case 'prism': {
            const pts2 = [];
            const sides = p.sides || 3;
            for (let i=0; i<sides; i++) {
                const a = (i/sides)*Math.PI*2 - Math.PI/2;
                pts2.push(new THREE.Vector2(Math.cos(a)*(p.r||s/2), Math.sin(a)*(p.r||s/2)));
            }
            const shape = new THREE.Shape(pts2);
            return { geo: new THREE.ExtrudeGeometry(shape, { depth: p.d||s, bevelEnabled: false }), params:{ r:p.r||s/2, d:p.d||s, sides:sides } };
        }
        case 'mannequin': {
            const head = new THREE.BoxGeometry(s/4, s/4, s/4); head.translate(0, s*0.75, 0);
            const torso = new THREE.BoxGeometry(s/3, s/2, s/5); torso.translate(0, s*0.4, 0);
            const lLeg = new THREE.BoxGeometry(s/10, s/2, s/10); lLeg.translate(-s/10, -s/10, 0);
            const rLeg = new THREE.BoxGeometry(s/10, s/2, s/10); rLeg.translate(s/10, -s/10, 0);
            const lArm = new THREE.BoxGeometry(s/10, s/2, s/10); lArm.translate(-s/4, s*0.4, 0);
            const rArm = new THREE.BoxGeometry(s/10, s/2, s/10); rArm.translate(s/4, s*0.4, 0);
            const merged = mergeBufferGeometries([head, torso, lLeg, rLeg, lArm, rArm]);
            return { geo: merged || torso, params: {} };
        }
        case 'tree': {
            const trunkGeo = new THREE.CylinderGeometry(s/10, s/10, s/2, 8); trunkGeo.translate(0, s/4, 0);
            const leaves1 = new THREE.ConeGeometry(s/2, s*0.6, 8); leaves1.translate(0, s*0.6, 0);
            const leaves2 = new THREE.ConeGeometry(s*0.38, s*0.5, 8); leaves2.translate(0, s*0.95, 0);
            const leaves3 = new THREE.ConeGeometry(s*0.25, s*0.4, 8); leaves3.translate(0, s*1.25, 0);
            const merged = mergeBufferGeometries([trunkGeo, leaves1, leaves2, leaves3]);
            return { geo: merged || trunkGeo, params: {} };
        }
        case 'terrain': {
            const width = p.w || s * 3;
            const depth = p.d || s * 3;
            const segs = p.seg || 24;
            const geo = new THREE.PlaneGeometry(width, depth, segs, segs);
            geo.rotateX(-Math.PI/2);
            const pos = geo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const vx = pos.getX(i);
                const vz = pos.getZ(i);
                const y = Math.sin(vx * 0.05) * Math.cos(vz * 0.05) * 6 + Math.sin(vx * 0.02) * 4;
                pos.setY(i, y);
            }
            geo.computeVertexNormals();
            return { geo, params: { w: width, d: depth, seg: segs } };
        }
        case 'stairs': {
            const w = p.w || s;
            const h = p.h || s;
            const steps = p.steps || 6;
            const stepH = h / steps;
            const stepD = s / steps;
            const parts = [];
            for (let i = 0; i < steps; i++) {
                const stepHeight = stepH * (i + 1);
                const box = new THREE.BoxGeometry(w, stepHeight, stepD);
                box.translate(0, stepHeight/2, -s/2 + stepD * i + stepD/2);
                parts.push(box);
            }
            const merged = mergeBufferGeometries(parts);
            return { geo: merged || parts[0], params: { w, h, steps } };
        }
        case 'wall': {
            const w = p.w || s * 1.5;
            const h = p.h || s;
            const t = p.t || s / 8;
            const doorW = w * 0.3;
            const doorH = h * 0.7;
            const leftW = (w - doorW) / 2;
            const rightW = leftW;
            const leftBox = new THREE.BoxGeometry(leftW, h, t); leftBox.translate(-w/2 + leftW/2, h/2, 0);
            const rightBox = new THREE.BoxGeometry(rightW, h, t); rightBox.translate(w/2 - rightW/2, h/2, 0);
            const topH = h - doorH;
            const topBox = new THREE.BoxGeometry(doorW, topH, t); topBox.translate(0, h - topH/2, 0);
            const merged = mergeBufferGeometries([leftBox, rightBox, topBox]);
            return { geo: merged || leftBox, params: { w, h, t } };
        }
        case 'house': {
            const base = new THREE.BoxGeometry(s*0.8, s*0.6, s*0.8); base.translate(0, s*0.3, 0);
            const roof = new THREE.ConeGeometry(s*0.65, s*0.4, 4); roof.rotateY(Math.PI/4); roof.translate(0, s*0.8, 0);
            const chimney = new THREE.BoxGeometry(s*0.12, s*0.3, s*0.12); chimney.translate(s*0.22, s*0.65, -s*0.22);
            const merged = mergeBufferGeometries([base, roof, chimney]);
            return { geo: merged || base, params: {} };
        }
        case 'sword': {
            const blade = new THREE.BoxGeometry(s*0.08, s*0.8, s*0.03); blade.translate(0, s*0.5, 0);
            const guard = new THREE.BoxGeometry(s*0.3, s*0.06, s*0.06); guard.translate(0, s*0.1, 0);
            const hilt = new THREE.CylinderGeometry(s*0.03, s*0.03, s*0.2, 8); hilt.translate(0, 0, 0);
            const pommel = new THREE.SphereGeometry(s*0.05, 8, 8); pommel.translate(0, -s*0.12, 0);
            const merged = mergeBufferGeometries([blade, guard, hilt, pommel]);
            return { geo: merged || blade, params: {} };
        }
        case 'tower': {
            const base = new THREE.CylinderGeometry(s*0.4, s*0.4, s*0.8, 12); base.translate(0, s*0.4, 0);
            const top = new THREE.CylinderGeometry(s*0.48, s*0.48, s*0.2, 12); top.translate(0, s*0.9, 0);
            const battlements = [];
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const bat = new THREE.BoxGeometry(s*0.12, s*0.1, s*0.12);
                bat.translate(Math.cos(angle)*s*0.4, s*1.05, Math.sin(angle)*s*0.4);
                battlements.push(bat);
            }
            const merged = mergeBufferGeometries([base, top, ...battlements]);
            return { geo: merged || base, params: {} };
        }
        case 'rock': {
            const rockGeo = new THREE.DodecahedronGeometry(s/2, 1);
            const pos = rockGeo.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                const vx = pos.getX(i);
                const vy = pos.getY(i);
                const vz = pos.getZ(i);
                const scaleFactor = 0.8 + 0.3 * Math.sin(vx * 15 + vy * 10 + vz * 5);
                pos.setXYZ(i, vx * scaleFactor, vy * scaleFactor * 0.9, vz * scaleFactor);
            }
            rockGeo.computeVertexNormals();
            return { geo: rockGeo, params: {} };
        }
        case 'shield': {
            const base = new THREE.CylinderGeometry(s*0.4, s*0.4, s*0.06, 6);
            base.rotateX(Math.PI/2);
            base.translate(0, s*0.4, 0);
            const boss = new THREE.SphereGeometry(s*0.1, 8, 8);
            boss.translate(0, s*0.4, s*0.03);
            const merged = mergeBufferGeometries([base, boss]);
            return { geo: merged || base, params: {} };
        }
        case 'chest': {
            const base = new THREE.BoxGeometry(s*0.8, s*0.4, s*0.5);
            base.translate(0, s*0.2, 0);
            const lid = new THREE.BoxGeometry(s*0.8, s*0.2, s*0.5);
            lid.translate(0, s*0.5, 0);
            const lock = new THREE.BoxGeometry(s*0.08, s*0.12, s*0.05);
            lock.translate(0, s*0.35, s*0.27);
            const merged = mergeBufferGeometries([base, lid, lock]);
            return { geo: merged || base, params: {} };
        }
        case 'barrel': {
            const body = new THREE.CylinderGeometry(s*0.35, s*0.35, s*0.8, 10);
            body.translate(0, s*0.4, 0);
            const hoop1 = new THREE.TorusGeometry(s*0.36, s*0.02, 4, 10);
            hoop1.rotateX(Math.PI/2);
            hoop1.translate(0, s*0.6, 0);
            const hoop2 = new THREE.TorusGeometry(s*0.36, s*0.02, 4, 10);
            hoop2.rotateX(Math.PI/2);
            hoop2.translate(0, s*0.2, 0);
            const merged = mergeBufferGeometries([body, hoop1, hoop2]);
            return { geo: merged || body, params: {} };
        }
        default:
            return { geo: new THREE.BoxGeometry(s,s,s), params:{ w:s, h:s, d:s } };
    }
}

function mergeBufferGeometries(geos) {
    try {
        if (typeof THREE.BufferGeometryUtils !== 'undefined' && THREE.BufferGeometryUtils.mergeBufferGeometries) {
            const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(geos);
            if (merged) {
                merged.clearGroups(); // Clear groups to avoid multi-material rendering issues
                return merged;
            }
        }
    } catch (e) {
        console.error('BufferGeometryUtils failed, falling back to manual merge:', e);
    }
    
    // Fallback: manual non-indexed merge if BufferGeometryUtils is not loaded for some reason
    const nonIndexedGeos = geos.map(g => {
        const newG = g.index ? g.toNonIndexed() : g.clone();
        newG.clearGroups(); // Clear groups to avoid group rendering issues in manual fallback
        return newG;
    });
    
    let vc = 0;
    nonIndexedGeos.forEach(g => { vc += g.attributes.position.count; });
    const pos = new Float32Array(vc*3);
    const nrm = new Float32Array(vc*3);
    let off = 0;
    nonIndexedGeos.forEach(g => {
        const pa = g.attributes.position, na = g.attributes.normal;
        for (let i=0; i<pa.count; i++) {
            pos[(off+i)*3]   = pa.getX(i);
            pos[(off+i)*3+1] = pa.getY(i);
            pos[(off+i)*3+2] = pa.getZ(i);
            if (na) {
                nrm[(off+i)*3]   = na.getX(i);
                nrm[(off+i)*3+1] = na.getY(i);
                nrm[(off+i)*3+2] = na.getZ(i);
            }
        }
        off += pa.count;
    });
    
    nonIndexedGeos.forEach(g => g.dispose());
    
    const out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    out.computeVertexNormals();
    return out;
}

/* ════════════════════════════════════════
   ADD OBJECT
════════════════════════════════════════ */
function addObject(type, extraParams = {}) {
    if (APP.objects.length >= 500) { toast('⚠ Maksimum 500 obje', 'warning', 2000); return null; }
    const info = SHAPE_INFO[type] || { label:'Obje', color:0x4fc3f7 };
    const { geo, params } = buildGeo(type, extraParams);
    const mat = new THREE.MeshStandardMaterial({ color: info.color, metalness: 0.2, roughness: 0.6 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    // Seat on grid
    const bb = new THREE.Box3().setFromObject(mesh);
    mesh.position.y = -bb.min.y;
    mesh.userData = { id: uid(), type, name: `${info.label} ${APP.objects.length+1}`, params, visible:true, locked:false };
    addWireEdges(mesh);
    APP.scene.add(mesh); APP.objects.push(mesh);
    selectObj(mesh); refreshOutliner(); updateStats();
    saveHist('add');
    toast(`✓ "${mesh.userData.name}" eklendi`, 'success', 1600);
    setStatus(`"${mesh.userData.name}" sahnede`);
    return mesh;
}

function addWireEdges(mesh) {
    const eg = new THREE.EdgesGeometry(mesh.geometry, 15);
    const em = new THREE.LineBasicMaterial({ color: 0x58a6ff, transparent:true, opacity:0.22 });
    const lines = new THREE.LineSegments(eg, em);
    lines.visible = el('tglWire')?.checked || false;
    mesh.add(lines);
    mesh.userData.edges = lines;
}

function rebuildWireEdges(mesh) {
    if (mesh.userData.edges) { mesh.remove(mesh.userData.edges); mesh.userData.edges.geometry.dispose(); }
    addWireEdges(mesh);
}

/* ════════════════════════════════════════
   GEOMETRY REBUILD
════════════════════════════════════════ */
function rebuildGeometry(mesh, newParams) {
    const { geo } = buildGeo(mesh.userData.type, newParams);
    mesh.geometry.dispose(); mesh.geometry = geo;
    mesh.userData.params = { ...mesh.userData.params, ...newParams };
    mesh.userData.origPosition = null; // Reset original positions copy
    rebuildWireEdges(mesh);
    refreshInspector(mesh); updateStats(); saveHist('geo');
}

/* ════════════════════════════════════════
   SELECTION
════════════════════════════════════════ */
function selectObj(obj) {
    if (APP.selected && APP.selected !== obj) dehighlight(APP.selected);
    APP.selected = obj;
    if (obj) {
        highlight(obj);
        if (APP.mode === 'object' && APP.activeTool !== 'select') APP.transform.attach(obj);
        showInspector(true); refreshInspector(obj); refreshOutliner();
        updateStatusBar(obj);
        el('stSel').textContent = `Seçili: ${obj.userData.name}`;
    } else {
        APP.transform.detach();
        showInspector(false); refreshOutliner();
        el('stSel').textContent = 'Seçili: —';
        el('stTransform').textContent = '';
    }
}
function highlight(obj) {
    if (!obj?.material) return;
    obj.material.emissive = new THREE.Color(0x112233);
    obj.material.emissiveIntensity = 0.6;
}
function dehighlight(obj) {
    if (!obj?.material) return;
    obj.material.emissive = new THREE.Color(0x000000);
    obj.material.emissiveIntensity = 0;
}

function onPointerDown(e) {
    if (e.button !== 0) return;
    if (APP.mode === 'sketch') return; // sketch has own handler
    if (APP.transform.dragging) return;
    const rect = APP.renderer.domElement.getBoundingClientRect();
    APP.mouse.x = ((e.clientX - rect.left)/rect.width)*2-1;
    APP.mouse.y = -((e.clientY - rect.top)/rect.height)*2+1;
    APP.raycaster.setFromCamera(APP.mouse, APP.camera);

    // Sculpt mode check
    if (APP.mode === 'edit' && APP.selected) {
        const hits = APP.raycaster.intersectObject(APP.selected);
        if (hits.length > 0) {
            APP.orbit.enabled = false; // Disable camera orbit during sculpting
            APP.sculpting = true;
            APP.sculptChanged = false;
            applySculpt(e);
            return;
        }
    }

    const hits = APP.raycaster.intersectObjects(APP.objects, false);
    if (hits.length > 0) { if (hits[0].object !== APP.selected) selectObj(hits[0].object); }
    else if (!e.shiftKey) selectObj(null);
    closeCtxMenu();
}

function onMouseMove(e) {
    if (APP.mode === 'sketch') return;
    
    // Sculpt drag check
    if (APP.mode === 'edit' && APP.sculpting) {
        applySculpt(e);
        return;
    }

    const rect = APP.renderer.domElement.getBoundingClientRect();
    const mx = ((e.clientX-rect.left)/rect.width)*2-1;
    const my = -((e.clientY-rect.top)/rect.height)*2+1;
    const ray = new THREE.Raycaster();
    ray.setFromCamera({x:mx,y:my}, APP.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
    const pt = new THREE.Vector3();
    ray.ray.intersectPlane(plane, pt);
    if (pt) el('vpCoords').textContent = `X: ${pt.x.toFixed(2)} · Y: ${pt.y.toFixed(2)} · Z: ${pt.z.toFixed(2)}`;
}

function onPointerUp(e) {
    if (APP.mode === 'edit' && APP.sculpting) {
        APP.sculpting = false;
        APP.orbit.enabled = true; // Re-enable orbit controls
        if (APP.sculptChanged) {
            saveHist('sculpt');
            updateStats();
            toast('✓ Model yoğuruldu', 'success', 1200);
        }
    }
}

function applySculpt(e) {
    if (!APP.selected) return;
    
    const rect = APP.renderer.domElement.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    APP.raycaster.setFromCamera({ x: mx, y: my }, APP.camera);
    const hits = APP.raycaster.intersectObject(APP.selected);
    if (hits.length === 0) return;
    
    const hit = hits[0];
    const point = hit.point;
    const faceNormal = hit.face.normal.clone();
    
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(APP.selected.matrixWorld);
    const worldNormal = faceNormal.applyMatrix3(normalMatrix).normalize();
    const localHit = APP.selected.worldToLocal(point.clone());
    
    const mode = el('sculptMode')?.value || 'pull';
    const radius = parseFloat(el('sculptRadius')?.value) || 30;
    const worldRadius = radius / 5;
    const strength = parseFloat(el('sculptStrength')?.value) || 2;
    const delta = strength / 12;
    
    const geo = APP.selected.geometry;
    const pos = geo.attributes.position;
    if (!pos) return;
    
    // Initialize original position array for the revert brush if not exists
    if (!APP.selected.userData.origPosition) {
        APP.selected.userData.origPosition = new Float32Array(pos.array);
    }
    
    let changed = false;
    let neighborAvg = new THREE.Vector3();
    
    if (mode === 'smooth') {
        let count = 0;
        let sum = new THREE.Vector3();
        for (let i = 0; i < pos.count; i++) {
            const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
            if (v.distanceTo(localHit) < worldRadius) {
                sum.add(v);
                count++;
            }
        }
        if (count > 0) {
            neighborAvg.copy(sum.multiplyScalar(1 / count));
        }
    }
    
    for (let i = 0; i < pos.count; i++) {
        const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
        const dist = v.distanceTo(localHit);
        
        if (dist < worldRadius) {
            const falloff = 1 - (dist / worldRadius);
            
            if (mode === 'pull') {
                const localNormal = faceNormal.clone().multiplyScalar(delta * falloff);
                v.add(localNormal);
            }
            else if (mode === 'push') {
                const localNormal = faceNormal.clone().multiplyScalar(-delta * falloff);
                v.add(localNormal);
            }
            else if (mode === 'smooth') {
                v.lerp(neighborAvg, delta * falloff * 0.5);
            }
            else if (mode === 'flatten') {
                const dot = v.clone().sub(localHit).dot(faceNormal);
                const proj = v.clone().sub(faceNormal.clone().multiplyScalar(dot));
                v.lerp(proj, delta * falloff);
            }
            else if (mode === 'revert') {
                const origV = new THREE.Vector3(
                    APP.selected.userData.origPosition[i*3],
                    APP.selected.userData.origPosition[i*3+1],
                    APP.selected.userData.origPosition[i*3+2]
                );
                v.lerp(origV, delta * falloff);
            }
            
            pos.setXYZ(i, v.x, v.y, v.z);
            changed = true;
        }
    }
    
    if (changed) {
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
        rebuildWireEdges(APP.selected);
        buildEditHelpers();
        APP.sculptChanged = true;
    }
}

/* ════════════════════════════════════════
   INSPECTOR
════════════════════════════════════════ */
function showInspector(show) {
    el('rpEmpty').style.display = show ? 'none' : 'flex';
    el('inspector').style.display = show ? 'block' : 'none';
}

function refreshInspector(obj) {
    if (!obj) return;
    el('rp-name').value = obj.userData.name;
    el('rp-badge').textContent = (obj.userData.type||'ÖZEL').toUpperCase();
    syncXYZ(obj);

    // Material
    el('matCol').value = '#' + obj.material.color.getHexString();
    el('matMetal').value = obj.material.metalness; el('vMetal').textContent = obj.material.metalness.toFixed(2);
    el('matRough').value = obj.material.roughness; el('vRough').textContent = obj.material.roughness.toFixed(2);
    el('matOpac').value = obj.material.opacity||1; el('vOpac').textContent = (obj.material.opacity||1).toFixed(2);
    el('matEmit').value = obj.material.emissiveIntensity||0; el('vEmit').textContent = (obj.material.emissiveIntensity||0).toFixed(2);

    // Info tab
    const geo = obj.geometry;
    const vc = geo.attributes.position?.count || 0;
    const fc = geo.index ? geo.index.count/3 : vc/3;
    el('igVert').textContent = vc; el('igFace').textContent = Math.round(fc);
    el('igType').textContent = obj.userData.type || '?';
    el('igID').textContent = obj.userData.id;
    el('igVis').textContent = obj.visible ? '✓' : '✗';
    el('igLock').textContent = obj.userData.locked ? '🔒' : '—';
    const bb2 = new THREE.Box3().setFromObject(obj);
    const sz = new THREE.Vector3(); bb2.getSize(sz);
    el('igW').textContent = sz.x.toFixed(1)+'mm'; el('igH').textContent = sz.y.toFixed(1)+'mm'; el('igD').textContent = sz.z.toFixed(1)+'mm';

    // Geo params tab
    buildGeoParamsList(obj);

    // Visibility/lock checkboxes
    el('objVis').checked = obj.visible;
    el('objLock').checked = obj.userData.locked || false;
    el('objCastShadow').checked = obj.castShadow;
    el('objRecvShadow').checked = obj.receiveShadow;
}

function refreshInspectorLive(obj) { syncXYZ(obj); }

function syncXYZ(obj) {
    const d = THREE.MathUtils.radToDeg;
    el('pX').value = obj.position.x.toFixed(2); el('pY').value = obj.position.y.toFixed(2); el('pZ').value = obj.position.z.toFixed(2);
    el('rX').value = d(obj.rotation.x).toFixed(1); el('rY').value = d(obj.rotation.y).toFixed(1); el('rZ').value = d(obj.rotation.z).toFixed(1);
    el('sX').value = obj.scale.x.toFixed(3); el('sY').value = obj.scale.y.toFixed(3); el('sZ').value = obj.scale.z.toFixed(3);
    el('sXr').value = obj.scale.x; el('sYr').value = obj.scale.y; el('sZr').value = obj.scale.z;
}

function buildGeoParamsList(obj) {
    const list = el('geoParamsList'); list.innerHTML = '';
    const params = obj.userData.params || {};
    const labels = { w:'Genişlik', h:'Yükseklik', d:'Derinlik', r:'Yarıçap', rb:'Alt R', seg:'Dilimler', tube:'Boru R', len:'Uzunluk', ws:'W Seg', hs:'H Seg', rs:'R Seg', ts:'T Seg', ro:'Dış R', detail:'Detay', turns:'Sarım', sw:'Mil R', hw:'Kafa R', hh:'Kafa H', sides:'Kenar', segW:'Seg W', segH:'Seg H', segD:'Seg D' };
    Object.entries(params).forEach(([k,v]) => {
        const r = document.createElement('div');
        r.className = 'gp-r';
        r.innerHTML = `<label>${labels[k]||k}</label><input type="number" class="lp-inp" data-param="${k}" value="${typeof v==='number'?v.toFixed(2):v}" step="0.5" min="0.1">`;
        list.appendChild(r);
    });
}

function updateStatusBar(obj) {
    if (!obj) return;
    const d = THREE.MathUtils.radToDeg;
    const p = obj.position; const r = obj.rotation; const s = obj.scale;
    el('stTransform').textContent = `Pos: ${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}  Rot: ${d(r.x).toFixed(0)}°,${d(r.y).toFixed(0)}°,${d(r.z).toFixed(0)}°  Scl: ${s.x.toFixed(2)},${s.y.toFixed(2)},${s.z.toFixed(2)}`;
}

/* ════════════════════════════════════════
   INSPECTOR INPUTS
════════════════════════════════════════ */
function bindInspectorInputs() {
    const R = THREE.MathUtils.degToRad;
    // Position
    [['pX','x'],['pY','y'],['pZ','z']].forEach(([id,ax]) => {
        el(id).addEventListener('input', function() { if (!APP.selected) return; APP.selected.position[ax] = parseFloat(this.value)||0; applySnap(APP.selected); updateStatusBar(APP.selected); });
        el(id).addEventListener('change', () => saveHist('pos'));
    });
    // Rotation
    [['rX','x'],['rY','y'],['rZ','z']].forEach(([id,ax]) => {
        el(id).addEventListener('input', function() { if (!APP.selected) return; APP.selected.rotation[ax] = R(parseFloat(this.value)||0); updateStatusBar(APP.selected); });
        el(id).addEventListener('change', () => saveHist('rot'));
    });
    // Scale number
    [['sX','x'],['sY','y'],['sZ','z']].forEach(([id,ax],i) => {
        const rids = ['sXr','sYr','sZr'], nids = ['sX','sY','sZ'];
        el(id).addEventListener('input', function() {
            if (!APP.selected) return;
            const v = Math.max(0.001, parseFloat(this.value)||0.001);
            if (APP.uniformScale) { APP.selected.scale.set(v,v,v); ['x','y','z'].forEach((_,j) => { el(nids[j]).value=v.toFixed(3); el(rids[j]).value=v; }); }
            else { APP.selected.scale[ax]=v; el(rids[i]).value=v; }
            updateStatusBar(APP.selected);
        });
        el(id).addEventListener('change', () => saveHist('scl'));
    });
    // Scale sliders
    [['sXr','x'],['sYr','y'],['sZr','z']].forEach(([id,ax],i) => {
        const rids = ['sXr','sYr','sZr'], nids = ['sX','sY','sZ'];
        el(id).addEventListener('input', function() {
            if (!APP.selected) return;
            const v = parseFloat(this.value);
            if (APP.uniformScale) { APP.selected.scale.set(v,v,v); ['x','y','z'].forEach((_,j) => { el(nids[j]).value=v.toFixed(3); el(rids[j]).value=v; }); }
            else { APP.selected.scale[ax]=v; el(nids[i]).value=v.toFixed(3); }
            updateStatusBar(APP.selected);
        });
        el(id).addEventListener('change', () => saveHist('scl'));
    });
    // Quick scale
    document.querySelectorAll('.sqk').forEach(btn => btn.addEventListener('click', function() {
        if (!APP.selected) return;
        const f = parseFloat(this.dataset.f);
        if (APP.uniformScale) APP.selected.scale.multiplyScalar(f);
        else APP.selected.scale.x *= f;
        syncXYZ(APP.selected); saveHist('scl'); toast(`Ölçek ×${f}`, 'info', 1200);
    }));
    // Adj buttons
    document.querySelectorAll('.xadj').forEach(btn => btn.addEventListener('click', function() {
        if (!APP.selected) return;
        const ax=this.dataset.ax, pr=this.dataset.pr, d=parseFloat(this.dataset.d);
        if (pr==='pos') { const step=APP.snap?APP.snapVal:d; APP.selected.position[ax]+= step; applySnap(APP.selected); }
        else if (pr==='rot') { APP.selected.rotation[ax]+=R(d); }
        syncXYZ(APP.selected); updateStatusBar(APP.selected); saveHist('adj');
    }));
    // Rot presets
    document.querySelectorAll('.rot-p').forEach(btn => btn.addEventListener('click', function() {
        if (!APP.selected) return;
        APP.selected.rotation.set(R(+this.dataset.rx), R(+this.dataset.ry), R(+this.dataset.rz));
        syncXYZ(APP.selected); updateStatusBar(APP.selected); saveHist('rot');
    }));
    // Resets
    el('rResetPos').addEventListener('click', () => { if (!APP.selected) return; APP.selected.position.set(0,0,0); const b=new THREE.Box3().setFromObject(APP.selected); APP.selected.position.y=-b.min.y; syncXYZ(APP.selected); saveHist('pos'); toast('Konum sıfırlandı','info',1200); });
    el('rResetRot').addEventListener('click', () => { if (!APP.selected) return; APP.selected.rotation.set(0,0,0); syncXYZ(APP.selected); saveHist('rot'); toast('Rotasyon sıfırlandı','info',1200); });
    el('rResetScl').addEventListener('click', () => { if (!APP.selected) return; APP.selected.scale.set(1,1,1); syncXYZ(APP.selected); saveHist('scl'); toast('Ölçek sıfırlandı','info',1200); });
    el('unifScl').addEventListener('change', function() { APP.uniformScale = this.checked; });
    // Geo apply
    el('applyGeo').addEventListener('click', () => {
        if (!APP.selected) return;
        const p={};
        document.querySelectorAll('#geoParamsList .lp-inp').forEach(i=>{ p[i.dataset.param]=parseFloat(i.value)||1; });
        rebuildGeometry(APP.selected, p);
        toast('✓ Geometri güncellendi','success',1800);
    });
    // Material color
    el('matCol').addEventListener('input', function() { if (APP.selected) APP.selected.material.color.set(this.value); });
    document.querySelectorAll('.msw').forEach(s => s.addEventListener('click', function() {
        if (!APP.selected) return;
        APP.selected.material.color.set(this.dataset.c);
        el('matCol').value = this.dataset.c;
    }));
    // Mat sliders
    [['matMetal','metalness','vMetal'],['matRough','roughness','vRough'],['matOpac','opacity','vOpac'],['matEmit','emissiveIntensity','vEmit']].forEach(([id,prop,vid]) => {
        el(id).addEventListener('input', function() {
            if (!APP.selected) return;
            const v = parseFloat(this.value);
            if (prop==='opacity') { APP.selected.material.opacity=v; APP.selected.material.transparent=v<1; }
            else if (prop==='emissiveIntensity') { APP.selected.material.emissiveIntensity=v; }
            else APP.selected.material[prop]=v;
            el(vid).textContent = v.toFixed(2);
        });
    });
    // Mat presets
    document.querySelectorAll('.mp').forEach(btn => btn.addEventListener('click', function() {
        if (!APP.selected) return;
        APP.selected.material.color.set(this.dataset.c);
        APP.selected.material.metalness = parseFloat(this.dataset.m);
        APP.selected.material.roughness = parseFloat(this.dataset.r);
        refreshInspector(APP.selected); toast('Malzeme uygulandı','info',1200);
    }));
    // Name
    el('rp-name').addEventListener('input', function() { if (APP.selected) { APP.selected.userData.name=this.value; refreshOutliner(); } });
    // Visibility/lock
    el('objVis').addEventListener('change', function() { if (APP.selected) { APP.selected.visible=this.checked; refreshOutliner(); } });
    el('objLock').addEventListener('change', function() { if (APP.selected) { APP.selected.userData.locked=this.checked; if (this.checked) APP.transform.detach(); else APP.transform.attach(APP.selected); } });
    el('objCastShadow').addEventListener('change', function() { if (APP.selected) APP.selected.castShadow=this.checked; });
    el('objRecvShadow').addEventListener('change', function() { if (APP.selected) APP.selected.receiveShadow=this.checked; });
    // Edit sel
    document.querySelectorAll('.esb').forEach(b => b.addEventListener('click', function() {
        document.querySelectorAll('.esb').forEach(x=>x.classList.remove('active'));
        this.classList.add('active'); APP.editSel=this.dataset.es;
    }));
}

/* ════════════════════════════════════════
   SNAP
════════════════════════════════════════ */
function applySnap(obj) {
    if (!APP.snap || !obj) return;
    const s = APP.snapVal;
    obj.position.x = Math.round(obj.position.x/s)*s;
    obj.position.y = Math.round(obj.position.y/s)*s;
    obj.position.z = Math.round(obj.position.z/s)*s;
}

/* ════════════════════════════════════════
   OBJECT OPS
════════════════════════════════════════ */
function deleteObj(obj) {
    if (!obj) return;
    if (obj.userData.locked) { toast('🔒 Obje kilitli', 'warning', 1800); return; }
    const name = obj.userData.name;
    APP.objects.splice(APP.objects.indexOf(obj), 1);
    clearEditHelpers();
    APP.scene.remove(obj);
    obj.geometry.dispose(); obj.material.dispose();
    if (APP.selected===obj) selectObj(null);
    refreshOutliner(); updateStats(); saveHist('del');
    toast(`🗑 "${name}" silindi`, 'warning', 2000);
}

function duplicateObj(obj) {
    if (!obj) return;
    const m2 = new THREE.Mesh(obj.geometry.clone(), obj.material.clone());
    m2.position.copy(obj.position).add(new THREE.Vector3(5,0,5));
    m2.rotation.copy(obj.rotation); m2.scale.copy(obj.scale);
    m2.castShadow=true; m2.receiveShadow=true;
    m2.userData = { ...obj.userData, id:uid(), name:obj.userData.name+' Kopyası' };
    addWireEdges(m2);
    APP.scene.add(m2); APP.objects.push(m2);
    selectObj(m2); refreshOutliner(); updateStats(); saveHist('dup');
    toast(`⧉ "${m2.userData.name}" kopyalandı`, 'success', 1800);
}

function mirrorObj(ax) {
    if (!APP.selected) return;
    APP.selected.scale[ax] *= -1;
    syncXYZ(APP.selected); saveHist('mirror');
    toast(`Ayna ${ax.toUpperCase()} uygulandı`, 'info', 1200);
}
function groundObj(obj) {
    if (!obj) return;
    const bb = new THREE.Box3().setFromObject(obj);
    obj.position.y += -bb.min.y;
    syncXYZ(obj); saveHist('ground'); toast('⬇ Zemine oturtuldu','info',1200);
}
function centerObj(obj) {
    if (!obj) return;
    obj.position.x=0; obj.position.z=0;
    const bb = new THREE.Box3().setFromObject(obj);
    obj.position.y=-bb.min.y;
    syncXYZ(obj); saveHist('center'); toast('◎ Merkeze getirildi','info',1200);
}
function focusObj(obj) {
    if (!obj) return;
    const bb = new THREE.Box3().setFromObject(obj);
    const c = new THREE.Vector3(); bb.getCenter(c);
    APP.orbit.target.copy(c); APP.orbit.update();
}

/* ── Boolean ── */
function boolUnion() {
    if (APP.objects.length<2||!APP.selected) { toast('⚠ 2 obje gerekli','warning',2500); return; }
    const others = APP.objects.filter(o=>o!==APP.selected);
    const src = others[others.length-1];
    const gA = APP.selected.geometry.clone().applyMatrix4(APP.selected.matrixWorld);
    const gB = src.geometry.clone().applyMatrix4(src.matrixWorld);
    const merged = mergeBufferGeometries([gA, gB]);
    const nm = new THREE.Mesh(merged, APP.selected.material.clone());
    nm.userData = { ...APP.selected.userData, id:uid(), name:`${APP.selected.userData.name}+${src.userData.name}`, type:'union', params:{} };
    nm.castShadow=true; nm.receiveShadow=true; addWireEdges(nm);
    deleteObjSilent(APP.selected); deleteObjSilent(src);
    APP.scene.add(nm); APP.objects.push(nm);
    selectObj(nm); refreshOutliner(); updateStats(); saveHist('union');
    toast('✓ Union tamamlandı','success',2200);
}
function boolSubtract() {
    if (APP.objects.length<2||!APP.selected) { toast('⚠ 2 obje gerekli','warning',2500); return; }
    const others = APP.objects.filter(o=>o!==APP.selected);
    const hole = others[others.length-1];
    hole.material.transparent=true; hole.material.opacity=0.1; hole.material.depthWrite=false;
    hole.userData.name+=' (Delik)'; refreshOutliner(); saveHist('sub');
    toast('✓ Subtract uygulandı (görsel)','info',3000);
}
function boolIntersect() {
    if (APP.objects.length<2||!APP.selected) { toast('⚠ 2 obje gerekli','warning',2500); return; }
    const others = APP.objects.filter(o=>o!==APP.selected);
    const src = others[others.length-1];
    const b1=new THREE.Box3().setFromObject(APP.selected);
    const b2=new THREE.Box3().setFromObject(src);
    const inter=b1.clone().intersect(b2);
    if (inter.isEmpty()) { toast('⚠ Objeler kesişmiyor','warning',2000); return; }
    const sz=new THREE.Vector3(); inter.getSize(sz);
    const cn=new THREE.Vector3(); inter.getCenter(cn);
    const g=new THREE.BoxGeometry(sz.x,sz.y,sz.z);
    const m=new THREE.Mesh(g, APP.selected.material.clone());
    m.position.copy(cn); m.userData={id:uid(),name:'Kesişim',type:'intersect',params:{w:sz.x,h:sz.y,d:sz.z}};
    m.castShadow=true; m.receiveShadow=true; addWireEdges(m);
    deleteObjSilent(APP.selected); deleteObjSilent(src);
    APP.scene.add(m); APP.objects.push(m);
    selectObj(m); refreshOutliner(); updateStats(); saveHist('intersect');
    toast('✓ Kesişim alındı','success',2200);
}
function deleteObjSilent(obj) {
    const i=APP.objects.indexOf(obj); if (i>-1) APP.objects.splice(i,1);
    APP.scene.remove(obj); obj.geometry?.dispose(); obj.material?.dispose();
}

/* ── Modifiers ── */
function doExtrude() {
    if (!APP.selected) { toast('⚠ Obje seçin','warning',1800); return; }
    const depth = parseFloat(el('pExtDepth').value)||10;
    const p = {...APP.selected.userData.params};
    if (p.h!==undefined) { p.h+=depth; rebuildGeometry(APP.selected,p); }
    else { APP.selected.scale.y*=(1+depth/30); syncXYZ(APP.selected); saveHist('ext'); }
    toast(`✓ Extrude +${depth}mm`,'success',1800);
}
function doSubdiv() {
    if (!APP.selected) { toast('⚠ Obje seçin','warning',1800); return; }
    const lvl = parseInt(el('pSubdivLvl').value)||1;
    const p = {...APP.selected.userData.params};
    if (p.ws!==undefined) { p.ws=Math.min(128,(p.ws||8)*Math.pow(2,lvl)); p.hs=Math.min(64,(p.hs||8)*Math.pow(2,lvl)); }
    else if (p.seg!==undefined) { p.seg=Math.min(128,(p.seg||32)*Math.pow(2,lvl)); }
    rebuildGeometry(APP.selected,p);
    toast(`✓ Subdivide ×${lvl}`,'success',1800);
}
function doSmooth() {
    if (!APP.selected) { toast('⚠ Obje seçin','warning',1800); return; }
    APP.selected.geometry.computeVertexNormals();
    APP.selected.material.flatShading=false; APP.selected.material.needsUpdate=true;
    toast('✓ Smooth uygulandı','success',1800);
}
function doSolidify() {
    if (!APP.selected) { toast('⚠ Obje seçin','warning',1800); return; }
    const t = parseFloat(el('pSolidify').value)||2;
    APP.selected.scale.multiplyScalar(1+(t/100));
    syncXYZ(APP.selected); saveHist('solidify');
    toast(`✓ Solidify +${t}mm`,'success',1800);
}
function doBevel() {
    if (!APP.selected) { toast('⚠ Obje seçin','warning',1800); return; }
    toast('Bevel uygulandı (köşe yuvarlatma)','info',2000);
    APP.selected.scale.multiplyScalar(0.97); syncXYZ(APP.selected); saveHist('bevel');
}

/* ── Array ── */
function doArray() {
    if (!APP.selected) { toast('⚠ Obje seçin','warning',1800); return; }
    const xN=parseInt(el('arrX').value)||2;
    const yN=parseInt(el('arrY').value)||1;
    const zN=parseInt(el('arrZ').value)||1;
    const gap=parseFloat(el('arrGap').value)||25;
    const type=el('arrType').value;
    const orig=APP.selected;
    const bb=new THREE.Box3().setFromObject(orig);
    const sz=new THREE.Vector3(); bb.getSize(sz);
    let count=0;

    if (type==='circular' || type==='radial') {
        const total=xN; const radius=gap;
        for (let i=0;i<total;i++) {
            if (i===0) continue;
            const angle=(i/total)*Math.PI*2;
            const g2=orig.geometry.clone();
            const m2=new THREE.Mesh(g2,orig.material.clone());
            m2.position.set(orig.position.x+Math.cos(angle)*radius, orig.position.y, orig.position.z+Math.sin(angle)*radius);
            m2.rotation.copy(orig.rotation); m2.scale.copy(orig.scale);
            m2.castShadow=true; m2.receiveShadow=true;
            m2.userData={...orig.userData,id:uid(),name:`${orig.userData.name}[${i}]`};
            addWireEdges(m2); APP.scene.add(m2); APP.objects.push(m2); count++;
        }
    } else {
        for (let xi=0;xi<xN;xi++) for (let yi=0;yi<yN;yi++) for (let zi=0;zi<zN;zi++) {
            if (xi===0&&yi===0&&zi===0) continue;
            const g2=orig.geometry.clone();
            const m2=new THREE.Mesh(g2,orig.material.clone());
            m2.position.set(orig.position.x+xi*(sz.x+gap), orig.position.y+yi*(sz.y+gap), orig.position.z+zi*(sz.z+gap));
            m2.rotation.copy(orig.rotation); m2.scale.copy(orig.scale);
            m2.castShadow=true; m2.receiveShadow=true;
            m2.userData={...orig.userData,id:uid(),name:`${orig.userData.name}[${xi},${yi},${zi}]`};
            addWireEdges(m2); APP.scene.add(m2); APP.objects.push(m2); count++;
        }
    }
    refreshOutliner(); updateStats(); saveHist('array');
    toast(`✓ ${count} kopya oluşturuldu`,'success',2500);
}

/* ── Lathe ── */
function doLathe() {
    if (!APP.selected) { toast('⚠ Obje seçin','warning',1800); return; }
    const angle = parseFloat(el('latheAngle').value)||360;
    const segs  = parseInt(el('latheSegs').value)||32;
    const axis  = el('latheAxis').value;
    const bb = new THREE.Box3().setFromObject(APP.selected);
    const sz = new THREE.Vector3(); bb.getSize(sz);
    const pts = [];
    for (let i=0;i<=8;i++) pts.push(new THREE.Vector2(sz.x/2*(0.5+0.5*Math.sin(i/8*Math.PI)), (i/8)*sz.y));
    const geo = new THREE.LatheGeometry(pts, segs, 0, angle*Math.PI/180);
    const mat = APP.selected.material.clone();
    const nm = new THREE.Mesh(geo, mat);
    nm.position.copy(APP.selected.position); nm.userData={...APP.selected.userData,id:uid(),name:APP.selected.userData.name+' Lathe',type:'lathe',params:{angle,segs}};
    nm.castShadow=true; nm.receiveShadow=true; addWireEdges(nm);
    APP.scene.add(nm); APP.objects.push(nm);
    selectObj(nm); refreshOutliner(); updateStats(); saveHist('lathe');
    toast('✓ Lathe tamamlandı','success',2000);
}

/* ── Sketch Extrude ── */
function extrudeSketch() {
    const pts3d = APP.sketch.pts3d;
    if (pts3d.length < 3) { toast('⚠ En az 3 nokta gerekli','warning',2000); return; }
    const h = parseFloat(el('sketchExtrudeH').value)||10;
    const closed = el('drawClose').checked;
    const planeVal = el('sketchPlane')?.value || 'xz';

    // Build shape based on drawing plane
    let shape2d;
    if (planeVal === 'xy') {
        shape2d = new THREE.Shape(pts3d.map(p => new THREE.Vector2(p.x, p.y)));
    } else if (planeVal === 'yz') {
        shape2d = new THREE.Shape(pts3d.map(p => new THREE.Vector2(p.z, p.y)));
    } else { // xz
        shape2d = new THREE.Shape(pts3d.map(p => new THREE.Vector2(p.x, p.z)));
    }

    if (closed && pts3d.length > 2) {
        shape2d.closePath();
    }
    const extSettings = { depth: h, bevelEnabled: false };
    let geo;
    try { geo = new THREE.ExtrudeGeometry(shape2d, extSettings); }
    catch(e) { geo = new THREE.BoxGeometry(10,10,10); }

    // Rotate geometry based on drawing plane
    if (planeVal === 'xz') {
        geo.rotateX(-Math.PI/2);
    } else if (planeVal === 'yz') {
        geo.rotateY(Math.PI/2);
    }

    // Compute bounds and normals
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    // Center geometry to local origin and offset mesh position to the center
    const center = new THREE.Vector3();
    geo.boundingBox.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);

    const mat = new THREE.MeshStandardMaterial({ 
        color: 0xbc8cff, 
        metalness: 0.1, 
        roughness: 0.7,
        side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(center);
    mesh.castShadow=true; mesh.receiveShadow=true;
    mesh.userData = { id:uid(), name:`Çizim ${APP.objects.length+1}`, type:'sketch', params:{ h, planeVal } };
    addWireEdges(mesh);
    APP.scene.add(mesh); APP.objects.push(mesh);
    selectObj(mesh); refreshOutliner(); updateStats(); saveHist('sketch-extrude');
    clearSketchData();
    toast('✓ Çizim 3D\'ye dönüştürüldü!','success',2500);
}

/* ════════════════════════════════════════
   SKETCH / DRAW MODE
════════════════════════════════════════ */
const SK = {
    ctx: null,
    drawing: false,
    tempPts: [],   // screen points [{x,y}]
    toolActive: null,
    startPt: null,
};

function enterSketchMode() {
    APP.mode = 'sketch';
    APP.transform.detach();
    APP.orbit.enabled = false;

    const cv = el('sketchCanvas');
    cv.style.display = 'block';
    cv.width = APP.w; cv.height = APP.h;
    SK.ctx = cv.getContext('2d');
    SK.tempPts = [];
    APP.sketch.pts3d = [];
    APP.sketch.points = [];

    bindSketchCanvas(cv);

    el('vpBadge').textContent = `ÇİZİM MODU · ${APP.drawTool.toUpperCase()}`;
    el('vpBadge').className = 'vp-badge draw-mode';
    el('drawHUD').style.display = 'flex';
    el('dhTool').textContent = `Araç: ${getToolLabel(APP.drawTool)}`;
    el('dhInfo').textContent = 'İlk noktayı tıklayın';
    el('extrudeSketch').disabled = true;

    document.querySelectorAll('.mb-btn.mode-btn').forEach(b=>b.classList.remove('active'));
    el('mbModeSketch').classList.add('active');

    toast('✏ Çizim Modu aktif — '+getToolLabel(APP.drawTool)+' aracıyla çizin','info',3000);
}

function exitSketchMode() {
    APP.mode = 'object';
    APP.orbit.enabled = true;
    const cv = el('sketchCanvas');
    cv.style.display = 'none';
    if (SK.ctx) { SK.ctx.clearRect(0,0,cv.width,cv.height); SK.ctx=null; }
    unbindSketchCanvas(cv);
    SK.tempPts=[]; SK.drawing=false;

    el('vpBadge').textContent = 'OBJE MODU · PERSPEKTİF';
    el('vpBadge').className = 'vp-badge';
    el('drawHUD').style.display = 'none';
    clearSketchPreview();
    document.querySelectorAll('.mb-btn.mode-btn').forEach(b=>b.classList.remove('active'));
    el('mbModeObj').classList.add('active');
}

function clearSketchData() {
    APP.sketch.pts3d=[];
    APP.sketch.points=[];
    SK.tempPts=[];
    SK.drawing=false;
    if (SK.ctx) SK.ctx.clearRect(0,0,el('sketchCanvas').width,el('sketchCanvas').height);
    clearSketchPreview();
    el('extrudeSketch').disabled=true;
    el('dhInfo').textContent='İlk noktayı tıklayın';
}

function clearSketchPreview() {
    if (APP.sketch.preview) {
        APP.scene.remove(APP.sketch.preview);
        APP.sketch.preview.geometry.dispose();
        APP.sketch.preview = null;
    }
    APP.sketch.editHelpers.forEach(h => { if(h.parent) h.parent.remove(h); h.geometry?.dispose(); });
    APP.sketch.editHelpers = [];
}

let sketchBound = { down:null, move:null, up:null };
function bindSketchCanvas(cv) {
    sketchBound.down = (e) => onSketchDown(e);
    sketchBound.move = (e) => onSketchMove(e);
    sketchBound.up   = (e) => onSketchUp(e);
    cv.addEventListener('pointerdown', sketchBound.down);
    cv.addEventListener('pointermove', sketchBound.move);
    cv.addEventListener('pointerup', sketchBound.up);
}
function unbindSketchCanvas(cv) {
    if (sketchBound.down) cv.removeEventListener('pointerdown', sketchBound.down);
    if (sketchBound.move) cv.removeEventListener('pointermove', sketchBound.move);
    if (sketchBound.up)   cv.removeEventListener('pointerup', sketchBound.up);
}

function screenToWorld(sx, sy) {
    const rect = el('sketchCanvas').getBoundingClientRect();
    const nx = ((sx-rect.left)/rect.width)*2-1;
    const ny = -((sy-rect.top)/rect.height)*2+1;
    const ray = new THREE.Raycaster();
    ray.setFromCamera({x:nx, y:ny}, APP.camera);

    const planeVal = el('sketchPlane')?.value || 'xz';
    let normal = new THREE.Vector3(0, 1, 0);
    if (planeVal === 'xy') normal.set(0, 0, 1);
    else if (planeVal === 'yz') normal.set(1, 0, 0);

    const plane = new THREE.Plane(normal, 0);
    const pt = new THREE.Vector3();
    ray.ray.intersectPlane(plane, pt);

    const snapDraw = el('drawSnap')?.checked;
    const sv = APP.snapVal;
    if (snapDraw && APP.snap) {
        if (planeVal === 'xy') {
            pt.x = Math.round(pt.x/sv)*sv;
            pt.y = Math.round(pt.y/sv)*sv;
        } else if (planeVal === 'yz') {
            pt.z = Math.round(pt.z/sv)*sv;
            pt.y = Math.round(pt.y/sv)*sv;
        } else { // xz
            pt.x = Math.round(pt.x/sv)*sv;
            pt.z = Math.round(pt.z/sv)*sv;
        }
    }
    return pt;
}

function onSketchDown(e) {
    if (e.button !== 0) return; // left click only
    const cv = el('sketchCanvas');
    cv.setPointerCapture(e.pointerId);

    const world = screenToWorld(e.clientX, e.clientY);
    if (!world) return;

    SK.isMouseDown = true;
    SK.hasDragged = false;
    SK.downPt = { x: e.clientX, y: e.clientY };

    const tool = APP.drawTool;

    // Click-by-click initialization or drag initialization
    if (tool === 'rect' || tool === 'circle' || tool === 'ellipse' || tool === 'triangle' || tool === 'star' || tool === 'arc') {
        if (!SK.drawing) {
            clearSketchData();
            SK.startPt = { sx: e.clientX, sy: e.clientY, w3: world.clone() };
            SK.drawing = true;
            SK.tempPts = [{ x: e.clientX, y: e.clientY, w3: world.clone() }];
            if (tool === 'rect') el('dhInfo').textContent = 'Sürükleyin veya ikinci köşeyi tıklayın';
            else if (tool === 'circle') el('dhInfo').textContent = 'Sürükleyin veya yarıçapı tıklayın';
            else el('dhInfo').textContent = 'Sürükleyin veya diğer köşeyi tıklayın';
        }
    }
}

function onSketchMove(e) {
    if (!SK.ctx) return;
    const ctx = SK.ctx;
    const cv = el('sketchCanvas');
    ctx.clearRect(0,0,cv.width,cv.height);
    drawGrid2D(ctx);

    const color = el('drawColor').value||'#58a6ff';
    const lw = parseInt(el('drawStroke').value)||2;
    ctx.strokeStyle = color;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = 4;

    const tool = APP.drawTool;
    const rect = cv.getBoundingClientRect();
    const ex = e.clientX - rect.left;
    const ey = e.clientY - rect.top;

    const world = screenToWorld(e.clientX, e.clientY);

    // Detect dragging
    if (SK.isMouseDown && !SK.hasDragged && SK.downPt) {
        const dragDist = Math.sqrt((e.clientX - SK.downPt.x)**2 + (e.clientY - SK.downPt.y)**2);
        if (dragDist > 8) {
            SK.hasDragged = true;
            if (tool === 'line' || tool === 'poly' || tool === 'spline') {
                clearSketchData();
                SK.drawing = true;
                SK.isFreehand = true;
                SK.tempPts.push({ x: SK.downPt.x, y: SK.downPt.y });
                const startW = screenToWorld(SK.downPt.x, SK.downPt.y);
                if (startW) APP.sketch.pts3d.push(startW);
            }
        }
    }

    // Freehand drawing logic
    if (SK.isFreehand && SK.drawing) {
        if (world && SK.tempPts.length > 0) {
            const last = SK.tempPts[SK.tempPts.length - 1];
            const dist = Math.sqrt((e.clientX - last.x)**2 + (e.clientY - last.y)**2);
            if (dist > 12) { // Add point every 12 pixels
                SK.tempPts.push({ x: e.clientX, y: e.clientY });
                APP.sketch.pts3d.push(world.clone());
                updateSketchPreview3D();
                if (APP.sketch.pts3d.length >= 3) el('extrudeSketch').disabled = false;
            }
        }

        // Draw freehand stroke on 2D canvas
        ctx.beginPath();
        if (SK.tempPts.length > 0) {
            ctx.moveTo(SK.tempPts[0].x - rect.left, SK.tempPts[0].y - rect.top);
            for (let i=1; i<SK.tempPts.length; i++) {
                ctx.lineTo(SK.tempPts[i].x - rect.left, SK.tempPts[i].y - rect.top);
            }
        }
        ctx.lineTo(ex, ey);
        ctx.stroke();
        return;
    }

    // Normal preview logic
    if (tool === 'line' || tool === 'poly' || tool === 'spline') {
        if (SK.tempPts.length > 0) {
            ctx.beginPath();
            ctx.moveTo(SK.tempPts[0].x - rect.left, SK.tempPts[0].y - rect.top);
            for (let i=1; i<SK.tempPts.length; i++) {
                ctx.lineTo(SK.tempPts[i].x - rect.left, SK.tempPts[i].y - rect.top);
            }
            ctx.lineTo(ex, ey);
            ctx.stroke();
            // Draw points
            SK.tempPts.forEach(p => {
                ctx.beginPath(); ctx.arc(p.x - rect.left, p.y - rect.top, 4, 0, Math.PI*2);
                ctx.fillStyle = color; ctx.fill();
            });
        }
    }
    else if (SK.drawing && SK.startPt) {
        const sx = SK.startPt.sx - rect.left;
        const sy = SK.startPt.sy - rect.top;

        if (tool === 'rect') {
            ctx.beginPath(); ctx.strokeRect(sx, sy, ex - sx, ey - sy);
        }
        else if (tool === 'circle' || tool === 'ellipse') {
            const r = Math.sqrt((ex-sx)**2 + (ey-sy)**2);
            ctx.beginPath(); ctx.ellipse(sx, sy, r, tool==='ellipse'?r*0.6:r, 0, 0, Math.PI*2); ctx.stroke();
        }
        else if (tool === 'triangle') {
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.lineTo(sx - (ex - sx), ey);
            ctx.closePath();
            ctx.stroke();
        }
        else if (tool === 'star') {
            const r = Math.sqrt((ex-sx)**2 + (ey-sy)**2);
            const innerR = r/2;
            const points = parseInt(el('polyEdges').value)||5;
            ctx.beginPath();
            for (let i=0; i<points*2; i++) {
                const a = (i/points/2)*Math.PI*2 - Math.PI/2;
                const cr = i%2===0 ? r : innerR;
                const px = sx + Math.cos(a)*cr;
                const py = sy + Math.sin(a)*cr;
                if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }
        else if (tool === 'arc' && SK.tempPts.length > 0) {
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
        }
    }
}

function onSketchUp(e) {
    if (!SK.isMouseDown) return;
    SK.isMouseDown = false;

    const cv = el('sketchCanvas');
    cv.releasePointerCapture(e.pointerId);

    const world = screenToWorld(e.clientX, e.clientY);
    if (!world) return;

    const tool = APP.drawTool;

    if (SK.hasDragged) {
        // Drag-and-release drawing completed
        if (SK.isFreehand) {
            SK.drawing = false;
            SK.isFreehand = false;
            SK.tempPts.push({ x: e.clientX, y: e.clientY });
            APP.sketch.pts3d.push(world.clone());
            updateSketchPreview3D();
            if (APP.sketch.pts3d.length >= 3) el('extrudeSketch').disabled = false;
            el('dhInfo').textContent = `Serbest çizim hazır (${APP.sketch.pts3d.length} nokta) — 3D'ye dönüştürebilirsiniz`;
        }
        else if (SK.drawing && SK.startPt) {
            calculateAndSetShape3D(world, e.clientX, e.clientY);
            SK.drawing = false;
            updateSketchPreview3D();
            el('extrudeSketch').disabled = false;
            el('dhInfo').textContent = `${getToolLabel(tool)} hazır — 3D'ye dönüştürebilirsiniz`;
        }
    } else {
        // Point-by-point click drawing completed or clicked
        if (tool === 'line' || tool === 'poly' || tool === 'spline') {
            SK.tempPts.push({ x: e.clientX, y: e.clientY });
            APP.sketch.pts3d.push(world.clone());
            redrawSketchCanvas();
            updateSketchPreview3D();
            el('dhInfo').textContent = `${SK.tempPts.length} nokta — çift tık veya Enter ile bitir`;
            if (APP.sketch.pts3d.length >= 3) el('extrudeSketch').disabled = false;
        }
        else if (SK.drawing && SK.startPt) {
            if (tool === 'triangle' && SK.tempPts.length === 1) {
                SK.tempPts.push({ x: e.clientX, y: e.clientY, w3: world.clone() });
                el('dhInfo').textContent = 'Üçüncü köşeyi tıklayın';
            }
            else if (tool === 'arc' && SK.tempPts.length < 2) {
                SK.tempPts.push({ x: e.clientX, y: e.clientY, w3: world.clone() });
                el('dhInfo').textContent = `Yay: ${SK.tempPts.length}/3 nokta tıklayın`;
            }
            else {
                calculateAndSetShape3D(world, e.clientX, e.clientY);
                SK.drawing = false;
                updateSketchPreview3D();
                el('extrudeSketch').disabled = false;
                el('dhInfo').textContent = `${getToolLabel(tool)} hazır — 3D'ye dönüştürebilirsiniz`;
            }
        }
    }
}

function calculateAndSetShape3D(world, clientX, clientY) {
    const tool = APP.drawTool;
    const sp = SK.startPt;
    if (!sp) return;

    if (tool === 'rect') {
        const planeVal = el('sketchPlane')?.value || 'xz';
        let pts = [];
        if (planeVal === 'xy') {
            pts = [
                sp.w3.clone(),
                new THREE.Vector3(world.x, sp.w3.y, 0),
                world.clone(),
                new THREE.Vector3(sp.w3.x, world.y, 0),
            ];
        } else if (planeVal === 'yz') {
            pts = [
                sp.w3.clone(),
                new THREE.Vector3(0, world.y, sp.w3.z),
                world.clone(),
                new THREE.Vector3(0, sp.w3.y, world.z),
            ];
        } else { // xz
            pts = [
                sp.w3.clone(),
                new THREE.Vector3(world.x, 0, sp.w3.z),
                world.clone(),
                new THREE.Vector3(sp.w3.x, 0, world.z),
            ];
        }
        APP.sketch.pts3d = pts;
    }
    else if (tool === 'circle' || tool === 'ellipse') {
        const cx = sp.w3.x, cy = sp.w3.y, cz = sp.w3.z;
        const r = world.distanceTo(sp.w3);
        const planeVal = el('sketchPlane')?.value || 'xz';

        const rx = r;
        const rz = tool === 'ellipse' ? r * 0.6 : r;
        const segs = 32;
        const pts = [];

        for (let i = 0; i <= segs; i++) {
            const a = (i / segs) * Math.PI * 2;
            if (planeVal === 'xy') {
                pts.push(new THREE.Vector3(cx + Math.cos(a) * rx, cy + Math.sin(a) * rz, 0));
            } else if (planeVal === 'yz') {
                pts.push(new THREE.Vector3(0, cy + Math.sin(a) * rx, cz + Math.cos(a) * rz));
            } else { // xz
                pts.push(new THREE.Vector3(cx + Math.cos(a) * rx, 0, cz + Math.sin(a) * rz));
            }
        }
        APP.sketch.pts3d = pts;
    }
    else if (tool === 'triangle') {
        let a = sp.w3.clone();
        let b, c;
        if (SK.tempPts.length >= 2) {
            b = SK.tempPts[1].w3 || SK.tempPts[1];
            c = world.clone();
        } else {
            b = world.clone();
            const planeVal = el('sketchPlane')?.value || 'xz';
            if (planeVal === 'xy') {
                c = new THREE.Vector3(a.x - (b.x - a.x), b.y, 0);
            } else if (planeVal === 'yz') {
                c = new THREE.Vector3(0, b.y, a.z - (b.z - a.z));
            } else { // xz
                c = new THREE.Vector3(a.x - (b.x - a.x), 0, b.z);
            }
        }
        APP.sketch.pts3d = [a, b, c];
    }
    else if (tool === 'star') {
        const cx = sp.w3.x, cy = sp.w3.y, cz = sp.w3.z;
        const outerR = world.distanceTo(sp.w3);
        const innerR = parseFloat(el('starInner').value) || outerR / 2;
        const points = parseInt(el('polyEdges').value) || 5;
        const planeVal = el('sketchPlane')?.value || 'xz';
        const pts = [];

        for (let i = 0; i < points * 2; i++) {
            const a = (i / points / 2) * Math.PI * 2 - Math.PI / 2;
            const cr = i % 2 === 0 ? outerR : innerR;
            if (planeVal === 'xy') {
                pts.push(new THREE.Vector3(cx + Math.cos(a) * cr, cy + Math.sin(a) * cr, 0));
            } else if (planeVal === 'yz') {
                pts.push(new THREE.Vector3(0, cy + Math.sin(a) * cr, cz + Math.cos(a) * cr));
            } else { // xz
                pts.push(new THREE.Vector3(cx + Math.cos(a) * cr, 0, cz + Math.sin(a) * cr));
            }
        }
        APP.sketch.pts3d = pts;
    }
    else if (tool === 'arc') {
        let p1 = sp.w3;
        let p2, p3;
        if (SK.tempPts.length >= 3) {
            p2 = SK.tempPts[1].w3 || SK.tempPts[1];
            p3 = SK.tempPts[2].w3 || SK.tempPts[2];
        } else {
            p2 = new THREE.Vector3((sp.w3.x + world.x)/2, (sp.w3.y + world.y)/2, (sp.w3.z + world.z)/2);
            p3 = world;
        }

        const pts = []; const segs = 24;
        const cx = (p1.x + p3.x) / 2, cy = (p1.y + p3.y) / 2, cz = (p1.z + p3.z) / 2;
        const r = p1.distanceTo(new THREE.Vector3(cx, cy, cz));
        const planeVal = el('sketchPlane')?.value || 'xz';

        if (planeVal === 'xy') {
            const a1 = Math.atan2(p1.y - cy, p1.x - cx);
            const a2 = Math.atan2(p3.y - cy, p3.x - cx);
            for (let i = 0; i <= segs; i++) {
                const a = a1 + (a2 - a1) * (i / segs);
                pts.push(new THREE.Vector3(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 0));
            }
        } else if (planeVal === 'yz') {
            const a1 = Math.atan2(p1.y - cy, p1.z - cz);
            const a2 = Math.atan2(p3.y - cy, p3.z - cz);
            for (let i = 0; i <= segs; i++) {
                const a = a1 + (a2 - a1) * (i / segs);
                pts.push(new THREE.Vector3(0, cy + Math.sin(a) * r, cz + Math.cos(a) * r));
            }
        } else { // xz
            const a1 = Math.atan2(p1.z - cz, p1.x - cx);
            const a2 = Math.atan2(p3.z - cz, p3.x - cx);
            for (let i = 0; i <= segs; i++) {
                const a = a1 + (a2 - a1) * (i / segs);
                pts.push(new THREE.Vector3(cx + Math.cos(a) * r, 0, cz + Math.sin(a) * r));
            }
        }
        APP.sketch.pts3d = pts;
    }
}

function drawGrid2D(ctx) {
    const cv=el('sketchCanvas');
    ctx.save();
    ctx.strokeStyle='rgba(26,48,80,0.5)'; ctx.lineWidth=1;
    const step=50;
    for (let x=0;x<cv.width;x+=step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,cv.height); ctx.stroke(); }
    for (let y=0;y<cv.height;y+=step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(cv.width,y); ctx.stroke(); }
    ctx.restore();
}

function redrawSketchCanvas() {
    const cv=el('sketchCanvas'); const ctx=SK.ctx; if (!ctx) return;
    ctx.clearRect(0,0,cv.width,cv.height); drawGrid2D(ctx);
    const color=el('drawColor').value||'#58a6ff';
    const lw=parseInt(el('drawStroke').value)||2;
    ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.shadowColor=color; ctx.shadowBlur=4;
    const pts=SK.tempPts;
    const rect = cv.getBoundingClientRect();
    if (pts.length>1) {
        ctx.beginPath(); ctx.moveTo(pts[0].x - rect.left, pts[0].y - rect.top);
        for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x - rect.left, pts[i].y - rect.top);
        ctx.stroke();
    }
    pts.forEach(p=>{ ctx.beginPath(); ctx.arc(p.x - rect.left, p.y - rect.top,4,0,Math.PI*2); ctx.fillStyle=color; ctx.fill(); });
}

function redrawRectCanvas(x1,y1,x2,y2) {
    const cv=el('sketchCanvas'); const ctx=SK.ctx; if (!ctx) return;
    ctx.clearRect(0,0,cv.width,cv.height); drawGrid2D(ctx);
    const rect=cv.getBoundingClientRect();
    const color=el('drawColor').value||'#58a6ff'; const lw=parseInt(el('drawStroke').value)||2;
    ctx.strokeStyle=color; ctx.lineWidth=lw; ctx.shadowColor=color; ctx.shadowBlur=4;
    ctx.beginPath(); ctx.strokeRect(x1-rect.left,y1-rect.top,(x2-x1),(y2-y1)); ctx.stroke();
}

function updateSketchPreview3D() {
    clearSketchPreview();
    const pts3d=APP.sketch.pts3d; if (pts3d.length<2) return;
    const geo=new THREE.BufferGeometry().setFromPoints(pts3d.concat(el('drawClose').checked ? [pts3d[0]] : []));
    const mat=new THREE.LineBasicMaterial({color:0xbc8cff,linewidth:2});
    const line=new THREE.Line(geo,mat);
    APP.scene.add(line); APP.sketch.preview=line;

    // Vertex dots
    pts3d.forEach(p=>{
        const dg=new THREE.SphereGeometry(0.6,8,8);
        const dm=new THREE.MeshBasicMaterial({color:0xffd740});
        const dot=new THREE.Mesh(dg,dm); dot.position.copy(p);
        APP.scene.add(dot); APP.sketch.editHelpers.push(dot);
    });
}

function getToolLabel(t) {
    const labels={line:'Çizgi',rect:'Dikdörtgen',circle:'Çember',ellipse:'Elips',triangle:'Üçgen',poly:'Çokgen',star:'Yıldız',arc:'Yay',spline:'Spline',text3d:'3D Metin'};
    return labels[t]||t;
}

/* ════════════════════════════════════════
   EDIT MODE
════════════════════════════════════════ */
function enterEditMode() {
    if (!APP.selected) { toast('⚠ Obje seçin','warning',1800); return; }
    APP.mode='edit'; APP.transform.detach();
    el('vpBadge').textContent=`EDİT MODU · ${APP.editSel.toUpperCase()}`;
    el('vpBadge').className='vp-badge edit-mode';
    buildEditHelpers();
    document.querySelectorAll('.mb-btn.mode-btn').forEach(b=>b.classList.remove('active'));
    el('mbModeEdit').classList.add('active');
    
    // Switch right panel inspector to Geometry tab to show sculpt brush parameters
    document.querySelectorAll('.rp-tab').forEach(t => {
        if (t.dataset.rpt === 'geometry') t.click();
    });
    
    toast('✏ Edit modu — vertex/edge/face seçin','info',2000);
}
function exitEditMode() {
    APP.mode='object'; clearEditHelpers();
    el('vpBadge').textContent='OBJE MODU · PERSPEKTİF';
    el('vpBadge').className='vp-badge';
    if (APP.selected) APP.transform.attach(APP.selected);
    document.querySelectorAll('.mb-btn.mode-btn').forEach(b=>b.classList.remove('active'));
    el('mbModeObj').classList.add('active');
}
function buildEditHelpers() {
    clearEditHelpers(); if (!APP.selected) return;
    const geo=APP.selected.geometry; if (!geo.attributes.position) return;
    const pos=geo.attributes.position;
    const pts=[]; const seen=new Set();
    for (let i=0;i<pos.count;i++) {
        const k=`${pos.getX(i).toFixed(2)}_${pos.getY(i).toFixed(2)}_${pos.getZ(i).toFixed(2)}`;
        if (!seen.has(k)) { seen.add(k); pts.push(pos.getX(i),pos.getY(i),pos.getZ(i)); }
    }
    const vg=new THREE.BufferGeometry(); vg.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));
    const vm=new THREE.PointsMaterial({color:0x58a6ff,size:5,sizeAttenuation:false});
    const vp=new THREE.Points(vg,vm); vp.renderOrder=999;
    APP.selected.add(vp); APP.editHelpers.push(vp);
}
function clearEditHelpers() {
    APP.editHelpers.forEach(h=>{if(h.parent)h.parent.remove(h);h.geometry?.dispose();h.material?.dispose();});
    APP.editHelpers=[];
}

/* ════════════════════════════════════════
   OUTLINER
════════════════════════════════════════ */
function refreshOutliner() {
    const out=el('outliner');
    if (!APP.objects.length) { out.innerHTML='<div class="out-empty">Sahne boş</div>'; return; }
    const icons={box:'▪',cylinder:'⭕',sphere:'●',cone:'▲',torus:'◯',plane:'▬',capsule:'💊',pyramid:'🔺',tube:'⬜',ring:'◉',octa:'◈',dodeca:'◇',icosa:'◆',tetra:'△',spring:'🌀',arrow:'→',prism:'▣',sketch:'✏',union:'⊕',intersect:'⊗',lathe:'⟳',text3d:'T',house:'🏠',sword:'⚔️',tower:'🏰',rock:'🪨',shield:'🛡️',chest:'📦',barrel:'🛢️'};
    out.innerHTML=APP.objects.map(obj=>{
        const ic=icons[obj.userData.type]||'○';
        const sel=APP.selected?.userData.id===obj.userData.id;
        return `<div class="out-item${sel?' selected':''}" data-id="${obj.userData.id}">
            <span class="out-ic">${ic}</span>
            <span class="out-nm" title="${obj.userData.name}">${obj.userData.name}</span>
            <span class="out-eye" data-id="${obj.userData.id}">${obj.visible?'👁':'🙈'}</span>
        </div>`;
    }).join('');
    out.querySelectorAll('.out-item').forEach(item=>{
        item.addEventListener('click', function(e){
            if (e.target.classList.contains('out-eye')) return;
            const obj=APP.objects.find(o=>o.userData.id===this.dataset.id);
            if (obj) selectObj(obj);
        });
    });
    out.querySelectorAll('.out-eye').forEach(v=>{
        v.addEventListener('click', function(e){
            e.stopPropagation();
            const obj=APP.objects.find(o=>o.userData.id===this.dataset.id);
            if (obj) { obj.visible=!obj.visible; refreshOutliner(); }
        });
    });
}

/* ════════════════════════════════════════
   STATS
════════════════════════════════════════ */
function updateStats() {
    el('sObj').textContent=APP.objects.length;
    let v=0,f=0;
    APP.objects.forEach(o=>{ if(o.geometry?.attributes.position){v+=o.geometry.attributes.position.count; f+=o.geometry.index?o.geometry.index.count/3:o.geometry.attributes.position.count/3;} });
    el('sVert').textContent=v>9999?(v/1000).toFixed(1)+'K':v;
    el('sFace').textContent=f>9999?(Math.round(f)/1000).toFixed(1)+'K':Math.round(f);
}

/* ════════════════════════════════════════
   CAMERA VIEWS
════════════════════════════════════════ */
function setView(view) {
    document.querySelectorAll('.vp-tb').forEach(b=>b.classList.remove('active'));
    el(`vp${view}`).classList.add('active');
    const d=200;
    const views={Persp:[90,65,90,new THREE.Vector3(0,10,0)],Top:[0,d,0.01,new THREE.Vector3(0,0,0)],Front:[0,30,d,new THREE.Vector3(0,30,0)],Right:[d,30,0,new THREE.Vector3(0,30,0)],Left:[-d,30,0,new THREE.Vector3(0,30,0)],Bottom:[0,-d,0.01,new THREE.Vector3(0,0,0)]};
    const [x,y,z,tgt]=views[view]||views.Persp;
    APP.camera.position.set(x,y,z); APP.orbit.target.copy(tgt); APP.orbit.update();
    if (APP.mode==='object') el('vpBadge').textContent=`OBJE MODU · ${view.toUpperCase()}`;
}

/* ════════════════════════════════════════
   MINI GIZMO
════════════════════════════════════════ */
const GZ={sc:null,cam:null,ren:null};
function initGizmo(){
    const cv=el('gizmoCanvas');
    GZ.ren=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true});
    GZ.ren.setSize(80,80);
    GZ.sc=new THREE.Scene(); GZ.cam=new THREE.PerspectiveCamera(50,1,.1,100);
    GZ.cam.position.set(2,2,2); GZ.cam.lookAt(0,0,0);
    GZ.sc.add(new THREE.AxesHelper(1.3));
    GZ.sc.add(new THREE.AmbientLight(0xffffff,1));
}
function updateGizmo(){
    if (!GZ.ren) return;
    GZ.cam.position.set(0,0,2.5); GZ.cam.position.applyQuaternion(APP.camera.quaternion.clone().invert());
    GZ.cam.lookAt(0,0,0); GZ.ren.render(GZ.sc,GZ.cam);
}

/* ════════════════════════════════════════
   RENDER MODE
════════════════════════════════════════ */
function setRenderMode(mode) {
    APP.renderMode=mode;
    APP.objects.forEach(o=>{
        if (!o.material) return;
        if (mode==='wireframe') { o.material.wireframe=true; }
        else if (mode==='xray') { if (!o.userData._ropacity) o.userData._ropacity=o.material.opacity; o.material.opacity=0.28; o.material.transparent=true; o.material.wireframe=false; }
        else if (mode==='flat') { o.material.flatShading=true; o.material.wireframe=false; o.material.needsUpdate=true; }
        else if (mode==='matcap') { o.material.wireframe=false; }
        else { if (o.userData._ropacity) { o.material.opacity=o.userData._ropacity; delete o.userData._ropacity; } o.material.wireframe=false; o.material.transparent=o.material.opacity<1; o.material.flatShading=false; o.material.needsUpdate=true; }
    });
}

/* ════════════════════════════════════════
   CONTEXT MENU
════════════════════════════════════════ */
function onCtxMenuShow(e) {
    e.preventDefault(); if (!APP.selected) return;
    const ctx=el('ctxMenu');
    const vp=el('viewport').getBoundingClientRect();
    ctx.style.display='block'; ctx.style.left=(e.clientX-vp.left)+'px'; ctx.style.top=(e.clientY-vp.top)+'px';
}
function closeCtxMenu(e) {
    const ctx=el('ctxMenu');
    if (ctx && !ctx.contains(e?.target)) ctx.style.display='none';
}
function onDocClick(e) { closeCtxMenu(e); }

/* ════════════════════════════════════════
   UNDO / REDO
════════════════════════════════════════ */
function saveHist(action) {
    APP.history=APP.history.slice(0,APP.histIdx+1);
    const snap={action, objects:APP.objects.map(serObj), selId:APP.selected?.userData.id||null};
    APP.history.push(snap);
    if (APP.history.length>APP.MAX_HIST) APP.history.shift();
    APP.histIdx=APP.history.length-1;
    updateUndoRedo();
}
function undo() { if (APP.histIdx<=0) return; APP.histIdx--; restoreHist(APP.history[APP.histIdx]); updateUndoRedo(); toast('↩ Geri alındı','info',1000); }
function redo() { if (APP.histIdx>=APP.history.length-1) return; APP.histIdx++; restoreHist(APP.history[APP.histIdx]); updateUndoRedo(); toast('↪ İleri','info',1000); }
function restoreHist(snap) {
    APP.objects.forEach(o=>{APP.scene.remove(o);o.geometry?.dispose();o.material?.dispose();}); APP.objects=[];
    APP.selected=null; APP.transform.detach(); clearEditHelpers();
    snap.objects.forEach(d=>{ const o=desObj(d); if(o){APP.scene.add(o);APP.objects.push(o);} });
    if (snap.selId) { const f=APP.objects.find(o=>o.userData.id===snap.selId); if(f) selectObj(f); }
    refreshOutliner(); updateStats(); showInspector(false);
}
function updateUndoRedo() {
    el('mbUndo').disabled=APP.histIdx<=0; el('mbRedo').disabled=APP.histIdx>=APP.history.length-1;
}
function serObj(obj) {
    return { id:obj.userData.id, name:obj.userData.name, type:obj.userData.type, params:obj.userData.params, pos:obj.position.toArray(), rot:[obj.rotation.x,obj.rotation.y,obj.rotation.z], scl:obj.scale.toArray(), mat:{c:'#'+obj.material.color.getHexString(),m:obj.material.metalness,r:obj.material.roughness,o:obj.material.opacity||1}, vis:obj.visible, locked:obj.userData.locked||false };
}
function desObj(d) {
    try {
        const {geo}=buildGeo(d.type,d.params||{});
        const mat=new THREE.MeshStandardMaterial({color:d.mat.c||'#4fc3f7',metalness:d.mat.m||0.2,roughness:d.mat.r||0.6,opacity:d.mat.o||1,transparent:(d.mat.o||1)<1});
        const m=new THREE.Mesh(geo,mat);
        m.position.fromArray(d.pos||[0,0,0]); m.rotation.set(...(d.rot||[0,0,0])); m.scale.fromArray(d.scl||[1,1,1]);
        m.castShadow=m.receiveShadow=true; m.visible=d.vis!==false;
        m.userData={id:d.id,name:d.name,type:d.type,params:d.params,locked:d.locked||false};
        addWireEdges(m); return m;
    } catch(e){console.error('desObj:',e);return null;}
}

/* ════════════════════════════════════════
   EXPORT
════════════════════════════════════════ */
function exportSTL() {
    if (!APP.objects.length) {toast('⚠ Obje yok','warning',2000);return;}
    try {
        const exp=new THREE.STLExporter();
        const grp=new THREE.Group(); APP.objects.filter(o=>o.visible).forEach(o=>{const c=o.clone();c.children=[];grp.add(c);});
        const str=exp.parse(grp,{binary:false});
        dlBlob(new Blob([str],{type:'text/plain'}),`TriForge3D_${Date.now()}.stl`);
        toast('✓ STL indirildi','success',2000);
    } catch(e){toast('❌ STL hatası: '+e.message,'error',3000);}
}
function exportOBJ() {
    if (!APP.objects.length) {toast('⚠ Obje yok','warning',2000);return;}
    try {
        const exp=new THREE.OBJExporter();
        const grp=new THREE.Group(); APP.objects.filter(o=>o.visible).forEach(o=>{const c=o.clone();c.children=[];grp.add(c);});
        const str=exp.parse(grp);
        dlBlob(new Blob([str],{type:'text/plain'}),`TriForge3D_${Date.now()}.obj`);
        toast('✓ OBJ indirildi','success',2000);
    } catch(e){toast('❌ OBJ hatası: '+e.message,'error',3000);}
}
function dlBlob(blob,name) {
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(a.href);
}

/* ════════════════════════════════════════
   SAVE/LOAD
════════════════════════════════════════ */
async function saveProject() {
    const name=el('mSaveName').value.trim()||'Tasarim';
    const data={version:'3.0',appName:'TriForge CAD Pro',name,savedAt:new Date().toISOString(),objectCount:APP.objects.length,objects:APP.objects.map(serObj)};
    try {
        const res=await fetch('save.php',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save',name,data})});
        const r=await res.json();
        if (r.success){toast(`✓ "${name}" sunucuya kaydedildi`,'success',2500);el('saveModal').style.display='none';}
        else toast('❌ Kaydetme hatası: '+r.error,'error',4000);
    } catch(e){toast('❌ Sunucu hatası: '+e.message,'error',4000);}
}

async function saveProjectLocal() {
    const name = el('mSaveName').value.trim() || 'Tasarim';
    const data = {
        version: '3.0',
        appName: 'TriForge CAD Pro',
        name,
        savedAt: new Date().toISOString(),
        objectCount: APP.objects.length,
        objects: APP.objects.map(serObj)
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: `${name}.json`,
                types: [{
                    description: 'TriForge CAD Pro Proje Dosyası',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            toast(`✓ "${name}" bilgisayara kaydedildi`, 'success', 2500);
            el('saveModal').style.display = 'none';
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('showSaveFilePicker failed, falling back to download:', err);
        }
    }
    
    dlBlob(blob, `${name}.json`);
    toast(`✓ "${name}" indirildi`, 'success', 2500);
    el('saveModal').style.display = 'none';
}

/* ════════════════════════════════════════
   CLEAR
════════════════════════════════════════ */
function clearScene() {
    APP.objects.forEach(o=>{APP.scene.remove(o);o.geometry?.dispose();o.material?.dispose();});
    APP.objects=[]; APP.selected=null; APP.transform.detach(); clearEditHelpers();
    refreshOutliner(); updateStats(); showInspector(false);
    el('stSel').textContent='Seçili: —'; el('stTransform').textContent='';
}

/* ════════════════════════════════════════
   COLLAPSIBLE SECTIONS
════════════════════════════════════════ */
function initCollapsibles() {
    document.querySelectorAll('.lp-sec-hdr').forEach(hdr => {
        hdr.addEventListener('click', function() {
            const key=this.dataset.sec;
            const body=el('sec'+key.charAt(0).toUpperCase()+key.slice(1));
            if (!body) return;
            const collapsed=body.classList.toggle('collapsed');
            this.classList.toggle('collapsed', collapsed);
            this.querySelector('.sec-arrow').textContent = collapsed ? '▸' : '▾';
        });
        // Initialize
        if (hdr.classList.contains('collapsed')) {
            const key=hdr.dataset.sec;
            const body=el('sec'+key.charAt(0).toUpperCase()+key.slice(1));
            if (body) body.classList.add('collapsed');
        }
    });
}

/* ════════════════════════════════════════
   PANEL TABS
════════════════════════════════════════ */
function initPanelTabs() {
    // Left panel tabs
    document.querySelectorAll('.lp-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.lp-tab').forEach(t=>t.classList.remove('active'));
            document.querySelectorAll('.lp-content').forEach(c=>c.classList.remove('active'));
            this.classList.add('active');
            const key=this.dataset.lpt;
            const c=el('lpt'+key.charAt(0).toUpperCase()+key.slice(1));
            if (c) c.classList.add('active');
        });
    });
    // Right panel tabs
    document.querySelectorAll('.rp-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.rp-tab').forEach(t=>t.classList.remove('active'));
            document.querySelectorAll('.rp-tc').forEach(c=>c.classList.remove('active'));
            this.classList.add('active');
            const key=this.dataset.rpt;
            const c=el('rpt'+key.charAt(0).toUpperCase()+key.slice(1));
            if (c) c.classList.add('active');
        });
    });
}

/* ════════════════════════════════════════
   BIND ALL
════════════════════════════════════════ */
function bindAll() {
    // Shapes
    document.querySelectorAll('.shp').forEach(btn => btn.addEventListener('click', () => {
        const s=btn.dataset.s;
        if (s==='text3d') { el('textModal').style.display='flex'; return; }
        addObject(s);
    }));

    // Preset sizes
    document.querySelectorAll('.sz-btn').forEach(btn => btn.addEventListener('click', function() {
        document.querySelectorAll('.sz-btn').forEach(b=>b.classList.remove('active'));
        this.classList.add('active');
        APP.presetSize=parseInt(this.dataset.sz);
        el('customSz').value=APP.presetSize;
        toast(`Boyut: ${APP.presetSize}mm`,'info',1000);
    }));
    el('customSz').addEventListener('change', function() { APP.presetSize=parseFloat(this.value)||20; document.querySelectorAll('.sz-btn').forEach(b=>b.classList.remove('active')); });

    // Mode buttons (menubar)
    el('mbModeObj').addEventListener('click', () => { if (APP.mode==='sketch') exitSketchMode(); if (APP.mode==='edit') exitEditMode(); });
    el('mbModeEdit').addEventListener('click', () => { if (APP.mode==='sketch') exitSketchMode(); enterEditMode(); });
    el('mbModeSketch').addEventListener('click', () => { if (APP.mode==='edit') exitEditMode(); if (APP.mode==='sketch') exitSketchMode(); else enterSketchMode(); });

    // Tool buttons (menubar)
    document.querySelectorAll('.mb-btn.tool-btn').forEach(btn => btn.addEventListener('click', function() {
        document.querySelectorAll('.mb-btn.tool-btn').forEach(b=>b.classList.remove('active'));
        this.classList.add('active');
        const tool=this.dataset.tool;
        APP.activeTool=tool;
        // sync left tools
        document.querySelectorAll('.lt-btn').forEach(b=>b.classList.remove('active'));
        const ltIds={select:'ltSel',translate:'ltMove',rotate:'ltRot',scale:'ltScl'};
        const lid=ltIds[tool]; if (lid) el(lid).classList.add('active');
        if (tool==='select') APP.transform.detach();
        else { APP.transform.setMode(tool); if (APP.selected&&APP.mode==='object') APP.transform.attach(APP.selected); }
    }));

    // Left tools strip
    [['ltSel','select'],['ltMove','translate'],['ltRot','rotate'],['ltScl','scale']].forEach(([id,tool]) => {
        el(id).addEventListener('click', () => {
            document.querySelectorAll('.lt-btn').forEach(b=>b.classList.remove('active'));
            el(id).classList.add('active');
            APP.activeTool=tool;
            // sync menubar
            document.querySelectorAll('.mb-btn.tool-btn').forEach(b=>b.classList.remove('active'));
            const mbIds={select:'tbSel',translate:'tbMove',rotate:'tbRot',scale:'tbScl'};
            const mbid=mbIds[tool]; if (mbid) el(mbid).classList.add('active');
            if (tool==='select') APP.transform.detach();
            else { APP.transform.setMode(tool); if (APP.selected&&APP.mode==='object') APP.transform.attach(APP.selected); }
        });
    });

    // Draw tool buttons
    document.querySelectorAll('.draw-btn').forEach(btn => btn.addEventListener('click', function() {
        document.querySelectorAll('.draw-btn').forEach(b=>b.classList.remove('draw-active'));
        this.classList.add('draw-active');
        APP.drawTool=this.dataset.dt;
        if (APP.drawTool==='text3d') { el('textModal').style.display='flex'; return; }
        clearSketchData();
        el('dhTool').textContent=`Araç: ${getToolLabel(APP.drawTool)}`;
        el('dhInfo').textContent='İlk noktayı tıklayın';
        if (APP.mode!=='sketch') { exitEditMode(); enterSketchMode(); }
        el('vpBadge').textContent=`ÇİZİM MODU · ${getToolLabel(APP.drawTool).toUpperCase()}`;
        toast(`${getToolLabel(APP.drawTool)} aracı seçildi — Çizim moduna girin`,'info',1800);
    }));

    // Measure/focus left tools
    el('ltMeasure').addEventListener('click', () => toast('Ölçüm: iki obje seçin','info',2000));
    el('ltFocus').addEventListener('click', () => focusObj(APP.selected));

    // Snap
    el('snapChk').addEventListener('change', function() { APP.snap=this.checked; toast(APP.snap?'🧲 Snap aktif':'🧲 Snap kapalı','info',1000); });
    el('snapVal').addEventListener('change', function() { APP.snapVal=parseFloat(this.value)||1; });

    // Space
    el('spWorld').addEventListener('click', () => { APP.space='world'; APP.transform.setSpace('world'); el('spWorld').classList.add('active'); el('spLocal').classList.remove('active'); });
    el('spLocal').addEventListener('click', () => { APP.space='local'; APP.transform.setSpace('local'); el('spLocal').classList.add('active'); el('spWorld').classList.remove('active'); });

    // View buttons
    ['Persp','Top','Front','Right','Left','Bottom'].forEach(v => el(`vp${v}`).addEventListener('click', () => setView(v)));

    // Quick actions
    el('qaDup').addEventListener('click', () => duplicateObj(APP.selected));
    el('qaMX').addEventListener('click', () => mirrorObj('x'));
    el('qaMZ').addEventListener('click', () => mirrorObj('z'));
    el('qaCenter').addEventListener('click', () => centerObj(APP.selected));
    el('qaGround').addEventListener('click', () => groundObj(APP.selected));
    el('qaFocus').addEventListener('click', () => focusObj(APP.selected));
    el('qaDel').addEventListener('click', () => deleteObj(APP.selected));
    el('qaClear').addEventListener('click', () => { if(!confirm('Tüm sahneyi temizle?')) return; clearScene(); saveHist('clear'); toast('🆕 Sahne temizlendi','info',1800); });

    // Ops
    el('opUnion').addEventListener('click', boolUnion);
    el('opSubtract').addEventListener('click', boolSubtract);
    el('opIntersect').addEventListener('click', boolIntersect);
    el('opExtrude').addEventListener('click', doExtrude);
    el('opBevel').addEventListener('click', doBevel);
    el('opSubdiv').addEventListener('click', doSubdiv);
    el('opSmooth').addEventListener('click', doSmooth);
    el('opSolidify').addEventListener('click', doSolidify);
    el('opArray').addEventListener('click', doArray);
    el('opLathe').addEventListener('click', doLathe);

    // Outliner actions
    el('oaSelAll').addEventListener('click', () => { if(APP.objects.length>0) selectObj(APP.objects[APP.objects.length-1]); });
    el('oaDesel').addEventListener('click', () => selectObj(null));
    el('oaDelAll').addEventListener('click', () => { if(!confirm('Tüm sahneyi temizle?')) return; clearScene(); saveHist('clear'); toast('🆕 Temizlendi','info',1800); });

    // Scene settings
    el('tglGrid').addEventListener('change', function() { if(APP.grid) APP.grid.visible=this.checked; });
    el('tglAxis').addEventListener('change', function() { if(APP.axesHelper) APP.axesHelper.visible=this.checked; });
    el('tglShadow').addEventListener('change', function() { APP.renderer.shadowMap.enabled=this.checked; });
    el('tglWire').addEventListener('change', function() { APP.objects.forEach(o=>{ if(o.userData.edges) o.userData.edges.visible=this.checked; }); });
    el('tglFog').addEventListener('change', function() { APP.scene.fog=this.checked?new THREE.FogExp2(0x060a0e,0.0022):null; });
    el('tglHDRI').addEventListener('change', function() { APP.ambLight.intensity=this.checked?1.0:0.3; });
    el('gridSz').addEventListener('change', function() { buildGrid(parseInt(this.value)); });
    el('bgCol').addEventListener('input', function() { const c=new THREE.Color(this.value); APP.scene.background=c; if(APP.scene.fog) APP.scene.fog.color=c; });
    el('renderMode').addEventListener('change', function() { setRenderMode(this.value); });
    el('camSpeed').addEventListener('input', function() { APP.orbit.zoomSpeed=parseFloat(this.value)*1.2; APP.orbit.rotateSpeed=parseFloat(this.value)*0.5; });
    el('ambIntensity').addEventListener('input', function() { APP.ambLight.intensity=parseFloat(this.value); });
    el('sunIntensity').addEventListener('input', function() { APP.sunLight.intensity=parseFloat(this.value); });
    el('sunColor').addEventListener('input', function() { APP.sunLight.color.set(this.value); });
    el('sunX').addEventListener('input', function() { APP.sunLight.position.x=parseFloat(this.value); });
    el('sunY').addEventListener('input', function() { APP.sunLight.position.y=parseFloat(this.value); });

    // Header btns
    el('mbNew').addEventListener('click', () => { if(APP.objects.length>0&&!confirm('Yeni sahne — kaydedilmemiş değişiklikler kaybolur.')) return; clearScene(); saveHist('new'); toast('🆕 Yeni sahne','info',1800); });
    el('mbSave').addEventListener('click', () => { el('saveModal').style.display='flex'; el('mSaveName').focus(); });
    el('mbLoad').addEventListener('click', () => el('localFileInp').click());
    el('localFileInp').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function(evt) {
            try {
                const data = JSON.parse(evt.target.result);
                if (!data || !Array.isArray(data.objects)) {
                    toast('❌ Geçersiz proje dosyası (nesne listesi bulunamadı)', 'error', 3000);
                    return;
                }
                restoreHist(data);
                saveHist('load');
                toast(`✓ "${data.projectName || file.name.replace('.json','')}" başarıyla yüklendi`, 'success', 2500);
            } catch(err) {
                toast('❌ Dosya okuma hatası: ' + err.message, 'error', 3000);
            }
        };
        reader.readAsText(file);
        this.value = '';
    });
    el('mbUndo').addEventListener('click', undo);
    el('mbRedo').addEventListener('click', redo);
    el('mbDup').addEventListener('click', () => duplicateObj(APP.selected));
    el('mbDel').addEventListener('click', () => deleteObj(APP.selected));
    el('mbSTL').addEventListener('click', exportSTL);
    el('mbOBJ').addEventListener('click', exportOBJ);

    // Save modal
    el('mSaveOk').addEventListener('click', saveProject);
    el('mSaveLocal').addEventListener('click', saveProjectLocal);
    el('mSaveCancel').addEventListener('click', () => el('saveModal').style.display='none');
    el('mSaveClose').addEventListener('click', () => el('saveModal').style.display='none');
    el('mSaveName').addEventListener('keydown', e => { if(e.key==='Enter') saveProject(); });

    // Text modal
    el('mTextClose').addEventListener('click', () => el('textModal').style.display='none');
    el('mTextCancel').addEventListener('click', () => el('textModal').style.display='none');
    el('mTextOk').addEventListener('click', () => {
        const txt=el('mTextStr').value.trim()||'TEXT';
        const sz=parseFloat(el('mTextSz').value)||10;
        const dep=parseFloat(el('mTextDepth').value)||5;
        // Create text using 3D geometry approximation (without FontLoader)
        const geo=new THREE.BoxGeometry(sz*txt.length*0.6, sz, dep);
        const mat=new THREE.MeshStandardMaterial({color:0xffd740,metalness:0.1,roughness:0.7});
        const mesh=new THREE.Mesh(geo,mat);
        mesh.userData={id:uid(),name:`Metin: "${txt}"`,type:'text3d',params:{sz,dep}};
        mesh.castShadow=true; mesh.receiveShadow=true;
        const bb=new THREE.Box3().setFromObject(mesh); mesh.position.y=-bb.min.y;
        addWireEdges(mesh); APP.scene.add(mesh); APP.objects.push(mesh);
        selectObj(mesh); refreshOutliner(); updateStats(); saveHist('text');
        el('textModal').style.display='none';
        toast(`✓ Metin "${txt}" eklendi (kutu yaklaşımı)`,'success',2500);
    });

    // Sketch btns
    el('extrudeSketch').addEventListener('click', extrudeSketch);
    el('clearSketch').addEventListener('click', clearSketchData);

    // Context menu
    el('ctx-dup').addEventListener('click', () => { duplicateObj(APP.selected); el('ctxMenu').style.display='none'; });
    el('ctx-del').addEventListener('click', () => { deleteObj(APP.selected); el('ctxMenu').style.display='none'; });
    el('ctx-focus').addEventListener('click', () => { focusObj(APP.selected); el('ctxMenu').style.display='none'; });
    el('ctx-ground').addEventListener('click', () => { groundObj(APP.selected); el('ctxMenu').style.display='none'; });
    el('ctx-center').addEventListener('click', () => { centerObj(APP.selected); el('ctxMenu').style.display='none'; });
    el('ctx-rp').addEventListener('click', () => { if(APP.selected){APP.selected.position.set(0,0,0);syncXYZ(APP.selected);saveHist('pos');} el('ctxMenu').style.display='none'; });
    el('ctx-rr').addEventListener('click', () => { if(APP.selected){APP.selected.rotation.set(0,0,0);syncXYZ(APP.selected);saveHist('rot');} el('ctxMenu').style.display='none'; });
    el('ctx-rs').addEventListener('click', () => { if(APP.selected){APP.selected.scale.set(1,1,1);syncXYZ(APP.selected);saveHist('scl');} el('ctxMenu').style.display='none'; });

    // Inspector inputs
    bindInspectorInputs();
}

/* ════════════════════════════════════════
   KEYBOARD
════════════════════════════════════════ */
function bindKeyboard() {
    document.addEventListener('keydown', e => {
        const tag=document.activeElement.tagName;
        if (tag==='INPUT'||tag==='SELECT'||tag==='TEXTAREA') return;

        switch(e.key) {
            case 'w': case 'W': el('tbMove')?.click(); break;
            case 'e': case 'E': el('tbRot')?.click(); break;
            case 'r': case 'R': if(!e.ctrlKey) el('tbScl')?.click(); break;
            case 'q': case 'Q': el('tbSel')?.click(); break;
            case 'g': case 'G': if(!e.ctrlKey) el('tbMove')?.click(); break;
            case 'Delete': deleteObj(APP.selected); break;
            case 'x': case 'X':
                if (e.ctrlKey) break;
                if(APP.selected&&confirm('Sil?')) deleteObj(APP.selected); break;
            case 'Escape':
                if (APP.mode==='sketch') exitSketchMode();
                else if (APP.mode==='edit') exitEditMode();
                else selectObj(null);
                break;
            case 'f': case 'F': focusObj(APP.selected); break;
            case 'a': case 'A': if(!e.ctrlKey&&APP.objects.length>0) selectObj(APP.objects[APP.objects.length-1]); break;
            case 'z': if(e.ctrlKey){e.preventDefault();undo();} break;
            case 'y': if(e.ctrlKey){e.preventDefault();redo();} break;
            case 'd': if(e.ctrlKey){e.preventDefault();duplicateObj(APP.selected);} break;
            case 'n': if(e.ctrlKey){e.preventDefault();el('mbNew')?.click();} break;
            case 's': if(e.ctrlKey){e.preventDefault();el('mbSave')?.click();} break;
            case 'k': if(e.ctrlKey){e.preventDefault();el('mbModeSketch')?.click();} break;
            case 'Tab': e.preventDefault();
                if (APP.mode==='object') enterEditMode(); else exitEditMode(); break;
            case 'Enter':
                if (APP.mode==='sketch') {
                    el('extrudeSketch').disabled ? null : extrudeSketch();
                }
                break;
            case 'Home': setView('Persp'); break;
            case '1': if(!e.ctrlKey) setView('Front'); break;
            case '3': if(!e.ctrlKey) setView('Right'); break;
            case '7': if(!e.ctrlKey) setView('Top'); break;
        }
    });
}

/* ════════════════════════════════════════
   UTILITIES
════════════════════════════════════════ */
function el(id) { return document.getElementById(id); }
function uid() { return 'o'+Math.random().toString(36).slice(2,10); }
function cap(v,mn,mx,def) { return v!==undefined?Math.min(mx,Math.max(mn,v)):def; }
function toast(msg, type='info', dur=3000) {
    const box=el('toastBox');
    const t=document.createElement('div');
    t.className=`toast ${type}`;
    const ic={success:'✅',error:'❌',warning:'⚠️',info:'ℹ️'};
    t.innerHTML=`<span>${ic[type]||'ℹ️'}</span><span>${msg}</span>`;
    box.appendChild(t);
    setTimeout(()=>{ t.style.opacity='0'; t.style.transform='translateX(12px)'; t.style.transition='.3s ease'; setTimeout(()=>t.remove(),320); }, dur);
}
function setStatus(msg) { const s=el('stMsg'); if(s) s.textContent=msg; }

// Delayed init
setTimeout(()=>{saveHist('init');updateUndoRedo();},300);
