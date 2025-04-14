import { supabase } from './supabase';

// User profile table operations
export const userProfile = {
  async create(userId: string, data: {
    full_name: string;
    origin_place?: string;
    profile_image?: string;
    interests?: string[];
  }) {
    const { error } = await supabase
      .from('user_profiles')
      .insert([{ user_id: userId, ...data }]);
    
    if (error) throw error;
  },

  async update(userId: string, data: {
    full_name?: string;
    origin_place?: string;
    profile_image?: string;
    interests?: string[];
  }) {
    const { error } = await supabase
      .from('user_profiles')
      .update(data)
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async get(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Feed posts table operations
export const feedPosts = {
  async create(data: {
    user_id: string;
    image_url: string;
    caption: string;
    location?: string;
  }) {
    const { data: post, error } = await supabase
      .from('feed_posts')
      .insert([{
        ...data,
        likes: {},
        comments: [],
        created_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return post;
  },

  async getFeed() {
    const { data, error } = await supabase
      .from('feed_posts')
      .select(`
        *,
        user_profiles (
          full_name,
          profile_image
        )
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async likePost(postId: string, userId: string) {
    const { data: post, error } = await supabase
      .from('feed_posts')
      .select('likes')
      .eq('id', postId)
      .single();
    
    if (error) throw error;

    const likes = post.likes || {};
    likes[userId] = !likes[userId];

    const { error: updateError } = await supabase
      .from('feed_posts')
      .update({ likes })
      .eq('id', postId);
    
    if (updateError) throw updateError;
  }
}; 