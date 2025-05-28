// // MapScreen.tsx
// import React, { useState, useEffect, useCallback, useRef} from 'react';
// import { 
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Modal,
//   TextInput,
//   ScrollView,
//   Alert,
//   SafeAreaView,
//   ActivityIndicator,
//   Platform,
//   Linking
// } from 'react-native';
// import * as Location from 'expo-location';
// import { firestore } from '../../../firebase';
// import { getAuth } from 'firebase/auth';
// import { doc, getDoc, collection, getDocs, setDoc, query, where, serverTimestamp, GeoPoint } from 'firebase/firestore';
// import { createNotification } from '../../../services/notificationService';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { storage } from '../../../firebase';
// import * as ImagePicker from 'expo-image-picker';
// import { Image } from 'react-native';
// import { database } from '../../../firebase'; 
// import { set, ref as DatabaseRef, remove, onValue } from 'firebase/database';
// import MapView, { Marker, LatLng, Polyline } from 'react-native-maps';
// import { useRouter, useLocalSearchParams } from 'expo-router';
// import { useRaite } from '../../../context/RaiteContext';
// import { Ionicons } from '@expo/vector-icons';

// export default function MapScreen() {
//   const router = useRouter();
//   const params = useLocalSearchParams();
  
//   // Estados para filtros y marcadores (funcionalidad original)
//   const [pendingTypes, setPendingTypes] = useState<string[]>([]);
//   const [confirmedTypes, setConfirmedTypes] = useState<string[]>([]);
//   const [isAddingPlace, setIsAddingPlace] = useState(false);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [manualMarkerCoords, setManualMarkerCoords] = useState<LatLng | null>(null);
//   const [manualMarkerName, setManualMarkerName] = useState('');
//   const [hasChanges, setHasChanges] = useState(false);
//   const [locations, setLocations] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const [friendIds, setFriendIds] = useState<string[]>([]);
//   const [selectedImages, setSelectedImages] = useState<string[]>([]);
//   const [review, setReview] = useState('');
//   const [stars, setStars] = useState(5);
//   const [manualMarkerDescription, setManualMarkerDescription] = useState('');
//   const [manualMarkerImageUri, setManualMarkerImageUri] = useState<string | null>(null);
//   const [manualMarkerRating, setManualMarkerRating] = useState(0);
//   const [selectedPlace, setSelectedPlace] = useState<any | null>(null);
//   const [placeModalVisible, setPlaceModalVisible] = useState(false);
//   const [placeOwner, setPlaceOwner] = useState<{ name: string; photo: any } | null>(null);
//   const [friendRaiteRequests, setFriendRaiteRequests] = useState<FriendRaiteRequest[]>([]);
//   const [raiteAlertModalVisible, setRaiteAlertModalVisible] = useState(false);
//   const [selectedFriendRaite, setSelectedFriendRaite] = useState<{ friendId: string; friendName: string; to: LatLng } | null>(null);
//   const { setHasActiveRaiteRequest } = useRaite();
//   const mapRef = useRef<MapView>(null);

//   type FriendRaiteRequest = {
//     friendId: string;
//     friendName: string;
//     to: LatLng;
//   };

//   // NUEVO: Procesar parámetros cuando se llega desde una notificación
//   useEffect(() => {
//     if (params?.showRaiteRequest && params?.fromUserId) {
//       const requestId = params.showRaiteRequest as string;
//       const fromUserId = params.fromUserId as string;
      
//       // Buscar la solicitud de raite en Realtime Database
//       const requestRef = DatabaseRef(database, `raiteRequests/${fromUserId}`);
//       onValue(requestRef, (snapshot) => {
//         if (snapshot.exists()) {
//           const raiteData = snapshot.val();
//           if (raiteData && raiteData.status === 'pending') {
//             // Obtener datos del usuario solicitante
//             getDoc(doc(firestore, 'users', fromUserId)).then(userDoc => {
//               if (userDoc.exists()) {
//                 const userData = userDoc.data();
//                 const userName = userData?.name || 'Usuario';
                
//                 // Mostrar modal con la solicitud
//                 setSelectedFriendRaite({
//                   friendId: fromUserId,
//                   friendName: userName,
//                   to: raiteData.to
//                 });
//                 setRaiteAlertModalVisible(true);
//               }
//             });
//           }
//         }
//       }, { onlyOnce: true });
//     }
//   }, [params]); // Nota que la dependencia cambia de router.params a params

//   //Subir imgs a storage
//   const uploadImages = async (uris: string[]) => {
//     const urls = [];
//     for (const uri of uris) {
//       const response = await fetch(uri);
//       const blob = await response.blob();
//       const filename = `mapLocations/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
//       const refStorage = ref(storage, filename);
//       await uploadBytes(refStorage, blob);
//       const downloadUrl = await getDownloadURL(refStorage);
//       urls.push(downloadUrl);
//     }
//     return urls;
//   };
 
//   const fetchPlaceOwner = async (userId: string) => {
//     try {
//       const userDoc = await getDoc(doc(firestore, 'users', userId));
//       if (userDoc.exists()) {
//         const userInfo = userDoc.data();
//         const ownerData = {
//           name: userInfo.name || 'Usuario sin nombre',
//           photo: userInfo.photo
//             ? (userInfo.photo.startsWith('data:')
//                 ? { uri: userInfo.photo }
//                 : { uri: userInfo.photo })
//             : require('../../../assets/images/img7.jpg'), // Foto default local si no tiene
//         };
//         setPlaceOwner(ownerData);
//       } else {
//         console.log('No se encontró usuario');
//         setPlaceOwner(null);
//       }
//     } catch (error) {
//       console.error(`❌ Error cargando usuario ${userId}:`, error);
//       setPlaceOwner(null);
//     }
//   };  
  
