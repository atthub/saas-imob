import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_SECRET_KEY = new TextEncoder().encode(JWT_SECRET);
const TOKEN_COOKIE = "imob_session";
const TOKEN_EXPIRES_IN = "7d";

export type SessionPayload = {
  usuarioId: string;
  imobiliariaId: string | null;
  papel: "SUPER_ADMIN" | "ADMIN" | "CORRETOR";
  nome: string;
  permissoes: string[];
};

export async function hashSenha(senha: string) {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

// Usamos "jose" (em vez de "jsonwebtoken") porque o middleware do Next.js
// roda no Edge Runtime, que não tem o módulo "crypto" do Node — então
// "jsonwebtoken" falha silenciosamente ali (verify sempre dá erro, sessão
// nunca é reconhecida, e o usuário fica preso na tela de login mesmo com
// o cookie certo). "jose" funciona tanto no Node quanto no Edge.
export async function gerarTokenSessao(payload: SessionPayload) {
  return new SignJWT(payload as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRES_IN)
    .sign(JWT_SECRET_KEY);
}

export async function verificarTokenSessao(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE_NAME = TOKEN_COOKIE;
