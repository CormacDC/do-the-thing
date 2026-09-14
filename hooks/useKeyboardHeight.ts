import { useEffect, useState } from 'react';
import {
  Dimensions,
  Keyboard,
  LayoutAnimation,
  Platform,
  type KeyboardEvent,
} from 'react-native';

function animateToKeyboard(event: KeyboardEvent) {
  if (Platform.OS !== 'ios' || !event.duration) return;
  LayoutAnimation.configureNext({
    duration: event.duration,
    update: { type: LayoutAnimation.Types.keyboard },
  });
}

/**
 * Height of the software keyboard in window coordinates. On iOS this tracks
 * `keyboardWillChangeFrame` so emoji / autocomplete bars are included. Returns
 * 0 while the keyboard is hidden.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const apply = (next: number, event: KeyboardEvent) => {
      animateToKeyboard(event);
      setHeight(next);
    };

    if (Platform.OS === 'ios') {
      const sub = Keyboard.addListener('keyboardWillChangeFrame', (event) => {
        const windowHeight = Dimensions.get('window').height;
        apply(Math.max(0, windowHeight - event.endCoordinates.screenY), event);
      });
      return () => sub.remove();
    }

    const show = Keyboard.addListener('keyboardDidShow', (event) => {
      apply(event.endCoordinates.height, event);
    });
    const hide = Keyboard.addListener('keyboardDidHide', (event) => {
      apply(0, event);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
