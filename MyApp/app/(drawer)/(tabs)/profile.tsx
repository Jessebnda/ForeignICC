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
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    RefreshControl // Import RefreshControl
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
    // Add necessary functions for modal actions if implementing them fully
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
    const [refreshing, setRefreshing] = useState(false); // State for RefreshControl

    // --- Modal State & Basic Handlers ---
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [liked, setLiked] = useState(false); // This likely needs to be per-post
    const [loadingComments, setLoadingComments] = useState(false);

    // --- Fetch User Posts Function ---
    const fetchUserPosts = useCallback(async () => {
        if (!user?.uid) {
            setPosts([]);
            setLoadingPosts(false);
            return;
        }

        console.log("ProfileScreen - Fetching posts for user:", user.uid);
        setLoadingPosts(true);
        try {
            const postsQuery = query(
                collection(firestore, 'feedPosts'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(postsQuery);

            const postPromises = snapshot.docs.map(async (docPost) => {
                const data = docPost.data();
                const postUserId = data.userId;

                // Skip processing if the post doesn't belong to the current user
                if (postUserId !== user.uid) {
                    return null; // Return null for posts not by the current user
                }

                let authorData = {
                    name: 'Usuario Desconocido',
                    photo: defaultUserImage,
                };

                // Fetch author details (even if it's the current user, to ensure consistency)
                if (postUserId) {
                    try {
                        const userDocRef = doc(firestore, 'users', postUserId);
                        const userDocSnap = await getDoc(userDocRef);
                        if (userDocSnap.exists()) {
                            const userInfo = userDocSnap.data();
                            authorData = {
                                name: userInfo.name || 'Usuario sin nombre',
                                photo: userInfo.photo ? { uri: userInfo.photo } : defaultUserImage,
                            };
                        }
                    } catch (error) {
                        console.error(`❌ Error fetching user data for post ${docPost.id}:`, error);
                    }
                }

                // Construct the Post object according to the Post type definition
                return {
                    id: docPost.id,
                    userId: postUserId,
                    imageUrl: data.image || null, // Handle cases where image might be missing
                    content: data.caption || '',
                    userName: authorData.name, // Use top-level userName
                    userPhoto: authorData.photo, // Use top-level userPhoto
                    likes: data.likes || {},
                    comments: data.comments || [], // Assuming comments are stored directly; adjust if needed
                    createdAt: data.createdAt, // Keep timestamp
                    // Add any other fields required by your Post type
                } as Post;
            });

            const loadedPosts = (await Promise.all(postPromises))
                                    .filter(post => post !== null) as Post[]; // Filter out nulls and cast

            console.log("ProfileScreen - Fetched user posts count:", loadedPosts.length);
            setPosts(loadedPosts);

        } catch (error) {
            console.error('❌ Error fetching user posts:', error);
            setPosts([]); // Clear posts on error
        } finally {
            setLoadingPosts(false);
        }
    }, [user]); // Dependency: user object

    // --- Initial Fetch Effect ---
    useEffect(() => {
        fetchUserPosts();
    }, [fetchUserPosts]); // Use the memoized fetch function

    // --- Refresh Handler ---
    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            // Refresh profile data first (optional, but good practice)
            await refreshProfile();
            // Then refresh posts
            await fetchUserPosts();
        } catch (error) {
            console.error("Error during refresh:", error);
        } finally {
            setRefreshing(false);
        }
    }, [refreshProfile, fetchUserPosts]); // Dependencies for refresh

    // --- Navigation ---
    const navigateToEditProfile = () => {
        if (!userProfile) return;
        router.push({
            pathname: '/extra/edit-profile',
            params: { profile: JSON.stringify(userProfile) }
        });
    };

    // --- Modal Handlers (Placeholders - Implement actual logic) ---
    const handlePostPress = async (post: Post) => {
        console.log("Opening post:", post.id);
        setSelectedPost(post);
        // Reset modal-specific states
        setLiked(false); // You'll need to check if the current user liked *this* post
        setComments([]);
        setNewComment('');
        // await loadComments(post.id); // Load comments when modal opens
    };

    const loadComments = async (postId: string) => {
        console.log("Loading comments for:", postId);
        setLoadingComments(true);
        // --- Add Firestore logic to fetch comments for postId ---
        // Example:
        // const commentsQuery = query(collection(firestore, 'feedPosts', postId, 'comments'), orderBy('createdAt', 'asc'));
        // const snapshot = await getDocs(commentsQuery);
        // const fetchedComments = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Comment));
        // setComments(fetchedComments);
        setLoadingComments(false);
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedPost || !user) return;
        console.log("Adding comment:", newComment);
        // --- Add Firestore logic to add a new comment ---
        // Example:
        // const commentData = { userId: user.uid, text: newComment, createdAt: serverTimestamp(), userName: userProfile?.name || 'Usuario' };
        // await addDoc(collection(firestore, 'feedPosts', selectedPost.id, 'comments'), commentData);
        // setNewComment('');
        // await loadComments(selectedPost.id); // Refresh comments
    };

    const toggleLike = async () => {
        if (!selectedPost || !user) return;
        console.log("Toggling like for:", selectedPost.id);
        // --- Add Firestore logic to update likes ---
        // Example:
        // const postRef = doc(firestore, 'feedPosts', selectedPost.id);
        // const currentLikes = selectedPost.likes || {};
        // const userId = user.uid;
        // let updatedLikes = { ...currentLikes };
        // if (updatedLikes[userId]) {
        //     delete updatedLikes[userId]; // Unlike
        // } else {
        //     updatedLikes[userId] = true; // Like
        // }
        // await updateDoc(postRef, { likes: updatedLikes });
        // // Update local state immediately for better UX
        // setSelectedPost(prev => prev ? { ...prev, likes: updatedLikes } : null);
        // setLiked(!!updatedLikes[userId]);
    };

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

    return (
        <ScrollView
            style={styles.container}
            refreshControl={ // Add RefreshControl to ScrollView
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    colors={["#bb86fc"]} // Spinner color
                    tintColor={"#bb86fc"} // Spinner color for iOS
                />
            }
        >
            {/* --- Profile Header --- */}
            <View style={styles.profileHeader}>
                <Image
                    source={userProfile?.photo ? { uri: userProfile.photo } : defaultUserImage}
                    style={styles.profileImage}
                />
                <Text style={styles.profileName}>{userProfile?.name || 'Usuario'}</Text>
                <Text style={styles.profileInfo}>{userProfile?.university || 'Universidad no especificada'}</Text>
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={navigateToEditProfile}
                >
                    <Text style={styles.editButtonText}>Editar Perfil</Text>
                </TouchableOpacity>
            </View>

            {/* --- Interests --- */}
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

            {/* --- Posts Grid --- */}
            <View style={styles.postsContainer}>
                <Text style={styles.sectionTitle}>Mis Publicaciones</Text>
                {loadingPosts ? (
                    <ActivityIndicator size="small" color="#bb86fc" style={{ marginTop: 20 }} />
                ) : (
                    <>
                        {posts.length > 0 ? (
                            <FlatList
                                data={posts} // No need to filter here if fetchUserPosts already does it
                                keyExtractor={item => item.id}
                                numColumns={3}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.gridItem}
                                        onPress={() => handlePostPress(item)}
                                    >
                                        {item.imageUrl ? (
                                            <Image
                                                source={{ uri: item.imageUrl }}
                                                style={styles.gridImage}
                                            />
                                        ) : (
                                            // Optional: Placeholder for posts without images
                                            <View style={[styles.gridImage, styles.gridPlaceholder]}>
                                                <Ionicons name="image-outline" size={24} color="#555" />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                )}
                                scrollEnabled={false} // Disable FlatList scrolling inside ScrollView
                                // Optional: Add ListEmptyComponent if needed, though handled below
                            />
                        ) : (
                            <Text style={styles.noDataText}>No has publicado nada todavía.</Text>
                        )}
                    </>
                )}
            </View>

            {/* --- Post Detail Modal --- */}
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
                                <Image source={selectedPost.userPhoto} style={styles.detailAuthorImage} />
                                <Text style={styles.detailAuthorName}>{selectedPost.userName}</Text>
                            </View>

                            {/* Image */}
                            {selectedPost.imageUrl && (
                                <Image source={{ uri: selectedPost.imageUrl }} style={styles.detailImage} />
                            )}

                            {/* Content/Caption */}
                            <View style={styles.detailContent}>
                                <Text style={styles.detailCaption}>{selectedPost.content}</Text>

                                {/* Like Button & Stats */}
                                <View style={styles.detailActions}>
                                    <TouchableOpacity onPress={toggleLike} style={styles.likeButton}>
                                        <Ionicons
                                            name={liked ? "heart" : "heart-outline"}
                                            size={28}
                                            color={liked ? "#e91e63" : "#fff"}
                                        />
                                        {/* Optional: Display like count */}
                                        {/* <Text style={styles.statsTextDetail}>{Object.keys(selectedPost.likes || {}).length} Likes</Text> */}
                                    </TouchableOpacity>
                                    {/* Add comment icon/button if needed */}
                                </View>

                                {/* Comments Section */}
                                <Text style={styles.sectionTitle}>Comentarios</Text>
                                {loadingComments ? (
                                    <ActivityIndicator color="#bb86fc" />
                                ) : (
                                    <>
                                        {comments.length > 0 ? (
                                            comments.map((comment) => (
                                                <View key={comment.id} style={styles.commentBubble}>
                                                    <Text style={styles.commentUser}>{comment.userName || 'Usuario'}</Text>
                                                    <Text style={styles.commentText}>{comment.text}</Text>
                                                </View>
                                            ))
                                        ) : (
                                            <Text style={styles.noDataText}>No hay comentarios aún.</Text>
                                        )}
                                    </>
                                )}
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
                            <TouchableOpacity onPress={handleAddComment}>
                                <Ionicons name="send" size={24} color="#bb86fc" />
                            </TouchableOpacity>
                        </View>
                    </KeyboardAvoidingView>
                </Modal>
            )}
        </ScrollView>
    );
}

