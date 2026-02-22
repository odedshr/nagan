export default (oldComponent: HTMLElement, newComponent: HTMLElement) => {
  oldComponent.replaceWith(newComponent);
  return newComponent;
};
