import { Stack } from 'expo-router';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ExtraLayout() {
  const router = useRouter(); 

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1e1e1e', // Fondo oscuro para el header
        },
        headerTintColor: '#fff', // Texto blanco en el header
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerLeft: () => ( // Tu botón personalizado ya oculta el título
          <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 15 }}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }}
    >
      {/* Asegúrate de que todas las pantallas bajo 'extra' estén definidas aquí */}
      <Stack.Screen name="messages" options={{ title: 'Mensajes' }} />
      <Stack.Screen name="notifications" options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="friendProfile" options={{ title: 'Perfil de Amigo' }} />
      <Stack.Screen name="chat" options={{ title: 'Chat' }} /> 
      <Stack.Screen name="createPost" options={{ title: 'Crear Publicación' }} />
      <Stack.Screen name="editProfile" options={{ title: 'Editar Perfil' }} />
      <Stack.Screen name="questionDetail" options={{ title: 'Detalle Pregunta' }} />
      <Stack.Screen name="answerDetail" options={{ title: 'Detalle Respuesta' }} />
      <Stack.Screen name="mentorList" options={{ title: 'Mentores' }} />
      <Stack.Screen name="mentorChat" options={{ title: 'Chat con Mentor' }} />
      <Stack.Screen name="chatbot" options={{ title: 'Chatbot Asistente' }} />
      <Stack.Screen name="friendRequest" options={{ title: 'Buscar Amigos' }} />
      {/* Si tienes más pantallas en 'extra', añádelas aquí */}

    </Stack>
  );
}