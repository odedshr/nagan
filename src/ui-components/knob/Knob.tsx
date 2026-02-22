/// <reference path="../../jsx.d.ts" />

import jsx from '../../jsx.js';

const maxRot = 140;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeDeg180(deg: number): number {
  const normalized = ((((deg + 180) % 360) + 360) % 360) - 180;
  return normalized;
}

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

export default (
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
  init: (elm: HTMLInputElement) => void
) => {
  const elmId = `knob-input-${label.toLowerCase().replace(/\s+/g, '')}`;
  const initKnobValue = mapRange(value, min, max, -maxRot, maxRot);

  let currentRot = initKnobValue;
  let lastRot = initKnobValue;
  let startRot = initKnobValue;
  let startAngle = 0;
  let centerX = 0;
  let centerY = 0;

  const onPointerDown = (event: PointerEvent) => {
    event.preventDefault();
    document.body.classList.add('no-text-select');
    document.body.classList.add('knob-grabbing');

    const knobElm = elm.querySelector('.knob') as HTMLElement | null;
    if (knobElm) {
      const rect = knobElm.getBoundingClientRect();
      centerX = rect.left + rect.width / 2;
      centerY = rect.top + rect.height / 2;
    } else {
      centerX = event.clientX;
      centerY = event.clientY;
    }

    // Angle is based on direction from knob center (not distance).
    // We treat 0deg as "up" (12 o'clock) and positive degrees clockwise.
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    startAngle = normalizeDeg180((Math.atan2(dy, dx) * 180) / Math.PI + 90);
    startRot = lastRot;

    document.addEventListener('pointermove', OnPointerMove);
    document.addEventListener('pointerup', OnPointerUp);
    document.addEventListener('pointercancel', OnPointerUp);
  };

  const elm = (
    <div class="knob-container" style={`--angle:${initKnobValue}deg`}>
      <input type="number" id={elmId} class="knob-input" value={value} min={min} max={max} step={step} />
      <div class="knob">
        <div class="knob-indicator" onpointerdown={onPointerDown}></div>
      </div>
      <label for={elmId}>{label}</label>
    </div>
  ) as HTMLDivElement;
  const inputElm = elm.querySelector('.knob-input') as HTMLInputElement;

  const OnPointerMove = (event: PointerEvent) => {
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const angleNow = normalizeDeg180((Math.atan2(dy, dx) * 180) / Math.PI + 90);
    const deltaAngle = normalizeDeg180(angleNow - startAngle);

    currentRot = clamp(startRot + deltaAngle, -maxRot, maxRot);

    elm.setAttribute('style', `--angle:${currentRot}deg`);

    const valueBetween0And1 = (currentRot + maxRot) / (maxRot * 2);
    const valueBetweenMinAndMax = valueBetween0And1 * (max - min) + min;
    const snappedValue = snapToStep(valueBetweenMinAndMax, min, max, step);

    inputElm.value = snappedValue.toString();
  };

  const OnPointerUp = () => {
    elm.blur();
    lastRot = currentRot;

    document.removeEventListener('pointermove', OnPointerMove);
    document.removeEventListener('pointerup', OnPointerUp);
    document.removeEventListener('pointercancel', OnPointerUp);
    document.body.classList.remove('no-text-select');
    document.body.classList.remove('knob-grabbing');
  };

  init(inputElm);

  return elm;
};
