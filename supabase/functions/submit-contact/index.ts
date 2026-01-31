import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPPORT_EMAIL =
  Deno.env.get("SUPPORT_EMAIL") || "support@stellarforge.io";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@stellarforge.io";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      type,
      name,
      email,
      message,
      category,
      priority,
      subject,
      ticketNumber,
    } = await req.json();

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

    if (type === "support") {
      emailSubject = `[${ticketNumber}] ${priority?.toUpperCase()} - ${subject}`;
      emailHtml = `
        <h2>New Support Ticket: ${ticketNumber}</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `;
    } else if (type === "beta") {
      emailSubject = subject || `Beta Feedback from ${name}`;
      emailHtml = `
        <h2>Beta Feedback</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <hr />
        <h3>Feedback:</h3>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `;
    } else {
      emailSubject = `New Contact Form Submission from ${name}`;
      emailHtml = `
        <h2>New Contact Form Submission</h2>
        <p><strong>From:</strong> ${name} (${email})</p>
        <hr />
        <h3>Message:</h3>
        <p>${message.replace(/\n/g, "<br>")}</p>
      `;
    }

    // Send email via Resend
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
      const error = await resendResponse.text();
      console.error("Resend error:", error);
      // Don't throw - submission was saved, email is secondary
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
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Subject:</strong> ${subject}</p>
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

    return new Response(JSON.stringify({ success: true, ticketNumber }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Contact submission error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
