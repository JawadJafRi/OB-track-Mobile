module.exports = {
  preset: '@react-native/jest-preset',
  // Runs after the preset has set up the RN environment, so the native-module
  // mocks replace real TurboModule lookups before any screen is imported.
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // The navigation and RN ecosystem ship untranspiled ESM; without this Jest
  // hands raw `import` statements to Node and fails on the first one.
  transformIgnorePatterns: [
    'node_modules/(?!(?:@react-native|react-native|@react-navigation|react-native-.*)/)',
  ],
};
