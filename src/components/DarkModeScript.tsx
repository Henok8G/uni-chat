/**
 * DarkModeScript — renders a blocking inline <script> that reads localStorage
 * and applies the `dark` class to <html> *before* the first paint.
 * This eliminates the flash-of-wrong-theme on every page load / navigation.
 *
 * Must be placed as the very first child of <body> in layout.tsx.
 */
export function DarkModeScript() {
  const script = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`;
  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
