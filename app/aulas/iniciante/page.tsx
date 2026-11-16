"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Iniciante() {
  const [foto, setFoto] = useState("/perfil-padrao.png");

  useEffect(() => {
    const salva = localStorage.getItem("fotoPerfil");
    if (salva) setFoto(salva);
  }, []);

  const aulas = [
    { titulo: "Forró básico - Passo 1", duracao: "15 min", progresso: 100 },
    { titulo: "Forró básico - Passo 2", duracao: "18 min", progresso: 40 },
    { titulo: "Postura e condução", duracao: "12 min", progresso: 0 },
    { titulo: "Forró universitário - Giro", duracao: "22 min", progresso: 0 },
  ];

  const getBadge = (progresso: number) => {
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

        {aulas.map((aula, index) => {
          const badge = getBadge(aula.progresso);
          return (
            <div
              key={index}
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
        <div
          className="rounded-xl p-4 mb-2 text-center shadow-lg"
          style={{ background: "linear-gradient(135deg, #C8102E 0%, #1A1A1A 100%)" }}
        >
          <p className="text-white font-bold text-sm">🎉 Você está quase lá!</p>
          <p className="text-gray-300 text-xs mt-1">
            Complete mais {aulas.filter((a) => a.progresso < 100).length} aulas para fechar o módulo
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
