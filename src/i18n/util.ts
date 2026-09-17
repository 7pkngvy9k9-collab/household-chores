export type Locale = "en" | "de";

export type DeepString<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepString<T[K]>;
};

export function flattenMessages(value: unknown, prefix = ""): Record<string, string> {
  if (typeof value === "string") {
    return prefix ? { [prefix]: value } : {};
  }
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, nested]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return { ...acc, ...flattenMessages(nested, path) };
  }, {});
}

export function fill(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

export function lookup(tree: unknown, path: string): string {
  const found = path.split(".").reduce<unknown>((current, part) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[part];
  }, tree);
  return typeof found === "string" ? found : path;
}

export function diffCatalogs(english: unknown, german: unknown): { missing: string[]; extra: string[] } {
  const enKeys = Object.keys(flattenMessages(english));
  const deKeys = new Set(Object.keys(flattenMessages(german)));
  return {
    missing: enKeys.filter((key) => !deKeys.has(key)),
    extra: [...deKeys].filter((key) => !enKeys.includes(key)),
  };
}
