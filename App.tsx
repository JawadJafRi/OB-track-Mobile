import React, { useEffect } from 'react';
import BootSplash from 'react-native-bootsplash';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { DialogProvider } from './src/components/ui/DialogProvider';
import RootNavigator from './src/navigation/RootNavigator';

function App(): React.JSX.Element {
  useEffect(() => {
    BootSplash.hide({ fade: true });
  }, []);

  return (
    <SafeAreaProvider>
      {/*
        DialogProvider sits above the navigator so its modal renders over every
        screen, and inside AuthProvider so a dialog can be raised from anywhere
        that has the session.
      */}
      <AuthProvider>
        <DialogProvider>
          <RootNavigator />
        </DialogProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
