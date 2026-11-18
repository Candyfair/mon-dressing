import { fireEvent, render, screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { RadialMenuContext, type RadialMenuControls } from './radialMenuContext';
import { RadialMenuTarget } from './RadialMenuTarget';

jest.mock('react-native-reanimated', () => jest.requireActual('../test/animationMocks').reanimated);
jest.mock('react-native-worklets', () => jest.requireActual('../test/animationMocks').worklets);
jest.mock(
  'react-native-gesture-handler',
  () => jest.requireActual('../test/animationMocks').gestureHandler,
);

const controls: RadialMenuControls = {
  bounds: { left: 0, top: 0, right: 375, bottom: 812 },
  hovered: { get: () => -1, set: () => undefined } as unknown as RadialMenuControls['hovered'],
  finger: {
    get: () => ({ x: 0, y: 0 }),
    set: () => undefined,
  } as unknown as RadialMenuControls['finger'],
  show: () => undefined,
  hide: () => undefined,
};

describe('RadialMenuTarget', () => {
  it('offers the menu actions to screen readers', async () => {
    const onSelect = jest.fn();
    await render(
      <RadialMenuContext.Provider value={controls}>
        <RadialMenuTarget
          actions={[{ id: 'dirty', label: 'Au sale', icon: 'washingMachine' }]}
          onSelect={onSelect}
          accessibilityLabel="T-shirt rayé"
        >
          <View />
        </RadialMenuTarget>
      </RadialMenuContext.Provider>,
    );

    const target = screen.getByLabelText('T-shirt rayé');
    expect(target.props.accessibilityActions).toEqual([{ name: 'dirty', label: 'Au sale' }]);
    await fireEvent(target, 'accessibilityAction', { nativeEvent: { actionName: 'dirty' } });
    expect(onSelect).toHaveBeenCalledWith('dirty');
  });
});