//   //auth y amigos
//   useEffect(() => {
//     const auth = getAuth();
//     const user = auth.currentUser;
  
//     if (user) {
//       setCurrentUserId(user.uid);
  
//       // Cargar amigos
//       const loadFriends = async () => {
//         const userRef = doc(firestore, 'users', user.uid);
//         const snapshot = await getDoc(userRef);
//         if (snapshot.exists()) {
//           const data = snapshot.data();
//           setFriendIds(data.friends || []);
//         }
//       };
  
//       loadFriends();
//     }
//   }, []);

//   //fetch locations
//   useEffect(() => {
//     const fetchLocations = async () => {
//       try {
//         const querySnapshot = await getDocs(collection(firestore, 'mapLocations'));
//         const loadedLocations = querySnapshot.docs
//           .map((doc) => doc.data())
//           .filter((loc) => 
//             loc.createdBy === currentUserId || friendIds.includes(loc.createdBy)
//           )
//           .map((loc) => ({
//             id: loc.locationId,
//             title: loc.title,
//             description: loc.description,
//             geoPoint: {
//               latitude: loc.geoPoint.latitude,
//               longitude: loc.geoPoint.longitude,
//             },
//             type: loc.type,
//             imageUrl: loc.imageUrl,
//             createdBy: loc.createdBy,
//             rating: loc.rating || [],
//           }));
//         setLocations(loadedLocations);
//       } catch (error) {
//         console.error('❌ Error cargando lugares:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
  
//     if (currentUserId) {
//       fetchLocations();
//     }
//   }, [currentUserId, friendIds]);

//   //nuevo lugar
//   const handleLongPress = (e: any) => {
//     if (!isAddingPlace) return; // SOLO si activamos agregar lugar
//     setManualMarkerCoords(e.nativeEvent.coordinate);
//     setModalVisible(true); // 🔥 Aquí abres el modal
//   };
  
//   //crear el pin (ubicacion)
//   const handleAddManualMarker = async () => {
//     if (!manualMarkerCoords || !manualMarkerName.trim() || !currentUserId) {
//       Alert.alert('Error', 'Completa todos los datos.');
//       return;
//     }
  
//     let imageUrls: string[] = [];
//     if (selectedImages.length > 0) {
//       imageUrls = await uploadImages(selectedImages);
//     }
  
//     const newId = Date.now().toString();
    
//     const newMarker = {
//       locationId: newId,
//       title: manualMarkerName.trim(),
//       description: review.trim(),
//       rating: [{ userId: currentUserId, stars }],
//       geoPoint: new GeoPoint(
//         manualMarkerCoords.latitude,
//         manualMarkerCoords.longitude
//       ),
//       type: ['favoritos'],
//       imageUrl: imageUrls.length > 0 ? imageUrls[0] : '',
//       imageUrls,
//       createdBy: currentUserId,
//       createdAt: new Date(),
//     };
  
//     try {
//       await setDoc(doc(firestore, 'mapLocations', newId), newMarker);
//       Alert.alert('✅ Lugar guardado correctamente');
//       // limpiar estados
//       setManualMarkerName('');
//       setManualMarkerCoords(null);
//       setReview('');
//       setStars(5);
//       setSelectedImages([]);
//       setModalVisible(false);
//       setIsAddingPlace(false);
//       // Refrescar lugares
//       fetchLocationsAgain(); // <-- haces un refetch de lugares
//     } catch (error) {
//       console.error('❌ Error guardando lugar:', error);
//     }
//   };
  
//   //volver a fetchear ubis
//   const fetchLocationsAgain = async () => {
//     try {
//       const querySnapshot = await getDocs(collection(firestore, 'mapLocations'));
//       const loadedLocations = querySnapshot.docs.map((doc) => {
//         const data = doc.data();
//         return {
//           id: data.locationId,
//           title: data.title,
//           description: data.description,
//           geoPoint: {
//             latitude: data.geoPoint.latitude,
//             longitude: data.geoPoint.longitude,
//           },
//           type: data.type,
//           imageUrl: data.imageUrl,
//           createdBy: data.createdBy,
//           rating: data.rating || [],
//         };
//       });
//       setLocations(loadedLocations);
//     } catch (error) {
//       console.error('❌ Error recargando lugares:', error);
//     }
//   };  
  
//   //diferentes colores para los pines
//   const getPinColor = (createdBy: string) => {
//     if (createdBy === currentUserId) return '#4f0c2e'; // Mi lugar
//     const friendIndex = friendIds.indexOf(createdBy);
//     const friendColors = ['#42A5F5', '#66BB6A', '#FFA726', '#EF5350'];
//     return friendColors[friendIndex % friendColors.length] || '#FFCA28'; // amarillo si excede
//   };
  
//   // Ubicación del usuario
//   const [userLocation, setUserLocation] = useState<LatLng | null>(null);

//   // Funcionalidad "Pedir Raite"
//   const [isRaiteActive, setIsRaiteActive] = useState(false);
//   const [selectedRaitePlace, setSelectedRaitePlace] = useState<LatLng | null>(null);
//   const [raiteConfirmModalVisible, setRaisteConfirmModalVisible] = useState(false);
//   const [friendSelectionModalVisible, setFriendSelectionModalVisible] = useState(false);
//   type Friend = { id: string; name: string; };
//   const [friends, setFriends] = useState<Friend[]>([]);
//   const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
//   const [raiteTimeoutId, setRaiteTimeoutId] = useState<number | null>(null);


