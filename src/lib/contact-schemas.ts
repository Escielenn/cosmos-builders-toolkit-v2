import { z } from "zod";

// General Contact Form Schema
export const generalContactSchema = z.object({
  name: z.string().min(2, "Minimum 2 characters."),
  email: z.string().email("Valid email required."),
  message: z
    .string()
    .min(10, "Minimum 10 characters.")
    .max(2000, "Maximum 2000 characters."),
});

export type GeneralContactFormData = z.infer<typeof generalContactSchema>;

// Support Ticket Form Schema
export const supportTicketSchema = z.object({
  name: z.string().min(2, "Minimum 2 characters."),
  email: z.string().email("Valid email required."),
  category: z.enum(["bug", "feature", "billing", "account", "other"], {
    required_error: "Select category.",
  }),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  subject: z
    .string()
    .min(5, "Minimum 5 characters.")
    .max(200, "Maximum 200 characters."),
  message: z
    .string()
    .min(20, "Minimum 20 characters.")
    .max(5000, "Maximum 5000 characters."),
});

export type SupportTicketFormData = z.infer<typeof supportTicketSchema>;

// Category and Priority options for UI
export const TICKET_CATEGORIES = [
  { value: "bug", label: "Bug Report" },
  { value: "feature", label: "Feature Request" },
  { value: "billing", label: "Billing Question" },
  { value: "account", label: "Account Issue" },
  { value: "other", label: "Other" },
] as const;

export const TICKET_PRIORITIES = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

// Simple Submission Form Schema (for Feature Request, Bug Report, Beta Feedback)
export const simpleSubmissionSchema = z.object({
  name: z.string().min(2, "Minimum 2 characters."),
  email: z.string().email("Valid email required."),
  subject: z
    .string()
    .min(5, "Minimum 5 characters.")
    .max(200, "Maximum 200 characters."),
  message: z
    .string()
    .min(10, "Minimum 10 characters.")
    .max(5000, "Maximum 5000 characters."),
});

export type SimpleSubmissionFormData = z.infer<typeof simpleSubmissionSchema>;

// Submission types for the simple form
export type SimpleSubmissionType = "feature" | "bug" | "beta";

// Early Access Request Schema
export const earlyAccessSchema = z.object({
  name: z.string().min(2, "Minimum 2 characters."),
  email: z.string().email("Valid email required."),
  writingFocus: z
    .string()
    .min(5, "Tell us a little more.")
    .max(500, "Maximum 500 characters."),
  heardFrom: z.string().max(200, "Maximum 200 characters.").optional(),
});

export type EarlyAccessFormData = z.infer<typeof earlyAccessSchema>;

// Honeypot field for spam protection (should always be empty)
export const honeypotFieldName = "website_url" as const;
