import { type Href, router, Tabs, usePathname } from 'expo-router';

import { useDayWeather } from '../../features/today/useDayWeather';
import { GlassStage } from '../../ui/GlassStage';
import { motion } from '../../ui/motion';
import { TabBar, type TabName } from '../../ui/TabBar';

const HREF = {
  today: '/',
  laundry: '/laundry',
  wardrobe: '/wardrobe',
} as const satisfies Record<TabName, Href>;

function tabOf(pathname: string): TabName {
  if (pathname.startsWith(HREF.laundry)) return 'laundry';
  if (pathname.startsWith(HREF.wardrobe)) return 'wardrobe';
  return 'today';
}

// The menu is drawn outside the navigator, over the GlassStage target, so
// that it can blur the screens on Android.
const noTabBar = () => null;

export default function TabsLayout() {
  const pathname = usePathname();
  // The menu takes the day's weather tint in the dark theme.
  const { weather } = useDayWeather();
  return (
    <GlassStage
      behind={
        <Tabs
          tabBar={noTabBar}
          screenOptions={{
            headerShown: false,
            animation: 'fade',
            transitionSpec: {
              animation: 'timing',
              config: { duration: motion.tabs.screenFade },
            },
          }}
        >
          <Tabs.Screen name="index" />
          <Tabs.Screen name="laundry" />
          <Tabs.Screen name="wardrobe" />
        </Tabs>
      }
    >
      <TabBar
        active={tabOf(pathname)}
        onSelect={(tab) => router.navigate(HREF[tab])}
        ambience={weather.ambience}
      />
    </GlassStage>
  );
}
