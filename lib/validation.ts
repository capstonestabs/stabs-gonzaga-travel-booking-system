import { ZodError } from "zod";

function humanizeFieldName(fieldName: string) {
  return fieldName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

export function formatZodError(
  error: ZodError,
  fieldLabels: Record<string, string> = {}
) {
  return Array.from(
    new Set(
      error.issues.map((issue) => {
        const fieldName = String(issue.path[0] ?? "field");
        const label = fieldLabels[fieldName] ?? humanizeFieldName(fieldName);

        if (issue.code === "too_small") {
          if (issue.type === "string") {
            return `${label} must contain at least ${issue.minimum} characters.`;
          }

          if (issue.type === "number") {
            if (fieldName === "priceAmount") {
              return `${label} must be at least PHP ${(Number(issue.minimum) / 100).toFixed(2)}.`;
            }

            return `${label} must be at least ${issue.minimum}.`;
          }
        }

        if (issue.code === "invalid_string" && issue.validation === "email") {
          return `${label} must be a valid email address.`;
        }

        if (issue.code === "invalid_enum_value") {
          return `Please select a valid ${label.toLowerCase()}.`;
        }

        return issue.message || `${label} is invalid.`;
      })
    )
  ).join(" ");
}
