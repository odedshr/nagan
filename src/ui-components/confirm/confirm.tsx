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
            <button class="modal-button modal-cancel" data-value="false">
                {no}
            </button>
            <button class="modal-button modal-ok" data-value="true">
                {yes}
            </button>
          </div>
      </form>
    </dialog>
  ) as HTMLDialogElement;
}
