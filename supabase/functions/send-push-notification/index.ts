import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const webhookSecret = Deno.env.get("PUSH_WEBHOOK_SECRET");
  if (!webhookSecret || req.headers.get("x-webhook-secret") !== webhookSecret) {
    return response({ error: "Unauthorized webhook" }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
  const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
  const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:suporte@criatoriodantas.com.br";

  if (!supabaseUrl || !serviceKey || !vapidPublicKey || !vapidPrivateKey) {
    console.error("Push secrets are not configured");
    return response({ error: "Push service is not configured" }, 503);
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return response({ error: "Invalid JSON" }, 400);
  }

  const record = (payload.record || payload) as Record<string, unknown>;
  const notificationId = record.id;
  if (payload.type !== "INSERT" || typeof notificationId !== "string") {
    return response({ error: "Expected a notificacoes INSERT payload" }, 400);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: notification, error: notificationError } = await supabase
    .from("notificacoes")
    .select("id,user_id,audience,tipo,titulo,mensagem,referencia_tipo,referencia_id,lida_em,arquivada_em")
    .eq("id", notificationId)
    .maybeSingle();

  if (notificationError) {
    console.error("Could not load notification", notificationError.message);
    return response({ error: "Could not load notification" }, 500);
  }
  if (!notification || notification.lida_em || notification.arquivada_em) {
    return response({ sent: 0, skipped: true });
  }

  let userIds: string[] = [];
  if (notification.user_id) {
    userIds = [notification.user_id];
  } else if (notification.audience === "admin") {
    const { data: admins, error } = await supabase.from("admins").select("user_id");
    if (error) {
      console.error("Could not load admins", error.message);
      return response({ error: "Could not load admins" }, 500);
    }
    userIds = (admins || []).map((row) => row.user_id).filter(Boolean);
  }

  if (!userIds.length) return response({ sent: 0, skipped: true });

  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

  const { data: subscriptions, error: subscriptionsError } = await supabase
    .from("push_subscriptions")
    .select("id,user_id,endpoint,p256dh,auth")
    .in("user_id", userIds)
    .is("revoked_at", null);

  if (subscriptionsError) {
    console.error("Could not load push subscriptions", subscriptionsError.message);
    return response({ error: "Could not load subscriptions" }, 500);
  }

  const message = JSON.stringify({
    title: notification.titulo || "Avespet",
    body: notification.mensagem || "Há uma nova atualização para você.",
    tag: notification.id,
    url: "/",
  });

  let sent = 0;
  let expired = 0;
  for (const item of subscriptions || []) {
    try {
      await webpush.sendNotification({
        endpoint: item.endpoint,
        keys: { p256dh: item.p256dh, auth: item.auth },
      }, message);
      sent += 1;
    } catch (error) {
      const statusCode = Number((error as { statusCode?: number }).statusCode || 0);
      if (statusCode === 404 || statusCode === 410) {
        await supabase.from("push_subscriptions")
          .update({ revoked_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", item.id);
        expired += 1;
      } else {
        console.error("Push delivery failed", { subscriptionId: item.id, statusCode, message: String(error) });
      }
    }
  }

  return response({ sent, expired, attempted: subscriptions?.length || 0 });
});
