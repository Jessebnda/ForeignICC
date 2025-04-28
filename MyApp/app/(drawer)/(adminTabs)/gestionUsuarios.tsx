import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  StatusBar,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, getDocs, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { firestore } from '../../../firebase';

//@ts-ignore
export default function ManagementScreen({ navigation }) {
  interface User {
    id: string;
    name?: string;
    email?: string;
    role?: string;
    photoURL?: string;
  }

  interface Mentor {
    id: string;
    name?: string;
    specialty?: string;
    photoURL?: string;
  }

  interface Post {
    id: string;
    caption?: string;
    text?: string;
    image?: string;
    userId?: string;
    userName?: string;
    userPhoto?: string;
    location?: string;
    createdAt?: any;
    likes?: Record<string, boolean>;
  }

  interface Location {
    id: string;
    title?: string;
    description?: string;
    geoPoint?: {
      latitude: number;
      longitude: number;
    };
    imageUrl?: string;
    imageUrls?: string[];
    type?: string[];
    createdAt?: any;
    createdBy?: string;
  }

  interface Forum {
    id: string;
    title?: string;
    question?: string;
    authorId?: string;
    authorName?: string;
    createdAt?: any;
  }

  type DataItem = User | Mentor | Post | Location | Forum;

  // Category configuration
  const categories = [
    { 
      id: 'users', 
      name: 'Estudiantes', 
      collection: 'users',
      icon: <Ionicons name="person-outline" size={24} color="#b388ff" />
    },
    { 
      id: 'mentors', 
      name: 'Mentores', 
      collection: 'mentors',
      icon: <FontAwesome5 name="chalkboard-teacher" size={22} color="#b388ff" />
    },
    { 
      id: 'posts', 
      name: 'Posts', 
      collection: 'feedPosts',
      icon: <MaterialCommunityIcons name="post-outline" size={24} color="#b388ff" />
    },
    { 
      id: 'locations', 
      name: 'Ubicaciones', 
      collection: 'mapLocations',
      icon: <MaterialIcons name="location-on" size={24} color="#b388ff" />
    },
    { 
      id: 'forums', 
      name: 'Foros', 
      collection: 'forumQuestions',
      icon: <MaterialCommunityIcons name="forum-outline" size={24} color="#b388ff" />
    }
  ];

  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [items, setItems] = useState<DataItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<DataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortBy, setSortBy] = useState('name'); // Default sort field

  useEffect(() => {
    fetchItems();
  }, [activeCategory]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems(items);
    } else {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = items.filter(item => {
        // Different search fields based on category
        switch(activeCategory.id) {
          case 'users':
            return (item as User).name?.toLowerCase().includes(lowercasedQuery) || 
                   (item as User).email?.toLowerCase().includes(lowercasedQuery);
          case 'mentors':
            return (item as Mentor).name?.toLowerCase().includes(lowercasedQuery) || 
                   (item as Mentor).specialty?.toLowerCase().includes(lowercasedQuery);
          case 'posts':
            return (item as Post).caption?.toLowerCase().includes(lowercasedQuery) || 
                   (item as Post).text?.toLowerCase().includes(lowercasedQuery) ||
                   (item as Post).userName?.toLowerCase().includes(lowercasedQuery);
          case 'locations':
            return (item as Location).title?.toLowerCase().includes(lowercasedQuery) || 
                   (item as Location).description?.toLowerCase().includes(lowercasedQuery);
          case 'forums':
            return (item as Forum).title?.toLowerCase().includes(lowercasedQuery) || 
                   (item as Forum).question?.toLowerCase().includes(lowercasedQuery);
          default:
            return false;
        }
      });
      setFilteredItems(filtered);
    }
  }, [searchQuery, items, activeCategory]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setSearchQuery('');
      
      // Get appropriate sort field based on category
      let sortField = getSortFieldForCategory();
      
      // Create a query with sorting
      const itemsRef = collection(firestore, activeCategory.collection);
      const q = query(itemsRef, orderBy(sortField, sortOrder));
      
      const querySnapshot = await getDocs(q);
      const itemsList: DataItem[] = [];
      
      querySnapshot.forEach((doc) => {
        itemsList.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setItems(itemsList);
      setFilteredItems(itemsList);
      setLoading(false);
      setRefreshing(false);
    } catch (error) {
      console.error(`Error fetching ${activeCategory.name}:`, error);
      Alert.alert("Error", `No se pudieron cargar los ${activeCategory.name.toLowerCase()}`);
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getSortFieldForCategory = () => {
    // Return appropriate default sort field based on category
    switch(activeCategory.id) {
      case 'users':
        return sortBy === 'createdAt' ? 'createdAt' : (sortBy === 'email' ? 'email' : 'name');
      case 'mentors':
        return sortBy === 'createdAt' ? 'createdAt' : 'name';
      case 'posts':
        return sortBy === 'createdAt' ? 'createdAt' : (sortBy === 'userName' ? 'userName' : 'caption');
      case 'locations':
        return sortBy === 'createdAt' ? 'createdAt' : 'title';
      case 'forums':
        return sortBy === 'createdAt' ? 'createdAt' : 'title';
      default:
        return 'name';
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchItems();
  };

  const handleDeleteItem = (itemId: string) => {
    const alertOptions = [
      {
        text: "Cancelar",
        style: "cancel" as "cancel"
      },
      { 
        text: "Eliminar", 
        style: "destructive" as "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(firestore, activeCategory.collection, itemId));
            // Remove item from state
            const updatedItems = items.filter(item => item.id !== itemId);
            setItems(updatedItems);
            setFilteredItems(updatedItems);
            Alert.alert("Éxito", `${activeCategory.name.slice(0, -1)} eliminado correctamente`);
          } catch (error) {
            console.error(`Error deleting ${activeCategory.name.slice(0, -1)}:`, error);
            Alert.alert("Error", `No se pudo eliminar el ${activeCategory.name.slice(0, -1).toLowerCase()}`);
          }
        }
      }
    ];

    Alert.alert(
      "Confirmar eliminación",
      `¿Estás seguro que deseas eliminar este ${activeCategory.name.slice(0, -1).toLowerCase()}? Esta acción no se puede deshacer.`,
      alertOptions
    );
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    setSortOrder(newOrder);
    // Re-fetch with new sort order
    fetchItems();
  };

  const changeSortBy = (field: string) => {
    setSortBy(field);
    // Re-fetch with new sort field
    fetchItems();
  };

  const getSortOptions = () => {
    // Return appropriate sort options based on category
    switch(activeCategory.id) {
      case 'users':
        return [
          { id: 'name', label: 'Nombre' },
          { id: 'email', label: 'Email' },
          { id: 'createdAt', label: 'Fecha' }
        ];
      case 'mentors':
        return [
          { id: 'name', label: 'Nombre' },
          { id: 'specialty', label: 'Especialidad' },
          { id: 'createdAt', label: 'Fecha' }
        ];
      case 'posts':
        return [
          { id: 'caption', label: 'Título' },
          { id: 'userName', label: 'Usuario' },
          { id: 'createdAt', label: 'Fecha' }
        ];
      case 'locations':
        return [
          { id: 'title', label: 'Nombre' },
          { id: 'type', label: 'Tipo' },
          { id: 'createdAt', label: 'Fecha' }
        ];
      case 'forums':
        return [
          { id: 'title', label: 'Título' },
          { id: 'authorName', label: 'Autor' },
          { id: 'createdAt', label: 'Fecha' }
        ];
      default:
        return [
          { id: 'name', label: 'Nombre' },
          { id: 'createdAt', label: 'Fecha' }
        ];
    }
  };

  const renderItem = ({ item }: { item: DataItem }) => {
    // Render different item layouts based on category
    switch(activeCategory.id) {
      case 'users':
        return renderUserItem(item as User);
      case 'mentors':
        return renderMentorItem(item as Mentor);
      case 'posts':
        return renderPostItem(item as Post);
      case 'locations':
        return renderLocationItem(item as Location);
      case 'forums':
        return renderForumItem(item as Forum);
      default:
        return null;
    }
  };

  const renderUserItem = (user: User) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <View style={styles.avatarContainer}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>{user.name ? user.name.charAt(0).toUpperCase() : '?'}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{user.name || 'Sin nombre'}</Text>
          <Text style={styles.itemSubtitle}>{user.email || 'Sin email'}</Text>
          {user.role && <Text style={styles.itemMeta}>{user.role}</Text>}
        </View>
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditItem', { itemId: user.id, category: activeCategory.id })}
        >
          <Feather name="edit-2" size={16} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteItem(user.id)}
        >
          <Feather name="trash-2" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMentorItem = (mentor: Mentor) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <View style={styles.avatarContainer}>
          {mentor.photoURL ? (
            <Image source={{ uri: mentor.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>{mentor.name ? mentor.name.charAt(0).toUpperCase() : '?'}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{mentor.name || 'Sin nombre'}</Text>
          <Text style={styles.itemSubtitle}>{mentor.specialty || 'Sin especialidad'}</Text>
        </View>
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditItem', { itemId: mentor.id, category: activeCategory.id })}
        >
          <Feather name="edit-2" size={16} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteItem(mentor.id)}
        >
          <Feather name="trash-2" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPostItem = (post: Post) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        {post.image && (
          <View style={styles.postImageContainer}>
            <Image 
              source={{ uri: post.image }} 
              style={styles.postThumbnail}
              resizeMode="cover"
            />
          </View>
        )}
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{post.caption || post.text || 'Sin título'}</Text>
          <Text style={styles.itemSubtitle}>
            Por: {post.userName || 'Anónimo'} {post.location ? `• ${post.location}` : ''}
          </Text>
          <View style={styles.postStats}>
            <View style={styles.postStat}>
              <Ionicons name="heart" size={14} color="#b388ff" />
              <Text style={styles.postStatText}>
                {post.likes ? Object.keys(post.likes).length : 0}
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditItem', { itemId: post.id, category: activeCategory.id })}
        >
          <Feather name="edit-2" size={16} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteItem(post.id)}
        >
          <Feather name="trash-2" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLocationItem = (location: Location) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        {location.imageUrl && (
          <View style={styles.locationImageContainer}>
            <Image 
              source={{ uri: location.imageUrl }} 
              style={styles.locationThumbnail}
              resizeMode="cover"
            />
          </View>
        )}
        
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{location.title || 'Sin nombre'}</Text>
          <Text style={styles.itemSubtitle} numberOfLines={2}>
            {location.description || 'Sin descripción'}
          </Text>
          
          {location.geoPoint && (
            <Text style={styles.itemMeta}>
              {location.geoPoint.latitude.toFixed(4)}, {location.geoPoint.longitude.toFixed(4)}
            </Text>
          )}
          
          {location.type && location.type.length > 0 && (
            <View style={styles.tagContainer}>
              {location.type.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditItem', { itemId: location.id, category: activeCategory.id })}
        >
          <Feather name="edit-2" size={16} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteItem(location.id)}
        >
          <Feather name="trash-2" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderForumItem = (forum: Forum) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <View style={styles.itemDetails}>
          <Text style={styles.itemTitle}>{forum.title || 'Sin título'}</Text>
          <Text style={styles.itemSubtitle} numberOfLines={2}>{forum.question || 'Sin pregunta'}</Text>
          <Text style={styles.itemMeta}>Por: {forum.authorName || 'Anónimo'}</Text>
        </View>
      </View>
      
      <View style={styles.itemActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => navigation.navigate('EditItem', { itemId: forum.id, category: activeCategory.id })}
        >
          <Feather name="edit-2" size={16} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteItem(forum.id)}
        >
          <Feather name="trash-2" size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {activeCategory.icon}
      <Text style={styles.emptyText}>No hay {activeCategory.name.toLowerCase()} para mostrar</Text>
      {searchQuery.length > 0 && (
        <Text style={styles.emptySubText}>Intenta con otra búsqueda</Text>
      )}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={`Buscar ${activeCategory.name.toLowerCase()}...`}
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Feather name="x" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Ordenar por:</Text>
        <View style={styles.sortButtons}>
          {getSortOptions().map(option => (
            <TouchableOpacity 
              key={option.id}
              style={[styles.sortButton, sortBy === option.id && styles.sortButtonActive]}
              onPress={() => changeSortBy(option.id)}
            >
              <Text style={[styles.sortButtonText, sortBy === option.id && styles.sortButtonTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity onPress={toggleSortOrder} style={styles.sortOrderButton}>
            <MaterialIcons 
              name={sortOrder === 'asc' ? 'arrow-upward' : 'arrow-downward'} 
              size={20} 
              color="#b388ff" 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Mostrando {filteredItems.length} de {items.length} {activeCategory.name.toLowerCase()}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      

      
      {/* Fixed height container for category selector */}
      <View style={styles.categorySelectorContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categorySelectorContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                activeCategory.id === category.id && styles.categoryButtonActive
              ]}
              onPress={() => setActiveCategory(category)}
            >
              <View style={styles.categoryIconContainer}>
                {category.icon}
              </View>
              <Text 
                style={[
                  styles.categoryButtonText,
                  activeCategory.id === category.id && styles.categoryButtonTextActive
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#b388ff" />
          <Text style={styles.loadingText}>Cargando {activeCategory.name.toLowerCase()}...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#b388ff"
              colors={["#b388ff"]}
            />
          }
        />
      )}
      
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => navigation.navigate('AddItem', { category: activeCategory.id })}
      >
        <Ionicons name="add" size={30} color="#000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  addButton: {
    padding: 8,
  },
  // Fixed height container for category selector
  categorySelectorContainer: {
    height: 64, // Fixed height that accommodates the category buttons
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    justifyContent: 'center', // Center the ScrollView vertically
  },
  categorySelectorContent: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center', // Ensure all items are vertically centered
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#222',
    height: 40, // Fixed height for all buttons
    minWidth: 100, // Minimum width to ensure consistent sizing
  },
  categoryButtonActive: {
    backgroundColor: '#b388ff33',
  },
  categoryIconContainer: {
    marginRight: 8,
    width: 24, // Fixed width for icon container
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryButtonText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  categoryButtonTextActive: {
    color: '#b388ff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 80,
  },
  headerContainer: {
    padding: 16,
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#222',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 16,
  },
  sortContainer: {
    marginBottom: 12,
  },
  sortLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  sortButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: '#222',
  },
  sortButtonActive: {
    backgroundColor: '#b388ff33',
  },
  sortButtonText: {
    color: '#999',
    fontSize: 14,
  },
  sortButtonTextActive: {
    color: '#b388ff',
  },
  sortOrderButton: {
    padding: 6,
  },
  statsContainer: {
    marginTop: 8,
  },
  statsText: {
    color: '#999',
    fontSize: 14,
  },
  itemCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    marginRight: 12,
  },
  locationIconContainer: {
    marginRight: 12,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    backgroundColor: '#b388ff33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#b388ff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemDetails: {
    flex: 1,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemSubtitle: {
    color: '#999',
    fontSize: 14,
    marginBottom: 4,
  },
  itemMeta: {
    color: '#b388ff',
    fontSize: 12,
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#2a2a2a',
  },
  deleteButton: {
    backgroundColor: '#5c2b29',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    color: '#999',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#b388ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#b388ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  // New styles for posts and locations
  postImageContainer: {
    marginRight: 12,
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  postThumbnail: {
    width: '100%',
    height: '100%',
  },
  postStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  postStatText: {
    color: '#b388ff',
    fontSize: 12,
    marginLeft: 4,
  },
  locationImageContainer: {
    marginRight: 12,
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#2a2a2a',
  },
  locationThumbnail: {
    width: '100%',
    height: '100%',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    color: '#b388ff',
    fontSize: 10,
    fontWeight: '500',
  },
});
