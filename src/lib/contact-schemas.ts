import { z } from "zod";

// General Contact Form Schema
export const generalContactSchema = z.object({
  name: z.string().min(2, "NAME REQUIRED, AT LEAST 2 CHARS."),
  email: z.string().email("VALID EMAIL REQUIRED."),
  message: z
    .string()
    .min(10, "AT LEAST 10 CHARS REQUIRED.")
    .max(2000, "MAX 2000 CHARS EXCEEDED."),
});

export type GeneralContactFormData = z.infer<typeof generalContactSchema>;

// Support Ticket Form Schema
export const supportTicketSchema = z.object({
  name: z.string().min(2, "NAME REQUIRED, AT LEAST 2 CHARS."),
  email: z.string().email("VALID EMAIL REQUIRED."),
  category: z.enum(["bug", "feature", "billing", "account", "other"], {
    required_error: "Select category.",
  }),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  subject: z
    .string()
    .min(5, "AT LEAST 5 CHARS REQUIRED.")
    .max(200, "MAX 200 CHARS EXCEEDED."),
  message: z
    .string()
    .min(20, "AT LEAST 20 CHARS REQUIRED.")
    .max(5000, "MAX 5000 CHARS EXCEEDED."),
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
  name: z.string().min(2, "NAME REQUIRED, AT LEAST 2 CHARS."),
  email: z.string().email("VALID EMAIL REQUIRED."),
  subject: z
    .string()
    .min(5, "AT LEAST 5 CHARS REQUIRED.")
    .max(200, "MAX 200 CHARS EXCEEDED."),
  message: z
    .string()
    .min(10, "AT LEAST 10 CHARS REQUIRED.")
    .max(5000, "MAX 5000 CHARS EXCEEDED."),
});

export type SimpleSubmissionFormData = z.infer<typeof simpleSubmissionSchema>;

// Submission types for the simple form
export type SimpleSubmissionType = "feature" | "bug" | "beta";

// Early Access Request Schema
export const earlyAccessSchema = z.object({
  name: z.string().min(2, "NAME REQUIRED, AT LEAST 2 CHARS."),
  email: z.string().email("VALID EMAIL REQUIRED."),
  writingFocus: z
    .string()
    .min(5, "Tell us a little more.")
    .max(500, "MAX 500 CHARS EXCEEDED."),
  heardFrom: z.string().max(200, "MAX 200 CHARS EXCEEDED.").optional(),
});

export type EarlyAccessFormData = z.infer<typeof earlyAccessSchema>;

// Honeypot field for spam protection (should always be empty)
export const honeypotFieldName = "website_url" as const;
