import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function CreatePost() {
  const [postName, setPostName] = useState('');
  const [postDescription, setPostDescription] = useState('');
  const [postImage, setPostImage] = useState(null);

  const handleAddPost = async () => {
    if (!postName || !postDescription || !postImage) {
      Alert.alert('Error', 'Please fill in all fields and select an image.');
      return;
    }

    try {
      const { error } = await supabase.from('posts').insert({
        name: postName,
        description: postDescription,
        image_url: postImage,
        user_id: (await supabase.auth.getUser()).data?.user?.id,
      });

      if (error) throw error;

      Alert.alert('Success', 'Post added successfully!');
      setPostName('');
      setPostDescription('');
      setPostImage(null);
    } catch (error) {
      console.error('Error adding post:', error);
      Alert.alert('Error', 'Failed to add post.');
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        placeholder="Post Name"
        value={postName}
        onChangeText={setPostName}
        style={{ marginBottom: 16, borderWidth: 1, padding: 8 }}
      />
      <TextInput
        placeholder="Post Description"
        value={postDescription}
        onChangeText={setPostDescription}
        style={{ marginBottom: 16, borderWidth: 1, padding: 8 }}
      />
      <TouchableOpacity onPress={() => {/* Image picker logic */}} style={{ marginBottom: 16, padding: 8, backgroundColor: '#ddd' }}>
        <Text>{postImage ? 'Change Image' : 'Select Image'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleAddPost} style={{ padding: 8, backgroundColor: '#007bff' }}>
        <Text style={{ color: '#fff' }}>Add Post</Text>
      </TouchableOpacity>
    </View>
  );
} 