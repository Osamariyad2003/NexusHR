import { useEffect, useRef } from 'react';
import { matchShortcut } from './shortcutDefinitions';

export { SHORTCUTS, matchShortcut } from './shortcutDefinitions';

// Focuses whichever header search box is on screen (sidebar or top-nav layout)
const focusGlobalSearch = () => {
  const input = document.querySelector('[data-global-search]');
  if (input) {
    input.focus();
    input.select();
  }
};

/**
 * Installs the shortcuts while `enabled`. `navigate(tab)` switches the main view.
 * Global search opens the employee directory (the header search filters it) and focuses the box.
 */
export function useKeyboardShortcuts({ enabled, navigate }) {
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    if (!enabled) return undefined;

    const onKeyDown = (event) => {
      const shortcut = matchShortcut(event);
      if (!shortcut) return;
      event.preventDefault();

      if (shortcut.id === 'search') {
        navigateRef.current('employees');
        // Wait a frame so the input exists after a layout switch
        requestAnimationFrame(focusGlobalSearch);
      } else {
        navigateRef.current(shortcut.tab);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
