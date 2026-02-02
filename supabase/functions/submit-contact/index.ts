import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPPORT_EMAIL =
  Deno.env.get("SUPPORT_EMAIL") || "support@stellarforge.tools";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@stellarforge.tools";

// Helper to safely format message with line breaks
const formatMessage = (msg: string | undefined | null): string => {
  if (!msg) return "(No message provided)";
  return String(msg).replace(/\n/g, "<br>");
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build email content based on type
    let emailSubject: string;
    let emailHtml: string;
    const formattedMessage = formatMessage(message);

    if (type === "support") {
      emailSubject = `[${ticketNumber}] ${priority?.toUpperCase() || "NORMAL"} - ${subject || "Support Request"}`;
      emailHtml = `
        <h2>New Support Ticket: ${ticketNumber}</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Category:</strong> ${category || "general"}</p>
        <p><strong>Priority:</strong> ${priority || "normal"}</p>
        <p><strong>Subject:</strong> ${subject || "N/A"}</p>
        <hr />
        <h3>Message:</h3>
        <p>${formattedMessage}</p>
      `;
    } else if (type === "beta") {
      emailSubject = subject || `Beta Feedback from ${name}`;
      emailHtml = `
        <h2>Beta Feedback</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject || "N/A"}</p>
        <hr />
        <h3>Feedback:</h3>
        <p>${formattedMessage}</p>
      `;
    } else {
      emailSubject = `New Contact Form Submission from ${name}`;
      emailHtml = `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
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

    // Send confirmation email to user
    let confirmationSubject: string;
    let confirmationHtml: string;

    if (type === "support") {
      confirmationSubject = `We received your support ticket: ${ticketNumber}`;
      confirmationHtml = `
        <h2>Thank you for contacting StellarForge Support</h2>
        <p>Hi ${name},</p>
        <p>We've received your support ticket and will respond as soon as possible.</p>
        <p><strong>Ticket Number:</strong> ${ticketNumber}</p>
        <p><strong>Category:</strong> ${category || "general"}</p>
        <p><strong>Subject:</strong> ${subject || "N/A"}</p>
        <p>Please save this ticket number for your reference.</p>
        <p>Best regards,<br/>The StellarForge Team</p>
      `;
    } else if (type === "beta") {
      confirmationSubject = "Thank you for your beta feedback - StellarForge";
      confirmationHtml = `
        <h2>Thank you for your beta feedback!</h2>
        <p>Hi ${name},</p>
        <p>We really appreciate you taking the time to share your thoughts on StellarForge beta.</p>
        <p>Your feedback helps us improve and build a better experience for everyone.</p>
        <p>Best regards,<br/>The StellarForge Team</p>
      `;
    } else {
      confirmationSubject = "We received your message - StellarForge";
      confirmationHtml = `
        <h2>Thank you for contacting StellarForge</h2>
        <p>Hi ${name},</p>
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
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact submission error:", error);
    return new Response(JSON.stringify({ error: error.message, stack: error.stack }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
