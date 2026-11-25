import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// Valida a assinatura enviada pelo Mercado Pago no header "x-signature".
// Garante que a notificação realmente veio do Mercado Pago e não de terceiros.
function validarAssinatura(req: NextRequest, id: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.log("⚠️ MP_WEBHOOK_SECRET não configurada — pulando validação");
    return true; // evita travar tudo caso a env ainda não tenha sido configurada
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) {
    console.log("⚠️ Headers de assinatura ausentes");
    return false;
  }

  // Formato do header: "ts=1234567890,v1=abcdef..."
  const partes = xSignature.split(",").reduce((acc: Record<string, string>, parte) => {
    const [chave, valor] = parte.split("=");
    if (chave && valor) acc[chave.trim()] = valor.trim();
    return acc;
  }, {});

  const ts = partes["ts"];
  const v1 = partes["v1"];
  if (!ts || !v1) {
    console.log("⚠️ Formato inválido em x-signature");
    return false;
  }

  // Manifest conforme documentação oficial do Mercado Pago
  const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`;
  const hashCalculado = createHmac("sha256", secret).update(manifest).digest("hex");

  const valido = hashCalculado === v1;
  if (!valido) {
    console.log("🚫 Assinatura inválida — manifest:", manifest);
  }
  return valido;
}

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

    // LOG DE DEBUG — ver no painel da Vercel (Deployments > Functions > Logs)
    console.log("🔔 Webhook recebido:", JSON.stringify(corpo));
    console.log("👉 tipo:", tipo, "| id:", id);

    if (!tipo || !id) {
      console.log("⚠️ Notificação sem tipo/id — ignorada");
      // Mercado Pago às vezes manda pings de teste sem dados — só confirma recebimento
      return NextResponse.json({ ok: true });
    }

    // --- Notificação de assinatura (criação/pausa/cancelamento) ---
    if (tipo === "preapproval" || tipo === "subscription_preapproval") {
      const resp = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });
      const preapproval = await resp.json();
      console.log("📄 preapproval:", JSON.stringify(preapproval));

      const [usuarioId, plano] = String(preapproval.external_reference || "").split("|");
      console.log("👤 usuarioId:", usuarioId, "| plano:", plano, "| status:", preapproval.status);

      if (!usuarioId || !plano) {
        console.log("⚠️ external_reference vazio ou mal formatado — ignorado");
        return NextResponse.json({ ok: true });
      }

      if (preapproval.status === "authorized") {
        console.log("✅ Liberando VIP para", usuarioId);
        await liberarVip(usuarioId, plano);
      } else if (["cancelled", "paused"].includes(preapproval.status)) {
        console.log("🚫 Bloqueando VIP para", usuarioId);
        await bloquearVip(usuarioId);
      }
    }

    // --- Notificação de cada cobrança recorrente (renovação mensal/semestral/anual) ---
    if (tipo === "subscription_authorized_payment" || tipo === "payment") {
      const resp = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
      });
      const pagamento = await resp.json();
      console.log("💳 pagamento:", JSON.stringify(pagamento));

      const [usuarioId, plano] = String(pagamento.external_reference || "").split("|");
      console.log("👤 usuarioId:", usuarioId, "| plano:", plano, "| status:", pagamento.status);

      if (!usuarioId || !plano) {
        console.log("⚠️ external_reference vazio ou mal formatado — ignorado");
        return NextResponse.json({ ok: true });
      }

      if (pagamento.status === "approved") {
        console.log("✅ Liberando VIP para", usuarioId);
        await liberarVip(usuarioId, plano);
      } else if (["rejected", "cancelled"].includes(pagamento.status)) {
        console.log("🚫 Bloqueando VIP para", usuarioId);
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
