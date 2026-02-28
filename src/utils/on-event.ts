import { State } from '../types';

export type OnEventFn = (type: string, detail?: unknown) => void;

export default function getOnEvent(state: State): OnEventFn {
  return (type: string, detail?: unknown) => {
    state.lastEvent = new CustomEvent(type, { detail });
  };
}
