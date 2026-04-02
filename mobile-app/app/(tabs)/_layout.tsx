import { Tabs } from 'expo-router';
import { Home, User, PlusSquare, Search } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderTopColor: 'rgba(255,255,255,0.1)',
        height: Platform.OS === 'ios' ? 88 : 64,
      },
      tabBarActiveTintColor: '#00f2fe',
      tabBarInactiveTintColor: '#b0b0b0',
      tabBarShowLabel: false,
    }}>
      <Tabs.Screen 
        name="index" 
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="search" 
        options={{
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="create" 
        options={{
          tabBarIcon: ({ color, size }) => <PlusSquare size={size} color={color} />,
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }} 
      />
    </Tabs>
  );
}
