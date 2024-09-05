import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import MapView, { Polyline, Marker } from "react-native-maps";
import * as Location from "expo-location";
import Icon from "react-native-vector-icons/MaterialIcons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { db, auth } from "../../../firebase/Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import { useFocusEffect } from "@react-navigation/native";

export default function ExerciseTracker({ navigation }) {
  const [location, setLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [time, setTime] = useState(0);
  const [calories, setCalories] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [mode, setMode] = useState("walking");
  const mapRef = useRef(null);
  const startTimeRef = useRef(null);
  const locationSubscription = useRef(null);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.log("Permission to access location was denied");
        return;
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetTracking();
    }, [])
  );

  const resetTracking = useCallback(() => {
    setLocation(null);
    setRoute([]);
    setDistance(0);
    setTime(0);
    setCalories(0);
    setTracking(false);
  }, []);

  const startTracking = useCallback(async () => {
    startTimeRef.current = new Date();
    setTracking(true);
    resetTracking();

    if (locationSubscription.current) {
      locationSubscription.current.remove();
    }

    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 1 },
      (newLocation) => {
        if (newLocation) {
          setLocation(newLocation.coords);
          setRoute((prevRoute) => [...prevRoute, newLocation.coords]);
          calculateDistance(newLocation.coords);
          updateTime();
          centerMap(newLocation.coords);
        }
      }
    );
  }, [calculateDistance, updateTime, centerMap, resetTracking]);

  const stopTracking = useCallback(async () => {
    setTracking(false);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    const user = auth.currentUser;
    if (user) {
      const exerciseData = {
        userId: user.uid,
        distance: distance.toFixed(2),
        time,
        calories: calories.toFixed(0),
        mode,
        createdAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem("exerciseData", JSON.stringify(exerciseData));
      uploadDataToFirebase(exerciseData);
    }
  }, [distance, time, calories, mode, uploadDataToFirebase]);

  const uploadDataToFirebase = useCallback(async (data) => {
    const user = auth.currentUser;
    if (user) {
      await addDoc(collection(db, "exerciseData"), {
        ...data,
        createdAt: serverTimestamp(),
      });
    }
  }, []);

  const calculateDistance = useCallback(
    (newCoords) => {
      if (route.length > 0) {
        const lastCoords = route[route.length - 1];
        const dist = getDistanceFromLatLonInKm(
          lastCoords.latitude,
          lastCoords.longitude,
          newCoords.latitude,
          newCoords.longitude
        );
        setDistance((prevDistance) => prevDistance + dist);
        updateCalories(dist);
      }
    },
    [route, updateCalories]
  );

  const updateCalories = useCallback(
    (dist) => {
      const caloriesPerKm =
        {
          walking: 50,
          running: 100,
          cycling: 75,
        }[mode] || 50;
      setCalories((prevCalories) => prevCalories + dist * caloriesPerKm);
    },
    [mode]
  );

  const updateTime = useCallback(() => {
    const now = new Date();
    const elapsedTime = Math.floor((now - startTimeRef.current) / 60000);
    setTime(elapsedTime);
  }, []);

  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const deg2rad = (deg) => deg * (Math.PI / 180);

  const centerMap = useCallback((coords) => {
    if (mapRef.current && coords) {
      mapRef.current.animateToRegion(
        {
          latitude: coords.latitude,
          longitude: coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  }, []);

  return (
    <View
      style={{ backgroundColor: isDarkTheme ? "#1e1e1e" : "#f5f5f5", flex: 1 }}
    >
      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            <Text
              style={[styles.header, { color: isDarkTheme ? "#fff" : "#000" }]}
            >
              {isThaiLanguage ? "ตัวติดตามการออกกำลังกาย" : "Exercise Tracker"}
            </Text>
            <View
              style={[
                styles.statsContainer,
                { backgroundColor: isDarkTheme ? "#2c2c2c" : "#fff" },
              ]}
            >
              <Text
                style={[
                  styles.statText,
                  { color: isDarkTheme ? "#fff" : "#000" },
                ]}
              >
                {isThaiLanguage ? "ระยะทาง" : "Distance"}: {distance.toFixed(2)}{" "}
                Km
              </Text>
              <Text
                style={[
                  styles.statText,
                  { color: isDarkTheme ? "#fff" : "#000" },
                ]}
              >
                {isThaiLanguage ? "เวลา" : "Time"}: {time} min
              </Text>
              <Text
                style={[
                  styles.statText,
                  { color: isDarkTheme ? "#fff" : "#000" },
                ]}
              >
                {isThaiLanguage ? "แคลอรี่" : "Calories"}: {calories.toFixed(0)}{" "}
                cal
              </Text>
            </View>
            <MapView ref={mapRef} style={styles.map}>
              <Polyline
                coordinates={route}
                strokeWidth={5}
                strokeColor="green"
              />
              {location && (
                <Marker coordinate={location}>
                  <Icon name="person-pin-circle" size={40} color="red" />
                </Marker>
              )}
            </MapView>
            <View style={styles.modeContainer}>
              {["walking", "running", "cycling"].map((activity) => (
                <TouchableOpacity
                  key={activity}
                  onPress={() => setMode(activity)}
                  style={styles.modeButton}
                >
                  <Icon
                    name={
                      activity === "walking"
                        ? "directions-walk"
                        : activity === "running"
                        ? "directions-run"
                        : "directions-bike" // Corrected icon name
                    }
                    size={24}
                    color={
                      mode === activity
                        ? "#FF5722"
                        : isDarkTheme
                        ? "#fff"
                        : "#000"
                    }
                  />
                  <Text
                    style={[
                      styles.modeText,
                      { color: isDarkTheme ? "#fff" : "#000" },
                    ]}
                  >
                    {isThaiLanguage
                      ? activity === "walking"
                        ? "เดิน"
                        : activity === "running"
                        ? "วิ่ง"
                        : "ขี่จักรยาน"
                      : activity.charAt(0).toUpperCase() + activity.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.locateButton}
              onPress={() => centerMap(location)}
            >
              <Icon name="my-location" size={24} color="white" />
              <Text style={styles.locateButtonText}>
                {isThaiLanguage ? "ค้นหาฉัน" : "Locate Me"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.startButton}
              onPress={tracking ? stopTracking : startTracking}
            >
              <Icon
                name={tracking ? "stop" : "play-arrow"}
                size={24}
                color="white"
              />
              <Text style={styles.startButtonText}>
                {tracking
                  ? isThaiLanguage
                    ? "หยุด"
                    : "Stop"
                  : isThaiLanguage
                  ? "เริ่ม"
                  : "Start"}
              </Text>
            </TouchableOpacity>
          </>
        }
        keyExtractor={(item, index) => index.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 26,
    fontFamily: "NotoSansThai-Regular",
    textAlign: "center",
    marginVertical: 15,
  },
  statsContainer: {
    padding: 20,
    borderRadius: 10,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statText: {
    fontFamily: "NotoSansThai-Regular",
    fontSize: 18,
    marginVertical: 5,
  },
  map: {
    height: 300,
    margin: 10,
    borderRadius: 10,
  },
  modeContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 10,
  },
  modeButton: {
    alignItems: "center",
  },
  modeText: {
    fontFamily: "NotoSansThai-Regular",
    fontSize: 14,
    marginTop: 5,
  },
  locateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#2196F3",
    borderRadius: 8,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  locateButtonText: {
    color: "white",
    fontFamily: "NotoSansThai-Regular",
    marginLeft: 5,
    fontSize: 16,
  },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#FF5722",
    borderRadius: 8,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  startButtonText: {
    color: "white",
    fontFamily: "NotoSansThai-Regular",
    marginLeft: 5,
    fontSize: 16,
  },
});
