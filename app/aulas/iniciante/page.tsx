"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
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
  const [foto, setFoto] = useState("/perfil-padrao.png");
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [aulaAberta, setAulaAberta] = useState<Aula | null>(null);

  useEffect(() => {
    const salva = localStorage.getItem("fotoPerfil");
    if (salva) setFoto(salva);
  }, []);

  useEffect(() => {
    async function buscarAulas() {
      const { data, error } = await supabase
        .from("aulas")
        .select("*")
        .eq("nivel", "iniciante")
        .eq("ritmo", "Forró")
        .order("id", { ascending: true });

      if (error) {
        console.error("Erro ao buscar aulas:", error.message);
      } else if (data) {
        setAulas(data as Aula[]);
      }
      setCarregando(false);
    }
    buscarAulas();
  }, []);

  const getBadge = (progresso: number = 0) => {
    if (progresso === 100) return { texto: "CONCLUÍDO", cor: "#2E7D32" };
    if (progresso === 0) return { texto: "NOVO", cor: "#C8102E" };
    return { texto: "EM ANDAMENTO", cor: "#F6B40E" };
  };

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
          <Image src="/logo.png" alt="Vixe Maria" width={36} height={36} className="rounded-full" />
          <h1 className="text-lg font-extrabold text-white tracking-wide">NÍVEL INICIANTE</h1>
        </div>

        <Link
          href="/perfil"
          className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-[#F6B40E] shrink-0"
        >
          <Image src={foto} alt="Perfil" fill className="object-cover" />
        </Link>
      </header>

      <div className="pt-24 p-4">
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
          const thumbnail = videoId
            ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
            : null;

          return (
            <button
              key={aula.id}
              onClick={() => videoId && setAulaAberta(aula)}
              disabled={!videoId}
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

                {!videoId && (
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
              <iframe
                src={`https://www.youtube.com/embed/${extrairIdYoutube(aulaAberta.video_url || "")}?autoplay=1`}
                title={aulaAberta.titulo}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
              />
            </div>
            <div className="p-4 flex items-center justify-between">
              <p className="text-white font-bold text-sm">{aulaAberta.titulo}</p>
              <button
                onClick={() => setAulaAberta(null)}
                className="text-[#F6B40E] font-bold text-sm"
              >
                Fechar ✕
              </button>
            </div>
          </div>
        </div>
      )}

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
