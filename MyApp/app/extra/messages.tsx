import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query as firestoreQuery, where } from 'firebase/firestore';
import { firestore } from '../../firebase'; // Adjust path if needed
import { Ionicons } from '@expo/vector-icons'; // <-- Add this import

interface FriendInfo {
    id: string;
    name: string;
    photoURL?: string;
}

const defaultUserImage = require('../../assets/images/img7.jpg'); // Adjust path

export default function MessagesScreen() {
    const router = useRouter();
    const [friends, setFriends] = useState<FriendInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const currentUser = getAuth().currentUser;

    useEffect(() => {
        const fetchFriends = async () => {
            if (!currentUser) {
                setLoading(false);
                return;
            }

            try {
                // 1. Get current user's friend list (IDs) from Firestore
                const userRef = doc(firestore, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);
                const friendIds = userSnap.exists() ? userSnap.data()?.friends || [] : [];

                if (friendIds.length === 0) {
                    setFriends([]);
                    setLoading(false);
                    return;
                }

                // 2. Fetch details for each friend from Firestore
                // Note: Firestore 'in' query is limited to 10 items. For more friends, fetch in batches or individually.
                // For simplicity, fetching all users and filtering (less efficient for many users)
                // A better approach for larger scale would be fetching only the needed friend documents.
                const usersRef = collection(firestore, 'users');
                const q = firestoreQuery(usersRef, where('uid', 'in', friendIds.slice(0, 10))); // Example: Fetch first 10
                const querySnapshot = await getDocs(q);

                const friendsData = querySnapshot.docs.map(doc => ({
                    id: doc.id, // Use the document ID (which should be the UID)
                    name: doc.data().name || 'Sin nombre',
                    photoURL: doc.data().photo || undefined,
                }));

                setFriends(friendsData);

            } catch (error) {
                console.error("Error fetching friends:", error);
                // Handle error (e.g., show a message)
            } finally {
                setLoading(false);
            }
        };

        fetchFriends();
    }, [currentUser]);

    const goToChat = (friend: FriendInfo) => {
        router.push({
            pathname: '/extra/chat', // Navigate to the chat screen
            params: {
                friendId: friend.id,
                friendName: friend.name,
                friendPhotoURL: friend.photoURL || '', // Pass empty string if undefined
            },
        });
    };

    if (loading) {
        return <ActivityIndicator style={styles.loader} size="large" color="#bb86fc" />;
    }

    if (friends.length === 0) {
        return <View style={styles.container}><Text style={styles.emptyText}>No tienes amigos agregados aún.</Text></View>;
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={friends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.card} onPress={() => goToChat(item)}>
                        <Image
                            source={item.photoURL ? { uri: item.photoURL } : defaultUserImage}
                            style={styles.avatar}
                        />
                        <Text style={styles.name}>{item.name}</Text> {/* Ensure name is wrapped */}
                        <Ionicons name="chevron-forward" size={20} color="#888" /> {/* Remove any text/symbols after this */}
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', paddingTop: 10 },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' },
    emptyText: { color: '#fff', textAlign: 'center', marginTop: 50, fontSize: 16 },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        padding: 15,
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 12,
    },
    avatar: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        marginRight: 15,
        borderWidth: 1,
        borderColor: '#bb86fc',
    },
    name: {
        flex: 1,
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});