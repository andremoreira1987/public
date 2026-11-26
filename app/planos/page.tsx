"use client";

import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Browser } from "@capacitor/browser";

type Periodo = "mensal" | "semestral" | "anual";

// Mapeia o período escolhido na tela para a chave de plano usada
// na rota /api/checkout (ver artefato "checkout-route").
const PLANO_POR_PERIODO: Record<Periodo, string> = {
  mensal: "vip-mensal",
  semestral: "vip-semestral",
  anual: "vip-anual",
};

const PLANOS: Record<
  Periodo,
  { label: string; precoMes: number; precoTotal: number; descontoPct: number; selo?: string }
> = {
  mensal: {
    label: "Mensal",
    precoMes: 57,
    precoTotal: 57,
    descontoPct: 0,
  },
  semestral: {
    label: "Semestral",
    precoMes: 33,
    precoTotal: 198,
    descontoPct: 42, // economia vs 6x mensal (57 x 6 = 342)
    selo: "Mais flexível",
  },
  anual: {
    label: "Anual",
    precoMes: 27,
    precoTotal: 324,
    descontoPct: 53, // economia vs 12x mensal (57 x 12 = 684)
    selo: "Mais econômico",
  },
};

export default function Planos() {
  const { usuario, carregando, recarregarUsuario } = useAuth();
  const router = useRouter();
  const [redirecionando, setRedirecionando] = useState(false);
  const [periodo, setPeriodo] = useState<Periodo>("anual");

  useEffect(() => {
    if (!carregando && !usuario) {
      router.push("/login");
    }
  }, [carregando, usuario, router]);

  // Escuta o fechamento do checkout aberto dentro do app (in-app browser).
  // Assim, quando o usuário terminar de pagar (ou fechar) no Mercado Pago,
  // a sessão do app continua ativa e o perfil é atualizado automaticamente.
  useEffect(() => {
    let listenerHandle: { remove: () => void } | undefined;

    Browser.addListener("browserFinished", async () => {
      setRedirecionando(false);
      await recarregarUsuario();
      router.push("/perfil");
    }).then((handle) => {
      listenerHandle = handle;
    });

    return () => {
      listenerHandle?.remove();
    };
  }, [recarregarUsuario, router]);

  const planoAtual = usuario?.plano === "vip" ? "vip" : "free";
  const selecionado = PLANOS[periodo];

  const [erro, setErro] = useState("");

  async function handleAssinar() {
    setErro("");
    setRedirecionando(true);

    try {
      const resposta = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usuarioId: usuario?.id,
          plano: PLANO_POR_PERIODO[periodo],
        }),
      });

      const dados = await resposta.json();

      if (!resposta.ok || !dados.linkPagamento) {
        setErro("Não foi possível iniciar o pagamento. Tente novamente.");
        setRedirecionando(false);
        return;
      }

      // Abre o checkout do Mercado Pago DENTRO do app (Chrome Custom Tab /
      // SFSafariViewController), mantendo a sessão do Supabase intacta.
      // O webhook (app/api/webhook/mercadopago) atualiza
      // usuarios.plano = 'vip' quando o pagamento for confirmado.
      await Browser.open({ url: dados.linkPagamento });
    } catch (err) {
      setErro("Erro de conexão. Tente novamente.");
      setRedirecionando(false);
    }
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

        {/* Seletor de período */}
        <div className="flex gap-2 mb-5 bg-black/20 p-1.5 rounded-full">
          {(Object.keys(PLANOS) as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${
                periodo === p
                  ? "bg-black text-[#F6B40E] shadow-md"
                  : "text-black/70"
              }`}
            >
              {PLANOS[p].label}
            </button>
          ))}
        </div>

        {/* Plano VIP */}
        <div
          className={`rounded-2xl p-6 shadow-xl border-2 relative overflow-hidden ${
            planoAtual === "vip" ? "border-[#F6B40E]" : "border-[#F6B40E]/40"
          }`}
          style={{ background: "linear-gradient(135deg, #C8102E 0%, #1A1A1A 100%)" }}
        >
          <span className="absolute top-3 right-3 text-[10px] font-bold bg-[#F6B40E] text-black px-2 py-1 rounded-full">
            {selecionado.selo ?? "RECOMENDADO"}
          </span>

          <h3 className="text-white font-bold text-lg mb-1">⭐ Plano VIP</h3>
          <p className="text-gray-300 text-sm mb-4">Acesso total, sem limites.</p>

          <ul className="text-sm text-gray-200 space-y-2 mb-5">
            <li>✅ Todas as aulas: iniciante, intermediário e avançado</li>
            <li>✅ Novas aulas liberadas em primeira mão</li>
            <li>✅ Acompanhamento completo de progresso</li>
          </ul>

          <div className="mb-1 flex items-center gap-2">
            <p className="text-2xl font-extrabold text-white">
              R$ {selecionado.precoMes}
              <span className="text-sm font-normal text-gray-300">/mês</span>
            </p>
            {selecionado.descontoPct > 0 && (
              <span className="text-xs font-bold bg-[#F6B40E] text-black px-2 py-1 rounded-full">
                -{selecionado.descontoPct}%
              </span>
            )}
          </div>

          {periodo !== "mensal" && (
            <p className="text-xs text-gray-300 mb-4">
              Total de R$ {selecionado.precoTotal.toFixed(2).replace(".", ",")} cobrado{" "}
              {periodo === "semestral" ? "a cada 6 meses" : "uma vez por ano"}.
            </p>
          )}

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
              {redirecionando ? "Abrindo checkout..." : `Assinar VIP ${selecionado.label}`}
            </button>
          )}
        </div>

        {erro && (
          <p className="text-[#C8102E] text-sm text-center mt-4 bg-black/10 rounded-lg px-3 py-2">
            {erro}
          </p>
        )}

        <p className="text-xs text-black/70 text-center mt-5">
          Pagamento processado com segurança. Cancele quando quiser.
        </p>
      </div>

      {/* Menu inferior fixo */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black border-t flex justify-around py-3 z-10"
        style={{ borderColor: "#C8102E" }}
      >
        <Link href="/" className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-gray-400">
          <span className="text-lg">🏠</span>
          Início
        </Link>
        <Link href="/aulas" className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-gray-400">
          <span className="text-lg">🎓</span>
          Aulas
        </Link>
        <Link href="/perfil" className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-gray-400">
          <span className="text-lg">👤</span>
          Perfil
        </Link>
      </nav>
    </main>
  );
}
