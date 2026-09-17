import { de } from "./de";
import { en } from "./en";
import { diffCatalogs } from "./util";

export function verifyTranslations(): { ok: boolean; missing: string[]; extra: string[] } {
  const { missing, extra } = diffCatalogs(en, de);
  return { ok: missing.length === 0 && extra.length === 0, missing, extra };
}

const check = verifyTranslations();
if (!check.ok) {
  console.error("i18n catalog mismatch", check);
  throw new Error(
    `German catalog is incomplete. Missing: ${check.missing.join(", ") || "—"}; extra: ${check.extra.join(", ") || "—"}`,
  );
}
