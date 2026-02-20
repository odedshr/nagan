/// <reference path="../../JSX.d.ts" />

import jsx from '../../jsx.js';

type DropDownChild = Node | string | number;

type DropDownChildren = DropDownChild | DropDownChild[];

export interface DropDownProps {
  wrapperClass: string;
  buttonClass: string;
  buttonId?: string;
  buttonDisabled?: boolean;
  buttonAttributes?: Record<string, unknown>;
  buttonContent: DropDownChildren;
  menuClass: string;
  menuContent: DropDownChildren;
}

export default function DropDown(props: DropDownProps): HTMLDivElement {
  const {
    wrapperClass,
    buttonClass,
    buttonId,
    buttonDisabled,
    buttonAttributes,
    buttonContent,
    menuClass,
    menuContent,
  } = props;

  const onclick = (e: PointerEvent) => {
    e.preventDefault();

    const button = e.currentTarget as HTMLButtonElement;
    if (button.getAttribute('data-show') === 'true') {
      button.removeAttribute('data-show');
      return;
    }

    button.setAttribute('data-show', 'true');

    // Delay binding so the opening click doesn't immediately trigger the close handler.
    setTimeout(() => document.addEventListener('click', () => button.removeAttribute('data-show'), { once: true }), 0);
  };

  return (
    <div class={wrapperClass}>
      <button
        class={buttonClass}
        type="button"
        {...(buttonId ? { id: buttonId } : {})}
        {...(typeof buttonDisabled === 'boolean' ? { disabled: buttonDisabled } : {})}
        {...(buttonAttributes ?? {})}
        onclick={onclick}
      >
        {buttonContent}
      </button>
      <ul class={menuClass}>{menuContent}</ul>
    </div>
  ) as HTMLDivElement;
}
