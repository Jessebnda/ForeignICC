import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Platform, KeyboardAvoidingView, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { getAuth } from 'firebase/auth';
import { useChatMessages, sendMessage, generateChatId, RealtimeChatMessage } from '../services/chatService'; // Adjust path

const defaultUserImage = require('../../assets/images/img7.jpg'); // Adjust path

export default function ChatScreen() {
    const navigation = useNavigation();
    const params = useLocalSearchParams<{ friendId: string; friendName: string; friendPhotoURL?: string }>();
    const { friendId, friendName, friendPhotoURL } = params;

    const currentUser = getAuth().currentUser;
    const [input, setInput] = useState('');

    // Generate a stable chat ID
    const chatId = useMemo(() => {
        if (!currentUser || !friendId) return null;
        return generateChatId(currentUser.uid, friendId);
    }, [currentUser, friendId]);

    const messages = useChatMessages(chatId); // Use the hook

    // Set header title dynamically with image
    useEffect(() => {
        navigation.setOptions({
            // Use headerTitle to render a custom component
            headerTitle: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Image
                        source={friendPhotoURL ? { uri: friendPhotoURL } : defaultUserImage}
                        style={styles.headerAvatar} // Use a specific style for the header avatar
                    />
                    <Text style={styles.headerTitleText}>
                        {friendName || 'Chat'}
                    </Text>
                </View>
            ),
            // Ensure header background matches theme if needed
            headerStyle: { backgroundColor: '#1e1e1e' }, // Example dark header
            headerTintColor: '#fff', // Color for back button, etc.
        });
    }, [navigation, friendName, friendPhotoURL]); // Add friendPhotoURL to dependency array

    const handleSend = () => {
        if (chatId && input.trim()) {
            sendMessage(chatId, input);
            setInput('');
        }
    };

    const renderItem = ({ item }: { item: RealtimeChatMessage }) => {
        const isUser = item.from === currentUser?.uid;
        return (
            <View style={[styles.messageBubble, isUser ? styles.userMessage : styles.friendMessage]}>
                <Text style={isUser ? styles.userText : styles.friendText}>{item.text}</Text>
                {/* Optional: Add timestamp */}
                {/* <Text style={styles.timestamp}>{new Date(item.timestamp).toLocaleTimeString()}</Text> */}
            </View>
        );
    };

    if (!currentUser || !friendId) {
        // Handle case where user or friend ID is missing (e.g., navigate back or show error)
        return <View style={styles.container}><Text style={styles.errorText}>Error: No se pudo cargar el chat.</Text></View>;
    }

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 70} // Adjust offset as needed
        >
            <FlatList
                data={messages}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={styles.messageList}
                contentContainerStyle={{ paddingVertical: 10 }} // Use paddingVertical or adjust as needed
                inverted // Add this prop
            />
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder="Escribe un mensaje..."
                    placeholderTextColor="#888"
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                    <Text style={styles.sendButtonText}>Enviar</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

// Use styles similar to MentorChatScreen or ChatbotScreen
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212' },
    errorText: { color: 'red', textAlign: 'center', marginTop: 50 },
    headerAvatar: {
        width: 32, // Adjust size as needed
        height: 32,
        borderRadius: 16, // Make it a circle
        marginRight: 10,
    },
    headerTitleText: {
        color: '#fff', // Match headerTintColor or desired color
        fontSize: 17,
        fontWeight: '600',
    },
    // Message List
    messageList: { flex: 1 },
    messageBubble: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        marginVertical: 4,
        borderRadius: 18,
        maxWidth: '80%',
    },
    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: '#bb86fc', // User message color
    },
    friendMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#373737', // Friend message color
    },
    userText: {
        color: '#121212', // Dark text for light bubble
        fontSize: 15,
    },
    friendText: {
        color: '#fff', // Light text for dark bubble
        fontSize: 15,
    },
    timestamp: {
        fontSize: 10,
        color: '#ccc', // Adjust color based on bubble
        alignSelf: 'flex-end',
        marginTop: 2,
    },
    // Input Area
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderColor: '#333',
        backgroundColor: '#1e1e1e',
    },
    input: {
        flex: 1,
        backgroundColor: '#333',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        color: '#fff',
        marginRight: 10,
        maxHeight: 100, // Limit input height for multiline
    },
    sendButton: {
        backgroundColor: '#bb86fc',
        paddingHorizontal: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        height: 44, // Match input height approx
    },
    sendButtonText: {
        color: '#121212',
        fontWeight: 'bold',
        fontSize: 16,
    },
});