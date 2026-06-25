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
    fileHandle: null,

    // Conform Warp state
    conformWarp: {
        active: false,
        drawingCurve: false,
        brushing: false,
        isDrawing: false,
        isBrushing: false,
        curvePoints: [],
        curveNormals: [],
        curvePreview: null,
        brushTarget: null,
        drawPlane: null
    },

    // Magic Stitch state
    magicStitch: {
        groupA: [],         // vertex indices for first edge group
        groupB: [],         // vertex indices for second edge group
        pickingGroup: 'A',  // 'A' or 'B' - which group we're picking
        previewHelpers: [], // THREE.Mesh spheres showing selected vertices
        bridgePreview: null,// THREE.Line showing the bridge path
        flowPoints: [],     // guide curve points
        isDrawingFlow: false
    },
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
    APP.transform.addEventListener('change', () => { 
        if (APP.selected) { 
            if (APP.transform.dragging) {
                applySurfaceSnap(APP.selected);
            }
            refreshInspectorLive(APP.selected); 
            updateStatusBar(APP.selected); 
        } 
    });
    APP.scene.add(APP.transform);

    const cv = document.getElementById('mainCanvas');
    cv.addEventListener('pointerdown', onPointerDown);
    cv.addEventListener('pointermove', onMouseMove);
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
    mannequin:{ label:'Karakter 1', color:0xf48fb1 },
    tree:     { label:'Ağaç',     color:0x81c784 },
    stairs:   { label:'Merdiven', color:0xe0e0e0 },
    wall:     { label:'Duvar',    color:0x90a4ae },
    house:    { label:'Ev',       color:0xffb74d },
    sword:    { label:'Kılıç',     color:0xe0e0e0 },
    tower:    { label:'Kule',     color:0xb0bec5 },
    rock:     { label:'Kaya',     color:0xa1887f },
    shield:   { label:'Kalkan',   color:0x90caf9 },
    chest:    { label:'Sandık',   color:0xa1887f },
    barrel:   { label:'Varil',    color:0xd7ccc8 },
    bridge:   { label:'Köprü',    color:0xa1887f },
    torch:    { label:'Meşale',   color:0xff8a80 },
    lantern:  { label:'Fener',    color:0xffd54f },
    fence:    { label:'Çit',      color:0xa1887f },
    well:     { label:'Kuyu',     color:0x80deea },
    campfire: { label:'Kamp Ateşi',color:0xff8a80 },
    tent:     { label:'Çadır',    color:0x81c784 },
    windmill: { label:'Değirmen', color:0xffd54f },
    boat:     { label:'Tekne',    color:0x64b5f6 },
    crystal:  { label:'Kristal',  color:0xe040fb },
    pillar:   { label:'Sütun',    color:0xb0bec5 },
    flag:     { label:'Bayrak',   color:0xff8a80 },
    gravestone:{ label:'Mezar',    color:0x90a4ae },
    castle:    { label:'Şato',     color:0xb0bec5 },
    lighthouse:{ label:'Deniz Feneri',color:0xffd54f },
    pine:      { label:'Çam Ağacı', color:0x2e7d32 },
    mushroom:  { label:'Mantar',   color:0xff8a80 },
    cannon:    { label:'Top',      color:0x37474f },
    ruins:     { label:'Harabe',   color:0x8d6e63 },
    cabin:     { label:'Kulübe',   color:0xa1887f },
    portal:    { label:'Geçit',    color:0x9c27b0 },
    cactus:    { label:'Kaktüs',   color:0x2e7d32 },
    cloud:     { label:'Bulut',    color:0xffffff },
    flower:    { label:'Çiçek',    color:0xf48fb1 },
    crate:     { label:'Kasa',     color:0xd7ccc8 },
    anvil:     { label:'Örs',      color:0x424242 },
    wagon:     { label:'Vagon',    color:0x8d6e63 },
    knight:   { label:'Karakter 2',  color:0x90caf9 },
    wizard:   { label:'Karakter 3',  color:0xb39ddb },
    cyborg:   { label:'Karakter 4',  color:0x80deea },
    ninja:    { label:'Karakter 5',  color:0xe0e0e0 },
    ranger:   { label:'Karakter 6',  color:0x818cf8 },
    slime:    { label:'Canavar 1',    color:0xa5d6a7 },
    golem:    { label:'Canavar 2', color:0xb0bec5 },
    beholder: { label:'Canavar 3', color:0xff8a80 },
    dragon:   { label:'Canavar 4', color:0xe57373 },
    road_straight: { label:'Düz Yol', color:0x333333 },
    road_curve:    { label:'Virajlı Yol', color:0x333333 },
    road_t_junction:{ label:'T-Kavşak', color:0x333333 },
    road_crossroad:{ label:'Dört Yol', color:0x333333 },
    road_bridge:   { label:'Köprü Yol', color:0x333333 },
    karambit:      { label:'Karambit', color:0xffffff },
    kelebek:       { label:'Kelebek',  color:0xffffff },
    lol_yasuo:      { label:'Yasuo Figürü', color:0x90caf9 },
    lol_teemo:      { label:'Teemo Figürü', color:0xa5d6a7 },
    lol_garen:      { label:'Garen Figürü', color:0xffd700 },
};

const STANDEE_INFO = {
    // Architectural
    house:      { category: 'building', label: 'EV', sub: 'Low-Poly Konut', img: 'photo-1580587771525-78b9dba3b914' },
    tower:      { category: 'building', label: 'KULE', sub: 'Kale Burcu', img: 'photo-1508849789987-4e5333c12b78' },
    wall:       { category: 'building', label: 'DUVAR', sub: 'Taş Sur', img: 'photo-1572979848529-65a7e6ec35b8' },
    stairs:     { category: 'building', label: 'MERDİVEN', sub: 'Geçit Basamakları', img: 'photo-1449034446853-66c86144b0ad' },
    bridge:     { category: 'building', label: 'KÖPRÜ', sub: 'Taş Kemer Köprü', img: 'photo-1449034446853-66c86144b0ad' },
    windmill:   { category: 'building', label: 'DEĞİRMEN', sub: 'Yel Değirmeni', img: 'photo-1507608869274-d3177c8bb4c7' },
    well:       { category: 'building', label: 'KUYU', sub: 'Su Kuyusu', img: 'photo-1616431940986-77864e1f74db' },
    tent:       { category: 'building', label: 'ÇADIR', sub: 'Kamp Çadırı', img: 'photo-1510312305653-8ed496efae75' },
    castle:     { category: 'building', label: 'ŞATO', sub: 'Demacia Kalesi', img: 'photo-1508849789987-4e5333c12b78' },
    lighthouse: { category: 'building', label: 'DENİZ FENERİ', sub: 'Kıyı Feneri', img: 'photo-1500530855697-b586d89ba3e9' },
    ruins:      { category: 'building', label: 'HARABE', sub: 'Antik Tapınak', img: 'photo-1572979848529-65a7e6ec35b8' },
    cabin:      { category: 'building', label: 'KULÜBE', sub: 'Orman Evi', img: 'photo-1504280390367-361c6d9f38f4' },
    portal:     { category: 'building', label: 'GEÇİT', sub: 'Boyut Kapısı', img: 'photo-1534447677768-be436bb09401' },

    // War & Items
    sword:      { category: 'war_props', label: 'KILIÇ', sub: 'Şövalye Kılıcı', img: 'photo-1589718428257-2e11894d0b17' },
    shield:     { category: 'war_props', label: 'KALKAN', sub: 'Hexagonal Kalkan', img: 'photo-1608976483526-beff876a0862' },
    chest:      { category: 'war_props', label: 'SANDIK', sub: 'Hazine Sandığı', img: 'photo-1594913785162-e6785e78c872' },
    barrel:     { category: 'war_props', label: 'VARİL', sub: 'Ahşap Fıçı', img: 'photo-1584281729011-d0b5e94b281f' },
    torch:      { category: 'war_props', label: 'MEŞALE', sub: 'Alevli Meşale', img: 'photo-1591522810850-58128c5fb0aa' },
    lantern:    { category: 'war_props', label: 'FENER', sub: 'Sokak Lambası', img: 'photo-1543157145-f78c636d023d' },
    fence:      { category: 'war_props', label: 'ÇİT', sub: 'Bahçe Çiti', img: 'photo-1505968409348-bd002797cb35' },
    boat:       { category: 'war_props', label: 'TEKNE', sub: 'Ahşap Sandal', img: 'photo-1505118380757-91f5f5632de0' },
    pillar:     { category: 'war_props', label: 'SÜTUN', sub: 'Mermer Sütun', img: 'photo-1569783908620-e3cf1063991b' },
    flag:       { category: 'war_props', label: 'BAYRAK', sub: 'Hükümranlık Sancağı', img: 'photo-1508962914676-134849a727f0' },
    gravestone: { category: 'war_props', label: 'MEZAR', sub: 'Mezar Taşı', img: 'photo-1551806235-a055370c9345' },
    cannon:     { category: 'war_props', label: 'TOP', sub: 'Kuşatma Topu', img: 'photo-1599819811279-d5ad9cccf838' },
    crate:      { category: 'war_props', label: 'KASA', sub: 'Nakliye Kasası', img: 'photo-1586528116311-ad8dd3c8310d' },
    anvil:      { category: 'war_props', label: 'ÖRS', sub: 'Demirci Örsü', img: 'photo-1508847154043-be12a62861c1' },
    wagon:      { category: 'war_props', label: 'VAGON', sub: 'Taşıma Vagonu', img: 'photo-1590487988256-9ed24133863e' },

    // Game Characters & Monsters
    mannequin:  { category: 'character', label: 'KARAKTER MANKENİ', sub: 'Eğitim Mankeni', img: 'photo-1534126511673-b6899657816a' },
    knight:     { category: 'character', label: 'ŞÖVALYE', sub: 'Demir Muhafız', img: 'photo-1599707367072-cd6ada2bc375' },
    wizard:     { category: 'character', label: 'BÜYÜCÜ', sub: 'Kadim Simyacı', img: 'photo-1519074002996-a69e7ac46a42' },
    cyborg:     { category: 'character', label: 'SİBER SAVAŞÇI', sub: 'Cyborg-X900', img: 'photo-1589254065878-42c9da997008' },
    ninja:      { category: 'character', label: 'NİNJA', sub: 'Gölge Suikastçısı', img: 'photo-1555597673-b21d5c935865' },
    ranger:     { category: 'character', label: 'KORUCU', sub: 'Galaksi Gezgini', img: 'photo-1614728894747-a83421e2b9c9' },
    slime:      { category: 'character', label: 'BALÇIK (SLIME)', sub: 'Zehirli Balçık', img: 'photo-1576086213369-97a306d36557' },
    golem:      { category: 'character', label: 'GOLEM', sub: 'Kaya Devi', img: 'photo-1605721911519-3dfeb3be25e7' },
    beholder:   { category: 'character', label: 'GÖZCÜ (BEHOLDER)', sub: 'Çok Gözlü Canavar', img: 'photo-1509248961158-e54f6934749c' },
    dragon:     { category: 'character', label: 'KADİM EJDERHA', sub: 'Ateş Püskürten', img: 'photo-1618005182384-a83a8bd57fbe' }
};


function buildPedestalGeometry(type) {
    const parts = [];
    const info = STANDEE_INFO[type];
    
    let baseColor = 0x333333;
    let rimColor = 0xffd700;
    let gemColor = 0x00e5ff;
    
    if (type === 'lol_garen') {
        baseColor = 0x0d47a1;
        rimColor = 0xffd700;
        gemColor = 0x1565c0;
    } else if (type === 'lol_yasuo') {
        baseColor = 0x212121;
        rimColor = 0xb0bec5;
        gemColor = 0x80deea;
    } else if (type === 'lol_teemo') {
        baseColor = 0x1b5e20;
        rimColor = 0x8d6e63;
        gemColor = 0xff3d00;
    } else if (info) {
        if (info.category === 'building') {
            baseColor = 0x37474f;
            rimColor = 0xb0bec5;
            gemColor = 0x90a4ae;
        } else if (info.category === 'character') {
            baseColor = 0x1a0933;
            rimColor = 0xe040fb;
            gemColor = 0x00e5ff;
        } else {
            baseColor = 0x2e1c0c;
            rimColor = 0xcd7f32;
            gemColor = 0xff8a65;
        }
    }
    
    // a) Main Base Cylinder
    const baseCyl = new THREE.CylinderGeometry(15, 16, 2.5, 32);
    colorGeometry(baseCyl, baseColor);
    setGeometryUVsToZero(baseCyl);
    parts.push(baseCyl);
    
    // b) Outer Rim
    const baseRim = new THREE.TorusGeometry(15.2, 0.8, 8, 32);
    baseRim.rotateX(Math.PI / 2);
    baseRim.translate(0, 0.4, 0);
    colorGeometry(baseRim, rimColor);
    setGeometryUVsToZero(baseRim);
    parts.push(baseRim);
    
    // c) Bottom support plate
    const basePlt = new THREE.CylinderGeometry(16.5, 16.5, 0.5, 32);
    basePlt.translate(0, -1.25, 0);
    colorGeometry(basePlt, 0x111111);
    setGeometryUVsToZero(basePlt);
    parts.push(basePlt);
    
    // d) Decorative gems
    const gemF = new THREE.BoxGeometry(3, 1.8, 1);
    gemF.translate(0, 0, 15.5);
    colorGeometry(gemF, gemColor);
    setGeometryUVsToZero(gemF);
    parts.push(gemF);
    
    const gemB = gemF.clone().translate(0, 0, -31);
    colorGeometry(gemB, gemColor);
    setGeometryUVsToZero(gemB);
    parts.push(gemB);
    
    // e) The Slot Holder
    const holder = new THREE.BoxGeometry(20, 2.2, 3);
    holder.translate(0, 1.25, 0);
    colorGeometry(holder, rimColor);
    setGeometryUVsToZero(holder);
    parts.push(holder);
    
    const merged = mergeBufferGeometries(parts);
    merged.translate(0, 1.5, 0);
    return merged;
}

function generateSilhouetteGeometry(type, img, rimColor) {
    const canvas = document.createElement('canvas');
    const RES = 128;
    canvas.width = RES;
    canvas.height = RES * 2;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    const width = canvas.width;
    const height = canvas.height;
    const imgData = ctx.getImageData(0, 0, width, height).data;
    
    // Build a foreground mask. Strategy:
    // 1) If image has real transparency, use alpha > 50
    // 2) If JPEG (all alpha=255), use luminance contrast:
    //    sample the 4 corner pixels as "background", then
    //    any pixel whose luminance differs enough is foreground.
    
    const fg = new Uint8Array(width * height); // 1=foreground
    
    // Check if image has any transparent pixel
    let hasTransparency = false;
    for (let i = 3; i < imgData.length; i += 4) {
        if (imgData[i] < 240) { hasTransparency = true; break; }
    }
    
    if (hasTransparency) {
        // PNG with transparency — use alpha channel
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                fg[y * width + x] = imgData[idx + 3] > 50 ? 1 : 0;
            }
        }
    } else {
        // JPEG — luminance-based foreground detection
        // Sample corner luminances as background reference
        function lum(x, y) {
            const idx = (y * width + x) * 4;
            return 0.299 * imgData[idx] + 0.587 * imgData[idx+1] + 0.114 * imgData[idx+2];
        }
        
        // Sample multiple corner points for a robust background estimate
        const cornerSamples = [];
        const margin = 3;
        for (let dy = 0; dy < margin; dy++) {
            for (let dx = 0; dx < margin; dx++) {
                cornerSamples.push(lum(dx, dy));
                cornerSamples.push(lum(width-1-dx, dy));
                cornerSamples.push(lum(dx, height-1-dy));
                cornerSamples.push(lum(width-1-dx, height-1-dy));
            }
        }
        const bgLum = cornerSamples.reduce((a,b) => a+b, 0) / cornerSamples.length;
        
        // Threshold: pixels that differ from background by more than 35 luminance units
        const threshold = 35;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const l = lum(x, y);
                fg[y * width + x] = Math.abs(l - bgLum) > threshold ? 1 : 0;
            }
        }
        
        // Flood-fill from edges to remove false positives near borders
        // (border pixels that are actually background but differ slightly)
        // Simple: erode then dilate (morphological open) for noise reduction
        // Instead, just ensure border band is marked as background
        for (let y = 0; y < height; y++) {
            for (let b = 0; b < 2; b++) {
                fg[y * width + b] = 0;
                fg[y * width + (width-1-b)] = 0;
            }
        }
        for (let x = 0; x < width; x++) {
            for (let b = 0; b < 2; b++) {
                fg[b * width + x] = 0;
                fg[(height-1-b) * width + x] = 0;
            }
        }
    }
    
    // Find bounding box of foreground
    let minX = width, maxX = 0, minY = height, maxY = 0;
    let hasFG = false;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (fg[y * width + x]) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
                hasFG = true;
            }
        }
    }
    
    if (!hasFG) {
        // Fallback: use inner 80% of image
        minX = Math.floor(width * 0.1);
        maxX = Math.floor(width * 0.9);
        minY = Math.floor(height * 0.1);
        maxY = Math.floor(height * 0.9);
    }
    
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    
    // Radial boundary trace with 72 rays for smoother contour
    const points = [];
    const steps = 72;
    for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2;
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        
        let edgeX = cx;
        let edgeY = cy;
        const maxR = Math.max(w, h) * 0.8;
        
        let r = 0;
        while (r < maxR) {
            const x = Math.round(cx + cos * r);
            const y = Math.round(cy - sin * r);
            if (x < 0 || x >= width || y < 0 || y >= height) break;
            
            if (fg[y * width + x]) {
                edgeX = x;
                edgeY = y;
            }
            r += 0.5;
        }
        const normX = ((edgeX - cx) / w) * 18;
        const normY = 16.5 + ((cy - edgeY) / h) * 15;
        points.push(new THREE.Vector2(normX, normY));
    }
    
    // Smooth the contour with a simple moving average (window=3)
    const smoothed = [];
    for (let i = 0; i < points.length; i++) {
        const prev = points[(i - 1 + points.length) % points.length];
        const curr = points[i];
        const next = points[(i + 1) % points.length];
        smoothed.push(new THREE.Vector2(
            (prev.x + curr.x + next.x) / 3,
            (prev.y + curr.y + next.y) / 3
        ));
    }
    
    const shape = new THREE.Shape(smoothed);
    const extrudeGeo = new THREE.ExtrudeGeometry(shape, {
        depth: 2.5,
        bevelEnabled: true,
        bevelThickness: 0.4,
        bevelSize: 0.2,
        bevelSegments: 3
    });
    
    extrudeGeo.translate(0, 0, -1.25);
    
    const count = extrudeGeo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const cRim = new THREE.Color(rimColor);
    const cWhite = new THREE.Color(0xffffff);
    
    const pos = extrudeGeo.attributes.position;
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < count; i++) {
        const z = pos.getZ(i);
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
    }
    
    for (let i = 0; i < count; i++) {
        const z = pos.getZ(i);
        if (Math.abs(z - minZ) < 0.05 || Math.abs(z - maxZ) < 0.05) {
            colors[i * 3] = cWhite.r;
            colors[i * 3 + 1] = cWhite.g;
            colors[i * 3 + 2] = cWhite.b;
        } else {
            colors[i * 3] = cRim.r;
            colors[i * 3 + 1] = cRim.g;
            colors[i * 3 + 2] = cRim.b;
        }
    }
    extrudeGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const uv = extrudeGeo.attributes.uv;
    if (uv) {
        for (let i = 0; i < count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const z = pos.getZ(i);
            
            if (Math.abs(z - minZ) < 0.05 || Math.abs(z - maxZ) < 0.05) {
                const u = 0.02 + ((x + 9) / 18) * 0.96;
                const v = 0.01 + ((y - 1.5) / 30) * 0.98;
                uv.setXY(i, u, v);
            } else {
                uv.setXY(i, 0.005, 0.005);
            }
        }
        uv.needsUpdate = true;
    }
    
    return extrudeGeo;
}

