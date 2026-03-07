import type { FieldValues, Resolver } from "react-hook-form";
import type { z } from "zod";

/**
 * Zod v4-compatible resolver for react-hook-form.
 */
export function zodResolver<T extends z.ZodType<any, any>>(
  schema: T
): Resolver<z.output<T>> {
  return async (values: FieldValues) => {
    const result = schema.safeParse(values);

    if (result.success) {
      return { values: result.data, errors: {} } as any;
    }

    const fieldErrors: Record<string, { type: string; message: string }> = {};

    for (const issue of (result as any).error?.issues ?? []) {
      const path = issue.path?.join(".") || "root";
      if (!fieldErrors[path]) {
        fieldErrors[path] = {
          type: issue.code ?? "validation",
          message: issue.message ?? "Validation error",
        };
      }
    }

    return { values: {}, errors: fieldErrors } as any;
  };
}
