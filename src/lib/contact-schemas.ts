import { z } from "zod";

// General Contact Form Schema
export const generalContactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be under 2000 characters"),
});

export type GeneralContactFormData = z.infer<typeof generalContactSchema>;

// Support Ticket Form Schema
export const supportTicketSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  category: z.enum(["bug", "feature", "billing", "account", "other"], {
    required_error: "Please select a category",
  }),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must be under 200 characters"),
  message: z
    .string()
    .min(20, "Message must be at least 20 characters")
    .max(5000, "Message must be under 5000 characters"),
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
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must be under 200 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(5000, "Message must be under 5000 characters"),
});

export type SimpleSubmissionFormData = z.infer<typeof simpleSubmissionSchema>;

// Submission types for the simple form
export type SimpleSubmissionType = "feature" | "bug" | "beta";