// ══════════════════════════════════════════════════════════
//  3D FİGÜRİN SİLÜET TANIMLARI – Her obje kendine özgü
//  gerçekçi bir 3D kontura sahip olacak (kart DEĞİL).
// ══════════════════════════════════════════════════════════
const FIGURINE_OUTLINES = {
    // ─── Şampiyonlar ───
    lol_garen: [
        [-3.5,0],[-4,2],[-4.5,5],[-5,8],[-5.5,10],[-7,12],[-8.5,14],[-9,16],[-8,17.5],
        [-6,18],[-5,18.5],[-4.5,19.5],[-4,21],[-3.5,23],[-2.5,25],[-1.5,26.5],
        [0,28],[1.5,26.5],[2.5,25],[3.5,23],[4,21],[4.5,19.5],[5,18.5],
        [6,18],[8,17.5],[9,16],[8.5,14],[7,12],[5.5,10],[5,8],[4.5,5],[4,2],[3.5,0]
    ],
    lol_yasuo: [
        [-3,0],[-3.5,3],[-4,6],[-4.5,9],[-5,11],[-6,13],[-5.5,15],[-4.5,16.5],
        [-4,18],[-3.5,20],[-3,22],[-2.5,24],[-4,26],[-6,28.5],[-4,28],
        [-2,27],[0,28.5],[2,27],[3,24.5],[3.5,22],[4,20],[4.5,18],[5,16.5],
        [6,15],[6.5,13],[8,15],[9,14],[7,12],[5.5,11],[5,9],[4.5,6],[4,3],[3.5,0]
    ],
    lol_teemo: [
        [-2.5,0],[-3,2],[-3.5,4],[-4,6],[-5,8],[-5.5,10],[-6.5,12],
        [-8,14],[-9,16.5],[-8.5,19],[-7,20.5],[-5,22],[-3,23],[0,23.5],
        [3,23],[5,22],[7,20.5],[8.5,19],[9,16.5],[8,14],[6.5,12],
        [5.5,10],[5,8],[4,6],[3.5,4],[3,2],[2.5,0]
    ],

    // ─── Yapılar & Binalar ───
    house: [[-7,0],[-7,14],[-8,14],[0,24],[8,14],[7,14],[7,0]],
    tower: [
        [-5,0],[-5,21],[-6,21],[-6,23.5],[-4.5,23.5],[-4.5,21.5],[-3,21.5],[-3,23.5],
        [-1.5,23.5],[-1.5,21.5],[1.5,21.5],[1.5,23.5],[3,23.5],[3,21.5],
        [4.5,21.5],[4.5,23.5],[6,23.5],[6,21],[5,21],[5,0]
    ],
    wall: [
        [-8,0],[-8,17],[-5,17],[-5,19],[-3,19],[-3,17],[3,17],[3,19],[5,19],[5,17],
        [8,17],[8,0],[3,0],[3,9],[-3,9],[-3,0]
    ],
    stairs: [[-7,0],[-7,5],[-4,5],[-4,10],[-1,10],[-1,15],[2,15],[2,20],[5,20],[5,25],[8,25],[8,0]],
    bridge: [
        [-8,0],[-8,7],[-6,11],[-3,13.5],[0,14.5],[3,13.5],[6,11],[8,7],[8,0],
        [6,0],[6,5],[4,8],[2,9.5],[0,10],[-2,9.5],[-4,8],[-6,5],[-6,0]
    ],
    windmill: [
        [-4,0],[-4,11],[-7,14],[-8,16],[-5,17],[-4,13],[-4,17],
        [-2,21],[-4,25],[-2,27],[0,23],[2,27],[4,25],[2,21],
        [4,17],[4,13],[5,17],[8,16],[7,14],[4,11],[4,0]
    ],
    well: [
        [-6,0],[-6,7],[-7,7],[-7,9],[-2,9],[-2,17],[-3,17],[-3,19],
        [3,19],[3,17],[2,17],[2,9],[7,9],[7,7],[6,7],[6,0]
    ],
    tent: [[-7,0],[-7,2],[0,22],[7,2],[7,0]],
    castle: [
        [-8,0],[-8,13],[-9,13],[-9,17],[-7,17],[-7,15],[-6,15],[-6,17],[-4,17],[-4,13],
        [-2,13],[-2,19],[-3,19],[-3,23],[-1,23],[-1,21],[1,21],[1,23],[3,23],[3,19],
        [2,19],[2,13],[4,13],[4,17],[6,17],[6,15],[7,15],[7,17],[9,17],[9,13],[8,13],
        [8,0],[3,0],[3,7],[-3,7],[-3,0]
    ],
    lighthouse: [
        [-4,0],[-3.5,5],[-3,10],[-2.5,14],[-3,16],[-3,18],[-2.5,20],
        [-3.5,20],[-3,22],[-1.5,24],[0,25.5],[1.5,24],[3,22],[3.5,20],
        [2.5,20],[3,18],[3,16],[2.5,14],[3,10],[3.5,5],[4,0]
    ],
    ruins: [
        [-7,0],[-7,7],[-6,11],[-7,13],[-6,15],[-5,13],[-5,0],
        [-2,0],[-2,17],[-1,19],[0,17],[1,15],[1,0],
        [4,0],[4,9],[3,11],[5,13],[6,15],[7,11],[7,0]
    ],
    cabin: [[-7,0],[-7,12],[-8,12],[0,20],[5,15],[5,21],[7,21],[7,15],[8,12],[7,12],[7,0]],
    portal: [
        [-7,0],[-7,15],[-6,19],[-4,22],[-2,24],[0,25],[2,24],[4,22],[6,19],[7,15],[7,0],
        [5,0],[5,13],[4,16],[2,18],[0,19],[-2,18],[-4,16],[-5,13],[-5,0]
    ],

    // ─── Savaş & Eşyalar ───
    sword: [
        [-1,0],[-2.5,1.5],[-5,2.5],[-5,3.5],[-2.5,3.5],[-1.5,4.5],
        [-1,6],[-0.8,14],[-0.5,20],[0,24.5],[0.5,20],[0.8,14],
        [1,6],[1.5,4.5],[2.5,3.5],[5,3.5],[5,2.5],[2.5,1.5],[1,0]
    ],
    shield: [
        [-7,3],[-8,7],[-8,13],[-7,17],[-5,20],[-3,22],[0,23],
        [3,22],[5,20],[7,17],[8,13],[8,7],[7,3],[4,2],[0,1],[-4,2]
    ],
    chest: [
        [-7,0],[-7,7],[-7.5,9],[-7.5,13],[-6,15],[-4,16],[0,16.5],
        [4,16],[6,15],[7.5,13],[7.5,9],[7,7],[7,0]
    ],
    barrel: [
        [-4,0],[-5,2.5],[-5.5,5],[-6,9],[-5.5,13],[-5,16],[-4,19],[-3,20],
        [3,20],[4,19],[5,16],[5.5,13],[6,9],[5.5,5],[5,2.5],[4,0]
    ],
    torch: [
        [-1,0],[-1.5,2],[-1.5,13],[-2.5,15],[-3.5,18],[-2.5,21],
        [-1,23],[0,24],[1,23],[2.5,21],[3.5,18],[2.5,15],[1.5,13],[1.5,2],[1,0]
    ],
    lantern: [
        [-1,0],[-1,5],[-3,6],[-3.5,8],[-3.5,14],[-3,16],[-2,17],
        [-1,17.5],[0,19],[1,17.5],[2,17],[3,16],[3.5,14],[3.5,8],[3,6],[1,5],[1,0]
    ],
    fence: [
        [-8,0],[-8,2.5],[-7,2.5],[-7,13],[-6,14],[-5,13],[-5,2.5],[-3,2.5],[-3,13],
        [-2,14],[-1,13],[-1,2.5],[1,2.5],[1,13],[2,14],[3,13],[3,2.5],
        [5,2.5],[5,13],[6,14],[7,13],[7,2.5],[8,2.5],[8,0]
    ],
    boat: [
        [-8,0],[-7,3.5],[-5,6],[-2,8],[0,9],[2,8],[5,6],[7,3.5],[8,0],
        [6.5,0],[5.5,3],[4,4.5],[2,5.5],[-2,5.5],[-4,4.5],[-5.5,3],[-6.5,0]
    ],
    pillar: [
        [-3,0],[-4,0.8],[-4.5,1.5],[-3,2.5],[-2.5,4],[-2,7],[-2,17],
        [-2.5,19],[-3,20],[-4.5,21],[-4,22],[-3,22],
        [3,22],[4,22],[4.5,21],[3,20],[2.5,19],[2,17],[2,7],[2.5,4],[3,2.5],
        [4.5,1.5],[4,0.8],[3,0]
    ],
    flag: [[-1,0],[-1,23],[-8,23],[-8,19],[-7,17],[-8,15],[-1.5,15],[-1.5,23],[1,23],[1,0]],
    gravestone: [
        [-5,0],[-5,15],[-4.5,18],[-3,20],[-1,21.5],[0,22],
        [1,21.5],[3,20],[4.5,18],[5,15],[5,0]
    ],
    cannon: [
        [-7,0],[-6,2.5],[-5,3.5],[-4,3.5],[-3,4],[-7,5],[-8,7],
        [-7,9],[5,11],[7,10],[8,8],[7,6],[5,5],[-3,3.5],[-2,2.5],
        [0,1.5],[4,1.5],[6,2.5],[7,1.5],[7,0]
    ],
    crate: [[-6,0],[-6,15],[-5,16],[5,16],[6,15],[6,0]],
    anvil: [
        [-7,0],[-5,2.5],[-3,2.5],[-3,5],[-5,6],[-6,7],[-6,9],[-5,10],
        [-3,10],[-2,9],[-2.5,7],[2.5,7],[2,9],[3,10],[5,10],[6,9],
        [6,7],[5,6],[3,5],[3,2.5],[5,2.5],[7,0]
    ],
    wagon: [
        [-8,2.5],[-7,5],[-6,6],[-6,11],[-7,11],[-7,13],[7,13],[7,11],[6,11],[6,6],
        [7,5],[8,2.5],[6,1.5],[4,2.5],[3,3.5],[5,4.5],[5,6],[-5,6],[-5,4.5],
        [-3,3.5],[-4,2.5],[-6,1.5]
    ],

    // ─── Karakterler & Canavarlar ───
    mannequin: [
        [-2.5,0],[-3,3],[-3.5,6],[-4,9],[-4,13],[-5.5,13],[-5.5,15.5],[-4.5,15.5],[-4.5,17],
        [-6.5,17],[-6.5,19],[-5.5,20],[-4,20],[-4,23.5],[-2.5,23.5],[-2,25],
        [2,25],[2.5,23.5],[4,23.5],[4,20],[5.5,20],[6.5,19],[6.5,17],
        [4.5,17],[4.5,15.5],[5.5,15.5],[5.5,13],[4,13],[4,9],[3.5,6],[3,3],[2.5,0]
    ],
    knight: [
        [-3,0],[-3.5,3],[-4,6],[-4.5,9],[-5,12],[-7,12],[-8.5,14],[-9,17],[-7,17.5],[-5,18.5],
        [-4,21],[-3,23.5],[-1.5,25.5],[0,26.5],[1.5,25.5],[3,23.5],[4,21],[5,18.5],
        [7,17.5],[9,17],[8.5,14],[7,12],[5,12],[4.5,9],[4,6],[3.5,3],[3,0]
    ],
    wizard: [
        [-5.5,0],[-5.5,4],[-5,8],[-4.5,11],[-4,13],[-6.5,15],[-8.5,14],[-7.5,17],[-5,17.5],
        [-3.5,20],[-5,21.5],[-6.5,22],[-5.5,23],[-3.5,24.5],[-1.5,27.5],[0,28.5],[1.5,27.5],
        [3.5,24.5],[5.5,23],[6.5,22],[5,21.5],[3.5,20],[5,17.5],[7.5,17],[8.5,14],[6.5,15],
        [4,13],[4.5,11],[5,8],[5.5,4],[5.5,0]
    ],
    cyborg: [
        [-3.5,0],[-4,3.5],[-4.5,7],[-5,10.5],[-5,13.5],[-7,13.5],[-8.5,15],[-9,17.5],[-7.5,19],
        [-6.5,19],[-5.5,21],[-4.5,21],[-3.5,24.5],[-2,26],[2,26],[3.5,24.5],[4.5,21],
        [5.5,21],[6.5,19],[7.5,19],[9,17.5],[8.5,15],[7,13.5],[5,13.5],[5,10.5],[4.5,7],[4,3.5],[3.5,0]
    ],
    ninja: [
        [-2.5,0],[-3,3.5],[-3.5,7],[-4,10],[-4,13.5],[-6,13.5],[-7.5,15],[-8.5,17.5],[-7.5,19],
        [-5,19.5],[-4,22],[-2.5,24.5],[0,25.5],[2.5,24.5],[4,22],[5,19.5],[7.5,19],
        [8.5,17.5],[7.5,15],[6,13.5],[4,13.5],[4,10],[3.5,7],[3,3.5],[2.5,0]
    ],
    ranger: [
        [-3,0],[-3.5,3.5],[-4,7],[-4.5,10],[-5,13],[-7,13],[-8.5,14.5],[-9,17],[-8,19],
        [-6,19.5],[-5,21],[-4,23.5],[-2,25.5],[0,26.5],[2,25.5],[4,23.5],[5,21],[6,19.5],
        [8,19],[9,17],[8.5,14.5],[7,13],[5,13],[4.5,10],[4,7],[3.5,3.5],[3,0]
    ],
    slime: [
        [-7.5,0],[-8,2],[-8.5,4.5],[-8.5,7.5],[-7.5,10.5],[-5.5,13.5],[-3,15.5],[0,16.5],
        [3,15.5],[5.5,13.5],[7.5,10.5],[8.5,7.5],[8.5,4.5],[8,2],[7.5,0]
    ],
    golem: [
        [-7,0],[-8,3],[-8.5,7],[-9,11],[-9,14],[-11,14],[-12,17],[-11.5,20.5],[-9.5,21.5],
        [-7.5,21.5],[-6,23.5],[-4.5,23.5],[-3,25.5],[0,26.5],[3,25.5],[4.5,23.5],[6,23.5],
        [7.5,21.5],[9.5,21.5],[11.5,20.5],[12,17],[11,14],[9,14],[9,11],[8.5,7],[8,3],[7,0]
    ],
    beholder: [
        [-6.5,0],[-8.5,2],[-9.5,5],[-10,9],[-9,12],[-11.5,14],[-13,16.5],[-11.5,18.5],
        [-8.5,17],[-6.5,20.5],[-8.5,23],[-8.5,25.5],[-6.5,24.5],[-4.5,22.5],[-3,24.5],[-3,27.5],
        [-1.5,26.5],[0,28.5],[1.5,26.5],[3,27.5],[3,24.5],[4.5,22.5],[6.5,24.5],[8.5,25.5],
        [8.5,23],[6.5,20.5],[8.5,17],[11.5,18.5],[13,16.5],[11.5,14],[9,12],[10,9],[9.5,5],[8.5,2],[6.5,0]
    ],
    dragon: [
        [-6.5,0],[-8.5,3],[-10,7.5],[-11.5,12.5],[-14.5,12.5],[-18.5,16.5],[-16.5,21.5],[-12.5,19.5],
        [-10.5,16.5],[-9.5,19.5],[-7.5,22.5],[-5,24.5],[-2.5,26.5],[0,27.5],[3.5,28.5],[6.5,27.5],
        [8.5,24.5],[9.5,21.5],[11.5,19.5],[13.5,16.5],[17.5,18.5],[19.5,15.5],[16.5,11.5],[12.5,11.5],
        [10.5,7.5],[8.5,3],[6.5,0]
    ]
};

// Silüet noktalarından 3D figürin geometrisi oluşturan yardımcı fonksiyon
function buildFigureGeo(pts, rimColor, depth) {
    depth = depth || 5;
    const shape = new THREE.Shape();
    shape.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) {
        shape.lineTo(pts[i][0], pts[i][1]);
    }
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
        depth: depth,
        bevelEnabled: true,
        bevelThickness: 0.6,
        bevelSize: 0.4,
        bevelSegments: 3
    });
    geo.translate(0, 3, -depth / 2);  // sit on pedestal

    // Vertex colors: front/back = white (for texture), sides = rim
    const pos = geo.attributes.position;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    const cRim = new THREE.Color(rimColor);
    const cW = new THREE.Color(0xffffff);

    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 0; i < count; i++) {
        const z = pos.getZ(i);
        if (z < minZ) minZ = z;
        if (z > maxZ) maxZ = z;
    }

    for (let i = 0; i < count; i++) {
        const z = pos.getZ(i);
        const isFace = Math.abs(z - minZ) < 0.05 || Math.abs(z - maxZ) < 0.05;
        const c = isFace ? cW : cRim;
        colors[i * 3]     = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // UV mapping for front/back faces
    const uv = geo.attributes.uv;
    if (uv) {
        // Find bounding box of shape for UV normalization
        let sMinX = Infinity, sMaxX = -Infinity, sMinY = Infinity, sMaxY = -Infinity;
        for (let i = 0; i < count; i++) {
            const z = pos.getZ(i);
            if (Math.abs(z - minZ) < 0.05 || Math.abs(z - maxZ) < 0.05) {
                const x = pos.getX(i), y = pos.getY(i);
                if (x < sMinX) sMinX = x;
                if (x > sMaxX) sMaxX = x;
                if (y < sMinY) sMinY = y;
                if (y > sMaxY) sMaxY = y;
            }
        }
        const rangeX = sMaxX - sMinX || 1;
        const rangeY = sMaxY - sMinY || 1;

        for (let i = 0; i < count; i++) {
            const z = pos.getZ(i);
            if (Math.abs(z - minZ) < 0.05 || Math.abs(z - maxZ) < 0.05) {
                const u = 0.02 + ((pos.getX(i) - sMinX) / rangeX) * 0.96;
                const v = 0.02 + ((pos.getY(i) - sMinY) / rangeY) * 0.96;
                uv.setXY(i, u, v);
            } else {
                uv.setXY(i, 0.005, 0.005);
            }
        }
        uv.needsUpdate = true;
    }

    return geo;
}

function buildChampionStandeeGeometry(type) {
    const pedestal = buildPedestalGeometry(type);
    const rimColor = type === 'lol_garen' ? 0xffd700 : (type === 'lol_yasuo' ? 0xb0bec5 : 0x8d6e63);
    const pts = FIGURINE_OUTLINES[type];
    if (!pts) return pedestal;
    const figure = buildFigureGeo(pts, rimColor, 5);
    const merged = mergeBufferGeometries([pedestal, figure]);
    return merged;
}

