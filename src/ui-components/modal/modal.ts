import Modal from './Modal.tsx';

/**
 * Show a retro-styled modal prompt asking for text input
 * @param message - The message to display to the user
 * @param defaultValue - Optional default value for the input field
 * @returns Promise that resolves with the input text on OK, or null on Cancel
 */
export function openInModal<T, K>(formFactory: (props: K) => HTMLFormElement, props: K): Promise<T> {
  return new Promise(resolve => {
    const form = formFactory({
      ...props,
      onSubmit: (value: T) => {
        // Add closing animation
        modal.classList.add('modal-closing');

        // Wait for animation to complete before removing
        setTimeout(() => {
          document.body.removeChild(modal);
          resolve(value);
        }, 200);
      },
    });

    const modal = Modal(form);
    document.body.appendChild(modal);

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

    // Trigger opening animation
    modal.showModal();
    requestAnimationFrame(() => modal.classList.add('modal-open'));
  });
}
