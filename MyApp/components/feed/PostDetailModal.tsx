import React from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Post } from '../../services/postService';
import { Comment } from '../../services/commentService';
import { useRouter } from 'expo-router';

interface PostDetailModalProps {
  post: Post | null;
  isVisible: boolean;
  onClose: () => void;
  onToggleLike: () => void;
  onDeletePost: (postId: string) => void;
  isLiked: boolean;
  comments: Comment[];
  newComment: string;
  setNewComment: (text: string) => void;
  onAddComment: () => void;
  loadingComments: boolean;
  currentUserId: string;
}

export default function PostDetailModal({
  post,
  isVisible,
  onClose,
  onToggleLike,
  onDeletePost,
  isLiked,
  comments,
  newComment,
  setNewComment,
  onAddComment,
  loadingComments,
  currentUserId
}: PostDetailModalProps) {
  const router = useRouter();

  const getImageSource = (imageData: any, fallbackImage: any = require('../../assets/images/img7.jpg')) => {
    if (!imageData) {
      return fallbackImage;
    }
    
    if (typeof imageData === 'string') {
      return { uri: imageData };
    }
    
    if (typeof imageData === 'object') {
      if (imageData.uri) {
        return { uri: imageData.uri };
      }
      if (imageData.url) {
        return { uri: imageData.url };
      }
      if (imageData.source) {
        return { uri: imageData.source };
      }
    }
    
    return fallbackImage;
  };

  if (!post) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          {/* Header con botón de cerrar */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
            {post.userId === currentUserId && (
              <TouchableOpacity 
                onPress={() => onDeletePost(post.id)}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={24} color="#ff4757" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Información del autor */}
            <TouchableOpacity
              onPress={() => {
                onClose();
                router.push(`/extra/friendProfile?uid=${post.user?.id}`);
              }}
              style={styles.authorSection}
            >
              <Image
                source={getImageSource(post.user?.image)}
                style={styles.authorAvatar}
              />
              <View style={styles.authorInfo}>
                <Text style={styles.authorName}>{post.user?.name || 'Usuario'}</Text>
                <Text style={styles.postTime}>Hace 2 horas</Text>
              </View>
            </TouchableOpacity>

            {/* Imagen del post */}
            {post.image && (
              <View style={styles.imageContainer}>
                <Image
                  source={getImageSource(post.image)}
                  style={styles.postImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Acciones (like, comentarios) */}
            <View style={styles.actionsSection}>
              <TouchableOpacity onPress={onToggleLike} style={styles.actionButton}>
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={26}
                  color={isLiked ? "#ff3742" : "#fff"}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="paper-plane-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Contador de likes */}
            <View style={styles.likesSection}>
              <Text style={styles.likesText}>
                {post.likeCount || 0} {(post.likeCount || 0) === 1 ? 'me gusta' : 'me gusta'}
              </Text>
            </View>

            {/* Caption/Contenido */}
            <View style={styles.captionSection}>
              <Text style={styles.captionText}>
                <Text style={styles.captionAuthor}>{post.user?.name || 'Usuario'} </Text>
                {post.caption}
              </Text>
            </View>

            {/* Sección de comentarios */}
            <View style={styles.commentsSection}>
              <Text style={styles.commentsTitle}>Comentarios</Text>
              
              {loadingComments ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#bb86fc" size="small" />
                  <Text style={styles.loadingText}>Cargando comentarios...</Text>
                </View>
              ) : comments.length > 0 ? (
                <View style={styles.commentsList}>
                  {comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <TouchableOpacity 
                        onPress={() => {
                          onClose();
                          router.push(`/extra/friendProfile?uid=${comment.user?.id}`);
                        }}
                        style={styles.commentAuthor}
                      >
                        <Image
                          source={getImageSource(comment.user?.image)}
                          style={styles.commentAvatar}
                        />
                        <View style={styles.commentContent}>
                          <Text style={styles.commentText}>
                            <Text style={styles.commentAuthorName}>
                              {comment.user?.name || 'Usuario'}
                            </Text>
                            {' '}{comment.text}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.noCommentsContainer}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#555" />
                  <Text style={styles.noCommentsText}>Aún no hay comentarios</Text>
                  <Text style={styles.noCommentsSubtext}>¡Sé el primero en comentar!</Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Input de comentarios */}
          <View style={styles.commentInputContainer}>
            <Image
              source={getImageSource(null)} // Imagen del usuario actual
              style={styles.inputAvatar}
            />
            <TextInput
              style={styles.commentInput}
              placeholder="Añadir un comentario..."
              placeholderTextColor="#888"
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              onPress={onAddComment} 
              disabled={!newComment.trim()}
              style={[
                styles.sendButton,
                { opacity: newComment.trim() ? 1 : 0.5 }
              ]}
            >
              <Ionicons 
                name="send" 
                size={20} 
                color={newComment.trim() ? "#bb86fc" : "#888"} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    marginTop: Platform.OS === 'ios' ? 50 : 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  authorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#333',
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  postTime: {
    color: '#888',
    fontSize: 12,
  },
  imageContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  postImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#333',
  },
  actionsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  actionButton: {
    marginRight: 15,
    padding: 5,
  },
  likesSection: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  likesText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  captionSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  captionText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 20,
  },
  captionAuthor: {
    fontWeight: '600',
  },
  commentsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  commentsTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#888',
    marginLeft: 10,
    fontSize: 14,
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    marginBottom: 8,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    marginRight: 10,
  },
  commentContent: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  commentText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 18,
  },
  commentAuthorName: {
    fontWeight: '600',
    color: '#bb86fc',
  },
  noCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noCommentsText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  noCommentsSubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    backgroundColor: '#1a1a1a',
  },
  inputAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    marginRight: 10,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    color: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 15,
    maxHeight: 100,
    marginRight: 10,
  },
  sendButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(187, 134, 252, 0.1)',
  },
});