function buildGeo(type, p = {}) {
    const s = APP.presetSize;
    switch (type) {
        case 'box':
            return { geo: new THREE.BoxGeometry(p.w||s, p.h||s, p.d||s, cap(p.segW,1,64,Math.round((p.w||s)/5)), cap(p.segH,1,64,Math.round((p.h||s)/5)), cap(p.segD,1,64,Math.round((p.d||s)/5))), params:{ w:p.w||s, h:p.h||s, d:p.d||s } };
        case 'cylinder':
            return { geo: new THREE.CylinderGeometry(p.r||s/2, p.r||s/2, p.h||s, p.seg||48), params:{ r:p.r||s/2, h:p.h||s, seg:p.seg||48 } };
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
            const geo = buildObjectStandeeGeometry('mannequin');
            return { geo: geo, params: {} };
        }
        case 'tree': {
            const trunkGeo = new THREE.CylinderGeometry(s/10, s/10, s/2, 8); trunkGeo.translate(0, s/4, 0);
            const leaves1 = new THREE.ConeGeometry(s/2, s*0.6, 8); leaves1.translate(0, s*0.6, 0);
            const leaves2 = new THREE.ConeGeometry(s*0.38, s*0.5, 8); leaves2.translate(0, s*0.95, 0);
            const leaves3 = new THREE.ConeGeometry(s*0.25, s*0.4, 8); leaves3.translate(0, s*1.25, 0);
            const merged = mergeBufferGeometries([trunkGeo, leaves1, leaves2, leaves3]);
            return { geo: merged || trunkGeo, params: {} };
        }
        case 'stairs': {
            const geo = buildObjectStandeeGeometry('stairs');
            return { geo: geo, params: {} };
        }
        case 'wall': {
            const geo = buildObjectStandeeGeometry('wall');
            return { geo: geo, params: {} };
        }
        case 'house': {
            const geo = buildObjectStandeeGeometry('house');
            return { geo: geo, params: {} };
        }
        case 'sword': {
            const geo = buildObjectStandeeGeometry('sword');
            return { geo: geo, params: {} };
        }
        case 'tower': {
            const geo = buildObjectStandeeGeometry('tower');
            return { geo: geo, params: {} };
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
            const geo = buildObjectStandeeGeometry('shield');
            return { geo: geo, params: {} };
        }
        case 'chest': {
            const geo = buildObjectStandeeGeometry('chest');
            return { geo: geo, params: {} };
        }
        case 'barrel': {
            const geo = buildObjectStandeeGeometry('barrel');
            return { geo: geo, params: {} };
        }
        case 'bridge': {
            const geo = buildObjectStandeeGeometry('bridge');
            return { geo: geo, params: {} };
        }
        case 'fence': {
            const geo = buildObjectStandeeGeometry('fence');
            return { geo: geo, params: {} };
        }
        case 'well': {
            const geo = buildObjectStandeeGeometry('well');
            return { geo: geo, params: {} };
        }
        case 'campfire': {
            const log1 = new THREE.BoxGeometry(s*0.6, s/10, s/10); log1.rotateY(0); log1.rotateZ(0.1); log1.translate(0, s/20, 0);
            const log2 = new THREE.BoxGeometry(s*0.6, s/10, s/10); log2.rotateY(Math.PI*2/3); log2.rotateZ(0.1); log2.translate(0, s/20, 0);
            const log3 = new THREE.BoxGeometry(s*0.6, s/10, s/10); log3.rotateY(-Math.PI*2/3); log3.rotateZ(0.1); log3.translate(0, s/20, 0);
            const flame = new THREE.ConeGeometry(s/5, s*0.4, 6); flame.translate(0, s*0.25, 0);
            const merged = mergeBufferGeometries([log1, log2, log3, flame]);
            return { geo: merged || flame, params: {} };
        }
        case 'tent': {
            const geo = buildObjectStandeeGeometry('tent');
            return { geo: geo, params: {} };
        }
        case 'windmill': {
            const geo = buildObjectStandeeGeometry('windmill');
            return { geo: geo, params: {} };
        }
        case 'knight':
        case 'wizard':
        case 'cyborg':
        case 'ninja':
        case 'ranger':
        case 'slime':
        case 'golem':
        case 'beholder':
        case 'dragon': {
            const geo = buildObjectStandeeGeometry(type);
            return { geo: geo, params: {} };
        }
        case 'boat': {
            const geo = buildObjectStandeeGeometry('boat');
            return { geo: geo, params: {} };
        }
        case 'crystal': {
            const top = new THREE.ConeGeometry(s/4, s*0.5, 6); top.translate(0, s*0.25, 0);
            const bottom = new THREE.ConeGeometry(s/4, s*0.5, 6); bottom.rotateX(Math.PI); bottom.translate(0, -s*0.25, 0);
            const merged = mergeBufferGeometries([top, bottom]);
            merged.translate(0, s*0.5, 0);
            return { geo: merged || top, params: {} };
        }
        case 'pillar': {
            const geo = buildObjectStandeeGeometry('pillar');
            return { geo: geo, params: {} };
        }
        case 'flag': {
            const geo = buildObjectStandeeGeometry('flag');
            return { geo: geo, params: {} };
        }
        case 'gravestone': {
            const geo = buildObjectStandeeGeometry('gravestone');
            return { geo: geo, params: {} };
        }
        case 'castle': {
            const geo = buildObjectStandeeGeometry('castle');
            return { geo: geo, params: {} };
        }
        case 'lighthouse': {
            const geo = buildObjectStandeeGeometry('lighthouse');
            return { geo: geo, params: {} };
        }
        case 'pine': {
            const trunk = new THREE.CylinderGeometry(s/12, s/10, s/3, 8); trunk.translate(0, s/6, 0);
            const leaves1 = new THREE.ConeGeometry(s*0.45, s*0.4, 8); leaves1.translate(0, s*0.45, 0);
            const leaves2 = new THREE.ConeGeometry(s*0.35, s*0.35, 8); leaves2.translate(0, s*0.75, 0);
            const leaves3 = new THREE.ConeGeometry(s*0.25, s*0.3, 8); leaves3.translate(0, s*1.0, 0);
            const merged = mergeBufferGeometries([trunk, leaves1, leaves2, leaves3]);
            return { geo: merged || trunk, params: {} };
        }
        case 'mushroom': {
            const stalk = new THREE.CylinderGeometry(s*0.08, s*0.12, s*0.4, 8); stalk.translate(0, s*0.2, 0);
            const cap = new THREE.SphereGeometry(s*0.25, 8, 8, 0, Math.PI*2, 0, Math.PI/2); cap.translate(0, s*0.4, 0);
            const merged = mergeBufferGeometries([stalk, cap]);
            return { geo: merged || stalk, params: {} };
        }
        case 'cannon': {
            const geo = buildObjectStandeeGeometry('cannon');
            return { geo: geo, params: {} };
        }
        case 'ruins': {
            const geo = buildObjectStandeeGeometry('ruins');
            return { geo: geo, params: {} };
        }
        case 'cabin': {
            const geo = buildObjectStandeeGeometry('cabin');
            return { geo: geo, params: {} };
        }
        case 'portal': {
            const geo = buildObjectStandeeGeometry('portal');
            return { geo: geo, params: {} };
        }
        case 'cactus': {
            const trunk = new THREE.CylinderGeometry(s*0.06, s*0.08, s*0.85, 6); trunk.translate(0, s*0.425, 0);
            const armL1 = new THREE.CylinderGeometry(s*0.05, s*0.05, s*0.2, 5); armL1.rotateZ(Math.PI/2); armL1.translate(-s*0.15, s*0.35, 0);
            const armL2 = new THREE.CylinderGeometry(s*0.05, s*0.05, s*0.35, 5); armL2.translate(-s*0.25, s*0.5, 0);
            const armR1 = new THREE.CylinderGeometry(s*0.05, s*0.05, s*0.2, 5); armR1.rotateZ(-Math.PI/2); armR1.translate(s*0.15, s*0.55, 0);
            const armR2 = new THREE.CylinderGeometry(s*0.05, s*0.05, s*0.25, 5); armR2.translate(s*0.25, s*0.65, 0);
            const merged = mergeBufferGeometries([trunk, armL1, armL2, armR1, armR2]);
            return { geo: merged || trunk, params: {} };
        }
        case 'cloud': {
            const s1 = new THREE.SphereGeometry(s*0.22, 6, 6); s1.translate(0, s*0.4, 0);
            const s2 = new THREE.SphereGeometry(s*0.17, 6, 6); s2.translate(-s*0.24, s*0.34, 0);
            const s3 = new THREE.SphereGeometry(s*0.18, 6, 6); s3.translate(s*0.24, s*0.36, 0);
            const s4 = new THREE.SphereGeometry(s*0.14, 6, 6); s4.translate(0, s*0.52, -s*0.05);
            const merged = mergeBufferGeometries([s1, s2, s3, s4]);
            return { geo: merged || s1, params: {} };
        }
        case 'flower': {
            const stem = new THREE.CylinderGeometry(s*0.02, s*0.02, s*0.7, 5); stem.translate(0, s*0.35, 0);
            const center = new THREE.CylinderGeometry(s*0.1, s*0.1, s*0.05, 6); center.rotateX(0.3); center.translate(0, s*0.72, 0);
            const petals = [];
            for (let i = 0; i < 5; i++) {
                const angle = (i * Math.PI * 2) / 5;
                const pet = new THREE.SphereGeometry(s*0.08, 4, 4);
                pet.scale(1.2, 0.4, 1.2);
                pet.translate(Math.cos(angle)*s*0.14, s*0.72, Math.sin(angle)*s*0.14);
                petals.push(pet);
            }
            const merged = mergeBufferGeometries([stem, center, ...petals]);
            return { geo: merged || center, params: {} };
        }
        case 'crate': {
            const geo = buildObjectStandeeGeometry('crate');
            return { geo: geo, params: {} };
        }
        case 'anvil': {
            const geo = buildObjectStandeeGeometry('anvil');
            return { geo: geo, params: {} };
        }
        case 'wagon': {
            const geo = buildObjectStandeeGeometry('wagon');
            return { geo: geo, params: {} };
        }
        case 'torch': {
            const geo = buildObjectStandeeGeometry('torch');
            return { geo: geo, params: {} };
        }
        case 'lantern': {
            const geo = buildObjectStandeeGeometry('lantern');
            return { geo: geo, params: {} };
        }

        case 'road_straight': {
            const road = new THREE.BoxGeometry(8, 0.3, s); colorGeometry(road, 0x2b2b2b);
            const curbL = new THREE.BoxGeometry(0.8, 0.6, s); curbL.translate(-4.4, 0.15, 0); colorGeometry(curbL, 0x9e9e9e);
            const curbR = new THREE.BoxGeometry(0.8, 0.6, s); curbR.translate(4.4, 0.15, 0); colorGeometry(curbR, 0x9e9e9e);
            const dashes = [];
            const dashLength = s / 5;
            for (let i = -2; i <= 2; i += 2) {
                const dash = new THREE.BoxGeometry(0.25, 0.33, dashLength);
                dash.translate(0, 0.02, i * (s / 4));
                colorGeometry(dash, 0xffeb3b);
                dashes.push(dash);
            }
            const merged = mergeBufferGeometries([road, curbL, curbR, ...dashes]);
            merged.translate(0, 0.15, 0);
            return { geo: merged || road, params: {} };
        }
        case 'road_curve': {
            const segments = [];
            const steps = 6;
            const r = s * 0.75;
            const w = 8;
            const angleStep = Math.PI / 2 / steps;
            for (let i = 0; i < steps; i++) {
                const a = i * angleStep;
                const nextA = (i + 1) * angleStep;
                const midA = (a + nextA) / 2;
                const len = r * angleStep * 1.05;
                const roadSeg = new THREE.BoxGeometry(w, 0.3, len); colorGeometry(roadSeg, 0x2b2b2b);
                const curbL = new THREE.BoxGeometry(0.8, 0.6, len); curbL.translate(-w/2 - 0.4, 0.15, 0); colorGeometry(curbL, 0x9e9e9e);
                const curbR = new THREE.BoxGeometry(0.8, 0.6, len); curbR.translate(w/2 + 0.4, 0.15, 0); colorGeometry(curbR, 0x9e9e9e);
                const dash = new THREE.BoxGeometry(0.25, 0.33, len * 0.5); dash.translate(0, 0.02, 0); colorGeometry(dash, 0xffeb3b);
                const segMerged = mergeBufferGeometries([roadSeg, curbL, curbR, dash]);
                const px = Math.cos(midA) * r - r/2;
                const pz = Math.sin(midA) * r - r/2;
                segMerged.rotateY(-midA);
                segMerged.translate(px, 0.15, pz);
                segments.push(segMerged);
            }
            const merged = mergeBufferGeometries(segments);
            return { geo: merged, params: {} };
        }
        case 'road_t_junction': {
            const mainRoad = new THREE.BoxGeometry(8, 0.3, s); colorGeometry(mainRoad, 0x2b2b2b);
            const sideRoad = new THREE.BoxGeometry(s/2, 0.3, 8); sideRoad.translate(s/4 + 4, 0, 0); colorGeometry(sideRoad, 0x2b2b2b);
            const curbLeft = new THREE.BoxGeometry(0.8, 0.6, s); curbLeft.translate(-4.4, 0.15, 0); colorGeometry(curbLeft, 0x9e9e9e);
            const curbRight1 = new THREE.BoxGeometry(0.8, 0.6, s/2 - 4); curbRight1.translate(4.4, 0.15, -s/4 - 2); colorGeometry(curbRight1, 0x9e9e9e);
            const curbRight2 = new THREE.BoxGeometry(0.8, 0.6, s/2 - 4); curbRight2.translate(4.4, 0.15, s/4 + 2); colorGeometry(curbRight2, 0x9e9e9e);
            const curbSide1 = new THREE.BoxGeometry(s/2 - 4, 0.6, 0.8); curbSide1.translate(s/4 + 2, 0.15, -4.4); colorGeometry(curbSide1, 0x9e9e9e);
            const curbSide2 = new THREE.BoxGeometry(s/2 - 4, 0.6, 0.8); curbSide2.translate(s/4 + 2, 0.15, 4.4); colorGeometry(curbSide2, 0x9e9e9e);
            const dashes = [];
            for (let i = -1.5; i <= 1.5; i += 3) {
                if (i !== 0) {
                    const dash = new THREE.BoxGeometry(0.25, 0.33, s/4);
                    dash.translate(0, 0.02, i * (s/4));
                    colorGeometry(dash, 0xffeb3b);
                    dashes.push(dash);
                }
            }
            const sideDash = new THREE.BoxGeometry(s/4, 0.33, 0.25); sideDash.translate(s/4 + 2, 0.02, 0); colorGeometry(sideDash, 0xffeb3b);
            dashes.push(sideDash);
            const merged = mergeBufferGeometries([mainRoad, sideRoad, curbLeft, curbRight1, curbRight2, curbSide1, curbSide2, ...dashes]);
            merged.translate(0, 0.15, 0);
            return { geo: merged, params: {} };
        }
        case 'road_crossroad': {
            const roadNS = new THREE.BoxGeometry(8, 0.3, s); colorGeometry(roadNS, 0x2b2b2b);
            const roadEW = new THREE.BoxGeometry(s, 0.3, 8); colorGeometry(roadEW, 0x2b2b2b);
            const curb1 = new THREE.BoxGeometry(0.8, 0.6, s/2 - 4); curb1.translate(-4.4, 0.15, -s/4 - 2); colorGeometry(curb1, 0x9e9e9e);
            const curb2 = new THREE.BoxGeometry(0.8, 0.6, s/2 - 4); curb2.translate(-4.4, 0.15, s/4 + 2); colorGeometry(curb2, 0x9e9e9e);
            const curb3 = new THREE.BoxGeometry(0.8, 0.6, s/2 - 4); curb3.translate(4.4, 0.15, -s/4 - 2); colorGeometry(curb3, 0x9e9e9e);
            const curb4 = new THREE.BoxGeometry(0.8, 0.6, s/2 - 4); curb4.translate(4.4, 0.15, s/4 + 2); colorGeometry(curb4, 0x9e9e9e);
            const curb5 = new THREE.BoxGeometry(s/2 - 4, 0.6, 0.8); curb5.translate(-s/4 - 2, 0.15, -4.4); colorGeometry(curb5, 0x9e9e9e);
            const curb6 = new THREE.BoxGeometry(s/2 - 4, 0.6, 0.8); curb6.translate(-s/4 - 2, 0.15, 4.4); colorGeometry(curb6, 0x9e9e9e);
            const curb7 = new THREE.BoxGeometry(s/2 - 4, 0.6, 0.8); curb7.translate(s/4 + 2, 0.15, -4.4); colorGeometry(curb7, 0x9e9e9e);
            const curb8 = new THREE.BoxGeometry(s/2 - 4, 0.6, 0.8); curb8.translate(s/4 + 2, 0.15, 4.4); colorGeometry(curb8, 0x9e9e9e);
            const dashes = [];
            const d1 = new THREE.BoxGeometry(0.25, 0.33, s/4); d1.translate(0, 0.02, -s/3); colorGeometry(d1, 0xffeb3b); dashes.push(d1);
            const d2 = new THREE.BoxGeometry(0.25, 0.33, s/4); d2.translate(0, 0.02, s/3); colorGeometry(d2, 0xffeb3b); dashes.push(d2);
            const d3 = new THREE.BoxGeometry(s/4, 0.33, 0.25); d3.translate(-s/3, 0.02, 0); colorGeometry(d3, 0xffeb3b); dashes.push(d3);
            const d4 = new THREE.BoxGeometry(s/4, 0.33, 0.25); d4.translate(s/3, 0.02, 0); colorGeometry(d4, 0xffeb3b); dashes.push(d4);
            const merged = mergeBufferGeometries([roadNS, roadEW, curb1, curb2, curb3, curb4, curb5, curb6, curb7, curb8, ...dashes]);
            merged.translate(0, 0.15, 0);
            return { geo: merged, params: {} };
        }
        case 'road_bridge': {
            const road = new THREE.BoxGeometry(8, 0.3, s); road.translate(0, s/3, 0); colorGeometry(road, 0x2b2b2b);
            const curbL = new THREE.BoxGeometry(0.8, 0.6, s); curbL.translate(-4.4, s/3 + 0.15, 0); colorGeometry(curbL, 0x9e9e9e);
            const curbR = new THREE.BoxGeometry(0.8, 0.6, s); curbR.translate(4.4, s/3 + 0.15, 0); colorGeometry(curbR, 0x9e9e9e);
            const pil1 = new THREE.BoxGeometry(8, s/3, 2); pil1.translate(0, s/6, -s*0.3); colorGeometry(pil1, 0xcccccc);
            const pil2 = new THREE.BoxGeometry(8, s/3, 2); pil2.translate(0, s/6, s*0.3); colorGeometry(pil2, 0xcccccc);
            const merged = mergeBufferGeometries([road, curbL, curbR, pil1, pil2]);
            return { geo: merged, params: {} };
        }
        case 'karambit': {
            const wVal = p.w !== undefined ? p.w : 70;
            const hVal = p.h !== undefined ? p.h : 80;
            const tVal = p.t !== undefined ? p.t : 8;
            const skinVal = p.skin !== undefined ? p.skin : 'classic';
            
            const handleScale = hVal / 80;
            const bladeScale = wVal / 70;
            
            const parts = [];
            
            // 1. Blade Shape - hawkbill claw profile
            const bladeShape = new THREE.Shape();
            bladeShape.moveTo(-12 * bladeScale, 8 * bladeScale);
            bladeShape.quadraticCurveTo(-38 * bladeScale, 20 * bladeScale, -68 * bladeScale, -22 * bladeScale);
            bladeShape.quadraticCurveTo(-34 * bladeScale, -12 * bladeScale, -8 * bladeScale, -8 * bladeScale);
            bladeShape.closePath();
            
            const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, {
                depth: tVal * 0.35,
                bevelEnabled: true,
                bevelThickness: 1.2,
                bevelSize: 0.5,
                bevelSegments: 4
            });
            bladeGeo.translate(0, 0, -tVal * 0.175);
            colorGeometrySkin(bladeGeo, skinVal, 0x00b0ff, 'x'); // Default is anodized blue
            parts.push(bladeGeo);
            
            // Blood Groove / Fuller (aesthetic contrast)
            const grooveShape = new THREE.Shape();
            grooveShape.moveTo(-18 * bladeScale, 4 * bladeScale);
            grooveShape.quadraticCurveTo(-36 * bladeScale, 12 * bladeScale, -56 * bladeScale, -12 * bladeScale);
            grooveShape.quadraticCurveTo(-36 * bladeScale, -2 * bladeScale, -18 * bladeScale, 0);
            grooveShape.closePath();
            
            const grooveL = new THREE.ExtrudeGeometry(grooveShape, { depth: tVal * 0.05, bevelEnabled: false });
            grooveL.translate(0, 0, tVal * 0.185);
            colorGeometry(grooveL, 0x111111);
            parts.push(grooveL);
            
            const grooveR = grooveL.clone().translate(0, 0, -tVal * 0.37 - tVal * 0.05);
            colorGeometry(grooveR, 0x111111);
            parts.push(grooveR);
            
            // Safety finger ring (blue anodized steel)
            const ringR = 12 * handleScale;
            const ringTube = tVal * 0.28;
            const ring = new THREE.TorusGeometry(ringR, ringTube, 12, 32);
            ring.translate(52 * handleScale, -4 * handleScale, 0);
            colorGeometrySkin(ring, skinVal, 0x00b0ff, 'x');
            parts.push(ring);
            
            // Triangular steel connection and peak on the ring
            const connector = new THREE.BoxGeometry(16 * handleScale, 8 * handleScale, tVal * 0.35);
            connector.translate(40 * handleScale, -4 * handleScale, 0);
            colorGeometrySkin(connector, skinVal, 0x00b0ff, 'x');
            parts.push(connector);
            
            const peak = new THREE.ConeGeometry(4 * handleScale, 8 * handleScale, 4);
            peak.rotateZ(2.2);
            peak.translate(62 * handleScale, -12 * handleScale, 0);
            colorGeometrySkin(peak, skinVal, 0x00b0ff, 'x');
            parts.push(peak);
            
            // 2. Ergonomic Handle Scales (Left and Right)
            const handleShape = new THREE.Shape();
            handleShape.moveTo(-10 * handleScale, 12 * handleScale);
            handleShape.quadraticCurveTo(15 * handleScale, 14 * handleScale, 45 * handleScale, 8 * handleScale);
            handleShape.lineTo(44 * handleScale, -10 * handleScale);
            handleShape.quadraticCurveTo(34 * handleScale, -4 * handleScale, 26 * handleScale, -11 * handleScale);
            handleShape.quadraticCurveTo(18 * handleScale, -3 * handleScale, 10 * handleScale, -10 * handleScale);
            handleShape.quadraticCurveTo(1 * handleScale, -3 * handleScale, -8 * handleScale, -8 * handleScale);
            handleShape.closePath();
            
            const handleL = new THREE.ExtrudeGeometry(handleShape, {
                depth: tVal * 0.3,
                bevelEnabled: true,
                bevelThickness: 0.8,
                bevelSize: 0.35,
                bevelSegments: 3
            });
            handleL.translate(0, 0, tVal * 0.22);
            
            let handleColor = 0x1a1a1a;
            if (skinVal === 'asiimov') handleColor = 0xeeeeee;
            else if (skinVal === 'lore') handleColor = 0x1b5e20;
            else if (skinVal === 'fade') handleColor = 0x2e0854;
            
            colorGeometry(handleL, handleColor);
            parts.push(handleL);
            
            const handleR = handleL.clone().translate(0, 0, -tVal * 0.44);
            colorGeometry(handleR, handleColor);
            parts.push(handleR);
            
            // Jimping ridges on the top spine of the handle scales
            const jimpColor = (skinVal === 'asiimov') ? 0xff5722 : ((skinVal === 'lore') ? 0xffd700 : 0x1a1a1a);
            for (let i = 0; i < 5; i++) {
                const rx = (28 + i * 3) * handleScale;
                const ry = (11 - i * 0.6) * handleScale;
                const ridge = new THREE.BoxGeometry(1.2 * handleScale, 2 * handleScale, tVal * 1.05);
                ridge.translate(rx, ry, 0);
                colorGeometry(ridge, jimpColor);
                parts.push(ridge);
            }
            
            // Rivets in handle
            const rivetColor = (skinVal === 'lore' || skinVal === 'tiger') ? 0xffd700 : 0xb0bec5;
            const rivets = [
                [8 * handleScale, -7 * handleScale],
                [26 * handleScale, -4 * handleScale],
                [42 * handleScale, -1 * handleScale]
            ];
            rivets.forEach(c => {
                const rivet = new THREE.CylinderGeometry(1.8 * handleScale, 1.8 * handleScale, tVal * 1.08, 8);
                rivet.rotateX(Math.PI / 2);
                rivet.translate(c[0], c[1], 0);
                colorGeometry(rivet, rivetColor);
                parts.push(rivet);
            });
            
            const merged = mergeBufferGeometries(parts);
            merged.rotateX(-Math.PI / 2);
            return { geo: merged, params: { w: wVal, h: hVal, t: tVal, skin: skinVal } };
        }
        case 'kelebek': {
            const wVal = p.w !== undefined ? p.w : 85;
            const hVal = p.h !== undefined ? p.h : 95;
            const tVal = p.t !== undefined ? p.t : 7;
            const skinVal = p.skin !== undefined ? p.skin : 'classic';
            
            const parts = [];
            const bladeScale = wVal / 85;
            const handleScale = hVal / 95;
            
            // 1. Blade Shape - Bowie Clip Point Balisong Style
            const bladeShape = new THREE.Shape();
            bladeShape.moveTo(-5, -6);
            bladeShape.lineTo(5, -6);
            bladeShape.lineTo(6, 2); // Kick stop
            bladeShape.lineTo(5, 12);
            bladeShape.quadraticCurveTo(8 * bladeScale, wVal * 0.4, 16 * bladeScale, wVal * 0.74);
            bladeShape.lineTo(26 * bladeScale, wVal - 2); // Needle Tip
            bladeShape.quadraticCurveTo(12 * bladeScale, wVal - 16, 6 * bladeScale, wVal - 26);
            bladeShape.lineTo(-1, 12);
            bladeShape.lineTo(-5, -6);
            bladeShape.closePath();
            
            const bladeGeo = new THREE.ExtrudeGeometry(bladeShape, { 
                depth: tVal * 0.35, 
                bevelEnabled: true, 
                bevelThickness: 0.8, 
                bevelSize: 0.25, 
                bevelSegments: 3 
            });
            bladeGeo.translate(0, 0, -tVal * 0.175);
            colorGeometrySkin(bladeGeo, skinVal, 0xffd700, 'y'); // Default gold
            parts.push(bladeGeo);
            
            // Fuller overlay on blade
            const kGrooveShape = new THREE.Shape();
            kGrooveShape.moveTo(2, 16);
            kGrooveShape.lineTo(4, 16);
            kGrooveShape.quadraticCurveTo(8 * bladeScale, wVal * 0.4, 12 * bladeScale, wVal * 0.7);
            kGrooveShape.lineTo(10 * bladeScale, wVal * 0.7);
            kGrooveShape.quadraticCurveTo(6 * bladeScale, wVal * 0.4, 1, 16);
            kGrooveShape.closePath();
            
            const kGrooveL = new THREE.ExtrudeGeometry(kGrooveShape, { depth: tVal * 0.05, bevelEnabled: false });
            kGrooveL.translate(0, 0, tVal * 0.18);
            colorGeometry(kGrooveL, 0x212121);
            parts.push(kGrooveL);
            
            const kGrooveR = kGrooveL.clone().translate(0, 0, -tVal * 0.36 - tVal * 0.05);
            colorGeometry(kGrooveR, 0x212121);
            parts.push(kGrooveR);
            
            // Lore pattern stars
            if (skinVal === 'classic' || skinVal === 'lore') {
                const starColor = skinVal === 'lore' ? 0x1b5e20 : 0x8d6e63;
                for (let i = 0; i < 3; i++) {
                    const starY = 25 + i * 15;
                    const starX = (6 + i * 2.5) * bladeScale;
                    const star = new THREE.BoxGeometry(2, 2, tVal * 0.38);
                    star.rotateZ(Math.PI / 4);
                    star.translate(starX, starY, 0);
                    colorGeometry(star, starColor);
                    parts.push(star);
                }
            }
            
            // Tang pin
            const tangPinColor = (skinVal === 'lore') ? 0xffd700 : 0xffb300;
            const tangPin = new THREE.CylinderGeometry(1.2, 1.2, tVal * 1.15, 8);
            tangPin.rotateX(Math.PI / 2);
            tangPin.translate(0, 5, 0);
            colorGeometry(tangPin, tangPinColor);
            parts.push(tangPin);

            // 2. Handles with Skeletonized weight-reduction circles
            const handleW = 7.5;
            const handleGapX = 6.2;
            
            const scaleShape = new THREE.Shape();
            scaleShape.moveTo(-handleW / 2, 4);
            scaleShape.lineTo(handleW / 2, 4);
            scaleShape.quadraticCurveTo(handleW / 2 + 5, -hVal * 0.5, handleW / 2 - 8, -hVal);
            scaleShape.lineTo(-handleW / 2 - 8, -hVal);
            scaleShape.quadraticCurveTo(-handleW / 2 + 5, -hVal * 0.5, -handleW / 2, 4);
            scaleShape.closePath();
            
            // Add holes
            for (let i = 0; i < 4; i++) {
                const t = (i + 1) / 5;
                const holeY = -4 - t * (hVal - 8);
                const holeX = -8 * t;
                const holePath = new THREE.Path();
                holePath.absarc(holeX, holeY, 2.0, 0, Math.PI * 2, true);
                scaleShape.holes.push(holePath);
            }
            
            let handleColor = 0x3c5e2d;
            let woodColor = 0xcd853f;
            let linerColor = 0x90a4ae;
            
            if (skinVal === 'fade') { handleColor = 0x111111; woodColor = 0xff1744; }
            else if (skinVal === 'crimson') { handleColor = 0x212121; woodColor = 0xb71c1c; }
            else if (skinVal === 'tiger') { handleColor = 0xff9100; woodColor = 0x212121; }
            else if (skinVal === 'damascus') { handleColor = 0x424242; woodColor = 0xd0d0d0; }
            else if (skinVal === 'asiimov') { handleColor = 0xeeeeee; woodColor = 0xff5722; linerColor = 0x212121; }
            else if (skinVal === 'lore') { handleColor = 0x1b5e20; woodColor = 0xffd700; }
            
            // Safe handle
            const scaleL_Out = new THREE.ExtrudeGeometry(scaleShape, {
                depth: tVal * 0.22,
                bevelEnabled: true,
                bevelThickness: 0.4,
                bevelSize: 0.15,
                bevelSegments: 2
            });
            scaleL_Out.translate(-handleGapX, 0, tVal * 0.32);
            colorGeometry(scaleL_Out, handleColor);
            parts.push(scaleL_Out);
            
            const scaleL_In = new THREE.ExtrudeGeometry(scaleShape, {
                depth: tVal * 0.18,
                bevelEnabled: false
            });
            scaleL_In.translate(-handleGapX, 0, tVal * 0.08);
            colorGeometry(scaleL_In, linerColor);
            parts.push(scaleL_In);
            
            const scaleL_In_Mirror = scaleL_In.clone().translate(0, 0, -tVal * 0.34);
            colorGeometry(scaleL_In_Mirror, linerColor);
            parts.push(scaleL_In_Mirror);
            
            const scaleL_Out_Mirror = scaleL_Out.clone().translate(0, 0, -tVal * 0.86);
            colorGeometry(scaleL_Out_Mirror, handleColor);
            parts.push(scaleL_Out_Mirror);
            
            // Bite handle
            const scaleR_Out = scaleL_Out.clone().translate(handleGapX * 2, 0, 0);
            colorGeometry(scaleR_Out, handleColor);
            parts.push(scaleR_Out);
            
            const scaleR_In = scaleL_In.clone().translate(handleGapX * 2, 0, 0);
            colorGeometry(scaleR_In, linerColor);
            parts.push(scaleR_In);
            
            const scaleR_In_Mirror = scaleL_In_Mirror.clone().translate(handleGapX * 2, 0, 0);
            colorGeometry(scaleR_In_Mirror, linerColor);
            parts.push(scaleR_In_Mirror);
            
            const scaleR_Out_Mirror = scaleL_Out_Mirror.clone().translate(handleGapX * 2, 0, 0);
            colorGeometry(scaleR_Out_Mirror, handleColor);
            parts.push(scaleR_Out_Mirror);
            
            // Inlays
            const inlayWoodShape = new THREE.Shape();
            inlayWoodShape.moveTo(-handleW / 4, -10);
            inlayWoodShape.lineTo(handleW / 4, -10);
            inlayWoodShape.quadraticCurveTo(handleW / 4 + 4, -hVal * 0.5, handleW / 4 - 6, -hVal + 10);
            inlayWoodShape.lineTo(-handleW / 4 - 6, -hVal + 10);
            inlayWoodShape.quadraticCurveTo(-handleW / 4 + 4, -hVal * 0.5, -handleW / 4, -10);
            inlayWoodShape.closePath();
            
            const wood = new THREE.ExtrudeGeometry(inlayWoodShape, {
                depth: tVal * 0.06,
                bevelEnabled: true,
                bevelThickness: 0.1,
                bevelSize: 0.05,
                bevelSegments: 1
            });
            const woodL_Out = wood.clone().translate(-handleGapX, 0, tVal * 0.32 + tVal * 0.22);
            colorGeometry(woodL_Out, woodColor);
            parts.push(woodL_Out);
            
            const woodL_In = wood.clone().translate(-handleGapX, 0, -tVal * 0.86 - tVal * 0.06);
            colorGeometry(woodL_In, woodColor);
            parts.push(woodL_In);
            
            const woodR_Out = wood.clone().translate(handleGapX, 0, tVal * 0.32 + tVal * 0.22);
            colorGeometry(woodR_Out, woodColor);
            parts.push(woodR_Out);
            
            const woodR_In = wood.clone().translate(handleGapX, 0, -tVal * 0.86 - tVal * 0.06);
            colorGeometry(woodR_In, woodColor);
            parts.push(woodR_In);
            
            // Pivots
            const pivotL = new THREE.CylinderGeometry(1.2, 1.2, tVal * 1.15, 10);
            pivotL.rotateX(Math.PI / 2);
            pivotL.translate(-handleGapX, 0, 0);
            colorGeometry(pivotL, 0xb0bec5);
            parts.push(pivotL);
            
            const pivotR = new THREE.CylinderGeometry(1.2, 1.2, tVal * 1.15, 10);
            pivotR.rotateX(Math.PI / 2);
            pivotR.translate(handleGapX, 0, 0);
            colorGeometry(pivotR, 0xb0bec5);
            parts.push(pivotR);
            
            // Latch
            const latchBar = new THREE.BoxGeometry(2.5, 15, tVal * 0.3);
            latchBar.translate(handleGapX - 4, -hVal - 4, 0);
            colorGeometry(latchBar, 0x78909c);
            parts.push(latchBar);
            
            const latchPin = new THREE.CylinderGeometry(0.8, 0.8, tVal * 1.1, 8);
            latchPin.rotateX(Math.PI / 2);
            latchPin.translate(handleGapX - 4, -hVal, 0);
            colorGeometry(latchPin, 0xb0bec5);
            parts.push(latchPin);
            
            const merged = mergeBufferGeometries(parts);
            merged.rotateX(-Math.PI / 2);
            return { geo: merged, params: { w: wVal, h: hVal, t: tVal, skin: skinVal } };
        }
        case 'lol_yasuo': {
            const geo = buildChampionStandeeGeometry('lol_yasuo');
            return { geo: geo, params: {} };
        }
        case 'lol_teemo': {
            const geo = buildChampionStandeeGeometry('lol_teemo');
            return { geo: geo, params: {} };
        }
        case 'lol_garen': {
            const geo = buildChampionStandeeGeometry('lol_garen');
            return { geo: geo, params: {} };
        }
        default:
            return { geo: new THREE.BoxGeometry(s,s,s), params:{ w:s, h:s, d:s } };
    }
}



