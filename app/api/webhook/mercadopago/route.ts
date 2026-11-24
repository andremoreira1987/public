import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const MESES_POR_PLANO: Record<string, number> = {
  "vip-mensal": 1,
  "vip-semestral": 6,
  "vip-anual": 12,
};

// Calcula a nova data de expiração (hoje + N meses)
function calcularExpiracao(meses: number) {
  const data = new Date();
  data.setMonth(data.getMonth() + meses);
  return data.toISOString();
}

async function liberarVip(usuarioId: string, plano: string) {
  const meses = MESES_POR_PLANO[plano] ?? 1;
  await supabaseAdmin
    .from("usuarios")
    .update({
      plano: "vip",
      plano_expira_em: calcularExpiracao(meses),
    })
    .eq("id", usuarioId);
}

async function bloquearVip(usuarioId: string) {
  await supabaseAdmin
    .from("usuarios")
    .update({ plano: "free", plano_expira_em: null })
    .eq("id", usuarioId);
}

export async function POST(req: NextRequest) {
  try {
    const corpo = await req.json();
    const tipo = corpo.type || corpo.topic;
    const id = corpo.data?.id || corpo.resource;

    if (!tipo || !id) {
      // Mercado Pago às vezes manda pings de teste sem dados — só confirma recebimento
      return NextResponse.json({ ok: true });
    }

    // --- Notificação de assinatura (criação/pausa/cancelamento) ---
    if (tipo === "preapproval" || tipo === "subscription_preapproval") {
      const resp = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });
      const preapproval = await resp.json();

      const [usuarioId, plano] = String(preapproval.external_reference || "").split("|");
      if (!usuarioId || !plano) return NextResponse.json({ ok: true });

      if (preapproval.status === "authorized") {
        await liberarVip(usuarioId, plano);
      } else if (["cancelled", "paused"].includes(preapproval.status)) {
        await bloquearVip(usuarioId);
      }
    }

    // --- Notificação de cada cobrança recorrente (renovação mensal/semestral/anual) ---
    if (tipo === "subscription_authorized_payment" || tipo === "payment") {
      const resp = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });
      const pagamento = await resp.json();

      const [usuarioId, plano] = String(pagamento.external_reference || "").split("|");
      if (!usuarioId || !plano) return NextResponse.json({ ok: true });

      if (pagamento.status === "approved") {
        await liberarVip(usuarioId, plano);
      } else if (["rejected", "cancelled"].includes(pagamento.status)) {
        await bloquearVip(usuarioId);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Erro no webhook:", err.message);
    // Sempre retorna 200 pro Mercado Pago não ficar re-tentando infinito por erro nosso
    return NextResponse.json({ ok: true });
  }
}
