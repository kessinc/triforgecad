<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TriForge CAD Pro 3.0</title>
    <link rel="stylesheet" href="style.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/TransformControls.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/BufferGeometryUtils.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/STLExporter.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/exporters/OBJExporter.js"></script>
</head>
<body>

<!-- ═══════════ MENUBAR ═══════════ -->
<div id="menubar">
    <div class="mb-logo">
        <svg width="22" height="22" viewBox="0 0 32 32"><defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#58a6ff"/><stop offset="100%" style="stop-color:#bc8cff"/></linearGradient></defs><polygon points="16,2 30,10 30,22 16,30 2,22 2,10" stroke="url(#lg)" stroke-width="1.5" fill="none"/><circle cx="16" cy="16" r="3" fill="url(#lg)"/></svg>
        <span class="mb-title">TriForge <strong>CAD</strong> <span class="mb-ver">Pro 3.0</span></span>
    </div>

    <div class="mb-groups">
        <!-- File -->
        <div class="mb-group">
            <span class="mb-group-label">Dosya</span>
            <div class="mb-btns">
                <button class="mb-btn" id="mbNew" title="Yeni Sahne Ctrl+N"><span class="mbi">📄</span>Yeni</button>
                <button class="mb-btn" id="mbSave" title="Kaydet Ctrl+S"><span class="mbi">💾</span>Kaydet</button>
                <button class="mb-btn" id="mbSaveAs" title="Farklı Kaydet Ctrl+Shift+S"><span class="mbi">💾✍️</span>Farklı Kaydet</button>
                <button class="mb-btn" id="mbLoad" title="Proje Yükle"><span class="mbi">📂</span>Aç</button>
            </div>
        </div>
        <div class="mb-sep"></div>
        <!-- Edit -->
        <div class="mb-group">
            <span class="mb-group-label">Düzenle</span>
            <div class="mb-btns">
                <button class="mb-btn" id="mbUndo" disabled title="Geri Al Ctrl+Z"><span class="mbi">↩</span>Geri</button>
                <button class="mb-btn" id="mbRedo" disabled title="İleri Al Ctrl+Y"><span class="mbi">↪</span>İleri</button>
                <button class="mb-btn" id="mbDup" title="Kopyala Ctrl+D"><span class="mbi">⧉</span>Kopyala</button>
                <button class="mb-btn mb-danger" id="mbDel" title="Sil Del"><span class="mbi">🗑</span>Sil</button>
            </div>
        </div>
        <div class="mb-sep"></div>
        <!-- Transform Tools -->
        <div class="mb-group">
            <span class="mb-group-label">Araç</span>
            <div class="mb-btns tool-group">
                <button class="mb-btn tool-btn active" id="tbSel" data-tool="select" title="Seç Q">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-2.154 1.054-4.329-8.83-6.891 3.396z"/></svg>
                    Seç <kbd>Q</kbd>
                </button>
                <button class="mb-btn tool-btn" id="tbMove" data-tool="translate" title="Taşı W">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
                    Taşı <kbd>W</kbd>
                </button>
                <button class="mb-btn tool-btn" id="tbRot" data-tool="rotate" title="Döndür E">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-.49-4.06"/></svg>
                    Döndür <kbd>E</kbd>
                </button>
                <button class="mb-btn tool-btn" id="tbScl" data-tool="scale" title="Ölçekle R">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                    Ölçek <kbd>R</kbd>
                </button>
            </div>
        </div>
        <div class="mb-sep"></div>
        <!-- Modes -->
        <div class="mb-group">
            <span class="mb-group-label">Mod</span>
            <div class="mb-btns">
                <button class="mb-btn mode-btn active" id="mbModeObj" title="Obje Modu Tab">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                    Obje
                </button>
                <button class="mb-btn mode-btn" id="mbModeEdit" title="Edit Modu Tab">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    Edit
                </button>
                <button class="mb-btn mode-btn" id="mbModeSketch" title="Çizim Modu Ctrl+K">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>
                    Çizim
                </button>
            </div>
        </div>
        <div class="mb-sep"></div>
        <!-- Snap & Space -->
        <div class="mb-group">
            <span class="mb-group-label">Snap</span>
            <div class="mb-btns">
                <label class="snap-toggle-btn" title="Hizalama Aktif/Kapalı">
                    <input type="checkbox" id="snapChk">
                    <span class="snap-toggle-inner">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        Snap
                    </span>
                </label>
                <select id="snapVal" class="snap-sel-inline">
                    <option value="0.1">0.1mm</option>
                    <option value="0.5">0.5mm</option>
                    <option value="1" selected>1mm</option>
                    <option value="2">2mm</option>
                    <option value="5">5mm</option>
                    <option value="10">10mm</option>
                    <option value="25">25mm</option>
                </select>
                <div class="space-toggle-grp">
                    <button class="space-tb active" id="spWorld">Dünya</button>
                    <button class="space-tb" id="spLocal">Yerel</button>
                </div>
            </div>
        </div>
        <div class="mb-sep"></div>
        <!-- Export -->
        <div class="mb-group">
            <span class="mb-group-label">Aktar</span>
            <div class="mb-btns">
                <button class="mb-btn mb-blue" id="mbSTL" title="STL Aktar"><span class="mbi">⬇</span>STL</button>
                <button class="mb-btn mb-purple" id="mbOBJ" title="OBJ Aktar"><span class="mbi">⬇</span>OBJ</button>
            </div>
        </div>
        <div class="mb-sep"></div>
        <!-- View -->
        <div class="mb-group">
            <span class="mb-group-label">Görünüm</span>
            <div class="mb-btns">
                <button class="vp-tb active" id="vpPersp">Persp</button>
                <button class="vp-tb" id="vpTop">Üst</button>
                <button class="vp-tb" id="vpFront">Ön</button>
                <button class="vp-tb" id="vpRight">Sağ</button>
                <button class="vp-tb" id="vpLeft">Sol</button>
                <button class="vp-tb" id="vpBottom">Alt</button>
            </div>
        </div>
    </div>

    <!-- Stats far right -->
    <div class="mb-stats">
        <div class="mbs-item"><span class="mbs-l">OBJ</span><span class="mbs-v" id="sObj">0</span></div>
        <div class="mbs-item"><span class="mbs-l">VERT</span><span class="mbs-v" id="sVert">0</span></div>
        <div class="mbs-item"><span class="mbs-l">FACE</span><span class="mbs-v" id="sFace">0</span></div>
        <div class="mbs-item"><span class="mbs-l">FPS</span><span class="mbs-v" id="sFps">--</span></div>
    </div>
</div>

