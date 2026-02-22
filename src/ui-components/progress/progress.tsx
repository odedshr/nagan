/// <reference path="../../JSX.d.ts" />

import jsx from '../../jsx.js';
import Modal from '../modal/modal.tsx';

export interface ProgressModalHandle {
  update: (current: number, total: number, message?: string) => void;
  close: () => void;
  isCancelled: () => boolean;
}

export default function openProgressModal(title: string, initialTotal: number): ProgressModalHandle {
  let cancelled = false;

  const progressText = (<div class="modal-message" />) as HTMLDivElement;
  const progressMessage = (<div class="modal-message" />) as HTMLDivElement;

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;

    modal.classList.add('modal-closing');
    setTimeout(() => {
      if (modal.parentNode) {
        document.body.removeChild(modal);
      }
    }, 200);
  };

  const onCancelClick = (e: MouseEvent) => {
    e.preventDefault();
    cancelled = true;
    close();
  };

  const form = (
    <form method="dialog" class="modal-form">
      <h2>{title}</h2>
      {progressText}
      {progressMessage}
      <div class="modal-buttons">
        <button type="button" class="std-button" onclick={onCancelClick}>
          Cancel
        </button>
      </div>
    </form>
  ) as HTMLFormElement;

  const modal = Modal(form);
  document.body.appendChild(modal);

  modal.showModal();
  requestAnimationFrame(() => modal.classList.add('modal-open'));

  const update = (current: number, total: number = initialTotal, message: string = '') => {
    progressText.textContent = `${Math.min(current, total)}/${total}`;
    progressMessage.textContent = message;
  };

  update(0, initialTotal, '');

  return {
    update,
    close,
    isCancelled: () => cancelled,
  };
}
