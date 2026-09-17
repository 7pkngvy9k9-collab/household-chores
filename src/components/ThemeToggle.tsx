import { useTheme } from "../theme/ThemeProvider";
import { useI18n } from "../i18n/LocaleProvider";
import { Icon } from "./Icons";

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  const { t } = useI18n();
  return (
    <button
      className="icon-btn"
      type="button"
      onClick={toggle}
      aria-label={dark ? t("theme.toLight") : t("theme.toDark")}
    >
      <Icon name={dark ? "sun" : "moon"} />
      <span>{dark ? t("theme.light") : t("theme.dark")}</span>
    </button>
  );
}
