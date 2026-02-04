function jsx(tag: JSX.Component, attributes: { [key: string]: string } | null, ...children: Node[]) {
  if (typeof tag === 'function') {
    return tag(attributes ?? {}, children);
  }

  const element: HTMLElement = document.createElement(tag);

  // Assign attributes:
  const map = attributes ?? {};
  let prop: keyof typeof map;

  for (prop of Object.keys(map) as string[]) {
    // Extract values:
    prop = prop.toString();
    const value = map[prop] as string;
    const anyReference = element as HTMLElement & { [key: string]: string | number | boolean };

    if (typeof anyReference[prop] === 'undefined') {
      // As a fallback, attempt to set an attribute:
      element.setAttribute(prop, value);
    } else {
      anyReference[prop] = value;
    }
  }

  // append children
  for (const child of children) {
    if (typeof child === 'string' || typeof child === 'number') {
      element.innerText += child;
      continue;
    }

    if (Array.isArray(child)) {
      element.append(...child);
      continue;
    }

    element.appendChild(child);
  }
  return element;
}

export default jsx;
