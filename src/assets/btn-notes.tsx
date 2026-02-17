/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';

export default () =>
  (
    <svg class="icon notes-icon" width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="10" width="60" height="80" fill="none" stroke="currentColor" stroke-width="4" />

      <line x1="35" y1="55" x2="35" y2="70" stroke="currentColor" stroke-width="4" />
      <line x1="45" y1="45" x2="45" y2="80" stroke="currentColor" stroke-width="4" />
      <line x1="55" y1="50" x2="55" y2="75" stroke="currentColor" stroke-width="4" />
      <line x1="65" y1="60" x2="65" y2="70" stroke="currentColor" stroke-width="4" />

      <circle cx="50" cy="35" r="5" fill="currentColor" />
    </svg>
  ) as SVGElement;
