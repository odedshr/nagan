/// <reference path="../jsx.d.ts" />

import jsx from '../jsx.js';

export default () =>
  (
    <svg
      class="icon db-icon"
      width="100px"
      height="100px"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <filter id="pixelate" x="0" y="0">
        <feFlood x="2" y="2" height="1" width="1" />
        <feComposite width="10" height="10" />
        <feTile result="a" />
        <feComposite in="SourceGraphic" in2="a" operator="in" />
        <feMorphology operator="dilate" radius="2" />
      </filter>
      <ellipse cx="12" cy="7" rx="7" ry="3" stroke="currentColor" />
      <path
        d="M5 13C5 13 5 15.3431 5 17C5 18.6569 8.13401 20 12 20C15.866 20 19 18.6569 19 17C19 16.173 19 13 19 13"
        stroke="currentColor"
        stroke-linecap="square"
      />
      <path
        d="M5 7C5 7 5 10.3431 5 12C5 13.6569 8.13401 15 12 15C15.866 15 19 13.6569 19 12C19 11.173 19 7 19 7"
        stroke="currentColor"
      />
    </svg>
  ) as SVGElement;
