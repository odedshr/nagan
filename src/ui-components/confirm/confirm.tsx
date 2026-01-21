/// <reference path="../../JSX.d.ts" />

import jsx from '../../jsx.js';

interface PromptProps {
  message: string;
  yes?: string;
  no?: string;
  onSubmit: (value: boolean) => void;
}

export default function Prompt(props: PromptProps): HTMLDialogElement {
  const { message, yes = 'Yes', no = 'No', onSubmit } = props;

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();
    const value = (e.submitter as HTMLButtonElement).dataset.value === 'true';
    onSubmit(value);
  };

  return (
    <dialog class="modal-dialog">
      <form method="dialog" onsubmit={handleSubmit}>
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
    </dialog>
  ) as HTMLDialogElement;
}
