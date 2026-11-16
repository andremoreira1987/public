"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

// Dados do aluno (mock - depois vem do banco de dados)
const aluno = {
  nome: "João Silva",
  email: "joao.silva@email.com",
  foto: "/perfil-padrao.png",
  plano: "Plano Mensal",
  nivel: "Intermediário",
  streak: 12,
  ritmos: ["Forró", "Bachata", "Salsa"],
  conquistas: [
    { titulo: "10 aulas completas", icone: "🏆" },
    { titulo: "7 dias seguidos", icone: "🔥" },
    { titulo: "Salsa Master", icone: "💃" },
  ],
  aulas: [
    { titulo: "Forró - Básico 1", progresso: 75 },
    { titulo: "Bachata - Passos Iniciais", progresso: 25 },
    { titulo: "Salsa - Fundamentos", progresso: 100 },
  ],
};

export default function Perfil() {
  const [fotoPreview, setFotoPreview] = useState(aluno.foto);

  // Carrega a foto salva ao abrir a página
  useEffect(() => {
    const salva = localStorage.getItem("fotoPerfil");
    if (salva) setFotoPreview(salva);
  }, []);

  function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        setFotoPreview(base64);
        localStorage.setItem("fotoPerfil", base64); // salva persistente
      };
      reader.readAsDataURL(file);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white p-6 max-w-md mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-[#F6B40E] mb-6 transition-colors"
      >
        ← Voltar ao início
      </Link>

      <div className="relative bg-gradient-to-br from-[#C8102E]/20 to-[#F6B40E]/10 border border-[#F6B40E]/30 rounded-2xl p-6 flex flex-col items-center text-center mb-6 shadow-lg shadow-black/40">
        <div className="relative w-28 h-28 rounded-full overflow-hidden border-4 border-[#F6B40E] shadow-[0_0_20px_rgba(246,180,14,0.4)] mb-3">
          <Image
            src={fotoPreview}
            alt="Foto de perfil"
            fill
            className="object-cover"
          />
        </div>

        <label className="text-sm text-[#F6B40E] cursor-pointer font-semibold hover:underline">
          Alterar foto
          <input
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            className="hidden"
          />
        </label>

        <h1 className="text-xl font-bold mt-3">{aluno.nome}</h1>
        <p className="text-gray-400 text-sm">{aluno.email}</p>

        <div className="flex gap-2 mt-3">
          <span className="bg-[#C8102E] text-xs font-semibold px-3 py-1 rounded-full">
            {aluno.plano}
          </span>
          <span className="bg-[#F6B40E] text-black text-xs font-bold px-3 py-1 rounded-full">
            {aluno.nivel}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-sm text-gray-400">Sequência de prática</p>
            <p className="text-lg font-bold text-[#F6B40E]">{aluno.streak} dias</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">Continue firme!</p>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-2">Ritmos praticados</h2>
        <div className="flex flex-wrap gap-2">
          {aluno.ritmos.map((ritmo, i) => (
            <span
              key={i}
              className="bg-zinc-800 border border-zinc-700 text-sm px-3 py-1 rounded-full"
            >
              {ritmo}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-2">Conquistas</h2>
        <div className="grid grid-cols-3 gap-2">
          {aluno.conquistas.map((c, i) => (
            <div
              key={i}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 flex flex-col items-center text-center gap-1"
            >
              <span className="text-2xl">{c.icone}</span>
              <p className="text-xs text-gray-300">{c.titulo}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">Minhas Aulas</h2>
        <div className="space-y-4">
          {aluno.aulas.map((aula, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <div className="flex justify-between mb-2">
                <p className="text-sm font-semibold">{aula.titulo}</p>
                <p className="text-sm text-[#F6B40E] font-bold">{aula.progresso}%</p>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-[#F6B40E] to-[#C8102E]"
                  style={{ width: `${aula.progresso}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
