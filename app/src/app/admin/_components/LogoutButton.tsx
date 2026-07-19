"use client";

export default function LogoutButton() {
  async function sair() {
    await fetch("/api/auth/logout", { method: "POST" });
    // Importante: usamos navegação "dura" (recarregando a página) em vez de
    // router.push(). O layout do admin decide se mostra o menu lateral
    // verificando a sessão no servidor; com router.push() (navegação leve do
    // Next.js) esse layout não é reexecutado do zero, então o menu antigo
    // continuava aparecendo mesmo depois de sair. Um reload garante que a
    // sessão (já removida pelo /api/auth/logout) seja conferida de novo.
    window.location.href = "/admin/login";
  }

  return (
    <button
      onClick={sair}
      className="w-full text-left text-sm text-white/70 hover:text-white px-3 py-2 rounded-md hover:bg-white/10 transition"
    >
      Sair
    </button>
  );
}