//   const sendRaiteRequestRealtime = async () => {
//     const userId = currentUserId; 
//     if (!userId || !userLocation || !selectedRaitePlace || selectedFriends.length === 0) return;

//     try {
//       // Datos para la solicitud de raite en Realtime Database (tu código actual)
//       const raiteData = {
//         from: userLocation,
//         to: selectedRaitePlace,
//         timestamp: Date.now(),
//         status: 'pending',
//         selectedFriends, 
//       };
      
//       // Guardar en Realtime Database
//       await set(DatabaseRef(database, `raiteRequests/${userId}`), raiteData);
      
//       // Obtener datos del usuario actual para la notificación
//       const currentUserDoc = await getDoc(doc(firestore, 'users', userId));
//       const currentUserData = currentUserDoc.data();
//       const currentUserName = currentUserData?.name || 'Usuario';
//       const currentUserPhoto = currentUserData?.photo || '';
      
//       // Crear notificación en Firestore para cada amigo seleccionado
//       for (const friendId of selectedFriends) {
//         await createNotification({
//           type: 'raite_request',
//           fromUserId: userId,
//           fromUserName: currentUserName,
//           fromUserPhoto: currentUserPhoto,
//           toUserId: friendId,
//           contentId: userId, // Usamos userId como contentId para identificar la solicitud
//           contentText: `${currentUserName} necesita un raite. ¡Toca aquí para responder!`
//         });
//       }
      
//       console.log('Notificaciones de raite enviadas a:', selectedFriends);
//     } catch (error) {
//       console.error('Error al enviar solicitud de raite:', error);
//       throw error;
//     }
//   };

//   const cancelRaiteRequestRealtime = async () => {
//     const userId = currentUserId;
//     if (!userId) return;
//     await remove(DatabaseRef(database, `raiteRequests/${userId}`));
//   };

//   //a ellos se les manda
//   useEffect(() => {
//     if (friendIds.length === 0) return;
  
//     const unsubscribes = friendIds.map(friendId => {
//       const friendRef = DatabaseRef(database, `raiteRequests/${friendId}`);
//       return onValue(friendRef, (snapshot) => {
//         const data = snapshot.val();
//         if (data && data.status === 'pending') {
//           console.log(`Tu amigo ${friendId} está pidiendo raite a:`, data.to);
//         }
//       });
//     });
//     return () => {
//       unsubscribes.forEach(unsub => unsub());
//     };
//   }, [friendIds]);

//   useEffect(() => {
//     if (friendIds.length === 0) return;
  
//     const unsubscribes = friendIds.map(friendId => {
//       const friendRequestRef = DatabaseRef(database, `raiteRequests/${friendId}`);
//       return onValue(friendRequestRef, (snapshot) => {
//         const data = snapshot.val();
//         if (data && data.status === 'pending') {
//           setFriendRaiteRequests(prev => {
//             const alreadyExists = prev.find(r => r.friendId === friendId);
//             if (alreadyExists) return prev;
  
//             const friend = friends.find(f => f.id === friendId);
//             if (!friend) return prev;
  
//             return [...prev, { friendId, friendName: friend.name, to: data.to }];
//           });
//         } else {
//           setFriendRaiteRequests(prev =>
//             prev.filter(r => r.friendId !== friendId)
//           );
//         }
//       });
//     });
  
//     return () => {
//       unsubscribes.forEach(unsub => unsub());
//     };
//   }, [friendIds, friends]);
  
//   useEffect(() => {
//     setHasActiveRaiteRequest(friendRaiteRequests.length > 0);
//   }, [friendRaiteRequests]);
  
//   // Solicitar permisos y obtener la ubicación real con Expo Location
//   useEffect(() => {
//     (async () => {
//       const { status } = await Location.requestForegroundPermissionsAsync();
//       if (status !== 'granted') {
//         Alert.alert('Permiso denegado', 'No se pudo acceder a la ubicación del dispositivo.');
//         return;
//       }
//       const location = await Location.getCurrentPositionAsync({});
//       setUserLocation({
//         latitude: location.coords.latitude,
//         longitude: location.coords.longitude,
//       });
//     })();
//   }, []);

//   // Inicializa pendingTypes al montar (o podrías cargar desde almacenamiento)
//   useEffect(() => {
//     setPendingTypes(confirmedTypes);
//   }, []);
 
//   // filtrar info de amigos
//   useEffect(() => {
//     const fetchFriendsData = async () => {
//       try {
//         const friendsData: Friend[] = [];
  
//         for (const friendId of friendIds) {
//           const friendDoc = await getDoc(doc(firestore, 'users', friendId));
//           if (friendDoc.exists()) {
//             const friendInfo = friendDoc.data();
//             friendsData.push({
//               id: friendId,
//               name: friendInfo.name || 'Usuario sin nombre',
//             });
//           }
//         }
  
//         setFriends(friendsData);
//       } catch (error) {
//         console.error('❌ Error cargando amigos:', error);
//       }
//     };
  
//     if (friendIds.length > 0) {
//       fetchFriendsData();
//     }
//   }, [friendIds]);  

//   const handleApplyFilters = () => {
//     setConfirmedTypes([...pendingTypes]);
//     setHasChanges(false);
//   };

//   const toggleTypeSelection = (type: string) => {
//     setPendingTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
//     setHasChanges(true);
//   };

//   //para lograr el long press
//   const toggleAddingPlace = () => {
//     setIsAddingPlace((prev) => !prev);
//     if (isAddingPlace) {
//       setManualMarkerCoords(null);
//       setManualMarkerName('');
//       setSelectedImages([]);
//       setReview('');
//       setStars(5);
//     }
//   };