// --- Styles ---
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
        backgroundColor: '#1a1a1a', // Slightly different background for header
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
        marginBottom: 16, // Increased space before button
    },
    editButton: {
        borderColor: '#bb86fc',
        borderWidth: 1,
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 25, // Make button slightly wider
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
        paddingHorizontal: 16, // Add padding to titles
    },
    interestsContainer: {
        marginBottom: 24,
    },
    interestsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16, // Add padding
    },
    interestChip: {
        backgroundColor: '#2a2a2a',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16, // Slightly less rounded
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
        marginTop: 10, // Reduced margin
        width: '100%', // Ensure it takes full width for centering
        paddingHorizontal: 16,
    },
    postsContainer: {
        flex: 1, // Allow container to fill remaining space if needed
        paddingBottom: 20, // Add padding at the bottom
    },
    gridItem: {
        flex: 1 / 3,
        aspectRatio: 1, // Maintain square shape
        padding: 1.5, // Small gap between items
    },
    gridImage: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: '#333', // Placeholder background
    },
    gridPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    // --- Modal Styles ---
    detailOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.97)', // Darker overlay
    },
    detailScroll: {
        flex: 1, // Allow scrollview to take available space
        paddingTop: Platform.OS === 'ios' ? 50 : 30, // More space at top
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
        paddingHorizontal: 5, // Slight indent
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
        backgroundColor: '#222', // Placeholder bg
    },
    detailContent: {
        paddingBottom: 80, // Ensure space below content above input
    },
    detailCaption: {
        color: '#eee', // Brighter caption text
        fontSize: 15,
        lineHeight: 21, // Adjust line height
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
        padding: 8, // Add padding for easier tapping
        // Removed background and border radius from previous attempt
    },
    statsTextDetail: {
        color: '#fff',
        fontSize: 16,
        marginLeft: 8,
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
        backgroundColor: '#121212', // Match container background
        position: 'absolute', // Keep input at bottom
        bottom: 0,
        left: 0,
        right: 0,
    },
    commentInput: {
        flex: 1,
        backgroundColor: '#2a2a2a',
        color: '#fff',
        paddingHorizontal: 15, // More padding
        paddingVertical: Platform.OS === 'ios' ? 12 : 8, // Adjust padding per platform
        borderRadius: 20,
        marginRight: 10,
        fontSize: 15,
    },
});