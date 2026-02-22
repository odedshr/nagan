import { openInModal } from '../modal/modal.ts';
import Confirm from './Confirm.tsx';

/**
 * Show a retro-styled modal confirm dialog
 * @param message - The message to display to the user
 * @param defaultValue - Optional default value for the input field
 * @returns Promise that resolves with the input text on OK, or null on Cancel
 */
export default function confirm(message: string, yes: string = 'Yes', no: string = 'No'): Promise<boolean> {
  return openInModal(Confirm, { message, yes, no, onSubmit: () => {} });
}
