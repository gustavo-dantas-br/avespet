import { supabase } from "../supabaseClient";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

function getDeviceLabel() {
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Navegador";
  const platform = /iPhone|iPad|iPod/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac/.test(ua) ? "macOS" : "Outro";
  return { deviceLabel: browser + " (" + platform + ")", platform };
}

export async function ativarPushDoDispositivo(userId) {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Este navegador não oferece suporte a notificações push.");
  }

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error("A configuração de notificações ainda não foi concluída.");

  if (!userId) throw new Error("Entre na sua conta para ativar as notificações.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("A permissão para notificações não foi concedida.");

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = subscription.toJSON();
  const { deviceLabel, platform } = getDeviceLabel();
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: userId,
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth: json.keys?.auth,
    device_label: deviceLabel,
    platform,
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    revoked_at: null,
  }, { onConflict: "endpoint" });

  if (error) {
    await subscription.unsubscribe().catch(() => {});
    throw new Error("Não foi possível registrar este dispositivo: " + error.message);
  }

  return subscription;
}