function mergeBufferGeometries(geos) {
    let hasIndex = false;
    let hasNoIndex = false;
    geos.forEach(g => {
        if (g.index) hasIndex = true;
        else hasNoIndex = true;
    });

    let processedGeos = geos;
    let needsDispose = false;
    if (hasIndex && hasNoIndex) {
        processedGeos = geos.map(g => g.index ? g.toNonIndexed() : g.clone());
        needsDispose = true;
    }

    try {
        if (typeof THREE.BufferGeometryUtils !== 'undefined' && THREE.BufferGeometryUtils.mergeBufferGeometries) {
            const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(processedGeos);
            if (needsDispose) {
                processedGeos.forEach(g => g.dispose());
            }
            if (merged) {
                merged.clearGroups(); // Clear groups to avoid multi-material rendering issues
                return merged;
            }
        }
    } catch (e) {
        console.error('BufferGeometryUtils failed, falling back to manual merge:', e);
    }

    if (needsDispose) {
        processedGeos.forEach(g => g.dispose());
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
    
    let defaultColor = info.color;
    
    const matParams = { metalness: 0.2, roughness: 0.8 };
    if (geo.attributes.color) {
        matParams.vertexColors = true;
        matParams.color = 0xffffff;
    } else {
        matParams.color = defaultColor;
    }
    const mat = new THREE.MeshStandardMaterial(matParams);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    // Seat on grid
    const bb = new THREE.Box3().setFromObject(mesh);
    mesh.position.y = -bb.min.y;
    mesh.userData = { id: uid(), type, name: `${info.label} ${APP.objects.length+1}`, params, visible:true, locked:false };
    applyChampionTexture(mesh);
    applyObjectTexture(mesh);
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
    if (mesh.userData.type === 'imported') {
        toast('âš  Ä°Ã§e aktarÄ±lan modellerin geometrisi yeniden oluÅŸturulamaz', 'warning', 2000);
        return;
    }
    const { geo } = buildGeo(mesh.userData.type, newParams);
    mesh.geometry.dispose(); mesh.geometry = geo;
    mesh.userData.params = { ...mesh.userData.params, ...newParams };
    mesh.userData.origPosition = null; // Reset original positions copy
    if (geo.attributes.color) {
        mesh.material.vertexColors = true;
        mesh.material.color.set(0xffffff);
    } else {
        mesh.material.vertexColors = false;
    }
    mesh.material.needsUpdate = true;
    

    
    rebuildWireEdges(mesh);
    refreshInspector(mesh); updateStats(); saveHist('geo');
}

/* ════════════════════════════════════════
   SELECTION
════════════════════════════════════════ */
function selectObj(obj) {
    if (APP.selected && APP.selected !== obj) dehighlight(APP.selected);
    APP.selected = obj;
    hideBrushHelper();
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
    const cv = APP.renderer.domElement;
    APP.mouse.x = ((e.clientX - rect.left)/rect.width)*2-1;
    APP.mouse.y = -((e.clientY - rect.top)/rect.height)*2+1;
    APP.raycaster.setFromCamera(APP.mouse, APP.camera);

    // Modeling tools (facePaint, extrudeFace)
    if (APP.selected && (APP.activeTool === 'facePaint' || APP.activeTool === 'extrudeFace')) {
        const hits = APP.raycaster.intersectObject(APP.selected);
        if (hits.length > 0) {
            const hit = hits[0];
            if (APP.activeTool === 'facePaint') {
                APP.orbit.enabled = false;
                APP.sculpting = true;
                APP.sculptPointerId = e.pointerId;
                try { cv.setPointerCapture(e.pointerId); } catch(err) {}
                APP.sculptChanged = false;
                applyFacePaint(hit);
                return;
            } 
            else if (APP.activeTool === 'extrudeFace') {
                const op = el('faceOpSelect')?.value || 'extrude';
                if (op === 'extrude') {
                    const depth = parseFloat(el('extrudeFaceDepth')?.value) || 5;
                    performFaceExtrude(APP.selected, hit.faceIndex, depth);
                    toast(`✓ Yüzey uzatıldı: +${depth}mm`, 'success', 1500);
                } else if (op === 'inset') {
                    const amount = parseFloat(el('extrudeFaceDepth')?.value) || 0.3;
                    performFaceInset(APP.selected, hit.faceIndex, amount);
                    toast(`✓ İçerlek yüzey oluşturuldu`, 'success', 1500);
                } else if (op === 'subdivide') {
                    performFaceSubdivide(APP.selected, hit.faceIndex);
                    toast(`✓ Yüzey alt bölümlere ayrıldı`, 'success', 1500);
                } else if (op === 'delete') {
                    performFaceDelete(APP.selected, hit.faceIndex);
                    toast(`✓ Yüzey silindi`, 'success', 1500);
                } else if (op === 'bevel') {
                    const depth = parseFloat(el('extrudeFaceDepth')?.value) || 2;
                    performFaceLocalBevel(APP.selected, hit.faceIndex, depth, 0.25);
                    toast(`✓ Lokal pah kırıldı`, 'success', 1500);
                } else if (op === 'smooth') {
                    performFaceLocalSmooth(APP.selected, hit.faceIndex, 0.5);
                    toast(`✓ Lokal yüzey yumuşatıldı`, 'success', 1500);
                }
                return;
            }
            return;
        }
    }

    // Magic Stitch Tool Handler
    if (APP.activeTool === 'magicStitch' && APP.selected) {
        const hits = APP.raycaster.intersectObject(APP.selected);
        if (hits.length > 0) {
            const hit = hits[0];
            const localHit = APP.selected.worldToLocal(hit.point.clone());
            const radius = (parseFloat(el('stitchRadius')?.value) || 20) / 5;
            const geo = APP.selected.geometry;
            const pos = geo.attributes.position;
            if (!pos) return;
            
            const nearbyVerts = [];
            for (let i = 0; i < pos.count; i++) {
                const v = new THREE.Vector3(pos.getX(i), pos.getY(i), pos.getZ(i));
                if (v.distanceTo(localHit) < radius) {
                    nearbyVerts.push(i);
                }
            }
            
            if (nearbyVerts.length === 0) {
                toast('⚠️ Bu bölgede tepe noktası bulunamadı. Yarıçapı artırın.', 'warning', 2000);
                return;
            }
            
            if (APP.magicStitch.pickingGroup === 'A') {
                APP.magicStitch.groupA = nearbyVerts;
                APP.magicStitch.pickingGroup = 'B';
                updateStitchPreview();
                toast(`✅ Grup A seçildi: ${nearbyVerts.length} vertex. Şimdi ikinci bölgeye tıklayın.`, 'success', 2500);
            } else {
                APP.magicStitch.groupB = nearbyVerts;
                APP.magicStitch.pickingGroup = 'A';
                updateStitchPreview();
                toast(`✅ Grup B seçildi: ${nearbyVerts.length} vertex. 🧵 Dikiş At butonuna basın veya başka bölge seçin.`, 'success', 2500);
            }
            return;
        }
    }

    // Conform Warp Tool Handler
    if (APP.activeTool === 'conformWarp' && APP.selected) {
        if (APP.conformWarp && APP.conformWarp.drawingCurve) {
            APP.orbit.enabled = false;
            APP.conformWarp.isDrawing = true;
            try { cv.setPointerCapture(e.pointerId); } catch(err) {}
            
            const planeNormal = new THREE.Vector3();
            APP.camera.getWorldDirection(planeNormal);
            planeNormal.negate();
            
            const center = new THREE.Vector3();
            const box = new THREE.Box3().setFromObject(APP.selected);
            box.getCenter(center);
            
            const planeConstant = -center.dot(planeNormal);
            APP.conformWarp.drawPlane = new THREE.Plane(planeNormal, planeConstant);
            
            const pt = new THREE.Vector3();
            APP.raycaster.ray.intersectPlane(APP.conformWarp.drawPlane, pt);
            APP.conformWarp.curvePoints = [pt];
            APP.conformWarp.curveNormals = [];
            
            updateConformCurvePreview();
            return;
        } else if (APP.conformWarp && APP.conformWarp.brushing) {
            let target = null;
            const targetId = el('conformTarget')?.value;
            if (targetId) {
                target = APP.objects.find(obj => obj.userData.id === targetId);
            }
            if (!target) {
                const otherObjects = APP.objects.filter(obj => obj !== APP.selected);
                const targetHits = APP.raycaster.intersectObjects(otherObjects, true);
                if (targetHits.length > 0) {
                    target = targetHits[0].object;
                }
            }
            
            if (target) {
                const hits = APP.raycaster.intersectObject(target, true);
                if (hits.length > 0) {
                    APP.orbit.enabled = false;
                    APP.conformWarp.isBrushing = true;
                    APP.conformWarp.brushTarget = target;
                    try { cv.setPointerCapture(e.pointerId); } catch(err) {}
                    
                    const hitPt = hits[0].point;
                    const hitNorm = hits[0].face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(target.matrixWorld)).normalize();
                    
                    APP.conformWarp.curvePoints = [hitPt];
                    APP.conformWarp.curveNormals = [hitNorm];
                    
                    updateConformCurvePreview();
                    
                    if (!APP.selected.userData.origPosition) {
                        const geo = APP.selected.geometry;
                        const pos = geo.attributes.position;
                        APP.selected.userData.origPosition = new Float32Array(pos.array);
                    }
                    return;
                }
            } else {
                toast('⚠️ Fırçalamak için alt tarafta hedef bir yüzey olmalı!', 'warning', 2500);
            }
        }
    }

    // Sculpt / Paint brush check
    const isBrushActive = APP.activeTool === 'paint' || APP.activeTool === 'sculpt' || APP.mode === 'edit';
    if (isBrushActive && APP.selected) {
        const hits = APP.raycaster.intersectObject(APP.selected);
        if (hits.length > 0) {
            APP.orbit.enabled = false; // Disable camera orbit during sculpting
            APP.sculpting = true;
            APP.sculptPointerId = e.pointerId;
            try { cv.setPointerCapture(e.pointerId); } catch(err) {}
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
    
    // Conform Warp drawing / brushing drag check
    if (APP.activeTool === 'conformWarp' && APP.selected && APP.conformWarp) {
        if (APP.conformWarp.isDrawing && APP.conformWarp.drawPlane) {
            const rect = APP.renderer.domElement.getBoundingClientRect();
            const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            APP.raycaster.setFromCamera({ x: mx, y: my }, APP.camera);
            
            const pt = new THREE.Vector3();
            APP.raycaster.ray.intersectPlane(APP.conformWarp.drawPlane, pt);
            
            const lastPt = APP.conformWarp.curvePoints[APP.conformWarp.curvePoints.length - 1];
            if (!lastPt || pt.distanceTo(lastPt) > 0.5) {
                APP.conformWarp.curvePoints.push(pt);
                updateConformCurvePreview();
                deformSelectedObjectAlongCurve();
            }
            return;
        } else if (APP.conformWarp.isBrushing && APP.conformWarp.brushTarget) {
            const rect = APP.renderer.domElement.getBoundingClientRect();
            const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            APP.raycaster.setFromCamera({ x: mx, y: my }, APP.camera);
            
            const hits = APP.raycaster.intersectObject(APP.conformWarp.brushTarget, true);
            if (hits.length > 0) {
                const pt = hits[0].point;
                const norm = hits[0].face.normal.clone().applyMatrix3(new THREE.Matrix3().getNormalMatrix(APP.conformWarp.brushTarget.matrixWorld)).normalize();
                
                const lastPt = APP.conformWarp.curvePoints[APP.conformWarp.curvePoints.length - 1];
                if (!lastPt || pt.distanceTo(lastPt) > 0.5) {
                    APP.conformWarp.curvePoints.push(pt);
                    APP.conformWarp.curveNormals.push(norm);
                    updateConformCurvePreview();
                    deformSelectedObjectAlongCurve();
                }
            }
            return;
        }
    }

    // Sculpt / Paint / FacePaint drag check
    if (APP.sculpting) {
        if (APP.activeTool === 'facePaint') {
            const rect = APP.renderer.domElement.getBoundingClientRect();
            const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
            APP.raycaster.setFromCamera({ x: mx, y: my }, APP.camera);
            const hits = APP.raycaster.intersectObject(APP.selected);
            if (hits.length > 0) {
                applyFacePaint(hits[0]);
            }
        } else {
            applySculpt(e);
        }
        
        // Also update brush helper position while dragging
        const rect = APP.renderer.domElement.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        APP.raycaster.setFromCamera({ x: mx, y: my }, APP.camera);
        const hits = APP.raycaster.intersectObject(APP.selected);
        if (hits.length > 0) {
            let radius = 30;
            if (APP.activeTool === 'paint') radius = parseFloat(el('brushRadius')?.value) || 30;
            else if (APP.activeTool === 'sculpt') radius = parseFloat(el('sculptRadiusRange')?.value) || 30;
            updateBrushHelper(hits[0], radius);
        }
        return;
    }

    const rect = APP.renderer.domElement.getBoundingClientRect();
    const mx = ((e.clientX-rect.left)/rect.width)*2-1;
    const my = -((e.clientY-rect.top)/rect.height)*2+1;
    
    // Handle brush helper visibility and placement when not dragging
    let showHelper = false;
    const isBrushActive = APP.activeTool === 'paint' || APP.activeTool === 'sculpt' || (APP.activeTool === 'conformWarp' && APP.conformWarp?.brushing);
    if (isBrushActive) {
        APP.raycaster.setFromCamera({ x: mx, y: my }, APP.camera);
        let targetMesh = APP.selected;
        if (APP.activeTool === 'conformWarp') {
            targetMesh = getConformTargetMesh();
        }
        if (targetMesh) {
            const hits = APP.raycaster.intersectObject(targetMesh, true);
            if (hits.length > 0) {
                let radius = 30;
                if (APP.activeTool === 'paint') radius = parseFloat(el('brushRadius')?.value) || 30;
                else if (APP.activeTool === 'sculpt') radius = parseFloat(el('sculptRadiusRange')?.value) || 30;
                else if (APP.activeTool === 'conformWarp') radius = parseFloat(el('conformBrushRadius')?.value) || 50;
                updateBrushHelper(hits[0], radius);
                showHelper = true;
            }
        }
    }
    if (!showHelper && APP.brushHelper) {
        APP.brushHelper.visible = false;
    }

    const ray = new THREE.Raycaster();
    ray.setFromCamera({x:mx,y:my}, APP.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0,1,0), 0);
    const pt = new THREE.Vector3();
    ray.ray.intersectPlane(plane, pt);
    if (pt) el('vpCoords').textContent = `X: ${pt.x.toFixed(2)} · Y: ${pt.y.toFixed(2)} · Z: ${pt.z.toFixed(2)}`;
}

function onPointerUp(e) {
    if (APP.activeTool === 'conformWarp' && APP.conformWarp && (APP.conformWarp.isDrawing || APP.conformWarp.isBrushing)) {
        try {
            const cv = APP.renderer.domElement;
            cv.releasePointerCapture(e.pointerId);
        } catch(err) {}
        APP.conformWarp.isDrawing = false;
        APP.conformWarp.isBrushing = false;
        APP.orbit.enabled = true;
        saveHist('conformWarp');
        updateStats();
        toast('✓ Yüzey bükme işlemi tamamlandı', 'success', 1200);
        return;
    }

    if (APP.sculpting) {
        if (APP.sculptPointerId !== undefined) {
            try {
                const cv = APP.renderer.domElement;
                cv.releasePointerCapture(APP.sculptPointerId);
            } catch(err) {}
            APP.sculptPointerId = undefined;
        }
        APP.sculpting = false;
        APP.orbit.enabled = true; // Re-enable orbit controls
        if (APP.sculptChanged) {
            saveHist(APP.activeTool === 'paint' ? 'paint' : (APP.activeTool === 'facePaint' ? 'facePaint' : 'sculpt'));
            updateStats();
            toast(APP.activeTool === 'paint' || APP.activeTool === 'facePaint' ? '✓ Boya uygulandı' : '✓ Model yoğuruldu', 'success', 1200);
        }
    }
}

function updateBrushHelper(hit, radius) {
    if (!APP.selected) {
        if (APP.brushHelper) APP.brushHelper.visible = false;
        return;
    }
    if (!APP.brushHelper) {
        const geom = new THREE.RingGeometry(0.98, 1.0, 32);
        geom.rotateX(Math.PI / 2);
        const mat = new THREE.MeshBasicMaterial({
            color: 0x58a6ff,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8,
            depthTest: false
        });
        APP.brushHelper = new THREE.Mesh(geom, mat);
        APP.brushHelper.renderOrder = 9999;
        APP.scene.add(APP.brushHelper);
    }
    APP.brushHelper.visible = true;
    APP.brushHelper.position.copy(hit.point);

    const normal = hit.face.normal.clone();
    const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
    const worldNormal = normal.applyMatrix3(normalMatrix).normalize();
    const lookTarget = hit.point.clone().add(worldNormal);
    APP.brushHelper.lookAt(lookTarget);

    const worldRadius = radius / 5;
    APP.brushHelper.scale.set(worldRadius, worldRadius, worldRadius);
}

function hideBrushHelper() {
    if (APP.brushHelper) {
        APP.brushHelper.visible = false;
    }
}

function applyFacePaint(hit) {
    if (!APP.selected) return;
    let geo = APP.selected.geometry;
    if (geo.index) {
        geo = geo.toNonIndexed();
        APP.selected.geometry.dispose();
        APP.selected.geometry = geo;
        rebuildWireEdges(APP.selected);
    }
    const colors = geo.attributes.color;
    if (!colors) {
        const count = geo.attributes.position.count;
        const array = new Float32Array(count * 3);
        array.fill(1); // fill white
        geo.setAttribute('color', new THREE.BufferAttribute(array, 3));
    }
    
    const paintColor = new THREE.Color(el('facePaintColor')?.value || '#ffd700');
    const pos = geo.attributes.position;
    
    const coplanarCheckbox = el('facePaintCoplanar');
    const isCoplanar = coplanarCheckbox ? coplanarCheckbox.checked : true;
    
    if (isCoplanar) {
        const normal = hit.face.normal;
        const clickedNormal = normal.clone().normalize();
        const clickedVertex = new THREE.Vector3(pos.getX(hit.faceIndex * 3), pos.getY(hit.faceIndex * 3), pos.getZ(hit.faceIndex * 3));
        const planeD = clickedVertex.dot(clickedNormal);
        
        let coloredAny = false;
        for (let f = 0; f < pos.count / 3; f++) {
            const i0 = f * 3;
            const i1 = f * 3 + 1;
            const i2 = f * 3 + 2;
            const v0 = new THREE.Vector3(pos.getX(i0), pos.getY(i0), pos.getZ(i0));
            const v1 = new THREE.Vector3(pos.getX(i1), pos.getY(i1), pos.getZ(i1));
            const v2 = new THREE.Vector3(pos.getX(i2), pos.getY(i2), pos.getZ(i2));
            
            const fNormal = new THREE.Vector3();
            const cb = new THREE.Vector3(), ab = new THREE.Vector3();
            cb.subVectors(v2, v1);
            ab.subVectors(v0, v1);
            fNormal.crossVectors(cb, ab).normalize();
            
            const dot = fNormal.dot(clickedNormal);
            const v0Dot = v0.dot(clickedNormal);
            
            if (Math.abs(dot - 1.0) < 0.02 && Math.abs(v0Dot - planeD) < 0.05) {
                geo.attributes.color.setXYZ(i0, paintColor.r, paintColor.g, paintColor.b);
                geo.attributes.color.setXYZ(i1, paintColor.r, paintColor.g, paintColor.b);
                geo.attributes.color.setXYZ(i2, paintColor.r, paintColor.g, paintColor.b);
                coloredAny = true;
            }
        }
    } else {
        const idx = hit.faceIndex * 3;
        geo.attributes.color.setXYZ(idx, paintColor.r, paintColor.g, paintColor.b);
        geo.attributes.color.setXYZ(idx + 1, paintColor.r, paintColor.g, paintColor.b);
        geo.attributes.color.setXYZ(idx + 2, paintColor.r, paintColor.g, paintColor.b);
    }
    
    geo.attributes.color.needsUpdate = true;
    APP.selected.material.vertexColors = true;
    APP.selected.material.color.set(0xffffff);
    APP.selected.material.needsUpdate = true;
    APP.sculptChanged = true;
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
    
    let mode = 'pull';
    let radius = 30;
    let strength = 2;
    let paintColorHex = '#ffc107';
    
    if (APP.activeTool === 'paint') {
        mode = 'paint';
        radius = parseFloat(el('brushRadius')?.value) || 30;
        strength = parseFloat(el('brushStrength')?.value) || 2;
        paintColorHex = el('brushColor')?.value || '#ffc107';
    } else if (APP.activeTool === 'sculpt') {
        mode = el('sculptModeSelect')?.value || 'pull';
        radius = parseFloat(el('sculptRadiusRange')?.value) || 30;
        strength = parseFloat(el('sculptStrengthRange')?.value) || 2;
    } else {
        mode = el('sculptMode')?.value || 'pull';
        radius = parseFloat(el('sculptRadius')?.value) || 30;
        strength = parseFloat(el('sculptStrength')?.value) || 2;
    }
    const worldRadius = radius / 5;
    const delta = strength / 12;
    
    const geo = APP.selected.geometry;
    const pos = geo.attributes.position;
    if (!pos) return;
    
    // Initialize original position array for the revert brush if not exists
    if (!APP.selected.userData.origPosition) {
        APP.selected.userData.origPosition = new Float32Array(pos.array);
    }
    
    if (mode === 'paint') {
        let colors = geo.attributes.color;
        if (!colors) {
            const count = pos.count;
            const array = new Float32Array(count * 3);
            const baseColor = new THREE.Color(APP.selected.material.color);
            for (let i = 0; i < count; i++) {
                array[i * 3] = baseColor.r;
                array[i * 3 + 1] = baseColor.g;
                array[i * 3 + 2] = baseColor.b;
            }
            geo.setAttribute('color', new THREE.BufferAttribute(array, 3));
            APP.selected.material = APP.selected.material.clone();
            APP.selected.material.vertexColors = true;
            APP.selected.material.needsUpdate = true;
        }
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
            else if (mode === 'inflate') {
                const vertexNormal = new THREE.Vector3();
                if (geo.attributes.normal) {
                    vertexNormal.set(
                        geo.attributes.normal.getX(i),
                        geo.attributes.normal.getY(i),
                        geo.attributes.normal.getZ(i)
                    );
                } else {
                    vertexNormal.copy(faceNormal);
                }
                v.add(vertexNormal.multiplyScalar(delta * falloff));
            }
            else if (mode === 'pinch') {
                const toHit = new THREE.Vector3().subVectors(localHit, v);
                v.add(toHit.multiplyScalar(delta * falloff * 0.4));
            }
            else if (mode === 'revert') {
                const origV = new THREE.Vector3(
                    APP.selected.userData.origPosition[i*3],
                    APP.selected.userData.origPosition[i*3+1],
                    APP.selected.userData.origPosition[i*3+2]
                );
                v.lerp(origV, delta * falloff);
            }
            else if (mode === 'paint') {
                const colors = geo.attributes.color;
                if (colors) {
                    const paintColor = new THREE.Color(paintColorHex);
                    const r = colors.getX(i);
                    const g = colors.getY(i);
                    const b = colors.getZ(i);
                    const vColor = new THREE.Color(r, g, b);
                    vColor.lerp(paintColor, delta * falloff * 2.0);
                    colors.setXYZ(i, vColor.r, vColor.g, vColor.b);
                }
            }
            
            if (mode !== 'paint') {
                pos.setXYZ(i, v.x, v.y, v.z);
            }
            changed = true;
        }
    }
    
    if (changed) {
        if (mode === 'paint' && geo.attributes.color) {
            geo.attributes.color.needsUpdate = true;
        } else {
            pos.needsUpdate = true;
            geo.computeVertexNormals();
            geo.computeBoundingBox();
            geo.computeBoundingSphere();
            rebuildWireEdges(APP.selected);
        }
        buildEditHelpers();
        APP.sculptChanged = true;
    }
}

