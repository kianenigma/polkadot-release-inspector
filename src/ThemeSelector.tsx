import './ThemeSelector.scss';

export const ThemeSelector = ({ setThemeName, themeNames }: any) => {
  return <div className="themeSelector">
    <select onChange={(e) => setThemeName(e.target.value)}>
      {Object.entries(themeNames).map(([key, value]) => <option value={value as string | number | readonly string[] | undefined}>{key}</option>)}
    </select>
  </div>;
}