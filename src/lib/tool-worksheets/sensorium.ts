/** Sensorium worksheet codec. The form shape lives in lib/sensorium/types. */
import type { SensoriumFormState } from "@/lib/sensorium/types";
import { DEFAULT_FORM_STATE } from "@/lib/sensorium/data";
import { mergeCodec } from "@/lib/tool-worksheet";

export type FormState = SensoriumFormState;
export const initialFormState: FormState = DEFAULT_FORM_STATE;

export const TOOL_TYPE = "sensorium";
export const LOCAL_STORAGE_KEY = "sensorium-v1";

/** Rows store the form as-is; older rows gain missing top-level keys from the defaults (as before). */
export const codec = mergeCodec(initialFormState);
