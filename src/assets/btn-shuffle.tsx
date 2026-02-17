/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';

export default () =>
  (
    <svg
      class="icon"
      width="100"
      height="100"
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      stroke="currentColor"
      stroke-width="8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M20 30 C45 30 55 70 80 70" />
      <polyline points="70,60 80,70 70,80" />

      <path d="M20 70 C45 70 55 30 80 30" />
      <polyline points="70,20 80,30 70,40" />
    </svg>
  ) as SVGElement;
