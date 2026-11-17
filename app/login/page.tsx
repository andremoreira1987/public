"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });

    if (error) {
      setErro("E-mail ou senha incorretos.");
      setCarregando(false);
      return;
    }

    router.push("/");
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, #F6B40E 0%, #FBD15B 100%)" }}
    >
      <form
        onSubmit={handleLogin}
        className="bg-black rounded-2xl p-6 w-full max-w-sm shadow-xl"
      >
        <h1 className="text-2xl font-extrabold text-white mb-1">Entrar</h1>
        <p className="text-gray-400 text-sm mb-5">Bom te ver de volta! 🕺</p>

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-3 p-3 rounded-lg bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-[#F6B40E]"
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          className="w-full mb-4 p-3 rounded-lg bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-[#F6B40E]"
        />

        {erro && <p className="text-[#C8102E] text-sm mb-3">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="w-full py-3 rounded-lg font-bold text-black disabled:opacity-60"
          style={{ background: "#F6B40E" }}
        >
          {carregando ? "Entrando..." : "Entrar"}
        </button>

        <p className="text-gray-400 text-xs text-center mt-4">
          Não tem conta?{" "}
          <Link href="/cadastro" className="text-[#F6B40E] font-semibold">
            Criar conta
          </Link>
        </p>
      </form>
    </main>
  );
}