//   // Funciones para "Pedir Raite"
//   const handleMapPress = (e: any) => {
//     const coordinate: LatLng = e.nativeEvent.coordinate;
//     if (isRaiteActive) {
//       setSelectedRaitePlace(coordinate);
//       setRaisteConfirmModalVisible(true);
//     }
//   };

//   const confirmRaiteRequest = () => {
//     setRaisteConfirmModalVisible(false);
//     setFriendSelectionModalVisible(true);
//   };

//   const cancelRaiteRequest = async () => {
//     try {
//       await cancelRaiteRequestRealtime(); // <<<< AQUI
//     } catch (error) {
//       console.error('❌ Error cancelando raite:', error);
//     }
  
//     setRaisteConfirmModalVisible(false);
//     setSelectedRaitePlace(null);
//   };
  

//   const toggleFriendSelection = (friendId: string) => {
//     setSelectedFriends(prev => 
//       prev.includes(friendId)
//         ? prev.filter(id => id !== friendId)
//         : [...prev, friendId]
//     );
//   };

//   const sendRaiteRequest = async () => {
//     try {
//       await sendRaiteRequestRealtime(); 
//       Alert.alert('Solicitud Enviada');
//     } catch (error) {
//       console.error('❌ Error enviando raite:', error);
//       Alert.alert('Error', 'No se pudo enviar la solicitud de raite.');
//     }
  
//     setFriendSelectionModalVisible(false);
//     setSelectedRaitePlace(null);
//     setFriends([]);
//     setIsRaiteActive(false);
//   };   

//   const toggleRaiteMode = () => {
//     setIsRaiteActive((prev) => {
//       const newState = !prev;
  
//       if (newState) {
//         const timeoutId = setTimeout(() => {
//           setIsRaiteActive(false);
//           setSelectedRaitePlace(null);
//           setRaisteConfirmModalVisible(false);
//           setFriendSelectionModalVisible(false);
//         }, 15 * 60 * 1000); // 15 minutos
  
//         setRaiteTimeoutId(timeoutId);
//       } else {
//         if (raiteTimeoutId) {
//           clearTimeout(raiteTimeoutId);
//           setRaiteTimeoutId(null);
//         }
  
//         setSelectedRaitePlace(null);
//         setRaisteConfirmModalVisible(true);
//         setFriendSelectionModalVisible(false);
//       }
  
//       return newState;
//     });
//   };

//   const handleAcceptRaite = async () => {
//     if (!selectedFriendRaite || !currentUserId) return;
  
//     try {
//       // Actualizar el estado a 'accepted' en la solicitud del amigo
//       const friendRequestRef = DatabaseRef(database, `raiteRequests/${selectedFriendRaite.friendId}`);
//       await set(friendRequestRef, {
//         ...selectedFriendRaite,
//         status: 'accepted',
//         acceptedBy: currentUserId,
//       });
  
//       // Cerrar modal
//       setRaiteAlertModalVisible(false);
//       setSelectedFriendRaite(null);
  
//       // Navegar al chat
//       router.push(`/extra/chat?friendId=${selectedFriendRaite.friendId}&friendName=${encodeURIComponent(selectedFriendRaite.friendName)}`);
//     } catch (error) {
//       console.error('❌ Error al aceptar raite:', error);
//       Alert.alert('Error', 'No se pudo aceptar la solicitud.');
//     }
//   };

  
  

//   const pickImagesFromLibrary = async () => {
//     try {
//       const result = await ImagePicker.launchImageLibraryAsync({
//         allowsMultipleSelection: true,
//         mediaTypes: ImagePicker.MediaTypeOptions.Images,
//         quality: 1,
//         selectionLimit: 5, // máximo 5 imágenes
//       });
  
//       if (!result.canceled) {
//         const selected = result.assets.map((asset) => asset.uri);
//         setSelectedImages(selected);
//       }
//     } catch (error) {
//       console.error('❌ Error seleccionando imágenes:', error);
//     }
//   };
  

//   const filteredLocations = locations.filter((place) => {
//     if (confirmedTypes.length === 0) return true;
//     return place.type.some((t: string) => confirmedTypes.includes(t));
//   });

//   const renderRaiteConfirmModal = () => {
//     if (!raiteConfirmModalVisible || !selectedRaitePlace) return null;
  
//     return (
//       <Modal visible={raiteConfirmModalVisible} transparent animationType="slide">
//   <View style={styles.modalOverlay}>
//     <View style={styles.modalContainer}>
//       <Text style={styles.modalTitle}>¿Confirmar Destino de Raite?</Text>

//       <View style={styles.modalButtons}>
//         <TouchableOpacity
//           style={[styles.modalButton, styles.modalButtonCancel]}
//           onPress={cancelRaiteRequest}
//         >
//           <Text style={styles.modalButtonText}>Cancelar</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.modalButton}
//           onPress={confirmRaiteRequest}
//         >
//           <Text style={styles.modalButtonText}>Confirmar</Text>
//         </TouchableOpacity>

//       </View>
//     </View>
//   </View>
// </Modal>

//     );
//   };

//   // Early return for web platform
//   if (Platform.OS === 'web') {
//     return (
//       <View style={styles.webContainer}>
//         <View style={styles.webContent}>
//           <Ionicons name="phone-portrait-outline" size={64} color="#bb86fc" />
//           <Text style={styles.webTitle}>Disponible solo en dispositivos móviles</Text>
//           <Text style={styles.webDescription}>
//             Esta función está optimizada para la experiencia móvil. Por favor, descarga nuestra aplicación para acceder a todas las funcionalidades del mapa.
//           </Text>
//           <TouchableOpacity 
//             style={styles.downloadButton}
//             onPress={() => Linking.openURL('https://play.google.com/store')}
//           >
//             <Text style={styles.downloadButtonText}>Descargar App</Text>
//           </TouchableOpacity>
//         </View>
//       </View>
//     );
//   }

