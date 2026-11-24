import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Força essa rota a ser dinâmica (não pode ser gerada como página estática).
export const dynamic = "force-dynamic";

// Rota chamada 1x por dia pelo Vercel Cron (ver vercel.json).
// Garante que, mesmo sem webhook, ninguém fique VIP vencido.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");

  // Protege a rota: só o próprio Vercel Cron (com o header certo) pode chamar
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ erro: "Não autorizado" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("usuarios")
    .update({ plano: "free", plano_expira_em: null })
    .eq("plano", "vip")
    .lt("plano_expira_em", new Date().toISOString())
    .select("id");

  if (error) {
    console.error("Erro no cron:", error.message);
    return NextResponse.json({ erro: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, usuariosRebaixados: data?.length ?? 0 });
}
