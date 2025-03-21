import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Dimensions,
  TouchableOpacity,
  Text
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const horizontalPadding = 16; // Padding en ambos lados
const sliderWidth = width - horizontalPadding * 2; // Ancho efectivo del slider

// Datos para el slider (Weekly Events)
const weeklyEvents = [
  { 
    id: 'event1', 
    image: require('../../assets/images/img1.jpg'),
    user: { name: 'Juan Pérez', image: require('../../assets/images/img7.jpg') }
  },
  { 
    id: 'event2', 
    image: require('../../assets/images/img2.jpg'),
    user: { name: 'María López', image: require('../../assets/images/img7.jpg') }
  },
  { 
    id: 'event3', 
    image: require('../../assets/images/img3.jpg'),
    user: { name: 'Carlos García', image: require('../../assets/images/img7.jpg') }
  },
];

// Datos para el grid de publicaciones
const postsData = [
  { 
    id: 'post1', 
    image: require('../../assets/images/img4.jpg'),
    user: { name: 'Ana Martínez', image: require('../../assets/images/img7.jpg') }
  },
  { 
    id: 'post2', 
    image: require('../../assets/images/img5.jpg'),
    user: { name: 'Pedro Sánchez', image: require('../../assets/images/img7.jpg') }
  },
  { 
    id: 'post3', 
    image: require('../../assets/images/img6.jpg'),
    user: { name: 'Laura Torres', image: require('../../assets/images/img7.jpg') }
  },
  { 
    id: 'post4', 
    image: require('../../assets/images/img7.jpg'),
    user: { name: 'Roberto Díaz', image: require('../../assets/images/img7.jpg') }
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
                source={item.image}
                style={[styles.sliderImage, { width: sliderWidth, height: sliderWidth * 0.7 }]}
                resizeMode="cover"
              />
              <View style={styles.sliderOverlay}>
                <Image
                  source={item.user.image}
                  style={styles.publisherImage}
                />
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

  const goToPostDetail = (item: any) => {
    router.push({
      pathname: '/extra/publication-detail',
      params: { post: JSON.stringify(item) },
    });
  };

  const renderPost = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.postCard} onPress={() => goToPostDetail(item)}>
      <Image source={item.image} style={styles.postImage} resizeMode="cover" />
      <View style={styles.postOverlay}>
        <View style={styles.postUserInfo}>
          <Image source={item.user.image} style={styles.postUserImage} />
          <Text style={styles.postUserName}>{item.user.name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <FlatList
      data={postsData}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={styles.postRow}
      renderItem={renderPost}
      ListHeaderComponent={<WeeklyEventsSlider />}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    />
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#121212' 
  },
  contentContainer: { 
    padding: 16 
  },
  /* --- Slider Styles --- */
  sliderWrapper: { marginBottom: 24 },
  sliderTitle: { 
    fontSize: 28, 
    color: '#fff', 
    fontWeight: 'bold', 
    marginBottom: 12,
    textAlign: 'center',
  },
  roundedContainer: { 
    borderRadius: 20, 
    overflow: 'hidden' 
  },
  sliderImage: { 
    height: width * 0.7, // La altura se ajusta proporcionalmente al ancho del slider
  },
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
    marginRight: 8 
  },
  publisherName: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  pagination: { 
    flexDirection: 'row', 
    alignSelf: 'center', 
    marginTop: 8 
  },
  dot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    backgroundColor: 'gray', 
    marginHorizontal: 4 
  },
  dotActive: { 
    backgroundColor: '#bb86fc', 
    width: 10, 
    height: 10 
  },
  /* --- Posts Grid Styles --- */
  postRow: { 
    justifyContent: 'space-between', 
    marginBottom: 16 
  },
  postCard: { 
    width: '48%', 
    borderRadius: 12, 
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    marginBottom: 16,
    elevation: 2,
  },
  postImage: { 
    width: '100%', 
    height: 140 
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  postUserInfo: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  postUserImage: { 
    width: 20, 
    height: 20, 
    borderRadius: 10, 
    marginRight: 6 
  },
  postUserName: { 
    color: '#fff', 
    fontSize: 12 
  },
});
