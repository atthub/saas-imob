import mysql from "mysql2/promise";

// Conexão com o banco do WordPress antigo. Mesma conta de hospedagem do
// sistema atual, então o host é sempre "localhost" — não precisa de acesso
// remoto liberado nem de internet, só das credenciais do banco WP no .env.
let pool: mysql.Pool | null = null;

export function poolWp() {
  if (pool) return pool;

  const host = process.env.WP_DB_HOST;
  const database = process.env.WP_DB_NAME;
  const user = process.env.WP_DB_USER;
  const password = process.env.WP_DB_PASSWORD;

  if (!host || !database || !user || password === undefined) {
    throw new Error(
      "Configure WP_DB_HOST, WP_DB_NAME, WP_DB_USER e WP_DB_PASSWORD no .env do servidor antes de importar."
    );
  }

  pool = mysql.createPool({ host, database, user, password, connectionLimit: 3 });
  return pool;
}

export function prefixoWp() {
  return process.env.WP_DB_PREFIX || "wp_";
}
