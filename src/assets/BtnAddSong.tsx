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
      <circle cx="35" cy="72" r="8" fill="currentColor" />
      <line x1="43" y1="30" x2="43" y2="72" stroke="currentColor" stroke-width="4" stroke-linecap="square" />
      <path d="M43 32 C55 38 63 36 70 28" stroke="currentColor" stroke-width="4" stroke-linecap="square" fill="none" />

      <line x1="72" y1="35" x2="92" y2="35" stroke="currentColor" stroke-width="4" stroke-linecap="square" />
      <line x1="82" y1="25" x2="82" y2="45" stroke="currentColor" stroke-width="4" stroke-linecap="square" />
    </svg>
  ) as SVGElement;
