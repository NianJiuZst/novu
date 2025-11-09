import Event from '@ungap/event';
import EventTarget from '@ungap/event-target';

import { polyfillGlobal } from 'react-native/Libraries/Utilities/PolyfillFunctions';

// these polyfills are needed for partysocket to work on react native
polyfillGlobal('EventTarget', () => EventTarget);
polyfillGlobal('Event', () => Event);

export * from '@novu/react/hooks';
