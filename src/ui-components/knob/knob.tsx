/// <reference path="../../JSX.d.ts" />

import jsx from '../../jsx.js';
import { State, StateBase } from '../../types.js';

let startX = 0;
let currentX = 0;
let lastRot = 140;

const maxRot = 140;
const speed = 1.5;

function snapToStep(value: number, min: number, max: number, step: number): number {
  if (step <= 0) {
    throw new Error('step must be > 0');
  }

  const clamped = Math.min(Math.max(value, min), max);
  const steps = Math.floor((clamped - min) / step);

  return min + steps * step;
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) {
    throw new Error('inMax and inMin cannot be equal');
  }

  return outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin);
}
export default (label: string, state: State, propName: keyof StateBase, min: number, max: number, step: number) => {
  const initKnobValue = mapRange(state[propName] as number, min, max, -maxRot, maxRot);

  const onPointerDown = (event: PointerEvent) => {
    startX = event.clientX;
    document.addEventListener('pointermove', OnPointerMove);
    document.addEventListener('pointerup', OnPointerUp);
  };

  const elm = (
    <div class="knob-container" style={`--angle:${initKnobValue}deg`}>
      <input
        type="number"
        id={`knob-input-${propName}`}
        class="knob-input"
        value={state[propName]}
        min={min}
        max={max}
        step={step}
      />
      <input
        type="range"
        id={`knob-${propName}`}
        class="knob"
        value={state[propName]}
        min={min}
        max={max}
        step={step}
        onpointerdown={onPointerDown}
      ></input>
      <div class="knob-indicator" onpointerdown={onPointerDown}></div>
      <label for={`knob-input-${propName}`}>{label}</label>
    </div>
  ) as HTMLDivElement;
  const inputElm = elm.querySelector('.knob-input') as HTMLInputElement;
  const knobElm = elm.querySelector('.knob') as HTMLInputElement;

  const OnPointerMove = (event: PointerEvent) => {
    const delta = startX - event.clientX;

    currentX = Math.min(Math.max(lastRot + delta * speed, -maxRot), maxRot);

    elm.setAttribute('style', `--angle:${currentX}deg`);

    const value = snapToStep(((currentX + maxRot) / (maxRot * 2)) * 100, min, max, step);
    knobElm.setAttribute('value', `${value}`);
    knobElm.value = `${value}`;

    (state[propName] as number) = value;
  };

  const OnPointerUp = () => {
    elm.blur();
    lastRot = currentX;

    document.removeEventListener('pointermove', OnPointerMove);
    document.removeEventListener('pointerup', OnPointerUp);
  };

  state.bidi(propName as keyof StateBase, inputElm, 'value', 'input');
  state.addListener(propName as keyof StateBase, newValue => {
    const numericValue = Number(newValue);
    knobElm.value = `${((numericValue - min) / (max - min)) * 100}`;
    knobElm.setAttribute('value', knobElm.value);

    // const angle = (numericValue - min) / (max - min) * (maxRot * 2) - maxRot;
    // elm.style = `--angle:${angle}deg`;
  });

  knobElm.addEventListener('change', () => {
    const value = snapToStep(+(knobElm.getAttribute('value') || '0'), min, max, step);
    (state[propName] as number) = value;
  });

  return elm;
};
