import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  Platform 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile } from '../../services/userService';
import { FollowStatus } from '../../services/profileService';

interface Post {
  id: string;
  image: string;
  userId: string;
  caption?: string;
  createdAt: any;
}

interface ProfileHeaderProps {
  profile: UserProfile | null;
  posts: Post[];
  isOwnProfile: boolean;
  friendStatus: FollowStatus;
  onEdit: () => void;
  onAddFriend: () => void;
  onAcceptRequest: () => void;
  onRejectRequest: () => void;
  onRemoveFriend: () => void;
  onMessage?: () => void;
  onSelectPhoto: () => void;
}

export default function ProfileHeader({
  profile,
  posts,
  isOwnProfile,
  friendStatus,
  onEdit,
  onAddFriend,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onMessage,
  onSelectPhoto
}: ProfileHeaderProps) {
  if (!profile) return null;

  const renderActionButtons = () => {
    if (isOwnProfile) {
      return (
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color="#fff" />
          <Text style={styles.editButtonText}>Editar perfil</Text>
        </TouchableOpacity>
      );
    }

    if (friendStatus.isFriend) {
      return (
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.removeButton} onPress={onRemoveFriend}>
            <Ionicons name="person-remove-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Eliminar</Text>
          </TouchableOpacity>
          
          {onMessage && (
            <TouchableOpacity style={styles.messageButton} onPress={onMessage}>
              <Ionicons name="chatbubble-outline" size={18} color="#fff" />
              <Text style={styles.buttonText}>Mensaje</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (friendStatus.isRequested) {
      return (
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity style={styles.acceptButton} onPress={onAcceptRequest}>
            <Ionicons name="checkmark-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Aceptar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.rejectButton} onPress={onRejectRequest}>
            <Ionicons name="close-outline" size={18} color="#fff" />
            <Text style={styles.buttonText}>Rechazar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (friendStatus.isPending) {
      return (
        <TouchableOpacity style={styles.pendingButton} disabled>
          <Ionicons name="time-outline" size={18} color="#fff" />
          <Text style={styles.buttonText}>Solicitud enviada</Text>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity style={styles.addButton} onPress={onAddFriend}>
        <Ionicons name="person-add-outline" size={18} color="#fff" />
        <Text style={styles.buttonText}>Agregar</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.coverPhoto}>
        <View style={styles.avatarContainer}>
          <TouchableOpacity 
            onPress={isOwnProfile ? onSelectPhoto : undefined}
            disabled={!isOwnProfile}
          >
            <Image
              source={
                profile.photo
                  ? { uri: profile.photo }
                  : require('../../assets/images/img7.jpg')
              }
              style={styles.avatar}
            />
            {isOwnProfile && (
              <View style={styles.editAvatarButton}>
                <Ionicons name="camera" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.userName}>{profile.name}</Text>
        {profile.university && (
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={16} color="#bb86fc" />
            <Text style={styles.infoText}>{profile.university}</Text>
          </View>
        )}
        {profile.origin && (
          <View style={styles.infoRow}>
            <Ionicons name="location-outline" size={16} color="#bb86fc" />
            <Text style={styles.infoText}>{profile.origin}</Text>
          </View>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.interestsContainer}>
            {profile.interests.map((interest, index) => (
              <View key={index} style={styles.interestChip}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{posts?.length || 0}</Text>
            <Text style={styles.statLabel}>Publicaciones</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.friends?.length || 0}</Text>
            <Text style={styles.statLabel}>Amigos</Text>
          </View>
        </View>

        {renderActionButtons()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  coverPhoto: {
    backgroundColor: '#333',
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'absolute',
    bottom: -50,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#1e1e1e',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#bb86fc',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  interestChip: {
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
  },
  interestText: {
    color: '#bb86fc',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bb86fc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  pendingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#555',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#cf6679',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#03dac6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#bb86fc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  rejectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#cf6679',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
});