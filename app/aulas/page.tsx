"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

export default function Aulas() {
  const { usuario, carregando } = useAuth();
  const router = useRouter();
  const foto = usuario?.foto_perfil || "/perfil-padrao.png";
  const ritmos = ["Forró"];

  const [niveis, setNiveis] = useState({
    iniciante: { total: 0, completas: 0, progresso: 0 },
    intermediario: { total: 0 },
    avancado: { total: 0 },
  });
  const [carregandoNiveis, setCarregandoNiveis] = useState(true);

  useEffect(() => {
    if (!carregando && !usuario) {
      router.push("/login");
    }
  }, [carregando, usuario, router]);

  useEffect(() => {
    async function buscarNiveis() {
      if (!usuario) return;

      // Busca total de aulas por nível
      const { data: aulasIniciante } = await supabase
        .from("aulas")
        .select("id")
        .eq("ritmo", "Forró")
        .eq("nivel", "iniciante");

      const { data: aulasIntermediario } = await supabase
        .from("aulas")
        .select("id")
        .eq("ritmo", "Forró")
        .eq("nivel", "intermediario");

      const { data: aulasAvancado } = await supabase
        .from("aulas")
        .select("id")
        .eq("ritmo", "Forró")
        .eq("nivel", "avancado");

      const totalIniciante = aulasIniciante?.length ?? 0;
      const idsIniciante = aulasIniciante?.map((a) => a.id) ?? [];

      // Busca progresso do usuário nas aulas do nível iniciante
      let completas = 0;
      if (idsIniciante.length > 0) {
        const { data: progressoData } = await supabase
          .from("progresso")
          .select("aula_id, percentual")
          .eq("usuario_id", usuario.id)
          .in("aula_id", idsIniciante);

        completas = progressoData?.filter((p) => p.percentual === 100).length ?? 0;
      }

      const percentualGeral =
        totalIniciante > 0 ? Math.round((completas / totalIniciante) * 100) : 0;

      setNiveis({
        iniciante: {
          total: totalIniciante,
          completas,
          progresso: percentualGeral,
        },
        intermediario: { total: aulasIntermediario?.length ?? 0 },
        avancado: { total: aulasAvancado?.length ?? 0 },
      });
      setCarregandoNiveis(false);
    }

    buscarNiveis();
  }, [usuario]);

  if (carregando || !usuario || carregandoNiveis) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-white">Carregando...</p>
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
        className="bg-black p-3 fixed top-0 left-0 right-0 max-w-md mx-auto z-10 border-b-4 flex items-center justify-between gap-2"
        style={{ borderColor: "#C8102E" }}
      >
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Vixe Maria" width={40} height={40} className="rounded-full" />
          <h1 className="text-lg font-extrabold text-white tracking-wide">AULAS</h1>
        </div>

        {/* Avatar do perfil - canto superior direito */}
        <Link
          href="/perfil"
          className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#F6B40E] shrink-0"
        >
          <Image src={foto} alt="Perfil" fill className="object-cover" />
        </Link>
      </header>

      <div className="pt-24 p-4">
        {/* Ritmos disponíveis - mesmo padrão da Home */}
        <h3 className="text-sm font-bold text-black mb-2">Ritmos disponíveis</h3>
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {ritmos.map((ritmo, i) => (
            <span
              key={i}
              className="bg-black text-white text-sm font-semibold px-4 py-2 rounded-full whitespace-nowrap shrink-0 border-2 border-[#F6B40E] flex items-center gap-1.5 shadow-md"
            >
              🪘 {ritmo}
            </span>
          ))}
        </div>

        {/* Resumo do progresso geral */}
        <div className="bg-black rounded-xl p-4 mb-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-base font-bold text-white">Seu nível em Forró</h2>
            <span className="text-xs font-bold text-[#F6B40E]">
              {niveis.iniciante.progresso}% concluído
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            Você está em: <span className="font-bold text-white">Iniciante</span>
          </p>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all"
              style={{ width: `${niveis.iniciante.progresso}%`, background: "#F6B40E" }}
            />
          </div>
        </div>

        <h3 className="text-sm font-bold text-black mb-3">🕺 Níveis de Forró</h3>

        {/* Nível Iniciante - desbloqueado */}
        <Link href="/aulas/iniciante">
          <div className="rounded-2xl shadow-xl mb-4 overflow-hidden active:scale-[0.97] transition relative">
            {/* Badge de status */}
            <span
              className="absolute top-2 left-2 z-10 text-[10px] font-bold text-white px-2 py-1 rounded-full tracking-wide"
              style={{ backgroundColor: "#F6B40E" }}
            >
              EM ANDAMENTO
            </span>

            {/* Thumbnail */}
            <div
              className="h-28 flex items-center justify-center relative"
              style={{ background: "linear-gradient(135deg, #C8102E 0%, #4A0E0E 60%, #1A1A1A 100%)" }}
            >
              <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm animate-pulse">
                <span className="text-white text-3xl">▶️</span>
              </div>
            </div>

            <div className="bg-black p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-bold text-white">🟢 INICIANTE</p>
                <span className="text-xs font-bold text-[#F6B40E]">
                  {niveis.iniciante.completas}/{niveis.iniciante.total} aulas
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">Passos básicos e fundamentos</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${niveis.iniciante.progresso}%`, background: "#F6B40E" }}
                  />
                </div>
                <span className="text-xs font-bold text-[#F6B40E] w-10 text-right">
                  {niveis.iniciante.progresso}%
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Nível Intermediário - bloqueado */}
        <div className="rounded-2xl shadow-lg mb-4 overflow-hidden bg-zinc-800/90 relative">
          <span className="absolute top-2 left-2 z-10 text-[10px] font-bold text-white px-2 py-1 rounded-full tracking-wide bg-zinc-600">
            BLOQUEADO
          </span>
          <div className="h-28 flex items-center justify-center bg-black/30">
            <span className="text-3xl">🔒</span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-white">🟡 INTERMEDIÁRIO</p>
              <span className="text-xs text-gray-400">{niveis.intermediario.total} aulas</span>
            </div>
            <p className="text-sm text-gray-400">
              Desbloqueie completando o nível Iniciante
            </p>
          </div>
        </div>

        {/* Nível Avançado - bloqueado */}
        <div className="rounded-2xl shadow-lg mb-5 overflow-hidden bg-zinc-800/90 relative">
          <span className="absolute top-2 left-2 z-10 text-[10px] font-bold text-white px-2 py-1 rounded-full tracking-wide bg-zinc-600">
            BLOQUEADO
          </span>
          <div className="h-28 flex items-center justify-center bg-black/30">
            <span className="text-3xl">🔒</span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="font-bold text-white">🔴 AVANÇADO</p>
              <span className="text-xs text-gray-400">{niveis.avancado.total} aulas</span>
            </div>
            <p className="text-sm text-gray-400">
              Desbloqueie completando o nível Intermediário
            </p>
          </div>
        </div>

        {/* Card motivacional */}
        <div
          className="rounded-xl p-4 mb-2 text-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #C8102E 0%, #1A1A1A 100%)" }}
        >
          <p className="text-white font-bold text-sm">🎉 Você está indo bem!</p>
          <p className="text-gray-300 text-xs mt-1">
            Complete mais {niveis.iniciante.total - niveis.iniciante.completas} aulas para liberar o próximo nível
          </p>
        </div>
      </div>

      {/* Menu inferior fixo */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black border-t flex justify-around py-4 z-10"
        style={{ borderColor: "#C8102E" }}
      >
        <Link href="/" className="text-sm font-semibold text-gray-400 flex items-center gap-1">
          🏠 Início
        </Link>
        <Link href="/aulas" className="text-sm font-bold text-white flex items-center gap-1">
          🎓 Aulas
        </Link>
        <Link href="/perfil" className="text-sm font-semibold text-gray-400 flex items-center gap-1">
          👤 Perfil
        </Link>
      </nav>
    </main>
  );
}
