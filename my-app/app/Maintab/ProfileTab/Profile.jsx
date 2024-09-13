import React, { useState, useCallback } from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Alert,
} from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../firebase/Firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import IconAntDesign from "react-native-vector-icons/AntDesign";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";

export default function Profile({ navigation }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dailyData, setDailyData] = useState([]);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const fetchUserData = useCallback(async (currentUser) => {
    if (currentUser) {
      setUser(currentUser);
      try {
        const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setImage(data.photoURL || null);
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
        Alert.alert(isThaiLanguage ? "ข้อผิดพลาด" : "Error", isThaiLanguage ? "ไม่สามารถดึงข้อมูลผู้ใช้ได้" : "Failed to fetch user data.");
      }
    }
  }, [isThaiLanguage]);

  const fetchUserStatistics = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const q = query(
          collection(db, "exerciseData"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const dailyStats = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const date = new Date(
            data.createdAt.seconds * 1000
          ).toLocaleDateString();
          if (!dailyStats[date]) {
            dailyStats[date] = { distance: 0, calories: 0 };
          }
          dailyStats[date].distance += parseFloat(data.distance);
          dailyStats[date].calories += parseFloat(data.calories);
        });

        const dailyDataArray = Object.keys(dailyStats).map((date) => ({
          date,
          ...dailyStats[date],
        }));

        setDailyData(dailyDataArray);
      } catch (error) {
        console.error("Error fetching user statistics: ", error);
        Alert.alert(isThaiLanguage ? "ข้อผิดพลาด" : "Error", isThaiLanguage ? "ไม่สามารถดึงข้อมูลสถิติได้" : "Failed to fetch statistics.");
      }
    }
  }, [isThaiLanguage]);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = onAuthStateChanged(auth, fetchUserData);
      fetchUserStatistics();
      return () => {
        unsubscribe();
      };
    }, [fetchUserData, fetchUserStatistics])
  );

  const pickImage = async () => {
    setLoading(true);
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image: ", error);
      Alert.alert(isThaiLanguage ? "ข้อผิดพลาด" : "Error", isThaiLanguage ? "ไม่สามารถเลือกภาพได้" : "Failed to pick image.");
    } finally {
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundColor: isDarkTheme ? "#1e1e1e" : "#f5f5f5",
    backgroundGradientFrom: isDarkTheme ? "#1e1e1e" : "#f5f5f5",
    backgroundGradientTo: isDarkTheme ? "#3e3e3e" : "#ffffff",
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // More vibrant color
    labelColor: (opacity = 1) =>
      isDarkTheme
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(0, 0, 0, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726",
    },
    propsForLabels: {
      fontSize: 12,
      fontFamily: "NotoSansThai-Regular",
    },
  };

  return (
    <ScrollView>
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkTheme ? "#222" : "#f0f0f0"}
      />
      <View
        style={[
          styles.container,
          { backgroundColor: isDarkTheme ? "#222" : "#f0f0f0" },
        ]}
      >
        <TouchableOpacity
          style={styles.settingsIcon}
          onPress={() => navigation.navigate("Settings")}
        >
          <Icon
            name="settings"
            size={28}
            color={isDarkTheme ? "#fff" : "#333"}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
          {loading ? (
            <ActivityIndicator size="large" color="#ff7f50" />
          ) : (
            <Image
              style={styles.profileImage}
              source={{
                uri: image || "https://via.placeholder.com/150",
              }}
            />
          )}
          <View style={styles.cameraIcon}>
            <Icon name="camera-alt" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
        <View
          style={[
            styles.infoContainer,
            { backgroundColor: isDarkTheme ? "#333" : "#fff" },
          ]}
        >
          <Icon name="person" size={20} color="#ff7f50" />
          <Text
            style={[styles.label, { color: isDarkTheme ? "#fff" : "#333" }]}
          >
            {isThaiLanguage ? "ชื่อผู้ใช้" : "Username"}
          </Text>
          <Text
            style={[styles.infoText, { color: isDarkTheme ? "#ccc" : "#555" }]}
          >
            {userData.username || "N/A"}
          </Text>
        </View>
        <View
          style={[
            styles.infoContainer,
            { backgroundColor: isDarkTheme ? "#333" : "#fff" },
          ]}
        >
          <Icon name="email" size={20} color="#ff7f50" />
          <Text
            style={[styles.label, { color: isDarkTheme ? "#fff" : "#333" }]}
          >
            {isThaiLanguage ? "อีเมล" : "Email"}
          </Text>
          <Text
            style={[styles.infoText, { color: isDarkTheme ? "#ccc" : "#555" }]}
          >
            {userData.email || "N/A"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Icon name="edit" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {isThaiLanguage ? "แก้ไขโปรไฟล์" : "Edit Profile"}
          </Text>
        </TouchableOpacity>
        <View style={styles.row}>
          <TouchableOpacity
            style={styles.postButton}
            onPress={() => navigation.navigate("ManageMyArticles")}
          >
            <Icon name="grid-on" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {isThaiLanguage ? "โพสต์ของฉัน" : "My Posts"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => navigation.navigate("FavoriteArticles")}
          >
            <Icon name="favorite" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {isThaiLanguage ? "บทความโปรด" : "Favorite Articles"}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.graphContainer}>
          <IconAntDesign
            name="linechart"
            size={24}
            color={isDarkTheme ? "#fff" : "#333"}
          />
          <Text
            style={[
              styles.graphTitle,
              { color: isDarkTheme ? "#fff" : "#333" },
            ]}
          >
            {isThaiLanguage
              ? "แคลอรี่ที่เผาผลาญตามเวลา"
              : "Calories Burned Over Time"}
          </Text>
        </View>
        {dailyData.length > 0 ? (
          <LineChart
            data={{
              labels: dailyData.map((data) => data.date),
              datasets: [
                {
                  data: dailyData.map((data) => data.calories),
                  color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`, // More vibrant color
                  strokeWidth: 3, // Thicker line
                },
              ],
              legend: [isThaiLanguage ? "แคลอรี่ (cal)" : "Calories (cal)"],
            }}
            width={Dimensions.get("window").width - 40} // Adjusted width
            height={220}
            yAxisSuffix=" cal"
            chartConfig={chartConfig}
            style={styles.chart}
          />
        ) : (
          <Text style={styles.noDataText}>
            {isThaiLanguage ? "ไม่มีข้อมูล" : "No data available"}
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  settingsIcon: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
  imageWrapper: {
    position: "relative",
    marginBottom: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: "#ff7f50",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#ff7f50",
    borderRadius: 15,
    padding: 5,
  },
  infoContainer: {
    width: "90%",
    marginBottom: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    flexDirection: "row",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontFamily: "NotoSansThai-Regular",
    marginLeft: 10,
  },
  infoText: {
    fontSize: 16,
    marginLeft: 10,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "90%",
    height: 50,
    backgroundColor: "#ff7f50",
    borderRadius: 8,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "NotoSansThai-Regular",
    marginLeft: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 15,
  },
  postButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
    height: 50,
    backgroundColor: "#ff7f50",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
    height: 50,
    backgroundColor: "#ff7f50",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  graphContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  graphTitle: {
    fontSize: 18,
    fontFamily: "NotoSansThai-Regular",
    marginLeft: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    marginTop: 20,
    fontFamily: "NotoSansThai-Regular",
  },
});