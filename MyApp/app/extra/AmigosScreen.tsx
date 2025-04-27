import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { collection, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../../firebase';

type UserData = {
    id: string;
    name?: string;
    photoURL?: string;
    friends?: string[];
  };
  
export default function AmigosScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [friends, setFriends] = useState<string[]>([]);
  const currentUser = getAuth().currentUser;

  useEffect(() => {
    const fetchUsers = async () => {
      if (!currentUser) return;

      const currentRef = doc(firestore, 'users', currentUser.uid);
      const currentSnap = await getDocs(collection(firestore, 'users'));
      const userList = currentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as UserData));

      const currentUserData = userList.find((u) => u.id === currentUser.uid);
      const friendList = currentUserData?.friends || [];

      const filtered = userList.filter((u) => u.id !== currentUser.uid);
      setUsers(filtered);
      setFriends(friendList);
    };

    fetchUsers();
  }, []);

  const addFriend = async (friendId: string) => {
    if (!currentUser) return;

    const userRef = doc(firestore, 'users', currentUser.uid);
    await updateDoc(userRef, {
      friends: arrayUnion(friendId),
    });

    setFriends((prev) => [...prev, friendId]);
  };

  const renderItem = ({ item }: { item: any }) => {
    const isFriend = friends.includes(item.id);

    return (
      <View style={styles.card}>
        <Image source={item.photoURL ? { uri: item.photoURL } : require('../../assets/images/img7.jpg')} style={styles.avatar} />
        <Text style={styles.name}>{item.name || 'Sin nombre'}</Text>
        <TouchableOpacity
          style={[styles.button, isFriend && styles.buttonDisabled]}
          onPress={() => addFriend(item.id)}
          disabled={isFriend}
        >
          <Text style={styles.buttonText}>{isFriend ? 'Amigo agregado' : 'Agregar amigo'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar amigos</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  card: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  name: { color: '#fff', fontSize: 16, flex: 1 },
  button: {
    backgroundColor: '#4f0c2e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#333',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
  },
});
