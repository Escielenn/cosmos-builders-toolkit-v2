import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type {
  GeneralContactFormData,
  SupportTicketFormData,
  SimpleSubmissionFormData,
  SimpleSubmissionType,
  EarlyAccessFormData,
} from "@/lib/contact-schemas";

// Helper to check honeypot - returns true if it's a bot
const isBot = (honeypot?: string): boolean => {
  return !!honeypot && honeypot.length > 0;
};

export const useContact = () => {
  const { user } = useAuth();

  const submitContactForm = useMutation({
    mutationFn: async (data: GeneralContactFormData & { honeypot?: string }) => {
      // Honeypot check - silently succeed if bot detected
      if (isBot(data.honeypot)) {
        return { success: true, blocked: true };
      }

      // Insert to database
      const { error: dbError } = await supabase
        .from("contact_submissions")
        .insert({
          name: data.name,
          email: data.email,
          message: data.message,
          user_id: user?.id || null,
        });

      if (dbError) throw dbError;

      // Trigger Edge Function for email notification
      const response = await supabase.functions.invoke("submit-contact", {
        body: { ...data, type: "contact" },
      });

      if (response.error) throw response.error;
      return response.data;
    },
  });

  const submitSupportTicket = useMutation({
    mutationFn: async (data: SupportTicketFormData & { honeypot?: string }) => {
      // Honeypot check - silently succeed if bot detected
      if (isBot(data.honeypot)) {
        return { success: true, blocked: true, ticketNumber: "TKT-BLOCKED" };
      }

      // Insert to database
      const { data: ticketData, error: dbError } = await supabase
        .from("support_tickets")
        .insert({
          name: data.name,
          email: data.email,
          category: data.category,
          priority: data.priority,
          subject: data.subject,
          message: data.message,
          user_id: user?.id || null,
        })
        .select("ticket_number")
        .single();

      if (dbError) throw dbError;

      // Trigger Edge Function for email notification
      const response = await supabase.functions.invoke("submit-contact", {
        body: {
          ...data,
          type: "support",
          ticketNumber: ticketData.ticket_number,
        },
      });

      if (response.error) throw response.error;
      return { ...response.data, ticketNumber: ticketData.ticket_number };
    },
  });

  const submitSimpleForm = useMutation({
    mutationFn: async ({
      data,
      type,
      honeypot,
    }: {
      data: SimpleSubmissionFormData;
      type: SimpleSubmissionType;
      honeypot?: string;
    }) => {
      // Honeypot check - silently succeed if bot detected
      if (isBot(honeypot)) {
        return { success: true, blocked: true, ticketNumber: "TKT-BLOCKED" };
      }

      const subjectPrefixes: Record<SimpleSubmissionType, string> = {
        feature: "Feature Request",
        bug: "Bug Report",
        beta: "Beta Feedback",
      };

      const prefix = subjectPrefixes[type];
      const fullSubject = `${prefix}: ${data.subject}`;

      if (type === "feature" || type === "bug") {
        // Use support_tickets for feature requests and bug reports
        const { data: ticketData, error: dbError } = await supabase
          .from("support_tickets")
          .insert({
            name: data.name,
            email: data.email,
            category: type,
            priority: "normal",
            subject: fullSubject,
            message: data.message,
            user_id: user?.id || null,
          })
          .select("ticket_number")
          .single();

        if (dbError) throw dbError;

        const response = await supabase.functions.invoke("submit-contact", {
          body: {
            ...data,
            subject: fullSubject,
            category: type,
            priority: "normal",
            type: "support",
            ticketNumber: ticketData.ticket_number,
          },
        });

        if (response.error) throw response.error;
        return { ...response.data, ticketNumber: ticketData.ticket_number };
      } else {
        // Use contact_submissions for beta feedback
        const { error: dbError } = await supabase
          .from("contact_submissions")
          .insert({
            name: data.name,
            email: data.email,
            message: `[${prefix}] ${data.subject}\n\n${data.message}`,
            user_id: user?.id || null,
          });

        if (dbError) throw dbError;

        const response = await supabase.functions.invoke("submit-contact", {
          body: {
            ...data,
            subject: fullSubject,
            type: "beta",
          },
        });

        if (response.error) throw response.error;
        return response.data;
      }
    },
  });

  const submitEarlyAccess = useMutation({
    mutationFn: async (data: EarlyAccessFormData & { honeypot?: string }) => {
      if (isBot(data.honeypot)) {
        return { success: true, blocked: true };
      }

      // Skip DB insert — anonymous users can't write to contact_submissions (RLS).
      // The edge function email serves as the record.
      const response = await supabase.functions.invoke("submit-contact", {
        body: { ...data, type: "early-access" },
      });

      if (response.error) throw response.error;
      return response.data;
    },
  });

  return {
    submitContactForm,
    submitSupportTicket,
    submitSimpleForm,
    submitEarlyAccess,
  };
};
