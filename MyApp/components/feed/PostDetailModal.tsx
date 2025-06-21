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

  if (!post) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.detailOverlay}
      >
        <ScrollView 
          style={styles.detailScroll}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close-circle" size={32} color="#aaa" />
          </TouchableOpacity>

          {/* Author Info */}
          <TouchableOpacity
            onPress={() => {
              onClose(); // Cerrar el modal actual
              router.push(`/extra/friendProfile?uid=${post.user?.id}`);
            }}
            style={styles.authorContainer}
          >
            <Image
              source={
                post.user?.image || require('../../assets/images/img7.jpg')
              }
              style={styles.detailAuthorImage}
            />
            <Text style={styles.detailAuthorName}>{post.user?.name || 'Usuario'}</Text>
          </TouchableOpacity>

          {/* Image */}
          {post.image && (
            <Image
              source={{ uri: post.image }}
              style={styles.detailImage}
            />
          )}

          {/* Delete Button (only for post owner) */}
          {post.userId === currentUserId && (
            <View style={{ width: '100%', alignItems: 'flex-end', marginTop: 8 }}>
              <TouchableOpacity onPress={() => onDeletePost(post.id)}>
                <Ionicons name="trash-outline" size={24} color="red" />
              </TouchableOpacity>
            </View>
          )}

          {/* Content/Caption */}
          <View style={styles.detailContent}>
            <Text style={styles.detailCaption}>{post.content || post.caption}</Text>

            {/* Like Button */}
            <View style={{ width: '100%', marginTop: 16, alignItems: 'flex-start' }}>
              <TouchableOpacity onPress={onToggleLike} style={styles.likeButton}>
                <Ionicons
                  name={isLiked ? "heart" : "heart-outline"}
                  size={28}
                  color={isLiked ? "#e91e63" : "#fff"}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.actionText}>{post.likeCount || 0} Me gusta</Text>
            
            {/* Comments */}
            <View style={{ width: '100%', marginTop: 16 }}>
              {loadingComments ? (
                <ActivityIndicator color="#bb86fc" />
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <View key={comment.id} style={styles.commentCard}>
                    <TouchableOpacity 
                      onPress={() => {
                        onClose(); // Cerrar el modal actual
                        router.push(`/extra/friendProfile?uid=${comment.user?.id}`);
                      }}
                      style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                      <Image
                        source={
                          comment.user?.image
                            ? typeof comment.user.image === 'string'
                              ? { uri: comment.user.image }
                              : comment.user.image
                            : require('../../assets/images/img7.jpg')
                        }
                        style={styles.commentUserImage}
                      />
                      <Text style={styles.commentUserName}>{comment.user?.name || 'Usuario'}</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#333' }}>{comment.text}</Text>
                    </View>
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
          <TouchableOpacity onPress={onAddComment} disabled={!newComment.trim()}>
            <Ionicons 
              name="send" 
              size={24} 
              color={newComment.trim() ? "#bb86fc" : "#888"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailScroll: {
    width: Platform.OS === 'web' ? 600 : '100%',
    maxHeight: '90%',
    backgroundColor: '#121212',
    borderRadius: 20,
    padding: 20,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 15,
    zIndex: 10,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
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
    height: 240,
    borderRadius: 16,
    marginBottom: 16,
  },
  detailContent: {
    alignItems: 'center',
  },
  detailCaption: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    alignSelf: 'flex-start',
    textAlign: 'left',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  actionText: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
    maxWidth: 800,
  },
  commentUserImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  commentUserName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  commentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#bb86fc',
    borderRadius: 12,
    padding: 10,
    gap: 8,
  },
  noDataText: {
    color: '#888',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 10,
    width: '100%',
    paddingHorizontal: 16,
  },
});