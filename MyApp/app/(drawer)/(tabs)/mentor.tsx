import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MentorListScreen from '../../extra/mentor-list';
import ChatbotScreen from '../../extra/chatbot';
import ReceivedChatsScreen from '../../extra/received-chats'; // Nuevo componente
import { useUser } from '../../../context/UserContext';

export default function MentorScreen() {
  const { userProfile } = useUser();
  const [isMentor, setIsMentor] = useState(false);
  const [activeTab, setActiveTab] = useState<'mentores' | 'recibidos' | 'chatbot'>('mentores');
  
  // Verificar si el usuario es mentor
  useEffect(() => {
    if (userProfile?.isMentor === true) {
      setIsMentor(true);
    } else {
      // Si el usuario no es mentor y está en la pestaña recibidos, cambiar a mentores
      if (activeTab === 'recibidos') {
        setActiveTab('mentores');
      }
    }
  }, [userProfile]);

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'mentores' && styles.activeTab,
            // Ajustar anchura dependiendo de cuántas tabs hay
            { flex: isMentor ? 1 : 1.5 }
          ]} 
          onPress={() => setActiveTab('mentores')}
        >
          <Text style={styles.tabText}>Mentores</Text>
        </TouchableOpacity>
        
        {isMentor && (
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'recibidos' && styles.activeTab]} 
            onPress={() => setActiveTab('recibidos')}
          >
            <Text style={styles.tabText}>Recibidos</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'chatbot' && styles.activeTab,
            { flex: isMentor ? 1 : 1.5 }
          ]} 
          onPress={() => setActiveTab('chatbot')}
        >
          <Text style={styles.tabText}>Chatbot</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        {activeTab === 'mentores' && <MentorListScreen />}
        {activeTab === 'recibidos' && isMentor && <ReceivedChatsScreen />}
        {activeTab === 'chatbot' && <ChatbotScreen />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  tabContainer: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#333' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', backgroundColor: '#1e1e1e' },
  activeTab: { borderBottomWidth: 3, borderColor: '#bb86fc' },
  tabText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  content: { flex: 1 },
});
