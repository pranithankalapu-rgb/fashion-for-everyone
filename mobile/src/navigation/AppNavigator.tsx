import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FontSize } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import AiStylistScreen from '../screens/AiStylistScreen';
import WishlistScreen from '../screens/WishlistScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import CartScreen from '../screens/CartScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import OrdersScreen from '../screens/OrdersScreen';
import ColorVotingScreen from '../screens/ColorVotingScreen';
import DesignerShowcaseScreen from '../screens/DesignerShowcaseScreen';
import SocialFeedScreen from '../screens/SocialFeedScreen';
import RetailerDashboardScreen from '../screens/RetailerDashboardScreen';
import SettingsScreen from '../screens/SettingsScreen';
import ThemeSettingsScreen from '../screens/ThemeSettingsScreen';
import ChangeProfilePictureScreen from '../screens/ChangeProfilePictureScreen';
import ChangeEmailScreen from '../screens/ChangeEmailScreen';
import ChangeMobileScreen from '../screens/ChangeMobileScreen';
import DesignDetailScreen from '../screens/DesignDetailScreen';

import { useCart } from '../hooks/useCart';
import type { ColorCombo, Design } from '../types/fashion';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
  ProductDetail: { productId: string };
  DesignDetail: { designId: string; design?: Design };
  Cart: undefined;
  Checkout: undefined;
  Orders: undefined;
  ColorVoting: undefined;
  AiStylist: { colorCombo?: ColorCombo; occasion?: string } | undefined;
  DesignerShowcase: undefined;
  SocialFeed: undefined;
  RetailerDashboard: undefined;
  Settings: undefined;
  ThemeSettings: undefined;
  ChangeProfilePicture: undefined;
  ChangeEmail: undefined;
  ChangeMobile: undefined;
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  Cart: undefined;
  Wishlist: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { totalItems } = useCart();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      backBehavior="firstRoute"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 65 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          switch (route.name) {
            case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
            case 'Explore': iconName = focused ? 'compass' : 'compass-outline'; break;
            case 'Cart': iconName = focused ? 'bag-handle' : 'bag-handle-outline'; break;
            case 'Wishlist': iconName = focused ? 'heart' : 'heart-outline'; break;
            case 'Profile': iconName = focused ? 'person' : 'person-outline'; break;
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          tabBarLabel: 'Add to Bag',
          tabBarBadge: totalItems > 0 ? totalItems : undefined,
          tabBarBadgeStyle: {
            backgroundColor: colors.accent,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: 'bold',
          },
        }}
      />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="DesignDetail" component={DesignDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="ColorVoting" component={ColorVotingScreen} />
      <Stack.Screen name="AiStylist" component={AiStylistScreen} />
      <Stack.Screen name="DesignerShowcase" component={DesignerShowcaseScreen} />
      <Stack.Screen name="SocialFeed" component={SocialFeedScreen} />
      <Stack.Screen name="RetailerDashboard" component={RetailerDashboardScreen} />
      
      {/* Settings Navigation Stack */}
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="ThemeSettings" component={ThemeSettingsScreen} />
      <Stack.Screen name="ChangeProfilePicture" component={ChangeProfilePictureScreen} />
      <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
      <Stack.Screen name="ChangeMobile" component={ChangeMobileScreen} />
    </Stack.Navigator>
  );
}
