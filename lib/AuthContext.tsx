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
  recarregarUsuario: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  carregando: true,
  recarregarUsuario: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function buscarPerfil(userId: string) {
    const { data } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) setUsuario(data as Usuario);
  }

  async function recarregarUsuario() {
    const { data: sessao } = await supabase.auth.getSession();
    if (sessao.session?.user) {
      await buscarPerfil(sessao.session.user.id);
    }
  }

  useEffect(() => {
    // Checa sessão ativa ao carregar o app
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        buscarPerfil(data.session.user.id).finally(() => setCarregando(false));
      } else {
        setCarregando(false);
      }
    });

    // Escuta mudanças de login/logout
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        buscarPerfil(session.user.id);
      } else {
        setUsuario(null);
      }
    });

    return () => listener.subscription.unsubscribe();
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
