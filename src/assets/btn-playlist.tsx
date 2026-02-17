/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';

export default () =>
  (
    <svg class="icon playlist-icon" width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <rect x="15" y="20" width="70" height="8" fill="none" stroke="currentColor" stroke-width="4" />
      <rect x="15" y="40" width="70" height="8" fill="none" stroke="currentColor" stroke-width="4" />
      <rect x="15" y="60" width="70" height="8" fill="none" stroke="currentColor" stroke-width="4" />
      <polygon points="15,78 15,92 30,85" fill="currentColor" />
    </svg>
  ) as SVGElement;
