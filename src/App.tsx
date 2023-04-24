import { useState } from "react";
import { ThemedContent } from "./ThemedContent";
import { ThemeSelector } from "./ThemeSelector";

const themeNames = {
  light: `light-theme`,
  dark: `dark-theme`
};

function Theme({ children, themeName }: any) {
  return <div className={themeName}>{children}</div>;
}

export const App = () => {
  //setup hook for themeName so we can re-render when setThemeName is called.
  const [themeName, setThemeName] = useState(themeNames.light);

  return <Theme themeName={themeName}>
    <ThemeSelector setThemeName={setThemeName} themeNames={themeNames} />
    <ThemedContent />
  </Theme>;
}