import { Ionicons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function BottomBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  // Force Dark Mode untuk Bottom Bar
  const isDark = true;

  // Shadcn style floating nav colors (Dark)
  const navBg = "#0F172A"; // Slate 900
  const navBorder = "#1E293B"; // Slate 800
  const activeColor = "#3B82F6"; // Vibrant Blue
  const inactiveColor = "#94A3B8"; // Muted Slate-400

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: navBg,
          borderColor: navBorder,
          shadowColor: "#000",
          shadowOpacity: 0.3,
          shadowOffset: { width: 0, height: 8 },
          shadowRadius: 16,
          bottom: Platform.OS === "ios" ? insets.bottom || 24 : 24,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        const isFocused = state.index === index;

        const iconMapping: Record<
          string,
          { active: string; inactive: string }
        > = {
          index: { active: "home", inactive: "home-outline" },
          scan: { active: "qr-code", inactive: "qr-code-outline" },
          monitor: { active: "grid", inactive: "grid-outline" },
          profile: { active: "person", inactive: "person-outline" },
          jadwal: { active: "calendar", inactive: "calendar-outline" },
          history: { active: "time", inactive: "time-outline" },
        };

        if (!iconMapping[route.name]) {
          return null;
        }

        const iconName = isFocused
          ? iconMapping[route.name].active
          : iconMapping[route.name].inactive;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

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
            <View
              style={[
                styles.iconContainer,
                isFocused && { backgroundColor: "rgba(59, 130, 246, 0.15)" },
              ]}
            >
              <Ionicons
                name={iconName as any}
                size={22}
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
    position: "absolute",
    left: 24,
    right: 24,
    borderRadius: 32, // Pill shape
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    borderWidth: 1,
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    paddingHorizontal: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
});
