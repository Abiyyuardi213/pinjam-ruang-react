import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, useColorScheme } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function BottomBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  
  // Shadcn style floating nav colors
  const navBg = isDark ? '#18181A' : '#FFFFFF';
  const navBorder = isDark ? '#27272A' : '#E2E8F0';
  const activeColor = '#2563EB'; // Shadcn Blue
  const inactiveColor = isDark ? '#A1A1AA' : '#64748B'; // Muted text

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: navBg,
        borderColor: navBorder,
        shadowColor: isDark ? '#000' : '#E2E8F0',
        bottom: Platform.OS === 'ios' ? insets.bottom || 24 : 24,
      }
    ]}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        
        // Skip tabs without icons
        const hiddenRoutes = ['rooms', 'mapping', 'room-detail'];
        if (options.href === null || hiddenRoutes.includes(route.name)) {
            return null;
        }

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        let iconName = 'home-outline';
        if (route.name === 'index') iconName = isFocused ? 'home' : 'home-outline';
        if (route.name === 'scan') iconName = isFocused ? 'qr-code' : 'qr-code-outline';
        if (route.name === 'monitor') iconName = isFocused ? 'grid' : 'grid-outline';
        if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
          >
            <View style={styles.iconContainer}>
              <Ionicons 
                name={iconName as any} 
                size={24}  // Slightly increased to 24 for better visibility without background
                color={isFocused ? activeColor : inactiveColor} 
              />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 24,
    right: 24,
    borderRadius: 32, // Pill shape
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
});
