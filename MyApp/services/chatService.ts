import { ref, push, serverTimestamp, onChildAdded, off, query, orderByChild, limitToLast } from "firebase/database";
import { database } from '../firebase'; // Adjust path if needed
import { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

export interface RealtimeChatMessage {
  id: string;
  from: string;
  text: string;
  timestamp: number;
}

// Generates a consistent chat ID for two users
export const generateChatId = (uid1: string, uid2: string): string => {
  return uid1 < uid2 ? `${uid1}_${uid2}` : `${uid2}_${uid1}`;
};

// Sends a message to a specific chat
export const sendMessage = (chatId: string, text: string) => {
  const currentUser = getAuth().currentUser;
  if (!currentUser || !text.trim()) return;

  const messagesRef = ref(database, `messages/${chatId}`);
  return push(messagesRef, {
    from: currentUser.uid,
    text: text.trim(),
    timestamp: serverTimestamp() // Use server time
  });
};

// Hook to listen for messages in a chat
export const useChatMessages = (chatId: string | null): RealtimeChatMessage[] => {
  const [messages, setMessages] = useState<RealtimeChatMessage[]>([]);

  useEffect(() => {
    if (!chatId) {
        setMessages([]); // Clear messages if chatId is null
        return;
    }

    // Reference to the specific chat messages, ordered by timestamp
    const messagesRef = query(
        ref(database, `messages/${chatId}`),
        orderByChild('timestamp')
        // limitToLast(50) // Optional: Limit initial load/sync
    );

    // Listener for new messages
    const listener = onChildAdded(messagesRef, snapshot => {
      if (snapshot.exists()) {
        setMessages(prev => [
          ...prev,
          { id: snapshot.key!, ...snapshot.val() } as RealtimeChatMessage
        ]);
      }
    });

    // Cleanup listener on component unmount or chatId change
    return () => {
        off(messagesRef, 'child_added', listener);
    };
  }, [chatId]); // Re-run effect if chatId changes

  return messages;
};