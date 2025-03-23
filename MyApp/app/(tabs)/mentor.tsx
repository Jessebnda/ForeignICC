import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MentorListScreen from '../extra/mentor-list';
import ChatbotScreen from '../extra/chatbot';

export default function MentorScreen() {
  const [activeTab, setActiveTab] = useState<'mentores' | 'chatbot'>('mentores');

  return (
    <View style={styles.container}>
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'mentores' && styles.activeTab]} onPress={() => setActiveTab('mentores')}>
          <Text style={styles.tabText}>Mentores</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'chatbot' && styles.activeTab]} onPress={() => setActiveTab('chatbot')}>
          <Text style={styles.tabText}>Chatbot</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {activeTab === 'mentores' ? <MentorListScreen /> : <ChatbotScreen />}
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
