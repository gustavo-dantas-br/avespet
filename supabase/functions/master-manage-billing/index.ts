import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://avespet.com.br",
  "https://www.avespet.com.br",
  "https://avespet-git-feature-master-admin-panel-gustavo-dantas.vercel.app",
]);
function allowedOrigin(origin: string | null) {
  if (!origin || allowedOrigins.has(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return host.startsWith("avespet-") && host.endsWith("-gustavo-dantas.vercel.app");
  } catch { return false; }
}
function cors(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
  if (origin && allowedOrigin(origin)) headers["Access-Control-Allow-Origin"] = origin;
  return headers;
}
function response(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const featureKeys = [
  "basic_profile",
  "basic_bird_management",
  "basic_ads",
  "advanced_genetics",
  "reproduction_management",
  "financial_management",
  "campaigns",
  "after_sales",
] as const;

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (!allowedOrigin(origin)) return response({ error: "Origin not allowed" }, 403, null);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405, origin);

  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return response({ error: "Unauthorized" }, 401, origin);
  const url = Deno.env.get("SUPABASE_URL");
  const anon = Deno.env.get("SUPABASE_ANON_KEY");
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anon || !service) return response({ error: "Server configuration error" }, 503, origin);

  const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: authData, error: authError } = await auth.auth.getUser(token);
  if (authError || !authData.user) return response({ error: "Unauthorized" }, 401, origin);
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: master, error: masterError } = await admin
    .from("master_admins").select("user_id").eq("user_id", authData.user.id).maybeSingle();
  if (masterError) return response({ error: "Could not validate administrative access" }, 503, origin);
  if (!master) return response({ error: "Forbidden" }, 403, origin);

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return response({ error: "Invalid request" }, 400, origin); }
  const action = String(body.action || "");

  if (action === "search_creators") {
    const search = String(body.search || "").trim().slice(0, 100).toLocaleLowerCase("pt-BR");
    if (search.length < 2) return response({ success: true, creators: [] }, 200, origin);
    const accounts: any[] = [];
    for (let page = 1; page <= 100; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) {
        console.error("Creator search failed", error.message);
        return response({ error: "Não foi possível pesquisar criadores." }, 503, origin);
      }
      accounts.push(...data.users);
      if (data.users.length < 1000) break;
    }
    const [{ data: masters, error: masterListError }, { data: admins, error: adminListError }] = await Promise.all([
      admin.from("master_admins").select("user_id"),
      admin.from("admins").select("user_id"),
    ]);
    if (masterListError || adminListError) return response({ error: "Não foi possível validar contas administrativas." }, 503, origin);
    const protectedIds = new Set([...(masters || []).map((item) => item.user_id), ...(admins || []).map((item) => item.user_id)]);
    const candidates = accounts.filter((account) => !protectedIds.has(account.id));
    const ids = candidates.map((account) => account.id);
    const profiles = new Map<string, any>();
    for (let start = 0; start < ids.length; start += 500) {
      const { data, error } = await admin.from("perfil_criador").select("user_id,data").in("user_id", ids.slice(start, start + 500));
      if (error) return response({ error: "Não foi possível consultar os perfis dos criadores." }, 503, origin);
      for (const profile of data || []) profiles.set(profile.user_id, profile.data || {});
    }
    const creators = candidates.map((account) => {
      const profile = profiles.get(account.id) || {};
      const name = String(profile.nomeCompleto || [profile.nome, profile.sobrenome].filter(Boolean).join(" ") || account.user_metadata?.name || "Nome não informado");
      const creatorName = String(profile.nomeCriatorio || "");
      return { userId: account.id, name, creatorName, email: account.email || "" };
    }).filter((creator) => [creator.name, creator.creatorName, creator.email].join(" ").toLocaleLowerCase("pt-BR").includes(search))
      .slice(0, 30);
    return response({ success: true, creators }, 200, origin);
  }

  if (action === "list_subscriptions") {
    const { data: subscriptions, error: subscriptionError } = await admin.from("creator_subscriptions")
      .select("id,user_id,plan_id,status,starts_at,ends_at,canceled_at,created_at,updated_at")
      .order("created_at", { ascending: false }).limit(300);
    if (subscriptionError) {
      console.error("Subscription listing failed", subscriptionError.message);
      return response({ error: "Não foi possível carregar assinaturas. Confirme se a migração foi aplicada." }, 503, origin);
    }
    const planIds = [...new Set((subscriptions || []).map((item) => item.plan_id))];
    const userIds = [...new Set((subscriptions || []).map((item) => item.user_id))];
    const [{ data: plans, error: plansError }, { data: accounts, error: accountsError }] = await Promise.all([
      planIds.length ? admin.from("platform_plans").select("id,code,name,price_cents,billing_interval,max_birds").in("id", planIds) : Promise.resolve({ data: [], error: null }),
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    ]);
    if (plansError || accountsError) return response({ error: "Não foi possível carregar os dados relacionados às assinaturas." }, 503, origin);
    const planMap = new Map((plans || []).map((item) => [item.id, item]));
    const accountMap = new Map((accounts?.users || []).map((item) => [item.id, item]));
    const profileMap = new Map<string, any>();
    for (let start = 0; start < userIds.length; start += 500) {
      const { data, error } = await admin.from("perfil_criador").select("user_id,data").in("user_id", userIds.slice(start, start + 500));
      if (error) return response({ error: "Não foi possível carregar os perfis das assinaturas." }, 503, origin);
      for (const item of data || []) profileMap.set(item.user_id, item.data || {});
    }
    const items = (subscriptions || []).map((item) => {
      const account = accountMap.get(item.user_id);
      const profile = profileMap.get(item.user_id) || {};
      return {
        ...item,
        creator_name: String(profile.nomeCompleto || [profile.nome, profile.sobrenome].filter(Boolean).join(" ") || account?.user_metadata?.name || "Nome não informado"),
        creator_name_business: String(profile.nomeCriatorio || ""),
        email: account?.email || "Conta não localizada",
        plan: planMap.get(item.plan_id) || null,
      };
    });
    return response({ success: true, subscriptions: items }, 200, origin);
  }

  if (action === "assign_subscription") {
    const userId = String(body.user_id || "").trim();
    const planId = String(body.plan_id || "").trim();
    const status = String(body.status || "active");
    const startsAt = body.starts_at ? new Date(String(body.starts_at)) : new Date();
    const endsAt = body.ends_at ? new Date(String(body.ends_at)) : null;
    if (!uuid.test(userId) || !uuid.test(planId)) return response({ error: "Selecione um criador e um plano válidos." }, 400, origin);
    if (!["active", "trialing"].includes(status)) return response({ error: "Situação inicial inválida." }, 400, origin);
    if (Number.isNaN(startsAt.getTime()) || (endsAt && Number.isNaN(endsAt.getTime())) || (endsAt && endsAt <= startsAt)) {
      return response({ error: "Confira as datas de início e término da assinatura." }, 400, origin);
    }
    const [{ data: account, error: accountError }, { data: plan, error: planError }] = await Promise.all([
      admin.auth.admin.getUserById(userId),
      admin.from("platform_plans").select("id,code,name,is_active").eq("id", planId).maybeSingle(),
    ]);
    if (accountError || !account?.user) return response({ error: "A conta do criador não foi encontrada." }, 404, origin);
    if (planError || !plan || !plan.is_active) return response({ error: "O plano selecionado não existe ou está inativo." }, 400, origin);
    const { data: current, error: currentError } = await admin.from("creator_subscriptions")
      .select("id").eq("user_id", userId).in("status", ["active", "trialing", "past_due"]);
    if (currentError) return response({ error: "Não foi possível verificar a assinatura atual do criador." }, 503, origin);
    if (current?.length) {
      const { error: closeError } = await admin.from("creator_subscriptions").update({
        status: "canceled", canceled_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).in("id", current.map((item) => item.id));
      if (closeError) return response({ error: "Não foi possível encerrar a assinatura anterior. Nenhuma nova assinatura foi criada." }, 503, origin);
    }
    const { data: inserted, error: insertError } = await admin.from("creator_subscriptions").insert({
      user_id: userId, plan_id: planId, status, starts_at: startsAt.toISOString(), ends_at: endsAt?.toISOString() || null,
    }).select("id").single();
    if (insertError) {
      console.error("Subscription assignment failed", insertError.message);
      return response({ error: "Não foi possível atribuir o plano ao criador." }, 503, origin);
    }
    const { error: auditError } = await admin.from("master_audit_log").insert({
      actor_user_id: authData.user.id, action: "creator_subscription_assigned",
      resource_type: "creator_subscription", resource_id: inserted.id,
      metadata: { creator_user_id: userId, plan_id: planId, plan_code: plan.code, plan_name: plan.name, status },
    });
    if (auditError) {
      console.error("Subscription assignment audit failed", auditError.message);
      return response({ error: "Assinatura criada, mas o registro de auditoria não foi confirmado." }, 503, origin);
    }
    return response({ success: true, subscription_id: inserted.id }, 200, origin);
  }

  if (action === "update_subscription_status") {
    const id = String(body.id || "").trim();
    const status = String(body.status || "");
    if (!uuid.test(id) || !["active", "past_due", "canceled", "expired"].includes(status)) {
      return response({ error: "Dados inválidos para alterar a assinatura." }, 400, origin);
    }
    const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === "canceled") update.canceled_at = new Date().toISOString();
    if (status !== "canceled") update.canceled_at = null;
    const { data: updated, error: updateError } = await admin.from("creator_subscriptions")
      .update(update).eq("id", id).select("id,user_id,plan_id,status").single();
    if (updateError || !updated) {
      console.error("Subscription status update failed", updateError?.message);
      return response({ error: "Não foi possível alterar a situação da assinatura." }, 503, origin);
    }
    const { error: auditError } = await admin.from("master_audit_log").insert({
      actor_user_id: authData.user.id, action: "creator_subscription_status_changed",
      resource_type: "creator_subscription", resource_id: id,
      metadata: { creator_user_id: updated.user_id, plan_id: updated.plan_id, status },
    });
    if (auditError) return response({ error: "Situação alterada, mas a auditoria não foi confirmada." }, 503, origin);
    return response({ success: true, subscription: updated }, 200, origin);
  }

  if (action === "list_plans") {
    const { data, error } = await admin.from("platform_plans")
      .select("id,code,name,description,price_cents,currency,billing_interval,max_birds,features,is_free,is_active,sort_order,created_at,updated_at")
      .order("sort_order", { ascending: true }).order("created_at", { ascending: true });
    if (error) {
      console.error("Plan listing failed", error.message);
      return response({ error: "Não foi possível carregar os planos. Confirme se a migração do módulo foi aplicada ao banco." }, 503, origin);
    }
    return response({ success: true, plans: data || [] }, 200, origin);
  }

  if (action === "save_plan") {
    const id = String(body.id || "").trim();
    if (id && !uuid.test(id)) return response({ error: "Identificador de plano inválido." }, 400, origin);
    const code = String(body.code || "").trim().toLowerCase();
    const name = String(body.name || "").trim().slice(0, 80);
    const description = String(body.description || "").trim().slice(0, 500);
    const priceCents = Number(body.price_cents);
    const interval = String(body.billing_interval || "monthly");
    const maxBirds = body.max_birds === null || body.max_birds === "" ? null : Number(body.max_birds);
    const isFree = body.is_free === true;
    const sortOrder = Number(body.sort_order || 0);
    if (!/^[a-z0-9_-]{2,40}$/.test(code)) return response({ error: "Use um código com 2 a 40 caracteres: letras minúsculas, números, hífen ou sublinhado." }, 400, origin);
    if (!name) return response({ error: "Informe o nome do plano." }, 400, origin);
    if (!Number.isSafeInteger(priceCents) || priceCents < 0) return response({ error: "Informe um preço válido." }, 400, origin);
    if (!["monthly", "yearly", "one_time"].includes(interval)) return response({ error: "Periodicidade inválida." }, 400, origin);
    if (maxBirds !== null && (!Number.isSafeInteger(maxBirds) || maxBirds < 0)) return response({ error: "O limite de aves deve ser zero ou um número inteiro positivo; deixe vazio para ilimitado." }, 400, origin);
    if (!Number.isSafeInteger(sortOrder)) return response({ error: "Ordem de exibição inválida." }, 400, origin);
    if (isFree && priceCents !== 0) return response({ error: "Um plano gratuito precisa ter preço zero." }, 400, origin);
    const incoming = body.features && typeof body.features === "object" && !Array.isArray(body.features)
      ? body.features as Record<string, unknown> : {};
    const features: Record<string, boolean> = {};
    for (const key of featureKeys) features[key] = incoming[key] === true;
    const values = {
      code, name, description, price_cents: priceCents, currency: "BRL",
      billing_interval: interval, max_birds: maxBirds, features,
      is_free: isFree, is_active: body.is_active !== false, sort_order: sortOrder,
      updated_at: new Date().toISOString(),
    };
    const query = admin.from("platform_plans");
    const result = id
      ? await query.update(values).eq("id", id).select("id").single()
      : await query.insert(values).select("id").single();
    if (result.error) {
      console.error("Plan save failed", result.error.message);
      const duplicate = result.error.code === "23505";
      return response({ error: duplicate ? "Já existe um plano com esse código." : "Não foi possível salvar o plano. Verifique a migração e os dados informados." }, 503, origin);
    }
    const { error: auditError } = await admin.from("master_audit_log").insert({
      actor_user_id: authData.user.id,
      action: id ? "platform_plan_updated" : "platform_plan_created",
      resource_type: "platform_plan",
      resource_id: result.data.id,
      metadata: { code, name, price_cents: priceCents, is_active: values.is_active },
    });
    if (auditError) {
      console.error("Plan audit failed", auditError.message);
      return response({ error: "Plano salvo, mas não foi possível confirmar o registro de auditoria. Verifique o log administrativo." }, 503, origin);
    }
    return response({ success: true, id: result.data.id }, 200, origin);
  }

  if (action === "toggle_plan") {
    const id = String(body.id || "").trim();
    if (!uuid.test(id) || typeof body.is_active !== "boolean") return response({ error: "Dados inválidos para alterar a situação do plano." }, 400, origin);
    const { data, error } = await admin.from("platform_plans")
      .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
      .eq("id", id).select("id,code,name,is_active").single();
    if (error || !data) {
      console.error("Plan status update failed", error?.message);
      return response({ error: "Não foi possível alterar a situação do plano." }, 503, origin);
    }
    const { error: auditError } = await admin.from("master_audit_log").insert({
      actor_user_id: authData.user.id,
      action: body.is_active ? "platform_plan_activated" : "platform_plan_deactivated",
      resource_type: "platform_plan",
      resource_id: id,
      metadata: { code: data.code, name: data.name, is_active: data.is_active },
    });
    if (auditError) {
      console.error("Plan status audit failed", auditError.message);
      return response({ error: "Situação atualizada, mas a auditoria não foi confirmada." }, 503, origin);
    }
    return response({ success: true, plan: data }, 200, origin);
  }

  return response({ error: "Invalid action" }, 400, origin);
});
