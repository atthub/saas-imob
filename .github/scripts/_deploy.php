<?php
// Script temporário de deploy — auto-deleta após uso
// Fica em /public_html/ (fora do Next.js/Passenger)
// O zip fica em /public_html/vitrineimob/ e é extraído lá
// Chamado por: https://dominio.com.br/_deploy-RUNID.php?zip=deploy-RUNID.zip

$appDir = __DIR__ . '/vitrineimob';

$zipname = isset($_GET['zip']) ? basename($_GET['zip']) : '';
if (!$zipname || !preg_match('/^deploy-[0-9]+\.zip$/', $zipname)) {
    http_response_code(400);
    die("Parametro zip invalido ou ausente");
}

$zip   = $appDir . '/' . $zipname;
$touch = $appDir . '/tmp/restart.txt';

if (!file_exists($zip)) {
    http_response_code(404);
    die("ZIP not found: $zip");
}

$z = new ZipArchive();
if ($z->open($zip) !== TRUE) {
    http_response_code(500);
    die("Failed to open zip");
}

$z->extractTo($appDir);
$z->close();

// Reinicia Passenger tocando tmp/restart.txt
@mkdir(dirname($touch), 0755, true);
file_put_contents($touch, date('c'));

// Limpa todos os zips de deploy antigos em vitrineimob/
foreach (glob($appDir . '/deploy-*.zip') as $old) {
    @unlink($old);
}

// Limpa PHPs de deploy antigos na raiz (exceto este)
foreach (glob(__DIR__ . '/_deploy-*.php') as $old) {
    if (realpath($old) !== realpath(__FILE__)) @unlink($old);
}

// Auto-deleta este script da raiz
@unlink(__FILE__);

echo "OK";
