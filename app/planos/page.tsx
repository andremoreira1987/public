"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ⚠️ Link de checkout provisório — troque pela URL real do Stripe/Mercado Pago
// quando a integração de pagamento for feita.
const LINK_CHECKOUT_VIP = "https://checkout.exemplo.com/vixe-maria-vip";

export default function Planos() {
  const { usuario, carregando } = useAuth();
  const router = useRouter();
  const [redirecionando, setRedirecionando] = useState(false);

  useEffect(() => {
    if (!carregando && !usuario) {
      router.push("/login");
    }
  }, [carregando, usuario, router]);

  const planoAtual = usuario?.plano === "vip" ? "vip" : "free";

  function handleAssinar() {
    setRedirecionando(true);
    // Abre o checkout externo. Depois do pagamento confirmado,
    // o gateway deve avisar o backend (webhook) pra atualizar
    // usuarios.plano = 'vip' no Supabase.
    window.location.href = LINK_CHECKOUT_VIP;
  }

  if (carregando || !usuario) {
    return (
      <main
        className="min-h-screen max-w-md mx-auto flex items-center justify-center"
        style={{ background: "linear-gradient(180deg, #F6B40E 0%, #FBD15B 100%)" }}
      >
        <p className="text-black font-bold">Carregando...</p>
      </main>
    );
  }

  return (
    <main
      className="pb-24 min-h-screen max-w-md mx-auto relative"
      style={{ background: "linear-gradient(180deg, #F6B40E 0%, #FBD15B 100%)" }}
    >
      {/* Topo fixo */}
      <header
        className="bg-black p-4 fixed top-0 left-0 right-0 max-w-md mx-auto z-10 border-b-4 flex items-center gap-3"
        style={{ borderColor: "#C8102E" }}
      >
        <Link href="/perfil" className="text-white text-lg">←</Link>
        <h1 className="text-lg font-extrabold text-white tracking-wide">PLANOS</h1>
      </header>

      <div className="pt-24 p-4">
        <h2 className="text-xl font-extrabold text-black mb-1">
          Escolha seu plano 🕺
        </h2>
        <p className="text-sm text-black font-medium mb-6">
          Libere o acesso total às aulas de Forró e acelere sua evolução.
        </p>

        {/* Plano Free */}
        <div
          className={`rounded-2xl p-6 mb-5 shadow-lg border-2 ${
            planoAtual === "free" ? "border-[#F6B40E]" : "border-transparent"
          } bg-black`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-bold text-lg">Plano Gratuito</h3>
            {planoAtual === "free" && (
              <span className="text-[10px] font-bold bg-gray-600 text-white px-2 py-1 rounded-full">
                SEU PLANO
              </span>
            )}
          </div>
          <p className="text-gray-400 text-sm mb-4">Para começar e sentir o ritmo.</p>
          <ul className="text-sm text-gray-300 space-y-2 mb-2">
            <li>✅ Acesso a aulas iniciantes limitadas</li>
            <li>✅ Acompanhamento de progresso</li>
            <li>🚫 Sem acesso a intermediário/avançado</li>
          </ul>
        </div>

        {/* Plano VIP */}
        <div
          className={`rounded-2xl p-6 shadow-xl border-2 relative overflow-hidden ${
            planoAtual === "vip" ? "border-[#F6B40E]" : "border-[#F6B40E]/40"
          }`}
          style={{ background: "linear-gradient(135deg, #C8102E 0%, #1A1A1A 100%)" }}
        >
          <span className="absolute top-3 right-3 text-[10px] font-bold bg-[#F6B40E] text-black px-2 py-1 rounded-full">
            RECOMENDADO
          </span>

          <h3 className="text-white font-bold text-lg mb-1">⭐ Plano VIP</h3>
          <p className="text-gray-300 text-sm mb-4">Acesso total, sem limites.</p>

          <ul className="text-sm text-gray-200 space-y-2 mb-5">
            <li>✅ Todas as aulas: iniciante, intermediário e avançado</li>
            <li>✅ Novas aulas liberadas em primeira mão</li>
            <li>✅ Acompanhamento completo de progresso</li>
          </ul>

          <p className="text-2xl font-extrabold text-white mb-4">
            R$ 29,90<span className="text-sm font-normal text-gray-300">/mês</span>
          </p>

          {planoAtual === "vip" ? (
            <div className="w-full py-3 rounded-lg font-bold text-center bg-gray-700 text-gray-300">
              Você já é VIP 🎉
            </div>
          ) : (
            <button
              onClick={handleAssinar}
              disabled={redirecionando}
              className="w-full py-3 rounded-lg font-bold text-black disabled:opacity-60"
              style={{ background: "#F6B40E" }}
            >
              {redirecionando ? "Redirecionando..." : "Assinar VIP"}
            </button>
          )}
        </div>

        <p className="text-xs text-black/70 text-center mt-5">
          Pagamento processado com segurança. Cancele quando quiser.
        </p>
      </div>

      {/* Menu inferior fixo */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black border-t flex justify-around py-4 z-10"
        style={{ borderColor: "#C8102E" }}
      >
        <Link href="/" className="text-sm font-semibold text-gray-400 flex items-center gap-1">
          🏠 Início
        </Link>
        <Link href="/aulas" className="text-sm font-semibold text-gray-400 flex items-center gap-1">
          🎓 Aulas
        </Link>
        <Link href="/planos" className="text-sm font-bold text-white flex items-center gap-1">
          ⭐ Planos
        </Link>
        <Link href="/perfil" className="text-sm font-semibold text-gray-400 flex items-center gap-1">
          👤 Perfil
        </Link>
      </nav>
    </main>
  );
}