//   // ─── CONDICIONAL PARA CARGAR EL MAPA ─────────────────────────────
//   // Si no se ha obtenido la ubicación (o aún se está cargando), mostramos un indicador.
//   if (!userLocation) {
//     return (
//       <SafeAreaView style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#bb86fc" />
//         <Text style={styles.loadingText}>Cargando ubicación...</Text>
//       </SafeAreaView>
//     );
//   }
//   // ───────────────────────────────────────────────────────────────────

//   return (
//     <SafeAreaView style={styles.container}>
    
  
//       {/* Mapa */}
//       <View style={styles.mapContainer}>
//         <MapView
//            ref={mapRef}
//           style={styles.map}
//           initialRegion={{
//             latitude: userLocation.latitude,
//             longitude: userLocation.longitude,
//             latitudeDelta: 0.01,
//             longitudeDelta: 0.01,
//           }}
//           onLongPress={handleLongPress}
//           onPress={isRaiteActive ? handleMapPress : undefined}
//         >
//           {/* Marker de usuario */}
//           {userLocation && (
//             <Marker coordinate={userLocation} title="Tú" />
//           )}
  
//           {/* Markers de ubicaciones */}
//           {filteredLocations.map((place) => (
//         <Marker
//           key={place.id}
//           coordinate={place.geoPoint}
//           title={place.title}
//           description={place.description}
//           pinColor={getPinColor(place.createdBy)}
//           onPress={() => {
//             fetchPlaceOwner(place.createdBy);
//             setSelectedPlace(place);
//             setPlaceModalVisible(true);
//           }}
//         >
//       <View style={{
//         width: 50,
//         height: 50,
//         borderRadius: 25,
//         overflow: 'hidden',
//         borderWidth: 3,
//         borderColor: 'white',
//         backgroundColor: '#2a2a2a',
//         alignItems: 'center',
//         justifyContent: 'center',
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.3,
//         shadowRadius: 3,
//         elevation: 5,
//     }}>
//       {place.imageUrl ? (
//       <Image
//         source={{ uri: place.imageUrl }}
//         style={{ width: '100%', height: '100%' }}
//         resizeMode="cover"
//       />
//     ) : (
//       <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>
//         {place.title.charAt(0)}
//       </Text>
//     )}
//       </View>
//   </Marker>
        
//       ))}
  
//           {/* Marker de raite */}
//           {isRaiteActive && selectedRaitePlace && (
//             <Marker coordinate={selectedRaitePlace} pinColor="orange" title="Lugar para Raite" />
//           )}

//           {selectedFriendRaite && userLocation && (
//             <>
//               {/* Línea principal */}
//               <Polyline
//                 coordinates={[userLocation, selectedFriendRaite.to]}
//                 strokeColor="#4f0c2e"
//                 strokeWidth={4}
//                 lineCap="round"
//                 lineJoin="round"
//               />
              
//               {/* Punto de inicio */}
//               <Marker
//                 coordinate={userLocation}
//                 anchor={{ x: 0.5, y: 0.5 }}
//               >
//                 <View style={{
//                   width: 15,
//                   height: 15,
//                   borderRadius: 7.5,
//                   backgroundColor: '#4CAF50',
//                   borderWidth: 2,
//                   borderColor: 'white',
//                 }} />
//               </Marker>
              
//               {/* Punto de destino */}
//               <Marker
//                 coordinate={selectedFriendRaite.to}
//                 anchor={{ x: 0.5, y: 0.5 }}
//               >
//                 <View style={{
//                   width: 15,
//                   height: 15,
//                   borderRadius: 7.5,
//                   backgroundColor: '#F44336',
//                   borderWidth: 2,
//                   borderColor: 'white',
//                 }} />
//               </Marker>
//             </>
//           )}
//         </MapView>
        
//         {/* Pill badge for raite requests */}
//         {friendRaiteRequests.length > 0 && (
//           <TouchableOpacity
//             style={styles.pillBadge}
//             onPress={() => {
//               setSelectedFriendRaite(friendRaiteRequests[0]);
//               setRaiteAlertModalVisible(true);
//             }}
//           >
//             <Ionicons name="car-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
//             <Text style={styles.pillBadgeText}>1 Solicitud de raite</Text>
//           </TouchableOpacity>
//         )}

  
//         {/* Loading si está cargando */}
//         {isLoading && (
//           <View style={styles.loadingOverlay}>
//             <ActivityIndicator size="large" color="#bb86fc" />
//             <Text style={styles.loadingText}>Buscando lugares...</Text>
//           </View>
//         )}
//       </View>

//       {/* Botón para "Agregar Lugar" */}
//       <TouchableOpacity 
//         style={[
//           styles.addButton, 
//           isAddingPlace && { backgroundColor: '#333', borderWidth: 2, borderColor: '#bb86fc' }
//         ]} 
//         onPress={toggleAddingPlace}
//       >
//         <Text style={[
//           styles.addButtonText,
//           isAddingPlace && { color: '#bb86fc' }
//         ]}>
//           {isAddingPlace ? 'Cancelar' : 'Agregar Lugar'}
//         </Text>
//       </TouchableOpacity>
      

