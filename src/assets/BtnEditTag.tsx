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
      {/* Tag */}
      <path
        d="M35 40 H75 V70 H35 L20 55 Z"
        stroke="currentColor"
        stroke-width="4"
        stroke-linecap="square"
        stroke-linejoin="miter"
      />
      {/* Tag hole */}
      <circle cx="30" cy="55" r="2" stroke="currentColor" stroke-width="2" fill="none" />

      {/* Writing mark */}
      <path d="M38 60 C44 56 50 64 56 60" stroke="currentColor" stroke-width="2" stroke-linecap="square" fill="none" />

      {/* Pencil */}
      <g
        style="transform-origin: 75.0775px 51.638px;"
        transform="matrix(1.19775105, 0.32093605, -0.32093605, 1.19775105, -23.01014199, -15.97026854)"
      >
        <path
          style="stroke: rgb(0, 0, 0); fill: rgb(241, 255, 84); stroke-width: 2;"
          d="M 80 40 L 70 40 L 70.155 65.239 L 75.155 70.289 L 80.155 65.239 L 80 40 Z"
        />
        <path
          style="stroke: rgb(0, 0, 0); fill: rgb(254, 203, 251); stroke-width: 2;"
          d="M 79.963 42.972 L 80 38 C 80.155 31.316 70.155 31.316 70 38 L 70 43 C 71.191 44.515 77.961 45.45 79.963 42.972 Z"
        >
          <title>rubber</title>
        </path>
        <path
          style="fill: rgb(201, 201, 201);stroke: rgb(0, 0, 0);"
          d="M 80 40 L 80 45 C 80 47.756 70 47.756 70 45 L 70 40 C 70 41.436 80 42.416 80 40 Z"
        >
          <title>silver</title>
        </path>
      </g>
    </svg>
  ) as SVGElement;
