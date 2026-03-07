import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ── Types ──────────────────────────────────────────────────────

export interface AdminStats {
  total_users: number;
  total_worlds: number;
  total_worksheets: number;
  active_subscriptions: number;
  open_tickets: number;
  unread_contacts: number;
  users_last_7d: number;
  users_last_30d: number;
}

export interface AdminTicket {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  category: "bug" | "feature" | "billing" | "account" | "other";
  priority: "low" | "normal" | "high" | "urgent";
  subject: string;
  message: string;
  admin_notes: string;
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  created_at: string;
  updated_at: string;
}

export interface AdminContact {
  id: string;
  name: string;
  email: string;
  message: string;
  admin_notes: string;
  status: "new" | "read" | "responded" | "archived";
  created_at: string;
  updated_at: string;
}

export interface AdminUser {
  id: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  world_count: number;
  worksheet_count: number;
  subscription_status: string | null;
  plan_type: string | null;
  current_period_end: string | null;
}

export interface AdminUserDetail {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
  stripe_customer_id: string | null;
  world_count: number;
  worksheet_count: number;
  collaborator_count: number;
  notion_connected: boolean;
  subscription: {
    status: string;
    plan_type: string;
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    canceled_at: string | null;
    stripe_subscription_id: string;
  } | null;
}

export interface SubscriptionStats {
  active: number;
  canceled: number;
  past_due: number;
  trialing: number;
  cancel_at_period_end: number;
  total_ever: number;
}

export interface AdminSubscription {
  id: string;
  stripe_subscription_id: string;
  display_name: string | null;
  email: string | null;
  plan_type: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  canceled_at: string | null;
  created_at: string;
}

export interface ActivityItem {
  type: "ticket" | "contact" | "signup";
  title: string;
  metadata: string | null;
  extra: string | null;
  status: string | null;
  created_at: string;
}

export interface AdminTodo {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "done";
  priority: "low" | "normal" | "high" | "urgent";
  linked_ticket_id: string | null;
  linked_contact_id: string | null;
  created_at: string;
  updated_at: string;
}

// ── Queries ────────────────────────────────────────────────────

export const useAdminStats = () =>
  useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_stats");
      if (error) throw error;
      return data as AdminStats;
    },
    staleTime: 60_000,
  });

export const useAdminTickets = (status?: string, category?: string) =>
  useQuery<AdminTicket[]>({
    queryKey: ["admin", "tickets", status, category],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_tickets", {
        p_status: status ?? null,
        p_category: category ?? null,
        p_limit: 100,
        p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as AdminTicket[];
    },
    staleTime: 30_000,
  });

export const useAdminContacts = (status?: string) =>
  useQuery<AdminContact[]>({
    queryKey: ["admin", "contacts", status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_contacts", {
        p_status: status ?? null,
        p_limit: 100,
        p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as AdminContact[];
    },
    staleTime: 30_000,
  });

export const useAdminUsers = () =>
  useQuery<AdminUser[]>({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users", {
        p_limit: 100,
        p_offset: 0,
      });
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
    staleTime: 60_000,
  });

export const useAdminSearchUsers = (query: string) =>
  useQuery<AdminUser[]>({
    queryKey: ["admin", "users-search", query],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_search_users", {
        p_query: query,
        p_limit: 30,
      });
      if (error) throw error;
      return (data ?? []) as AdminUser[];
    },
    enabled: query.length >= 2,
    staleTime: 30_000,
  });

export const useAdminUserDetail = (userId: string | null) =>
  useQuery<AdminUserDetail>({
    queryKey: ["admin", "user-detail", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_user_detail", {
        p_user_id: userId!,
      });
      if (error) throw error;
      return data as AdminUserDetail;
    },
    enabled: !!userId,
    staleTime: 60_000,
  });

export const useAdminSubscriptionStats = () =>
  useQuery<SubscriptionStats>({
    queryKey: ["admin", "subscription-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_subscription_stats");
      if (error) throw error;
      return data as SubscriptionStats;
    },
    staleTime: 60_000,
  });

export const useAdminSubscriptionList = (status?: string) =>
  useQuery<AdminSubscription[]>({
    queryKey: ["admin", "subscription-list", status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_subscriptions", {
        p_status: status ?? null,
        p_limit: 100,
      });
      if (error) throw error;
      return (data ?? []) as AdminSubscription[];
    },
    staleTime: 60_000,
  });

export const useAdminRecentActivity = () =>
  useQuery<ActivityItem[]>({
    queryKey: ["admin", "recent-activity"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_get_recent_activity", {
        p_limit: 15,
      });
      if (error) throw error;
      return (data ?? []) as ActivityItem[];
    },
    staleTime: 30_000,
  });

