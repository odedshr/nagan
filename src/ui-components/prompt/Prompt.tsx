/// <reference path="../../jsx.d.ts" />

import jsx from '../../jsx.js';
interface PromptProps {
  message: string;
  defaultValue?: string;
  onSubmit: (value: string | null) => void;
}

export default function Prompt(props: PromptProps): HTMLFormElement {
  const { message, defaultValue = '', onSubmit } = props;

  const handleSubmit = (e: Event) => {
    const form = e.target as HTMLFormElement;
    e.preventDefault();
    if (form.checkValidity()) {
      const input = form.querySelector('#prompt-input') as HTMLInputElement;
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

  return (
    <form method="dialog" onsubmit={handleSubmit} class="modal-form prompt-form">
      <label class="modal-message" for="prompt-input">
        {message}
      </label>
      <input
        type="text"
        id="prompt-input"
        class="prompt-input modal-input"
        value={defaultValue}
        onkeydown={handleKeyDown}
        required
      />
      <div class="modal-buttons">
        <button class="std-button" onclick={handleCancel}>
          Cancel
        </button>
        <button class="std-button primary-btn">OK</button>
      </div>
    </form>
  ) as HTMLFormElement;
}
