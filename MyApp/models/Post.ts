import { ImageSourcePropType } from 'react-native'; // Import ImageSourcePropType

// Interface for Comments within a Post
export interface Comment {
  id: string; // Unique ID for the comment
  userId: string; // ID of the user who made the comment
  userName?: string; // Display name of the commenter (optional but good)
  text: string; // The actual comment content <-- Ensure this exists
  createdAt?: any; // Timestamp (e.g., Firestore Timestamp or Date)
  // Add other relevant comment fields if needed
}

// Interface for a Post in the feed or profile
export interface Post {
  id: string; // Unique ID for the post
  userId: string; // ID of the user who created the post
  userName: string; // Display name of the post author <-- Add this
  userPhoto: ImageSourcePropType | string; // Profile photo of the author (URI object or require) <-- Add this and ensure type compatibility
  imageUrl?: string | null; // URL of the post image (optional)
  content: string; // Caption or text content of the post
  likes?: { [userId: string]: boolean }; // Map of user IDs who liked the post
  comments?: Comment[]; // Array of comments (optional)
  createdAt: any; // Timestamp (e.g., Firestore Timestamp or Date)
  // Add other relevant post fields if needed (e.g., location)
}