/* ════════════════════════════════════════
   INSPECTOR
════════════════════════════════════════ */
function showInspector(show) {
    const isToolActive = APP.activeTool === 'paint' || APP.activeTool === 'sculpt' || APP.activeTool === 'facePaint' || APP.activeTool === 'extrudeFace' || APP.activeTool === 'magicStitch';
    const isSketch = APP.mode === 'sketch';
    if (show || isToolActive || isSketch) {
        el('rpEmpty').style.display = 'none';
        el('inspector').style.display = 'block';
    } else {
        el('rpEmpty').style.display = 'flex';
        el('inspector').style.display = 'none';
    }
    updateInspectorTabsVisibility();
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
    
    const clearBtn = el('clearPaintBtn');
    if (clearBtn) {
        clearBtn.style.display = obj.material.vertexColors === true ? 'block' : 'none';
    }
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
    
    if (obj.userData.type === 'karambit' || obj.userData.type === 'kelebek') {
        const type = obj.userData.type;
        const p = obj.userData.params || {};
        const wVal = p.w !== undefined ? p.w : (type === 'karambit' ? 70 : 85);
        const hVal = p.h !== undefined ? p.h : (type === 'karambit' ? 80 : 95);
        const tVal = p.t !== undefined ? p.t : (type === 'karambit' ? 8 : 7);
        const skinVal = p.skin !== undefined ? p.skin : 'classic';

        list.innerHTML = `
            <div class="gp-r" style="margin-bottom:8px;">
                <label>Boyut Şablonu</label>
                <select id="printPreset" class="lp-sel" style="width:120px;">
                    <option value="custom">Özel Boyut</option>
                    <option value="std" ${wVal === (type === 'karambit' ? 70 : 85) && hVal === (type === 'karambit' ? 80 : 95) && tVal === (type === 'karambit' ? 8 : 7) ? 'selected' : ''}>Standart (1:1)</option>
                    <option value="small" ${wVal === (type === 'karambit' ? 45 : 55) && hVal === (type === 'karambit' ? 55 : 65) && tVal === (type === 'karambit' ? 6 : 5) ? 'selected' : ''}>Küçük Boy</option>
                    <option value="large" ${wVal === (type === 'karambit' ? 100 : 120) && hVal === (type === 'karambit' ? 110 : 130) && tVal === (type === 'karambit' ? 10 : 9) ? 'selected' : ''}>Büyük Boy</option>
                </select>
            </div>
            <div class="gp-r" style="margin-bottom:8px;">
                <label>Görünüm (Skin)</label>
                <select id="printSkin" class="lp-sel" style="width:120px;">
                    <option value="classic" ${skinVal === 'classic' ? 'selected' : ''}>Klasik</option>
                    <option value="fade" ${skinVal === 'fade' ? 'selected' : ''}>Fade (Gökkuşağı)</option>
                    <option value="crimson" ${skinVal === 'crimson' ? 'selected' : ''}>Crimson Web</option>
                    <option value="tiger" ${skinVal === 'tiger' ? 'selected' : ''}>Tiger Tooth</option>
                    <option value="damascus" ${skinVal === 'damascus' ? 'selected' : ''}>Damascus Steel</option>
                    <option value="lore" ${skinVal === 'lore' ? 'selected' : ''}>Lore</option>
                    <option value="asiimov" ${skinVal === 'asiimov' ? 'selected' : ''}>Asiimov</option>
                </select>
            </div>
            <div class="gp-r">
                <label>Bıçak Uzunluğu</label>
                <input type="number" class="lp-inp gp-print-inp" data-param="w" value="${wVal}" step="1" min="10" max="500" style="width:80px;">
            </div>
            <div class="gp-r">
                <label>Kabza Uzunluğu</label>
                <input type="number" class="lp-inp gp-print-inp" data-param="h" value="${hVal}" step="1" min="10" max="500" style="width:80px;">
            </div>
            <div class="gp-r">
                <label>Kalınlık (Et)</label>
                <input type="number" class="lp-inp gp-print-inp" data-param="t" value="${tVal}" step="0.5" min="1" max="100" style="width:80px;">
            </div>
        `;

        const presetSelect = el('printPreset');
        const skinSelect = el('printSkin');
        const inputs = list.querySelectorAll('.gp-print-inp');

        const updateAll = () => {
            const w = parseFloat(list.querySelector('[data-param="w"]').value) || 20;
            const h = parseFloat(list.querySelector('[data-param="h"]').value) || 20;
            const t = parseFloat(list.querySelector('[data-param="t"]').value) || 2;
            const skin = skinSelect.value;
            rebuildGeometry(obj, { w, h, t, skin });
        };

        presetSelect.addEventListener('change', function() {
            let w, h, t;
            if (this.value === 'std') {
                w = type === 'karambit' ? 70 : 85;
                h = type === 'karambit' ? 80 : 95;
                t = type === 'karambit' ? 8 : 7;
            } else if (this.value === 'small') {
                w = type === 'karambit' ? 45 : 55;
                h = type === 'karambit' ? 55 : 65;
                t = type === 'karambit' ? 6 : 5;
            } else if (this.value === 'large') {
                w = type === 'karambit' ? 100 : 120;
                h = type === 'karambit' ? 110 : 130;
                t = type === 'karambit' ? 10 : 9;
            } else {
                return;
            }
            list.querySelector('[data-param="w"]').value = w;
            list.querySelector('[data-param="h"]').value = h;
            list.querySelector('[data-param="t"]').value = t;
            updateAll();
        });

        skinSelect.addEventListener('change', updateAll);

        inputs.forEach(input => {
            input.addEventListener('input', function() {
                presetSelect.value = 'custom';
                updateAll();
            });
        });
        return;
    }

    
    const params = obj.userData.params || {};
    const labels = { w:'Genişlik', h:'Yükseklik', d:'Derinlik', r:'Yarıçap', rb:'Alt R', seg:'Dilimler', tube:'Boru R', len:'Uzunluk', ws:'W Seg', hs:'H Seg', rs:'R Seg', ts:'T Seg', ro:'Dış R', detail:'Detay', turns:'Sarım', sw:'Mil R', hw:'Kafa R', hh:'Kafa H', sides:'Kenar', segW:'Seg W', segH:'Seg H', segD:'Seg D' };
    Object.entries(params).forEach(([k,v]) => {
        const isInt = ['seg','ws','hs','rs','ts','sides','turns','segW','segH','segD'].includes(k);
        const minVal = isInt ? (k === 'turns' ? '1' : '3') : '0.1';
        const stepVal = isInt ? '1' : '0.5';
        const formattedVal = isInt ? parseInt(v) : (typeof v==='number' ? v.toFixed(2) : v);

        const r = document.createElement('div');
        r.className = 'gp-r';
        r.innerHTML = `<label>${labels[k]||k}</label><input type="number" class="lp-inp" data-param="${k}" value="${formattedVal}" step="${stepVal}" min="${minVal}">`;
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
    // Solid color helper
    function makeSelectedSolidColor(hex) {
        if (!APP.selected) return;
        const mesh = APP.selected;
        if (mesh.geometry.attributes.color) {
            mesh.geometry.deleteAttribute('color');
            mesh.geometry.attributes.position.needsUpdate = true;
        }
        mesh.material.vertexColors = false;
        mesh.material.color.set(hex);
        mesh.material.needsUpdate = true;
        
        const clearBtn = el('clearPaintBtn');
        if (clearBtn) clearBtn.style.display = 'none';
        
        saveHist('color-solid');
    }
    
    // Color Selection Router
    function selectColor(hex) {
        el('matCol').value = hex;
        if (el('sculptPaintColor')) el('sculptPaintColor').value = hex;
        
        const isPaintMode = APP.mode === 'edit' && el('sculptMode')?.value === 'paint';
        if (isPaintMode) {
            toast(`🖌️ Fırça rengi seçildi: ${hex}`, 'info', 1000);
            return;
        }
        
        if (APP.selected) {
            makeSelectedSolidColor(hex);
            toast(`🎨 Obje rengi uygulandı`, 'success', 1000);
        }
    }

    // Material color
    el('matCol').addEventListener('input', function() { selectColor(this.value); });
    document.querySelectorAll('.msw').forEach(s => s.addEventListener('click', function() {
        selectColor(this.dataset.c);
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
    obj.position.z = Math.round(obj.position.z/s)*s;
    if (!APP.surfaceSnap) {
        obj.position.y = Math.round(obj.position.y/s)*s;
    }
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
    m2.castShadow = obj.castShadow;
    m2.receiveShadow = obj.receiveShadow;
    m2.userData = { ...obj.userData, id:uid(), name:obj.userData.name+' Kopyası' };
    if (obj.userData.origPosition) {
        m2.userData.origPosition = new Float32Array(obj.userData.origPosition);
    }
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
    if (APP.objects.length < 2 || !APP.selected) {
        toast('⚠ En az 2 obje gerekli', 'warning', 2500);
        return;
    }
    const meshA = APP.selected;
    const others = APP.objects.filter(o => o !== meshA);
    const meshB = others[others.length - 1];

    try {
        meshA.updateMatrixWorld(true);
        meshB.updateMatrixWorld(true);

        const csgA = CSG.fromMesh(meshA);
        const csgB = CSG.fromMesh(meshB);
        const csgResult = csgA.union(csgB);

        const resultMesh = CSG.toMesh(csgResult, meshA.matrixWorld, meshA.material.clone());
        resultMesh.userData = {
            ...meshA.userData,
            id: uid(),
            name: `${meshA.userData.name} + ${meshB.userData.name}`,
            type: 'union',
            params: {}
        };

        resultMesh.castShadow = true;
        resultMesh.receiveShadow = true;
        addWireEdges(resultMesh);

        deleteObjSilent(meshA);
        deleteObjSilent(meshB);

        APP.scene.add(resultMesh);
        APP.objects.push(resultMesh);
        selectObj(resultMesh);

        refreshOutliner();
        updateStats();
        saveHist('union');
        toast('✓ Birleştirme (Union) tamamlandı', 'success', 2200);
    } catch (err) {
        console.error('CSG Union error:', err);
        toast('❌ Birleştirme işleminde hata oluştu: ' + err.message, 'error', 3000);
    }
}

function boolSubtract() {
    if (APP.objects.length < 2 || !APP.selected) {
        toast('⚠ En az 2 obje gerekli (Biri seçili olmalı)', 'warning', 2500);
        return;
    }
    const meshA = APP.selected;
    const others = APP.objects.filter(o => o !== meshA);
    const meshB = others[others.length - 1];

    try {
        meshA.updateMatrixWorld(true);
        meshB.updateMatrixWorld(true);

        const csgA = CSG.fromMesh(meshA);
        const csgB = CSG.fromMesh(meshB);
        const csgResult = csgA.subtract(csgB);

        const resultMesh = CSG.toMesh(csgResult, meshA.matrixWorld, meshA.material.clone());
        resultMesh.userData = {
            ...meshA.userData,
            id: uid(),
            name: `${meshA.userData.name} - ${meshB.userData.name}`,
            type: 'subtraction',
            params: {}
        };

        resultMesh.castShadow = true;
        resultMesh.receiveShadow = true;
        addWireEdges(resultMesh);

        deleteObjSilent(meshA);
        deleteObjSilent(meshB);

        APP.scene.add(resultMesh);
        APP.objects.push(resultMesh);
        selectObj(resultMesh);

        refreshOutliner();
        updateStats();
        saveHist('subtract');
        toast('✓ Çıkarma (Subtract) tamamlandı', 'success', 2200);
    } catch (err) {
        console.error('CSG Subtraction error:', err);
        toast('❌ Çıkarma işleminde hata oluştu: ' + err.message, 'error', 3000);
    }
}

function boolIntersect() {
    if (APP.objects.length < 2 || !APP.selected) {
        toast('⚠ En az 2 obje gerekli', 'warning', 2500);
        return;
    }
    const meshA = APP.selected;
    const others = APP.objects.filter(o => o !== meshA);
    const meshB = others[others.length - 1];

    try {
        meshA.updateMatrixWorld(true);
        meshB.updateMatrixWorld(true);

        const csgA = CSG.fromMesh(meshA);
        const csgB = CSG.fromMesh(meshB);
        const csgResult = csgA.intersect(csgB);

        const resultMesh = CSG.toMesh(csgResult, meshA.matrixWorld, meshA.material.clone());
        resultMesh.userData = {
            ...meshA.userData,
            id: uid(),
            name: `Kesişim (${meshA.userData.name} & ${meshB.userData.name})`,
            type: 'intersection',
            params: {}
        };

        resultMesh.castShadow = true;
        resultMesh.receiveShadow = true;
        addWireEdges(resultMesh);

        deleteObjSilent(meshA);
        deleteObjSilent(meshB);

        APP.scene.add(resultMesh);
        APP.objects.push(resultMesh);
        selectObj(resultMesh);

        refreshOutliner();
        updateStats();
        saveHist('intersect');
        toast('✓ Kesişim (Intersect) tamamlandı', 'success', 2200);
    } catch (err) {
        console.error('CSG Intersection error:', err);
        toast('❌ Kesişim işleminde hata oluştu: ' + err.message, 'error', 3000);
    }
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

function doTwist() {
    if (!APP.selected) { toast('⚠ Obje seçin','warning',1800); return; }
    const angleVal = parseFloat(el('pTwistAngle').value) || 45;
    const angleRad = (angleVal * Math.PI) / 180;
    const geom = APP.selected.geometry;
    const pos = geom.attributes.position;
    if (!pos) return;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    const height = maxY - minY;
    if (height === 0) return;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const factor = (y - minY) / height;
        const theta = factor * angleRad;
        const newX = x * Math.cos(theta) - z * Math.sin(theta);
        const newZ = x * Math.sin(theta) + z * Math.cos(theta);
        pos.setX(i, newX);
        pos.setZ(i, newZ);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    if (APP.selected.userData.edges) {
        APP.scene.remove(APP.selected.userData.edges);
        APP.selected.userData.edges.geometry.dispose();
        const eg = new THREE.EdgesGeometry(geom);
        const em = new THREE.LineBasicMaterial({ color: 0x58a6ff, transparent: true, opacity: 0.4 });
        APP.selected.userData.edges = new THREE.LineSegments(eg, em);
        APP.selected.add(APP.selected.userData.edges);
    }
    saveHist('twist');
    toast(`✓ Twist ${angleVal}° uygulandı`,'success',1800);
}

function doTaper() {
    if (!APP.selected) { toast('⚠ Obje seçin','warning',1800); return; }
    const factorAmt = parseFloat(el('pTaperAmt').value);
    if (isNaN(factorAmt)) return;
    const geom = APP.selected.geometry;
    const pos = geom.attributes.position;
    if (!pos) return;
    let minY = Infinity, maxY = -Infinity;
    for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
    }
    const height = maxY - minY;
    if (height === 0) return;
    for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        const ratio = (y - minY) / height;
        const scale = 1 + ratio * (factorAmt - 1);
        pos.setX(i, x * scale);
        pos.setZ(i, z * scale);
    }
    pos.needsUpdate = true;
    geom.computeVertexNormals();
    if (APP.selected.userData.edges) {
        APP.scene.remove(APP.selected.userData.edges);
        APP.selected.userData.edges.geometry.dispose();
        const eg = new THREE.EdgesGeometry(geom);
        const em = new THREE.LineBasicMaterial({ color: 0x58a6ff, transparent: true, opacity: 0.4 });
        APP.selected.userData.edges = new THREE.LineSegments(eg, em);
        APP.selected.add(APP.selected.userData.edges);
    }
    saveHist('taper');
    toast(`✓ Taper ${factorAmt} uygulandı`,'success',1800);
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

    // Show inspector and switch right panel to draw tab
    showInspector(true);
    const drawTab = document.querySelector('.rp-tab[data-rpt="draw"]');
    if (drawTab) drawTab.click();

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

    // Update inspector visibility
    showInspector(APP.selected !== null);
    if (APP.selected) {
        const transTab = document.querySelector('.rp-tab[data-rpt="transform"]');
        if (transTab) transTab.click();
    }
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
    const icons={box:'▪',cylinder:'⭕',sphere:'●',cone:'▲',torus:'◯',plane:'▬',capsule:'💊',pyramid:'🔺',tube:'⬜',ring:'◉',octa:'◈',dodeca:'◇',icosa:'◆',tetra:'△',spring:'🌀',arrow:'→',prism:'▣',sketch:'✏',union:'⊕',intersect:'⊗',lathe:'⟳',text3d:'T',house:'🏠',sword:'⚔️',tower:'🏰',rock:'🪨',shield:'🛡️',chest:'📦',barrel:'🛢️',bridge:'🌉',torch:'🕯️',lantern:'🏮',fence:'🚧',well:'⛲',campfire:'🔥',tent:'⛺',windmill:'⚙️',boat:'⛵',crystal:'💎',pillar:'🏛️',flag:'🚩',gravestone:'🪦',castle:'🏰',lighthouse:'🚨',pine:'🌲',mushroom:'🍄',cannon:'💥',ruins:'🏛️',cabin:'🏚️',portal:'🌀',cactus:'🌵',cloud:'☁️',flower:'🌸',crate:'📦',anvil:'🔨',wagon:'🛒',mannequin:'👤',knight:'🛡️',wizard:'🧙',cyborg:'🤖',ninja:'🥷',ranger:'🚀',slime:'🟢',golem:'🪨',beholder:'👁️',dragon:'🐉',road_straight:'🛣️',road_curve:'↪️',road_t_junction:'┫',road_crossroad:'➕',road_bridge:'🌉',karambit:'🔪',kelebek:'🦋'};
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
    const data = { 
        id: obj.userData.id, 
        name: obj.userData.name, 
        type: obj.userData.type, 
        params: obj.userData.params, 
        pos: obj.position.toArray(), 
        rot: [obj.rotation.x, obj.rotation.y, obj.rotation.z], 
        scl: obj.scale.toArray(), 
        mat: { 
            c: '#' + obj.material.color.getHexString(), 
            m: obj.material.metalness, 
            r: obj.material.roughness, 
            o: obj.material.opacity || 1 
        }, 
        vis: obj.visible, 
        locked: obj.userData.locked || false,
        castShadow: obj.castShadow,
        receiveShadow: obj.receiveShadow
    };
    
    if (obj.geometry.attributes.position && (obj.userData.origPosition || obj.userData.type === 'imported')) {
        data.customPositions = Array.from(obj.geometry.attributes.position.array);
        if (obj.userData.origPosition) {
            data.origPositions = Array.from(obj.userData.origPosition);
        }
    }
    if (obj.geometry.attributes.color) {
        data.customColors = Array.from(obj.geometry.attributes.color.array);
        data.vertexColorsEnabled = obj.material.vertexColors === true;
    }
    return data;
}
function desObj(d) {
    try {
        let geo;
        if (d.type === 'imported') {
            geo = new THREE.BufferGeometry();
            if (d.customPositions) {
                const posArr = new Float32Array(d.customPositions);
                geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
            }
            if (d.customColors) {
                const colorArr = new Float32Array(d.customColors);
                geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
            }
            geo.computeVertexNormals();
        } else {
            const res = buildGeo(d.type, d.params||{});
            geo = res.geo;
            if (d.customPositions && geo.attributes.position) {
                const posAttr = geo.attributes.position;
                if (posAttr.array.length === d.customPositions.length) {
                    posAttr.array.set(d.customPositions);
                    posAttr.needsUpdate = true;
                } else {
                    const posArr = new Float32Array(d.customPositions);
                    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
                    geo.computeVertexNormals();
                }
            }
            if (d.customColors) {
                const colorArr = new Float32Array(d.customColors);
                geo.setAttribute('color', new THREE.BufferAttribute(colorArr, 3));
            }
        }
        
        const mat = new THREE.MeshStandardMaterial({
            color: d.mat.c || '#4fc3f7',
            metalness: d.mat.m || 0.2,
            roughness: d.mat.r || 0.6,
            opacity: d.mat.o || 1,
            transparent: (d.mat.o || 1) < 1,
            vertexColors: d.vertexColorsEnabled || false
        });
        const m = new THREE.Mesh(geo, mat);
        m.position.fromArray(d.pos || [0,0,0]);
        m.rotation.set(...(d.rot || [0,0,0]));
        m.scale.fromArray(d.scl || [1,1,1]);
        m.castShadow = d.castShadow !== false;
        m.receiveShadow = d.receiveShadow !== false;
        m.visible = d.vis !== false;
        m.userData = {
            id: d.id,
            name: d.name,
            type: d.type,
            params: d.params,
            locked: d.locked || false
        };
        if (d.origPositions) {
            m.userData.origPosition = new Float32Array(d.origPositions);
        }
        applyChampionTexture(m);
        applyObjectTexture(m);
        addWireEdges(m);
        return m;
    } catch(e) {
        console.error('desObj:', e);
        return null;
    }
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
   3D MODEL IMPORT & ADVANCED MODIFIERS
   ════════════════════════════════════════ */
function handleImportFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const name = file.name;
    const extension = name.split('.').pop().toLowerCase();
    
    const reader = new FileReader();
    
    if (extension === 'stl') {
        reader.onload = function(evt) {
            try {
                const loader = new THREE.STLLoader();
                const geometry = loader.parse(evt.target.result);
                if (geometry) {
                    processAndAddImportedGeometry(geometry, name.replace('.stl', ''));
                } else {
                    toast('❌ STL dosyası çözümlenemedi', 'error', 3000);
                }
            } catch (err) {
                toast('❌ STL yükleme hatası: ' + err.message, 'error', 3000);
            }
        };
        reader.readAsArrayBuffer(file);
    } else if (extension === 'obj') {
        reader.onload = function(evt) {
            try {
                const loader = new THREE.OBJLoader();
                const group = loader.parse(evt.target.result);
                if (group) {
                    const geometry = getGeometryFromOBJGroup(group);
                    if (geometry) {
                        processAndAddImportedGeometry(geometry, name.replace('.obj', ''));
                    } else {
                        toast('❌ OBJ dosyasında geçerli geometri bulunamadı', 'error', 3000);
                    }
                } else {
                    toast('❌ OBJ dosyası çözümlenemedi', 'error', 3000);
                }
            } catch (err) {
                toast('❌ OBJ yükleme hatası: ' + err.message, 'error', 3000);
            }
        };
        reader.readAsText(file);
    } else {
        toast('❌ Yalnızca .obj ve .stl dosyaları desteklenir', 'error', 3000);
    }
    
    e.target.value = '';
}

function getGeometryFromOBJGroup(group) {
    const geometries = [];
    group.traverse(child => {
        if (child.isMesh && child.geometry) {
            child.updateMatrix();
            const tempGeo = child.geometry.clone();
            tempGeo.applyMatrix4(child.matrix);
            
            if (!tempGeo.attributes.position) return;
            if (!tempGeo.attributes.normal) {
                tempGeo.computeVertexNormals();
            }
            
            const cleanGeo = new THREE.BufferGeometry();
            cleanGeo.setAttribute('position', tempGeo.attributes.position.clone());
            if (tempGeo.attributes.normal) {
                cleanGeo.setAttribute('normal', tempGeo.attributes.normal.clone());
            } else {
                cleanGeo.computeVertexNormals();
            }
            
            geometries.push(cleanGeo);
        }
    });
    
    if (geometries.length === 0) return null;
    if (geometries.length === 1) return geometries[0];
    
    const merged = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
    return merged || geometries[0];
}

function processAndAddImportedGeometry(geo, label) {
    if (APP.objects.length >= 500) {
        toast('⚠ Maksimum 500 obje', 'warning', 2000);
        return;
    }
    
    if (!geo.attributes.normal) {
        geo.computeVertexNormals();
    }
    
    if (geo.index) {
        geo = geo.toNonIndexed();
    } else {
        geo = geo.clone();
    }
    
    geo.center();
    
    geo.computeBoundingBox();
    const size = new THREE.Vector3();
    geo.boundingBox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
        const targetSize = 30;
        const scaleFactor = targetSize / maxDim;
        geo.scale(scaleFactor, scaleFactor, scaleFactor);
    }
    
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    colors.fill(1.0);
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const mat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        metalness: 0.2,
        roughness: 0.8,
        vertexColors: true
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    mesh.position.y = -bb.min.y;
    
    mesh.userData = {
        id: uid(),
        type: 'imported',
        name: label || 'İçe Aktarılan Model',
        params: {},
        visible: true,
        locked: false
    };
    
    mesh.userData.origPosition = new Float32Array(geo.attributes.position.array);
    
    addWireEdges(mesh);
    
    APP.scene.add(mesh);
    APP.objects.push(mesh);
    selectObj(mesh);
    refreshOutliner();
    updateStats();
    saveHist('import');
    
    toast(`✓ "${mesh.userData.name}" içe aktarıldı`, 'success', 2000);
    setStatus(`"${mesh.userData.name}" içe aktarıldı`);
}

function makeHollow(geo, thickness) {
    if (geo.index) geo = geo.toNonIndexed();
    
    const posAttr = geo.attributes.position;
    const normalAttr = geo.attributes.normal;
    const count = posAttr.count;
    
    const innerGeo = geo.clone();
    const innerPos = innerGeo.attributes.position;
    const innerNormal = innerGeo.attributes.normal;
    
    for (let i = 0; i < count; i++) {
        const px = innerPos.getX(i);
        const py = innerPos.getY(i);
        const pz = innerPos.getZ(i);
        
        const nx = innerNormal.getX(i);
        const ny = innerNormal.getY(i);
        const nz = innerNormal.getZ(i);
        
        innerPos.setXYZ(i, px - nx * thickness, py - ny * thickness, pz - nz * thickness);
        innerNormal.setXYZ(i, -nx, -ny, -nz);
    }
    innerPos.needsUpdate = true;
    innerNormal.needsUpdate = true;
    
    const posArr = innerPos.array;
    const normArr = innerNormal.array;
    const colArr = innerGeo.attributes.color ? innerGeo.attributes.color.array : null;
    
    for (let i = 0; i < count; i += 3) {
        const idx1 = i + 1;
        const idx2 = i + 2;
        
        for (let j = 0; j < 3; j++) {
            const tempP = posArr[idx1 * 3 + j];
            posArr[idx1 * 3 + j] = posArr[idx2 * 3 + j];
            posArr[idx2 * 3 + j] = tempP;
            
            const tempN = normArr[idx1 * 3 + j];
            normArr[idx1 * 3 + j] = normArr[idx2 * 3 + j];
            normArr[idx2 * 3 + j] = tempN;
            
            if (colArr) {
                const tempC = colArr[idx1 * 3 + j];
                colArr[idx1 * 3 + j] = colArr[idx2 * 3 + j];
                colArr[idx2 * 3 + j] = tempC;
            }
        }
    }
    
    return THREE.BufferGeometryUtils.mergeBufferGeometries([geo, innerGeo]);
}

function bendGeometry(geo, angleDeg, axis = 'x') {
    if (geo.index) geo = geo.toNonIndexed();
    const pos = geo.attributes.position;
    const count = pos.count;
    
    const angle = THREE.MathUtils.degToRad(angleDeg);
    geo.computeBoundingBox();
    const bb = geo.boundingBox;
    const minVal = bb.min.y;
    const maxVal = bb.max.y;
    const height = maxVal - minVal;
    if (height === 0 || angle === 0) return;
    
    for (let i = 0; i < count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        
        const pct = (y - minVal) / height;
        const r = height / angle;
        const theta = angle * (y - (minVal + maxVal) / 2) / height;
        
        if (axis === 'x') {
            y = r * Math.sin(theta);
            z = z + r * (Math.cos(theta) - 1);
        } else {
            y = r * Math.sin(theta);
            x = x + r * (Math.cos(theta) - 1);
        }
        
        pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
}

function noiseDeformGeometry(geo, strength, frequency) {
    if (geo.index) geo = geo.toNonIndexed();
    const pos = geo.attributes.position;
    const count = pos.count;
    
    for (let i = 0; i < count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);
        
        const dx = Math.sin(y * frequency + x * frequency) * strength;
        const dy = Math.cos(x * frequency + z * frequency) * strength;
        const dz = Math.sin(z * frequency + y * frequency) * strength;
        
        pos.setXYZ(i, x + dx, y + dy, z + dz);
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
}

function doQuickHole() {
    if (!APP.selected) { toast('⚠ Önce bir obje seçin', 'warning', 2500); return; }
    const mesh = APP.selected;
    
    mesh.geometry.computeBoundingBox();
    const size = new THREE.Vector3();
    mesh.geometry.boundingBox.getSize(size);
    size.multiply(mesh.scale);
    
    const radius = Math.max(2, Math.min(size.x, size.z) / 4);
    const height = size.y + 10;
    
    const cutterGeo = new THREE.CylinderGeometry(radius, radius, height, 24);
    const cutterMat = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        roughness: 0.8,
        metalness: 0.2,
        transparent: true,
        opacity: 0.1,
        depthWrite: false
    });
    
    const cutter = new THREE.Mesh(cutterGeo, cutterMat);
    cutter.castShadow = false;
    cutter.receiveShadow = false;
    
    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    cutter.position.copy(worldPos);
    cutter.rotation.copy(mesh.rotation);
    
    cutter.userData = {
        id: uid(),
        type: 'cylinder',
        name: `${mesh.userData.name} Kesici (Delik)`,
        params: { r: radius, h: height, seg: 24 },
        visible: true,
        locked: false
    };
    
    addWireEdges(cutter);
    
    APP.scene.add(cutter);
    APP.objects.push(cutter);
    selectObj(cutter);
    
    refreshOutliner();
    updateStats();
    saveHist('quick_hole');
    
    toast('✓ Delik açıcı yerleştirildi. Konumlandırın, ardından ana cismi seçip "Çıkar" butonuna tıklayın!', 'success', 5000);
}

function doHollow() {
    if (!APP.selected) { toast('⚠ Önce bir obje seçin', 'warning', 2500); return; }
    const mesh = APP.selected;
    
    const thickness = parseFloat(el('pHollowThickness')?.value) || 2;
    if (thickness <= 0.1) { toast('⚠ Kalınlık en az 0.1mm olmalıdır', 'warning', 2000); return; }
    
    const origGeo = mesh.geometry;
    let hollowGeo;
    try {
        hollowGeo = makeHollow(origGeo, thickness);
    } catch (err) {
        toast('❌ İçini oyma hatası: ' + err.message, 'error', 3000);
        return;
    }
    
    mesh.geometry.dispose();
    mesh.geometry = hollowGeo;
    mesh.userData.origPosition = null;
    rebuildWireEdges(mesh);
    
    refreshInspector(mesh);
    updateStats();
    saveHist('hollow');
    toast(`✓ "${mesh.userData.name}" içi oyuldu (Et: ${thickness}mm)`, 'success', 2500);
}

function doBend() {
    if (!APP.selected) { toast('⚠ Önce bir obje seçin', 'warning', 2500); return; }
    const mesh = APP.selected;
    const angle = parseFloat(el('pBendAngle')?.value) || 45;
    const axis = el('pBendAxis')?.value || 'x';
    
    const geo = mesh.geometry;
    bendGeometry(geo, angle, axis);
    rebuildWireEdges(mesh);
    
    refreshInspector(mesh);
    updateStats();
    saveHist('bend');
    toast(`✓ Obje büküldü: ${angle}°`, 'success', 2000);
}

function doNoise() {
    if (!APP.selected) { toast('⚠ Önce bir obje seçin', 'warning', 2500); return; }
    const mesh = APP.selected;
    const strength = parseFloat(el('pNoiseStrength')?.value) || 2;
    const freq = parseFloat(el('pNoiseFreq')?.value) || 0.1;
    
    const geo = mesh.geometry;
    noiseDeformGeometry(geo, strength, freq);
    rebuildWireEdges(mesh);
    
    refreshInspector(mesh);
    updateStats();
    saveHist('noise');
    toast(`✓ Obje dalgalandırıldı`, 'success', 2000);
}

/* ════════════════════════════════════════
   SAVE/LOAD
════════════════════════════════════════ */
async function quickSave() {
    if (APP.fileHandle) {
        try {
            const data = {
                version: '3.0',
                appName: 'TriForge CAD Pro',
                savedAt: new Date().toISOString(),
                objectCount: APP.objects.length,
                objects: APP.objects.map(serObj)
            };
            const jsonStr = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const writable = await APP.fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            toast('✓ Değişiklikler kaydedildi', 'success', 2500);
        } catch (err) {
            console.error('Kaydetme hatası:', err);
            toast('❌ Kaydetme hatası: ' + err.message, 'error', 3000);
        }
    } else {
        await saveProjectAs();
    }
}

async function saveProjectAs() {
    const data = {
        version: '3.0',
        appName: 'TriForge CAD Pro',
        savedAt: new Date().toISOString(),
        objectCount: APP.objects.length,
        objects: APP.objects.map(serObj)
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: `Tasarim.json`,
                types: [{
                    description: 'TriForge CAD Pro Proje Dosyası',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            APP.fileHandle = handle;
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            toast('✓ Proje kaydedildi', 'success', 2500);
            return;
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('showSaveFilePicker failed, falling back to download:', err);
        }
    }
    
    // Custom In-App Save As Fallback Modal
    el('saveAsFilename').value = APP.fileHandle ? APP.fileHandle.name.replace('.json', '') : 'Tasarim';
    el('saveAsModal').style.display = 'flex';
    el('saveAsConfirmBtn').onclick = () => {
        let name = el('saveAsFilename').value.trim() || 'Tasarim';
        if (!name.endsWith('.json')) name += '.json';
        dlBlob(blob, name);
        el('saveAsModal').style.display = 'none';
        toast(`✓ "${name}" indirildi`, 'success', 2500);
    };
}

async function openProjectLocal() {
    if (window.showOpenFilePicker) {
        try {
            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'TriForge CAD Pro Proje Dosyası',
                    accept: { 'application/json': ['.json'] }
                }]
            });
            APP.fileHandle = handle;
            const file = await handle.getFile();
            const text = await file.text();
            try {
                const data = JSON.parse(text);
                if (!data || !Array.isArray(data.objects)) {
                    toast('❌ Geçersiz proje dosyası', 'error', 3000);
                    return;
                }
                restoreHist(data);
                saveHist('load');
                toast(`✓ "${file.name.replace('.json','')}" başarıyla yüklendi`, 'success', 2500);
            } catch (err) {
                toast('❌ Dosya okuma hatası: ' + err.message, 'error', 3000);
            }
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.warn('showOpenFilePicker failed, falling back to input:', err);
            el('localFileInp').click();
        }
    } else {
        el('localFileInp').click();
    }
}

