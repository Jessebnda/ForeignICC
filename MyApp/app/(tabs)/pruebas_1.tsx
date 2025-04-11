import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, StyleSheet, ActivityIndicator } from 'react-native';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebase'; // tu config de firebase

const db = getFirestore(app);

export default function FeedTab() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFeedPosts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'feedPosts'));
      const postList = await Promise.all(
        querySnapshot.docs.map(async (postDoc) => {
          const postData = postDoc.data();
          const userSnap = await getDoc(doc(db, 'users', postData.userId));
          const userData = userSnap.exists() ? userSnap.data() : null;

          return {
            id: postDoc.id,
            ...postData,
            user: userData,
          };
        })
      );

      setPosts(postList);
    } catch (err) {
      console.error("Error al obtener los posts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedPosts();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" style={styles.loading} />;
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.userRow}>
            <Image
              source={{ uri: item.user?.profileImage || 'https://via.placeholder.com/40' }}
              style={styles.profileImage}
            />
            <Text style={styles.userName}>{item.user?.name || 'Usuario'}</Text>
          </View>
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} />
          <Text style={styles.text}>{item.text}</Text>
          <Text style={styles.location}>📍 {item.location}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 8,
  },
  text: {
    fontSize: 14,
    marginTop: 8,
  },
  location: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
  },
});
