import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  Text
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { firestore } from '../../firebase';

const { width } = Dimensions.get('window');
const horizontalPadding = 16;
const sliderWidth = width - horizontalPadding * 4;

// Slider de eventos locales (puedes reemplazar luego por datos reales)
const weeklyEvents = [
  {
    id: 'event1',
    image: require('../../assets/images/img1.jpg'),
    user: { name: 'Juan Pérez', image: require('../../assets/images/img7.jpg') },
    content: 'Evento semanal de cultura local',
    likes: 12,
    comments: []
  },
  {
    id: 'event2',
    image: require('../../assets/images/img2.jpg'),
    user: { name: 'María López', image: require('../../assets/images/img7.jpg') },
    content: 'Exposición de arte moderno',
    likes: 8,
    comments: []
  },
];

function WeeklyEventsSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();

  const onScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / sliderWidth);
    setActiveIndex(index);
  };

  const goToPublicationDetail = (item: any) => {
    router.push({
      pathname: '/extra/publication-detail',
      params: { post: JSON.stringify(item) },
    });
  };

  return (
    <View style={[styles.sliderWrapper, { paddingHorizontal: horizontalPadding }]}>
      <Text style={styles.sliderTitle}>Weekly Events</Text>
      <FlatList
        data={weeklyEvents}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        snapToInterval={sliderWidth}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => goToPublicationDetail(item)}
            style={{ width: sliderWidth }}
          >
            <View style={[styles.roundedContainer, { width: sliderWidth }]}>
              <Image
                source={
                  typeof item.image === 'string'
                    ? { uri: `data:image/jpeg;base64,${item.image}` }
                    : item.image
                }
                style={[styles.sliderImage, { width: sliderWidth, height: sliderWidth * 0.7 }]}
                resizeMode="cover"
              />
              <View style={styles.sliderOverlay}>
                <Image source={item.user.image} style={styles.publisherImage} />
                <Text style={styles.publisherName}>{item.user.name}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <View style={styles.pagination}>
        {weeklyEvents.map((_, index) => (
          <View key={index} style={[styles.dot, activeIndex === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<any[]>([]);

  const goToCreatePost = () => {
    router.push({ pathname: '/extra/crearpubli' });
  };

  const goToPostDetail = (item: any) => {
    router.push({
      pathname: '/extra/publication-detail',
      params: { post: JSON.stringify(item) },
    });
  };

  const renderPost = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.postCard} onPress={() => goToPostDetail(item)}>
      <Image
        source={
          typeof item.image === 'string'
            ? { uri: `data:image/jpeg;base64,${item.image}` }
            : item.image
        }
        style={styles.postImage}
        resizeMode="cover"
      />
      <View style={styles.postOverlay}>
        <View style={styles.postUserInfo}>
          <Image
            source={item.user.image || require('../../assets/images/img7.jpg')}
            style={styles.postUserImage}
          />
          <Text style={styles.postUserName}>{item.user.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // 🔄 Cargar publicaciones desde Firestore
  useFocusEffect(
    useCallback(() => {
      const fetchPosts = async () => {
        try {
          const q = query(collection(firestore, 'feedPosts'), orderBy('createdAt', 'desc'));
          const snapshot = await getDocs(q);

          const loadedPosts = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              image: data.base64Image,
              user: {
                name: data.userId,
                image: require('../../assets/images/img7.jpg') // Puedes mejorar esto si guardas también el avatar
              },
              content: data.caption,
              likes: data.likes ? Object.keys(data.likes).length : 0,
              comments: data.comments || [],
            };
          });

          setPosts(loadedPosts);
        } catch (error) {
          console.error('❌ Error al cargar publicaciones:', error);
        }
      };

      fetchPosts();
    }, [])
  );

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.postRow}
        renderItem={renderPost}
        ListHeaderComponent={<WeeklyEventsSlider />}
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      />

      <TouchableOpacity style={styles.fab} onPress={goToCreatePost}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  contentContainer: { padding: 16 },

  // Slider
  sliderWrapper: { marginBottom: 24 },
  sliderTitle: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  roundedContainer: { borderRadius: 20, overflow: 'hidden' },
  sliderImage: { height: width * 0.7 },
  sliderOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  publisherImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#fff',
    marginRight: 8,
  },
  publisherName: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  pagination: { flexDirection: 'row', alignSelf: 'center', marginTop: 8 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'gray',
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: '#bb86fc', width: 10, height: 10 },

  // Grid de posts
  postRow: { justifyContent: 'space-between', marginBottom: 16 },
  postCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    marginBottom: 16,
    elevation: 2,
  },
  postImage: { width: '100%', height: 140 },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  postUserInfo: { flexDirection: 'row', alignItems: 'center' },
  postUserImage: { width: 20, height: 20, borderRadius: 10, marginRight: 6 },
  postUserName: { color: '#fff', fontSize: 12 },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#4f0c2e',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  fabText: {
    color: 'white',
    fontSize: 32,
    lineHeight: 34,
  },
});
