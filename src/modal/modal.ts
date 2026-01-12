import Modal from './modal.tsx';

/**
 * Show a retro-styled modal prompt asking for text input
 * @param message - The message to display to the user
 * @param defaultValue - Optional default value for the input field
 * @returns Promise that resolves with the input text on OK, or null on Cancel
 */
export function showPrompt(
  message: string,
  defaultValue?: string
): Promise<string | null> {
    return new Promise((resolve) => {
      const modal = Modal({
          message,
          defaultValue,
          onSubmit: (value) => {
              // Add closing animation
              modal.classList.add('modal-closing');
              
              // Wait for animation to complete before removing
              setTimeout(() => {
                  document.body.removeChild(modal);
                  resolve(value);
                }, 200);
            },
        });
        
    document.body.appendChild(modal);
    (modal.querySelector('.modal-input')! as HTMLInputElement).focus();

    // Trigger opening animation
    modal.querySelector('dialog')?.showModal();
    requestAnimationFrame(() => modal.classList.add('modal-open'));
  });
}
