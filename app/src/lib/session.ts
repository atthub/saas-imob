import { cookies } from "next/headers";
import { verificarTokenSessao, SESSION_COOKIE_NAME } from "./auth";

export async function obterSessaoAtual() {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verificarTokenSessao(token);
}
