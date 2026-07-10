// Waitlist signup + confirmation email (public, called with anon key).
// Owns the INSERT via service role so the waitlist table needs no
// client RLS policies. Duplicate signups return success (idempotent).
import { getCorsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@stellarforge.tools";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { email, source } = await req.json();
    const clean = String(email ?? "").trim().toLowerCase();
    if (!EMAIL_RE.test(clean) || clean.length > 254) {
      return new Response(JSON.stringify({ error: "invalid_email" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Per-IP throttle: max 5 signups per hour per source IP.
    const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
    const ipBytes = new TextEncoder().encode(`sf-waitlist|${ip}`);
    const digest = await crypto.subtle.digest("SHA-256", ipBytes);
    const ipHash = Array.from(new Uint8Array(digest)).slice(0, 16)
      .map((b) => b.toString(16).padStart(2, "0")).join("");
    const hourAgo = new Date(Date.now() - 3_600_000).toISOString();
    const { count } = await supabaseAdmin
      .from("waitlist")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", hourAgo);
    if ((count ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Idempotent insert — duplicates are a success from the user's view
    const { error: insertError } = await supabaseAdmin
      .from("waitlist")
      .insert({ email: clean, ip_hash: ipHash, source: typeof source === "string" ? source.slice(0, 64) : "early-landing" });

    const isDuplicate = insertError?.code === "23505";
    if (insertError && !isDuplicate) throw insertError;

    // Confirmation transmission (skip for duplicates — already got one)
    if (!isDuplicate && RESEND_API_KEY) {
      const html = `
        <div style="font-family:'Courier New',monospace;max-width:560px;margin:0 auto;padding:32px 24px;background:#0A0E17;color:#C8C8C8;">
          <div style="border:1px solid rgba(255,255,255,0.12);padding:36px 32px;">
            <div style="font-size:11px;letter-spacing:3px;color:#15C17B;margin-bottom:18px;">// TRANSMISSION CONFIRMED</div>
            <h2 style="margin:0 0 16px;font-size:20px;letter-spacing:1px;color:#FAFAFA;font-weight:normal;">CLEARANCE REQUEST RECEIVED</h2>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.7;color:#C8C8C8;">
              You're on the manifest. StellarForge Early Access opens
              <strong style="color:#15C17B;">August 11, 2026</strong>.
            </p>
            <p style="margin:0 0 20px;font-size:13px;line-height:1.7;color:#8A8F98;">
              First 500 writers on the list get 40% off the first year of Pro
              with code <strong style="color:#FFB800;">EARLY40</strong>.
            </p>
            <p style="margin:0;font-size:11px;letter-spacing:2px;color:#6A6F78;">NO SPAM &middot; ONE TRANSMISSION PER WEEK &middot; UNSUBSCRIBE ANY TIME</p>
          </div>
          <p style="margin:20px 0 0;font-size:11px;color:#565B64;text-align:center;font-style:italic;">
            These worlds exist in you. Waiting to be found.
          </p>
        </div>`;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [clean],
          subject: "Clearance request received — StellarForge Early Access · Aug 11",
          html,
        }),
      });
      if (r.ok) {
        await supabaseAdmin.from("waitlist").update({ confirmation_sent: true }).eq("email", clean);
      } else {
        console.error("Resend error:", r.status, await r.text());
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("waitlist-confirmation error:", error);
    return new Response(JSON.stringify({ error: "internal" }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
