/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';

export default () =>
  (
    <svg class="icon playlist-icon" width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d=" M38 20 Q40 18 42 20 L72 48 Q74 50 72 52 L42 80 Q40 82 38 80 Q36 78 36 75 V25 Q36 22 38 20 Z" />

      <g class="add-icon">
        <circle cx="70" cy="74" r="12" stroke="currentColor" stroke-width="2" fill="white" />
        <line x1="64" y1="74" x2="76" y2="74" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
        <line x1="70" y1="68" x2="70" y2="80" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
      </g>
    </svg>
  ) as SVGElement;
