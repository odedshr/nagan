import { State } from '../types';

let currentTheme: string = 'default';

function loadTheme(themeName: string): void {
  // Remove existing theme
  const existingLink = document.querySelector('link[data-theme-link]');
  if (existingLink) {
    existingLink.remove();
  }

  // Add new theme
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/src/themes/${themeName}.css`;
  link.type = 'text/css';
  link.setAttribute('data-theme-link', 'true');
  document.head.appendChild(link);
}

export function applyTheme(state: State): void {
  const themeName = state.preferences.cssTheme || 'default';

  loadTheme(themeName);

  state.preferences.addListener('cssTheme', (newTheme: string) => {
    if (newTheme != currentTheme) {
      loadTheme(newTheme || 'default');
      currentTheme = newTheme;
    }
  });
}
