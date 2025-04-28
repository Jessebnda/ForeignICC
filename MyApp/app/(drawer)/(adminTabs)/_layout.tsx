import { Stack } from "expo-router";
import { TouchableOpacity, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, DrawerActions } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

export default function StackHome() {
  const navigation = useNavigation();
  const openDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1e1e1e",
        },
        headerTintColor: "#fff",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: "Dashboard",
          headerLeft: () => (
            <TouchableOpacity
              onPress={openDrawer}
              style={{
                padding: 4,
                marginRight: Platform.OS === "ios" ? 0 : 12,
                backgroundColor: "#1e1e1e",
                borderRadius: 50,
              }}
            >
              <MaterialCommunityIcons name="menu" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen
        name="gestionUsuarios"
        options={{
          headerTitle: "Gestión de Usuarios",
          // No headerLeft aquí, así no sale el icono
        }}
      />

      {/* Agrega más pantallas aquí, todas sin headerLeft a menos que lo especifiques */}
    </Stack>
  );
}