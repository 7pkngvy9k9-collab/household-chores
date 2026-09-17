import { useI18n } from "../i18n/LocaleProvider";

export function LanguageToggle() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label={t("lang.label")}>
      <button
        className={`chip${locale === "en" ? " active" : ""}`}
        type="button"
        onClick={() => setLocale("en")}
      >
        EN
      </button>
      <button
        className={`chip${locale === "de" ? " active" : ""}`}
        type="button"
        onClick={() => setLocale("de")}
      >
        DE
      </button>
    </div>
  );
}
