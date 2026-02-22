/// <reference path="../../jsx.d.ts" />

import jsx from '../../jsx.js';

export default function Modal(form: HTMLFormElement): HTMLDialogElement {
  return (<dialog class="modal-dialog">{form}</dialog>) as HTMLDialogElement;
}
