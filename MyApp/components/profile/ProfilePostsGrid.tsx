import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity,
  Dimensions,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const numColumns = Platform.OS === 'web' ? 3 : 2;
const itemWidth = (width - 48) / numColumns;

interface Post {
  id: string;
  image: string;
  userId: string;
  caption?: string;
  createdAt: any;
}

interface ProfilePostsGridProps {
  posts: Post[];
  onPostPress: (post: Post) => void;
  onCreatePost?: () => void;
  isOwnProfile: boolean;
}

export default function ProfilePostsGrid({
  posts,
  onPostPress,
  onCreatePost,
  isOwnProfile
}: ProfilePostsGridProps) {
  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={64} color="#555" />
        <Text style={styles.emptyText}>
          {isOwnProfile 
            ? 'No has publicado nada todavía' 
            : 'Este usuario no tiene publicaciones'}
        </Text>
        
        {isOwnProfile && onCreatePost && (
          <TouchableOpacity style={styles.createButton} onPress={onCreatePost}>
            <Text style={styles.createButtonText}>Crear publicación</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.postItem}
            onPress={() => onPostPress(item)}
          >
            <Image
              source={{ uri: item.image }}
              style={styles.postImage}
            />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 12,
  },
  postItem: {
    width: itemWidth,
    height: itemWidth,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
  },
  postImage: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#bb86fc',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#121212',
    fontWeight: 'bold',
  },
});