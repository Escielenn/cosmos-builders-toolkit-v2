import { getCorsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPPORT_EMAIL =
  Deno.env.get("SUPPORT_EMAIL") || "support@stellarforge.tools";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@stellarforge.tools";

// HTML-escape user input to prevent injection in email templates
const escapeHtml = (text: string): string => {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
};

// Helper to safely format message with line breaks (escapes HTML first)
const formatMessage = (msg: string | undefined | null): string => {
  if (!msg) return "(No message provided)";
  return escapeHtml(String(msg)).replace(/\n/g, "<br>");
};

// Safely escape a string for use in email templates
const safe = (val: string | undefined | null): string => {
  if (!val) return "N/A";
  return escapeHtml(String(val));
};

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: cors });
  }

  try {
    const body = await req.json();
    const {
      type,
      name,
      email,
      message,
      category,
      priority,
      subject,
      ticketNumber,
    } = body;

    console.log("Received contact submission:", { type, name, email: email?.substring(0, 3) + "***" });

    if (!RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ success: true, emailSkipped: true }),
        { headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    // Build email content based on type (all user input is HTML-escaped)
    let emailSubject: string;
    let emailHtml: string;
    const formattedMessage = formatMessage(message);
    const safeName = safe(name);
    const safeEmail = safe(email);
    const safeSubject = safe(subject);
    const safeCategory = safe(category);
    const safePriority = safe(priority);
    const safeTicket = safe(ticketNumber);

    if (type === "early-access") {
      const safeWritingFocus = formatMessage(body.writingFocus);
      const safeHeardFrom = safe(body.heardFrom);
      emailSubject = `Early Access Request from ${safeName}`;
      emailHtml = `
        <h2>New Early Access Request</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>What they write:</strong></p>
        <p>${safeWritingFocus}</p>
        <p><strong>How they found us:</strong> ${safeHeardFrom}</p>
      `;
    } else if (type === "support") {
      emailSubject = `[${safeTicket}] ${safePriority.toUpperCase()} - ${safeSubject || "Support Request"}`;
      emailHtml = `
        <h2>New Support Ticket: ${safeTicket}</h2>
        <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
        <p><strong>Category:</strong> ${safeCategory || "general"}</p>
        <p><strong>Priority:</strong> ${safePriority || "normal"}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <hr />
        <h3>Message:</h3>
        <p>${formattedMessage}</p>
      `;
    } else if (type === "beta") {
      emailSubject = safeSubject || `Beta Feedback from ${safeName}`;
      emailHtml = `
        <h2>Beta Feedback</h2>
        <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <hr />
        <h3>Feedback:</h3>
        <p>${formattedMessage}</p>
      `;
    } else {
      emailSubject = `New Contact Form Submission from ${safeName}`;
      emailHtml = `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${safeName} (${safeEmail})</p>
        <hr />
        <h3>Message:</h3>
        <p>${formattedMessage}</p>
      `;
    }

    // Send email via Resend - don't let failures block the response
    let emailSent = false;
    try {
      console.log("Sending notification email to:", SUPPORT_EMAIL);
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [SUPPORT_EMAIL],
          reply_to: email,
          subject: emailSubject,
          html: emailHtml,
        }),
      });

      if (!resendResponse.ok) {
        const errorText = await resendResponse.text();
        console.error("Resend notification error:", resendResponse.status, errorText);
      } else {
        emailSent = true;
        console.log("Notification email sent successfully");
      }
    } catch (emailError) {
      console.error("Failed to send notification email:", emailError);
    }

    // Send confirmation email to user (uses escaped name for greeting)
    let confirmationSubject: string;
    let confirmationHtml: string;

    if (type === "early-access") {
      confirmationSubject = "Early Access Request Received — StellarForge";
      confirmationHtml = `
        <h2>We received your early access request</h2>
        <p>Hi ${safeName},</p>
        <p>Thank you for your interest in StellarForge. We're reviewing early access requests on a rolling basis and will be in touch when a spot opens up.</p>
        <p>Best regards,<br/>The StellarForge Team</p>
      `;
    } else if (type === "support") {
      confirmationSubject = `We received your support ticket: ${safeTicket}`;
      confirmationHtml = `
        <h2>Thank you for contacting StellarForge Support</h2>
        <p>Hi ${safeName},</p>
        <p>We've received your support ticket and will respond as soon as possible.</p>
        <p><strong>Ticket Number:</strong> ${safeTicket}</p>
        <p><strong>Category:</strong> ${safeCategory || "general"}</p>
        <p><strong>Subject:</strong> ${safeSubject}</p>
        <p>Please save this ticket number for your reference.</p>
        <p>Best regards,<br/>The StellarForge Team</p>
      `;
    } else if (type === "beta") {
      confirmationSubject = "Thank you for your beta feedback - StellarForge";
      confirmationHtml = `
        <h2>Thank you for your beta feedback!</h2>
        <p>Hi ${safeName},</p>
        <p>We really appreciate you taking the time to share your thoughts on StellarForge beta.</p>
        <p>Your feedback helps us improve and build a better experience for everyone.</p>
        <p>Best regards,<br/>The StellarForge Team</p>
      `;
    } else {
      confirmationSubject = "We received your message - StellarForge";
      confirmationHtml = `
        <h2>Thank you for contacting StellarForge</h2>
        <p>Hi ${safeName},</p>
        <p>We've received your message and will get back to you soon.</p>
        <p>Best regards,<br/>The StellarForge Team</p>
      `;
    }

    try {
      console.log("Sending confirmation email to user");
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: confirmationSubject,
          html: confirmationHtml,
        }),
      });
    } catch (confirmError) {
      console.error("Failed to send confirmation email:", confirmError);
    }

    return new Response(JSON.stringify({ success: true, ticketNumber, emailSent }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact submission error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