/* ════════════════════════════════════════
   CLEAR
════════════════════════════════════════ */
function clearScene() {
    APP.objects.forEach(o=>{APP.scene.remove(o);o.geometry?.dispose();o.material?.dispose();});
    APP.objects=[]; APP.selected=null; APP.transform.detach(); clearEditHelpers(); hideBrushHelper();
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
    el('mbModeObj').addEventListener('click', () => { if (APP.mode==='sketch') exitSketchMode(); if (APP.mode==='edit' || APP.mode==='paint') exitEditMode(); });
    el('mbModeEdit').addEventListener('click', () => { if (APP.mode==='sketch') exitSketchMode(); enterEditMode(); });
    el('mbModeSketch').addEventListener('click', () => { if (APP.mode==='edit' || APP.mode==='paint') exitEditMode(); if (APP.mode==='sketch') exitSketchMode(); else enterSketchMode(); });
    el('mbModePaint').addEventListener('click', () => {
        if (!APP.selected) {
            toast('⚠️ Boyama yapmak için önce sahnede bir obje seçmelisiniz!', 'warning', 2500);
            return;
        }
        if (APP.mode==='sketch') exitSketchMode();
        enterEditMode();
        if (el('sculptMode')) {
            el('sculptMode').value = 'paint';
            el('sculptMode').dispatchEvent(new Event('change'));
        }
        document.querySelectorAll('.mb-btn.mode-btn').forEach(b=>b.classList.remove('active'));
        el('mbModePaint').classList.add('active');
        el('vpBadge').textContent='EDİT MODU · BOYAMA FIRÇASI';
        el('vpBadge').className='vp-badge edit-mode';
        document.querySelectorAll('.rp-tab').forEach(t=>{ if(t.dataset.rpt==='material') t.click(); });
        toast('🖌️ Boyama Fırçası Aktif. Sol tıkla sürükleyerek objeyi boyayabilirsiniz!','success',3000);
    });

    el('mSaveAsClose')?.addEventListener('click', () => el('saveAsModal').style.display='none');
    el('mSaveAsCancel')?.addEventListener('click', () => el('saveAsModal').style.display='none');

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
    [
        ['ltSel','select'],
        ['ltMove','translate'],
        ['ltRot','rotate'],
        ['ltScl','scale'],
        ['ltPaintBrush','paint'],
        ['ltFacePaint','facePaint'],
        ['ltExtrudeFace','extrudeFace'],
        ['ltSculpt','sculpt'],
        ['ltConformWarp','conformWarp'],
        ['ltMagicStitch','magicStitch']
    ].forEach(([id,tool]) => {
        const btn = el(id);
        if (!btn) return;
        btn.addEventListener('click', () => {
            document.querySelectorAll('.lt-btn').forEach(b=>b.classList.remove('active'));
            btn.classList.add('active');
            APP.activeTool=tool;
            hideBrushHelper();
            
            if (tool !== 'conformWarp') {
                deactivateConformWarp();
            }
            if (tool !== 'magicStitch') {
                clearMagicStitch();
            }
            
            // sync menubar
            document.querySelectorAll('.mb-btn.tool-btn').forEach(b=>b.classList.remove('active'));
            const mbIds={select:'tbSel',translate:'tbMove',rotate:'tbRot',scale:'tbScl'};
            const mbid=mbIds[tool]; if (mbid) el(mbid).classList.add('active');
            
            if (tool === 'select' || tool === 'paint' || tool === 'facePaint' || tool === 'extrudeFace' || tool === 'sculpt' || tool === 'conformWarp' || tool === 'magicStitch') {
                APP.transform.detach();
            } else {
                APP.transform.setMode(tool);
                if (APP.selected && APP.mode === 'object') APP.transform.attach(APP.selected);
            }
            
            if (tool === 'paint' || tool === 'facePaint' || tool === 'extrudeFace' || tool === 'sculpt' || tool === 'conformWarp' || tool === 'magicStitch') {
                switchLeftTab('shapes');
                const t = document.querySelector('.rp-tab[data-rpt="toolopts"]');
                if (t) t.click();
                updateActiveToolUI(tool);
                if (tool === 'conformWarp') {
                    populateConformTargetDropdown();
                }
            } else {
                updateActiveToolUI(null);
            }
            updateViewportBadge();
        });
    });

    // Face operation settings change listener
    el('faceOpSelect')?.addEventListener('change', function() {
        const op = this.value;
        const depthRow = el('faceOpDepthRow');
        const label = el('faceOpAmountLabel');
        const depthInput = el('extrudeFaceDepth');
        const help = el('faceOpHelpText');
        
        if (op === 'extrude') {
            if (depthRow) depthRow.style.display = 'flex';
            if (label) label.textContent = 'Derinlik (mm)';
            if (depthInput) {
                depthInput.value = '5';
                depthInput.min = '-500';
                depthInput.max = '500';
                depthInput.step = '0.5';
            }
            if (help) help.textContent = 'Bir yüzeye tıklayarak o yüzeyi belirtilen derinlikte dışarı doğru uzatın.';
        } else if (op === 'inset') {
            if (depthRow) depthRow.style.display = 'flex';
            if (label) label.textContent = 'Inset Oranı (0.1 - 0.9)';
            if (depthInput) {
                depthInput.value = '0.3';
                depthInput.min = '0.05';
                depthInput.max = '0.95';
                depthInput.step = '0.05';
            }
            if (help) help.textContent = 'Yüzeyin sınırlarını içeriye doğru daraltarak yeni bir yüzey ve çevre duvarları oluşturur.';
        } else if (op === 'subdivide') {
            if (depthRow) depthRow.style.display = 'none';
            if (help) help.textContent = 'Tıklanan üçgen yüzeyi merkezinden 3 eşit parçaya bölerek daha detaylı modelleme alanı sağlar.';
        } else if (op === 'delete') {
            if (depthRow) depthRow.style.display = 'none';
            if (help) help.textContent = 'Tıklanan yüzeyi tamamen siler, mesh üzerinde bir delik oluşturur.';
        }
    });

    // Surface Snap Toggle
    APP.surfaceSnap = false;
    const snapBtn = el('ltSurfaceSnap');
    if (snapBtn) {
        snapBtn.addEventListener('click', () => {
            APP.surfaceSnap = !APP.surfaceSnap;
            if (APP.surfaceSnap) {
                snapBtn.classList.add('active');
                toast('🧲 Yüzey Yapışması Aktif (Çakışma Önleme)', 'success', 2000);
            } else {
                snapBtn.classList.remove('active');
                toast('🧲 Yüzey Yapışması Devre Dışı', 'info', 1800);
            }
        });
    }

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
    el('opTwist').addEventListener('click', doTwist);
    el('opTaper').addEventListener('click', doTaper);
    el('opArray').addEventListener('click', doArray);
    el('opLathe').addEventListener('click', doLathe);
    el('opQuickHole').addEventListener('click', doQuickHole);
    el('opHollow').addEventListener('click', doHollow);
    el('opBend').addEventListener('click', doBend);
    el('opNoise').addEventListener('click', doNoise);

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
    el('mbNew').addEventListener('click', () => { if(APP.objects.length>0&&!confirm('Yeni sahne — kaydedilmemiş değişiklikler kaybolur.')) return; clearScene(); APP.fileHandle = null; saveHist('new'); toast('🆕 Yeni sahne','info',1800); });
    el('mbSave').addEventListener('click', quickSave);
    el('mbSaveAs').addEventListener('click', saveProjectAs);
    el('mbLoad').addEventListener('click', openProjectLocal);
    el('localFileInp').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        APP.fileHandle = null;
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
                toast(`✓ "${file.name.replace('.json','')}" başarıyla yüklendi`, 'success', 2500);
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
    el('mbImport').addEventListener('click', () => el('importFileInp').click());
    el('importFileInp').addEventListener('change', handleImportFile);

    // Save modal
    el('mSaveOk')?.addEventListener('click', quickSave);
    el('mSaveLocal')?.addEventListener('click', saveProjectAs);
    el('mSaveCancel')?.addEventListener('click', () => el('saveModal').style.display='none');
    el('mSaveClose')?.addEventListener('click', () => el('saveModal').style.display='none');
    el('mSaveName')?.addEventListener('keydown', e => { if(e.key==='Enter') quickSave(); });

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



    // Sculpt Paint Color Toggle
    el('sculptMode')?.addEventListener('change', function() {
        const isPaint = this.value === 'paint';
        const row = el('paintColorRow');
        if (row) row.style.display = isPaint ? 'flex' : 'none';
    });

    // Clear Paint Action
    el('clearPaintBtn')?.addEventListener('click', () => {
        if (!APP.selected) return;
        if (APP.selected.geometry.attributes.color) {
            APP.selected.geometry.deleteAttribute('color');
        }
        APP.selected.material.vertexColors = false;
        APP.selected.material.needsUpdate = true;
        saveHist('clear-paint');
        refreshInspector(APP.selected);
        toast('🎨 Boyama temizlendi', 'info', 1500);
    });

    // Conform Warp Event Bindings
    el('btnConformDrawCurve')?.addEventListener('click', () => {
        if (!APP.selected) {
            toast('⚠️ Bükme işlemi için önce bir nesne seçmelisiniz!', 'warning', 2500);
            return;
        }
        if (!APP.selected.userData.origPosition) {
            const pos = APP.selected.geometry.attributes.position;
            APP.selected.userData.origPosition = new Float32Array(pos.array);
        }
        
        APP.conformWarp.drawingCurve = !APP.conformWarp.drawingCurve;
        APP.conformWarp.brushing = false;
        
        el('btnConformDrawCurve').classList.toggle('active', APP.conformWarp.drawingCurve);
        el('btnConformBrush').classList.remove('active');
        
        if (APP.conformWarp.drawingCurve) {
            toast('✍️ Çizim Aktif: Ekranda farenin sol tuşuna basılı tutup sürükleyerek bükme eğrisi çizin.', 'info', 4000);
            setStatus('Eğri çizim modu aktif...');
        } else {
            setStatus('Eğri çizimi kapatıldı.');
        }
    });

    el('btnConformClearCurve')?.addEventListener('click', () => {
        clearConformWarp();
    });

    el('btnConformSnap')?.addEventListener('click', () => {
        performConformSnap();
    });

    el('btnConformBrush')?.addEventListener('click', () => {
        if (!APP.selected) {
            toast('⚠️ Fırçalama yapmak için önce bir nesne seçmelisiniz!', 'warning', 2500);
            return;
        }
        
        APP.conformWarp.brushing = !APP.conformWarp.brushing;
        APP.conformWarp.drawingCurve = false;
        
        el('btnConformBrush').classList.toggle('active', APP.conformWarp.brushing);
        el('btnConformDrawCurve').classList.remove('active');
        
        if (APP.conformWarp.brushing) {
            populateConformTargetDropdown();
            toast('🖌️ Fırçalama Aktif: Alt tarafta yer alan hedef yüzey üzerinde sürükleyin.', 'info', 4000);
            setStatus('Yüzey fırçalama modu aktif...');
        } else {
            hideBrushHelper();
            setStatus('Fırçalama modu kapatıldı.');
        }
    });

    el('conformTarget')?.addEventListener('focus', () => {
        populateConformTargetDropdown();
    });

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
            case 's':
                if (e.ctrlKey) {
                    e.preventDefault();
                    if (e.shiftKey) {
                        saveProjectAs();
                    } else {
                        quickSave();
                    }
                }
                break;
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

function colorGeometry(geo, color) {
    const count = geo.attributes.position.count;
    const colors = new Float32Array(count * 3);
    const c = new THREE.Color(color);
    for (let i = 0; i < count; i++) {
        colors[i*3] = c.r;
        colors[i*3+1] = c.g;
        colors[i*3+2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function setGeometryUVsToZero(geo) {
    let uvAttr = geo.attributes.uv;
    if (!uvAttr) {
        const count = geo.attributes.position.count;
        const uvs = new Float32Array(count * 2);
        for (let i = 0; i < count; i++) {
            uvs[i * 2] = 0.005;
            uvs[i * 2 + 1] = 0.005;
        }
        geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    } else {
        const count = uvAttr.count;
        for (let i = 0; i < count; i++) {
            uvAttr.setXY(i, 0.005, 0.005);
        }
        uvAttr.needsUpdate = true;
    }
}

function configureCardUVs(cardGeo) {
    const uvAttr = cardGeo.attributes.uv;
    if (!uvAttr) return;
    for (let i = 0; i < uvAttr.count; i++) {
        const faceIdx = Math.floor(i / 4);
        let u = uvAttr.getX(i);
        let v = uvAttr.getY(i);
        if (faceIdx === 4 || faceIdx === 5) {
            const u_new = 0.02 + u * 0.96;
            const v_new = 0.01 + v * 0.98;
            uvAttr.setXY(i, u_new, v_new);
        } else {
            uvAttr.setXY(i, 0.005, 0.005);
        }
    }
    uvAttr.needsUpdate = true;
}


function createChampTexture(type, callback, onImageLoaded) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    let title = "";
    let subtitle = "";
    let themeColor = "";
    let imageUrl = "";
    
    if (type === 'lol_garen') {
        grad.addColorStop(0, '#0d47a1');
        grad.addColorStop(1, '#061a40');
        title = "GAREN";
        subtitle = "DEMACIA'NIN GÜCÜ";
        themeColor = '#ffd700';
        imageUrl = 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Garen_0.jpg';
    } else if (type === 'lol_yasuo') {
        grad.addColorStop(0, '#006064');
        grad.addColorStop(1, '#002d33');
        title = "YASUO";
        subtitle = "GÜNAHIN RÜZGARI";
        themeColor = '#e0f7fa';
        imageUrl = 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Yasuo_0.jpg';
    } else if (type === 'lol_teemo') {
        grad.addColorStop(0, '#2e7d32');
        grad.addColorStop(1, '#0e3a10');
        title = "TEEMO";
        subtitle = "ÇEVİK İZCİ";
        themeColor = '#ffb74d';
        imageUrl = 'https://ddragon.leagueoflegends.com/cdn/img/champion/loading/Teemo_0.jpg';
    }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Inter", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = themeColor;
    ctx.font = 'bold 16px "Inter", "Arial", sans-serif';
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 15);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    callback(texture);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 4, 4, canvas.width - 8, canvas.height - 8);
        
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(4, canvas.height - 64, canvas.width - 8, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, canvas.height - 36);
        
        ctx.fillStyle = themeColor;
        ctx.font = '500 12px "Inter", sans-serif';
        ctx.fillText(subtitle, canvas.width / 2, canvas.height - 16);
        
        texture.needsUpdate = true;
        if (onImageLoaded) onImageLoaded(img);
    };
    img.src = imageUrl;
}




function applyChampionTexture(mesh) {
    const type = mesh.userData.type;
    if (type && type.startsWith('lol_')) {
        createChampTexture(type, (texture) => {
            mesh.material.map = texture;
            mesh.material.needsUpdate = true;
        }, (img) => {
            const rimColor = type === 'lol_garen' ? 0xffd700 : (type === 'lol_yasuo' ? 0xb0bec5 : 0x8d6e63);
            try {
                const pedestalGeo = buildPedestalGeometry(type);
                const silhouetteGeo = generateSilhouetteGeometry(type, img, rimColor);
                const mergedGeo = mergeBufferGeometries([pedestalGeo, silhouetteGeo]);
                
                mesh.geometry.dispose();
                mesh.geometry = mergedGeo;
                rebuildWireEdges(mesh);
            } catch (e) {
                console.error("Failed to swap Garen/Teemo/Yasuo geometry:", e);
            }
        });
    }
}
function buildObjectStandeeGeometry(type) {
    const pedestal = buildPedestalGeometry(type);
    const info = STANDEE_INFO[type];
    
    let rimColor = 0xffd700;
    if (info) {
        rimColor = info.category === 'building' ? 0xb0bec5 : 0xcd7f32;
    }
    
    const pts = FIGURINE_OUTLINES[type];
    if (!pts) return pedestal;
    
    const figure = buildFigureGeo(pts, rimColor, 2.5);
    const merged = mergeBufferGeometries([pedestal, figure]);
    return merged;
}


function createObjectTexture(type, callback, onImageLoaded) {
    const info = STANDEE_INFO[type];
    if (!info) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    let grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    let title = info.label;
    let subtitle = info.sub;
    let themeColor = info.category === 'building' ? '#b0bec5' : (info.category === 'character' ? '#e040fb' : '#cd7f32');
    let imageUrl = `https://images.unsplash.com/${info.img}?auto=format&fit=crop&w=256&h=512&q=80`;
    
    if (info.category === 'building') {
        grad.addColorStop(0, '#37474f');
        grad.addColorStop(1, '#212121');
    } else if (info.category === 'character') {
        grad.addColorStop(0, '#4a148c');
        grad.addColorStop(1, '#1a0633');
    } else {
        grad.addColorStop(0, '#3e2723');
        grad.addColorStop(1, '#1a0c00');
    }
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    
    ctx.strokeStyle = themeColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(15, 15, canvas.width - 30, canvas.height - 30);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px "Inter", "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 20);
    
    ctx.fillStyle = themeColor;
    ctx.font = 'bold 14px "Inter", "Arial", sans-serif';
    ctx.fillText(subtitle, canvas.width / 2, canvas.height / 2 + 15);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.encoding = THREE.sRGBEncoding;
    callback(texture);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.drawImage(img, 4, 4, canvas.width - 8, canvas.height - 8);
        
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
        
        ctx.strokeStyle = themeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(4, canvas.height - 64, canvas.width - 8, 60);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 20px "Inter", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(title, canvas.width / 2, canvas.height - 36);
        
        ctx.fillStyle = themeColor;
        ctx.font = '500 11px "Inter", sans-serif';
        ctx.fillText(subtitle, canvas.width / 2, canvas.height - 16);
        
        texture.needsUpdate = true;
        if (onImageLoaded) onImageLoaded(img);
    };
    img.src = imageUrl;
}




function applyObjectTexture(mesh) {
    const type = mesh.userData.type;
    if (type && STANDEE_INFO[type]) {
        createObjectTexture(type, (texture) => {
            mesh.material.map = texture;
            mesh.material.needsUpdate = true;
        }, (img) => {
            const info = STANDEE_INFO[type];
            const rimColor = info.category === 'building' ? 0xb0bec5 : (info.category === 'character' ? 0xe040fb : 0xcd7f32);
            try {
                const pedestalGeo = buildPedestalGeometry(type);
                const silhouetteGeo = generateSilhouetteGeometry(type, img, rimColor);
                const mergedGeo = mergeBufferGeometries([pedestalGeo, silhouetteGeo]);
                
                mesh.geometry.dispose();
                mesh.geometry = mergedGeo;
                rebuildWireEdges(mesh);
            } catch (e) {
                console.error("Failed to swap object geometry:", e);
            }
        });
    }
}


