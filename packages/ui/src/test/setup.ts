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
  // Mirror the real constructor signature (callback is accepted
  // but never invoked) so any consumer that does
  // `new ResizeObserver(cb)` works the same as on the jsdom 22+
  // polyfill. jsdom 22+ already provides its own no-op polyfill,
  // so this branch only runs on older jsdom.
  globalThis.ResizeObserver = class {
    constructor(_callback: ResizeObserverCallback) {}
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  } as unknown as typeof ResizeObserver;
}
