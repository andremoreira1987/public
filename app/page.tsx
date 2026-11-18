"use client";

import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Aula = {
  id: number;
  titulo: string;
  duracao: string;
  ordem: number;
  progresso: number; // vem da tabela "progresso", 0 se ainda não existir
};

export default function Home() {
  const { usuario, carregando } = useAuth();
  const router = useRouter();
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [carregandoAulas, setCarregandoAulas] = useState(true);

  useEffect(() => {
    if (!carregando && !usuario) {
      router.push("/login");
    }
  }, [carregando, usuario, router]);

  // Busca aulas de Forró (nível iniciante) + progresso do usuário logado
  useEffect(() => {
    async function buscarAulas() {
      if (!usuario) return;

      const { data: aulasData, error: erroAulas } = await supabase
        .from("aulas")
        .select("id, titulo, duracao, ordem")
        .eq("ritmo", "Forró")
        .eq("nivel", "iniciante")
        .order("ordem", { ascending: true })
        .limit(3);

      if (erroAulas) {
        console.error("Erro ao buscar aulas:", erroAulas.message);
        setCarregandoAulas(false);
        return;
      }

      const { data: progressoData } = await supabase
        .from("progresso")
        .select("aula_id, percentual")
        .eq("usuario_id", usuario.id);

      const aulasComProgresso = (aulasData || []).map((aula) => {
        const prog = progressoData?.find((p) => p.aula_id === aula.id);
        return {
          ...aula,
          progresso: prog?.percentual ?? 0,
        };
      });

      setAulas(aulasComProgresso);
      setCarregandoAulas(false);
    }

    buscarAulas();
  }, [usuario]);

  const foto = usuario?.foto_perfil || "/perfil-padrao.png";
  const nome = usuario?.nome || "Visitante";
  const streak = usuario?.streak ?? 0;
  const ritmos = ["Forró"]; // apenas Forró disponível

  const getBadge = (progresso: number) => {
    if (progresso === 0) return { texto: "NOVO", cor: "#C8102E" };
    if (progresso < 100) return { texto: "EM ANDAMENTO", cor: "#F6B40E" };
    return { texto: "CONCLUÍDO", cor: "#2E7D32" };
  };

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
        className="bg-black p-3 fixed top-0 left-0 right-0 max-w-md mx-auto z-10 border-b-4 flex items-center justify-between gap-2"
        style={{ borderColor: "#C8102E" }}
      >
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Vixe Maria" width={40} height={40} className="rounded-full" />
          <h1 className="text-lg font-extrabold text-white tracking-wide">VIXE MARIA</h1>
        </div>

        {/* Avatar do perfil - canto superior direito */}
        <Link
          href="/perfil"
          className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#F6B40E] shrink-0"
        >
          <Image src={foto} alt="Perfil" fill className="object-cover" />
        </Link>
      </header>

      {/* Conteúdo */}
      <div className="pt-24 p-4">
        {/* Saudação personalizada */}
        <h2 className="text-xl font-extrabold text-black mb-1">
          Bom treino, {nome}! 💪
        </h2>
        <p className="text-sm text-black font-medium mb-4">
          Vamos evoluir mais um pouco no Forró hoje?
        </p>

        {/* Card de streak */}
        <div className="flex items-center justify-between bg-black rounded-xl p-4 mb-5 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🔥</span>
            <div>
              <p className="text-xs text-gray-400">Sequência de prática</p>
              <p className="text-lg font-bold text-[#F6B40E]">{streak} dias seguidos!</p>
            </div>
          </div>
          <span className="text-xs text-gray-500">Continue assim</span>
        </div>

        {/* Ritmos disponíveis */}
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

        {/* Aulas em destaque */}
        <h2 className="text-lg font-bold mb-4 text-black flex items-center gap-1.5">
          🕺 Aulas de Forró em destaque
        </h2>

        {carregandoAulas && (
          <p className="text-black text-sm mb-4">Carregando aulas...</p>
        )}

        {!carregandoAulas && aulas.length === 0 && (
          <p className="text-black text-sm mb-4">
            Nenhuma aula encontrada ainda. Cadastre aulas no Supabase para vê-las aqui.
          </p>
        )}

        {aulas.map((aula) => {
          const badge = getBadge(aula.progresso);
          return (
            <div
              key={aula.id}
              className="rounded-2xl shadow-xl mb-5 overflow-hidden active:scale-[0.97] transition"
            >
              {/* Thumbnail */}
              <div
                className="h-32 flex items-center justify-center relative"
                style={{ background: "linear-gradient(135deg, #C8102E 0%, #4A0E0E 60%, #1A1A1A 100%)" }}
              >
                {/* Badge de status */}
                <span
                  className="absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-1 rounded-full tracking-wide"
                  style={{ backgroundColor: badge.cor }}
                >
                  {badge.texto}
                </span>

                <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm animate-pulse">
                  <span className="text-white text-3xl">▶️</span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-black p-3.5">
                <p className="font-bold text-white">{aula.titulo}</p>
                <p className="text-sm text-gray-400 mb-2">{aula.duracao}</p>
                {/* Barra de progresso com percentual */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${aula.progresso}%`, background: "#F6B40E" }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#F6B40E] w-10 text-right">
                    {aula.progresso}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Card motivacional */}
        {aulas.length > 0 && (
          <div
            className="rounded-xl p-4 mb-2 text-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #C8102E 0%, #1A1A1A 100%)" }}
          >
            <p className="text-white font-bold text-sm">
              🎉 Você está quase lá!
            </p>
            <p className="text-gray-300 text-xs mt-1">
              Complete mais {aulas.filter((a) => a.progresso < 100).length} aulas para fechar o módulo
            </p>
          </div>
        )}
      </div>

      {/* Menu inferior fixo */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black border-t flex justify-around py-4 z-10"
        style={{ borderColor: "#C8102E" }}
      >
        <Link href="/" className="text-sm font-bold text-white flex items-center gap-1">
          🏠 Início
        </Link>
        <Link href="/aulas" className="text-sm font-semibold text-gray-400 flex items-center gap-1">
          🎓 Aulas
        </Link>
        <Link href="/perfil" className="text-sm font-semibold text-gray-400 flex items-center gap-1">
          👤 Perfil
        </Link>
      </nav>
    </main>
  );
}