//       {/* Botón Pedir Raite */}
//       <TouchableOpacity 
//         style={[
//           styles.raiteButton,
//           isRaiteActive && { backgroundColor: '#333', borderWidth: 2, borderColor: '#FF4081' }
//         ]} 
//         onPress={toggleRaiteMode}
//       >
//         <Text style={[
//           styles.raiteButtonText,
//           isRaiteActive && { color: '#FF4081' }
//         ]}>
//           {isRaiteActive ? 'Cancelar Raite' : 'Pedir Raite'}
//         </Text>
//       </TouchableOpacity>

  
//       {/* --- MODALES --- */}
      
//       {/* Modal Consultar Lugar */}
//       <Modal visible={placeModalVisible} transparent animationType="slide">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             {selectedPlace && (
//               <ScrollView contentContainerStyle={styles.modalContent}>
//                 {placeOwner && (
//                   <View style={styles.ownerInfoContainer}>
//                     <Image
//                       source={placeOwner.photo}
//                       style={styles.ownerAvatar}
//                       resizeMode="cover"
//                     />
//                     <Text style={styles.ownerName}>{placeOwner.name}</Text>
//                   </View>
//                 )}

//                 {selectedPlace.imageUrl ? (
//                   <Image
//                     source={{ uri: selectedPlace.imageUrl }}
//                     style={styles.placeImage}
//                     resizeMode="cover"
//                   />
//                 ) : (
//                   <View style={[styles.placeImage, { 
//                     backgroundColor: '#333', 
//                     alignItems: 'center', 
//                     justifyContent: 'center' 
//                   }]}>
//                     <Text style={{ color: '#888', fontSize: 16 }}>Sin imagen disponible</Text>
//                   </View>
//                 )}

//                 <Text style={styles.modalTitleM}>{selectedPlace.title}</Text>
                
//                 {selectedPlace.description ? (
//                   <Text style={styles.modalDescription}>{selectedPlace.description}</Text>
//                 ) : (
//                   <Text style={[styles.modalDescription, { fontStyle: 'italic', color: '#888' }]}>
//                     Sin descripción
//                   </Text>
//                 )}

//                 <Text style={styles.modalRating}>
//                   {selectedPlace.rating && selectedPlace.rating.length > 0
//                     ? `★ ${selectedPlace.rating[0].stars} estrellas`
//                     : 'Sin calificación'}
//                 </Text>

//                 <TouchableOpacity
//                   style={styles.modalButton}
//                   onPress={() => setPlaceModalVisible(false)}
//                 >
//                   <Text style={styles.modalButtonText}>Cerrar</Text>
//                 </TouchableOpacity>
//               </ScrollView>
//             )}
//           </View>
//         </View>
//       </Modal>


  
//       {/* Modal Confirmar Raite */}
//       <Modal visible={modalVisible} transparent animationType="slide">
//   <View style={styles.modalOverlay}>
//     <ScrollView contentContainerStyle={styles.modalContainer}>
//       <Text style={styles.modalTitle}>Agregar Nuevo Lugar</Text>

//       {/* Campo para el título */}
//       <TextInput
//         style={styles.modalInput}
//         placeholder="Nombre del lugar"
//         placeholderTextColor="#888"
//         value={manualMarkerName}
//         onChangeText={setManualMarkerName}
//       />

//       {/* Campo para la descripción */}
//       <TextInput
//         style={[styles.modalInput, { height: 100 }]}
//         placeholder="Descripción"
//         placeholderTextColor="#888"
//         value={manualMarkerDescription}
//         onChangeText={setManualMarkerDescription}
//         multiline
//       />

//       {/* Botón para elegir imagen */}
//       <TouchableOpacity style={styles.galleryButton} onPress={pickImagesFromLibrary}>
//         <Text style={styles.modalButtonText}>Seleccionar Imagen</Text>
//       </TouchableOpacity>

//       {/* Preview de imagen si hay */}
//       {selectedImages.length > 0 && (
//       <View style={styles.selectedImagesContainer}>
//         {selectedImages.map((uri, index) => (
//           <Image
//             key={index}
//             source={{ uri }}
//             style={styles.selectedImagePreview}
//             resizeMode="cover"
//           />
//         ))}
//       </View>
//     )}


//       {/* Calificación por estrellas */}
//       <Text style={styles.modalTitle}>Calificación:</Text>
//       <View style={styles.starRatingContainer}>
//         {[1, 2, 3, 4, 5].map((star) => (
//           <TouchableOpacity 
//             key={star} 
//             onPress={() => setStars(star)}
//             style={styles.starButton}
//           >
//             <Text style={[
//               styles.starIcon, 
//               { color: stars >= star ? '#FFD700' : '#444' }
//             ]}>
//               ★
//             </Text>
//           </TouchableOpacity>
//         ))}
//       </View>

//       {/* Botones de acción */}
//       <View style={styles.modalButtons}>
//         <TouchableOpacity
//           style={[styles.modalButton, styles.modalButtonCancel]}
//           onPress={() => {
//             setModalVisible(false);
//             setIsAddingPlace(false);
//             setManualMarkerCoords(null);
//             setManualMarkerName('');
//             setManualMarkerDescription('');
//             setManualMarkerImageUri(null);
//             setManualMarkerRating(0);
//           }}
//         >
//           <Text style={styles.modalButtonText}>Cancelar</Text>
//         </TouchableOpacity>

