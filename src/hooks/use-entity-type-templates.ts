// ---------------------------------------------------------------------------
// useEntityTypeTemplates, custom entity type templates per world.
//
// Templates are stored in `entity_type_templates`, fields in
// `entity_type_fields`. Each world can define its own custom types
// (e.g. "Deity", "Sword Style", "Trading Route") with a schema of
// fields that apply to every entity created from that template.
//
// Per-entity ad-hoc fields are NOT handled here, they live under
// entity.metadata._extra in the entities table and are managed by
// a separate hook (use-entity-custom-fields, if/when added).
// ---------------------------------------------------------------------------

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CustomFieldType =
  | "text"
  | "longtext"
  | "number"
  | "select"
  | "multiselect"
  | "boolean"
  | "date"
  | "entity_ref";

export interface EntityTypeField {
  id: string;
  template_id: string;
  field_key: string;
  label: string;
  field_type: CustomFieldType;
  options: string[];
  ref_entity_types: string[];
  help_text: string | null;
  placeholder: string | null;
  required: boolean;
  sort_order: number;
  created_at: string;
}

export interface EntityTypeTemplate {
  id: string;
  world_id: string;
  user_id: string;
  type_key: string;
  label: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  base_entity_type: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  fields: EntityTypeField[];
}

export interface CreateTemplateInput {
  type_key: string;
  label: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  base_entity_type?: string;
}

export interface UpdateTemplateInput {
  id: string;
  label?: string;
  description?: string | null;
  icon?: string | null;
  color?: string | null;
  base_entity_type?: string;
  sort_order?: number;
}

export interface CreateFieldInput {
  template_id: string;
  field_key: string;
  label: string;
  field_type: CustomFieldType;
  options?: string[];
  ref_entity_types?: string[];
  help_text?: string | null;
  placeholder?: string | null;
  required?: boolean;
  sort_order?: number;
}

export interface UpdateFieldInput {
  id: string;
  field_key?: string;
  label?: string;
  field_type?: CustomFieldType;
  options?: string[];
  ref_entity_types?: string[];
  help_text?: string | null;
  placeholder?: string | null;
  required?: boolean;
  sort_order?: number;
}

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

const keys = {
  templates: (worldId: string) => ["entity-type-templates", worldId] as const,
};

// ---------------------------------------------------------------------------
// Missing-table detection (same shape as use-document-versions)
// ---------------------------------------------------------------------------

function isMissingTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  if (e.code === "42P01" || e.code === "PGRST205") return true;
  if (typeof e.message === "string" && /entity_type_/i.test(e.message) && /does not exist/i.test(e.message)) {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// READ, all templates + fields for a world
// ---------------------------------------------------------------------------

export function useEntityTypeTemplates(worldId: string | undefined) {
  return useQuery<EntityTypeTemplate[]>({
    queryKey: keys.templates(worldId ?? ""),
    enabled: !!worldId,
    staleTime: 60_000,
    queryFn: async (): Promise<EntityTypeTemplate[]> => {
      const { data: templates, error } = await supabase
        .from("entity_type_templates")
        .select("*")
        .eq("world_id", worldId!)
        .order("sort_order", { ascending: true });

      if (error) {
        if (isMissingTableError(error)) return [];
        throw error;
      }
      if (!templates || templates.length === 0) return [];

      const templateIds = templates.map((t) => t.id);
      const { data: fields, error: fieldsErr } = await supabase
        .from("entity_type_fields")
        .select("*")
        .in("template_id", templateIds)
        .order("sort_order", { ascending: true });
      if (fieldsErr) {
        if (isMissingTableError(fieldsErr)) {
          return templates.map((t) => ({
            ...(t as EntityTypeTemplate),
            fields: [],
          }));
        }
        throw fieldsErr;
      }

      const byTemplate = new Map<string, EntityTypeField[]>();
      for (const f of (fields ?? []) as EntityTypeField[]) {
        const list = byTemplate.get(f.template_id) ?? [];
        list.push(f);
        byTemplate.set(f.template_id, list);
      }

      return (templates as unknown as EntityTypeTemplate[]).map((t) => ({
        ...t,
        fields: byTemplate.get(t.id) ?? [],
      }));
    },
  });
}

// ---------------------------------------------------------------------------
// TEMPLATE MUTATIONS
// ---------------------------------------------------------------------------

export function useCreateTemplate(worldId: string | undefined) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTemplateInput) => {
      const { data, error } = await supabase
        .from("entity_type_templates")
        .insert({
          world_id: worldId!,
          user_id: user!.id,
          type_key: input.type_key,
          label: input.label,
          description: input.description ?? null,
          icon: input.icon ?? null,
          color: input.color ?? null,
          base_entity_type: input.base_entity_type ?? "custom",
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.templates(worldId ?? "") });
    },
    onError: (err) => {
      toast({
        title: "CREATE FAILED.",
        description: err instanceof Error ? err.message : "Could not create template.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTemplate(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTemplateInput) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("entity_type_templates")
        .update(patch)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.templates(worldId ?? "") });
    },
    onError: (err) => {
      toast({
        title: "UPDATE FAILED.",
        description: err instanceof Error ? err.message : "Could not update template.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTemplate(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("entity_type_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.templates(worldId ?? "") });
    },
    onError: (err) => {
      toast({
        title: "DELETE FAILED.",
        description: err instanceof Error ? err.message : "Could not delete template.",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// FIELD MUTATIONS
// ---------------------------------------------------------------------------

export function useCreateTemplateField(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFieldInput) => {
      const { data, error } = await supabase
        .from("entity_type_fields")
        .insert({
          template_id: input.template_id,
          field_key: input.field_key,
          label: input.label,
          field_type: input.field_type,
          options: input.options ?? [],
          ref_entity_types: input.ref_entity_types ?? [],
          help_text: input.help_text ?? null,
          placeholder: input.placeholder ?? null,
          required: input.required ?? false,
          sort_order: input.sort_order ?? 0,
        })
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.templates(worldId ?? "") });
    },
    onError: (err) => {
      toast({
        title: "FIELD CREATE FAILED.",
        description: err instanceof Error ? err.message : "Could not create field.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTemplateField(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateFieldInput) => {
      const { id, ...patch } = input;
      const { data, error } = await supabase
        .from("entity_type_fields")
        .update(patch)
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.templates(worldId ?? "") });
    },
    onError: (err) => {
      toast({
        title: "FIELD UPDATE FAILED.",
        description: err instanceof Error ? err.message : "Could not update field.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTemplateField(worldId: string | undefined) {
  const { toast } = useToast();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("entity_type_fields")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.templates(worldId ?? "") });
    },
    onError: (err) => {
      toast({
        title: "FIELD DELETE FAILED.",
        description: err instanceof Error ? err.message : "Could not delete field.",
        variant: "destructive",
      });
    },
  });
}
