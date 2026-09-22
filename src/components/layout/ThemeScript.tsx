/**
 * Applies the saved theme before first paint, so a dark-mode visitor never sees
 * a white flash. Runs as a blocking inline script by design.
 */
const SCRIPT = `(function(){try{var s=localStorage.getItem('reviewdot-theme');var t=s||(window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t;}catch(e){}})();`

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />
}