//         <TouchableOpacity style={styles.modalButton} onPress={handleAddManualMarker}>
//           <Text style={styles.modalButtonText}>Guardar</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   </View>
// </Modal>

  
//       {/* Modal Seleccionar Amigos */}
//       <Modal visible={friendSelectionModalVisible} transparent animationType="slide">
//         <View style={styles.modalOverlay}>
//           <View style={styles.modalContainer}>
//             <Text style={styles.modalTitle}>Selecciona amigos</Text>
//             <ScrollView style={styles.friendsList}>
//             {friends.map((friend) => (
//             <TouchableOpacity 
//               key={friend.id} 
//               style={styles.friendItem} 
//               onPress={() => toggleFriendSelection(friend.id)}
//             >
//               <Text style={styles.friendText}>{friend.name}</Text>
//               {selectedFriends.includes(friend.id) && (
//                 <Text style={styles.checkMark}>✓</Text>
//               )}
//             </TouchableOpacity>
//           ))}
//             </ScrollView>
//             <View style={styles.modalButtons}>
//               <TouchableOpacity 
//                 style={[styles.modalButton, styles.modalButtonCancel]} 
//                 onPress={() => setFriendSelectionModalVisible(false)}
//               >
//                 <Text style={styles.modalButtonText}>Cancelar</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.modalButton} onPress={sendRaiteRequest}>
//                 <Text style={styles.modalButtonText}>Enviar Solicitud</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>  

//       {renderRaiteConfirmModal()}

//       <Modal visible={raiteAlertModalVisible} transparent animationType="slide">
//   <View style={styles.modalOverlay}>
//     <View style={styles.modalContainer}>
//       <Text style={styles.modalTitle}>Solicitud de Raite</Text>

//       {selectedFriendRaite && (
//         <>
//           <Text style={{ color: '#fff', textAlign: 'center', marginBottom: 10 }}>
//             Tu amigo <Text style={{ fontWeight: 'bold' }}>{selectedFriendRaite.friendName}</Text> necesita un raite.
//           </Text>
//         </>
//       )}

//         <View style={styles.modalButtons}>
//           <TouchableOpacity
//             style={[styles.modalButton, styles.modalButtonCancel]}
//             onPress={() => {
//               setRaiteAlertModalVisible(false);
//               setSelectedFriendRaite(null);
//             }}
//           >
//             <Text style={styles.modalButtonText}>Rechazar</Text>
//           </TouchableOpacity>

//           <TouchableOpacity
//             style={styles.modalButton}
//             onPress={handleAcceptRaite}
//           >
//             <Text style={styles.modalButtonText}>Aceptar</Text>
//           </TouchableOpacity>
//         </View>

//         {/* Botón separado para ver la ruta */}
//         <TouchableOpacity
//           onPress={() => {
//             setRaiteAlertModalVisible(false);
//           }}
//           style={styles.viewRouteButton}
//         >
//           <Text style={styles.viewRouteText}>📍 Ver ruta</Text>
//         </TouchableOpacity>

//             </View>
//           </View>
//         </Modal>

//     </SafeAreaView>
//   );
// }
// // Estilos mejorados para MapScreen.tsx
// const styles = StyleSheet.create({
//   // Contenedores principales
//   container: { 
//     flex: 1, 
//     backgroundColor: '#121212' 
//   },
//   loadingContainer: { 
//     flex: 1, 
//     justifyContent: 'center', 
//     alignItems: 'center',
//     backgroundColor: '#121212' 
//   },
//   loadingText: { 
//     color: '#fff', 
//     marginTop: 12, 
//     fontSize: 16, 
//     fontWeight: '500',
//     letterSpacing: 0.5
//   },
  
