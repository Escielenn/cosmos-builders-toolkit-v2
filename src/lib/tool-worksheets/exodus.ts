/** Exodus (space-expansion-modeler) worksheet codec. The form shape lives in lib/space-expansion-data. */
import { INITIAL_FORM_STATE, type FormState as ExodusFormState } from "@/lib/space-expansion-data";
import { castCodec } from "@/lib/tool-worksheet";

export type FormState = ExodusFormState;
export const initialFormState: FormState = INITIAL_FORM_STATE;

export const TOOL_TYPE = "space-expansion-modeler";
export const LOCAL_STORAGE_KEY = "space-expansion-worksheet";

/** Rows store the form as-is. */
export const codec = castCodec(initialFormState);
