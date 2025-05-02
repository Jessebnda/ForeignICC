import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons'; // Or your icon library
import { View, Text, Pressable, StyleSheet, TouchableOpacity, Switch, Image } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { DrawerActions } from "@react-navigation/native";
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { Platform } from "react-native";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth, firestore } from '../../firebase';

const CustomDrawerButton = () => {
  const navigation = useNavigation();

  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <TouchableOpacity 
      style={{ padding: 4, marginRight: Platform.OS === "ios" ? 0 : 12, backgroundColor: "#f5f5f5", borderRadius: 50 }}
      onPress={openDrawer}
    >
      <MaterialCommunityIcons name="menu" size={24} color="#333" />
    </TouchableOpacity>
  );
};

const customTitles: Record<string, string> = {
  contact: "Contacto",
  faq: "Preguntas Frecuentes",
  about: "Sobre Nosotros",
};

export default function DrawerLayout() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {userId && (
        <Drawer
          screenOptions={({ route }) => ({
            headerShown: Object.keys(customTitles).includes(route.name),
            title: customTitles[route.name] || route.name,
            headerLeft: () => (
              <View style={{ flexDirection: "row", alignItems: "center", marginLeft: 10 }}>
                <CustomDrawerButton />
              </View>
            ),
          })}
          drawerContent={() => <CustomDrawerContent userId={userId} />}
        >
          {/* ... existing screens ... */}
          <Drawer.Screen
            name="messages" // This will look for app/(drawer)/messages.tsx
            options={{
              drawerLabel: 'Mensajes',
              title: 'Mis Mensajes',
              drawerIcon: ({ size, color }) => (
                <Ionicons name="chatbubbles-outline" size={size} color={color} />
              ),
            }}
          />
          {/* ... other existing screens ... */}
        </Drawer>
      )}
    </GestureHandlerRootView>
  );
}

function CustomDrawerContent({ userId }: { userId: string }) {
  const router = useRouter();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const ref = doc(firestore, "users", userId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setIsAdmin(data.isAdmin === true);
        }
      } catch (error) {
        console.error("Error al obtener el rol del usuario:", error);
      }
    };
    fetchUserRole();
  }, [userId]);

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const toggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDarkMode(previousState => !previousState);
  };

  const menuItems: { title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap, path: string }[] = [
    { title: "User", icon: "account", path: '/(tabs)/profile' },
    { title: "Messages", icon: "message", path: 'extra/messages' }, 
    { title: "Friend request", icon: "account-plus", path: '/extra/AmigosScreen' },
    { title: "Configuración", icon: "cog", path: '/settings' },  // Esta línea debe apuntar a '/settings'
  ];

  const menuItemsAdmin: { title: string; icon: keyof typeof MaterialCommunityIcons.glyphMap, path: string }[] = [
    { title: "User", icon: "account", path: '/(tabs)/profile' },
    { title: "Messages", icon: "message", path: '/extra/messages' }, 
    { title: "Friend request", icon: "account-plus", path: '/extra/AmigosScreen' },
    { title: "Configuración", icon: "cog", path: '/settings' },  // Esta línea debe apuntar a '/settings'
    { title: "Dashboard", icon: "powershell", path: '/(adminTabs)' },
  ];

  return (
    <View style={styles.drawerContainer}>
      <View style={styles.titleContainer}>
        <View style={styles.headerContainer}>
        <Image 
  source={require('../../assets/images/logo.png.jpeg')} 
  style={styles.logoImage}
/>
          <Text style={styles.titleText}>Foreign</Text>
        </View>

        {!isAdmin ? (
          <View>
            <View style={styles.divider} />
            {menuItems.map((item, index) => (
              <View key={index}>
                <TouchableOpacity 
                  style={styles.menuItemContainer}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(item.path as any);
                  }}
                >
                  <MaterialCommunityIcons name={item.icon} size={24} color="#8B5CF6" />
                  <Text style={styles.drawerItem}>{item.title}</Text>
                </TouchableOpacity>
                <View style={styles.dividerItems} />
              </View>
            ))}
          </View>
        ) : 
        (
          <View>
            <View style={styles.divider} />
            {menuItemsAdmin.map((item, index) => (
              <View key={index}>
                <TouchableOpacity 
                  style={styles.menuItemContainer}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(item.path as any);
                  }}
                >
                  <MaterialCommunityIcons name={item.icon} size={24} color="#8B5CF6" />
                  <Text style={styles.drawerItem}>{item.title}</Text>
                </TouchableOpacity>
                <View style={styles.dividerItems} />
              </View>
            ))}
          </View>
        )}
      </View>

      <Pressable
        onPress={handleLogout}
        style={({ pressed }) => [styles.logoutButton, pressed ? styles.logoutButtonPressed : {}]}
      >
        <MaterialCommunityIcons name='logout' size={20} color="white" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  drawerContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
    backgroundColor: "#333333",
  },
  titleContainer: {
    marginTop: 40,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B5CF6",
    marginLeft: 0,
  },
  divider: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 15,
  },
  dividerItems: {
    height: 1,
    backgroundColor: "#333",
    marginVertical: 15,
  },
  themeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  themeTextContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  themeText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginLeft: 15,
  },
  menuItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  drawerItem: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginLeft: 15,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    justifyContent: "center",
  },
  logoutButtonPressed: {
    backgroundColor: "#B91C1C",
  },
  logoutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  logoImage: {
    width: 50,   // tamaño de la imagen
    height: 50,
    marginRight: 8,  // separación entre la imagen y el texto "Foreign"
    borderRadius: 8, // opcional, si quieres que esté redondeada
  },  
});

