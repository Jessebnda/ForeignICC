import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  TouchableOpacity, 
  Image, 
  FlatList 
} from 'react-native';
import { Ionicons, FontAwesome5, MaterialIcons, FontAwesome } from '@expo/vector-icons';

// Mock data for friend requests
const FRIEND_REQUESTS = [
  {
    id: '1',
    name: 'Fernanda Millan',
    avatar: 'F',
    avatarColor: '#4CAF50',
    school: 'Estudia en CETYS',
    timeAgo: 'Hace 4 horas',
  },
  {
    id: '2',
    name: 'Pokemoncho',
    avatar: require('./assets/avatar2.png'),
    school: 'Estudia en CETYS',
    timeAgo: 'Hace 10 horas',
  },
  {
    id: '3',
    name: 'Emmanuelle GOD',
    avatar: require('./assets/avatar3.png'),
    school: 'Estudia en CETYS',
    timeAgo: 'Hace 16 horas',
  },
];

// Friend Request Card Component
const FriendRequestCard = ({ item }) => {
  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.avatarContainer}>
          {typeof item.avatar === 'string' ? (
            <View style={[styles.textAvatar, { backgroundColor: item.avatarColor }]}>
              <Text style={styles.textAvatarContent}>{item.avatar}</Text>
            </View>
          ) : (
            <Image source={item.avatar} style={styles.avatar} />
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userSchool}>{item.school}</Text>
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>Confirmar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.timeAgo}>{item.timeAgo}</Text>
      </View>
    </View>
  );
};

// Friends Screen with Tabs
function FriendsScreen() {
  const TopTab = createMaterialTopTabNavigator();
  
  function SugerenciasScreen() {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No hay sugerencias disponibles</Text>
      </View>
    );
  }
  
  function TusAmigosScreen() {
    return (
      <View style={styles.tabContent}>
        <Text style={styles.emptyText}>No tienes amigos aún</Text>
      </View>
    );
  }
  
  function FriendRequestsScreen() {
    return (
      <View style={styles.requestsContainer}>
        <Text style={styles.requestsTitle}>Solicitudes de amistad</Text>
        <FlatList
          data={FRIEND_REQUESTS}
          renderItem={({ item }) => <FriendRequestCard item={item} />}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.requestsList}
        />
      </View>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#8B5CF6" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Friends</Text>
      </View>
      
      <TopTab.Navigator
        screenOptions={{
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIndicatorStyle: styles.tabIndicator,
        }}
      >
        <TopTab.Screen name="Sugerencias" component={SugerenciasScreen} />
        <TopTab.Screen name="Tus Amigos" component={TusAmigosScreen} />
      </TopTab.Navigator>
      
      <FriendRequestsScreen />
    </SafeAreaView>
  );
}

// Placeholder screens for bottom tabs
function HomeScreen() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderText}>Home Screen</Text>
    </View>
  );
}

function MapScreen() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderText}>Map Screen</Text>
    </View>
  );
}

function MessagesScreen() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderText}>Messages Screen</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderText}>Profile Screen</Text>
    </View>
  );
}

// Main App with Bottom Navigation
export default function App() {
  const Tab = createBottomTabNavigator();
  
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: styles.bottomTabBar,
          tabBarActiveTintColor: '#8B5CF6',
          tabBarInactiveTintColor: '#6B7280',
          headerShown: false,
        }}
      >
        <Tab.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{
            tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={24} color={color} />,
          }}
        />
        <Tab.Screen 
          name="Map" 
          component={MapScreen} 
          options={{
            tabBarIcon: ({ color }) => <FontAwesome5 name="map" size={22} color={color} />,
          }}
        />
        <Tab.Screen 
          name="Messages" 
          component={MessagesScreen} 
          options={{
            tabBarIcon: ({ color }) => <MaterialIcons name="email-outline" size={24} color={color} />,
          }}
        />
        <Tab.Screen 
          name="Friends" 
          component={FriendsScreen} 
          options={{
            tabBarIcon: ({ color }) => <FontAwesome name="users" size={22} color={color} />,
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen} 
          options={{
            tabBarIcon: ({ color }) => <FontAwesome name="user-o" size={22} color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  menuButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  tabBar: {
    backgroundColor: '#121212',
    borderBottomWidth: 0,
  },
  tabLabel: {
    fontSize: 14,
    textTransform: 'none',
    fontWeight: '500',
  },
  tabIndicator: {
    backgroundColor: '#8B5CF6',
  },
  tabContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  emptyText: {
    color: '#6B7280',
  },
  requestsContainer: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 16,
  },
  requestsTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
    marginVertical: 12,
  },
  requestsList: {
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  textAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textAvatarContent: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  userSchool: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  confirmButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  deleteButtonText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  timeAgo: {
    color: '#6B7280',
    fontSize: 12,
    position: 'absolute',
    top: 12,
    right: 12,
  },
  bottomTabBar: {
    backgroundColor: '#121212',
    borderTopColor: '#2D2D2D',
    height: 60,
    paddingBottom: 8,
  },
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121212',
  },
  placeholderText: {
    color: 'white',
  },
});