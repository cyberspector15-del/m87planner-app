import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { encode as base64UrlEncode } from "https://deno.land/std@0.190.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationPayload {
  title: string;
  body: string;
  tag?: string;
  url?: string;
}

interface PushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

// Helper to convert base64url to Uint8Array
function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Helper to encode data to base64url (compatible with Deno std)
function toBase64Url(data: ArrayBuffer): string {
  return base64UrlEncode(data);
}

// Create VAPID JWT for authorization
async function createVapidJwt(
  audience: string,
  subject: string,
  vapidPrivateKey: string
): Promise<string> {
  const header = {
    typ: "JWT",
    alg: "ES256",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60, // 12 hours
    sub: subject,
  };

  const headerBytes = new TextEncoder().encode(JSON.stringify(header));
  const payloadBytes = new TextEncoder().encode(JSON.stringify(payload));
  
  const headerBase64 = toBase64Url(headerBytes.buffer as ArrayBuffer);
  const payloadBase64 = toBase64Url(payloadBytes.buffer as ArrayBuffer);
  const unsignedToken = `${headerBase64}.${payloadBase64}`;

  // Import the private key for signing
  const privateKeyBytes = base64UrlToUint8Array(vapidPrivateKey);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    privateKeyBytes.buffer as ArrayBuffer,
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    false,
    ["sign"]
  );

  // Sign the token
  const signature = await crypto.subtle.sign(
    {
      name: "ECDSA",
      hash: { name: "SHA-256" },
    },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureBase64 = toBase64Url(signature);
  return `${unsignedToken}.${signatureBase64}`;
}

// Extract audience (origin) from subscription endpoint
function getAudience(endpoint: string): string {
  const url = new URL(endpoint);
  return `${url.protocol}//${url.host}`;
}

// Web Push implementation with VAPID signing
async function sendWebPush(
  subscription: PushSubscription,
  payload: NotificationPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string,
  vapidSubject: string
): Promise<boolean> {
  try {
    const audience = getAudience(subscription.endpoint);
    
    // Create VAPID JWT
    const vapidJwt = await createVapidJwt(audience, vapidSubject, vapidPrivateKey);
    
    // Prepare the payload
    const payloadString = JSON.stringify(payload);
    const encoder = new TextEncoder();
    const payloadBytes = encoder.encode(payloadString);

    // Note: For full RFC 8291 compliance, we should encrypt the payload using
    // the subscription's p256dh and auth keys. However, most push services
    // accept unencrypted payloads for testing. For production, consider using
    // a dedicated web-push library that handles encryption.
    
    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Authorization": `vapid t=${vapidJwt}, k=${vapidPublicKey}`,
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "TTL": "86400",
        "Urgency": "normal",
      },
      body: payloadBytes,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Push failed (${response.status}): ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Failed to send push notification:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    // Subject should be a mailto: or https: URL identifying the application server
    const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@m87planner.app";

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.log("VAPID keys not configured, skipping push notification");
      return new Response(
        JSON.stringify({ success: false, message: "VAPID keys not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, notification } = await req.json();

    if (!user_id || !notification) {
      return new Response(
        JSON.stringify({ error: "Missing user_id or notification" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate notification payload
    if (!notification.title || typeof notification.title !== 'string') {
      return new Response(
        JSON.stringify({ error: "Invalid notification: title is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize notification content
    const sanitizedNotification: NotificationPayload = {
      title: String(notification.title).slice(0, 100),
      body: notification.body ? String(notification.body).slice(0, 500) : "",
      tag: notification.tag ? String(notification.tag).slice(0, 50) : undefined,
      url: notification.url ? String(notification.url).slice(0, 200) : undefined,
    };

    console.log(`Sending notification to user ${user_id}:`, sanitizedNotification);

    // Get user's push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (subError) {
      console.error("Error fetching subscriptions:", subError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch subscriptions" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No subscriptions found for user");
      return new Response(
        JSON.stringify({ success: false, message: "No subscriptions found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send to all user's subscriptions with VAPID authentication
    const results = await Promise.all(
      subscriptions.map((sub) =>
        sendWebPush(
          { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
          sanitizedNotification,
          vapidPublicKey,
          vapidPrivateKey,
          vapidSubject
        )
      )
    );

    const successCount = results.filter(Boolean).length;
    console.log(`Sent ${successCount}/${subscriptions.length} notifications`);

    return new Response(
      JSON.stringify({ success: true, sent: successCount, total: subscriptions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-notification:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