//   // Header y filtros
//   header: { 
//     backgroundColor: '#1e1e1e', 
//     paddingVertical: 12, 
//     paddingBottom: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#333',
//     elevation: 4,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 3,
//   },
//   chipsContainer: {
//     paddingVertical: 4,
//   },
//   chipsContent: { 
//     paddingHorizontal: 16,
//     paddingVertical: 4,
//   },
//   chip: {
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 25,
//     backgroundColor: '#2a2a2a',
//     marginRight: 10,
//     borderWidth: 1,
//     borderColor: '#444',
//     elevation: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.2,
//     shadowRadius: 1.5,
//   },
//   chipSelected: { 
//     backgroundColor: '#bb86fc', 
//     borderColor: '#bb86fc',
//     elevation: 3,
//   },
//   chipText: { 
//     color: '#ddd', 
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   chipTextSelected: { 
//     color: '#121212', 
//     fontWeight: 'bold' 
//   },
//   confirmButton: {
//     backgroundColor: '#FF4081',
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     borderRadius: 25,
//     marginTop: 12,
//     alignSelf: 'center',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 2,
//   },
//   confirmButtonText: { 
//     color: '#fff', 
//     fontWeight: 'bold', 
//     fontSize: 14,
//     letterSpacing: 0.5,
//   },
  
//   // Mapa
//   mapContainer: { 
//     flex: 1,
//     overflow: 'hidden',
//   },
//   map: { 
//     flex: 1,
//   },
  
//   // Botones flotantes
//   addButton: {
//     position: 'absolute',
//     bottom: 30,
//     right: 20,
//     backgroundColor: '#bb86fc',
//     paddingVertical: 14,
//     paddingHorizontal: 24,
//     borderRadius: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     minWidth: 150,
//   },
//   addButtonText: { 
//     color: '#121212', 
//     fontWeight: 'bold',
//     fontSize: 15,
//   },
//   raiteButton: {
//     position: 'absolute',
//     bottom: 30,
//     left: 20,
//     backgroundColor: '#FF4081',
//     paddingVertical: 14,
//     paddingHorizontal: 24,
//     borderRadius: 30,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 3 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     minWidth: 150,
//   },
//   raiteButtonText: { 
//     color: '#fff', 
//     fontWeight: 'bold',
//     fontSize: 15,
//   },
  
//   // Overlays
//   loadingOverlay: {
//     position: 'absolute',
//     top: 0,
//     left: 0,
//     right: 0,
//     bottom: 0,
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     zIndex: 10,
//   },
  
//   // Modales
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.75)',
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   modalContainer: {
//     backgroundColor: '#1e1e1e',
//     width: '90%',
//     padding: 24,
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#333',
//     elevation: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.3,
//     shadowRadius: 6,
//     maxHeight: '80%',
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 20,
//     color: '#bb86fc',
//     textAlign: 'center',
//     letterSpacing: 0.5,
//   },
//   modalMessage: { 
//     color: '#ddd', 
//     marginBottom: 20, 
//     textAlign: 'center',
//     lineHeight: 22,
//     fontSize: 16,
//   },
//   modalInput: {
//     borderWidth: 1,
//     borderColor: '#444',
//     borderRadius: 12,
//     padding: 14,
//     marginBottom: 16,
//     color: '#fff',
//     backgroundColor: '#2a2a2a',
//     fontSize: 16,
//   },
//   modalButtons: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-around',
//     marginTop: 10,
//   },
//   modalButton: {
//     backgroundColor: '#bb86fc',
//     paddingVertical: 12,
//     paddingHorizontal: 24,
//     borderRadius: 12,
//     minWidth: 120,
//     alignItems: 'center',
//     justifyContent: 'center',
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//   },
//   modalButtonCancel: { 
//     backgroundColor: '#333',
//   },
//   modalButtonText: { 
//     color: '#121212', 
//     fontWeight: 'bold',
//     fontSize: 15,
//   },
  
//   // Lista de amigos
//   friendsList: { 
//     maxHeight: 250, 
//     marginBottom: 20,
//     borderRadius: 12,
//     backgroundColor: '#2a2a2a',
//     padding: 8,
//   },
//   friendItem: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderBottomWidth: 1,
//     borderColor: '#444',
//     borderRadius: 8,
//     marginVertical: 2,
//   },
//   friendText: { 
//     color: '#fff', 
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   checkMark: { 
//     color: '#4CAF50', 
//     fontSize: 18, 
//     fontWeight: 'bold' 
//   },
  
//   // Selección de imágenes
//   galleryButton: {
//     backgroundColor: '#4f0c2e',
//     paddingVertical: 14,
//     paddingHorizontal: 24,
//     borderRadius: 12,
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginVertical: 16,
//     elevation: 3,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 2,
//   },
  
//   // Información del lugar
//   ownerInfoContainer: {
//     alignItems: 'center',
//     marginBottom: 20,
//     backgroundColor: 'rgba(255,255,255,0.05)',
//     padding: 16,
//     borderRadius: 16,
//     width: '100%',
//   },
//   ownerAvatar: {
//     width: 80,
//     height: 80,
//     borderRadius: 40,
//     marginBottom: 10,
//     borderWidth: 3,
//     borderColor: '#bb86fc',
//     backgroundColor: '#333',
//   },
//   ownerName: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#fff',
//     textAlign: 'center',
//     marginTop: 4,
//   },
//   placeImage: {
//     width: '100%',
//     height: 200,
//     borderRadius: 16,
//     marginBottom: 20,
//     borderWidth: 1,
//     borderColor: '#444',
//   },
//   modalDescription: {
//     fontSize: 16,
//     color: '#ddd',
//     marginBottom: 20,
//     textAlign: 'left',
//     paddingHorizontal: 10,
//     lineHeight: 22,
//   },
//   modalRating: {
//     fontSize: 18,
//     color: '#FFD700',
//     marginBottom: 24,
//     fontWeight: '600',
//   },
//   modalContent: {
//     alignItems: 'center',
//     paddingBottom: 20,
//   },
//   modalTitleM: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#bb86fc',
//     marginBottom: 16,
//     textAlign: 'center',
//   },
//   //noti raite
//   badge: {
//     position: 'absolute',
//     top: -8,
//     right: -8,
//     width: 20,
//     height: 20,
//     borderRadius: 10,
//     backgroundColor: '#FF4081',
//     borderWidth: 2,
//     borderColor: '#121212',
//     zIndex: 2,
//   },
  
  
//   // Estrellas de calificación
//   starRatingContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginVertical: 16,
//   },
//   starButton: {
//     padding: 5,
//   },
//   starIcon: {
//     fontSize: 32,
//   },
  
//   // Imágenes seleccionadas
//   selectedImagesContainer: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     justifyContent: 'center',
//     marginVertical: 10,
//   },
//   selectedImagePreview: {
//     width: 80,
//     height: 80,
//     margin: 5,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: '#bb86fc',
//   },
//   viewRouteButton: {
//     marginTop: 12,
//     paddingVertical: 10,
//     paddingHorizontal: 20,
//     backgroundColor: '#333',
//     borderRadius: 10,
//     alignSelf: 'center',
//   },
//   viewRouteText: {
//     color: '#bb86fc',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   pillBadge: {
//     position: 'absolute',
//     top: 20,
//     right: 20,
//     flexDirection: 'row',
//     backgroundColor: '#FF4081',
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     alignItems: 'center',
//     elevation: 6,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//     zIndex: 10,
//   },
//   pillBadgeText: {
//     color: '#fff',
//     fontSize: 14,
//     fontWeight: 'bold',
//   },
//   webContainer: {
//     flex: 1,
//     backgroundColor: '#121212',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   webContent: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   webTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#fff',
//     marginBottom: 20,
//   },
//   webDescription: {
//     fontSize: 16,
//     color: '#fff',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   downloadButton: {
//     backgroundColor: '#FF4081',
//     paddingVertical: 14,
//     paddingHorizontal: 24,
//     borderRadius: 20,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   downloadButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
// });
