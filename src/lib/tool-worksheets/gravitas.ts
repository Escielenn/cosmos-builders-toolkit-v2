/** Gravitas worksheet codec. The form shape lives in lib/gravitas/types. */
import type { GravitasFormState } from "@/lib/gravitas/types";
import { INITIAL_FORM_STATE } from "@/lib/gravitas/data";
import { castCodec } from "@/lib/tool-worksheet";

export type FormState = GravitasFormState;
export const initialFormState: FormState = INITIAL_FORM_STATE;

export const TOOL_TYPE = "gravitas";
export const LOCAL_STORAGE_KEY = "gravitas-v1";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
