"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    // 1. Cria o usuário na autenticação do Supabase
    const { data, error } = await supabase.auth.signUp({ email, password: senha });

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    // 2. Salva os dados extras na tabela "usuarios"
    if (data.user) {
      await supabase.from("usuarios").insert({
        id: data.user.id,
        nome,
        email,
        nivel_atual: "iniciante",
        streak: 0,
      });
    }

    setCarregando(false);
    router.push("/");
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(180deg, #F6B40E 0%, #FBD15B 100%)" }}
    >
      <form
        onSubmit={handleCadastro}
        className="bg-black rounded-2xl p-6 w-full max-w-sm shadow-xl"
      >
        <h1 className="text-2xl font-extrabold text-white mb-1">Criar conta</h1>
        <p className="text-gray-400 text-sm mb-5">Comece agora no Vixe Maria 🕺</p>

        <input
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          className="w-full mb-3 p-3 rounded-lg bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-[#F6B40E]"
        />
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
          placeholder="Senha (mín. 6 caracteres)"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          minLength={6}
          className="w-full mb-4 p-3 rounded-lg bg-zinc-800 text-white outline-none focus:ring-2 focus:ring-[#F6B40E]"
        />

        {erro && <p className="text-[#C8102E] text-sm mb-3">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="w-full py-3 rounded-lg font-bold text-black disabled:opacity-60"
          style={{ background: "#F6B40E" }}
        >
          {carregando ? "Criando..." : "Criar conta"}
        </button>

        <p className="text-gray-400 text-xs text-center mt-4">
          Já tem conta?{" "}
          <a href="/login" className="text-[#F6B40E] font-semibold">
            Entrar
          </a>
        </p>
      </form>
    </main>
  );
}
