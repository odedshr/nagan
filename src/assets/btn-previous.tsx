/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';

export default () =>
  (
    <svg class="icon" width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="20" width="10" height="60" rx="5" fill="currentColor"></rect>
      <path
        fill="currentColor"
        d="
    M72 20
    Q70 18 68 20
    L38 48
    Q36 50 38 52
    L68 80
    Q70 82 72 80
    Q74 78 74 75
    V25
    Q74 22 72 20
    Z"
      ></path>
    </svg>
  ) as SVGElement;
