/// <reference path="../JSX.d.ts" />

import jsx from '../jsx.js';
import { State, StateBase } from '../types.js';

let startX = 0;
let currentX = 0;
let lastRot = 140;

let maxRot = 140;
let speed = 1.5;
let knobElm: HTMLInputElement | null = null;

function onPointerDown(event: PointerEvent) {
    knobElm = event.currentTarget as HTMLInputElement;
    document.addEventListener('pointermove', OnPointerMove);
    document.addEventListener('pointerup', OnPointerUp);

    startX = event.clientX;
}

function OnPointerMove(event: PointerEvent) {
    if (!knobElm) {
        return;
    }

    let delta = startX - event.clientX;
  
    currentX = lastRot + delta * speed;

    if (currentX > maxRot) {
        currentX = maxRot;
    }       
    if (currentX < -maxRot) {
        currentX = -maxRot;
    }

    knobElm.style = `--angle:${currentX}deg`;
    const value = (currentX + maxRot) / (maxRot * 2) * 100;
    knobElm.setAttribute('value', `${value}`);
    knobElm.value = `${value}`;
}

function OnPointerUp() {
  lastRot = currentX;
  
  document.removeEventListener('pointermove', OnPointerMove);
  document.removeEventListener('pointerup', OnPointerUp);
}

function snapToStep (value: number,
  min: number,
  max: number,
  step: number
): number {
  if (step <= 0) {
    throw new Error("step must be > 0");
  }

  const clamped = Math.min(Math.max(value, min), max);
  const steps = Math.floor((clamped - min) / step);

  return min + steps * step;
}

function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) {
    throw new Error("inMax and inMin cannot be equal");
  }

  return ( outMin + ((value - inMin) * (outMax - outMin)) / (inMax - inMin) );
}
export default (label:string, state:State, propName:keyof StateBase, min:number,max:number, step:number) => {
    const initKnobValue = mapRange(state[propName] as number, min, max, -maxRot, maxRot);
    const elm = (<div class="knob-container">
        <input type="number" id={`knob-input-${propName}`} class="knob-input" value={state[propName]} min={min} max={max} step={step} />
        <input type="range" id={`knob-${propName}`} class="knob"
            value={state[propName]} min={min} max={max} step={step}
            onpointerdown={onPointerDown} 
            style={`--angle:${initKnobValue}deg`}></input>
        <label for={`knob-input-${propName}`}>{label}</label>
    </div> as HTMLDivElement);
    const inputElm = elm.querySelector('.knob-input') as HTMLInputElement;
    const knobElm = elm.querySelector('.knob') as HTMLInputElement;

    state.bidi(propName as keyof StateBase, inputElm, 'value', 'input');
    state.addListener(propName as keyof StateBase, (newValue:number) => {
        knobElm.value = `${(newValue - min) / (max - min) * 100}`;
        knobElm.setAttribute('value', knobElm.value);

        const angle = (newValue - min) / (max - min) * (maxRot * 2) - maxRot;
        knobElm.style = `--angle:${angle}deg`;
    });

    knobElm.addEventListener('change', () => { 
        const value = snapToStep(+(knobElm.getAttribute('value') || '0'), min, max, step);
        console.log('KNOB CHANGE', propName, value);
        state[propName] = value;
    });

return elm;
};