import React, { useEffect, useState, useRef } from "react";
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, Platform, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../../context/AuthContext";

type UserLocation = {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
};

// Fungsi Haversine untuk menghitung jarak antara 2 titik (dalam meter)
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radius bumi dalam meter
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // jarak dalam meter
};

export default function MapScreen() {
  const { user } = useAuth();
  const [usersLocations, setUsersLocations] = useState<UserLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [mapProvider, setMapProvider] = useState<any>(
    Platform.OS === "android" ? PROVIDER_GOOGLE : undefined
  );
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    // Listen to changes in the 'users' collection in real-time
    const q = query(collection(db, "users"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const locations: UserLocation[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.location && data.location.latitude && data.location.longitude) {
          locations.push({
            id: doc.id,
            name: data.name || "Unknown User",
            location: {
              latitude: data.location.latitude,
              longitude: data.location.longitude,
            }
          });
        }
      });
      
      setUsersLocations(locations);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching locations: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1877F2" />
        <Text style={styles.loadingText}>Memuat Peta...</Text>
      </View>
    );
  }

  // Set region awal jika ada user, jika tidak gunakan default ITK
  const initialRegion = {
    latitude: -1.1495, // Default latitude untuk area Balikpapan (misal)
    longitude: 116.8643, // Default longitude
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      {Platform.OS === "ios" && (
        <View style={styles.providerToggleContainer}>
          <TouchableOpacity 
            style={[styles.providerButton, mapProvider === undefined && styles.providerButtonActive]}
            onPress={() => setMapProvider(undefined)}
          >
            <Text style={[styles.providerButtonText, mapProvider === undefined && styles.providerButtonTextActive]}>Apple Maps</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.providerButton, mapProvider === PROVIDER_GOOGLE && styles.providerButtonActive]}
            onPress={() => setMapProvider(PROVIDER_GOOGLE)}
          >
            <Text style={[styles.providerButtonText, mapProvider === PROVIDER_GOOGLE && styles.providerButtonTextActive]}>Google Maps</Text>
          </TouchableOpacity>
        </View>
      )}

      <MapView
        ref={mapRef}
        provider={mapProvider}
        style={styles.map}
        initialRegion={initialRegion}
        showsUserLocation={true} // Menampilkan titik biru bawaan maps untuk lokasi user sendiri
        showsMyLocationButton={true}
      >
        {usersLocations.map((u) => {
          let distanceText = "";
          // Ambil lokasi current user dari list usersLocations
          const currentUser = usersLocations.find(loc => loc.id === user?.id);
          
          if (u.id !== user?.id && currentUser) {
            const dist = getDistance(
              currentUser.location.latitude,
              currentUser.location.longitude,
              u.location.latitude,
              u.location.longitude
            );
            
            if (dist < 1000) {
              distanceText = ` (Jarak: ${Math.round(dist)} meter)`;
            } else {
              distanceText = ` (Jarak: ${(dist / 1000).toFixed(1)} km)`;
            }
          }

          return (
            <Marker
              key={u.id}
              coordinate={{
                latitude: u.location.latitude,
                longitude: u.location.longitude,
              }}
              title={u.id === user?.id ? "Anda (You)" : u.name}
              description={u.id === user?.id ? "Lokasi Anda saat ini" : `Lokasi ${u.name}${distanceText}`}
              pinColor={u.id === user?.id ? "blue" : "red"} // Biru untuk user sendiri, merah untuk user lain
            />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  providerToggleContainer: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
  providerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  providerButtonActive: {
    backgroundColor: "#1877F2",
  },
  providerButtonText: {
    color: "#666",
    fontWeight: "600",
  },
  providerButtonTextActive: {
    color: "white",
  },
});
