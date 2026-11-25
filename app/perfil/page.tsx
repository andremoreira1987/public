"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

const mock = {
  ritmos: ["Forró"],
};

type AulaProgresso = {
  id: number;
  titulo: string;
  progresso: number;
};

type Conquista = {
  titulo: string;
  icone: string;
  desbloqueada: boolean;
};

export default function Perfil() {
  const { usuario, carregando, recarregarUsuario } = useAuth();
  const router = useRouter();
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [aulas, setAulas] = useState<AulaProgresso[]>([]);
  const [carregandoAulas, setCarregandoAulas] = useState(true);

  useEffect(() => {
    if (usuario?.foto_perfil) setFotoPreview(usuario.foto_perfil);
  }, [usuario]);

  useEffect(() => {
    if (!carregando && !usuario) {
      router.push("/login");
    }
  }, [carregando, usuario, router]);

  useEffect(() => {
    async function buscarMinhasAulas() {
      if (!usuario) return;

      const { data: progressoData, error: erroProgresso } = await supabase
        .from("progresso")
        .select("aula_id, percentual")
        .eq("usuario_id", usuario.id);

      if (erroProgresso) {
        console.error("Erro ao buscar progresso:", erroProgresso.message);
        setCarregandoAulas(false);
        return;
      }

      if (!progressoData || progressoData.length === 0) {
        setAulas([]);
        setCarregandoAulas(false);
        return;
      }

      const idsAulas = progressoData
        .map((p) => p.aula_id)
        .filter((id): id is number => id !== null);

      if (idsAulas.length === 0) {
        setAulas([]);
        setCarregandoAulas(false);
        return;
      }

      const { data: aulasData, error: erroAulas } = await supabase
        .from("aulas")
        .select("id, titulo")
        .in("id", idsAulas);

      if (erroAulas) {
        console.error("Erro ao buscar aulas:", erroAulas.message);
        setCarregandoAulas(false);
        return;
      }

      const aulasComProgresso = (aulasData || []).map((aula) => {
        const prog = progressoData.find((p) => p.aula_id === aula.id);
        return {
          id: aula.id,
          titulo: aula.titulo,
          progresso: prog?.percentual ?? 0,
        };
      });

      setAulas(aulasComProgresso);
      setCarregandoAulas(false);
    }

    buscarMinhasAulas();
  }, [usuario]);

  async function handleSair() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleFotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !usuario) return;

    setEnviando(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setFotoPreview(base64);

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
  const plano = usuario?.plano === "vip" ? "vip" : "free";
  const tiposPlano: Record<string, string> = {
    mensal: "Mensal",
    semestral: "Semestral",
    anual: "Anual",
  };
  const tipoPlanoLabel =
    plano === "vip"
      ? tiposPlano[(usuario as any)?.tipo_plano] || "Mensal"
      : null;
  const streak = usuario?.streak ?? 0;
  const fotoAtual = fotoPreview || null;

  const totalCompletas = aulas.filter((a) => a.progresso === 100).length;

  const conquistas: Conquista[] = [
    {
      titulo: "Primeiro passo",
      icone: "🥉",
      desbloqueada: totalCompletas >= 1,
    },
    {
      titulo: "Chama no pé (10 aulas)",
      icone: "🔥",
      desbloqueada: totalCompletas >= 10,
    },
    {
      titulo: "Mestre do Forró (15 aulas)",
      icone: "🏆",
      desbloqueada: totalCompletas >= 15,
    },
    {
      titulo: "Sequência de ouro (+30 dias)",
      icone: "⭐",
      desbloqueada: streak > 30,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black text-white p-6 pb-28 max-w-md mx-auto">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-[#F6B40E] mb-8 transition-colors"
      >
        ← Voltar ao início
      </Link>

      {/* Card principal do perfil */}
      <div className="relative bg-gradient-to-br from-[#C8102E]/20 to-[#F6B40E]/10 border border-[#F6B40E]/30 rounded-3xl p-8 flex flex-col items-center text-center mb-10 shadow-xl shadow-black/40">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[#F6B40E] shadow-[0_0_25px_rgba(246,180,14,0.35)] mb-5 flex items-center justify-center bg-zinc-900">
          {fotoAtual ? (
            <Image
              src={fotoAtual}
              alt="Foto de perfil"
              fill
              className="object-cover"
              onError={() => setFotoPreview(null)}
            />
          ) : (
            <span className="text-xs text-gray-400 text-center px-4 leading-tight">
              Foto de perfil
            </span>
          )}
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

        <h1 className="text-xl font-bold mt-4">{nome}</h1>
        <p className="text-gray-400 text-sm mt-1">{email}</p>

        <div className="flex gap-2 mt-4">
          {plano === "vip" ? (
            <span className="bg-gradient-to-r from-[#F6B40E] to-[#FBD15B] text-black text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1">
              ⭐ Plano VIP
            </span>
          ) : (
            <span className="bg-zinc-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              Plano Gratuito
            </span>
          )}
          {tipoPlanoLabel && (
            <span className="bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              Plano {tipoPlanoLabel}
            </span>
          )}
        </div>

        {plano === "free" && (
          <Link
            href="/planos"
            className="mt-4 text-xs font-bold text-[#F6B40E] hover:underline flex items-center gap-1"
          >
            🚀 Fazer upgrade para VIP
          </Link>
        )}
      </div>

      {/* Sequência de prática */}
      <div className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-2xl p-6 mb-10 shadow-lg shadow-black/20">
        <div className="flex items-center gap-4">
          <span className="text-4xl">🔥</span>
          <div>
            <p className="text-sm text-gray-400">Sequência de prática</p>
            <p className="text-xl font-bold text-[#F6B40E]">{streak} dias</p>
          </div>
        </div>
        <p className="text-xs text-gray-500">Continue firme!</p>
      </div>

      {/* Ritmos praticados */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
          Ritmos praticados
        </h2>
        <div className="flex flex-wrap gap-2">
          {mock.ritmos.map((ritmo, i) => (
            <span
              key={i}
              className="bg-zinc-800 border border-zinc-700 text-sm px-4 py-1.5 rounded-full"
            >
              {ritmo}
            </span>
          ))}
        </div>
      </div>

      {/* Conquistas */}
      <div className="mb-10">
        <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
          Conquistas
        </h2>
        <div className="grid grid-cols-2 gap-4">
          {conquistas.map((c, i) => (
            <div
              key={i}
              className={`border rounded-2xl p-5 flex flex-col items-center text-center gap-3 transition-all ${
                c.desbloqueada
                  ? "bg-zinc-900 border-[#F6B40E]/40 shadow-lg shadow-[#F6B40E]/5"
                  : "bg-zinc-900/40 border-zinc-800 opacity-40 shadow-none"
              }`}
            >
              <span className="text-4xl">{c.icone}</span>
              <p className="text-xs text-gray-300 leading-snug">{c.titulo}</p>
              {!c.desbloqueada && (
                <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                  Bloqueada
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Minhas aulas */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
          Minhas Aulas
        </h2>

        {carregandoAulas && (
          <p className="text-sm text-gray-400">Carregando aulas...</p>
        )}

        {!carregandoAulas && aulas.length === 0 && (
          <p className="text-sm text-gray-400">
            Você ainda não começou nenhuma aula. Que tal assistir a primeira hoje?
          </p>
        )}

        <div className="space-y-4">
          {aulas.map((aula) => (
            <div
              key={aula.id}
              className="bg-zinc-900 border border-zinc-800 p-5 rounded-2xl shadow-md shadow-black/20"
            >
              <div className="flex justify-between mb-3">
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

        <button
          onClick={handleSair}
          className="w-full mt-8 py-3 rounded-xl border border-red-600 text-red-500 font-bold hover:bg-red-600/10 transition-colors"
        >
          🚪 Sair da conta
        </button>
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
        <Link href="/perfil" className="flex flex-col items-center gap-0.5 text-[11px] font-bold text-white">
          <span className="text-lg">👤</span>
          Perfil
        </Link>
      </nav>
    </div>
  );
}