<!-- ═══════════ MAIN WORKSPACE ═══════════ -->
<div id="workspace">

    <!-- LEFT TOOLBAR (icon strip, like Blender) -->
    <div id="leftTools">
        <!-- 3D Tools -->
        <div class="lt-group">
            <button class="lt-btn active" id="ltSel" data-tool="select" title="Seç (Q)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 0l16 12.279-6.951 1.17 4.325 8.817-2.154 1.054-4.329-8.83-6.891 3.396z"/></svg>
            </button>
            <button class="lt-btn" id="ltMove" data-tool="translate" title="Taşı (W)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/></svg>
            </button>
            <button class="lt-btn" id="ltRot" data-tool="rotate" title="Döndür (E)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 1 1-.49-4.06"/></svg>
            </button>
            <button class="lt-btn" id="ltScl" data-tool="scale" title="Ölçekle (R)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
            </button>
        </div>
        <div class="lt-divider"></div>
        <!-- Draw Tools (visible in sketch mode) -->
        <div class="lt-group" id="drawToolsGroup">
            <button class="lt-btn draw-btn" id="dtLine" data-dt="line" title="Çizgi (L)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="19" x2="19" y2="5"/></svg>
            </button>
            <button class="lt-btn draw-btn" id="dtRect" data-dt="rect" title="Dikdörtgen (Rect)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
            </button>
            <button class="lt-btn draw-btn" id="dtCircle" data-dt="circle" title="Çember (C)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/></svg>
            </button>
            <button class="lt-btn draw-btn" id="dtEllipse" data-dt="ellipse" title="Elips">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="10" ry="6"/></svg>
            </button>
            <button class="lt-btn draw-btn" id="dtTriangle" data-dt="triangle" title="Üçgen">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,3 22,21 2,21"/></svg>
            </button>
            <button class="lt-btn draw-btn" id="dtPoly" data-dt="poly" title="Çokgen (P)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,3 21,8 21,16 12,21 3,16 3,8"/></svg>
            </button>
            <button class="lt-btn draw-btn" id="dtStar" data-dt="star" title="Yıldız">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
            </button>
            <button class="lt-btn draw-btn" id="dtArc" data-dt="arc" title="Yay">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 19A9 9 0 1 1 19 5"/></svg>
            </button>
            <button class="lt-btn draw-btn" id="dtSpline" data-dt="spline" title="Serbest Çizgi">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 19c3-5 5-9 7-11s3-1 5 1 3 5 6 5"/></svg>
            </button>
            <button class="lt-btn draw-btn" id="dtText" data-dt="text3d" title="3D Metin">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4,7 4,4 20,4 20,7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
            </button>
        </div>
        <div class="lt-divider"></div>
        <!-- Measurement -->
        <div class="lt-group">
            <button class="lt-btn" id="ltMeasure" title="Ölçüm Aracı (M)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="8" x2="4" y2="16"/><line x1="20" y1="8" x2="20" y2="16"/></svg>
            </button>
            <button class="lt-btn" id="ltFocus" title="Odaklan (F)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M3 3l4 4M17 3l4 4M3 21l4-4M17 21l4-4"/></svg>
            </button>
        </div>
    </div>

    <!-- LEFT PANEL (collapsible sections) -->
    <aside id="leftPanel">
        <!-- Panel tabs -->
        <div class="lp-tabs">
            <button class="lp-tab active" data-lpt="shapes">Şekiller</button>
            <button class="lp-tab" data-lpt="terrain">Arazi</button>
            <button class="lp-tab" data-lpt="ops">İşlem</button>
            <button class="lp-tab" data-lpt="scene">Sahne</button>
            <button class="lp-tab" data-lpt="draw">Çizim</button>
        </div>

        <!-- ─── SHAPES TAB ─── -->
        <div class="lp-content active" id="lptShapes">

            <!-- Collapsible section: Basic -->
            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="basic">
                    <span>TEMEL PRİMİTİFLER</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secBasic">
                    <div class="shp-grid">
                        <button class="shp" data-s="box"><svg viewBox="0 0 36 36" fill="none" stroke="#58a6ff" stroke-width="1.4"><path d="M18 4L32 11V25L18 32L4 25V11Z"/><path d="M18 4L18 18M32 11L18 18M4 11L18 18" stroke-dasharray="2,2" opacity="0.5"/></svg>Küp</button>
                        <button class="shp" data-s="cylinder"><svg viewBox="0 0 36 36" fill="none" stroke="#58a6ff" stroke-width="1.4"><ellipse cx="18" cy="10" rx="11" ry="4.5"/><ellipse cx="18" cy="26" rx="11" ry="4.5"/><line x1="7" y1="10" x2="7" y2="26"/><line x1="29" y1="10" x2="29" y2="26"/></svg>Silindir</button>
                        <button class="shp" data-s="sphere"><svg viewBox="0 0 36 36" fill="none" stroke="#58a6ff" stroke-width="1.4"><circle cx="18" cy="18" r="13"/><ellipse cx="18" cy="18" rx="13" ry="5" stroke-dasharray="2,2" opacity="0.5"/><ellipse cx="18" cy="18" rx="5" ry="13" opacity="0.6"/></svg>Küre</button>
                        <button class="shp" data-s="cone"><svg viewBox="0 0 36 36" fill="none" stroke="#58a6ff" stroke-width="1.4"><path d="M18 4L30 28L6 28Z"/><ellipse cx="18" cy="28" rx="12" ry="3.5"/></svg>Koni</button>
                        <button class="shp" data-s="torus"><svg viewBox="0 0 36 36" fill="none" stroke="#58a6ff" stroke-width="1.4"><ellipse cx="18" cy="18" rx="12" ry="5.5"/><ellipse cx="18" cy="18" rx="6" ry="2.5" stroke-dasharray="2,2" opacity="0.5"/></svg>Torus</button>
                        <button class="shp" data-s="plane"><svg viewBox="0 0 36 36" fill="none" stroke="#58a6ff" stroke-width="1.4"><path d="M4 26L18 18L32 26L18 34Z"/></svg>Düzlem</button>
                        <button class="shp" data-s="capsule"><svg viewBox="0 0 36 36" fill="none" stroke="#58a6ff" stroke-width="1.4"><rect x="11" y="12" width="14" height="12" rx="7"/><ellipse cx="18" cy="12" rx="7" ry="4.5"/><ellipse cx="18" cy="24" rx="7" ry="4.5"/></svg>Kapsül</button>
                        <button class="shp" data-s="pyramid"><svg viewBox="0 0 36 36" fill="none" stroke="#58a6ff" stroke-width="1.4"><path d="M18 5L31 28L5 28Z"/><rect x="5" y="26" width="26" height="3" rx="1"/></svg>Piramit</button>
                    </div>
                </div>
            </div>

            <!-- Collapsible: Advanced -->
            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="adv">
                    <span>GELİŞMİŞ FORMLAR</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secAdv">
                    <div class="shp-grid">
                        <button class="shp" data-s="tube"><svg viewBox="0 0 36 36" fill="none" stroke="#80deea" stroke-width="1.4"><ellipse cx="18" cy="10" rx="11" ry="4.5"/><ellipse cx="18" cy="10" rx="6" ry="2.5" opacity="0.5"/><ellipse cx="18" cy="26" rx="11" ry="4.5"/><ellipse cx="18" cy="26" rx="6" ry="2.5" opacity="0.5"/><line x1="7" y1="10" x2="7" y2="26"/><line x1="29" y1="10" x2="29" y2="26"/></svg>Boru</button>
                        <button class="shp" data-s="ring"><svg viewBox="0 0 36 36" fill="none" stroke="#80deea" stroke-width="1.4"><circle cx="18" cy="18" r="12"/><circle cx="18" cy="18" r="6"/></svg>Halka</button>
                        <button class="shp" data-s="octa"><svg viewBox="0 0 36 36" fill="none" stroke="#b39ddb" stroke-width="1.4"><path d="M18 4L30 18L18 32L6 18Z"/><path d="M6 18L18 12L30 18L18 24Z" opacity="0.6"/></svg>Okta</button>
                        <button class="shp" data-s="dodeca"><svg viewBox="0 0 36 36" fill="none" stroke="#f48fb1" stroke-width="1.4"><polygon points="18,5 29,12 29,24 18,31 7,24 7,12" fill="rgba(244,143,177,0.06)"/></svg>Dodeka</button>
                        <button class="shp" data-s="icosa"><svg viewBox="0 0 36 36" fill="none" stroke="#a5d6a7" stroke-width="1.4"><path d="M18 4L30 14L26 28L10 28L6 14Z"/><path d="M18 4L6 14M18 4L30 14M6 14L10 28M30 14L26 28M10 28L26 28" opacity="0.5"/></svg>İkosa</button>
                        <button class="shp" data-s="tetra"><svg viewBox="0 0 36 36" fill="none" stroke="#ffd740" stroke-width="1.4"><path d="M18 5L30 28L6 28Z"/><line x1="18" y1="5" x2="18" y2="28" stroke-dasharray="2,2"/></svg>Tetra</button>
                        <button class="shp" data-s="spring"><svg viewBox="0 0 36 36" fill="none" stroke="#69f0ae" stroke-width="1.4"><path d="M8 30 Q24 26 8 22 Q24 18 8 14 Q24 10 8 6"/></svg>Yay</button>
                        <button class="shp" data-s="arrow"><svg viewBox="0 0 36 36" fill="none" stroke="#ffab91" stroke-width="1.4"><path d="M6 18H24M20 10L30 18L20 26"/><rect x="5" y="15" width="14" height="6" rx="1"/></svg>Ok</button>
                        <button class="shp" data-s="prism"><svg viewBox="0 0 36 36" fill="none" stroke="#80cbc4" stroke-width="1.4"><path d="M18 6L4 28L32 28Z"/><path d="M18 6L18 6" /><line x1="4" y1="28" x2="32" y2="28"/></svg>Prizma</button>
                    </div>
                </div>
            </div>

            <!-- Collapsible: Architectural -->
            <div class="lp-sec">
                <button class="lp-sec-hdr collapsed" data-sec="arch">
                    <span>MİMARİ / ENDÜSTRİYEL</span>
                    <span class="sec-arrow">▸</span>
                </button>
                <div class="lp-sec-body collapsed" id="secArch">
                    <div class="shp-grid">
                        <button class="shp" data-s="cylinder" title="L-Profil"><svg viewBox="0 0 36 36" fill="none" stroke="#90caf9" stroke-width="1.4"><path d="M8 6L8 28L28 28"/><path d="M8 6L14 6L14 22L28 22M8 14L14 14"/></svg>L-Profil</button>
                        <button class="shp" data-s="box" title="T-Profil"><svg viewBox="0 0 36 36" fill="none" stroke="#90caf9" stroke-width="1.4"><rect x="4" y="6" width="28" height="6" rx="1"/><rect x="13" y="12" width="10" height="18" rx="1"/></svg>T-Profil</button>
                        <button class="shp" data-s="box" title="U-Kanal"><svg viewBox="0 0 36 36" fill="none" stroke="#90caf9" stroke-width="1.4"><path d="M8 6L8 28L28 28L28 6M8 6L14 6M22 6L28 6"/></svg>U-Kanal</button>
                        <button class="shp" data-s="box" title="Vida (Bolt)"><svg viewBox="0 0 36 36" fill="none" stroke="#90caf9" stroke-width="1.4"><polygon points="18,6 26,10 26,14 18,18 10,14 10,10"/><rect x="15" y="18" width="6" height="14" rx="2"/></svg>Vida</button>
                        <button class="shp" data-s="torus" title="Somun"><svg viewBox="0 0 36 36" fill="none" stroke="#90caf9" stroke-width="1.4"><polygon points="18,8 26,13 26,23 18,28 10,23 10,13"/><circle cx="18" cy="18" r="5"/></svg>Somun</button>
                        <button class="shp" data-s="cylinder" title="Flanş"><svg viewBox="0 0 36 36" fill="none" stroke="#90caf9" stroke-width="1.4"><ellipse cx="18" cy="20" rx="14" ry="6"/><ellipse cx="18" cy="14" rx="6" ry="3"/><line x1="12" y1="14" x2="12" y2="20"/><line x1="24" y1="14" x2="24" y2="20"/></svg>Flanş</button>
                    </div>
                </div>
            </div>

            <!-- Collapsible: Game Low-Poly -->
            <div class="lp-sec">
                <button class="lp-sec-hdr collapsed" data-sec="game">
                    <span>OYUN GEOMETRİLERİ (LOW-POLY)</span>
                    <span class="sec-arrow">▸</span>
                </button>
                <div class="lp-sec-body collapsed" id="secGame">
                    <!-- Sub-category: Karakter & Yapılar -->
                    <div class="game-subcat-title">🏠 Yapılar & Karakter</div>
                    <div class="shp-grid">
                        <button class="shp" data-s="mannequin" title="Karakter Şablonu"><svg viewBox="0 0 36 36" fill="none" stroke="#f48fb1" stroke-width="1.4"><circle cx="18" cy="8" r="4"/><rect x="12" y="13" width="12" height="12" rx="1"/><line x1="14" y1="25" x2="14" y2="33"/><line x1="22" y1="25" x2="22" y2="33"/></svg>Karakter</button>
                        <button class="shp" data-s="house" title="Düşük Poligonlu Ev"><svg viewBox="0 0 36 36" fill="none" stroke="#ffb74d" stroke-width="1.4"><path d="M6 16 L18 6 L30 16 V28 H6 Z"/><rect x="14" y="18" width="8" height="10"/></svg>Ev</button>
                        <button class="shp" data-s="tower" title="Kale Kulesi"><svg viewBox="0 0 36 36" fill="none" stroke="#b0bec5" stroke-width="1.4"><path d="M8 30 V12 L11 8 H25 L28 12 V30 Z"/><rect x="14" y="18" width="8" height="12"/><line x1="8" y1="12" x2="28" y2="12"/></svg>Kule</button>
                        <button class="shp" data-s="wall" title="Kapı Girişli Duvar"><svg viewBox="0 0 36 36" fill="none" stroke="#90a4ae" stroke-width="1.4"><rect x="4" y="6" width="28" height="24" rx="1"/><rect x="14" y="14" width="8" height="16"/></svg>Duvar</button>
                        <button class="shp" data-s="stairs" title="Merdiven"><svg viewBox="0 0 36 36" fill="none" stroke="#e0e0e0" stroke-width="1.4"><path d="M6 30H10V26H16V20H22V14H28V8H32"/></svg>Merdiven</button>
                        <button class="shp" data-s="bridge" title="Ahşap Köprü"><svg viewBox="0 0 36 36" fill="none" stroke="#a1887f" stroke-width="1.4"><path d="M4 22 H32 M4 26 H32"/><line x1="8" y1="22" x2="8" y2="30"/><line x1="18" y1="22" x2="18" y2="30"/><line x1="28" y1="22" x2="28" y2="30"/></svg>Köprü</button>
                        <button class="shp" data-s="windmill" title="Yel Değirmeni"><svg viewBox="0 0 36 36" fill="none" stroke="#ffd54f" stroke-width="1.4"><polygon points="12,30 15,12 21,12 24,30"/><circle cx="18" cy="12" r="2"/><line x1="18" y1="12" x2="10" y2="4"/><line x1="18" y1="12" x2="26" y2="4"/><line x1="18" y1="12" x2="26" y2="20"/><line x1="18" y1="12" x2="10" y2="20"/></svg>Değirmen</button>
                        <button class="shp" data-s="well" title="Su Kuyusu"><svg viewBox="0 0 36 36" fill="none" stroke="#80deea" stroke-width="1.4"><rect x="6" y="22" width="24" height="8" rx="1"/><path d="M10 22 V8 H26 V22 M6 8 H30"/></svg>Kuyu</button>
                        <button class="shp" data-s="tent" title="Kamp Çadırı"><svg viewBox="0 0 36 36" fill="none" stroke="#81c784" stroke-width="1.4"><polygon points="18,6 30,28 6,28"/><line x1="18" y1="14" x2="18" y2="28"/></svg>Çadır</button>
                        <button class="shp" data-s="castle" title="Mini Kale"><svg viewBox="0 0 36 36" fill="none" stroke="#b0bec5" stroke-width="1.4"><rect x="6" y="14" width="24" height="14" rx="1"/><rect x="15" y="20" width="6" height="8"/><path d="M4 10 H32 M10 10 V14 M26 10 V14"/></svg>Şato</button>
                        <button class="shp" data-s="lighthouse" title="Deniz Feneri"><svg viewBox="0 0 36 36" fill="none" stroke="#ffd54f" stroke-width="1.4"><path d="M14 30 L16 10 H20 L22 30 Z"/><circle cx="18" cy="7" r="3"/></svg>Deniz Feneri</button>
                        <button class="shp" data-s="ruins" title="Harabe Duvarı"><svg viewBox="0 0 36 36" fill="none" stroke="#8d6e63" stroke-width="1.4"><rect x="4" y="26" width="28" height="6" rx="0.5"/><rect x="8" y="10" width="6" height="16"/><rect x="22" y="14" width="6" height="12"/><line x1="14" y1="10" x2="22" y2="18"/></svg>Harabe</button>
                        <button class="shp" data-s="cabin" title="Ahşap Kulübe"><svg viewBox="0 0 36 36" fill="none" stroke="#a1887f" stroke-width="1.4"><polygon points="6,16 18,6 30,16"/><rect x="8" y="16" width="20" height="14"/><rect x="15" y="22" width="6" height="8"/></svg>Kulübe</button>
                        <button class="shp" data-s="portal" title="Geçit / Portal"><svg viewBox="0 0 36 36" fill="none" stroke="#9c27b0" stroke-width="1.4"><circle cx="18" cy="18" r="10"/><rect x="8" y="28" width="20" height="4"/><ellipse cx="18" cy="18" rx="6" ry="6" stroke-dasharray="2,2"/></svg>Geçit</button>
                    </div>

                    <!-- Sub-category: Doğa & Çevre -->
                    <div class="game-subcat-title">🌲 Doğa & Çevre</div>
                    <div class="shp-grid">
                        <button class="shp" data-s="tree" title="Yapraklı Ağaç"><svg viewBox="0 0 36 36" fill="none" stroke="#81c784" stroke-width="1.4"><path d="M18 4L28 20H8Z"/><path d="M18 10L26 24H10Z"/><rect x="16" y="24" width="4" height="8" rx="1"/></svg>Meşe Ağacı</button>
                        <button class="shp" data-s="pine" title="Çam Ağacı"><svg viewBox="0 0 36 36" fill="none" stroke="#2e7d32" stroke-width="1.4"><polygon points="18,4 28,14 8,14"/><polygon points="18,10 26,20 10,20"/><polygon points="18,16 24,26 12,26"/><rect x="16" y="26" width="4" height="6"/></svg>Çam Ağacı</button>
                        <button class="shp" data-s="rock" title="Düşük Poligonlu Kaya"><svg viewBox="0 0 36 36" fill="none" stroke="#a1887f" stroke-width="1.4"><polygon points="18,6 28,12 30,24 18,30 8,24 6,12"/></svg>Kaya</button>
                        <button class="shp" data-s="campfire" title="Kamp Ateşi"><svg viewBox="0 0 36 36" fill="none" stroke="#ff8a80" stroke-width="1.4"><path d="M8 28 L28 22 M28 28 L8 22"/><path d="M14 22 Q18 8 22 22 Z"/></svg>Kamp Ateşi</button>
                        <button class="shp" data-s="crystal" title="Enerji Kristali"><svg viewBox="0 0 36 36" fill="none" stroke="#e040fb" stroke-width="1.4"><polygon points="18,4 26,18 18,32 10,18"/></svg>Kristal</button>
                        <button class="shp" data-s="mushroom" title="Mantar"><svg viewBox="0 0 36 36" fill="none" stroke="#ff8a80" stroke-width="1.4"><path d="M14 20 A6 6 0 0 1 22 20 Z"/><rect x="16" y="20" width="4" height="8" rx="1"/></svg>Mantar</button>
                        <button class="shp" data-s="cactus" title="Kaktüs"><svg viewBox="0 0 36 36" fill="none" stroke="#2e7d32" stroke-width="1.4"><path d="M18 6 V30 M12 14 V22 H18 M24 10 V18 H18"/><circle cx="18" cy="6" r="1"/></svg>Kaktüs</button>
                        <button class="shp" data-s="cloud" title="Bulut"><svg viewBox="0 0 36 36" fill="none" stroke="#ffffff" stroke-width="1.4"><path d="M10 24 A 6 6 0 0 1 14 12 A 8 8 0 0 1 28 16 A 6 6 0 0 1 26 24 Z"/></svg>Bulut</button>
                        <button class="shp" data-s="flower" title="Çiçek"><svg viewBox="0 0 36 36" fill="none" stroke="#f48fb1" stroke-width="1.4"><circle cx="18" cy="18" r="4" stroke="#ffeb3b"/><path d="M18 22 V32"/><circle cx="18" cy="10" r="4"/><circle cx="10" cy="18" r="4"/><circle cx="26" cy="18" r="4"/><circle cx="18" cy="26" r="4"/></svg>Çiçek</button>
                    </div>

                    <!-- Sub-category: Eşyalar & Savaş -->
                    <div class="game-subcat-title">🛡️ Eşyalar & Savaş</div>
                    <div class="shp-grid">
                        <button class="shp" data-s="sword" title="Düşük Poligonlu Kılıç"><svg viewBox="0 0 36 36" fill="none" stroke="#e0e0e0" stroke-width="1.4"><path d="M18 4 L21 8 V24 L18 26 L15 24 V8 Z"/><line x1="10" y1="26" x2="26" y2="26"/><rect x="17" y="26" width="2" height="6" rx="0.5"/></svg>Kılıç</button>
                        <button class="shp" data-s="shield" title="Düşük Poligonlu Kalkan"><svg viewBox="0 0 36 36" fill="none" stroke="#90caf9" stroke-width="1.4"><path d="M18 6 C10 6 8 10 8 18 C8 26 14 30 18 32 C22 30 28 26 28 18 C28 10 26 6 18 6 Z"/><circle cx="18" cy="18" r="3"/></svg>Kalkan</button>
                        <button class="shp" data-s="chest" title="Düşük Poligonlu Sandık"><svg viewBox="0 0 36 36" fill="none" stroke="#a1887f" stroke-width="1.4"><rect x="6" y="14" width="24" height="16" rx="1"/><path d="M6 14 H30"/><rect x="16" y="12" width="4" height="4"/></svg>Sandık</button>
                        <button class="shp" data-s="barrel" title="Düşük Poligonlu Varil"><svg viewBox="0 0 36 36" fill="none" stroke="#d7ccc8" stroke-width="1.4"><ellipse cx="18" cy="8" rx="8" ry="3"/><ellipse cx="18" cy="28" rx="8" ry="3"/><line x1="10" y1="8" x2="10" y2="28"/><line x1="26" y1="8" x2="26" y2="28"/></svg>Varil</button>
                        <button class="shp" data-s="torch" title="Duvar Meşalesi"><svg viewBox="0 0 36 36" fill="none" stroke="#ff8a80" stroke-width="1.4"><path d="M16 26 L18 14 L20 26 Z"/><path d="M16 14 Q18 8 20 14" stroke="#ff3d00" stroke-width="2"/></svg>Meşale</button>
                        <button class="shp" data-s="lantern" title="Sokak Feneri"><svg viewBox="0 0 36 36" fill="none" stroke="#ffd54f" stroke-width="1.4"><path d="M14 8 H22 L24 20 H12 Z"/><line x1="18" y1="20" x2="18" y2="30"/></svg>Fener</button>
                        <button class="shp" data-s="fence" title="Düşük Poligonlu Çit"><svg viewBox="0 0 36 36" fill="none" stroke="#a1887f" stroke-width="1.4"><path d="M6 6 V30 M30 6 V30 M4 10 H32 M4 22 H32"/></svg>Çit</button>
                        <button class="shp" data-s="boat" title="Küçük Tekne"><svg viewBox="0 0 36 36" fill="none" stroke="#64b5f6" stroke-width="1.4"><path d="M4 16 L12 26 H24 L32 16 H4 Z"/></svg>Tekne</button>
                        <button class="shp" data-s="pillar" title="Antik Sütun"><svg viewBox="0 0 36 36" fill="none" stroke="#b0bec5" stroke-width="1.4"><rect x="8" y="28" width="20" height="4" rx="0.5"/><rect x="8" y="4" width="20" height="4" rx="0.5"/><line x1="12" y1="8" x2="12" y2="28"/><line x1="24" y1="8" x2="24" y2="28"/></svg>Sütun</button>
                        <button class="shp" data-s="flag" title="Kale Bayrağı"><svg viewBox="0 0 36 36" fill="none" stroke="#ff8a80" stroke-width="1.4"><line x1="10" y1="4" x2="10" y2="32"/><polygon points="10,6 26,12 10,18"/></svg>Bayrak</button>
                        <button class="shp" data-s="gravestone" title="Mezar Taşı"><svg viewBox="0 0 36 36" fill="none" stroke="#90a4ae" stroke-width="1.4"><path d="M10 30 V12 A8 8 0 0 1 26 12 V30 Z"/><line x1="14" y1="18" x2="22" y2="18"/><line x1="18" y1="14" x2="18" y2="22"/></svg>Mezar</button>
                        <button class="shp" data-s="cannon" title="Gülle Topu"><svg viewBox="0 0 36 36" fill="none" stroke="#37474f" stroke-width="1.4"><line x1="8" y1="22" x2="28" y2="12" stroke-width="2"/><circle cx="12" cy="24" r="5"/><circle cx="24" cy="24" r="5"/></svg>Top</button>
                        <button class="shp" data-s="crate" title="Ahşap Kasa"><svg viewBox="0 0 36 36" fill="none" stroke="#d7ccc8" stroke-width="1.4"><rect x="6" y="6" width="24" height="24" rx="1"/><line x1="6" y1="6" x2="30" y2="30"/><line x1="6" y1="30" x2="30" y2="6"/></svg>Kasa</button>
                        <button class="shp" data-s="anvil" title="Örs"><svg viewBox="0 0 36 36" fill="none" stroke="#424242" stroke-width="1.4"><path d="M6 10 H30 L26 18 H10 Z M10 26 H26 V18 H10 Z"/></svg>Örs</button>
                        <button class="shp" data-s="wagon" title="At Arabası/Vagon"><svg viewBox="0 0 36 36" fill="none" stroke="#8d6e63" stroke-width="1.4"><rect x="6" y="10" width="24" height="12"/><circle cx="10" cy="26" r="4"/><circle cx="26" cy="26" r="4"/><line x1="4" y1="14" x2="6" y2="14"/></svg>Vagon</button>
                    </div>
                </div>
            </div>


            <!-- Preset Size -->
            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="size">
                    <span>BOYUT ÖN AYAR</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secSize">
                    <div class="sz-presets">
                        <button class="sz-btn" data-sz="5">5</button>
                        <button class="sz-btn" data-sz="10">10</button>
                        <button class="sz-btn active" data-sz="20">20</button>
                        <button class="sz-btn" data-sz="30">30</button>
                        <button class="sz-btn" data-sz="50">50</button>
                        <button class="sz-btn" data-sz="100">100</button>
                        <span class="sz-unit">mm</span>
                    </div>
                    <div class="sz-custom">
                        <label>Özel boyut</label>
                        <input type="number" id="customSz" value="20" min="0.1" max="5000" step="0.5" class="lp-inp">
                        <span>mm</span>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="quick">
                    <span>HIZLI İŞLEMLER</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secQuick">
                    <div class="qa-grid">
                        <button class="qa" id="qaDup">⧉ Kopyala</button>
                        <button class="qa" id="qaMX">↔ Ayna X</button>
                        <button class="qa" id="qaMZ">↕ Ayna Z</button>
                        <button class="qa" id="qaCenter">◎ Merkez</button>
                        <button class="qa" id="qaGround">⬇ Zemin</button>
                        <button class="qa" id="qaFocus">🔍 Odaklan</button>
                        <button class="qa qa-danger" id="qaDel">✕ Sil</button>
                        <button class="qa qa-danger" id="qaClear">🗑 Temizle</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ─── TERRAIN TAB ─── -->
        <div class="lp-content" id="lptTerrain">
            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="terrTemplates">
                    <span>ARAZİ ŞABLONLARI</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secTerrTemplates">
                    <div class="shp-grid">
                        <button class="shp-terr shp active" data-t="mount"><span class="terr-ic">🏔️</span>Dağlar</button>
                        <button class="shp-terr shp" data-t="dunes"><span class="terr-ic">⏳</span>Kumul</button>
                        <button class="shp-terr shp" data-t="canyon"><span class="terr-ic">🧱</span>Kanyon</button>
                        <button class="shp-terr shp" data-t="hills"><span class="terr-ic">🍀</span>Tepelik</button>
                        <button class="shp-terr shp" data-t="lake"><span class="terr-ic">💧</span>Göl</button>
                        <button class="shp-terr shp" data-t="volcano"><span class="terr-ic">🌋</span>Volkan</button>
                        <button class="shp-terr shp" data-t="island"><span class="terr-ic">🏝️</span>Ada</button>
                        <button class="shp-terr shp" data-t="plain"><span class="terr-ic">🌾</span>Ova</button>
                        <button class="shp-terr shp" data-t="swamp"><span class="terr-ic">🐊</span>Bataklık</button>
                        <button class="shp-terr shp" data-t="oasis"><span class="terr-ic">🌴</span>Vaha</button>
                        <button class="shp-terr shp" data-t="fjord"><span class="terr-ic">🗻</span>Fiyort</button>
                        <button class="shp-terr shp" data-t="river"><span class="terr-ic">🌊</span>Nehir</button>
                    </div>
                </div>
            </div>

            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="terrSettings">
                    <span>ARAZİ AYARLARI</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secTerrSettings">
                    <div class="lp-form">
                        <div class="lp-row">
                            <label>Renk Teması</label>
                            <select id="terrTheme" class="lp-sel">
                                <option value="grass" selected>Çimenli (Yeşil)</option>
                                <option value="sand">Kumlu (Sarı)</option>
                                <option value="snow">Karlı (Beyaz)</option>
                                <option value="lava">Volkanik (Lav)</option>
                                <option value="clay">Kanyon (Kızıl)</option>
                                <option value="swamp">Bataklık (Koyu Yeşil)</option>
                                <option value="stone">Kayalık (Gri)</option>
                            </select>
                        </div>
                        <div class="lp-row">
                            <label>Genişlik (mm)</label>
                            <input type="number" id="terrW" value="60" min="10" max="1000" class="lp-inp">
                        </div>
                        <div class="lp-row">
                            <label>Derinlik (mm)</label>
                            <input type="number" id="terrD" value="60" min="10" max="1000" class="lp-inp">
                        </div>
                        <div class="lp-row">
                            <label>Yükseklik</label>
                            <input type="range" id="terrHeight" min="0.1" max="5.0" step="0.1" value="1.0" class="lp-range">
                        </div>
                        <div class="lp-row">
                            <label>Pürüzlülük</label>
                            <input type="range" id="terrRoughness" min="0.0" max="5.0" step="0.1" value="1.0" class="lp-range">
                        </div>
                        <div class="lp-row">
                            <label>Detay (Segment)</label>
                            <input type="number" id="terrSeg" value="32" min="4" max="256" class="lp-inp">
                        </div>
                    </div>
                    <button class="lp-apply-btn lp-green" id="addTerrainBtn" style="margin-top:10px;">⛳ Araziyi Sahneye Ekle</button>
                </div>
            </div>
        </div>

        <!-- ─── OPS TAB ─── -->
        <div class="lp-content" id="lptOps">
            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="bool">
                    <span>BOOLEAN İŞLEMLERİ</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secBool">
                    <div class="ops-card" id="opUnion">
                        <div class="ops-icon" style="color:#69f0ae">⊕</div>
                        <div class="ops-info"><strong>Birleştir (Union)</strong><small>İki objeyi tek parça yap</small></div>
                    </div>
                    <div class="ops-card" id="opSubtract">
                        <div class="ops-icon" style="color:#ff5252">⊖</div>
                        <div class="ops-info"><strong>Çıkar / Delik Aç</strong><small>A'dan B'yi çıkar</small></div>
                    </div>
                    <div class="ops-card" id="opIntersect">
                        <div class="ops-icon" style="color:#448aff">⊗</div>
                        <div class="ops-info"><strong>Kesişim</strong><small>Ortak bölgeyi al</small></div>
                    </div>
                </div>
            </div>

            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="mod">
                    <span>MODİFİYELER</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secMod">
                    <div class="ops-card" id="opExtrude">
                        <div class="ops-icon" style="color:#ffd740">↑</div>
                        <div class="ops-info"><strong>Extrude</strong><small>Yüzey/şekli uzat</small></div>
                    </div>
                    <div class="ops-card" id="opBevel">
                        <div class="ops-icon" style="color:#bc8cff">◩</div>
                        <div class="ops-info"><strong>Bevel</strong><small>Köşeleri yuvarla</small></div>
                    </div>
                    <div class="ops-card" id="opSubdiv">
                        <div class="ops-icon" style="color:#3fb950">⊞</div>
                        <div class="ops-info"><strong>Subdivide</strong><small>Geometriyi böl</small></div>
                    </div>
                    <div class="ops-card" id="opSmooth">
                        <div class="ops-icon" style="color:#4fc3f7">≋</div>
                        <div class="ops-info"><strong>Smooth</strong><small>Yüzeyi yumuşat</small></div>
                    </div>
                    <div class="ops-card" id="opSolidify">
                        <div class="ops-icon" style="color:#ffab91">□</div>
                        <div class="ops-info"><strong>Solidify</strong><small>Kalınlık ver</small></div>
                    </div>
                </div>
            </div>

            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="modparams">
                    <span>PARAMETRELİ AYARLAR</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secModParams">
                    <div class="lp-form">
                        <div class="lp-row"><label>Extrude (mm)</label><input type="number" id="pExtDepth" value="10" min="0.1" step="0.5" class="lp-inp"></div>
                        <div class="lp-row"><label>Bevel (mm)</label><input type="number" id="pBevelAmt" value="2" min="0" step="0.1" class="lp-inp"></div>
                        <div class="lp-row"><label>Solidify (mm)</label><input type="number" id="pSolidify" value="2" min="0.1" step="0.5" class="lp-inp"></div>
                        <div class="lp-row"><label>Subdiv Seviye</label><input type="number" id="pSubdivLvl" value="1" min="1" max="4" class="lp-inp"></div>
                    </div>
                </div>
            </div>

            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="array">
                    <span>DİZİ (ARRAY)</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secArray">
                    <div class="lp-form">
                        <div class="lp-row"><label>X Adet</label><input type="number" id="arrX" value="3" min="1" max="50" class="lp-inp"></div>
                        <div class="lp-row"><label>Y Adet</label><input type="number" id="arrY" value="1" min="1" max="50" class="lp-inp"></div>
                        <div class="lp-row"><label>Z Adet</label><input type="number" id="arrZ" value="1" min="1" max="50" class="lp-inp"></div>
                        <div class="lp-row"><label>Boşluk (mm)</label><input type="number" id="arrGap" value="25" min="0" step="1" class="lp-inp"></div>
                        <div class="lp-row"><label>Tür</label>
                            <select id="arrType" class="lp-sel">
                                <option value="linear">Doğrusal</option>
                                <option value="circular">Dairesel</option>
                                <option value="radial">Radyal</option>
                            </select>
                        </div>
                    </div>
                    <button class="lp-apply-btn" id="opArray">Diziyi Oluştur</button>
                </div>
            </div>

            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="spin">
                    <span>LATHE / SPIN (DÖNEL KATİ)</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secSpin">
                    <div class="lp-form">
                        <div class="lp-row"><label>Açı (°)</label><input type="number" id="latheAngle" value="360" min="10" max="360" class="lp-inp"></div>
                        <div class="lp-row"><label>Dilim</label><input type="number" id="latheSegs" value="32" min="4" max="128" class="lp-inp"></div>
                        <div class="lp-row"><label>Eksen</label>
                            <select id="latheAxis" class="lp-sel">
                                <option value="y">Y (Dikey)</option>
                                <option value="x">X (Yatay)</option>
                                <option value="z">Z (Derinlik)</option>
                            </select>
                        </div>
                    </div>
                    <button class="lp-apply-btn" id="opLathe">Lathe Uygula</button>
                </div>
            </div>
        </div>

        <!-- ─── SCENE TAB ─── -->
        <div class="lp-content" id="lptScene">
            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="outliner">
                    <span>SAHNE HİYERARŞİSİ</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secOutliner">
                    <div class="outliner" id="outliner">
                        <div class="out-empty"><p>Sahne boş</p></div>
                    </div>
                    <div class="out-actions">
                        <button class="oa" id="oaSelAll">Tümünü Seç</button>
                        <button class="oa" id="oaDesel">Kaldır</button>
                        <button class="oa oa-danger" id="oaDelAll">Tümünü Sil</button>
                    </div>
                </div>
            </div>

            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="sceneSettings">
                    <span>RENDER & GÖRÜNÜM</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secSceneSettings">
                    <div class="lp-form">
                        <div class="lp-row lp-toggle-row"><label>Grid</label><label class="tgl"><input type="checkbox" id="tglGrid" checked><span class="tsl"></span></label></div>
                        <div class="lp-row lp-toggle-row"><label>Eksenler</label><label class="tgl"><input type="checkbox" id="tglAxis" checked><span class="tsl"></span></label></div>
                        <div class="lp-row lp-toggle-row"><label>Gölge</label><label class="tgl"><input type="checkbox" id="tglShadow" checked><span class="tsl"></span></label></div>
                        <div class="lp-row lp-toggle-row"><label>Kenar Çizgisi</label><label class="tgl"><input type="checkbox" id="tglWire"><span class="tsl"></span></label></div>
                        <div class="lp-row lp-toggle-row"><label>Sis</label><label class="tgl"><input type="checkbox" id="tglFog" checked><span class="tsl"></span></label></div>
                        <div class="lp-row lp-toggle-row"><label>HDRI Işık</label><label class="tgl"><input type="checkbox" id="tglHDRI" checked><span class="tsl"></span></label></div>
                        <div class="lp-row"><label>Render Modu</label>
                            <select id="renderMode" class="lp-sel">
                                <option value="solid">Solid</option>
                                <option value="wireframe">Wireframe</option>
                                <option value="xray">X-Ray</option>
                                <option value="matcap">Matcap</option>
                                <option value="flat">Düz</option>
                            </select>
                        </div>
                        <div class="lp-row"><label>Grid Boyutu</label>
                            <select id="gridSz" class="lp-sel">
                                <option value="100">100mm</option>
                                <option value="200" selected>200mm</option>
                                <option value="500">500mm</option>
                                <option value="1000">1000mm</option>
                            </select>
                        </div>
                        <div class="lp-row"><label>Arka Plan</label><input type="color" id="bgCol" value="#070c11" class="lp-color"></div>
                        <div class="lp-row"><label>Kamera Hızı</label><input type="range" id="camSpeed" min="0.1" max="5" step="0.1" value="1" class="lp-range"></div>
                    </div>
                </div>
            </div>

            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="lights">
                    <span>IŞIKLANDIRMA</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secLights">
                    <div class="lp-form">
                        <div class="lp-row"><label>Ortam Işığı</label><input type="range" id="ambIntensity" min="0" max="3" step="0.1" value="1" class="lp-range"></div>
                        <div class="lp-row"><label>Güneş Işığı</label><input type="range" id="sunIntensity" min="0" max="3" step="0.1" value="1.5" class="lp-range"></div>
                        <div class="lp-row"><label>Işık Rengi</label><input type="color" id="sunColor" value="#ffffff" class="lp-color"></div>
                        <div class="lp-row"><label>Yön X</label><input type="range" id="sunX" min="-200" max="200" value="100" class="lp-range"></div>
                        <div class="lp-row"><label>Yön Y</label><input type="range" id="sunY" min="20" max="400" value="140" class="lp-range"></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ─── DRAW TAB ─── -->
        <div class="lp-content" id="lptDraw">
            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="drawHelp">
                    <span>ÇİZİM MODU REHBERİ</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secDrawHelp">
                    <div class="draw-help">
                        <p>Sol araç çubuğundan bir çizim aracı seçin, ardından Çizim Modu'na geçin.</p>
                        <div class="draw-tool-list">
                            <div class="dtl-item"><span class="dtl-key">L</span><span>Çizgi — click-click ile segment</span></div>
                            <div class="dtl-item"><span class="dtl-key">C</span><span>Çember — merkez+yarıçap</span></div>
                            <div class="dtl-item"><span class="dtl-key">Rect</span><span>Dikdörtgen — köşeden köşe</span></div>
                            <div class="dtl-item"><span class="dtl-key">P</span><span>Çokgen — nokta nokta</span></div>
                            <div class="dtl-item"><span class="dtl-key">Spline</span><span>Eğri çizgi — kontrol noktaları</span></div>
                            <div class="dtl-item"><span class="dtl-key">★</span><span>Yıldız — merkez+iç+dış</span></div>
                        </div>
                        <p style="margin-top:6px;"><strong>Enter</strong> = Çizimi bitir<br><strong>Esc</strong> = İptal</p>
                    </div>
                </div>
            </div>
            <div class="lp-sec">
                <button class="lp-sec-hdr" data-sec="drawSettings">
                    <span>ÇİZİM AYARLARI</span>
                    <span class="sec-arrow">▾</span>
                </button>
                <div class="lp-sec-body" id="secDrawSettings">
                    <div class="lp-form">
                        <div class="lp-row"><label>Extrude Yüksekliği (mm)</label><input type="number" id="sketchExtrudeH" value="10" min="0.1" step="0.5" class="lp-inp"></div>
                        <div class="lp-row"><label>Yıldız İç Yarıçap</label><input type="number" id="starInner" value="8" min="1" class="lp-inp"></div>
                        <div class="lp-row"><label>Çokgen Kenar Sayısı</label><input type="number" id="polyEdges" value="6" min="3" max="32" class="lp-inp"></div>
                        <div class="lp-row"><label>Çizim Düzlemi</label>
                            <select id="sketchPlane" class="lp-sel">
                                <option value="xz">XZ (Grid)</option>
                                <option value="xy">XY (Ön)</option>
                                <option value="yz">YZ (Yan)</option>
                            </select>
                        </div>
                        <div class="lp-row"><label>Çizgi Kalınlığı</label><input type="range" id="drawStroke" min="1" max="10" value="2" class="lp-range"></div>
                        <div class="lp-row"><label>Çizim Rengi</label><input type="color" id="drawColor" value="#58a6ff" class="lp-color"></div>
                        <div class="lp-row lp-toggle-row"><label>Snap Çizim</label><label class="tgl"><input type="checkbox" id="drawSnap" checked><span class="tsl"></span></label></div>
                        <div class="lp-row lp-toggle-row"><label>Kapalı Şekil</label><label class="tgl"><input type="checkbox" id="drawClose" checked><span class="tsl"></span></label></div>
                    </div>
                    <button class="lp-apply-btn lp-green" id="extrudeSketch" disabled>⬆ Çizimi 3D'ye Dönüştür</button>
                    <button class="lp-apply-btn lp-red" id="clearSketch" style="margin-top:4px;">✕ Çizimi Temizle</button>
                </div>
            </div>
        </div>
    </aside>

    <!-- CENTER VIEWPORT -->
    <div id="viewport">
        <canvas id="mainCanvas"></canvas>

        <!-- Sketch overlay canvas -->
        <canvas id="sketchCanvas" style="display:none;"></canvas>

        <!-- Viewport HUD -->
        <div class="vp-hud">
            <div class="vp-badge" id="vpBadge">OBJE MODU · PERSPEKTİF</div>
            <div class="vp-coords" id="vpCoords">X: 0.00 · Y: 0.00 · Z: 0.00</div>
        </div>

        <!-- Draw HUD (sketch mode) -->
        <div class="draw-hud" id="drawHUD" style="display:none;">
            <div class="dh-tool" id="dhTool">Araç: Çizgi</div>
            <div class="dh-info" id="dhInfo">İlk noktayı tıklayın</div>
            <div class="dh-keys">
                <span><kbd>Enter</kbd> Bitir</span>
                <span><kbd>Esc</kbd> İptal</span>
                <span><kbd>Z</kbd> Geri Al</span>
            </div>
        </div>

        <!-- Mini Gizmo -->
        <div class="mini-gizmo" id="miniGizmo">
            <canvas id="gizmoCanvas" width="80" height="80"></canvas>
        </div>

        <!-- Context Menu -->
        <div id="ctxMenu" class="ctx-menu" style="display:none;">
            <div class="ctx-hdr">Bağlam Menüsü</div>
            <div class="ctx-item" id="ctx-dup">⧉ Kopyala <kbd>Ctrl+D</kbd></div>
            <div class="ctx-item" id="ctx-focus">◎ Odaklan <kbd>F</kbd></div>
            <div class="ctx-item" id="ctx-ground">⬇ Zemine Oturt</div>
            <div class="ctx-item" id="ctx-center">◎ Merkeze Getir</div>
            <div class="ctx-sep"></div>
            <div class="ctx-item" id="ctx-rp">↺ Konum Sıfırla</div>
            <div class="ctx-item" id="ctx-rr">↺ Rotasyon Sıfırla</div>
            <div class="ctx-item" id="ctx-rs">↺ Ölçek Sıfırla</div>
            <div class="ctx-sep"></div>
            <div class="ctx-item ctx-danger" id="ctx-del">✕ Sil <kbd>Del</kbd></div>
        </div>
    </div>

    <!-- RIGHT PANEL (Inspector) -->
    <aside id="rightPanel">
        <!-- No selection -->
        <div class="rp-empty" id="rpEmpty">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.25"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            <p>Obje seçilmedi</p>
            <small>Canvas'ta bir objeye tıklayın</small>
        </div>

        <!-- Inspector body -->
        <div id="inspector" style="display:none;">

            <!-- Object Header -->
            <div class="rp-obj-hdr">
                <input type="text" id="rp-name" class="rp-name" placeholder="Obje adı...">
                <span class="rp-type-badge" id="rp-badge">KÜP</span>
            </div>

            <!-- Tabs -->
            <div class="rp-tabs">
                <button class="rp-tab active" data-rpt="transform">Dönüşüm</button>
                <button class="rp-tab" data-rpt="geometry">Geometri</button>
                <button class="rp-tab" data-rpt="material">Malzeme</button>
                <button class="rp-tab" data-rpt="info">Bilgi</button>
            </div>

            <!-- ── TRANSFORM TAB ── -->
            <div class="rp-tc active" id="rptTransform">
                <!-- Position -->
                <div class="rp-sec">
                    <div class="rp-sec-hdr">
                        <span>📍 KONUM (mm)</span>
                        <button class="rp-reset" id="rResetPos">↺</button>
                    </div>
                    <div class="xyz-block">
                        <div class="xyz-r">
                            <div class="xyz-lbl x">X</div>
                            <input type="number" id="pX" class="xyz-val" step="1" value="0">
                            <div class="xyz-adj-grp">
                                <button class="xadj" data-ax="x" data-pr="pos" data-d="-1">−</button>
                                <button class="xadj" data-ax="x" data-pr="pos" data-d="1">+</button>
                            </div>
                        </div>
                        <div class="xyz-r">
                            <div class="xyz-lbl y">Y</div>
                            <input type="number" id="pY" class="xyz-val" step="1" value="0">
                            <div class="xyz-adj-grp">
                                <button class="xadj" data-ax="y" data-pr="pos" data-d="-1">−</button>
                                <button class="xadj" data-ax="y" data-pr="pos" data-d="1">+</button>
                            </div>
                        </div>
                        <div class="xyz-r">
                            <div class="xyz-lbl z">Z</div>
                            <input type="number" id="pZ" class="xyz-val" step="1" value="0">
                            <div class="xyz-adj-grp">
                                <button class="xadj" data-ax="z" data-pr="pos" data-d="-1">−</button>
                                <button class="xadj" data-ax="z" data-pr="pos" data-d="1">+</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Rotation -->
                <div class="rp-sec">
                    <div class="rp-sec-hdr">
                        <span>🔄 ROTASYON (°)</span>
                        <button class="rp-reset" id="rResetRot">↺</button>
                    </div>
                    <div class="xyz-block">
                        <div class="xyz-r">
                            <div class="xyz-lbl x">X</div>
                            <input type="number" id="rX" class="xyz-val" step="5" value="0">
                            <div class="xyz-adj-grp">
                                <button class="xadj" data-ax="x" data-pr="rot" data-d="-90">-90°</button>
                                <button class="xadj" data-ax="x" data-pr="rot" data-d="90">+90°</button>
                            </div>
                        </div>
                        <div class="xyz-r">
                            <div class="xyz-lbl y">Y</div>
                            <input type="number" id="rY" class="xyz-val" step="5" value="0">
                            <div class="xyz-adj-grp">
                                <button class="xadj" data-ax="y" data-pr="rot" data-d="-45">-45°</button>
                                <button class="xadj" data-ax="y" data-pr="rot" data-d="45">+45°</button>
                            </div>
                        </div>
                        <div class="xyz-r">
                            <div class="xyz-lbl z">Z</div>
                            <input type="number" id="rZ" class="xyz-val" step="5" value="0">
                            <div class="xyz-adj-grp">
                                <button class="xadj" data-ax="z" data-pr="rot" data-d="-90">-90°</button>
                                <button class="xadj" data-ax="z" data-pr="rot" data-d="90">+90°</button>
                            </div>
                        </div>
                    </div>
                    <div class="rot-presets">
                        <button class="rot-p" data-rx="0" data-ry="0" data-rz="0">0°</button>
                        <button class="rot-p" data-rx="0" data-ry="45" data-rz="0">Y45</button>
                        <button class="rot-p" data-rx="0" data-ry="90" data-rz="0">Y90</button>
                        <button class="rot-p" data-rx="0" data-ry="180" data-rz="0">Y180</button>
                        <button class="rot-p" data-rx="90" data-ry="0" data-rz="0">X90</button>
                        <button class="rot-p" data-rx="0" data-ry="0" data-rz="90">Z90</button>
                        <button class="rot-p" data-rx="-90" data-ry="0" data-rz="0">X-90</button>
                        <button class="rot-p" data-rx="0" data-ry="0" data-rz="-90">Z-90</button>
                    </div>
                </div>

                <!-- Scale -->
                <div class="rp-sec">
                    <div class="rp-sec-hdr">
                        <span>📐 ÖLÇEK</span>
                        <button class="rp-reset" id="rResetScl">↺</button>
                    </div>
                    <div class="scl-opts">
                        <label class="unif-lbl">
                            <input type="checkbox" id="unifScl" checked>
                            <span>Orantılı</span>
                        </label>
                        <div class="scl-qk">
                            <button class="sqk" data-f="0.5">½</button>
                            <button class="sqk" data-f="2">×2</button>
                            <button class="sqk" data-f="0.1">×0.1</button>
                            <button class="sqk" data-f="10">×10</button>
                        </div>
                    </div>
                    <div class="xyz-block">
                        <div class="xyz-r">
                            <div class="xyz-lbl x">X</div>
                            <input type="number" id="sX" class="xyz-val" step="0.1" value="1" min="0.001">
                            <input type="range" id="sXr" class="xyz-sldr x-sldr" min="0.01" max="20" step="0.01" value="1">
                        </div>
                        <div class="xyz-r">
                            <div class="xyz-lbl y">Y</div>
                            <input type="number" id="sY" class="xyz-val" step="0.1" value="1" min="0.001">
                            <input type="range" id="sYr" class="xyz-sldr y-sldr" min="0.01" max="20" step="0.01" value="1">
                        </div>
                        <div class="xyz-r">
                            <div class="xyz-lbl z">Z</div>
                            <input type="number" id="sZ" class="xyz-val" step="0.1" value="1" min="0.001">
                            <input type="range" id="sZr" class="xyz-sldr z-sldr" min="0.01" max="20" step="0.01" value="1">
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── GEOMETRY TAB ── -->
            <div class="rp-tc" id="rptGeometry">
                <div class="rp-sec">
                    <div class="rp-sec-hdr"><span>⬡ BOYUTLAR (mm)</span></div>
                    <div id="geoParamsList"></div>
                    <button class="rp-apply-btn" id="applyGeo">Geometriyi Güncelle</button>
                </div>
                <div class="rp-sec">
                    <div class="rp-sec-hdr"><span>Edit Mod Seçimi</span></div>
                    <div class="edit-sel-btns">
                        <button class="esb active" id="esbVert" data-es="vertex">Vertex</button>
                        <button class="esb" id="esbEdge" data-es="edge">Kenar</button>
                        <button class="esb" id="esbFace" data-es="face">Yüzey</button>
                    </div>
                </div>

                <div class="rp-sec" id="sculptBrushSection">
                    <div class="rp-sec-hdr"><span>🖌 YOĞURMA / ŞEKİLLENDİRME</span></div>
                    <div class="lp-form" style="margin-top:6px;">
                        <div class="lp-row">
                            <label>Fırça Türü</label>
                            <select id="sculptMode" class="lp-sel">
                                <option value="pull" selected>Çek / Şişir (Pull)</option>
                                <option value="push">İt / Çökert (Push)</option>
                                <option value="smooth">Düzleştir (Smooth)</option>
                                <option value="flatten">Kazı / Düzle (Flatten)</option>
                                <option value="revert">Orjinale Döndür / Sil (Revert)</option>
                                <option value="paint">Renk Boyama (Paint)</option>
                            </select>
                        </div>
                        <div class="lp-row" id="paintColorRow" style="display:none;">
                            <label>Boya Rengi</label>
                            <input type="color" id="sculptPaintColor" value="#ffc107" class="lp-color">
                        </div>
                        <div class="lp-row">
                            <label>Fırça Boyutu</label>
                            <input type="range" id="sculptRadius" min="5" max="100" value="30" class="lp-range">
                        </div>
                        <div class="lp-row">
                            <label>Fırça Gücü</label>
                            <input type="range" id="sculptStrength" min="0.1" max="10" step="0.1" value="2" class="lp-range">
                        </div>
                    </div>
                    <div style="font-size:11px; color:rgba(255,255,255,0.4); margin-top:6px; line-height:1.4;">
                        * Edit modundayken nesne üzerinde fareyi sürükleyerek (sol tık + sürükle) modeli yoğurabilirsiniz.
                    </div>
                </div>
            </div>

            <!-- ── MATERIAL TAB ── -->
            <div class="rp-tc" id="rptMaterial">
                <div class="rp-sec">
                    <div class="rp-sec-hdr"><span>🎨 RENK</span></div>
                    <div class="mat-color-row">
                        <input type="color" id="matCol" value="#4fc3f7" class="mat-cp">
                        <div class="mat-swatches">
                            <div class="msw" data-c="#ff5252" style="background:#ff5252" title="Kırmızı"></div>
                            <div class="msw" data-c="#69f0ae" style="background:#69f0ae" title="Yeşil"></div>
                            <div class="msw" data-c="#448aff" style="background:#448aff" title="Mavi"></div>
                            <div class="msw" data-c="#ffd740" style="background:#ffd740" title="Sarı"></div>
                            <div class="msw" data-c="#ea80fc" style="background:#ea80fc" title="Mor"></div>
                            <div class="msw" data-c="#ff6d00" style="background:#ff6d00" title="Turuncu"></div>
                            <div class="msw" data-c="#e0e0e0" style="background:#e0e0e0" title="Gri"></div>
                            <div class="msw" data-c="#1a237e" style="background:#1a237e" title="Lacivert"></div>
                            <div class="msw" data-c="#880e4f" style="background:#880e4f" title="Bordo"></div>
                            <div class="msw" data-c="#004d40" style="background:#004d40" title="Koyu Yeşil"></div>
                            <div class="msw" data-c="#f5f5dc" style="background:#f5f5dc" title="Bej"></div>
                            <div class="msw" data-c="#212121" style="background:#212121" title="Siyah"></div>
                        </div>
                    </div>
                    <button class="lp-apply-btn lp-red" id="clearPaintBtn" style="display:none; margin-top:8px;">🎨 Boyamayı Temizle (Sıfırla)</button>
                </div>
                <div class="rp-sec">
                    <div class="rp-sec-hdr"><span>✨ PBR ÖZELLİKLERİ</span></div>
                    <div class="mat-sliders">
                        <div class="mat-sl-row">
                            <label>Metallik</label>
                            <input type="range" id="matMetal" min="0" max="1" step="0.01" value="0.2" class="mat-sl">
                            <span id="vMetal" class="mat-sv">0.20</span>
                        </div>
                        <div class="mat-sl-row">
                            <label>Pürüzlülük</label>
                            <input type="range" id="matRough" min="0" max="1" step="0.01" value="0.6" class="mat-sl">
                            <span id="vRough" class="mat-sv">0.60</span>
                        </div>
                        <div class="mat-sl-row">
                            <label>Saydamlık</label>
                            <input type="range" id="matOpac" min="0.05" max="1" step="0.01" value="1" class="mat-sl">
                            <span id="vOpac" class="mat-sv">1.00</span>
                        </div>
                        <div class="mat-sl-row">
                            <label>Işıma</label>
                            <input type="range" id="matEmit" min="0" max="2" step="0.05" value="0" class="mat-sl">
                            <span id="vEmit" class="mat-sv">0.00</span>
                        </div>
                        <div class="mat-sl-row">
                            <label>Env Map</label>
                            <input type="range" id="matEnv" min="0" max="2" step="0.1" value="0.8" class="mat-sl">
                            <span id="vEnv" class="mat-sv">0.80</span>
                        </div>
                    </div>
                </div>
                <div class="rp-sec">
                    <div class="rp-sec-hdr"><span>📦 MALZEME ÖN AYARLARI</span></div>
                    <div class="mat-presets">
                        <button class="mp" data-c="#b0bec5" data-m="0.92" data-r="0.18" style="background:linear-gradient(135deg,#b0bec5,#546e7a)">Çelik</button>
                        <button class="mp" data-c="#ffd54f" data-m="0.95" data-r="0.04" style="background:linear-gradient(135deg,#ffd54f,#ff8f00)">Altın</button>
                        <button class="mp" data-c="#e0f7fa" data-m="0.02" data-r="0.05" style="background:linear-gradient(135deg,#e0f7fa,#26c6da)">Cam</button>
                        <button class="mp" data-c="#f5f5f5" data-m="0.0" data-r="0.9" style="background:linear-gradient(135deg,#f5f5f5,#bdbdbd);color:#222">PLA</button>
                        <button class="mp" data-c="#4fc3f7" data-m="0.0" data-r="0.7" style="background:linear-gradient(135deg,#4fc3f7,#0277bd)">Plastik</button>
                        <button class="mp" data-c="#212121" data-m="0.0" data-r="0.95" style="background:linear-gradient(135deg,#424242,#212121)">Kauçuk</button>
                        <button class="mp" data-c="#b0bec5" data-m="0.75" data-r="0.4" style="background:linear-gradient(135deg,#ce93d8,#4a148c)">Titanyum</button>
                        <button class="mp" data-c="#a5d6a7" data-m="0.0" data-r="0.85" style="background:linear-gradient(135deg,#a5d6a7,#2e7d32)">Mat</button>
                        <button class="mp" data-c="#ff6d00" data-m="0.0" data-r="0.6" style="background:linear-gradient(135deg,#ff6d00,#e65100)">Reçine</button>
                        <button class="mp" data-c="#8d6e63" data-m="0.0" data-r="0.92" style="background:linear-gradient(135deg,#a1887f,#4e342e)">Ahşap</button>
                        <button class="mp" data-c="#78909c" data-m="0.6" data-r="0.5" style="background:linear-gradient(135deg,#90a4ae,#37474f)">Alüminyum</button>
                        <button class="mp" data-c="#f48fb1" data-m="0.1" data-r="0.8" style="background:linear-gradient(135deg,#f48fb1,#ad1457)">Pembe</button>
                    </div>
                </div>
            </div>

            <!-- ── INFO TAB ── -->
            <div class="rp-tc" id="rptInfo">
                <div class="rp-sec">
                    <div class="rp-sec-hdr"><span>ℹ GEOMETRİ BİLGİSİ</span></div>
                    <div class="info-grid">
                        <div class="ig-item"><span class="ig-l">Vertex</span><span class="ig-v" id="igVert">—</span></div>
                        <div class="ig-item"><span class="ig-l">Yüzey</span><span class="ig-v" id="igFace">—</span></div>
                        <div class="ig-item"><span class="ig-l">Tür</span><span class="ig-v" id="igType">—</span></div>
                        <div class="ig-item"><span class="ig-l">Genişlik</span><span class="ig-v" id="igW">—</span></div>
                        <div class="ig-item"><span class="ig-l">Yükseklik</span><span class="ig-v" id="igH">—</span></div>
                        <div class="ig-item"><span class="ig-l">Derinlik</span><span class="ig-v" id="igD">—</span></div>
                        <div class="ig-item"><span class="ig-l">ID</span><span class="ig-v" id="igID" style="font-size:9px">—</span></div>
                        <div class="ig-item"><span class="ig-l">Görünür</span><span class="ig-v" id="igVis">—</span></div>
                        <div class="ig-item"><span class="ig-l">Kilitli</span><span class="ig-v" id="igLock">—</span></div>
                    </div>
                </div>
                <div class="rp-sec">
                    <div class="rp-sec-hdr"><span>🔒 OBJEKTİF</span></div>
                    <div class="lp-form">
                        <div class="lp-row lp-toggle-row"><label>Görünürlük</label><label class="tgl"><input type="checkbox" id="objVis" checked><span class="tsl"></span></label></div>
                        <div class="lp-row lp-toggle-row"><label>Kilit</label><label class="tgl"><input type="checkbox" id="objLock"><span class="tsl"></span></label></div>
                        <div class="lp-row lp-toggle-row"><label>Gölge Yayar</label><label class="tgl"><input type="checkbox" id="objCastShadow" checked><span class="tsl"></span></label></div>
                        <div class="lp-row lp-toggle-row"><label>Gölge Alır</label><label class="tgl"><input type="checkbox" id="objRecvShadow" checked><span class="tsl"></span></label></div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Shortcuts panel (always visible at bottom) -->
        <div class="rp-shortcuts">
            <div class="rps-title">KLAVYE KISA YOLLARI</div>
            <div class="rps-list">
                <span class="rps-k">Q</span><span>Seç</span>
                <span class="rps-k">W</span><span>Taşı</span>
                <span class="rps-k">E</span><span>Döndür</span>
                <span class="rps-k">R</span><span>Ölçekle</span>
                <span class="rps-k">Del</span><span>Sil</span>
                <span class="rps-k">F</span><span>Odaklan</span>
                <span class="rps-k">Ctrl+D</span><span>Kopyala</span>
                <span class="rps-k">Ctrl+Z</span><span>Geri Al</span>
                <span class="rps-k">Tab</span><span>Mod Değiştir</span>
                <span class="rps-k">Ctrl+K</span><span>Çizim Modu</span>
                <span class="rps-k">A</span><span>Tümünü Seç</span>
                <span class="rps-k">X</span><span>Sil Onayla</span>
            </div>
        </div>
    </aside>
