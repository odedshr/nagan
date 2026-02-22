/// <reference path="../../jsx.d.ts" />

import jsx from '../../jsx.js';

interface ConfirmProps {
  message: string;
  yes?: string;
  no?: string;
  onSubmit: (value: boolean) => void;
}

export default function Confirm(props: ConfirmProps): HTMLFormElement {
  const { message, yes = 'Yes', no = 'No', onSubmit } = props;

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const value = (e.submitter as HTMLButtonElement).dataset.value === 'true';
    onSubmit(value);
  };

  return (
    <form method="dialog" onsubmit={handleSubmit} class="modal-form confirm-form">
      <div class="modal-message">{message}</div>
      <div class="modal-buttons">
        <button class="std-button" data-value="false">
          {no}
        </button>
        <button class="std-button primary-btn" data-value="true">
          {yes}
        </button>
      </div>
    </form>
  ) as HTMLFormElement;
}
