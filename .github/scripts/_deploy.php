<?php
// Script temporário de deploy — auto-deleta após uso
// Chamado pelo GitHub Actions após upload do zip via cPanel UAPI
// Parâmetro: ?zip=nome-do-arquivo.zip (obrigatório)

$dir = __DIR__;

$zipname = isset($_GET['zip']) ? basename($_GET['zip']) : '';
if (!$zipname || !preg_match('/^deploy-[0-9]+\.zip$/', $zipname)) {
    http_response_code(400);
    die("Parametro zip invalido ou ausente");
}

$zip   = $dir . '/' . $zipname;
$touch = $dir . '/tmp/restart.txt';

if (!file_exists($zip)) {
    http_response_code(404);
    die("ZIP not found: $zip");
}

$z = new ZipArchive();
if ($z->open($zip) !== TRUE) {
    http_response_code(500);
    die("Failed to open zip");
}

$z->extractTo($dir);
$z->close();

// Reinicia Passenger tocando tmp/restart.txt
@mkdir(dirname($touch), 0755, true);
file_put_contents($touch, date('c'));

// Limpa todos os zips de deploy antigos (deploy-*.zip)
foreach (glob($dir . '/deploy-*.zip') as $old) {
    @unlink($old);
}

// Auto-deleta
@unlink(__FILE__);

echo "OK";
