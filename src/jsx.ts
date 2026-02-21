const svgTags = ['svg', 'path', 'rect', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'text', 'g'];

function jsx(tag: JSX.Component, attributes: { [key: string]: string } | null, ...children: Node[]) {
  if (typeof tag === 'function') {
    return tag(attributes ?? {}, children);
  }

  const element: HTMLElement = svgTags.includes(tag)
    ? document.createElementNS('http://www.w3.org/2000/svg', tag)
    : document.createElement(tag);

  // Assign attributes:
  const map = attributes ?? {};
  let prop: keyof typeof map;

  for (prop of Object.keys(map) as string[]) {
    // Extract values:
    prop = prop.toString();
    const value = map[prop] as string;
    const anyReference = element as HTMLElement & { [key: string]: string | number | boolean };

    if (typeof anyReference[prop] === 'undefined' || svgTags.includes(tag)) {
      // As a fallback, attempt to set an attribute:
      element.setAttribute(prop, value);
    } else {
      anyReference[prop] = value;
    }
  }

  // append children
  for (const child of children) {
    try {
      if (typeof child === 'string' || typeof child === 'number') {
        element.appendChild(document.createTextNode(String(child)));
        continue;
      }

      if (Array.isArray(child)) {
        element.append(...child);
        continue;
      }

      element.appendChild(child);
    } catch (e) {
      console.error(`Error appending child ${child} to '${element.tagName}'`, e);
    }
  }
  return element;
}

export default jsx;
