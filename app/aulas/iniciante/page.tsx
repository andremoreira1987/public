"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

// Extrai o ID do vídeo de qualquer formato de link do YouTube
function extrairIdYoutube(url: string): string | null {
  if (!url) return null;
  const regex = /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

type Aula = {
  id: number;
  titulo: string;
  duracao: string;
  video_url: string | null;
  progresso?: number;
};

export default function Iniciante() {
  const { usuario, carregando: carregandoUsuario } = useAuth();
  const router = useRouter();
  const foto = usuario?.foto_perfil || "/perfil-padrao.png";

  const [aulas, setAulas] = useState<Aula[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aulaAberta, setAulaAberta] = useState<Aula | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!carregandoUsuario && !usuario) {
      router.push("/login");
    }
  }, [carregandoUsuario, usuario, router]);

  async function buscarAulas() {
    if (!usuario?.id) return;

    const { data: aulasData, error } = await supabase
      .from("aulas")
      .select("*")
      .eq("nivel", "iniciante")
      .eq("ritmo", "Forró")
      .order("id", { ascending: true });

    if (error) {
      console.error("Erro ao buscar aulas:", error.message);
      setCarregando(false);
      return;
    }

    const idsAulas = (aulasData || []).map((a) => a.id);

    let progressoMap: Record<number, number> = {};
    if (idsAulas.length > 0) {
      const { data: progressoData } = await supabase
        .from("progresso")
        .select("aula_id, percentual")
        .eq("usuario_id", usuario.id)
        .in("aula_id", idsAulas);

      progressoMap = (progressoData || []).reduce((acc, p) => {
        acc[p.aula_id] = p.percentual;
        return acc;
      }, {} as Record<number, number>);
    }

    const aulasComProgresso = (aulasData || []).map((a) => ({
      ...a,
      progresso: progressoMap[a.id] ?? 0,
    }));

    setAulas(aulasComProgresso as Aula[]);
    setCarregando(false);
  }

  useEffect(() => {
    buscarAulas();
  }, [usuario]);

  // Salva (ou atualiza) o percentual de progresso da aula no Supabase
  async function salvarProgresso(aulaId: number, percentual: number) {
    if (!usuario?.id) return;
    setSalvando(true);

    // Verifica se já existe um registro de progresso para essa aula/usuário
    const { data: existente } = await supabase
      .from("progresso")
      .select("id")
      .eq("usuario_id", usuario.id)
      .eq("aula_id", aulaId)
      .maybeSingle();

    if (existente) {
      await supabase
        .from("progresso")
        .update({ percentual })
        .eq("id", existente.id);
    } else {
      await supabase
        .from("progresso")
        .insert({ usuario_id: usuario.id, aula_id: aulaId, percentual });
    }

    setSalvando(false);

    // Atualiza o estado local na hora, sem precisar recarregar a página
    setAulas((prev) =>
      prev.map((a) => (a.id === aulaId ? { ...a, progresso: percentual } : a))
    );
  }

  // Chamado quando o vídeo de arquivo direto (<video>) termina sozinho
  function handleVideoTerminou() {
    if (aulaAberta) {
      salvarProgresso(aulaAberta.id, 100);
    }
  }

  // Chamado pelo botão manual (necessário para vídeos do YouTube, que não
  // disparam evento de término dentro do iframe sem a API oficial do YouTube)
  function handleMarcarConcluida() {
    if (aulaAberta) {
      salvarProgresso(aulaAberta.id, 100);
    }
  }

  const getBadge = (progresso: number = 0) => {
    if (progresso === 100) return { texto: "CONCLUÍDO", cor: "#2E7D32" };
    if (progresso === 0) return { texto: "NOVO", cor: "#C8102E" };
    return { texto: "EM ANDAMENTO", cor: "#F6B40E" };
  };

  if (carregandoUsuario || !usuario) {
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
        className="h-16 bg-black px-3 fixed top-0 left-0 right-0 max-w-md mx-auto z-10 border-b-4 flex items-center justify-between gap-2"
        style={{ borderColor: "#C8102E" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Image
            src="/logo.png"
            alt="Vixe Maria"
            width={32}
            height={32}
            className="rounded-full shrink-0"
          />
          <h1 className="text-sm font-extrabold text-white tracking-wide truncate">
            NÍVEL INICIANTE
          </h1>
        </div>

        <Link
          href="/perfil"
          className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#F6B40E] shrink-0"
        >
          <Image
            src={foto}
            alt="Perfil"
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/perfil-padrao.png";
            }}
          />
        </Link>
      </header>

      <div className="pt-20 p-4">
        <Link href="/aulas" className="text-sm font-bold mb-4 inline-block text-black">
          ← Voltar
        </Link>

        {/* Ritmo - mesmo padrão das outras telas */}
        <div className="mb-5">
          <h3 className="text-sm font-bold text-black mb-2">Ritmo</h3>
          <span className="bg-black text-white text-sm font-semibold px-4 py-2 rounded-full inline-flex items-center gap-1.5 border-2 border-[#F6B40E] shadow-md">
            🪘 Forró
          </span>
        </div>

        <h2 className="text-lg font-bold mb-4 text-black flex items-center gap-1.5">
          🕺 Aulas disponíveis
        </h2>

        {carregando && (
          <p className="text-black font-semibold text-sm mb-4">Carregando aulas...</p>
        )}

        {!carregando && aulas.length === 0 && (
          <p className="text-black font-semibold text-sm mb-4">
            Nenhuma aula cadastrada ainda neste nível.
          </p>
        )}

        {aulas.map((aula) => {
          const badge = getBadge(aula.progresso);
          const videoId = extrairIdYoutube(aula.video_url || "");
          const isVideoDireto = !videoId && !!aula.video_url;
          const thumbnail = videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            : null;

          return (
            <button
              key={aula.id}
              onClick={() => (videoId || isVideoDireto) && setAulaAberta(aula)}
              disabled={!videoId && !isVideoDireto}
              className="w-full text-left rounded-2xl shadow-xl mb-5 overflow-hidden active:scale-[0.97] transition disabled:opacity-70"
            >
              {/* Thumbnail */}
              <div
                className="h-32 flex items-center justify-center relative bg-cover bg-center"
                style={{
                  background: thumbnail
                    ? `url(${thumbnail}) center/cover no-repeat`
                    : "linear-gradient(135deg, #C8102E 0%, #4A0E0E 60%, #1A1A1A 100%)",
                }}
              >
                {/* Badge de status */}
                <span
                  className="absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-1 rounded-full tracking-wide"
                  style={{ backgroundColor: badge.cor }}
                >
                  {badge.texto}
                </span>

                {!videoId && !isVideoDireto && (
                  <span className="absolute top-2 right-2 text-[10px] font-bold text-white px-2 py-1 rounded-full bg-zinc-700">
                    SEM VÍDEO
                  </span>
                )}

                <div className="bg-black/40 rounded-full p-4 backdrop-blur-sm">
                  <span className="text-white text-3xl">▶️</span>
                </div>
              </div>

              {/* Info */}
              <div className="bg-black p-3.5">
                <p className="font-bold text-white">{aula.titulo}</p>
                <p className="text-sm text-gray-400 mb-2">{aula.duracao}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{ width: `${aula.progresso || 0}%`, background: "#F6B40E" }}
                    />
                  </div>
                  <span className="text-xs font-bold text-[#F6B40E] w-10 text-right">
                    {aula.progresso || 0}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {/* Card motivacional */}
        {aulas.length > 0 && (
          <div
            className="rounded-xl p-4 mb-2 text-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #C8102E 0%, #1A1A1A 100%)" }}
          >
            <p className="text-white font-bold text-sm">🎉 Você está quase lá!</p>
            <p className="text-gray-300 text-xs mt-1">
              Continue praticando para avançar de nível
            </p>
          </div>
        )}
      </div>

      {/* Modal do player */}
      {aulaAberta && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setAulaAberta(null)}
        >
          <div
            className="bg-black rounded-xl overflow-hidden w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative" style={{ paddingTop: "56.25%" }}>
              {extrairIdYoutube(aulaAberta.video_url || "") ? (
                <iframe
                  src={`https://www.youtube.com/embed/${extrairIdYoutube(aulaAberta.video_url || "")}?autoplay=1`}
                  title={aulaAberta.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute top-0 left-0 w-full h-full"
                />
              ) : (
                <video
                  src={aulaAberta.video_url || ""}
                  controls
                  autoPlay
                  onEnded={handleVideoTerminou}
                  className="absolute top-0 left-0 w-full h-full"
                />
              )}
            </div>
            <div className="p-4 flex items-center justify-between gap-3">
              <p className="text-white font-bold text-sm truncate">{aulaAberta.titulo}</p>

              <div className="flex items-center gap-3 shrink-0">
                {/* Botão manual: necessário para YouTube, pois o iframe não
                    avisa o React quando o vídeo termina */}
                {extrairIdYoutube(aulaAberta.video_url || "") && aulaAberta.progresso !== 100 && (
                  <button
                    onClick={handleMarcarConcluida}
                    disabled={salvando}
                    className="text-xs font-bold text-black px-3 py-1.5 rounded-full disabled:opacity-60"
                    style={{ background: "#F6B40E" }}
                  >
                    {salvando ? "Salvando..." : "Marcar como concluída ✓"}
                  </button>
                )}

                <button
                  onClick={() => setAulaAberta(null)}
                  className="text-[#F6B40E] font-bold text-sm"
                >
                  Fechar ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu inferior fixo */}
      <nav
        className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black border-t flex justify-around py-3 z-10"
        style={{ borderColor: "#C8102E" }}
      >
        <Link href="/" className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-gray-400">
          <span className="text-lg">🏠</span> Início
        </Link>
        <Link href="/aulas" className="flex flex-col items-center gap-0.5 text-[11px] font-bold text-white">
          <span className="text-lg">🎓</span> Aulas
        </Link>
        <Link href="/perfil" className="flex flex-col items-center gap-0.5 text-[11px] font-semibold text-gray-400">
          <span className="text-lg">👤</span> Perfil
        </Link>
      </nav>
    </main>
  );
}
