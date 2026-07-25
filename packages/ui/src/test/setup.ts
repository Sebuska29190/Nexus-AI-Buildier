import '@testing-library/jest-dom';

// jsdom does not implement ResizeObserver. Radix UI primitives
// (Tooltip, Slider, DropdownMenu, Dialog, Sheet, Tabs, Popover)
// pull in `@radix-ui/react-use-size`, which mounts a ResizeObserver
// inside a layout-effect. Without a stub every test that renders
// any Radix component crashes on "ReferenceError: ResizeObserver
// is not defined". Add a no-op polyfill so mounting succeeds;
// individual tests can override `globalThis.ResizeObserver` if
// they need to assert on resize behaviour.
if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}
