<?php
/**
 * TriForge CAD — save.php
 * Proje kaydetme ve listeleme endpoint'i
 * PHP 7.4+, XAMPP/WampServer uyumlu
 */

// ─── CORS & JSON Headers ───
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ─── Proje klasörü ───
define('PROJECTS_DIR', __DIR__ . '/projects/');
define('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50MB
define('ALLOWED_CHARS', '/^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ\s_\-\.]+$/u');

// Klasör yoksa oluştur
if (!is_dir(PROJECTS_DIR)) {
    mkdir(PROJECTS_DIR, 0755, true);
}

// ─── İstek Yönlendirme ───
$method = $_SERVER['REQUEST_METHOD'];
$action = null;

if ($method === 'POST') {
    $rawBody = file_get_contents('php://input');

    if (strlen($rawBody) > MAX_FILE_SIZE) {
        jsonError('Dosya boyutu çok büyük (maks 50MB)', 413);
    }

    $body = json_decode($rawBody, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        jsonError('Geçersiz JSON verisi: ' . json_last_error_msg(), 400);
    }

    $action = $body['action'] ?? 'save';

    switch ($action) {
        case 'save':
            handleSave($body);
            break;
        case 'list':
            handleList();
            break;
        case 'load':
            handleLoad($body['filename'] ?? '');
            break;
        case 'delete':
            handleDelete($body['filename'] ?? '');
            break;
        default:
            jsonError('Bilinmeyen işlem: ' . $action, 400);
    }
} elseif ($method === 'GET') {
    $action = $_GET['action'] ?? 'list';
    switch ($action) {
        case 'list':
            handleList();
            break;
        case 'load':
            handleLoad($_GET['filename'] ?? '');
            break;
        default:
            jsonError('Bilinmeyen GET işlemi', 400);
    }
} else {
    jsonError('Desteklenmeyen HTTP metodu: ' . $method, 405);
}

/* ═══════════════════════════════════════════════════════════════
   KAYDET
   ═══════════════════════════════════════════════════════════════ */
function handleSave(body) {
    $name    = sanitizeName($body['name'] ?? 'Proje');
    $data    = $body['data'] ?? null;

    if (empty($data)) {
        jsonError('Kayıt verisi boş');
    }

    if (empty($data['objects'])) {
        jsonError('Sahnede kayıt edilecek obje bulunamadı');
    }

    // Dosya adı: Proje_Adı_20240617_153045.json
    $timestamp = date('Ymd_His');
    $filename  = $name . '_' . $timestamp . '.json';
    $filepath  = PROJECTS_DIR . $filename;

    // Kaydedilecek JSON yapısı
    $saveData = [
        'version'       => '1.0',
        'appName'       => 'TriForge CAD',
        'projectName'   => $name,
        'savedAt'       => date('c'),
        'savedAtLocal'  => date('d.m.Y H:i:s'),
        'objectCount'   => count($data['objects']),
        'objects'       => $data['objects'],
        'camera'        => $data['camera'] ?? null,
        'scene'         => $data['scene'] ?? [],
    ];

    $jsonContent = json_encode($saveData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

    if ($jsonContent === false) {
        jsonError('JSON encode hatası: ' . json_last_error_msg());
    }

    if (file_put_contents($filepath, $jsonContent) === false) {
        jsonError('Dosya yazma hatası. Klasör izinlerini kontrol edin: ' . PROJECTS_DIR);
    }

    jsonSuccess([
        'message'     => 'Proje başarıyla kaydedildi',
        'file'        => $filename,
        'path'        => 'projects/' . $filename,
        'size'        => formatBytes(filesize($filepath)),
        'objectCount' => count($data['objects']),
        'savedAt'     => $saveData['savedAtLocal'],
    ]);
}

/* ═══════════════════════════════════════════════════════════════
   LİSTELE
   ═══════════════════════════════════════════════════════════════ */
function handleList() {
    $files = glob(PROJECTS_DIR . '*.json');

    if ($files === false) {
        jsonSuccess(['projects' => [], 'count' => 0]);
    }

    $projects = [];
    foreach ($files as $file) {
        $filename  = basename($file);
        $content   = @file_get_contents($file);
        $data      = $content ? @json_decode($content, true) : null;

        $projects[] = [
            'filename'    => $filename,
            'name'        => $data['projectName'] ?? pathinfo($filename, PATHINFO_FILENAME),
            'savedAt'     => $data['savedAtLocal'] ?? date('d.m.Y H:i:s', filemtime($file)),
            'objectCount' => $data['objectCount'] ?? 0,
            'size'        => formatBytes(filesize($file)),
            'version'     => $data['version'] ?? '?',
        ];
    }

    // Tarih sıralaması (yeniden eskiye)
    usort($projects, fn($a, $b) => strcmp($b['savedAt'], $a['savedAt']));

    jsonSuccess([
        'projects' => $projects,
        'count'    => count($projects),
    ]);
}

/* ═══════════════════════════════════════════════════════════════
   YÜKLE
   ═══════════════════════════════════════════════════════════════ */
function handleLoad($filename) {
    if (empty($filename)) {
        jsonError('Dosya adı belirtilmedi');
    }

    $filename = basename($filename); // Path traversal koruması
    $filepath = PROJECTS_DIR . $filename;

    if (!file_exists($filepath)) {
        jsonError('Dosya bulunamadı: ' . $filename, 404);
    }

    if (pathinfo($filepath, PATHINFO_EXTENSION) !== 'json') {
        jsonError('Geçersiz dosya türü', 400);
    }

    $content = file_get_contents($filepath);
    if ($content === false) {
        jsonError('Dosya okunamadı');
    }

    $data = json_decode($content, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        jsonError('Dosya bozuk (JSON parse hatası): ' . json_last_error_msg());
    }

    jsonSuccess([
        'message' => 'Proje yüklendi',
        'data'    => $data,
    ]);
}

/* ═══════════════════════════════════════════════════════════════
   SİL
   ═══════════════════════════════════════════════════════════════ */
function handleDelete($filename) {
    if (empty($filename)) {
        jsonError('Dosya adı belirtilmedi');
    }

    $filename = basename($filename);
    $filepath = PROJECTS_DIR . $filename;

    if (!file_exists($filepath)) {
        jsonError('Dosya bulunamadı: ' . $filename, 404);
    }

    if (!unlink($filepath)) {
        jsonError('Dosya silinemedi');
    }

    jsonSuccess(['message' => 'Proje silindi: ' . $filename]);
}

/* ═══════════════════════════════════════════════════════════════
   YARDIMCI FONKSİYONLAR
   ═══════════════════════════════════════════════════════════════ */
function sanitizeName($name) {
    // Güvenli karakterler bırak
    $name = trim($name);
    $name = preg_replace('/[^\w\s\-\.çÇğĞıİöÖşŞüÜ]/u', '_', $name);
    $name = preg_replace('/\s+/', '_', $name);
    $name = substr($name, 0, 100); // Maks 100 karakter
    return $name ?: 'Proje';
}

function formatBytes($bytes) {
    if ($bytes < 1024) return $bytes . ' B';
    if ($bytes < 1048576) return round($bytes / 1024, 1) . ' KB';
    return round($bytes / 1048576, 2) . ' MB';
}

function jsonSuccess($data) {
    echo json_encode(
        array_merge(['success' => true], $data),
        JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE
    );
    exit;
}

function jsonError($message, $code = 400) {
    http_response_code($code);
    echo json_encode([
        'success' => false,
        'error'   => $message,
        'code'    => $code,
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    exit;
}
?>
