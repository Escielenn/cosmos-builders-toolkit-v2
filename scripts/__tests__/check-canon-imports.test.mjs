import { describe, it, expect } from "vitest";
import { importsClient, importSpecifiers, inScope, allowed, evaluate } from "../check-canon-imports.mjs";

describe("check-canon-imports", () => {
  it("finds static, dynamic and relative client imports", () => {
    expect(importsClient("src/components/a/X.tsx", 'import { supabase } from "@/integrations/supabase/client";')).toBe(true);
    expect(importsClient("src/components/a/X.tsx", 'const { supabase } = await import("@/integrations/supabase/client");')).toBe(true);
    expect(importsClient("src/components/a/X.tsx", "import { supabase } from '../../integrations/supabase/client';")).toBe(true);
    expect(importsClient("src/components/a/X.tsx", 'export { supabase } from "@/integrations/supabase/client";')).toBe(true);
  });

  it("ignores types-only imports and the generated types module", () => {
    expect(importsClient("src/pages/X.tsx", 'import type { Database } from "@/integrations/supabase/types";')).toBe(false);
    expect(importsClient("src/pages/X.tsx", 'import type { supabase } from "@/integrations/supabase/client";')).toBe(false);
    expect(importsClient("src/pages/X.tsx", 'import { useFacts } from "@/canon/hooks";')).toBe(false);
  });

  it("collects specifiers across multi-name imports", () => {
    expect(importSpecifiers('import React, { useState } from "react";\nimport * as Z from "zod";')).toEqual(["react", "zod"]);
  });

  it("scopes to components and pages, never tests", () => {
    expect(inScope("src/components/world/A.tsx")).toBe(true);
    expect(inScope("src/pages/B.tsx")).toBe(true);
    expect(inScope("src/hooks/useX.ts")).toBe(false);
    expect(inScope("src/components/world/__tests__/A.test.tsx")).toBe(false);
  });

  it("allow-list covers auth, admin, billing and account surfaces only", () => {
    expect(allowed("src/pages/Auth.tsx")).toBe(true);
    expect(allowed("src/components/admin/Users.tsx")).toBe(true);
    expect(allowed("src/components/world/WorldExportDialog.tsx")).toBe(false);
  });

  it("baseline passes legacy offenders, fails new ones, reports migrated ones", () => {
    const r = evaluate(
      ["src/components/world/Old.tsx", "src/components/world/New.tsx", "src/pages/Auth.tsx"],
      ["src/components/world/Old.tsx", "src/components/world/Migrated.tsx"],
    );
    expect(r.violations).toEqual(["src/components/world/New.tsx"]);
    expect(r.stale).toEqual(["src/components/world/Migrated.tsx"]);
  });
});