// ── Mutations ──────────────────────────────────────────────────

export const useUpdateTicket = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      ticketId,
      status,
      priority,
      adminNotes,
    }: {
      ticketId: string;
      status?: string;
      priority?: string;
      adminNotes?: string;
    }) => {
      const { error } = await supabase.rpc("admin_update_ticket", {
        p_ticket_id: ticketId,
        p_status: status ?? null,
        p_priority: priority ?? null,
        p_admin_notes: adminNotes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "tickets"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

export const useUpdateContact = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contactId,
      status,
      adminNotes,
    }: {
      contactId: string;
      status?: string;
      adminNotes?: string;
    }) => {
      const { error } = await supabase.rpc("admin_update_contact", {
        p_contact_id: contactId,
        p_status: status ?? null,
        p_admin_notes: adminNotes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "contacts"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });
};

// ── Todo Queries & Mutations ──────────────────────────────────

export const useAdminTodos = (status?: string) =>
  useQuery<AdminTodo[]>({
    queryKey: ["admin", "todos", status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_todos", {
        p_status: status ?? null,
        p_limit: 50,
      });
      if (error) throw error;
      return (data ?? []) as AdminTodo[];
    },
    staleTime: 15_000,
  });

export const useCreateTodo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      priority,
      linkedTicketId,
      linkedContactId,
    }: {
      title: string;
      description?: string;
      priority?: string;
      linkedTicketId?: string;
      linkedContactId?: string;
    }) => {
      const { data, error } = await supabase.rpc("admin_create_todo", {
        p_title: title,
        p_description: description ?? "",
        p_priority: priority ?? "normal",
        p_linked_ticket_id: linkedTicketId ?? null,
        p_linked_contact_id: linkedContactId ?? null,
      });
      if (error) throw error;
      return data as AdminTodo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "todos"] });
    },
  });
};

export const useUpdateTodo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      todoId,
      title,
      status,
      priority,
    }: {
      todoId: string;
      title?: string;
      status?: string;
      priority?: string;
    }) => {
      const { error } = await supabase.rpc("admin_update_todo", {
        p_todo_id: todoId,
        p_title: title ?? null,
        p_status: status ?? null,
        p_priority: priority ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "todos"] });
    },
  });
};

export const useDeleteTodo = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (todoId: string) => {
      const { error } = await supabase.rpc("admin_delete_todo", {
        p_todo_id: todoId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "todos"] });
    },
  });
};

export const useClearDoneTodos = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_clear_done_todos");
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "todos"] });
    },
  });
};

// ── Roadmap Admin ─────────────────────────────────────────────

export interface AdminRoadmapItem {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority_order: number;
  vote_count: number;
  target_quarter: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useAdminRoadmapItems = (status?: string) =>
  useQuery<AdminRoadmapItem[]>({
    queryKey: ["admin", "roadmap", status],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_roadmap_items", {
        p_status: status ?? null,
        p_limit: 50,
      });
      if (error) throw error;
      return (data ?? []) as AdminRoadmapItem[];
    },
    staleTime: 30_000,
  });

export const useCreateRoadmapItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      description,
      category,
      targetQuarter,
    }: {
      title: string;
      description?: string;
      category?: string;
      targetQuarter?: string;
    }) => {
      const { data, error } = await supabase.rpc("admin_create_roadmap_item", {
        p_title: title,
        p_description: description ?? "",
        p_category: category ?? "tool",
        p_target_quarter: targetQuarter ?? null,
      });
      if (error) throw error;
      return data as AdminRoadmapItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roadmap"] });
    },
  });
};

export const useUpdateRoadmapItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      itemId,
      title,
      description,
      category,
      status,
      priorityOrder,
      targetQuarter,
    }: {
      itemId: string;
      title?: string;
      description?: string;
      category?: string;
      status?: string;
      priorityOrder?: number;
      targetQuarter?: string;
    }) => {
      const { error } = await supabase.rpc("admin_update_roadmap_item", {
        p_item_id: itemId,
        p_title: title ?? null,
        p_description: description ?? null,
        p_category: category ?? null,
        p_status: status ?? null,
        p_priority_order: priorityOrder ?? null,
        p_target_quarter: targetQuarter ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roadmap"] });
    },
  });
};

export const useDeleteRoadmapItem = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.rpc("admin_delete_roadmap_item", {
        p_item_id: itemId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roadmap"] });
    },
  });
};
