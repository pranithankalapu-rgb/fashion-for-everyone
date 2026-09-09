import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize } from '../constants/theme';

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

import { useCart } from '../hooks/useCart';

export type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  Main: undefined;
  ProductDetail: { productId: string };
  Cart: undefined;
  Checkout: undefined;
  Orders: undefined;
  ColorVoting: undefined;
  DesignerShowcase: undefined;
  SocialFeed: undefined;
  RetailerDashboard: undefined;
};

export type TabParamList = {
  Home: undefined;
  Explore: undefined;
  AiStylist: undefined;
  Wishlist: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function MainTabs() {
  const { totalItems } = useCart();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          height: 65,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '600',
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          switch (route.name) {
            case 'Home': iconName = focused ? 'home' : 'home-outline'; break;
            case 'Explore': iconName = focused ? 'compass' : 'compass-outline'; break;
            case 'AiStylist': iconName = focused ? 'sparkles' : 'sparkles-outline'; break;
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
        name="AiStylist"
        component={AiStylistScreen}
        options={{ tabBarLabel: 'AI Stylist' }}
      />
      <Tab.Screen name="Wishlist" component={WishlistScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
      <Stack.Screen name="ColorVoting" component={ColorVotingScreen} />
      <Stack.Screen name="DesignerShowcase" component={DesignerShowcaseScreen} />
      <Stack.Screen name="SocialFeed" component={SocialFeedScreen} />
      <Stack.Screen name="RetailerDashboard" component={RetailerDashboardScreen} />
    </Stack.Navigator>
  );
}
