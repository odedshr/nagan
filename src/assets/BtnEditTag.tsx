/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';

export default () =>
  (
    <svg
      class="icon edit-tag-icon"
      width="100"
      height="100"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
    >
      <path d="M18 40 L46 18 H80 V52 L52 80 H18 Z" stroke="currentColor" stroke-width="4" stroke-linejoin="miter" />
      <circle cx="33" cy="33" r="5" fill="currentColor" />

      <path d="M58 62 L76 44" stroke="currentColor" stroke-width="6" stroke-linecap="square" />
      <path d="M74 36 L84 46" stroke="currentColor" stroke-width="6" stroke-linecap="square" />
      <path d="M56 64 L52 78 L66 74 Z" fill="currentColor" />
    </svg>
  ) as SVGElement;
