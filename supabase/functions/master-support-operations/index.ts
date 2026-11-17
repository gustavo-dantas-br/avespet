import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const origins = new Set(["https://avespet.com.br", "https://www.avespet.com.br"]);
const validId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const sources = {
  achado: { table: "achados_anilha", date: "criado_em" },
  perdida: { table: "anuncios_aves_perdidas", date: "created_at" },
  campanha: { table: "solicitacoes_campanhas_aves", date: "created_at" },
} as const;
type Source = keyof typeof sources;
const validStates = new Set(["novo", "em_andamento", "aguardando", "concluido"]);
const validPriorities = new Set(["normal", "alta", "urgente"]);
const validAssignment = new Set(["keep", "self", "none"]);
function permitted(origin: string | null): boolean {
  if (!origin || origins.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host.startsWith("avespet-") && host.endsWith("-gustavo-dantas.vercel.app");
  } catch { return false; }
}
function reply(body: unknown, status: number, origin: string | null) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && permitted(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}
const safeText = (value: unknown, size: number) => String(value ?? "").trim().slice(0, size);
const missingLostFields = (data: Record<string, unknown>) => ([
  ["foto", "foto da ave"],
  ["bairro", "bairro ou região do desaparecimento"],
  ["cor", "cor da ave"],
  ["caracteristicas", "características de identificação (marcas, sons ou comportamento)"],
] as const).filter(([key]) => !safeText(data[key], 100)).map(([key, label]) => ({ key, label }));
const defaultState = (source: Source, original: string) => {
  if (["resolvido", "encerrado", "concluido", "finalizada"].includes(original)) return "concluido";
  if (source === "achado" && original === "contatado") return "em_andamento";
  if (source === "perdida" && original === "aprovado") return "em_andamento";
  return "novo";
};

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (!permitted(origin)) return reply({ error: "Origin not allowed" }, 403, null);
  if (req.method === "OPTIONS") return new Response("ok", { headers: {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
    ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
  } });
  if (req.method !== "POST") return reply({ error: "Method not allowed" }, 405, origin);

  const authorization = req.headers.get("Authorization") || "";
  const token = authorization.replace(/^Bearer\s+/i, "");
  if (!token || token === authorization) return reply({ error: "Unauthorized" }, 401, origin);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !secret) return reply({ error: "Server configuration error" }, 503, origin);

  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: identity, error: identityError } = await auth.auth.getUser(token);
  if (identityError || !identity.user) return reply({ error: "Unauthorized" }, 401, origin);
  const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: master, error: masterError } = await admin.from("master_admins")
    .select("user_id").eq("user_id", identity.user.id).maybeSingle();
  if (masterError) return reply({ error: "Could not validate Master access" }, 503, origin);
  if (!master) return reply({ error: "Forbidden" }, 403, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return reply({ error: "Invalid request" }, 400, origin); }
  const action = safeText(body.action, 20);

  if (action === "prepare-email") {
    const id = safeText(body.source_id, 40);
    if (!validId.test(id)) return reply({ error: "Anúncio inválido." }, 400, origin);
    const { data: ad, error: adError } = await admin.from("anuncios_aves_perdidas")
      .select("id,user_id,status,data").eq("id", id).maybeSingle();
    if (adError) return reply({ error: "Não foi possível consultar o anúncio." }, 503, origin);
    if (!ad) return reply({ error: "Anúncio não encontrado." }, 404, origin);
    if (ad.status === "encerrado") return reply({ error: "Esta busca está encerrada." }, 409, origin);
    const details: Record<string, unknown> = ad.data || {};
    const missing = missingLostFields(details);
    if (!missing.length) return reply({ error: "Este anúncio já contém as informações principais." }, 409, origin);
    if (!ad.user_id) {
      return reply({ error: "O anúncio não tem conta associada. Faça o acompanhamento manual com o tutor." }, 409, origin);
    }
    const { data: owner, error: ownerError } = await admin.auth.admin.getUserById(ad.user_id);
    if (ownerError) return reply({ error: "Não foi possível validar o e-mail do tutor." }, 503, origin);
    const email = owner?.user?.email?.trim().toLowerCase() || "";
    if (!owner?.user?.email_confirmed_at || !/^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(email)) {
      return reply({ error: "A conta do tutor não possui um e-mail confirmado para atendimento." }, 409, origin);
    }
    const ave = safeText(details.nomeAve || details.especie || "sua ave", 60).replace(/[\r\n]/g, " ");
    const nome = safeText(details.contatoNome, 70).replace(/[\r\n]/g, " ");
    const greeting = nome ? "Olá, " + nome + "!" : "Olá!";
    const fields = missing.map(({ label }) => "- " + label).join("\n");
    const subject = "Avespet | Complete as informações da ave " + ave;
    const text = [
      greeting,
      "",
      "Estamos acompanhando o anúncio de " + ave + " no Avespet e percebemos que algumas informações podem ajudar na identificação e na busca:",
      "",
      fields,
      "",
      "Você pode complementar esses dados diretamente no seu anúncio. Entre na sua conta em https://www.avespet.com.br/, abra a opção Ave perdida no painel, localize o anúncio em Meus anúncios de aves perdidas e clique em Editar anúncio.",
      "",
      "Não é necessário responder com fotos por e-mail: envie a foto no próprio anúncio. Após salvar, a atualização será analisada pela equipe Avespet antes de voltar à página pública.",
      "",
      "Se possuir anilha, informe a numeração no campo reservado do formulário, nunca na descrição pública.",
      "",
      "Atenciosamente,",
      "Equipe de Suporte Avespet",
    ].join("\n");
    // A operação registra apenas a preparação. O envio depende de confirmação no Master.
    const { error: auditError } = await admin.from("master_audit_log").insert({
      actor_user_id: identity.user.id, action: "master_support_email_draft_prepared",
      resource_type: "support_case", resource_id: id,
      metadata: { source: "perdida", missing: missing.map(({ key }) => key) },
    });
    if (auditError) return reply({ error: "Não foi possível registrar a preparação no histórico do Master." }, 503, origin);
    return reply({ success: true, draft: { box: "suporte", to: email, subject, text, source_id: id } }, 200, origin);
  }

  if (action === "timeline") {
    const source = safeText(body.source, 20);
    const id = safeText(body.source_id, 40);
    if (source !== "perdida" || !validId.test(id)) return reply({ error: "Caso inválido." }, 400, origin);
    const { data: ad, error: adError } = await admin.from("anuncios_aves_perdidas")
      .select("id,created_at,status").eq("id",id).maybeSingle();
    if (adError) return reply({ error: "Falha ao consultar o anúncio." }, 503, origin);
    if (!ad) return reply({ error: "Anúncio não encontrado." }, 404, origin);
    const [eventsResult,auditResult] = await Promise.all([
      admin.from("master_support_events").select("id,event_type,summary,created_at,details")
        .eq("source","perdida").eq("source_id",id).order("created_at",{ascending:false}).limit(100),
      admin.from("master_audit_log").select("id,action,created_at")
        .eq("resource_type","support_case").eq("resource_id",id)
        .eq("action","master_support_email_draft_prepared")
        .order("created_at",{ascending:false}).limit(50),
    ]);
    if (eventsResult.error || auditResult.error) return reply({ error: "Histórico indisponível." }, 503, origin);
    const entries = [
      { id: "created-" + ad.id, type:"created", summary:"Anúncio cadastrado", createdAt:ad.created_at },
      ...(eventsResult.data || []).map((event) => ({
        id:"event-"+event.id, type:event.event_type, summary:event.summary, createdAt:event.created_at,
      })),
      ...(auditResult.data || []).map((event) => ({
        id:"legacy-"+event.id, type:"draft_prepared", summary:"Solicitação de dados preparada para revisão",createdAt:event.created_at,
      })),
    ].sort((a,b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || "")).slice(0,100);
    return reply({ success:true, entries, truncated:(eventsResult.data || []).length===100 },200,origin);
  }

  if (action === "save") {
    const source = safeText(body.source, 20) as Source;
    const id = safeText(body.source_id, 40);
    const status = safeText(body.status, 20);
    const priority = safeText(body.priority, 20);
    const assignment = safeText(body.assignment, 15) || "keep";
    const note = safeText(body.note, 2001);
    if (!(source in sources) || !validId.test(id)) return reply({ error: "Caso inválido" }, 400, origin);
    if (!validStates.has(status) || !validPriorities.has(priority) || !validAssignment.has(assignment) || note.length > 2000) {
      return reply({ error: "Status, prioridade ou anotação inválidos" }, 400, origin);
    }
    const { data: existingSource, error: sourceError } = await admin
      .from(sources[source].table).select("id").eq("id", id).maybeSingle();
    if (sourceError) return reply({ error: "Could not validate source case" }, 503, origin);
    if (!existingSource) return reply({ error: "Caso de origem não encontrado" }, 404, origin);

    const { data: current, error: currentError } = await admin.from("master_support_cases")
      .select("id,assigned_to").eq("source", source).eq("source_id", id).maybeSingle();
    if (currentError) return reply({ error: "Could not load current support status" }, 503, origin);
    const assignedTo = assignment === "self" ? identity.user.id
      : assignment === "none" ? null : (current?.assigned_to || null);

    const { error: beforeAudit } = await admin.from("master_audit_log").insert({
      actor_user_id: identity.user.id, action: "master_support_update_requested",
      resource_type: "support_case", resource_id: id,
      metadata: { source, status, priority, assignment },
    });
    if (beforeAudit) return reply({ error: "Could not record administrative audit" }, 503, origin);

    const { data: saved, error: saveError } = await admin.from("master_support_cases")
      .upsert({
        source, source_id: id, status, priority,
        assigned_to: assignedTo, internal_note: note,
        updated_by: identity.user.id, updated_at: new Date().toISOString(),
      }, { onConflict: "source,source_id" })
      .select("id,source,source_id,status,priority,assigned_to,internal_note,updated_at").single();
    if (saveError || !saved) {
      console.error("Master support save failed", saveError?.message);
      return reply({ error: "Não foi possível salvar o acompanhamento" }, 503, origin);
    }

    const { error: historyError } = source === "perdida" ? await admin.from("master_support_events").insert({
      source, source_id:id, event_type:"support_updated", summary:"Acompanhamento interno atualizado",
      actor_user_id:identity.user.id, details:{ status, priority },
    }) : { error:null };
    if (historyError) console.error("Could not append support event");
    const { error: afterAudit } = await admin.from("master_audit_log").insert({
      actor_user_id: identity.user.id, action: "master_support_case_updated",
      resource_type: "support_case", resource_id: id,
      metadata: { source, status, priority, assigned_to_self: assignedTo === identity.user.id },
    });
    if (afterAudit) return reply({ error: "Atualizado, mas a confirmação da auditoria falhou" }, 503, origin);

    return reply({ success: true, tracking: {
      status: saved.status, priority: saved.priority, note: saved.internal_note,
      assignedToMe: saved.assigned_to === identity.user.id,
      assigneeLabel: saved.assigned_to
        ? (saved.assigned_to === identity.user.id ? "Você" : "Outro Master") : "Sem responsável",
      updatedAt: saved.updated_at,
    } }, 200, origin);
  }

  if (action !== "list") return reply({ error: "Ação inválida" }, 400, origin);
  const type = safeText(body.type, 20) || "all";
  const state = safeText(body.state, 20) || "all";
  const search = safeText(body.search, 80).toLocaleLowerCase("pt-BR");
  const n = Number(body.page);
  const page = Number.isSafeInteger(n) ? Math.min(50, Math.max(1, n)) : 1;
  const size = 20;
  if (!(type === "all" || type in sources) || !(state === "all" || validStates.has(state))) {
    return reply({ error: "Filtro inválido" }, 400, origin);
  }

  const fetches: Source[] = type === "all" ? ["achado", "perdida", "campanha"] : [type as Source];
  const batches = await Promise.all(fetches.map(async (source) => {
    let query;
    if (source === "achado") query = admin.from("achados_anilha")
      .select("id,anilha_buscada,nome_encontrador,telefone_encontrador,mensagem,ave_nome,status,criado_em")
      .order("criado_em", { ascending: false, nullsFirst: false });
    else if (source === "perdida") query = admin.from("anuncios_aves_perdidas")
      .select("id,user_id,data,status,created_at").order("created_at", { ascending: false });
    else query = admin.from("solicitacoes_campanhas_aves")
      .select("id,nome_contato,whatsapp,email,cidade,uf,descricao_ave,pacote,status,created_at")
      .order("created_at", { ascending: false });
    const { data, error } = await query.limit(251);
    return { source, data, error };
  }));
  if (batches.some((batch) => batch.error)) {
    for (const batch of batches) if (batch.error) console.error("Master support source failed", batch.source, batch.error.message);
    return reply({ error: "Não foi possível carregar a fila operacional" }, 503, origin);
  }
  const partial = batches.some((batch) => (batch.data || []).length > 250);

  const items = batches.flatMap(({ source, data }) => (data || []).slice(0, 250).map((r) => {
    const d = source === "perdida" ? (r.data || {}) : {};
    const title = source === "achado" ? "Ave encontrada: " + safeText(r.ave_nome || r.anilha_buscada || "Sem identificação", 70)
      : source === "perdida" ? "Ave perdida: " + safeText(d.nomeAve || d.especie || "Sem identificação", 70)
      : "Campanha: " + safeText(r.pacote || "Divulgação", 70);
    const contactName = source === "achado" ? safeText(r.nome_encontrador, 100)
      : source === "perdida" ? safeText(d.contatoNome, 100) : safeText(r.nome_contato, 100);
    const contactPhone = source === "achado" ? safeText(r.telefone_encontrador, 30)
      : source === "perdida" ? safeText(d.whatsapp, 30) : safeText(r.whatsapp, 30);
    const originStatus = safeText(r.status, 40);
    return {
      id: r.id, source, title, originStatus,
      ...(source === "perdida" ? {
        missingFields: missingLostFields(d).map(({ label }) => label),
        hasOwner: Boolean(r.user_id),
      } : {}),
      createdAt: source === "achado" ? r.criado_em : r.created_at,
      contactName, contactPhone,
      city: source === "perdida" ? safeText(d.cidade, 80) : source === "campanha" ? safeText(r.cidade, 80) : "",
      ring: source === "achado" ? safeText(r.anilha_buscada, 60) : source === "perdida" ? safeText(d.anilha, 60) : "",
      details: source === "achado" ? safeText(r.mensagem, 400)
        : source === "perdida" ? safeText(d.descricao, 400) : safeText(r.descricao_ave, 400),
      status: defaultState(source, originStatus), priority: "normal",
      note: "", assigneeLabel: "Sem responsável", assignedToMe: false,
    };
  }));
  const ids = [...new Set(items.map(x => x.id))];
  const tracking = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < ids.length; i += 200) {
    const { data, error } = await admin.from("master_support_cases")
      .select("source,source_id,status,priority,assigned_to,internal_note,updated_at")
      .in("source_id", ids.slice(i, i + 200));
    if (error) {
      console.error("Master support tracking lookup failed", error.message);
      return reply({ error: "Não foi possível carregar o andamento dos casos" }, 503, origin);
    }
    for (const row of data || []) tracking.set(row.source + ":" + row.source_id, row);
  }
  for (const item of items) {
    const current = tracking.get(item.source + ":" + item.id);
    if (current) {
      item.status = String(current.status || "novo");
      item.priority = String(current.priority || "normal");
      item.note = safeText(current.internal_note, 2000);
      item.assignedToMe = current.assigned_to === identity.user.id;
      item.assigneeLabel = current.assigned_to
        ? (item.assignedToMe ? "Você" : "Outro Master") : "Sem responsável";
    }
  }
  const filtered = items.filter(item => {
    if (state !== "all" && item.status !== state) return false;
    if (!search) return true;
    return [item.title, item.contactName, item.contactPhone, item.city, item.ring, item.originStatus]
      .join(" ").toLocaleLowerCase("pt-BR").includes(search);
  }).sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));
  const total = filtered.length;
  const visible = filtered.slice((page - 1) * size, page * size);

  const { error: auditError } = await admin.from("master_audit_log").insert({
    actor_user_id: identity.user.id, action: "master_support_queue_viewed",
    resource_type: "support_case", metadata: { type, state, page, result_count: visible.length },
  });
  if (auditError) return reply({ error: "Could not record administrative access" }, 503, origin);

  return reply({
    success: true, items: visible, total, page, pageSize: size,
    totalPages: Math.max(1, Math.ceil(total / size)), partial,
  }, 200, origin);
});
