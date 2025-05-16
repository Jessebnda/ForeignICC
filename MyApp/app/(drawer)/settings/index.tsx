import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getAuth, deleteUser, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../../../firebase'; // Ya no necesitamos database
import * as Haptics from 'expo-haptics';
import { TextInput } from 'react-native-gesture-handler';
import MaxWidthContainer from '../../../components/MaxWidthContainer';

export default function SettingsScreen() {
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;
  
  // Eliminada la state variable locationEnabled
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Cargar preferencias del usuario desde Firestore
  useEffect(() => {
    const loadUserPreferences = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const userDoc = await doc(firestore, 'users', user.uid);
        const userSnapshot = await getDoc(userDoc);
        
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data();
          // Solo cargamos las notificaciones
          setNotificationsEnabled(userData.notificationsEnabled !== false); // default true
        }
      } catch (error) {
        console.error("Error al cargar las preferencias:", error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserPreferences();
  }, [user]);

  // Removida la función toggleLocation
  
  // Función para toggle de notificaciones
  const toggleNotifications = async (value: boolean) => {
    if (!user) return;
    
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setNotificationsEnabled(value);
      
      // Actualiza Firestore
      const userDocRef = doc(firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        notificationsEnabled: value
      });
    } catch (error) {
      console.error("Error al actualizar la preferencia de notificaciones:", error);
      // Restaurar el estado en caso de error
      setNotificationsEnabled(!value);
    }
  };

  // Función para confirmar la eliminación de la cuenta
  const confirmDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDeleteModalVisible(true);
  };

  // Función para eliminar la cuenta
  const handleDeleteAccount = async () => {
    if (!user || !password) return;
    
    // Verificar si el email existe
    if (!user.email) {
      setDeleteError('No se puede eliminar la cuenta: no hay email asociado.');
      setDeleteLoading(false);
      return;
    }
    
    setDeleteLoading(true);
    setDeleteError('');
    
    try {
      // Reautenticar al usuario
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Eliminar datos de Firestore
      await deleteDoc(doc(firestore, 'users', user.uid));
      
      // Eliminar cuenta de autenticación
      await deleteUser(user);
      
      setDeleteModalVisible(false);
      router.replace('/login');
    } catch (error) {
      console.error("Error al eliminar la cuenta:", error);
      setDeleteError('Contraseña incorrecta o error al eliminar la cuenta.');
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#bb86fc" />
        <Text style={styles.loadingText}>Cargando configuración...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <MaxWidthContainer>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración</Text>
          <View style={{width: 40}} /> {/* Espacio para equilibrar el header */}
        </View>
        
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacidad</Text>
            
            {/* Eliminada la opción de ubicación */}
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={22} color="#bb86fc" />
                <Text style={styles.settingText}>Notificaciones</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={toggleNotifications}
                trackColor={{ false: "#555", true: "#bb86fc" }}
                thumbColor={notificationsEnabled ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cuenta</Text>
            
            <TouchableOpacity 
              style={styles.dangerButton} 
              onPress={confirmDeleteAccount}
            >
              <Ionicons name="trash-outline" size={22} color="#fff" />
              <Text style={styles.dangerButtonText}>Eliminar cuenta</Text>
            </TouchableOpacity>
            <Text style={styles.warningText}>
              Esta acción eliminará permanentemente tu cuenta y todos tus datos.
            </Text>
          </View>

          {/* Modal de eliminación */}
          <Modal
            visible={deleteModalVisible}
            transparent
            animationType="fade"
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Eliminar cuenta</Text>
                <Text style={styles.modalText}>
                  Esta acción no se puede deshacer. Todos tus datos, publicaciones y conexiones serán eliminados permanentemente.
                </Text>
                
                <Text style={styles.inputLabel}>Ingresa tu contraseña para confirmar:</Text>
                <TextInput
                  style={styles.passwordInput}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Contraseña"
                  placeholderTextColor="#888"
                />
                
                {deleteError ? <Text style={styles.errorText}>{deleteError}</Text> : null}
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton} 
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDeleteModalVisible(false);
                      setPassword('');
                      setDeleteError('');
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.confirmDeleteButton, !password && styles.disabledButton]} 
                    onPress={handleDeleteAccount}
                    disabled={!password || deleteLoading}
                  >
                    {deleteLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmDeleteText}>Eliminar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </MaxWidthContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    height: 56,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 12,
  },
  dangerButton: {
    backgroundColor: '#e53935',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  warningText: {
    color: '#888',
    fontSize: 14,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    padding: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  modalText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  inputLabel: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  passwordInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    marginBottom: 16,
  },
  errorText: {
    color: '#f44336',
    fontSize: 14,
    marginBottom: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#555',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  confirmDeleteButton: {
    backgroundColor: '#e53935',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  confirmDeleteText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#661b1a',
    opacity: 0.7,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});