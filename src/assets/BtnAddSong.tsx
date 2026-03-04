/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';

export default () =>
  (
    <svg
      class="icon add-song-icon"
      width="100"
      height="100"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <g transform="translate(50 50) scale(0.8) translate(-50 -50)">
        <g transform="translate(-2 0)">
          {/* File (with folded corner) */}
          <path
            d="M24 10H60L80 30V90H24V10Z"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="square"
            stroke-linejoin="miter"
            fill="white"
          />
          <path
            d="M60 10V30H80"
            stroke="currentColor"
            stroke-width="4"
            stroke-linecap="square"
            stroke-linejoin="miter"
          />

          {/* Musical note (quarter) */}
          <circle cx="50" cy="63" r="7" fill="currentColor" />
          <line x1="57" y1="63" x2="57" y2="35" stroke="currentColor" stroke-width="4" stroke-linecap="square" />
        </g>
      </g>

      <g class="add-icon">
        <circle cx="70" cy="74" r="12" stroke="currentColor" stroke-width="2" fill="white" />
        <line x1="64" y1="74" x2="76" y2="74" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
        <line x1="70" y1="68" x2="70" y2="80" stroke="currentColor" stroke-width="2" stroke-linecap="square" />
      </g>
    </svg>
  ) as SVGElement;
