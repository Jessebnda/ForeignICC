import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ExtraLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={{
        headerShown: true, // Asegura que el header sea visible
        headerStyle: {
          backgroundColor: '#1e1e1e', // Color de fondo oscuro para el header
        },
        headerTintColor: '#fff', // Color blanco para el título y el botón de retroceso
        headerTitleStyle: {
          color: '#fff', // Asegura que el título sea blanco
        },
        // Define el botón izquierdo (retroceso)
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginLeft: 15, padding: 5 }} // Añade padding para facilitar el toque
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }}
    >
      {/* Opcional: Define títulos específicos para cada pantalla si lo deseas */}
      <Stack.Screen name="crearpubli" options={{ title: 'Crear Publicación' }} />
      <Stack.Screen name="edit-profile" options={{ title: 'Editar Perfil' }} />
      <Stack.Screen name="question-detail" options={{ title: 'Detalle Pregunta' }} />
      <Stack.Screen name="answer-detail" options={{ title: 'Detalle Respuesta' }} />
      <Stack.Screen name="mentor-list" options={{ title: 'Mentores' }} />
      <Stack.Screen name="mentor-chat" options={{ title: 'Chat con Mentor' }} />
      <Stack.Screen name="chatbot" options={{ title: 'Chatbot Asistente' }} />
      <Stack.Screen name="AmigosScreen" options={{ title: 'Buscar Amigos' }} />
      {/* Si tienes más pantallas en 'extra', añádelas aquí */}

    </Stack>
  );
}