/**
 * Operations Layout - Tab navigation for operations roles (COO, Operations Director, Scheduling, etc.)
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/DesignSystem';

export default function OperationsLayout() {
    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: Colors.info.DEFAULT,
                tabBarInactiveTintColor: Colors.gray[400],
                tabBarStyle: {
                    backgroundColor: '#fff',
                    borderTopWidth: 1,
                    borderTopColor: Colors.gray[200],
                    paddingBottom: 8,
                    paddingTop: 8,
                    height: 65,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },
                headerStyle: {
                    backgroundColor: Colors.info.DEFAULT,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Operations',
                    tabBarLabel: 'Dashboard',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="pulse" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="scheduling"
                options={{
                    title: 'Scheduling',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="calendar" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="visits"
                options={{
                    title: 'Visits',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="navigate" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="staff"
                options={{
                    title: 'Staff',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="people" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profile',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}
