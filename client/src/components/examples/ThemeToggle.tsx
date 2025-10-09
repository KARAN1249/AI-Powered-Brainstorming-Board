import { ThemeToggle } from "../ThemeToggle";
import { ThemeProvider } from "../ThemeProvider";

export default function ThemeToggleExample() {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="p-4">
        <ThemeToggle />
      </div>
    </ThemeProvider>
  );
}