function colorGeometrySkin(geo, skin, baseColorDefault = 0xffffff, fadeAxis = 'x') {
    const pos = geo.attributes.position;
    if (!pos) return;
    const count = pos.count;
    const colors = new Float32Array(count * 3);
    
    if (skin === 'fade') {
        let minVal = Infinity, maxVal = -Infinity;
        for (let i = 0; i < count; i++) {
            const val = fadeAxis === 'y' ? pos.getY(i) : pos.getX(i);
            if (val < minVal) minVal = val;
            if (val > maxVal) maxVal = val;
        }
        const range = maxVal - minVal || 1;
        
        for (let i = 0; i < count; i++) {
            const val = fadeAxis === 'y' ? pos.getY(i) : pos.getX(i);
            const t = (val - minVal) / range;
            let c;
            if (t < 0.5) {
                c = new THREE.Color(0xffd700).lerp(new THREE.Color(0xff1744), t * 2);
            } else {
                c = new THREE.Color(0xff1744).lerp(new THREE.Color(0x3f51b5), (t - 0.5) * 2);
            }
            colors[i*3] = c.r;
            colors[i*3+1] = c.g;
            colors[i*3+2] = c.b;
        }
    } 
    else if (skin === 'crimson') {
        const cRed = new THREE.Color(0xb71c1c);
        const cBlack = new THREE.Color(0x1a1a1a);
        for (let i = 0; i < count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const r = Math.sqrt(x*x + y*y);
            const theta = Math.atan2(y, x);
            const web = Math.sin(r * 0.4) > 0.94 || Math.sin(theta * 10) > 0.96;
            const c = web ? cBlack : cRed;
            colors[i*3] = c.r;
            colors[i*3+1] = c.g;
            colors[i*3+2] = c.b;
        }
    } 
    else if (skin === 'tiger') {
        const cGold = new THREE.Color(0xff9100);
        const cBlack = new THREE.Color(0x212121);
        for (let i = 0; i < count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const stripe = Math.sin(x * 0.35 + Math.sin(y * 0.4) * 2.5) > 0.72;
            const c = stripe ? cBlack : cGold;
            colors[i*3] = c.r;
            colors[i*3+1] = c.g;
            colors[i*3+2] = c.b;
        }
    } 
    else if (skin === 'damascus') {
        const cLight = new THREE.Color(0xd0d0d0);
        const cDark = new THREE.Color(0x424242);
        for (let i = 0; i < count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const wave = Math.sin(x * 0.7 + Math.sin(y * 0.6) * 3) * Math.cos(y * 0.7 + Math.sin(x * 0.6) * 3);
            const c = cDark.clone().lerp(cLight, (wave + 1) / 2);
            colors[i*3] = c.r;
            colors[i*3+1] = c.g;
            colors[i*3+2] = c.b;
        }
    } 
    else if (skin === 'asiimov') {
        const cWhite = new THREE.Color(0xeeeeee);
        const cOrange = new THREE.Color(0xff5722);
        const cBlack = new THREE.Color(0x212121);
        for (let i = 0; i < count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            let c = cWhite;
            if (Math.abs(x + y * 0.3) % 24 < 5) c = cOrange;
            else if (Math.abs(x - y * 0.2) % 32 < 3) c = cBlack;
            colors[i*3] = c.r;
            colors[i*3+1] = c.g;
            colors[i*3+2] = c.b;
        }
    } 
    else if (skin === 'lore') {
        const cGold = new THREE.Color(0xffd700);
        const cGreen = new THREE.Color(0x1b5e20);
        for (let i = 0; i < count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const edge = Math.abs(x * 0.1 + y * 0.05) % 15 < 2;
            const c = edge ? cGreen : cGold;
            colors[i*3] = c.r;
            colors[i*3+1] = c.g;
            colors[i*3+2] = c.b;
        }
    } 
    else {
        const c = new THREE.Color(baseColorDefault);
        for (let i = 0; i < count; i++) {
            colors[i*3] = c.r;
            colors[i*3+1] = c.g;
            colors[i*3+2] = c.b;
        }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

/* ════════════════════════════════════════
   BLENDER-LIKE MODELING & SNAPPING HELPERS
   ════════════════════════════════════════ */
function performFaceExtrude(mesh, faceIndex, depth) {
    if (!mesh || faceIndex === undefined || faceIndex === null) return;
    let geo = mesh.geometry;
    
    // Convert to non-indexed if indexed so vertices are not shared
    if (geo.index) {
        geo = geo.toNonIndexed();
        mesh.geometry.dispose();
        mesh.geometry = geo;
    }
    
    const posAttr = geo.attributes.position;
    const normalAttr = geo.attributes.normal;
    const colorAttr = geo.attributes.color;
    const uvAttr = geo.attributes.uv;
    
    if (!posAttr) return;
    
    const idx = faceIndex * 3;
    
    // Get the three vertices of the face
    const v0 = new THREE.Vector3(posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx));
    const v1 = new THREE.Vector3(posAttr.getX(idx + 1), posAttr.getY(idx + 1), posAttr.getZ(idx + 1));
    const v2 = new THREE.Vector3(posAttr.getX(idx + 2), posAttr.getY(idx + 2), posAttr.getZ(idx + 2));
    
    // Compute normal of the face
    const edge1 = new THREE.Vector3().subVectors(v1, v0);
    const edge2 = new THREE.Vector3().subVectors(v2, v0);
    const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
    
    // Extruded vertices
    const extOffset = normal.clone().multiplyScalar(depth);
    const ev0 = v0.clone().add(extOffset);
    const ev1 = v1.clone().add(extOffset);
    const ev2 = v2.clone().add(extOffset);
    
    // We will update the original face vertices to be the extruded vertices
    posAttr.setXYZ(idx, ev0.x, ev0.y, ev0.z);
    posAttr.setXYZ(idx + 1, ev1.x, ev1.y, ev1.z);
    posAttr.setXYZ(idx + 2, ev2.x, ev2.y, ev2.z);
    
    // Side faces (3 quads = 6 triangles = 18 vertices)
    // Quad 1: (v0, v1, ev1, ev0)
    // Quad 2: (v1, v2, ev2, ev1)
    // Quad 3: (v2, v0, ev0, ev2)
    const sideVerts = [
        v0, v1, ev1,
        v0, ev1, ev0,
        v1, v2, ev2,
        v1, ev2, ev1,
        v2, v0, ev0,
        v2, ev0, ev2
    ];
    
    // Duplicate colors
    let c0 = new THREE.Color(1, 1, 1), c1 = new THREE.Color(1, 1, 1), c2 = new THREE.Color(1, 1, 1);
    if (colorAttr) {
        c0.setRGB(colorAttr.getX(idx), colorAttr.getY(idx), colorAttr.getZ(idx));
        c1.setRGB(colorAttr.getX(idx + 1), colorAttr.getY(idx + 1), colorAttr.getZ(idx + 1));
        c2.setRGB(colorAttr.getX(idx + 2), colorAttr.getY(idx + 2), colorAttr.getZ(idx + 2));
    }
    
    const sideColors = [
        c0, c1, c1,
        c0, c1, c0,
        c1, c2, c2,
        c1, c2, c1,
        c2, c0, c0,
        c2, c0, c2
    ];
    
    // Duplicate UVs
    let uv0 = new THREE.Vector2(0, 0), uv1 = new THREE.Vector2(0, 0), uv2 = new THREE.Vector2(0, 0);
    if (uvAttr) {
        uv0.set(uvAttr.getX(idx), uvAttr.getY(idx));
        uv1.set(uvAttr.getX(idx + 1), uvAttr.getY(idx + 1));
        uv2.set(uvAttr.getX(idx + 2), uvAttr.getY(idx + 2));
    }
    
    const sideUVs = [
        uv0, uv1, uv1,
        uv0, uv1, uv0,
        uv1, uv2, uv2,
        uv1, uv2, uv1,
        uv2, uv0, uv0,
        uv2, uv0, uv2
    ];
    
    // Expand arrays
    const oldLen = posAttr.count;
    const newLen = oldLen + 18;
    
    const newPosArr = new Float32Array(newLen * 3);
    newPosArr.set(posAttr.array);
    for (let i = 0; i < 18; i++) {
        newPosArr[(oldLen + i) * 3]     = sideVerts[i].x;
        newPosArr[(oldLen + i) * 3 + 1] = sideVerts[i].y;
        newPosArr[(oldLen + i) * 3 + 2] = sideVerts[i].z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(newPosArr, 3));
    
    if (colorAttr) {
        const newColArr = new Float32Array(newLen * 3);
        newColArr.set(colorAttr.array);
        for (let i = 0; i < 18; i++) {
            newColArr[(oldLen + i) * 3]     = sideColors[i].r;
            newColArr[(oldLen + i) * 3 + 1] = sideColors[i].g;
            newColArr[(oldLen + i) * 3 + 2] = sideColors[i].b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(newColArr, 3));
    }
    
    if (uvAttr) {
        const newUvArr = new Float32Array(newLen * 2);
        newUvArr.set(uvAttr.array);
        for (let i = 0; i < 18; i++) {
            newUvArr[(oldLen + i) * 2]     = sideUVs[i].x;
            newUvArr[(oldLen + i) * 2 + 1] = sideUVs[i].y;
        }
        geo.setAttribute('uv', new THREE.BufferAttribute(newUvArr, 2));
    }
    
    posAttr.needsUpdate = true;
    if (colorAttr) colorAttr.needsUpdate = true;
    if (uvAttr) uvAttr.needsUpdate = true;
    
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    
    rebuildWireEdges(mesh);
    updateStats();
    saveHist('extrudeFace');
}

function performFaceInset(mesh, faceIndex, amount) {
    if (!mesh || faceIndex === undefined || faceIndex === null) return;
    let geo = mesh.geometry;
    
    if (geo.index) {
        geo = geo.toNonIndexed();
        mesh.geometry.dispose();
        mesh.geometry = geo;
    }
    
    const posAttr = geo.attributes.position;
    const colorAttr = geo.attributes.color;
    const uvAttr = geo.attributes.uv;
    
    if (!posAttr) return;
    
    const idx = faceIndex * 3;
    
    const v0 = new THREE.Vector3(posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx));
    const v1 = new THREE.Vector3(posAttr.getX(idx + 1), posAttr.getY(idx + 1), posAttr.getZ(idx + 1));
    const v2 = new THREE.Vector3(posAttr.getX(idx + 2), posAttr.getY(idx + 2), posAttr.getZ(idx + 2));
    
    const center = new THREE.Vector3().add(v0).add(v1).add(v2).multiplyScalar(1 / 3);
    const iv0 = new THREE.Vector3().lerpVectors(v0, center, amount);
    const iv1 = new THREE.Vector3().lerpVectors(v1, center, amount);
    const iv2 = new THREE.Vector3().lerpVectors(v2, center, amount);
    
    posAttr.setXYZ(idx, iv0.x, iv0.y, iv0.z);
    posAttr.setXYZ(idx + 1, iv1.x, iv1.y, iv1.z);
    posAttr.setXYZ(idx + 2, iv2.x, iv2.y, iv2.z);
    
    const sideVerts = [
        v0, v1, iv1,
        v0, iv1, iv0,
        v1, v2, iv2,
        v1, iv2, iv1,
        v2, v0, iv0,
        v2, iv0, iv2
    ];
    
    let c0 = new THREE.Color(1, 1, 1), c1 = new THREE.Color(1, 1, 1), c2 = new THREE.Color(1, 1, 1);
    if (colorAttr) {
        c0.setRGB(colorAttr.getX(idx), colorAttr.getY(idx), colorAttr.getZ(idx));
        c1.setRGB(colorAttr.getX(idx + 1), colorAttr.getY(idx + 1), colorAttr.getZ(idx + 1));
        c2.setRGB(colorAttr.getX(idx + 2), colorAttr.getY(idx + 2), colorAttr.getZ(idx + 2));
    }
    
    const sideColors = [
        c0, c1, c1,
        c0, c1, c0,
        c1, c2, c2,
        c1, c2, c1,
        c2, c0, c0,
        c2, c0, c2
    ];
    
    let uv0 = new THREE.Vector2(0, 0), uv1 = new THREE.Vector2(0, 0), uv2 = new THREE.Vector2(0, 0);
    if (uvAttr) {
        uv0.set(uvAttr.getX(idx), uvAttr.getY(idx));
        uv1.set(uvAttr.getX(idx + 1), uvAttr.getY(idx + 1));
        uv2.set(uvAttr.getX(idx + 2), uvAttr.getY(idx + 2));
    }
    
    const sideUVs = [
        uv0, uv1, uv1,
        uv0, uv1, uv0,
        uv1, uv2, uv2,
        uv1, uv2, uv1,
        uv2, uv0, uv0,
        uv2, uv0, uv2
    ];
    
    const oldLen = posAttr.count;
    const newLen = oldLen + 18;
    
    const newPosArr = new Float32Array(newLen * 3);
    newPosArr.set(posAttr.array);
    for (let i = 0; i < 18; i++) {
        newPosArr[(oldLen + i) * 3]     = sideVerts[i].x;
        newPosArr[(oldLen + i) * 3 + 1] = sideVerts[i].y;
        newPosArr[(oldLen + i) * 3 + 2] = sideVerts[i].z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(newPosArr, 3));
    
    if (colorAttr) {
        const newColArr = new Float32Array(newLen * 3);
        newColArr.set(colorAttr.array);
        for (let i = 0; i < 18; i++) {
            newColArr[(oldLen + i) * 3]     = sideColors[i].r;
            newColArr[(oldLen + i) * 3 + 1] = sideColors[i].g;
            newColArr[(oldLen + i) * 3 + 2] = sideColors[i].b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(newColArr, 3));
    }
    
    if (uvAttr) {
        const newUvArr = new Float32Array(newLen * 2);
        newUvArr.set(uvAttr.array);
        for (let i = 0; i < 18; i++) {
            newUvArr[(oldLen + i) * 2]     = sideUVs[i].x;
            newUvArr[(oldLen + i) * 2 + 1] = sideUVs[i].y;
        }
        geo.setAttribute('uv', new THREE.BufferAttribute(newUvArr, 2));
    }
    
    posAttr.needsUpdate = true;
    if (colorAttr) colorAttr.needsUpdate = true;
    if (uvAttr) uvAttr.needsUpdate = true;
    
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    
    rebuildWireEdges(mesh);
    updateStats();
    saveHist('insetFace');
}

function performFaceSubdivide(mesh, faceIndex) {
    if (!mesh || faceIndex === undefined || faceIndex === null) return;
    let geo = mesh.geometry;
    
    if (geo.index) {
        geo = geo.toNonIndexed();
        mesh.geometry.dispose();
        mesh.geometry = geo;
    }
    
    const posAttr = geo.attributes.position;
    const colorAttr = geo.attributes.color;
    const uvAttr = geo.attributes.uv;
    
    if (!posAttr) return;
    
    const idx = faceIndex * 3;
    
    const v0 = new THREE.Vector3(posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx));
    const v1 = new THREE.Vector3(posAttr.getX(idx + 1), posAttr.getY(idx + 1), posAttr.getZ(idx + 1));
    const v2 = new THREE.Vector3(posAttr.getX(idx + 2), posAttr.getY(idx + 2), posAttr.getZ(idx + 2));
    
    const center = new THREE.Vector3().add(v0).add(v1).add(v2).multiplyScalar(1 / 3);
    
    posAttr.setXYZ(idx, v0.x, v0.y, v0.z);
    posAttr.setXYZ(idx + 1, v1.x, v1.y, v1.z);
    posAttr.setXYZ(idx + 2, center.x, center.y, center.z);
    
    const newVerts = [
        v1, v2, center,
        v2, v0, center
    ];
    
    let c0 = new THREE.Color(1, 1, 1), c1 = new THREE.Color(1, 1, 1), c2 = new THREE.Color(1, 1, 1);
    if (colorAttr) {
        c0.setRGB(colorAttr.getX(idx), colorAttr.getY(idx), colorAttr.getZ(idx));
        c1.setRGB(colorAttr.getX(idx + 1), colorAttr.getY(idx + 1), colorAttr.getZ(idx + 1));
        c2.setRGB(colorAttr.getX(idx + 2), colorAttr.getY(idx + 2), colorAttr.getZ(idx + 2));
    }
    
    const cCenter = new THREE.Color().add(c0).add(c1).add(c2).multiplyScalar(1 / 3);
    if (colorAttr) {
        colorAttr.setXYZ(idx + 2, cCenter.r, cCenter.g, cCenter.b);
    }
    
    const newColors = [
        c1, c2, cCenter,
        c2, c0, cCenter
    ];
    
    let uv0 = new THREE.Vector2(0, 0), uv1 = new THREE.Vector2(0, 0), uv2 = new THREE.Vector2(0, 0);
    if (uvAttr) {
        uv0.set(uvAttr.getX(idx), uvAttr.getY(idx));
        uv1.set(uvAttr.getX(idx + 1), uvAttr.getY(idx + 1));
        uv2.set(uvAttr.getX(idx + 2), uvAttr.getY(idx + 2));
    }
    const uvCenter = new THREE.Vector2().add(uv0).add(uv1).add(uv2).multiplyScalar(1 / 3);
    if (uvAttr) {
        uvAttr.setXY(idx + 2, uvCenter.x, uvCenter.y);
    }
    
    const newUVs = [
        uv1, uv2, uvCenter,
        uv2, uv0, uvCenter
    ];
    
    const oldLen = posAttr.count;
    const newLen = oldLen + 6;
    
    const newPosArr = new Float32Array(newLen * 3);
    newPosArr.set(posAttr.array);
    for (let i = 0; i < 6; i++) {
        newPosArr[(oldLen + i) * 3]     = newVerts[i].x;
        newPosArr[(oldLen + i) * 3 + 1] = newVerts[i].y;
        newPosArr[(oldLen + i) * 3 + 2] = newVerts[i].z;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(newPosArr, 3));
    
    if (colorAttr) {
        const newColArr = new Float32Array(newLen * 3);
        newColArr.set(colorAttr.array);
        for (let i = 0; i < 6; i++) {
            newColArr[(oldLen + i) * 3]     = newColors[i].r;
            newColArr[(oldLen + i) * 3 + 1] = newColors[i].g;
            newColArr[(oldLen + i) * 3 + 2] = newColors[i].b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(newColArr, 3));
    }
    
    if (uvAttr) {
        const newUvArr = new Float32Array(newLen * 2);
        newUvArr.set(uvAttr.array);
        for (let i = 0; i < 6; i++) {
            newUvArr[(oldLen + i) * 2]     = newUVs[i].x;
            newUvArr[(oldLen + i) * 2 + 1] = newUVs[i].y;
        }
        geo.setAttribute('uv', new THREE.BufferAttribute(newUvArr, 2));
    }
    
    posAttr.needsUpdate = true;
    if (colorAttr) colorAttr.needsUpdate = true;
    if (uvAttr) uvAttr.needsUpdate = true;
    
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    
    rebuildWireEdges(mesh);
    updateStats();
    saveHist('subdivideFace');
}

function performFaceDelete(mesh, faceIndex) {
    if (!mesh || faceIndex === undefined || faceIndex === null) return;
    let geo = mesh.geometry;
    
    if (geo.index) {
        geo = geo.toNonIndexed();
        mesh.geometry.dispose();
        mesh.geometry = geo;
    }
    
    const posAttr = geo.attributes.position;
    const colorAttr = geo.attributes.color;
    const uvAttr = geo.attributes.uv;
    
    if (!posAttr) return;
    
    const oldLen = posAttr.count;
    if (oldLen <= 3) {
        toast('Hata: Son kalan yüzeyi silemezsiniz!', 'error');
        return;
    }
    
    const newLen = oldLen - 3;
    const idx = faceIndex * 3;
    
    const newPosArr = new Float32Array(newLen * 3);
    let dst = 0;
    for (let src = 0; src < oldLen; src++) {
        if (src >= idx && src < idx + 3) continue;
        newPosArr[dst * 3]     = posAttr.getX(src);
        newPosArr[dst * 3 + 1] = posAttr.getY(src);
        newPosArr[dst * 3 + 2] = posAttr.getZ(src);
        dst++;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(newPosArr, 3));
    
    if (colorAttr) {
        const newColArr = new Float32Array(newLen * 3);
        dst = 0;
        for (let src = 0; src < oldLen; src++) {
            if (src >= idx && src < idx + 3) continue;
            newColArr[dst * 3]     = colorAttr.getX(src);
            newColArr[dst * 3 + 1] = colorAttr.getY(src);
            newColArr[dst * 3 + 2] = colorAttr.getZ(src);
            dst++;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(newColArr, 3));
    }
    
    if (uvAttr) {
        const newUvArr = new Float32Array(newLen * 2);
        dst = 0;
        for (let src = 0; src < oldLen; src++) {
            if (src >= idx && src < idx + 3) continue;
            newUvArr[dst * 2]     = uvAttr.getX(src);
            newUvArr[dst * 2 + 1] = uvAttr.getY(src);
            dst++;
        }
        geo.setAttribute('uv', new THREE.BufferAttribute(newUvArr, 2));
    }
    
    posAttr.needsUpdate = true;
    if (colorAttr) colorAttr.needsUpdate = true;
    if (uvAttr) uvAttr.needsUpdate = true;
    
    geo.computeVertexNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();
    
    rebuildWireEdges(mesh);
    updateStats();
    saveHist('deleteFace');
}

function performFaceLocalBevel(mesh, faceIndex, depth, insetRatio = 0.25) {
    if (!mesh || faceIndex === undefined || faceIndex === null) return;
    performFaceInset(mesh, faceIndex, insetRatio);
    performFaceExtrude(mesh, faceIndex, depth);
    saveHist('bevelFace');
}

function performFaceLocalSmooth(mesh, faceIndex, factor = 0.5) {
    if (!mesh || faceIndex === undefined || faceIndex === null) return;
    const geo = mesh.geometry;
    const posAttr = geo.attributes.position;
    if (!posAttr) return;
    
    const idx = faceIndex * 3;
    const v0 = new THREE.Vector3(posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx));
    const v1 = new THREE.Vector3(posAttr.getX(idx + 1), posAttr.getY(idx + 1), posAttr.getZ(idx + 1));
    const v2 = new THREE.Vector3(posAttr.getX(idx + 2), posAttr.getY(idx + 2), posAttr.getZ(idx + 2));
    
    const center = new THREE.Vector3().add(v0).add(v1).add(v2).multiplyScalar(1 / 3);
    const radius = v0.distanceTo(center) * 2.0;
    
    const avg = new THREE.Vector3();
    let count = 0;
    for (let i = 0; i < posAttr.count; i++) {
        const v = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
        if (v.distanceTo(center) < radius) {
            avg.add(v);
            count++;
        }
    }
    if (count > 0) {
        avg.multiplyScalar(1 / count);
        for (let i = 0; i < posAttr.count; i++) {
            const v = new THREE.Vector3(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
            if (v.distanceTo(center) < radius) {
                v.lerp(avg, factor);
                posAttr.setXYZ(i, v.x, v.y, v.z);
            }
        }
        posAttr.needsUpdate = true;
        geo.computeVertexNormals();
        geo.computeBoundingBox();
        geo.computeBoundingSphere();
        rebuildWireEdges(mesh);
        updateStats();
        saveHist('smoothFaceLocal');
    }
}

function applySurfaceSnap(mesh) {
    if (!mesh || !APP.surfaceSnap) return;
    
    const box = new THREE.Box3().setFromObject(mesh);
    const bottomOffset = mesh.position.y - box.min.y;
    
    // Raycast down from object center
    const origin = new THREE.Vector3(mesh.position.x, 1000, mesh.position.z);
    const direction = new THREE.Vector3(0, -1, 0);
    const raycaster = new THREE.Raycaster(origin, direction);
    
    const targets = APP.objects.filter(obj => obj !== mesh && obj.visible);
    const intersections = raycaster.intersectObjects(targets, true);
    
    let highestY = 0;
    if (intersections.length > 0) {
        highestY = intersections[0].point.y;
    }
    
    const axis = APP.transform.axis;
    if (axis === 'Y' || axis === 'y') {
        if (mesh.position.y < highestY + bottomOffset) {
            mesh.position.y = highestY + bottomOffset;
        }
    } else {
        mesh.position.y = highestY + bottomOffset;
    }
}

function switchLeftTab(tabKey) {
    document.querySelectorAll('.lp-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.lp-content').forEach(c=>c.classList.remove('active'));
    
    const tabEl = document.querySelector(`.lp-tab[data-lpt="${tabKey}"]`);
    if (tabEl) tabEl.classList.add('active');
    
    const contentEl = el('lpt' + tabKey.charAt(0).toUpperCase() + tabKey.slice(1));
    if (contentEl) contentEl.classList.add('active');
}

function updateActiveToolUI(tool) {
    const sec = el('secActiveToolSettings');
    const cv = el('mainCanvas');
    if (cv) {
        if (tool === 'paint' || tool === 'sculpt' || tool === 'facePaint' || tool === 'extrudeFace' || tool === 'conformWarp' || tool === 'magicStitch') {
            cv.style.cursor = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'><circle cx='8' cy='8' r='5' stroke='%2358a6ff' stroke-width='2' fill='none'/></svg>") 8 8, crosshair`;
        } else {
            cv.style.cursor = 'default';
        }
    }
    if (!sec) return;
    
    el('optPaint').style.display = 'none';
    el('optFacePaint').style.display = 'none';
    el('optExtrudeFace').style.display = 'none';
    el('optSculpt').style.display = 'none';
    const optCW = el('optConformWarp');
    if (optCW) optCW.style.display = 'none';
    const optMS = el('optMagicStitch');
    if (optMS) optMS.style.display = 'none';
    
    if (tool === 'paint') {
        sec.style.display = 'block';
        el('optPaint').style.display = 'block';
        el('activeToolTitle').textContent = 'BOYA FIRÇASI AYARLARI';
    } else if (tool === 'facePaint') {
        sec.style.display = 'block';
        el('optFacePaint').style.display = 'block';
        el('activeToolTitle').textContent = 'YÜZEY BOYAMA AYARLARI';
    } else if (tool === 'extrudeFace') {
        sec.style.display = 'block';
        el('optExtrudeFace').style.display = 'block';
        el('activeToolTitle').textContent = 'YÜZEY UZATMA AYARLARI';
    } else if (tool === 'sculpt') {
        sec.style.display = 'block';
        el('optSculpt').style.display = 'block';
        el('activeToolTitle').textContent = 'YOĞURMA FIRÇASI AYARLARI';
    } else if (tool === 'conformWarp') {
        sec.style.display = 'block';
        if (optCW) optCW.style.display = 'block';
        el('activeToolTitle').textContent = 'YÜZEY BÜKÜCÜ & MIKNATISI';
    } else if (tool === 'magicStitch') {
        sec.style.display = 'block';
        if (optMS) optMS.style.display = 'block';
        el('activeToolTitle').textContent = 'SİHİRLİ DİKİŞ AYARLARI';
    } else {
        sec.style.display = 'none';
    }
    showInspector(APP.selected !== null);
}

function updateInspectorTabsVisibility() {
    const hasSel = APP.selected !== null;
    const isSketch = APP.mode === 'sketch';
    const isTool = APP.activeTool === 'paint' || APP.activeTool === 'sculpt' || APP.activeTool === 'facePaint' || APP.activeTool === 'extrudeFace' || APP.activeTool === 'conformWarp' || APP.activeTool === 'magicStitch';
    
    document.querySelectorAll('.rp-tab').forEach(tab => {
        const key = tab.dataset.rpt;
        if (key === 'draw') {
            tab.style.display = isSketch ? 'block' : 'none';
        } else if (key === 'toolopts') {
            tab.style.display = isTool ? 'block' : 'none';
        } else {
            tab.style.display = hasSel ? 'block' : 'none';
        }
    });
}

