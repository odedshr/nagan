/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';

export default () =>
  (
    <svg class="icon playlist-icon" width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="20" width="50" height="8" fill="none" stroke="currentColor" stroke-width="4" />
      <rect x="20" y="35" width="50" height="8" fill="none" stroke="currentColor" stroke-width="4" />
      <rect x="20" y="50" width="50" height="8" fill="none" stroke="currentColor" stroke-width="4" />
      <polygon points="20,65 20,81 35,72" fill="currentColor" />

      <g class="add-icon">
        <circle cx="70" cy="74" r="12" stroke="currentColor" stroke-width="2" fill="white" />
        <line x1="64" y1="74" x2="76" y2="74" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
        <line x1="70" y1="68" x2="70" y2="80" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
      </g>
    </svg>
  ) as SVGElement;
