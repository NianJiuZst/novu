declare module '@ungap/event' {
  const Event: typeof globalThis.Event;
  export default Event;
}

declare module '@ungap/event-target' {
  const EventTarget: typeof globalThis.EventTarget;
  export default EventTarget;
}

declare module 'react-native/Libraries/Utilities/PolyfillFunctions' {
  export function polyfillGlobal<T>(name: string, getValue: () => T): void;
}
