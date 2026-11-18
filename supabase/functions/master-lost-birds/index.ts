import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const origins = new Set(["https://avespet.com.br", "https://www.avespet.com.br"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const states = new Set(["pendente", "aprovado", "rejeitado", "encerrado", "reencontrado"]);
function allowed(origin: string | null) {
  if (!origin || origins.has(origin)) return true;
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:" && parsed.hostname.startsWith("avespet-") &&
      parsed.hostname.endsWith("-gustavo-dantas.vercel.app");
  } catch { return false; }
}
function headers(origin: string | null) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    ...(origin && allowed(origin) ? { "Access-Control-Allow-Origin": origin } : {}),
  };
}
function reply(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: headers(origin) });
}
const take = (v: unknown, max: number) => typeof v === "string" ? v.trim().slice(0, max) : "";

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (!allowed(origin)) return reply({ error: "Origem não autorizada." }, 403, origin);
  if (req.method === "OPTIONS") return new Response("ok", { headers: headers(origin) });
  if (req.method !== "POST") return reply({ error: "Método não permitido." }, 405, origin);
  const bearer = req.headers.get("authorization") || "";
  if (!bearer.startsWith("Bearer ")) return reply({ error: "Acesso não autorizado." }, 401, origin);
  const token = bearer.slice(7).trim();
  const base = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !anonKey || !serviceKey) return reply({ error: "Configuração indisponível." }, 503, origin);

  const client = createClient(base, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: identity, error: authError } = await client.auth.getUser(token);
  if (authError || !identity.user) return reply({ error: "Sessão expirada." }, 401, origin);
  const admin = createClient(base, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: master, error: masterError } = await admin.from("master_admins")
    .select("user_id").eq("user_id", identity.user.id).maybeSingle();
  if (masterError) return reply({ error: "Falha ao verificar a permissão Master." }, 503, origin);
  if (!master) return reply({ error: "Área exclusiva do Master." }, 403, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply({ error: "Dados inválidos." }, 400, origin); }
  const action = take(body.action, 30);

  if (action === "list") {
    const status = take(body.status, 20) || "pendente";
    if (status !== "todos" && !states.has(status)) return reply({ error: "Filtro inválido." }, 400, origin);
    const page = Math.max(1, Math.min(200, Math.floor(Number(body.page) || 1)));
    const pageSize = 15;
    let query = admin.from("anuncios_aves_perdidas")
      .select("id,user_id,status,created_at,data", { count: "exact" })
      .order("created_at", { ascending: false });
    if (status !== "todos") query = query.eq("status", status);
    const { data: ads, count, error: adsError } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    if (adsError) {
      console.error("master-lost-birds list", adsError.code);
      return reply({ error: "Não foi possível listar as ocorrências." }, 503, origin);
    }
    const ids = (ads || []).map((ad) => ad.id);
    const records = new Map<string, Record<string, unknown>>();
    if (ids.length) {
      const { data: emails, error: logError } = await admin.from("aves_perdidas_emails_aprovacao")
        .select("anuncio_id,status,sent_at,failure_reason").in("anuncio_id", ids);
      if (logError) {
        console.error("master-lost-birds emails", logError.code);
        return reply({ error: "Não foi possível verificar os registros de comunicação." }, 503, origin);
      }
      for (const item of emails || []) records.set(item.anuncio_id, item);
    }
    const items = (ads || []).map((ad) => {
      const data = ad.data && typeof ad.data === "object" ? ad.data : {};
      const email = records.get(ad.id);
      return {
        id: ad.id,
        status: ad.status,
        created_at: ad.created_at,
        has_owner: Boolean(ad.user_id),
        data: {
          nomeAve: take(data.nomeAve, 100),
          especie: take(data.especie, 100),
          cor: take(data.cor, 100),
          bairro: take(data.bairro, 100),
          cidade: take(data.cidade, 100),
          uf: take(data.uf, 2),
          dataPerda: take(data.dataPerda, 20),
          foto: take(data.foto, 1500),
          contatoNome: take(data.contatoNome, 100),
          whatsapp: take(data.whatsapp, 30),
          descricao: take(data.descricao, 500),
        },
        email_status: email?.status || null,
        email_reason: email?.failure_reason || null,
        email_sent_at: email?.sent_at || null,
      };
    });
    return reply({ items, page, total: count || 0, totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)) }, 200, origin);
  }

  if (action === "contact") {
    const id = take(body.anuncio_id, 45);
    if (!uuid.test(id)) return reply({ error: "Anúncio inválido." }, 400, origin);
    const { data: ad, error: adError } = await admin.from("anuncios_aves_perdidas")
      .select("id,user_id,status").eq("id", id).maybeSingle();
    if (adError) return reply({ error: "Não foi possível consultar a ocorrência." }, 503, origin);
    if (!ad) return reply({ error: "Anúncio não encontrado." }, 404, origin);
    if (!ad.user_id) return reply({ error: "Anúncio sem conta responsável. Entre em contato pelo WhatsApp registrado." }, 409, origin);
    const { data: account, error: accountError } = await admin.auth.admin.getUserById(ad.user_id);
    if (accountError || !account?.user?.email_confirmed_at || !account.user.email) {
      return reply({ error: "O responsável ainda não possui e-mail confirmado. Use o WhatsApp ou solicite a confirmação da conta." }, 409, origin);
    }
    const { error: auditError } = await admin.from("master_audit_log").insert({
      actor_user_id: identity.user.id, action: "master_lost_bird_contact_prepared",
      resource_type: "lost_bird_ad", resource_id: id,
      metadata: { channel: "email", status: ad.status },
    });
    if (auditError) return reply({ error: "Não foi possível registrar a preparação do contato." }, 503, origin);
    return reply({ success: true, source_id: id, to: account.user.email }, 200, origin);
  }

  if (action === "moderate") {
    const id = take(body.anuncio_id, 45);
    const target = take(body.status, 20);
    const reason = take(body.reason, 500);
    if (!uuid.test(id)) return reply({ error: "Anúncio inválido." }, 400, origin);
    // A aprovação utiliza exclusivamente notify-approved-lost-bird, que controla o e-mail.
    if (!["pendente", "rejeitado", "encerrado"].includes(target)) {
      return reply({ error: "A aprovação deve ser feita pela função segura de notificação." }, 400, origin);
    }
    if (target === "rejeitado" && reason.length < 5) {
      return reply({ error: "Descreva o motivo da rejeição." }, 400, origin);
    }
    const { data: current, error: currentError } = await admin.from("anuncios_aves_perdidas")
      .select("id,status").eq("id", id).maybeSingle();
    if (currentError) return reply({ error: "Não foi possível consultar o anúncio." }, 503, origin);
    if (!current) return reply({ error: "Anúncio não localizado." }, 404, origin);
    if (current.status === "reencontrado") return reply({ error: "Reencontro confirmado pelo tutor. Não é possível reabrir a busca pela moderação comum." }, 409, origin);
    if (current.status === target) return reply({ error: "O anúncio já está nesse status." }, 409, origin);
    if (target === "pendente" && current.status === "pendente") return reply({ error: "Já está em análise." }, 409, origin);

    // Auditoria da intenção antes de aplicar a alteração administrativa.
    const { error: auditError } = await admin.from("master_audit_log").insert({
      actor_user_id: identity.user.id,
      action: "master_lost_bird_moderation_requested",
      resource_type: "lost_bird_ad",
      resource_id: id,
      metadata: { previous_status: current.status, new_status: target, reason },
    });
    if (auditError) {
      console.error("master-lost-birds audit", auditError.code);
      return reply({ error: "Não foi possível registrar auditoria. Nada foi alterado." }, 503, origin);
    }
    const { data: result, error: updateError } = await admin.from("anuncios_aves_perdidas")
      .update({ status: target }).eq("id", id).eq("status", current.status)
      .select("id,status").maybeSingle();
    if (updateError) return reply({ error: "Não foi possível alterar o status." }, 503, origin);
    if (!result) return reply({ error: "O anúncio foi alterado por outra pessoa. Atualize a lista." }, 409, origin);
    return reply({ success: true, id, status: result.status }, 200, origin);
  }
  return reply({ error: "Operação inválida." }, 400, origin);
});