import type { FieldErrors, FieldValues, Resolver, ResolverResult } from "react-hook-form";
import type { z } from "zod";

/**
 * Zod v4-compatible resolver for react-hook-form.
 * The official `@hookform/resolvers/zod` expects Zod v3 error shapes
 * and throws unhandled ZodErrors with Zod v4. This resolver uses
 * `safeParse` and maps v4 issues to react-hook-form's `FieldErrors`.
 */
export function zodResolver<T extends z.ZodType<any, any>>(
  schema: T
): Resolver<z.output<T>> {
  return async (values: FieldValues): Promise<ResolverResult<z.output<T>>> => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data as z.output<T>, errors: {} };
    }

    const fieldErrors: FieldErrors = {};

    for (const issue of (result as any).error?.issues ?? []) {
      const path = issue.path?.join(".") || "root";
      if (!fieldErrors[path]) {
        fieldErrors[path] = {
          type: issue.code ?? "validation",
          message: issue.message ?? "Validation error",
        };
      }
    }

    return { values: {} as z.output<T>, errors: fieldErrors };
  };
}
