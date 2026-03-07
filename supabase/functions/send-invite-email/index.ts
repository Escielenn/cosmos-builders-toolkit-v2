import { getCorsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabase.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@stellarforge.tools";
const APP_URL = Deno.env.get("APP_URL") || "https://stellarforge.tools";

const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (c) => map[c]);
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    // Auth: extract JWT, get user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") || "",
      Deno.env.get("SUPABASE_ANON_KEY") || "",
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);
    if (userError || !user) throw new Error("Not authenticated");

    const { invitedEmail, worldId, worldName, inviteToken, role, inviterName } =
      await req.json();

    // Verify the caller owns the world (defense in depth)
    const { data: world } = await supabaseAdmin
      .from("worlds")
      .select("user_id")
      .eq("id", worldId)
      .single();

    if (!world || world.user_id !== user.id) {
      throw new Error("Not authorized to invite to this world");
    }

    const acceptUrl = `${APP_URL}/invite/${encodeURIComponent(inviteToken)}`;
    const safeInviter = escapeHtml(inviterName || "Someone");
    const safeWorld = escapeHtml(worldName || "Untitled World");

    if (RESEND_API_KEY) {
      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #e2e8f0;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); border-radius: 16px; padding: 40px 32px; border: 1px solid rgba(99, 102, 241, 0.2);">
            <h2 style="margin: 0 0 16px; font-size: 22px; color: #f1f5f9;">You've been invited to collaborate</h2>
            <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #94a3b8;">
              <strong style="color: #e2e8f0;">${safeInviter}</strong> has invited you to collaborate on the world
              "<strong style="color: #a78bfa;">${safeWorld}</strong>" on StellarForge.
            </p>
            <p style="margin: 0 0 28px; font-size: 14px; color: #94a3b8;">
              <strong>Your role:</strong> ${role === "editor" ? "Editor — can edit worksheets" : "Viewer — read-only access"}
            </p>
            <p style="margin: 0 0 24px;">
              <a href="${acceptUrl}" style="display: inline-block; padding: 12px 28px; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px;">
                Accept Invitation
              </a>
            </p>
            <p style="margin: 0 0 8px; font-size: 12px; color: #64748b;">
              Or copy this link: <a href="${acceptUrl}" style="color: #818cf8;">${acceptUrl}</a>
            </p>
            <p style="margin: 0; font-size: 12px; color: #475569;">This invite expires in 7 days.</p>
          </div>
          <p style="margin: 24px 0 0; font-size: 12px; color: #475569; text-align: center;">
            StellarForge — the science fiction worldbuilding toolkit
          </p>
        </div>
      `;

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [invitedEmail],
          subject: `${safeInviter} invited you to collaborate on "${safeWorld}" — StellarForge`,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.error("Resend error:", resendResponse.status, errorText);
      }
    } else {
      console.warn("RESEND_API_KEY not configured, skipping invite email");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send invite email error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
