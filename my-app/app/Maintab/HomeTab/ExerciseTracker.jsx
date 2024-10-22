import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
import {
  collection,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import { useFocusEffect } from "@react-navigation/native";
import { getDistance } from "geolib";

export default function ExerciseTracker({ navigation }) {
  const [location, setLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(0);
  const [time, setTime] = useState(0);
  const [calories, setCalories] = useState(0);
  const [tracking, setTracking] = useState(false);
  const [mode, setMode] = useState("walking");
  const [userWeight, setUserWeight] = useState(70); // Default weight
  const [refreshing, setRefreshing] = useState(false); // Add refreshing state
  const mapRef = useRef(null);
  const startTimeRef = useRef(null);
  const locationSubscription = useRef(null);
  const intervalRef = useRef(null);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const theme = useMemo(
    () => (isDarkTheme ? styles.dark : styles.light),
    [isDarkTheme]
  );
  const iconColor = useMemo(
    () => (isDarkTheme ? "#ffffff" : "#333333"),
    [isDarkTheme]
  );

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return;
      }
    })();

    // Fetch user weight from Firebase
    fetchUserWeight(); // เรียกใช้เพียงครั้งเดียวใน useEffect

    // Cleanup function to stop tracking when component unmounts
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
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
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  }, []);

  const startTracking = useCallback(async () => {
    resetTracking();
    startTimeRef.current = new Date();
    setTracking(true);

    locationSubscription.current = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 0.1 },
      (newLocation) => {
        if (newLocation) {
          setLocation(newLocation.coords); // อัปเดตตำแหน่งปัจจุบัน
          calculateDistance(newLocation.coords); // คำนวณระยะทางจากตำแหน่งใหม่
          centerMap(newLocation.coords); // ตั้งให้แผนที่เลื่อนไปยังตำแหน่งปัจจุบัน
        }
      }
    );    

    intervalRef.current = setInterval(() => {
      updateTime();
    }, 1000);
  }, [calculateDistance, centerMap, resetTracking]);

  const stopTracking = useCallback(async () => {
    setTracking(false);
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
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
      console.log("New Coordinates:", newCoords); // แสดงค่าตำแหน่งใหม่
  
      // เพิ่มตำแหน่งใหม่ลงในเส้นทาง
      setRoute((prevRoute) => {
        const updatedRoute = [...prevRoute, newCoords];
        
        if (updatedRoute.length > 1) {
          const lastCoords = updatedRoute[updatedRoute.length - 2]; // ค่าตำแหน่งล่าสุด
          const dist =
            getDistance(
              { latitude: lastCoords.latitude, longitude: lastCoords.longitude },
              { latitude: newCoords.latitude, longitude: newCoords.longitude }
            ) / 1000; // แปลงระยะทางเป็นกิโลเมตร
  
          console.log("Calculated distance:", dist); // แสดงค่าระยะทางที่คำนวณได้
  
          if (dist > 0) {
            setDistance((prevDistance) => prevDistance + dist); // เพิ่มระยะทางที่คำนวณได้
            updateCalories(dist); // อัปเดตแคลอรี่จากระยะทาง
          }
        }
  
        return updatedRoute; // คืนค่าเส้นทางที่อัปเดตแล้ว
      });
    },
    [updateCalories]
  );
  

  const updateCalories = useCallback(
    (dist) => {
      const caloriesPerKmPerKg =
        {
          walking: 0.035,
          running: 0.075,
          cycling: 0.045,
        }[mode] || 0.035;
      const caloriesBurned = dist * userWeight * caloriesPerKmPerKg;
      setCalories((prevCalories) => prevCalories + caloriesBurned);
    },
    [mode, userWeight]
  );

  const updateTime = useCallback(() => {
    const now = new Date();
    const elapsedTime = Math.floor((now - startTimeRef.current) / 1000);
    setTime(elapsedTime);
  }, []);

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

  const fetchUserWeight = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, "Users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserWeight(parseFloat(userData.weight) || 70); // ตั้งค่าเป็น 70 ถ้าน้ำหนักไม่ถูกต้อง
      } else {
        setUserWeight(70); // ตั้งค่าน้ำหนักเริ่มต้นถ้าไม่มีข้อมูล
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    resetTracking();
    await fetchUserWeight();
    setRefreshing(false);
  }, [resetTracking]);

  return (
    <View style={[{ flex: 1 }, theme.background]}>
      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            <Text style={[styles.header, theme.text]}>
              {isThaiLanguage ? "ตัวติดตามการออกกำลังกาย" : "Exercise Tracker"}
            </Text>
            <View style={[styles.statsContainer, theme.cardBackground]}>
              <Text style={[styles.statText, theme.text]}>
                {isThaiLanguage ? "ระยะทาง" : "Distance"}:{" "}
                {distance < 1
                  ? `${(distance * 1000).toFixed(0)} m`
                  : `${distance.toFixed(2)} Km`}
              </Text>

              <Text style={[styles.statText, theme.text]}>
                {isThaiLanguage ? "เวลา" : "Time"}: {time} sec
              </Text>
              <Text style={[styles.statText, theme.text]}>
                {isThaiLanguage ? "แคลอรี่" : "Calories"}: {calories.toFixed(0)}{" "}
                cal
              </Text>
            </View>
            <MapView ref={mapRef} style={styles.map}>
              <Polyline
                coordinates={route}
                strokeWidth={5}
                strokeColor={theme.primaryColor}
              />
              {location && (
                <Marker coordinate={location}>
                  <Icon
                    name="person-pin-circle"
                    size={40}
                    color={theme.secondaryColor}
                  />
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
                        : "directions-bike"
                    }
                    size={24}
                    color={mode === activity ? theme.primaryColor : iconColor}
                  />
                  <Text style={[styles.modeText, theme.text]}>
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
              style={[styles.locateButton, { backgroundColor: "#008AFF" }]}
              onPress={() => centerMap(location)}
            >
              <Icon name="my-location" size={24} color={"#ffffff"} />
              <Text style={styles.locateButtonText}>
                {isThaiLanguage ? "ค้นหาฉัน" : "Locate Me"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.startButton,
                { backgroundColor: tracking ? "#F44336" : "#00A047" },
              ]}
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
        refreshing={refreshing}
        onRefresh={onRefresh}
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
  light: {
    primaryColor: "#ff7f50",
    secondaryColor: "#ffa07a",
    background: {
      backgroundColor: "#f0f0f0",
    },
    text: {
      color: "#333333",
    },
    cardBackground: {
      backgroundColor: "#ffffff",
    },
  },
  dark: {
    primaryColor: "#ff7f50",
    secondaryColor: "#ffa07a",
    background: {
      backgroundColor: "#212121",
    },
    text: {
      color: "#ffffff",
    },
    cardBackground: {
      backgroundColor: "#2c2c2c",
    },
  },
});
