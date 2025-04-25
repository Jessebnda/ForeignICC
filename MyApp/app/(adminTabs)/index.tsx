"use client"

import { useState, useEffect, useCallback } from "react"
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native"
import { router } from "expo-router"
import { FontAwesome5 } from "@expo/vector-icons"
import { firestore } from "../../firebase"
import { collection, query, getDocs } from "firebase/firestore"
import * as Haptics from "expo-haptics"

export default function DoctorDashboard() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [totalDoctors, setTotalDoctors] = useState(0)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const q = query(collection(firestore, "doctors"))
      const querySnapshot = await getDocs(q)
      setTotalDoctors(querySnapshot.size)
    } catch (error) {
      console.error("Error fetching doctor stats:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const onRefresh = useCallback(() => {
    setRefreshing(true)
    fetchStats()
  }, [])

  const handleNavigate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    // router.push("/(drawer)/(admintabs)/doctors/manage")
  }

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4f0b2e" />
        <Text style={styles.loadingText}>Cargando gestión de doctores...</Text>
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4f0b2e"]}
            tintColor="#4f0b2e"
            title="Actualizando..."
            titleColor="#666"
          />
        }
      >
        <Text style={styles.title}>Gestión de Doctores</Text>

        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <FontAwesome5 name="user-md" size={28} color="#4f0b2e" />
          </View>
          <Text style={styles.cardNumber}>{totalDoctors}</Text>
          <Text style={styles.cardLabel}>Total Doctores</Text>
        </View>

        <TouchableOpacity style={styles.manageButton} onPress={handleNavigate}>
          <Text style={styles.manageText}>Ir a Gestión de Doctores</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    padding: 16,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4f0b2e",
    marginBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 24,
    width: "100%",
  },
  iconWrapper: {
    backgroundColor: "#f9e6ee",
    padding: 12,
    borderRadius: 50,
    marginBottom: 12,
  },
  cardNumber: {
    fontSize: 28,
    fontWeight: "700",
    color: "#333",
  },
  cardLabel: {
    fontSize: 16,
    color: "#666",
  },
  manageButton: {
    backgroundColor: "#4f0b2e",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  manageText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
