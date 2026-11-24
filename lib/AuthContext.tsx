"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  foto_perfil: string | null;
  nivel_atual: string;
  streak: number;
  plano: string;
};

type AuthContextType = {
  usuario: Usuario | null;
  carregando: boolean;
  recarregarUsuario: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  carregando: true,
  recarregarUsuario: async () => false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function buscarPerfil(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.error("Erro ao buscar perfil:", error?.message);
      return false;
    }

    setUsuario(data as Usuario);
    return true;
  }

  async function recarregarUsuario(): Promise<boolean> {
    const { data: sessao } = await supabase.auth.getSession();
    if (sessao.session?.user) {
      // Tenta algumas vezes, pois pode haver delay de propagação
      // da sessão recém-criada até o RLS liberar a leitura.
      let sucesso = false;
      for (let tentativa = 0; tentativa < 3 && !sucesso; tentativa++) {
        sucesso = await buscarPerfil(sessao.session.user.id);
        if (!sucesso) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
      return sucesso;
    }
    return false;
  }

  useEffect(() => {
    let ativo = true;

    async function inicializar() {
      const { data } = await supabase.auth.getSession();
      if (!ativo) return;

      if (data.session?.user) {
        await buscarPerfil(data.session.user.id);
      }

      if (ativo) setCarregando(false);
    }

    inicializar();

    // Escuta mudanças de login/logout
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!ativo) return;

      if (session?.user) {
        await buscarPerfil(session.user.id);
      } else {
        setUsuario(null);
      }
      setCarregando(false);
    });

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, carregando, recarregarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
