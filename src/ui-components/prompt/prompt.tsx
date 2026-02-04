/// <reference path="../../JSX.d.ts" />

import jsx from '../../jsx.js';

interface PromptProps {
  message: string;
  defaultValue?: string;
  onSubmit: (value: string | null) => void;
}

export default function Prompt(props: PromptProps): HTMLDialogElement {
  const { message, defaultValue = '', onSubmit } = props;

  const handleSubmit = (e: Event) => {
    e.preventDefault();
    if (form.checkValidity()) {
      const input = form.querySelector('.modal-input') as HTMLInputElement;
      onSubmit(input.value);
    }
  };

  const handleCancel = () => onSubmit(null);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  const modal = (
    <dialog class="modal-dialog">
      <form method="dialog" onsubmit={handleSubmit}>
        <div class="modal-message">{message}</div>
        <input type="text" class="modal-input" value={defaultValue} onkeydown={handleKeyDown} required />
        <div class="modal-buttons">
          <button class="std-button" onclick={handleCancel}>
            Cancel
          </button>
          <button class="std-button primary-btn">OK</button>
        </div>
      </form>
    </dialog>
  ) as HTMLDialogElement;

  // Prevent clicks on backdrop from closing (only buttons should close)
  // const dialog = modal.querySelector('.modal-dialog') as HTMLDialogElement;
  // modal.addEventListener('click', (e) => e.stopPropagation());

  const form = modal.querySelector('form') as HTMLFormElement;

  // Click on backdrop cancels
  // modal.addEventListener('click', handleCancel);

  // Trap focus within modal
  modal.addEventListener('keydown', e => {
    if (e.key === 'Tab') {
      const focusableElements = modal.querySelectorAll('input, button') as NodeListOf<HTMLElement>;
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  });

  return modal;
}