function updateViewportBadge() {
    const badge = el('vpBadge');
    if (!badge) return;
    if (APP.activeTool === 'paint') {
        badge.textContent = 'BOYA FIRÇASI MODU';
        badge.className = 'vp-badge edit-mode';
    } else if (APP.activeTool === 'facePaint') {
        badge.textContent = 'YÜZEY BOYAMA MODU';
        badge.className = 'vp-badge edit-mode';
    } else if (APP.activeTool === 'extrudeFace') {
        badge.textContent = 'YÜZEY UZATMA MODU';
        badge.className = 'vp-badge edit-mode';
    } else if (APP.activeTool === 'sculpt') {
        badge.textContent = 'YOĞURMA MODU';
        badge.className = 'vp-badge edit-mode';
    } else if (APP.activeTool === 'conformWarp') {
        badge.textContent = 'YÜZEY BÜKÜCÜ MODU';
        badge.className = 'vp-badge edit-mode';
    } else if (APP.activeTool === 'magicStitch') {
        badge.textContent = 'SİHİRLİ DİKİŞ MODU';
        badge.className = 'vp-badge edit-mode';
    } else {
        if (APP.mode === 'sketch') {
            badge.textContent = `ÇİZİM MODU · ${getToolLabel(APP.drawTool).toUpperCase()}`;
            badge.className = 'vp-badge draw-mode';
        } else if (APP.mode === 'edit') {
            badge.textContent = 'EDIT MODU';
            badge.className = 'vp-badge edit-mode';
        } else {
            badge.textContent = 'OBJE MODU';
            badge.className = 'vp-badge';
        }
    }
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

/* ════════════════════════════════════════
   CONFORM WARP ENGINE
   ════════════════════════════════════════ */
function populateConformTargetDropdown() {
    const dropdown = el('conformTarget');
    if (!dropdown) return;
    const currentVal = dropdown.value;
    dropdown.innerHTML = '<option value="">-- Otomatik Algıla --</option>';
    APP.objects.forEach(obj => {
        if (obj !== APP.selected) {
            const opt = document.createElement('option');
            opt.value = obj.userData.id;
            opt.textContent = obj.userData.name;
            dropdown.appendChild(opt);
        }
    });
    if (currentVal && APP.objects.some(o => o.userData.id === currentVal)) {
        dropdown.value = currentVal;
    }
}

function deactivateConformWarp() {
    if (APP.conformWarp) {
        APP.conformWarp.drawingCurve = false;
        APP.conformWarp.brushing = false;
        APP.conformWarp.isDrawing = false;
        APP.conformWarp.isBrushing = false;
    }
    const btnDraw = el('btnConformDrawCurve');
    if (btnDraw) btnDraw.classList.remove('active');
    const btnBrush = el('btnConformBrush');
    if (btnBrush) btnBrush.classList.remove('active');
    
    if (APP.conformWarp && APP.conformWarp.curvePreview) {
        APP.scene.remove(APP.conformWarp.curvePreview);
        APP.conformWarp.curvePreview.geometry.dispose();
        APP.conformWarp.curvePreview = null;
    }
    hideBrushHelper();
}

function getConformTargetMesh() {
    if (!APP.conformWarp) return null;
    let target = null;
    const targetId = el('conformTarget')?.value;
    if (targetId) {
        target = APP.objects.find(obj => obj.userData.id === targetId);
    }
    if (!target) {
        const otherObjects = APP.objects.filter(obj => obj !== APP.selected);
        const targetHits = APP.raycaster.intersectObjects(otherObjects, true);
        if (targetHits.length > 0) {
            target = targetHits[0].object;
        }
    }
    return target;
}

function interpolateVectorArray(array, u) {
    if (!array || array.length === 0) return new THREE.Vector3(0, 1, 0);
    if (array.length === 1) return array[0].clone();
    const indexFloat = u * (array.length - 1);
    const index = Math.floor(indexFloat);
    const fraction = indexFloat - index;
    if (index >= array.length - 1) return array[array.length - 1].clone();
    return new THREE.Vector3().lerpVectors(array[index], array[index + 1], fraction);
}

function updateConformCurvePreview() {
    if (!APP.conformWarp || !APP.conformWarp.curvePoints || APP.conformWarp.curvePoints.length < 2) {
        if (APP.conformWarp && APP.conformWarp.curvePreview) APP.conformWarp.curvePreview.visible = false;
        return;
    }
    
    const curve = new THREE.CatmullRomCurve3(APP.conformWarp.curvePoints);
    const points = curve.getPoints(50);
    const geom = new THREE.BufferGeometry().setFromPoints(points);
    
    if (!APP.conformWarp.curvePreview) {
        const mat = new THREE.LineBasicMaterial({
            color: 0x39c5cf,
            linewidth: 3,
            depthTest: false,
            transparent: true,
            opacity: 0.9
        });
        APP.conformWarp.curvePreview = new THREE.Line(geom, mat);
        APP.conformWarp.curvePreview.renderOrder = 999;
        APP.scene.add(APP.conformWarp.curvePreview);
    } else {
        APP.conformWarp.curvePreview.geometry.dispose();
        APP.conformWarp.curvePreview.geometry = geom;
        APP.conformWarp.curvePreview.visible = true;
    }
}

function clearConformWarp() {
    if (!APP.selected) return;
    
    if (APP.conformWarp) {
        APP.conformWarp.curvePoints = [];
        APP.conformWarp.curveNormals = [];
        if (APP.conformWarp.curvePreview) {
            APP.scene.remove(APP.conformWarp.curvePreview);
            APP.conformWarp.curvePreview.geometry.dispose();
            APP.conformWarp.curvePreview = null;
        }
    }
    
    if (APP.selected.userData.origPosition) {
        const geo = APP.selected.geometry;
        const pos = geo.attributes.position;
        if (pos) {
            pos.array.set(APP.selected.userData.origPosition);
            pos.needsUpdate = true;
            geo.computeVertexNormals();
            rebuildWireEdges(APP.selected);
        }
    }
    
    toast('✓ Eğri temizlendi ve obje orijinal haline döndürüldü.', 'info', 1500);
}

function deformSelectedObjectAlongCurve() {
    if (!APP.selected || !APP.conformWarp || !APP.conformWarp.curvePoints || APP.conformWarp.curvePoints.length < 2) return;
    
    const geo = APP.selected.geometry;
    const pos = geo.attributes.position;
    if (!pos) return;
    
    if (!APP.selected.userData.origPosition) {
        APP.selected.userData.origPosition = new Float32Array(pos.array);
    }
    const origArray = APP.selected.userData.origPosition;
    
    const axis = el('conformAxis')?.value || 'x';
    const count = pos.count;
    
    let minVal = Infinity;
    let maxVal = -Infinity;
    
    for (let i = 0; i < count; i++) {
        let val = 0;
        if (axis === 'x') val = origArray[i*3];
        else if (axis === 'y') val = origArray[i*3+1];
        else if (axis === 'z') val = origArray[i*3+2];
        
        if (val < minVal) minVal = val;
        if (val > maxVal) maxVal = val;
    }
    
    const length = maxVal - minVal;
    if (length < 0.0001) return;
    
    const curve = new THREE.CatmullRomCurve3(APP.conformWarp.curvePoints);
    
    for (let i = 0; i < count; i++) {
        const ox = origArray[i*3];
        const oy = origArray[i*3+1];
        const oz = origArray[i*3+2];
        
        let mainVal = 0;
        let perp1 = 0;
        let perp2 = 0;
        
        if (axis === 'x') {
            mainVal = ox;
            perp1 = oy;
            perp2 = oz;
        } else if (axis === 'y') {
            mainVal = oy;
            perp1 = ox;
            perp2 = oz;
        } else {
            mainVal = oz;
            perp1 = ox;
            perp2 = oy;
        }
        
        let u = (mainVal - minVal) / length;
        u = Math.min(1.0, Math.max(0.0, u));
        
        const curvePoint = curve.getPointAt(u);
        const tangent = curve.getTangentAt(u).normalize();
        
        let normal;
        if (APP.conformWarp.isBrushing && APP.conformWarp.curveNormals && APP.conformWarp.curveNormals.length > 0) {
            normal = interpolateVectorArray(APP.conformWarp.curveNormals, u).normalize();
        } else {
            normal = new THREE.Vector3(0, 1, 0).projectOnPlane(tangent).normalize();
            if (normal.lengthSq() < 0.001) {
                normal = new THREE.Vector3(0, 0, 1).projectOnPlane(tangent).normalize();
            }
        }
        normal.projectOnPlane(tangent).normalize();
        const binormal = new THREE.Vector3().crossVectors(tangent, normal).normalize();
        
        const deformedWorld = curvePoint.clone()
            .addScaledVector(normal, perp1)
            .addScaledVector(binormal, perp2);
            
        const localPos = APP.selected.worldToLocal(deformedWorld);
        pos.setXYZ(i, localPos.x, localPos.y, localPos.z);
    }
    
    pos.needsUpdate = true;
    geo.computeVertexNormals();
    rebuildWireEdges(APP.selected);
}

function performConformSnap() {
    if (!APP.selected) {
        toast('⚠️ Yapıştırılacak nesneyi seçmelisiniz!', 'warning', 2500);
        return;
    }
    
    const target = getConformTargetMesh();
    if (!target) {
        toast('⚠️ Yüzeyine yapışılacak hedef nesne bulunamadı!', 'warning', 2500);
        return;
    }
    
    const geo = APP.selected.geometry;
    const pos = geo.attributes.position;
    if (!pos) return;
    
    if (!APP.selected.userData.origPosition) {
        APP.selected.userData.origPosition = new Float32Array(pos.array);
    }
    const origArray = APP.selected.userData.origPosition;
    
    const volumePreserve = el('conformPreserveVolume')?.checked !== false;
    
    let minWorldY = Infinity;
    const tempV = new THREE.Vector3();
    const count = pos.count;
    
    for (let i = 0; i < count; i++) {
        tempV.set(origArray[i*3], origArray[i*3+1], origArray[i*3+2]);
        tempV.applyMatrix4(APP.selected.matrixWorld);
        if (tempV.y < minWorldY) minWorldY = tempV.y;
    }
    
    const otherObjects = [target];
    const tempRaycaster = new THREE.Raycaster();
    const rayDir = new THREE.Vector3(0, -1, 0);
    
    let hitCount = 0;
    
    for (let i = 0; i < count; i++) {
        tempV.set(origArray[i*3], origArray[i*3+1], origArray[i*3+2]);
        const origWorldPos = tempV.clone().applyMatrix4(APP.selected.matrixWorld);
        const height = origWorldPos.y - minWorldY;
        
        const rayOrigin = origWorldPos.clone();
        rayOrigin.y += 100;
        
        tempRaycaster.set(rayOrigin, rayDir);
        const hits = tempRaycaster.intersectObjects(otherObjects, true);
        
        if (hits.length > 0) {
            const hit = hits[0];
            const hitPoint = hit.point;
            
            let conformedWorld;
            if (volumePreserve) {
                const hitNormal = hit.face.normal.clone()
                    .applyMatrix3(new THREE.Matrix3().getNormalMatrix(target.matrixWorld))
                    .normalize();
                conformedWorld = hitPoint.clone().addScaledVector(hitNormal, height);
            } else {
                conformedWorld = hitPoint.clone();
            }
            
            const localPos = APP.selected.worldToLocal(conformedWorld);
            pos.setXYZ(i, localPos.x, localPos.y, localPos.z);
            hitCount++;
        } else {
            pos.setXYZ(i, origArray[i*3], origArray[i*3+1], origArray[i*3+2]);
        }
    }
    
    if (hitCount > 0) {
        pos.needsUpdate = true;
        geo.computeVertexNormals();
        rebuildWireEdges(APP.selected);
        saveHist('conformWarp');
        toast(`✓ ${hitCount} tepe noktası hedef yüzeye yapıştırıldı!`, 'success', 2000);
    } else {
        toast('⚠️ Hedef nesne üzerinde izdüşüm bulunamadı. Objeyi hedefin üzerine taşıyın.', 'warning', 3000);
    }
}


/* ════════════════════════════════════════
   MAGIC STITCH (SİHİRLİ DİKİŞ)
════════════════════════════════════════ */

/**
 * Clear all Magic Stitch state and helpers
 */
function clearMagicStitch() {
    if (!APP.magicStitch) return;
    // Remove preview spheres
    APP.magicStitch.previewHelpers.forEach(h => {
        APP.scene.remove(h);
        if (h.geometry) h.geometry.dispose();
        if (h.material) h.material.dispose();
    });
    APP.magicStitch.previewHelpers = [];
    
    // Remove bridge preview line
    if (APP.magicStitch.bridgePreview) {
        APP.scene.remove(APP.magicStitch.bridgePreview);
        if (APP.magicStitch.bridgePreview.geometry) APP.magicStitch.bridgePreview.geometry.dispose();
        if (APP.magicStitch.bridgePreview.material) APP.magicStitch.bridgePreview.material.dispose();
        APP.magicStitch.bridgePreview = null;
    }
    
    APP.magicStitch.groupA = [];
    APP.magicStitch.groupB = [];
    APP.magicStitch.pickingGroup = 'A';
    APP.magicStitch.flowPoints = [];
    APP.magicStitch.isDrawingFlow = false;
}

/**
 * Visualize selected vertex groups with colored spheres and a bridge preview line
 */
function updateStitchPreview() {
    const ms = APP.magicStitch;
    if (!APP.selected) return;
    const obj = APP.selected;
    const geo = obj.geometry;
    const pos = geo.attributes.position;
    
    // Clear old previews
    ms.previewHelpers.forEach(h => {
        APP.scene.remove(h);
        if (h.geometry) h.geometry.dispose();
        if (h.material) h.material.dispose();
    });
    ms.previewHelpers = [];
    
    if (ms.bridgePreview) {
        APP.scene.remove(ms.bridgePreview);
        if (ms.bridgePreview.geometry) ms.bridgePreview.geometry.dispose();
        if (ms.bridgePreview.material) ms.bridgePreview.material.dispose();
        ms.bridgePreview = null;
    }
    
    const createSphere = (idx, color) => {
        const sg = new THREE.SphereGeometry(0.08, 8, 8);
        const sm = new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.85 });
        const sphere = new THREE.Mesh(sg, sm);
        sphere.renderOrder = 9999;
        const lx = pos.getX(idx), ly = pos.getY(idx), lz = pos.getZ(idx);
        const wPos = new THREE.Vector3(lx, ly, lz).applyMatrix4(obj.matrixWorld);
        sphere.position.copy(wPos);
        APP.scene.add(sphere);
        ms.previewHelpers.push(sphere);
    };
    
    // Group A — green
    ms.groupA.forEach(idx => createSphere(idx, 0x3fb950));
    // Group B — orange
    ms.groupB.forEach(idx => createSphere(idx, 0xf0883e));
    
    // Draw a bridge preview line between group centers
    if (ms.groupA.length > 0 && ms.groupB.length > 0) {
        const centerA = new THREE.Vector3();
        const centerB = new THREE.Vector3();
        
        ms.groupA.forEach(idx => {
            centerA.add(new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx)));
        });
        centerA.divideScalar(ms.groupA.length).applyMatrix4(obj.matrixWorld);
        
        ms.groupB.forEach(idx => {
            centerB.add(new THREE.Vector3(pos.getX(idx), pos.getY(idx), pos.getZ(idx)));
        });
        centerB.divideScalar(ms.groupB.length).applyMatrix4(obj.matrixWorld);
        
        const lineGeo = new THREE.BufferGeometry().setFromPoints([centerA, centerB]);
        const lineMat = new THREE.LineDashedMaterial({
            color: 0x58a6ff, dashSize: 0.3, gapSize: 0.15, depthTest: false
        });
        const line = new THREE.Line(lineGeo, lineMat);
        line.computeLineDistances();
        line.renderOrder = 9998;
        APP.scene.add(line);
        ms.bridgePreview = line;
    }
}

/**
 * Sort vertices along a principal axis to form an ordered boundary chain
 */
function sortVerticesAlongAxis(vertexIndices, posAttr) {
    if (vertexIndices.length <= 2) return vertexIndices;
    
    const positions = vertexIndices.map(idx => ({
        idx,
        pos: new THREE.Vector3(posAttr.getX(idx), posAttr.getY(idx), posAttr.getZ(idx))
    }));
    
    // Find the principal axis using the spread/extent of vertices
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    positions.forEach(p => {
        min.min(p.pos);
        max.max(p.pos);
    });
    const extent = max.clone().sub(min);
    
    // Sort along the axis with the largest extent
    let sortAxis;
    if (extent.x >= extent.y && extent.x >= extent.z) sortAxis = 'x';
    else if (extent.y >= extent.x && extent.y >= extent.z) sortAxis = 'y';
    else sortAxis = 'z';
    
    positions.sort((a, b) => a.pos[sortAxis] - b.pos[sortAxis]);
    return positions.map(p => p.idx);
}

/**
 * Sample N evenly-spaced values from an array of vertex indices (for mismatched counts)
 */
function resampleVertexChain(vertexIndices, targetCount, posAttr) {
    if (vertexIndices.length === targetCount) return vertexIndices;
    if (vertexIndices.length === 0 || targetCount <= 0) return [];
    
    const result = [];
    for (let i = 0; i < targetCount; i++) {
        const t = vertexIndices.length <= 1 ? 0 : (i / (targetCount - 1)) * (vertexIndices.length - 1);
        const idx = Math.min(Math.round(t), vertexIndices.length - 1);
        result.push(vertexIndices[idx]);
    }
    return result;
}

/**
 * Perform Magic Stitch: bridge two vertex groups with new quad/tri geometry
 */
function performMagicStitch() {
    const ms = APP.magicStitch;
    if (!APP.selected) {
        toast('⚠️ Lütfen önce bir mesh seçin.', 'warning', 2000);
        return;
    }
    if (ms.groupA.length === 0 || ms.groupB.length === 0) {
        toast('⚠️ İki kenar grubu da seçilmeli. Mesh üzerinde iki bölgeye tıklayın.', 'warning', 2500);
        return;
    }
    
    const obj = APP.selected;
    const geo = obj.geometry;
    const pos = geo.attributes.position;
    const segments = parseInt(el('stitchSegments')?.value) || 6;
    const preferQuads = el('stitchQuadPref')?.checked !== false;
    const autoReduce = el('stitchAutoReduce')?.checked !== false;
    const mode = el('stitchMode')?.value || 'bridge';
    
    // Sort vertex groups along their principal axis
    let chainA = sortVerticesAlongAxis([...ms.groupA], pos);
    let chainB = sortVerticesAlongAxis([...ms.groupB], pos);
    
    const countA = chainA.length;
    const countB = chainB.length;
    
    // Determine the max resolution
    const maxCount = Math.max(countA, countB);
    const minCount = Math.min(countA, countB);
    
    // Resample chains to have equal vertex count for quad bridging
    let workingA, workingB;
    if (autoReduce && countA !== countB) {
        // Resample shorter chain to match longer one
        if (countA > countB) {
            workingA = chainA;
            workingB = resampleVertexChain(chainB, countA, pos);
        } else {
            workingA = resampleVertexChain(chainA, countB, pos);
            workingB = chainB;
        }
    } else {
        // Without auto-reduce, use min count for both
        const useCount = minCount;
        workingA = resampleVertexChain(chainA, useCount, pos);
        workingB = resampleVertexChain(chainB, useCount, pos);
    }
    
    const bridgeCount = workingA.length;
    if (bridgeCount < 2) {
        toast('⚠️ En az 2 vertex olmalı. Yarıçapı artırın.', 'warning', 2000);
        return;
    }
    
    // Get existing vertex positions  
    const oldVertCount = pos.count;
    const oldPositions = [];
    for (let i = 0; i < oldVertCount; i++) {
        oldPositions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    
    // Generate intermediate points for segments > 1
    const newPositions = [];
    const rows = []; // each row is an array of global vertex indices
    
    // Row 0 = chain A vertices (already exist)
    rows.push(workingA.slice());
    
    // Intermediate rows (new vertices)
    if (mode === 'bridge' && segments > 1) {
        for (let s = 1; s < segments; s++) {
            const t = s / segments;
            const row = [];
            for (let i = 0; i < bridgeCount; i++) {
                const ai = workingA[i];
                const bi = workingB[i];
                const ax = pos.getX(ai), ay = pos.getY(ai), az = pos.getZ(ai);
                const bx = pos.getX(bi), by = pos.getY(bi), bz = pos.getZ(bi);
                // Linear interpolation (with slight sag for organic feel)
                const mx = ax + (bx - ax) * t;
                const my = ay + (by - ay) * t;
                const mz = az + (bz - az) * t;
                
                const newIdx = oldVertCount + newPositions.length / 3;
                newPositions.push(mx, my, mz);
                row.push(newIdx);
            }
            rows.push(row);
        }
    }
    
    // Last row = chain B vertices (already exist)
    rows.push(workingB.slice());
    
    // Build new index buffer with bridging faces
    const oldIndex = geo.index;
    const existingIndices = [];
    if (oldIndex) {
        for (let i = 0; i < oldIndex.count; i++) {
            existingIndices.push(oldIndex.getX(i));
        }
    }
    
    const newIndices = [...existingIndices];
    
    // Create faces between consecutive rows
    for (let r = 0; r < rows.length - 1; r++) {
        const topRow = rows[r];
        const botRow = rows[r + 1];
        const rowLen = Math.min(topRow.length, botRow.length);
        
        for (let i = 0; i < rowLen - 1; i++) {
            const a = topRow[i];     // top-left
            const b = topRow[i + 1]; // top-right
            const c = botRow[i + 1]; // bottom-right
            const d = botRow[i];     // bottom-left
            
            if (preferQuads) {
                // Two triangles forming a quad: a-b-c and a-c-d
                newIndices.push(a, b, c);
                newIndices.push(a, c, d);
            } else {
                // Just triangles
                newIndices.push(a, b, d);
                newIndices.push(b, c, d);
            }
        }
    }
    
    // Rebuild the position buffer if we have new vertices
    if (newPositions.length > 0) {
        const allPositions = new Float32Array(oldPositions.length + newPositions.length);
        allPositions.set(new Float32Array(oldPositions));
        allPositions.set(new Float32Array(newPositions), oldPositions.length);
        geo.setAttribute('position', new THREE.BufferAttribute(allPositions, 3));
        
        // Extend normal buffer
        const oldNormals = geo.attributes.normal;
        if (oldNormals) {
            const newNormalsArr = new Float32Array(allPositions.length);
            for (let i = 0; i < oldNormals.count * 3; i++) {
                newNormalsArr[i] = oldNormals.array[i];
            }
            geo.setAttribute('normal', new THREE.BufferAttribute(newNormalsArr, 3));
        }
        
        // Extend color buffer if exists
        const oldColors = geo.attributes.color;
        if (oldColors) {
            const newColorsArr = new Float32Array(allPositions.length);
            const defaultColor = [0.8, 0.8, 0.8]; // Default gray
            for (let i = 0; i < oldColors.count * 3; i++) {
                newColorsArr[i] = oldColors.array[i];
            }
            for (let i = oldColors.count * 3; i < newColorsArr.length; i += 3) {
                newColorsArr[i] = defaultColor[0];
                newColorsArr[i + 1] = defaultColor[1];
                newColorsArr[i + 2] = defaultColor[2];
            }
            geo.setAttribute('color', new THREE.BufferAttribute(newColorsArr, 3));
        }
    }
    
    // Set new index buffer
    geo.setIndex(new THREE.BufferAttribute(new Uint32Array(newIndices), 1));
    
    // Recompute
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    geo.attributes.position.needsUpdate = true;
    if (geo.attributes.normal) geo.attributes.normal.needsUpdate = true;
    if (geo.attributes.color) geo.attributes.color.needsUpdate = true;
    
    // Cache updated positions for undo
    const newPos = geo.attributes.position;
    const origArr = new Float32Array(newPos.count * 3);
    for (let i = 0; i < newPos.count; i++) {
        origArr[i * 3] = newPos.getX(i);
        origArr[i * 3 + 1] = newPos.getY(i);
        origArr[i * 3 + 2] = newPos.getZ(i);
    }
    obj.userData.origPosition = origArr;
    
    // Rebuild wireframe
    if (typeof rebuildWireEdges === 'function') rebuildWireEdges(obj);
    
    // Save history
    if (typeof saveHist === 'function') saveHist('magicStitch');
    
    const faceCount = (newIndices.length - existingIndices.length) / 3;
    const newVertCount = newPositions.length / 3;
    
    // Clean up preview
    clearMagicStitch();
    updateStitchPreview();
    
    toast(`🧵 Dikiş tamamlandı! ${faceCount} yeni yüzey, ${newVertCount} yeni vertex oluşturuldu.`, 'success', 3000);
    
    // Update info panel
    if (typeof updateInfoPanel === 'function') updateInfoPanel();
}

// Magic Stitch button bindings
document.addEventListener('DOMContentLoaded', () => {
    const btnApply = document.getElementById('btnStitchApply');
    const btnClear = document.getElementById('btnStitchClear');
    
    if (btnApply) {
        btnApply.addEventListener('click', () => {
            performMagicStitch();
        });
    }
    
    if (btnClear) {
        btnClear.addEventListener('click', () => {
            clearMagicStitch();
            toast('🧹 Dikiş seçimleri temizlendi.', 'info', 1500);
        });
    }
});


// Delayed init
setTimeout(()=>{saveHist('init');updateUndoRedo();},300);
