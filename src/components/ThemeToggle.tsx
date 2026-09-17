import { useTheme } from "../theme/ThemeProvider";

export function ThemeToggle() {
  const { dark, toggle } = useTheme();
  return (
    <button className="ghost" type="button" onClick={toggle}>
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
