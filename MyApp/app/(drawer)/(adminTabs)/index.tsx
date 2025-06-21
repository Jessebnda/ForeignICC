import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../../../firebase';
import { useNavigation } from 'expo-router'; // <--- AÑADIDO
import MaxWidthContainer from '../../../components/MaxWidthContainer';

export default function App() {
  const navigation = useNavigation(); // <--- AÑADIDO
  const [loading, setLoading] = useState({
    students: true,
    mentors: true,
    posts: true,
    locations: true,
    forums: true
  });
  const [counts, setCounts] = useState({
    students: 0,
    mentors: 0,
    posts: 0,
    locations: 0,
    forums: 0
  });

  useEffect(() => {
    fetchCounts();
  }, []);

  const handleNavigation = (path?: string) => {
    if (path) {
      navigation.navigate(path as never); // Cast para evitar error de tipo
    }
  };

  const fetchCounts = async () => {
    try {
      const usersCollection = collection(firestore, 'users');
      const userSnapshot = await getDocs(usersCollection);
      setCounts(prev => ({ ...prev, students: userSnapshot.size }));
      setLoading(prev => ({ ...prev, students: false }));

      try {
        const mentorsCollection = collection(firestore, 'mentors');
        const mentorsSnapshot = await getDocs(mentorsCollection);
        setCounts(prev => ({ ...prev, mentors: mentorsSnapshot.size }));
      } catch (error) {
        console.error("Error fetching mentors:", error);
      } finally {
        setLoading(prev => ({ ...prev, mentors: false }));
      }

      try {
        const postsCollection = collection(firestore, 'posts');
        const postsSnapshot = await getDocs(postsCollection);
        setCounts(prev => ({ ...prev, posts: postsSnapshot.size }));
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(prev => ({ ...prev, posts: false }));
      }

      try {
        const locationsCollection = collection(firestore, 'locations');
        const locationsSnapshot = await getDocs(locationsCollection);
        setCounts(prev => ({ ...prev, locations: locationsSnapshot.size }));
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(prev => ({ ...prev, locations: false }));
      }

      try {
        const forumsCollection = collection(firestore, 'forums');
        const forumsSnapshot = await getDocs(forumsCollection);
        setCounts(prev => ({ ...prev, forums: forumsSnapshot.size }));
      } catch (error) {
        console.error("Error fetching forums:", error);
      } finally {
        setLoading(prev => ({ ...prev, forums: false }));
      }

    } catch (error) {
      console.error("Error fetching counts:", error);
      setLoading({
        students: false,
        mentors: false,
        posts: false,
        locations: false,
        forums: false
      });
    }
  };

  const sections = [
    {
      id: 'students',
      title: 'Estudiantes',
      icon: <Ionicons name="person-outline" size={28} color="#b388ff" />,
      count: counts.students,
      loading: loading.students,
      action: 'Ir a la gestión de Estudiantes',
      path: 'manageUsers' // 🔥 Agregado path
    },
    {
      id: 'mentors',
      title: 'Mentores',
      icon: <FontAwesome5 name="chalkboard-teacher" size={28} color="#b388ff" />,
      count: counts.mentors,
      loading: loading.mentors,
      action: 'Ir a la gestión de Mentores',
      path: 'manageMentors' // 🔥 Agregado path
    },
    {
      id: 'posts',
      title: 'Posts',
      icon: <MaterialCommunityIcons name="post-outline" size={28} color="#b388ff" />,
      count: counts.posts,
      loading: loading.posts,
      action: 'Ir a la gestión de Posts',
      path: 'gestionPosts' // 🔥 Agregado path
    },
    {
      id: 'locations',
      title: 'Ubicaciones',
      icon: <MaterialIcons name="location-on" size={28} color="#b388ff" />,
      count: counts.locations,
      loading: loading.locations,
      action: 'Ir a la gestión de Ubicaciones',
      path: 'gestionUbicaciones' // 🔥 Agregado path
    },
    {
      id: 'forums',
      title: 'Foros',
      icon: <MaterialCommunityIcons name="forum-outline" size={28} color="#b388ff" />,
      count: counts.forums,
      loading: loading.forums,
      action: 'Ir a la gestión de Foros',
      path: 'gestionForos' // 🔥 Agregado path
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <MaxWidthContainer>
        <ScrollView 
          showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        >
          {sections.map((section) => (
            <View key={section.id} style={styles.sectionContainer}>
              <Text style={styles.subtitle}>Gestión de {section.title}</Text>
              <View style={styles.card}>
                {section.icon}
                {section.loading ? (
                  <ActivityIndicator size="large" color="#b388ff" style={styles.loader} />
                ) : (
                  <Text style={styles.countNumber}>{section.count}</Text>
                )}
                <Text style={styles.countLabel}>Total de {section.title}</Text>
              </View>
              <TouchableOpacity style={styles.button} onPress={() => handleNavigation(section.path)}>
                <Text style={styles.buttonText}>{section.action}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </MaxWidthContainer>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    paddingVertical: 20,
  },
  sectionContainer: {
    marginBottom: 30,
  },
  subtitle: {
    color: '#b388ff',
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 10,
    minHeight: 120,
    justifyContent: 'center',
  },
  countNumber: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  countLabel: {
    color: '#fff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#b388ff',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 20,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '500',
  },
  loader: {
    marginVertical: 10,
  },
});