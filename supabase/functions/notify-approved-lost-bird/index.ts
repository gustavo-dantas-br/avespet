import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

// Envia somente a confirmação transacional da aprovação de uma ave perdida.
// Nenhum envio de marketing, anúncio pago ou e-mail arbitrário é permitido.
const site = "https://www.avespet.com.br";
const inbox = "suporte@avespet.com.br";
const idRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const emailRe = /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/;
function allowed(origin: string | null) {
  if (!origin) return true;
  if (origin === "https://avespet.com.br" || origin === "https://www.avespet.com.br") return true;
  try {
    const url = new URL(origin);
    return url.protocol === "https:" &&
      url.hostname.startsWith("avespet-") && url.hostname.endsWith("-gustavo-dantas.vercel.app");
  } catch { return false; }
}
function headers(origin: string | null) {
  const h: Record<string,string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
    "Vary": "Origin",
  };
  if (origin && allowed(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}
function answer(data: unknown, code: number, origin: string | null) {
  return new Response(JSON.stringify(data), { status: code, headers: headers(origin) });
}
function plain(value: unknown, limit: number) {
  return typeof value === "string" ? value.trim().slice(0, limit) : "";
}
function escape(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function pickEmail(data: Record<string, unknown>) {
  for (const name of ["contatoEmail", "email", "emailContato", "contato_email", "emailResponsavel"]) {
    const candidate = plain(data[name], 260).toLowerCase();
    if (candidate && candidate.length <= 254 && emailRe.test(candidate)) return candidate;
  }
  return "";
}
async function senderRecipient(ad: any, admin: any) {
  const data: Record<string,unknown> = ad.data && typeof ad.data === "object" ? ad.data : {};
  const explicit = pickEmail(data);
  if (explicit) return explicit;
  if (ad.user_id && idRe.test(String(ad.user_id))) {
    const { data: lookup, error } = await admin.auth.admin.getUserById(ad.user_id);
    if (!error && lookup?.user?.email_confirmed_at) {
      const email = plain(lookup.user.email, 260).toLowerCase();
      if (email.length <= 254 && emailRe.test(email)) return email;
    }
  }
  return "";
}
function compose(ad: any, packages: any[] = []) {
  const data: Record<string, unknown> = ad.data && typeof ad.data === "object" ? ad.data : {};
  const owner = plain(data.contatoNome, 90) || "Olá";
  const bird = plain(data.nomeAve, 90) || plain(data.especie, 90) || "sua ave";
  const greeting = owner === "Olá" ? "Olá!" : "Olá, " + owner + "!";
  const url = site + "/aves-perdidas";
  const campaignUrl = site + "/campanha-ave-perdida?anuncio=" + encodeURIComponent(String(ad.id));
  const packageLines = packages.map((p) => "- " + plain(p.name,80) + ": R$ " + (Number(p.price_cents)/100).toFixed(2).replace(".",",") + " | " + plain(p.reach_label,100) + " | " + Number(p.duration_days) + " dias").join("\n");
  const offerText = packages.length ? [
    "",
    "Se desejar ampliar a divulgação, o Avespet oferece opções pagas e totalmente opcionais:",
    packageLines,
    "",
    "A contratação começa por uma solicitação de orçamento. Nossa equipe confirma os detalhes antes de qualquer cobrança ou início da campanha.",
    "A divulgação pode ampliar o alcance regional, mas não garante que a ave será localizada.",
    "Conheça as opções: " + campaignUrl,
  ].join("\n") : "";
  const packageHtml = packages.map((p) => '<li style="margin:8px 0"><strong>' + escape(plain(p.name,80)) + '</strong> — ' + escape(new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(p.price_cents)/100)) + '<br><span style="color:#5b6b60">' + escape(plain(p.reach_label,100)) + ' · ' + Number(p.duration_days) + ' dias</span></li>').join("");
  const offerHtml = packages.length ? '<div style="margin-top:22px;padding:18px;border-radius:12px;background:#f0f7f1"><h3 style="margin-top:0;color:#225b3b">Quer ampliar a divulgação?</h3><p>Se desejar, conheça as opções pagas e opcionais de divulgação:</p><ul>' + packageHtml + '</ul><p style="font-size:13px;color:#526357">A contratação começa por uma solicitação de orçamento. Nossa equipe confirma os detalhes antes de qualquer cobrança ou início da campanha. A divulgação pode ampliar o alcance regional, mas não garante que a ave será localizada.</p><p><a href="' + campaignUrl + '" style="display:inline-block;background:#247346;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Conhecer opções de divulgação</a></p></div>' : "";
  const text = [
    greeting,
    "",
    "Sabemos que o desaparecimento de uma ave é angustiante. A equipe Avespet se solidariza com você e torce para que ela seja encontrada em segurança.",
    "",
    "Seu anúncio referente a " + bird + " foi aprovado e está publicado gratuitamente no Avespet.",
    "",
    "Orientações que podem ajudar:",
    "- Confira as fotos, a descrição, a região e a data do desaparecimento.",
    "- Compartilhe a busca com vizinhos, clínicas veterinárias e grupos do bairro.",
    "- Se alguém disser que encontrou sua ave, verifique as informações e tenha cuidado com pedidos de dinheiro.",
    "",
    "Veja os anúncios de aves perdidas: " + url,
    "",
    "O anúncio gratuito não exige a contratação de nenhum serviço.",
    "Caso sua ave seja encontrada, informe ao Avespet para atualizarmos a publicação.",
    offerText,
    "",
    "Estamos torcendo por boas notícias!",
    "",
    "Equipe Avespet | Suporte",
    inbox,
    site,
    "Instagram @avespet.oficial",
  ].join("\n");
  const html = '<!doctype html><html lang="pt-BR"><body style="margin:0;padding:24px;background:#f5f8f4;color:#23342c;font-family:Arial,sans-serif">' +
    '<div style="max-width:600px;margin:auto;background:#fff;padding:28px;border-radius:16px;border:1px solid #e3eae4">' +
    '<p style="margin:0 0 20px;font-size:21px;font-weight:bold;color:#26764b">Avespet</p>' +
    '<p>' + escape(greeting) + '</p>' +
    '<p>Sabemos que o desaparecimento de uma ave é angustiante. A equipe Avespet se solidariza com você e torce para que ela seja encontrada em segurança.</p>' +
    '<p>Seu anúncio referente a <strong>' + escape(bird) + '</strong> foi <strong>aprovado</strong> e está publicado gratuitamente no Avespet.</p>' +
    '<p><strong>Orientações que podem ajudar:</strong></p>' +
    '<ul><li>Confira as fotos, a descrição, a região e a data do desaparecimento.</li>' +
    '<li>Compartilhe a busca com vizinhos, clínicas veterinárias e grupos do bairro.</li>' +
    '<li>Se alguém disser que encontrou sua ave, verifique as informações e tenha cuidado com pedidos de dinheiro.</li></ul>' +
    '<p><a href="' + url + '" style="display:inline-block;background:#247346;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Ver aves perdidas no Avespet</a></p>' +
    '<p style="font-size:13px;color:#5b6b60">O anúncio gratuito não exige a contratação de nenhum serviço. Caso sua ave seja encontrada, avise o Avespet para atualizarmos a publicação.</p>' +
    offerHtml +
    '<p>Estamos torcendo por boas notícias!</p>' +
    '<p style="border-top:1px solid #e4eee6;padding-top:16px;font-size:13px">Atenciosamente,<br><strong>Avespet | Suporte</strong><br>' +
    '<a href="mailto:' + inbox + '">' + inbox + '</a><br><a href="' + site + '">www.avespet.com.br</a><br>' +
    '<a href="https://www.instagram.com/avespet.oficial/">Instagram @avespet.oficial</a></p></div></body></html>';
  return { text, html };
}
Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  if (!allowed(origin)) return answer({ error: "Origem não autorizada." }, 403, origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(origin) });
  if (req.method !== "POST") return answer({ error: "Método não permitido." }, 405, origin);

  const authorization = req.headers.get("authorization") || "";
  if (!authorization.startsWith("Bearer ")) return answer({ error: "Sessão não autorizada." }, 401, origin);
  const token = authorization.slice(7).trim();
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) return answer({ error: "Configuração incompleta." }, 503, origin);
  const authClient = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: identity, error: identityError } = await authClient.auth.getUser(token);
  if (identityError || !identity.user) return answer({ error: "Sessão inválida." }, 401, origin);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const [legacy, master] = await Promise.all([
    admin.from("admins").select("user_id").eq("user_id", identity.user.id).maybeSingle(),
    admin.from("master_admins").select("user_id").eq("user_id", identity.user.id).maybeSingle(),
  ]);
  if (legacy.error || master.error) return answer({ error: "Não foi possível validar a permissão." }, 503, origin);
  if (!legacy.data && !master.data) return answer({ error: "Ação restrita à moderação." }, 403, origin);

  let payload: Record<string,unknown>;
  try { payload = await req.json(); } catch { return answer({ error: "Dados inválidos." }, 400, origin); }
  const id = plain(payload.anuncio_id, 50);
  if (!idRe.test(id)) return answer({ error: "Anúncio inválido." }, 400, origin);
  const { data: current, error: readError } = await admin.from("anuncios_aves_perdidas")
    .select("id,status,user_id,data").eq("id", id).maybeSingle();
  if (readError) return answer({ error: "Falha ao consultar o anúncio." }, 503, origin);
  if (!current) return answer({ error: "Anúncio não encontrado." }, 404, origin);
  // Não gera e-mail retroativo: disparo somente na transição efetiva para aprovado.
  if (current.status === "aprovado") {
    return answer({ success: true, approved: true, email_status: "already_approved" }, 200, origin);
  }
  const { data: approved, error: updateError } = await admin.from("anuncios_aves_perdidas")
    .update({ status: "aprovado" }).eq("id", id).eq("status", current.status)
    .select("id,status,user_id,data").maybeSingle();
  if (updateError) return answer({ error: "Falha ao aprovar o anúncio." }, 503, origin);
  if (!approved) return answer({ error: "Anúncio alterado por outro moderador. Atualize a lista." }, 409, origin);

  const recipient = await senderRecipient(approved, admin);
  if (!recipient) {
    return answer({ success: true, approved: true, email_status: "no_email" }, 200, origin);
  }
  // Chave única persistente. Também protege reaprovações dias depois da janela de 24 h do Resend.
  const { error: claimError } = await admin.from("aves_perdidas_emails_aprovacao")
    .insert({ anuncio_id: id, status: "processing" });
  if (claimError) {
    if (claimError.code === "23505") {
      return answer({ success: true, approved: true, email_status: "already_processed" }, 200, origin);
    }
    console.error("Aprovação salva; não foi possível registrar e-mail", claimError.code);
    return answer({ success: true, approved: true, email_status: "error_registering" }, 200, origin);
  }

  const resendKey = Deno.env.get("RESEND_API_KEY");
  if (!resendKey) {
    await admin.from("aves_perdidas_emails_aprovacao")
      .update({ status: "failed", failure_reason: "missing_resend_key" }).eq("anuncio_id", id);
    return answer({ success: true, approved: true, email_status: "email_not_configured" }, 200, origin);
  }
  const { data: packages, error: packagesError } = await admin.from("campaign_packages")
    .select("code,name,description,reach_label,duration_days,price_cents,sort_order")
    .eq("is_published", true).order("sort_order", { ascending: true });
  if (packagesError) {
    console.error("Catálogo de campanhas indisponível; mantendo e-mail transacional sem oferta.");
  }
  const signed = compose(approved, packagesError ? [] : (packages || []));
  let remote: Response;
  try {
    remote = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + resendKey,
        "Content-Type": "application/json",
        "Idempotency-Key": "avespet-lost-bird-approved-" + id,
      },
      body: JSON.stringify({
        from: "Avespet Suporte <" + inbox + ">",
        to: [recipient],
        reply_to: inbox,
        subject: "Avespet | Seu anúncio de ave perdida foi publicado",
        text: signed.text,
        html: signed.html,
      }),
    });
  } catch {
    await admin.from("aves_perdidas_emails_aprovacao")
      .update({ status: "uncertain", failure_reason: "network_error" }).eq("anuncio_id", id);
    return answer({ success: true, approved: true, email_status: "delivery_uncertain" }, 200, origin);
  }
  if (!remote.ok) {
    // Respostas 5xx podem ocorrer depois de o provedor aceitar o envio.
    // Mantemos o estado incerto para evitar reenvio automático e duplicidade.
    const failureStatus = remote.status >= 500 ? "uncertain" : "failed";
    await admin.from("aves_perdidas_emails_aprovacao")
      .update({ status: failureStatus, failure_reason: "provider_" + remote.status }).eq("anuncio_id", id);
    return answer({
      success: true, approved: true,
      email_status: failureStatus === "uncertain" ? "delivery_uncertain" : "provider_rejected",
    }, 200, origin);
  }
  const provider = await remote.json().catch(() => ({}));
  await admin.from("aves_perdidas_emails_aprovacao").update({
    status: "sent", provider_id: plain(provider?.id, 100) || null,
    sent_at: new Date().toISOString(), failure_reason: null,
  }).eq("anuncio_id", id);
  return answer({ success: true, approved: true, email_status: "sent" }, 200, origin);
});
