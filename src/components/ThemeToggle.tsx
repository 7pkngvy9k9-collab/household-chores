import { useTheme } from "../theme/ThemeProvider";
import { Icon } from "./Icons";

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button
      className="icon-btn"
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Icon name={dark ? "sun" : "moon"} />
      <span>{dark ? "Light" : "Dark"}</span>
    </button>
  );
}
