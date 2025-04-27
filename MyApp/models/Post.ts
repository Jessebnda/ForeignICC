export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  imageUrl?: string;
  likes: Record<string, boolean> | undefined;
  comments: Comment[];
  createdAt: Date | any;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string;
  content: string;
  createdAt: Date | any;
}