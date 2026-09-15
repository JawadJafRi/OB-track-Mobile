import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * True while the on-screen keyboard is open.
 *
 * Used to reclaim vertical space while typing: with `adjustResize` in the
 * manifest, the window shrinks to whatever the keyboard leaves behind, and a
 * screen that keeps rendering its header, footer button and tab bar squeezes
 * the actual input into a sliver. Hiding the chrome that is not needed
 * mid-typing gives the form the room instead.
 *
 * iOS gets the `Will` events so the change animates in step with the keyboard;
 * Android only fires the `Did` pair reliably, so it uses those.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}

export default useKeyboardVisible;
