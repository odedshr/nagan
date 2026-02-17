declare namespace JSX {
  // The return type of our JSX Factory: this could be anything
  // Use Node (or Element) so both HTML and SVG are valid results.
  type Element = Node;

  // The following are custom types, not part of TS's known JSX namespace:
  // Map *tag names* to a "props" object type (not to DOM element types).
  type IntrinsicElementMap = {
    [K in keyof HTMLElementTagNameMap | keyof SVGElementTagNameMap]: {
      [k: string]: unknown;
    };
  };

  // IntrinsicElementMap grabs all the standard HTML+SVG tags in the TS DOM lib.
  interface IntrinsicElements extends IntrinsicElementMap {}

  // The following are custom types, not part of TS's known JSX namespace:
  type IntrinsicElementMap = {
    [K in keyof HTMLElementTagNameMap]: {
      [k: string]: unknown;
    };
  };

  interface Component {
    (properties?: { [key: string]: string }, children?: Node[]): Node;
  }
}
