import isTauri from '../utils/is-tauri.js';
import { listen } from '@tauri-apps/api/event';

type TauriEventPayload = {
  position: {
    x: number;
    y: number;
  };
};

type getDropTargetParams = {
  payload: TauriEventPayload;
  fixedY?: number;
  fixedX?: number;
};
const listeners: (() => void)[] = [];
let dropTarget: HTMLElement | null = null;

function removeOldListeners() {
  while (listeners.length > 0) {
    listeners.pop()?.();
  }
}

function getDropTarget({ payload, fixedY, fixedX }: getDropTargetParams): HTMLElement | null {
  const elementsAtPoint = document.elementsFromPoint(fixedX || payload.position.x, fixedY || payload.position.y);
  return (elementsAtPoint.find(el => el.hasAttribute('data-drop')) as HTMLElement) || null;
}

const moveItem = <T>(items: T[], fromIndex: number, toIndex: number): T[] => {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex - (fromIndex < toIndex ? 1 : 0), 0, moved);
  return next;
};

export default async function initDragAndDrop(items: string[], onChanged: (columns: string[]) => void) {
  let dragIndex: number | undefined = undefined;
  let fixedY: number | undefined = undefined;
  let fixedX: number | undefined = undefined;

  if (isTauri()) {
    removeOldListeners();

    listeners.push(
      await listen<TauriEventPayload>('tauri://drag-drop', event => {
        const elm = getDropTarget({ payload: event.payload, fixedY, fixedX });
        if (elm && dragIndex !== undefined) {
          const dropIndex = Array.from(elm.parentElement!.children).indexOf(elm);
          if (dropIndex !== -1) {
            onChanged(moveItem(items, dragIndex, dropIndex));
          }
        }
      })
    );

    listeners.push(
      await listen<TauriEventPayload>('tauri://drag-over', event => {
        const elm = getDropTarget({ payload: event.payload, fixedY, fixedX });
        if (elm && dropTarget !== elm) {
          elm.classList.add('drag-over');
          if (dropTarget && dropTarget !== elm) {
            dropTarget.classList.remove('drag-over');
          }
          dropTarget = elm as HTMLElement;
        }
      })
    );

    listeners.push(
      await listen<TauriEventPayload>('tauri://drag-leave', () => {
        if (dropTarget) {
          dropTarget.classList.remove('drag-over');
          dropTarget = null;
        }
      })
    );
  }

  return {
    setDragIndex: (index?: number) => {
      dragIndex = index;
    },
    fixX: (x?: number) => {
      fixedX = x;
    },
    fixY: (y?: number) => {
      fixedY = y;
    },
  };
}
