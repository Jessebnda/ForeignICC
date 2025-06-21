import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useUser } from '../../../context/UserContext';
import MaxWidthContainer from '../../../components/MaxWidthContainer';
import MentorListScreen from '../../extra/mentorList';
import ReceivedChatsScreen from '../../extra/receivedChats';
import ChatbotScreen from '../../extra/chatbot';

export default function MentorScreen() {
  const { userProfile } = useUser();
  const [isMentor, setIsMentor] = useState(false);
  const [activeTab, setActiveTab] = useState<'mentores' | 'recibidos' | 'chatbot'>('mentores');

  useEffect(() => {
    if (userProfile?.isMentor === true) {
      setIsMentor(true);
    } else if (activeTab === 'recibidos') {
      setActiveTab('mentores');
    }
  }, [userProfile]);

  return (
    <SafeAreaView style={styles.container}>
      <MaxWidthContainer>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'mentores' && styles.activeTab,
              { flex: isMentor ? 1 : 1.5 },
            ]}
            onPress={() => setActiveTab('mentores')}
          >
            <Text style={[
              styles.tabText, 
              activeTab === 'mentores' && styles.activeTabText
            ]}>
              Mentores
            </Text>
          </TouchableOpacity>

          {isMentor && (
            <TouchableOpacity
              style={[styles.tab, activeTab === 'recibidos' && styles.activeTab]}
              onPress={() => setActiveTab('recibidos')}
            >
              <Text style={[
                styles.tabText, 
                activeTab === 'recibidos' && styles.activeTabText
              ]}>
                Recibidos
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === 'chatbot' && styles.activeTab,
              { flex: isMentor ? 1 : 1.5 },
            ]}
            onPress={() => setActiveTab('chatbot')}
          >
            <Text style={[
              styles.tabText, 
              activeTab === 'chatbot' && styles.activeTabText
            ]}>
              Chatbot
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {activeTab === 'mentores' && <MentorListScreen />}
          {activeTab === 'recibidos' && isMentor && <ReceivedChatsScreen />}
          {activeTab === 'chatbot' && <ChatbotScreen />}
        </View>
      </MaxWidthContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
    marginHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#1e1e1e',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderColor: '#bb86fc',
    backgroundColor: '#2c2c2c',
  },
  tabText: {
    color: '#aaa',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
});
