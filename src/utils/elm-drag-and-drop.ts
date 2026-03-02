import isTauri from '../utils/is-tauri.js';

type TauriEventPayload = {
  position: {
    x: number;
    y: number;
  };
};

type getDropTargetProps = {
  payload: TauriEventPayload;
  fixedY?: number;
  fixedX?: number;
};
const listeners: Record<string, (() => void)[]> = {};
let dropTarget: HTMLElement | null = null;

function removeOldListeners(name: string) {
  while (listeners[name]?.length > 0) {
    listeners[name].pop()?.();
  }
}

function getDropTarget({ payload, fixedY, fixedX }: getDropTargetProps): HTMLElement | null {
  const elementsAtPoint = document.elementsFromPoint(fixedX || payload.position.x, fixedY || payload.position.y);
  const tableCell = elementsAtPoint.find(el => el.tagName === 'TD' || el.tagName === 'TH') as HTMLElement | undefined;
  if (tableCell) {
    elementsAtPoint.push(tableCell.parentElement as HTMLElement); // Also consider the entire row as a drop target
  }
  return elementsAtPoint.find(el => el.hasAttribute('data-drop')) as HTMLElement | null;
}

const moveItem = <T>(items: T[], fromIndex: number, toIndex: number): T[] => {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex - (fromIndex < toIndex ? 1 : 0), 0, moved);
  return next;
};

type initDragAndDropProps<T> = {
  name: string;
  items: T[];
  onReorder?: (items: T[]) => void;
  onChanged?: (from: number, to: number) => void;
};

export default async function initDragAndDrop<T>({ name, items, onReorder, onChanged }: initDragAndDropProps<T>) {
  let dragIndex: number | undefined = undefined;
  let fixedY: number | undefined = undefined;
  let fixedX: number | undefined = undefined;

  if (isTauri()) {
    const { listen } = await import('@tauri-apps/api/event');
    removeOldListeners(name);
    if (!listeners[name]) {
      listeners[name] = [];
    }

    listeners[name].push(
      await listen<TauriEventPayload>('tauri://drag-drop', event => {
        const elm = getDropTarget({ payload: event.payload, fixedY, fixedX });
        if (elm && dragIndex !== undefined) {
          const dropIndex = Array.from(elm.parentElement!.children).indexOf(elm);
          if (dropIndex !== -1) {
            onReorder?.(moveItem(items, dragIndex, dropIndex));
            onChanged?.(dragIndex, dropIndex);
          }
        }
        if (dropTarget) {
          dropTarget.classList.remove('drag-over');
          dropTarget = null;
        }
      })
    );

    listeners[name].push(
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

    listeners[name].push(
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
