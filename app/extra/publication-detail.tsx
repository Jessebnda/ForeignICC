import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PublicationDetailScreen() {
  const { post: postParam } = useLocalSearchParams();
  const post = postParam ? JSON.parse(postParam as string) : { 
    user: { name: 'Usuario', image: require('../../assets/images/img7.jpg') }, 
    content: 'Contenido de la publicación',
    image: require('../../assets/images/img1.jpg'),
    likes: 0,
    comments: []
  };

  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([
    { id: 'c1', user: { name: 'Alice', image: require('../../assets/images/img7.jpg') }, text: 'Comentario prueba 1', likes: 2 },
    { id: 'c2', user: { name: 'Bob', image: require('../../assets/images/img7.jpg') }, text: 'Comentario prueba 2', likes: 1 },
    { id: 'c3', user: { name: 'Carol', image: require('../../assets/images/img7.jpg') }, text: 'Comentario prueba 3', likes: 0 },
  ]);

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: `c${Date.now()}`,
      user: { name: 'Tú', image: require('../../assets/images/img7.jpg') },
      text: newComment.trim(),
      likes: 0
    };
    setComments([comment, ...comments]);
    setNewComment('');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Image source={post.image} style={styles.image} />
        <View style={styles.content}>
          <View style={styles.userInfo}>
            <Image source={post.user.image} style={styles.avatar} />
            <View>
              <Text style={styles.userName}>{post.user.name}</Text>
              <Text style={styles.timestamp}>Hace 2 horas</Text>
            </View>
          </View>
          <Text style={styles.postContent}>{post.content}</Text>
          
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="heart-outline" size={24} color="#fff" />
              <Text style={styles.actionText}>{post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="chatbubble-outline" size={24} color="#fff" />
              <Text style={styles.actionText}>{comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="share-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Comentarios</Text>
          {comments.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <Image source={comment.user.image} style={styles.commentAvatar} />
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUser}>{comment.user.name}</Text>
                  <Text style={styles.commentTime}>Hace 1 hora</Text>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
                <View style={styles.commentActions}>
                  <TouchableOpacity style={styles.commentActionButton}>
                    <Ionicons name="heart-outline" size={16} color="#888" />
                    <Text style={styles.commentActionText}>{comment.likes}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.commentActionButton}>
                    <Ionicons name="chatbubble-outline" size={16} color="#888" />
                    <Text style={styles.commentActionText}>Responder</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un comentario..."
          placeholderTextColor="#888"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]} 
          onPress={addComment}
          disabled={!newComment.trim()}
        >
          <Ionicons name="send" size={20} color={newComment.trim() ? '#fff' : '#888'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  scrollView: { flex: 1 },
  image: { width: '100%', height: 300, borderBottomLeftRadius: 12, borderBottomRightRadius: 12 },
  content: { padding: 16 },
  userInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12, borderWidth: 2, borderColor: '#bb86fc' },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
  timestamp: { fontSize: 12, color: '#888', marginTop: 2 },
  postContent: { fontSize: 16, color: '#fff', marginBottom: 12, lineHeight: 24 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333'
  },
  actionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 24 },
  actionText: { color: '#fff', marginLeft: 4, fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginBottom: 12 },
  commentCard: { flexDirection: 'row', marginBottom: 16, backgroundColor: '#1e1e1e', padding: 12, borderRadius: 12, elevation: 1 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 12 },
  commentContent: { flex: 1 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  commentUser: { fontWeight: 'bold', color: '#fff' },
  commentTime: { fontSize: 12, color: '#888' },
  commentText: { color: '#fff', marginBottom: 8, lineHeight: 20 },
  commentActions: { flexDirection: 'row', alignItems: 'center' },
  commentActionButton: { flexDirection: 'row', alignItems: 'center', marginRight: 16 },
  commentActionText: { color: '#888', marginLeft: 4, fontSize: 12 },
  inputContainer: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderColor: '#333', backgroundColor: '#1e1e1e' },
  input: { flex: 1, backgroundColor: '#333', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, color: '#fff', marginRight: 8, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#bb86fc', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#333' },
});
