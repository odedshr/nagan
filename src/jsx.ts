function jsx(tag: JSX.Component, 
    attributes: { [key: string]: any } | null, 
    ...children: Node[]) {

    if (typeof tag === 'function') {
        return tag(attributes ?? {}, children);
    }

    const element: HTMLElement = document.createElement(tag);

    // Assign attributes:
    let map = (attributes ?? {});
    let prop: keyof typeof map;

    for (prop of (Object.keys(map) as any)) {
        // Extract values:
        prop = prop.toString();
        const value = map[prop] as any;
        const anyReference = element as any;
    
        if (typeof anyReference[prop] === 'undefined') {
            // As a fallback, attempt to set an attribute:
            element.setAttribute(prop, value);
        } else {
            anyReference[prop] = value;
        }
    }

    // append children
    for (let child of children) {
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