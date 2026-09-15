/**
 * Jest environment setup.
 *
 * Every module mocked here is a NATIVE module: its JavaScript half calls
 * `TurboModuleRegistry.getEnforcing(...)`, which throws outright when there is
 * no native binary behind it. Node has none, so importing any screen that
 * touches the keychain or GPS would fail at import time and take the whole
 * suite with it — which is exactly what `npm test` did before this file
 * existed.
 *
 * The mocks are deliberately behavioural rather than empty stubs: the keychain
 * one stores what it is given so a test can assert that a session was saved and
 * read back, and geolocation resolves a real fix so the start/end flow can be
 * driven without a device. A mock that only returns `undefined` makes a test
 * pass without proving anything.
 */

/* eslint-env jest */

// --- Splash screen ---------------------------------------------------------
jest.mock('react-native-bootsplash', () => ({
  __esModule: true,
  default: {
    hide: jest.fn().mockResolvedValue(undefined),
    show: jest.fn().mockResolvedValue(undefined),
    isVisible: jest.fn().mockResolvedValue(false),
    useHideAnimation: jest.fn(),
  },
}));

// --- Secure storage --------------------------------------------------------
// Backed by a real object so a test can assert the round trip, and reset
// between tests by the `clearKeychain` helper below.
const mockKeychainStore = new Map();

jest.mock('react-native-keychain', () => ({
  __esModule: true,
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WhenUnlockedThisDeviceOnly' },
  ACCESS_CONTROL: {},
  SECURITY_LEVEL: {},
  STORAGE_TYPE: {},
  setGenericPassword: jest.fn(async (username, password, options = {}) => {
    mockKeychainStore.set(options.service ?? 'default', { username, password });
    return { service: options.service ?? 'default', storage: 'mock' };
  }),
  getGenericPassword: jest.fn(async (options = {}) => {
    const entry = mockKeychainStore.get(options.service ?? 'default');
    return entry ? { ...entry, service: options.service ?? 'default' } : false;
  }),
  resetGenericPassword: jest.fn(async (options = {}) => {
    mockKeychainStore.delete(options.service ?? 'default');
    return true;
  }),
}));

// --- GPS -------------------------------------------------------------------
// One fixed point in Karachi. Tests that care about distance should drive
// `watchPosition`'s callback themselves rather than relying on this.
const MOCK_FIX = {
  coords: {
    latitude: 24.8607,
    longitude: 67.0011,
    accuracy: 8,
    altitude: 10,
    heading: 0,
    speed: 0,
  },
  timestamp: 1_760_000_000_000,
};

jest.mock('@react-native-community/geolocation', () => ({
  __esModule: true,
  default: {
    setRNConfiguration: jest.fn(),
    requestAuthorization: jest.fn(),
    getCurrentPosition: jest.fn((onSuccess) => onSuccess(MOCK_FIX)),
    watchPosition: jest.fn((onSuccess) => {
      onSuccess(MOCK_FIX);
      return 1;
    }),
    clearWatch: jest.fn(),
    stopObserving: jest.fn(),
  },
}));

// --- Safe area -------------------------------------------------------------
// This one ships its own mock, which renders the providers with fixed insets.
// It exports via `export default`, so the namespace object has to be unwrapped
// — returning it whole makes every named import (SafeAreaProvider included)
// resolve to undefined, which React reports only as "Element type is invalid".
jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// --- Test helpers ----------------------------------------------------------
global.__mockKeychainStore = mockKeychainStore;
global.__mockLocationFix = MOCK_FIX;

afterEach(() => {
  mockKeychainStore.clear();
  jest.clearAllMocks();
});
