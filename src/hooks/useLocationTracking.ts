import { useEffect, useState } from "react";
import * as Location from "expo-location";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

export function useLocationTracking() {
  const { user } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      try {
        if (!user) return; // Hanya track jika user sudah login

        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Permission to access location was denied");
          return;
        }

        // Mulai memantau lokasi pengguna secara berkala
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 10000, // Update tiap 10 detik
            distanceInterval: 10, // Atau update setiap pindah 10 meter
          },
          async (location) => {
            const { latitude, longitude } = location.coords;

            // Simpan ke Firestore di document user saat ini
            try {
              const userRef = doc(db, "users", user.id);
              await updateDoc(userRef, {
                location: {
                  latitude,
                  longitude,
                },
                lastLocationUpdate: serverTimestamp(),
              });
            } catch (err) {
              console.error("Error updating location to Firestore:", err);
            }
          }
        );
      } catch (err) {
        console.error("Error starting location tracking:", err);
      }
    };

    startTracking();

    // Membersihkan listener ketika komponen unmount atau user logout
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [user]);

  return { errorMsg };
}
