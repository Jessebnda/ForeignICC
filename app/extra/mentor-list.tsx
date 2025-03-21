import React from 'react';
import { FlatList, View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

const mentorsData = [
  { id: '1', name: 'Juan Pérez', area: 'Deportes', image: require('../../assets/images/img7.jpg') },
  { id: '2', name: 'María López', area: 'Asuntos Legales', image: require('../../assets/images/img7.jpg') },
  { id: '3', name: 'Carlos García', area: 'Tecnología', image: require('../../assets/images/img7.jpg') },
];

export default function MentorListScreen() {
  const router = useRouter();

  const goToChat = (mentor: any) => {
    router.push({
      pathname: '/extra/mentor-chat',
      params: { mentor: JSON.stringify(mentor) },
    });
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={mentorsData}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => goToChat(item)}>
            <Image source={item.image} style={styles.avatar} />
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.area}>Área: {item.area}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  card: { 
    flexDirection: 'row', 
    padding: 16, 
    alignItems: 'center', 
    borderRadius: 10, 
    backgroundColor: '#1e1e1e', 
    marginBottom: 10, 
    elevation: 2 
  },
  avatar: { 
    width: 55, 
    height: 55, 
    borderRadius: 27.5, 
    marginRight: 12 
  },
  name: { 
    fontWeight: 'bold', 
    color: '#fff', 
    fontSize: 16 
  },
  area: { 
    color: '#ccc', 
    fontSize: 14 
  },
});
