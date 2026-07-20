<?php
// Script temporário de deploy — auto-deleta após uso
// Chamado pelo GitHub Actions após upload do next-build.zip via cPanel UAPI
$dir   = __DIR__;
$zip   = $dir . '/next-build.zip';
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

// Limpeza
@unlink($zip);
@unlink(__FILE__);

echo "OK";
