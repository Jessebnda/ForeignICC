import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AnswerDetailScreen() {
  const router = useRouter();
  const { answer: answerParam } = useLocalSearchParams();
  const answer = answerParam ? JSON.parse(answerParam as string) : {
    content: '',
    comments: [],
    user: { name: 'Usuario', image: require('../../assets/images/img7.jpg') },
    timestamp: 'Hace 2 horas',
    likes: 0
  };

  const [comments, setComments] = useState<any[]>(answer.comments || []);
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  const addComment = () => {
    if (!newComment.trim()) return;
    const comment = {
      id: `com-${Date.now()}`,
      content: newComment.trim(),
      user: { name: 'Tú', image: require('../../assets/images/img7.jpg') },
      timestamp: 'Ahora',
      likes: 0
    };
    setComments([comment, ...comments]);
    setNewComment('');
  };

  const toggleLike = () => {
    setIsLiked(!isLiked);
  };

  const renderComment = ({ item }: { item: any }) => (
    <View style={styles.commentCard}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <Image source={item.user.image} style={styles.avatar} />
          <View>
            <Text style={styles.userName}>{item.user.name}</Text>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
        </TouchableOpacity>
      </View>
      <Text style={styles.commentContent}>{item.content}</Text>
      <View style={styles.commentFooter}>
        <TouchableOpacity style={styles.statButton}>
          <Ionicons name="heart-outline" size={16} color="#888" />
          <Text style={styles.statText}>{item.likes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.answerHeader}>
        <View style={styles.userInfo}>
          <Image source={answer.user.image} style={styles.avatar} />
          <View>
            <Text style={styles.userName}>{answer.user.name}</Text>
            <Text style={styles.timestamp}>{answer.timestamp}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#888" />
        </TouchableOpacity>
      </View>
      <Text style={styles.answerContent}>{answer.content}</Text>
      <View style={styles.answerFooter}>
        <TouchableOpacity 
          style={[styles.likeButton, isLiked && styles.likeButtonActive]} 
          onPress={toggleLike}
        >
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={isLiked ? "#bb86fc" : "#888"} 
          />
          <Text style={[styles.likeText, isLiked && styles.likeTextActive]}>
            {answer.likes + (isLiked ? 1 : 0)}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.commentsHeader}>
        <Text style={styles.commentsTitle}>Comentarios ({comments.length})</Text>
      </View>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id}
        renderItem={renderComment}
        contentContainerStyle={styles.listContent}
      />

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
  answerHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1e1e1e'
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#bb86fc'
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff'
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2
  },
  moreButton: {
    padding: 4
  },
  answerContent: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    padding: 16,
    backgroundColor: '#1e1e1e'
  },
  answerFooter: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1e1e1e'
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#333'
  },
  likeButtonActive: {
    backgroundColor: '#bb86fc20'
  },
  likeText: {
    color: '#888',
    marginLeft: 4,
    fontSize: 14
  },
  likeTextActive: {
    color: '#bb86fc'
  },
  commentsHeader: {
    padding: 16,
    backgroundColor: '#1e1e1e'
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  listContent: {
    padding: 16
  },
  commentCard: {
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  commentContent: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
    marginBottom: 8
  },
  commentFooter: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16
  },
  statText: {
    color: '#888',
    marginLeft: 4,
    fontSize: 14
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: '#333',
    backgroundColor: '#1e1e1e'
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#fff',
    marginRight: 8,
    maxHeight: 100
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#bb86fc',
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#333'
  },
});
