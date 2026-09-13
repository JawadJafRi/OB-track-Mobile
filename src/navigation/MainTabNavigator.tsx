import React from 'react';
import { Image, Platform, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { MainTabParamList } from './types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';

const homeIcon = require('../assets/icons/home.png');
const historyIcon = require('../assets/icons/history.png');
const personIcon = require('../assets/icons/person.png');

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Icons are declared outside the navigator so the tab bar does not build a new
 * component type on every render.
 */
const icons = {
  Home: homeIcon,
  History: historyIcon,
  Profile: personIcon,
} as const;

const renderIcon =
  (name: keyof typeof icons) =>
  ({ color }: { color: string }) => (
    <Image
      source={icons[name]}
      resizeMode="contain"
      style={[styles.icon, { tintColor: color }]}
    />
  );

const MainTabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: styles.bar,
      tabBarLabelStyle: styles.label,
      tabBarItemStyle: styles.item,
    }}
  >
    {/* The design calls the first tab "Task", not "Home". */}
    <Tab.Screen
      name="Home"
      component={HomeScreen}
      options={{ title: 'Task', tabBarIcon: renderIcon('Home') }}
    />
    <Tab.Screen
      name="History"
      component={HistoryScreen}
      options={{ tabBarIcon: renderIcon('History') }}
    />
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{ tabBarIcon: renderIcon('Profile') }}
    />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  icon: { width: 22, height: 22 },
  bar: {
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.outline,
    height: Platform.OS === 'ios' ? 84 : 68,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 26 : 10,
    elevation: 0,
  },
  label: { ...typography.tabLabel, marginTop: 2 },
  item: { paddingVertical: 2 },
});

export default MainTabNavigator;
