import { openInModal } from '../modal/modal.ts';
import Prompt from './prompt.tsx';

/**
 * Show a retro-styled modal prompt asking for text input
 * @param message - The message to display to the user
 * @param defaultValue - Optional default value for the input field
 * @returns Promise that resolves with the input text on OK, or null on Cancel
 */
export default function prompt(message: string, defaultValue?: string): Promise<string | null> {
  return openInModal(Prompt, { message, defaultValue, onSubmit: () => {} });
}
