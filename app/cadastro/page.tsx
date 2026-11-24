"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    // O nome vai como metadata do Auth. O trigger no banco
    // (handle_new_user) usa esse dado para criar a linha em "usuarios"
    // automaticamente — não é mais necessário inserir manualmente aqui.
    const { error } = await supabase.auth.signUp({
      email,
      password: senha,
      options: {
        data: { nome },
      },
    });

    if (error) {
      setErro(error.message);
      setCarregando(false);
      return;
    }

    setCarregando(false);
    router.refresh();
    router.push("/");
  }

  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-6 py-10"
      style={{ background: "linear-gradient(180deg, #F6B40E 0%, #FBD15B 100%)" }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-20 h-20 mb-3">
          <Image
            src="/logo.png"
            alt="Vixe Maria"
            fill
            className="object-contain rounded-full shadow-lg"
          />
        </div>
        <h2 className="text-black font-extrabold text-xl tracking-wide">VIXE MARIA</h2>
      </div>

      <form
        onSubmit={handleCadastro}
        className="bg-black rounded-3xl p-7 w-full max-w-sm shadow-2xl"
      >
        <h1 className="text-2xl font-extrabold text-white mb-1">Criar conta</h1>
        <p className="text-gray-400 text-sm mb-6">Comece agora no Vixe Maria 🕺</p>

        {/* Nome */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">👤</span>
          <input
            type="text"
            placeholder="Seu nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            autoComplete="name"
            className="w-full pl-11 pr-4 py-4 rounded-xl bg-zinc-800 text-white text-base outline-none focus:ring-2 focus:ring-[#F6B40E] transition-all"
          />
        </div>

        {/* E-mail */}
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">✉️</span>
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full pl-11 pr-4 py-4 rounded-xl bg-zinc-800 text-white text-base outline-none focus:ring-2 focus:ring-[#F6B40E] transition-all"
          />
        </div>

        {/* Senha */}
        <div className="relative mb-5">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">🔒</span>
          <input
            type={mostrarSenha ? "text" : "password"}
            placeholder="Senha (mín. 6 caracteres)"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full pl-11 pr-11 py-4 rounded-xl bg-zinc-800 text-white text-base outline-none focus:ring-2 focus:ring-[#F6B40E] transition-all"
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((v) => !v)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"
            tabIndex={-1}
          >
            {mostrarSenha ? "🙈" : "👁️"}
          </button>
        </div>

        {erro && (
          <p className="text-[#C8102E] text-sm mb-4 bg-[#C8102E]/10 border border-[#C8102E]/30 rounded-lg px-3 py-2">
            {erro}
          </p>
        )}

        <button
          type="submit"
          disabled={carregando}
          className="w-full py-4 rounded-xl font-bold text-black text-base disabled:opacity-60 active:scale-[0.98] transition-all"
          style={{ background: "#F6B40E" }}
        >
          {carregando ? "Criando..." : "Criar conta"}
        </button>

        <p className="text-gray-400 text-sm text-center mt-5">
          Já tem conta?{" "}
          <Link href="/login" className="text-[#F6B40E] font-semibold">
            Entrar
          </Link>
        </p>
      </form>
    </main>
  );
}
