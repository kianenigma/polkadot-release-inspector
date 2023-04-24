import './ThemeSelector.scss';

export const ThemeSelector = ({ setThemeName, themeNames }: any) => {
  return <div className="themeSelector">
    <select onChange={(e) => setThemeName(e.target.value)}>
      {Object.entries(themeNames).map(([key, value]) => <option value={value}>{key}</option>)}
    </select>
  </div>;
}