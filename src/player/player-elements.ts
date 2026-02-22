export type PlayerElements = {
  title: HTMLElement;
  artist: HTMLElement;
  cover: HTMLImageElement;
  duration: HTMLElement;
  position: HTMLInputElement;
  progressBar: HTMLInputElement;
  playToggle: HTMLButtonElement;
  nextBtn: HTMLButtonElement;
};

function requireElement<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const el = root.querySelector(selector);
  if (!el) {
    throw new Error(`Player UI missing required element: ${selector}`);
  }
  return el as T;
}

export function getPlayerElements(form: HTMLFormElement): PlayerElements {
  return {
    title: requireElement<HTMLElement>(form, '#title'),
    artist: requireElement<HTMLElement>(form, '#artist'),
    cover: requireElement<HTMLImageElement>(form, '#cover'),
    duration: requireElement<HTMLElement>(form, '#duration'),
    position: requireElement<HTMLInputElement>(form, '#position'),
    progressBar: requireElement<HTMLInputElement>(form, '#progressBar'),
    playToggle: requireElement<HTMLButtonElement>(form, '#playToggle'),
    nextBtn: requireElement<HTMLButtonElement>(form, '#nextBtn'),
  };
}
