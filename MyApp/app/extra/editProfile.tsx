// app/(tabs)/editProfile.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Image,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    ScrollView,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    Alert // <-- Add Alert here
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '../../context/UserContext'; // <-- Import useUser
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, firestore, auth } from '../../firebase'; // Assuming auth is needed
import { doc, updateDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons'; // Added Ionicons

// Default image asset (optional, but good practice)
const defaultUserImage = require('../../assets/images/img7.jpg');

export default function EditProfileScreen() {
    const router = useRouter();
    const { profile: profileParam } = useLocalSearchParams();
    // Parse initial profile from navigation, default to empty object
    const initialProfile = profileParam ? JSON.parse(profileParam as string) : {};

    // Get user and profile data from context (Re-apply this)
    const { user, userProfile, refreshProfile } = useUser();

    // Initialize state, prioritizing context, then nav params, then defaults (Re-apply this)
    const [name, setName] = useState(userProfile?.name || initialProfile.name || '');
    const [origin, setOrigin] = useState(userProfile?.origin || initialProfile.origin || ''); // Assuming origin is in userProfile
    const [profileImage, setProfileImage] = useState(userProfile?.photo || initialProfile.photo || ''); // Use 'photo' if that's the field name
    const [interests, setInterests] = useState<string[]>(userProfile?.interests || initialProfile.interests || []);
    const [newInterest, setNewInterest] = useState('');
    const [isUploading, setIsUploading] = useState(false); // For image upload indicator
    const [isSaving, setIsSaving] = useState(false); // For save indicator

    // --- Image Picker Logic (Keep or re-add if removed) ---
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.6,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri); // Update state with the selected image URI
        }
    };

    // --- Upload Logic (Keep or re-add if removed) ---
    const uploadImage = async (uri: string): Promise<string | null> => {
        try {
            setIsUploading(true);
            const response = await fetch(uri);
            const blob = await response.blob();
            const fileRef = ref(storage, `profile_images/${user?.uid || Date.now()}.jpg`);
            await uploadBytes(fileRef, blob);
            const downloadURL = await getDownloadURL(fileRef);
            setIsUploading(false);
            return downloadURL;
        } catch (error) {
            console.error("Error uploading image: ", error);
            Alert.alert("Error", "No se pudo subir la imagen.");
            setIsUploading(false);
            return null;
        }
    };


    // --- Interest Management (Keep existing) ---
    const addInterest = () => {
        if (newInterest.trim() && !interests.includes(newInterest.trim())) {
            setInterests([...interests, newInterest.trim()]);
            setNewInterest('');
        }
    };

    const removeInterest = (interestToRemove: string) => {
        setInterests(interests.filter((i) => i !== interestToRemove));
    };

    // --- Save Profile Logic (Keep or re-add/update) ---
    const saveProfile = async () => {
        if (!user) {
            Alert.alert("Error", "Usuario no autenticado.");
            return;
        }
        setIsSaving(true);
        let finalImageUrl = userProfile?.photo || ''; // Start with current image URL

        // Check if the profileImage state holds a new local URI (starts with 'file:')
        if (profileImage && profileImage !== userProfile?.photo && profileImage.startsWith('file:')) {
            const uploadedUrl = await uploadImage(profileImage);
            if (uploadedUrl) {
                finalImageUrl = uploadedUrl;
            } else {
                setIsSaving(false);
                return; // Stop saving if upload failed
            }
        } else if (!profileImage) {
            // Handle case where image might have been cleared
            finalImageUrl = ''; // Or set to a default placeholder URL if desired
        }


        try {
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, {
                name: name.trim(),
                origin: origin.trim(),
                photo: finalImageUrl, // Save the final URL (uploaded or existing)
                interests: interests,
            });
            await refreshProfile(); // Refresh context data
            Alert.alert("Éxito", "Perfil actualizado correctamente.");
            router.back();
        } catch (error) {
            console.error("Error updating profile: ", error);
            Alert.alert("Error", "No se pudo guardar el perfil.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
                <Image
                    // Use the state variable 'profileImage'. Handle URI vs default.
                    source={profileImage ? { uri: profileImage } : defaultUserImage}
                    style={styles.avatar}
                />
                {/* Optional: Add camera icon overlay */}
                <View style={styles.cameraIconOverlay}>
                   <Ionicons name="camera" size={20} color="#fff" />
                </View>
                {isUploading && <ActivityIndicator style={styles.uploadIndicator} color="#bb86fc" />}
            </TouchableOpacity>

            <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nombre de Usuario"
                placeholderTextColor="#888"
            />
            <TextInput
                style={styles.input}
                value={origin}
                onChangeText={setOrigin}
                placeholder="Origen (País o Ciudad)"
                placeholderTextColor="#888"
            />

            <Text style={styles.label}>Intereses:</Text>
            <FlatList
                data={interests}
                keyExtractor={(item, index) => `interest-${index}`}
                renderItem={({ item }) => (
                    <View style={styles.interestItem}>
                        <Text style={styles.interestText}>{item}</Text>
                        <TouchableOpacity onPress={() => removeInterest(item)}>
                            {/* Use an icon for removal */}
                            <Ionicons name="close-circle" size={18} color="#ff6b6b" style={{ marginLeft: 5 }} />
                        </TouchableOpacity>
                    </View>
                )}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ marginBottom: 8 }}
                ListEmptyComponent={<Text style={styles.noInterestsText}>Aún no hay intereses.</Text>}
            />

            <View style={styles.newInterestContainer}>
                <TextInput
                    style={[styles.input, { flex: 1, marginRight: 8 }]} // Added marginRight
                    value={newInterest}
                    onChangeText={setNewInterest}
                    placeholder="Añadir Interés"
                    placeholderTextColor="#888"
                />
                <TouchableOpacity style={styles.addButton} onPress={addInterest}>
                    <Ionicons name="add" size={20} color="#fff" />
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.saveButton, (isSaving || isUploading) && styles.saveButtonDisabled]}
                onPress={saveProfile}
                disabled={isSaving || isUploading}
            >
                {isSaving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

// --- Styles (Add/Update styles as needed) ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#121212', padding: 16 },
    imageContainer: {
        alignSelf: 'center',
        marginBottom: 20,
        position: 'relative', // Needed for overlay/indicator positioning
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#bb86fc',
        backgroundColor: '#333' // Placeholder bg
    },
    cameraIconOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 6,
        borderRadius: 15,
    },
    uploadIndicator: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0, // Center indicator over image
    },
    input: {
        borderWidth: 1,
        borderColor: '#333',
        borderRadius: 8,
        padding: 12, // Increased padding
        marginVertical: 8, // Increased vertical margin
        color: '#fff',
        backgroundColor: '#1e1e1e',
        fontSize: 15, // Slightly larger font
    },
    label: { color: '#fff', fontWeight: 'bold', marginVertical: 10, fontSize: 16 }, // Increased size/margin
    interestItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8, // Increased spacing
        backgroundColor: '#2a2a2a', // Darker chip background
        paddingHorizontal: 12, // More horizontal padding
        paddingVertical: 6, // More vertical padding
        borderRadius: 16,
        borderWidth: 1, // Add border
        borderColor: '#444', // Subtle border color
    },
    interestText: { color: '#eee', fontSize: 14 }, // Brighter text
    // removeText: { color: 'red', marginLeft: 4, fontSize: 12 }, // Replaced with icon
    newInterestContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10, // Add margin top
        marginBottom: 20, // Add margin bottom
    },
    addButton: {
        backgroundColor: '#bb86fc', // Use theme color
        padding: 10, // Make it square-ish
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        height: 48, // Match input height approx
    },
    // addButtonText: { color: '#fff', fontSize: 12, fontWeight: 'bold' }, // Replaced with icon
    saveButton: {
        backgroundColor: '#bb86fc', // Use theme color
        padding: 15, // Larger button
        borderRadius: 8,
        marginTop: 20, // More margin top
        alignItems: 'center',
        elevation: 2,
    },
    saveButtonDisabled: {
        backgroundColor: '#555', // Disabled color
    },
    saveButtonText: { color: '#121212', fontWeight: 'bold', fontSize: 16 }, // Dark text on light button
    noInterestsText: {
        color: '#888',
        fontStyle: 'italic',
        marginLeft: 5, // Align with input padding
        marginTop: 5,
    }
});
