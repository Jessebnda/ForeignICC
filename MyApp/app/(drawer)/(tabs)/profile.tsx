// app/(tabs)/profile.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    ScrollView, // <-- Ensure ScrollView is imported
    TextInput,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ImageSourcePropType // Import ImageSourcePropType
} from 'react-native';
import { useUser } from '../../../context/UserContext';
import { Post, Comment } from '../../../models/Post'; // Ensure these types match your data
import { Ionicons } from '@expo/vector-icons';
import {
    doc,
    collection,
    getDocs,
    query,
    orderBy,
    getDoc,
    updateDoc,
    deleteField,
    serverTimestamp,
    addDoc
    // updateDoc, addDoc, serverTimestamp, deleteField
} from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useRouter } from 'expo-router';

// Default image asset
const defaultUserImage = require('../../../assets/images/img7.jpg');


export default function ProfileScreen() {
    const { user, userProfile, loading: loadingProfile, refreshProfile } = useUser();
    const router = useRouter();
    const [posts, setPosts] = useState<Post[]>([]);
    const [loadingPosts, setLoadingPosts] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal State
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [liked, setLiked] = useState(false);
    const [loadingComments, setLoadingComments] = useState(false);
    const [currentUserId, setCurrentUserId] = useState('');
    

    // --- Fetch User Posts Function (Revised) ---
    const fetchUserPosts = useCallback(async () => {
        if (!user?.uid) {
            setPosts([]);
            setLoadingPosts(false);
            return;
        }

        setLoadingPosts(true);
        try {
            const postsQuery = query(
                collection(firestore, 'feedPosts'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(postsQuery);

            const userPosts: Post[] = [];

            // Process posts sequentially to avoid overwhelming Firestore reads if needed,
            // or use Promise.all if performance is acceptable.
            for (const docPost of snapshot.docs) {
                const data = docPost.data();
                const likesMap = data.likes || {};
                const postUserId = data.userId;

                // Filter for current user's posts
                if (postUserId === user.uid) {
                    let authorName = 'Usuario Desconocido';
                    let authorPhoto: ImageSourcePropType = defaultUserImage;

                    // Fetch author details (even though it's the current user, this ensures consistency)
                    try {
                        const userDocRef = doc(firestore, 'users', postUserId);
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            const userInfo = userDocSnap.data();
                            authorName = userInfo.name || 'Usuario sin nombre';
                            // Handle photo URI correctly
                            authorPhoto = userInfo.photo ? { uri: userInfo.photo } : defaultUserImage;
                        }
                    } catch (error) {
                        console.error(`❌ Error fetching user data for post ${docPost.id}:`, error);
                    }

                    // Construct the Post object
                    userPosts.push({
                        id: docPost.id,
                        userId: postUserId,
                        imageUrl: data.image || null, // Use 'image' field from Firestore
                        content: data.caption || '', // Use 'caption' field from Firestore
                        userName: authorName,
                        userPhoto: authorPhoto,
                        likes: likesMap,
                        likeCount: Object.keys(likesMap).length,                        
                        comments: data.comments || [], // Assuming comments are stored directly
                        createdAt: data.createdAt,
                    });
                }
            }

            setPosts(userPosts);

        } catch (error) {
            console.error('❌ Error fetching user posts:', error);
            setPosts([]); // Clear posts on error
        } finally {
            setLoadingPosts(false);
        }
    }, [user]); // Depend on user object

    // --- Initial Fetch & Refresh ---
    useEffect(() => {
        if (user) { // Fetch only if user is available
            fetchUserPosts();
        }
    }, [fetchUserPosts, user]); // Add user as dependency

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await refreshProfile(); // Refresh context profile data
            await fetchUserPosts(); // Re-fetch posts
        } catch (error) {
            console.error("Error during refresh:", error);
        } finally {
            setRefreshing(false);
        }
    }, [refreshProfile, fetchUserPosts]);

    // --- Navigation ---
    const navigateToEditProfile = () => {
        if (!userProfile) return;
        router.push({
            pathname: '/extra/edit-profile',
            // Pass necessary profile data, ensure it's serializable
            params: { profile: JSON.stringify({
                name: userProfile.name,
                origin: userProfile.origin,
                photo: userProfile.photo,
                interests: userProfile.interests,
                // Add other fields needed for editing
            }) }
        });
    };

    // --- Modal Handlers (Simplified Placeholders) ---
    const handlePostPress = (post: Post) => {
        setSelectedPost(post);
    };

    const loadComments = async (postId: string) => {
        try {
          const q = query(
            collection(firestore, 'feedPosts', postId, 'comments'),
            orderBy('created_at', 'desc')
          );
          const snapshot = await getDocs(q);
          const loadedComments = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setComments(loadedComments);
        } catch (error) {
          console.error('❌ Error al cargar comentarios:', error);
        }
      };
      
       useEffect(() => {
          if (selectedPost?.id) {
            setLoadingComments(true);
            loadComments(selectedPost.id).finally(() => setLoadingComments(false));
          }
        }, [selectedPost]);  

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedPost) return;
    
        const comment = {
          text: newComment.trim(),
          created_at: serverTimestamp(),
          user: {
            name: 'Tú',
            image: require('../../../assets/images/img7.jpg'), // Reemplaza si tienes auth
          },
          likes: 0,
        };
    
        try {
          await addDoc(collection(firestore, 'feedPosts', selectedPost.id, 'comments'), comment);
          setComments((prev) => [comment, ...prev]);
          setNewComment('');
        } catch (error) {
          console.error('❌ Error guardando comentario:', error);
        }
      };

    //likes
        const toggleLike = async () => {
          if (!selectedPost || !currentUserId) return;
        
          const postRef = doc(firestore, 'feedPosts', selectedPost.id);
        
          try {
            if (liked) {
              await updateDoc(postRef, {
                [`likes.${currentUserId}`]: deleteField(),
              });
            } else {
              await updateDoc(postRef, {
                [`likes.${currentUserId}`]: true,
              });
            }
        
            // Actualiza UI local
            setSelectedPost((prev) => {
              if (!prev) return prev;
            
              const updatedLikes = { ...prev.likes };
            
              if (liked) {
                delete updatedLikes[currentUserId];
              } else {
                updatedLikes[currentUserId] = true;
              }
            
              return { ...prev, likes: updatedLikes, likeCount: Object.keys(updatedLikes).length, };
            });
            setLiked(!liked);
            
          } catch (error) {
            console.error('❌ Error actualizando like:', error);
          }
        };
    
    useEffect(() => {
          if (selectedPost && currentUserId) {
            setLiked(!!selectedPost.likes?.[currentUserId]);
          }
        }, [selectedPost, currentUserId]);

    const closeModal = () => {
        setSelectedPost(null);
    };

    // --- Render Logic ---
    if (loadingProfile) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#bb86fc" />
                <Text style={styles.loadingText}>Cargando perfil...</Text>
            </View>
        );
    }

    // Use ScrollView as the main container
    return (
        <ScrollView // <-- Use ScrollView here
            style={styles.container}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#bb86fc"]}
                    tintColor={"#bb86fc"}
                />
            }
        >
            {/* Profile Header */}
            <View style={styles.profileHeader}>
                <Image
                    source={userProfile?.photo ? { uri: userProfile.photo } : defaultUserImage}
                    style={styles.profileImage}
                />
                <Text style={styles.profileName}>{userProfile?.name || 'Usuario'}</Text>
                <Text style={styles.profileInfo}>{userProfile?.university || 'Universidad no especificada'}</Text>
                <TouchableOpacity style={styles.editButton} onPress={navigateToEditProfile}>
                    <Text style={styles.editButtonText}>Editar Perfil</Text>
                </TouchableOpacity>
            </View>

            {/* Interests */}
            <View style={styles.interestsContainer}>
                <Text style={styles.sectionTitle}>Intereses</Text>
                <View style={styles.interestsList}>
                    {userProfile?.interests && userProfile.interests.length > 0 ? (
                        userProfile.interests.map((interest: string) => (
                            <View key={interest} style={styles.interestChip}>
                                <Text style={styles.interestText}>{interest}</Text>
                            </View>
                        ))
                    ) : (
                        <Text style={styles.noDataText}>No hay intereses definidos.</Text>
                    )}
                </View>
            </View>

            {/* Posts Grid */}
            <View style={styles.postsContainer}>
                <Text style={styles.sectionTitle}>Mis Publicaciones</Text>
                {loadingPosts ? (
                    <ActivityIndicator size="small" color="#bb86fc" style={{ marginTop: 20 }} />
                ) : (
                    <>
                        {posts.length > 0 ? (
                            <FlatList
                                data={posts}
                                keyExtractor={item => item.id}
                                numColumns={3}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.gridItem}
                                        onPress={() => handlePostPress(item)}
                                    >
                                        {item.imageUrl ? (
                                            <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
                                        ) : (
                                            <View style={[styles.gridImage, styles.gridPlaceholder]}>
                                                <Ionicons name="image-outline" size={24} color="#555" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )}
                                scrollEnabled={false} // Important: Disable FlatList scrolling inside ScrollView
                            />
                        ) : (
                            <Text style={styles.noDataText}>No has publicado nada todavía.</Text>
                        )}
                    </>
                )}
            </View>

            {/* Post Detail Modal */}
                  {selectedPost && (
                    <Modal
                      animationType="slide"
                      transparent={true}
                      visible={!!selectedPost}
                      onRequestClose={closeModal}
                    >
                      <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        style={styles.detailOverlay}
                      >
                        <ScrollView style={styles.detailScroll}>
                          <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                            <Ionicons name="close-circle" size={32} color="#aaa" />
                          </TouchableOpacity>
              
                          {/* Author Info */}
                          <View style={styles.detailAuthor}>
                            <Image
                               source={selectedPost.userPhoto || require('../../../assets/images/img7.jpg')}
                              style={styles.detailAuthorImage}
                            />
                            <Text style={styles.detailAuthorName}>{selectedPost.userName}</Text>
                          </View>
              
                          {/* Image */}
                          {selectedPost.imageUrl && (
                            <Image
                              source={{ uri: selectedPost.imageUrl }}
                              style={styles.detailImage}
                            />
                          )}
              
                          {/* Content/Caption */}
                          <View style={styles.detailContent}>
                            <Text style={styles.detailCaption}>{selectedPost.content}</Text>
              
                     <Text style={styles.detailContent}>{selectedPost.likeCount} Me gusta</Text>
                            
              
                        <View style={{ width: '100%', marginTop: 16 }}>
                          {loadingComments ? (
                            <ActivityIndicator color="#bb86fc" />
                          ) : comments.length > 0 ? (
                            comments.map((comment) => (
                              <View key={comment.id} style={styles.commentBubble}>
                                <Text style={styles.commentText}>🗨 {comment.text}</Text>
                              </View>
                            ))
                          ) : (
                            <Text style={styles.noDataText}>No hay comentarios aún.</Text>
                          )}
                        </View>
                          </View>
                        </ScrollView>
              
                        {/* Comment Input */}
                        <View style={styles.commentInputRow}>
                          <TextInput
                            style={styles.commentInput}
                            placeholder="Añadir un comentario..."
                            placeholderTextColor="#888"
                            value={newComment}
                            onChangeText={setNewComment}
                          />
                          <TouchableOpacity onPress={handleAddComment} disabled={!newComment.trim()}>
                            <Ionicons name="send" size={24} color={newComment.trim() ? "#bb86fc" : "#888"} />
                          </TouchableOpacity>
                        </View>
                      </KeyboardAvoidingView>
                    </Modal>
                  )}    
            
        </ScrollView> // <-- Close ScrollView here
    );
}

