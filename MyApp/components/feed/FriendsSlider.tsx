import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { Post } from '../../services/postService';

const { width } = Dimensions.get('window');
const horizontalPadding = 16;
const sliderWidth = width - horizontalPadding * 4;

interface FriendsSliderProps {
  friendPosts: Post[];
  onPressItem: (item: Post) => void;
}

export default function FriendsSlider({ friendPosts, onPressItem }: FriendsSliderProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / sliderWidth);
    setActiveIndex(index);
  };

  if (!friendPosts.length) {
    return null;
  }

  return (
    <View style={[styles.sliderWrapper, { paddingHorizontal: horizontalPadding }]}>
      <Text style={styles.sliderTitle}></Text>
      
      <FlatList
        data={friendPosts}
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
            onPress={() => onPressItem(item)}
            style={{ width: sliderWidth }}
          >
            <View style={[styles.roundedContainer, { width: sliderWidth }]}>
              <Image
                source={
                  typeof item.image === 'string'
                    ? { uri: item.image } 
                    : item.image
                }
                style={[styles.sliderImage, { width: sliderWidth, height: sliderWidth * 0.7 }]}
                resizeMode="cover"
              />
              <View style={styles.sliderOverlay}>
                <Image 
                  source={item.user?.image || require('../../assets/images/img7.jpg')} 
                  style={styles.publisherImage} 
                />
                <Text style={styles.publisherName}>{item.user?.name || 'Usuario'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      
      <View style={styles.pagination}>
        {friendPosts.map((_, index) => (
          <View 
            key={index} 
            style={[styles.dot, activeIndex === index ? styles.dotActive : null]} 
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sliderWrapper: { 
    marginBottom: 24 
  },
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
    marginHorizontal: 4,
  },
  dotActive: { 
    backgroundColor: '#bb86fc', 
    width: 10, 
    height: 10 
  },
  sliderImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
  },
});