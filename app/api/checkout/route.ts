import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Configuração dos 3 planos.
// "meses" é usado depois no webhook pra calcular a data de expiração.
const PLANOS = {
  "vip-mensal": { valor: 57, meses: 1, nome: "VIP Mensal" },
  "vip-semestral": { valor: 290, meses: 6, nome: "VIP Semestral" }, // ajuste o valor real
  "vip-anual": { valor: 540, meses: 12, nome: "VIP Anual" }, // ajuste o valor real
} as const;

type PlanoChave = keyof typeof PLANOS;

export async function POST(req: NextRequest) {
  try {
    const { usuarioId, plano } = await req.json();

    if (!usuarioId || !plano || !(plano in PLANOS)) {
      return NextResponse.json({ erro: "Dados inválidos" }, { status: 400 });
    }

    const config = PLANOS[plano as PlanoChave];

    // Busca o e-mail do usuário (Mercado Pago exige payer_email)
    const { data: usuario, error } = await supabaseAdmin
      .from("usuarios")
      .select("email")
      .eq("id", usuarioId)
      .single();

    if (error || !usuario) {
      return NextResponse.json({ erro: "Usuário não encontrado" }, { status: 404 });
    }

    // Monta a assinatura (preapproval) no Mercado Pago
    const resposta = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({
        reason: config.nome,
        external_reference: `${usuarioId}|${plano}`, // usado no webhook pra saber quem e qual plano
        payer_email: usuario.email,
        back_url: "https://vixe-maria-djs3rn5ya-andremoreiraoespartano.vercel.app/perfil",
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
      return NextResponse.json({ erro: "Falha ao criar assinatura" }, { status: 500 });
    }

    // "init_point" é o link de checkout que o usuário deve ser redirecionado
    return NextResponse.json({ linkPagamento: dados.init_point });
  } catch (err: any) {
    console.error("Erro no checkout:", err.message);
    return NextResponse.json({ erro: "Erro interno" }, { status: 500 });
  }
}