// --- Styles (Keep existing styles, ensure they match the structure) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    loadingText: {
        color: '#fff',
        marginTop: 10,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
        backgroundColor: '#1a1a1a',
        marginBottom: 16,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 12,
        borderWidth: 3,
        borderColor: '#bb86fc',
    },
    profileName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    profileInfo: {
        fontSize: 16,
        color: '#aaa',
        marginBottom: 16,
    },
    editButton: {
        borderColor: '#bb86fc',
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 25,
    },
    editButtonText: {
        color: '#bb86fc',
        fontWeight: 'bold',
        fontSize: 14,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    interestsContainer: {
        marginBottom: 24,
    },
    interestsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
    },
    interestChip: {
        backgroundColor: '#2a2a2a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#bb86fc',
        marginRight: 8,
        marginBottom: 8,
    },
    interestText: {
        color: '#fff',
        fontSize: 13,
    },
    noDataText: {
        color: '#888',
        fontStyle: 'italic',
        textAlign: 'center',
        marginTop: 10,
        width: '100%',
        paddingHorizontal: 16,
    },
    postsContainer: {
        // Removed flex: 1 to let ScrollView handle height
        paddingBottom: 20,
    },
    gridItem: {
        flex: 1 / 3,
        aspectRatio: 1,
        padding: 1.5,
    },
    gridImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#333',
    },
    gridPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Modal Styles
    detailOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.97)',
    },
    detailScroll: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
        paddingHorizontal: 15,
    },
    closeButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        right: 15,
        zIndex: 10,
    },
    detailAuthor: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        paddingHorizontal: 5,
    },
    detailAuthorImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: '#555',
    },
    detailAuthorName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    detailImage: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 8,
        marginBottom: 15,
        backgroundColor: '#222',
    },
    detailContent: {
        alignItems: 'center',
    },
    detailCaption: {
        color: '#eee',
        fontSize: 15,
        lineHeight: 21,
        marginBottom: 20,
    },
    detailActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    likeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    commentBubble: {
        backgroundColor: '#1e1e1e',
        padding: 12,
        borderRadius: 8,
        marginBottom: 10,
    },
    commentUser: {
        color: '#aaa',
        fontWeight: 'bold',
        fontSize: 13,
        marginBottom: 4,
    },
    commentText: {
        color: '#eee',
        fontSize: 14,
    },
    commentInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#333',
        backgroundColor: '#121212',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#2a2a2a',
        color: '#fff',
        paddingHorizontal: 15,
        paddingVertical: Platform.OS === 'ios' ? 12 : 8,
        borderRadius: 20,
        marginRight: 10,
        fontSize: 15,
    },
});