</div>

<!-- STATUS BAR -->
<div id="statusBar">
    <div id="stMsg">TriForge CAD Pro 3.0 — Hazır</div>
    <div id="stSel">Seçili: —</div>
    <div id="stTransform">Pos: 0, 0, 0 | Rot: 0°, 0°, 0° | Scl: 1, 1, 1</div>
</div>

<!-- MODALS -->
<div id="saveModal" class="modal-bg" style="display:none;">
    <div class="modal-box">
        <div class="modal-hdr"><h3>💾 Projeyi Kaydet</h3><button class="modal-cls" id="mSaveClose">✕</button></div>
        <div class="modal-body">
            <div class="mf-row"><label>Proje Adı</label><input type="text" id="mSaveName" class="mf-inp" value="Tasarim_1"></div>
            <div class="mf-info">📁 <code>projects/</code> klasörüne kaydedilecek</div>
        </div>
        <div class="modal-foot">
            <button class="mb2 mb-sec" id="mSaveCancel">İptal</button>
            <button class="mb2 mb-local" id="mSaveLocal" style="background:var(--blu2);border-color:var(--blu);color:white">Cihaza Kaydet</button>
            <button class="mb2 mb-ok" id="mSaveOk">Sunucuya Kaydet</button>
        </div>
    </div>
</div>

<div id="textModal" class="modal-bg" style="display:none;">
    <div class="modal-box">
        <div class="modal-hdr"><h3>📝 3D Metin</h3><button class="modal-cls" id="mTextClose">✕</button></div>
        <div class="modal-body">
            <div class="mf-row"><label>Metin</label><input type="text" id="mTextStr" class="mf-inp" value="TriForge" maxlength="30"></div>
            <div class="mf-row"><label>Boyut (mm)</label><input type="number" id="mTextSz" class="mf-inp" value="10" min="1"></div>
            <div class="mf-row"><label>Kalınlık (mm)</label><input type="number" id="mTextDepth" class="mf-inp" value="5" min="0.5"></div>
        </div>
        <div class="modal-foot">
            <button class="mb2 mb-sec" id="mTextCancel">İptal</button>
            <button class="mb2 mb-ok" id="mTextOk">Ekle</button>
        </div>
    </div>
</div>

<input type="file" id="localFileInp" accept=".json" style="display:none;">
<div id="toastBox"></div>

<script src="script.js"></script>
</body>
</html>
