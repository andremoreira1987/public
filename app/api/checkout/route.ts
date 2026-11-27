import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

const PLANOS = {
  "vip-mensal": { valor: 57, meses: 1, nome: "VIP Mensal" },
  "vip-semestral": { valor: 290, meses: 6, nome: "VIP Semestral" },
  "vip-anual": { valor: 540, meses: 12, nome: "VIP Anual" },
} as const;

type PlanoChave = keyof typeof PLANOS;

export async function POST(req: NextRequest) {
  try {
    const { usuarioId, plano } = await req.json();

    if (!usuarioId || !plano || !(plano in PLANOS)) {
      return NextResponse.json({ erro: "Dados inválidos" }, { status: 400, headers: corsHeaders });
    }

    const config = PLANOS[plano as PlanoChave];

    const { data: usuario, error } = await supabaseAdmin
      .from("usuarios")
      .select("email")
      .eq("id", usuarioId)
      .single();

    if (error || !usuario) {
      return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404, headers: corsHeaders });
    }

    const resposta = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        reason: config.nome,
        external_reference: `${usuarioId}|${plano}`,
        payer_email: usuario.email,
        back_url: "https://vixe-maria.vercel.app/perfil",
        auto_recurring: {
          frequency: config.meses,
          frequency_type: "months",
          transaction_amount: config.valor,
          currency_id: "BRL",
        },
      }),
    });

    const dados = await resposta.json();

    if (!resposta.ok) {
      console.error("Erro Mercado Pago:", dados);
      return NextResponse.json({ erro: "Falha ao criar assinatura" }, { status: 500, headers: corsHeaders });
    }

    return NextResponse.json({ linkPagamento: dados.init_point }, { headers: corsHeaders });
  } catch (err: any) {
    console.error("Erro no checkout:", err.message);
    return NextResponse.json({ erro: "Erro interno" }, { status: 500, headers: corsHeaders });
  }
}
