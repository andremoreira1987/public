"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

// Dados mock que ainda não têm tabela no banco
const mock = {
  ritmos: ["Forró"],
  conquistas: [
    { titulo: "10 aulas completas", icone: "🏆" },
    { titulo: "7 dias seguidos", icone: "🔥" },
    { titulo: "Forró Master", icone: "💃" },
  ],
  aulas: [
    { titulo: "Forró - Básico 1", progresso: 75 },
    { titulo: "Forró - Passo 2", progresso: 25 },
    { titulo: "Forró Universitário", progresso: 100 },
  ],
};

export default function Perfil() {
  const { usuario, carregando, recarregarUsuario } = useAuth();
  const router = useRouter();
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (usuario?.foto_perfil) setFotoPreview(usuario.foto_perfil);
  }, [usuario]);

  // Redireciona para o login se não houver usuário logado
  useEffect(() => {
    if (!carregando && !usuario) {
      router.push("/login");
    }
  }, [carregando, usuario, router]);

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !usuario) return;

    setEnviando(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setFotoPreview(base64);

      // Salva a foto (base64) direto na tabela usuarios
      await supabase
        .from("usuarios")
        .update({ foto_perfil: base64 })
        .eq("id", usuario.id);

      await recarregarUsuario();
      setEnviando(false);
    };
    reader.readAsDataURL(file);
  }

  if (carregando || !usuario) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-white">
        Carregando perfil...
      </div>
    );
  }

  const nome = usuario?.nome || "Visitante";
  const email = usuario?.email || "—";
  const nivel = usuario?.nivel_atual
    ? usuario.nivel_atual.charAt(0).toUpperCase() + usuario.nivel_atual.slice(1)
    : "Iniciante";
  const streak = usuario?.streak ?? 0;
  const fotoAtual = fotoPreview || "/perfil-padrao.png";

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
            src={fotoAtual}
            alt="Foto de perfil"
            fill
            className="object-cover"
          />
        </div>

        <label className="text-sm text-[#F6B40E] cursor-pointer font-semibold hover:underline">
          {enviando ? "Salvando..." : "Alterar foto"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFotoChange}
            disabled={enviando || !usuario}
            className="hidden"
          />
        </label>

        <h1 className="text-xl font-bold mt-3">{nome}</h1>
        <p className="text-gray-400 text-sm">{email}</p>

        <div className="flex gap-2 mt-3">
          <span className="bg-[#C8102E] text-xs font-semibold px-3 py-1 rounded-full">
            Plano Mensal
          </span>
          <span className="bg-[#F6B40E] text-black text-xs font-bold px-3 py-1 rounded-full">
            {nivel}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <p className="text-sm text-gray-400">Sequência de prática</p>
            <p className="text-lg font-bold text-[#F6B40E]">{streak} dias</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">Continue firme!</p>
      </div>

      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-400 mb-2">Ritmos praticados</h2>
        <div className="flex flex-wrap gap-2">
          {mock.ritmos.map((ritmo, i) => (
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
          {mock.conquistas.map((c, i) => (
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
          {mock.aulas.map((aula, i) => (
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
