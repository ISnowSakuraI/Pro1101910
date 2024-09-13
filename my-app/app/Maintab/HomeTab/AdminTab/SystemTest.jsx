import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { auth, db, storage } from "../../../../firebase/Firebase";
import { collection, getDocs, query, where, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";
import Icon from 'react-native-vector-icons/MaterialIcons'; // Import the icon library

export default function SystemTest() {
  const [statuses, setStatuses] = useState({
    auth: "Pending",
    db: "Pending",
    storage: "Pending",
    network: "Pending",
    dataExchange: "Pending",
  });
  const [loading, setLoading] = useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const runTests = async () => {
    setLoading(true);
    await Promise.all([
      testAuth(),
      testFirestore(),
      testStorage(),
      testNetwork(),
      testDataExchange(),
    ]);
    setLoading(false);
  };

  const updateStatus = (key, status) => {
    setStatuses((prevStatuses) => ({ ...prevStatuses, [key]: status }));
  };

  const testAuth = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        updateStatus("auth", "Success");
        Alert.alert(
          isThaiLanguage ? "การทดสอบสิทธิ์" : "Auth Test",
          isThaiLanguage ? "การตรวจสอบสิทธิ์ทำงานได้ถูกต้อง" : "Authentication is working correctly"
        );
      } else {
        updateStatus("auth", "No user logged in");
        Alert.alert(
          isThaiLanguage ? "การทดสอบสิทธิ์" : "Auth Test",
          isThaiLanguage ? "ไม่มีผู้ใช้เข้าสู่ระบบ" : "No user is logged in"
        );
      }
    } catch (error) {
      updateStatus("auth", "Failed");
      console.error("Auth Test Error:", error);
      Alert.alert(
        isThaiLanguage ? "การทดสอบสิทธิ์" : "Auth Test",
        `${isThaiLanguage ? "การตรวจสอบสิทธิ์ล้มเหลว: " : "Authentication failed: "}${error.message}`
      );
    }
  };

  const testFirestore = async () => {
    try {
      const q = query(collection(db, "Users"), where("role", "==", "admin"));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        updateStatus("db", "Success");
        Alert.alert(
          isThaiLanguage ? "การทดสอบฐานข้อมูล" : "Database Test",
          isThaiLanguage ? "การเข้าถึงฐานข้อมูลทำงานได้ถูกต้อง" : "Database access is working correctly"
        );
      } else {
        updateStatus("db", "No data found");
        Alert.alert(
          isThaiLanguage ? "การทดสอบฐานข้อมูล" : "Database Test",
          isThaiLanguage ? "ไม่พบข้อมูลในฐานข้อมูล" : "No data found in the database"
        );
      }
    } catch (error) {
      updateStatus("db", "Failed");
      console.error("Database Test Error:", error);
      Alert.alert(
        isThaiLanguage ? "การทดสอบฐานข้อมูล" : "Database Test",
        `${isThaiLanguage ? "การเข้าถึงฐานข้อมูลล้มเหลว: " : "Database access failed: "}${error.message}`
      );
    }
  };

  const testStorage = async () => {
    try {
      const storageRef = ref(storage, "profilePictures/sample.png");
      await getDownloadURL(storageRef);
      updateStatus("storage", "Success");
      Alert.alert(
        isThaiLanguage ? "การทดสอบการจัดเก็บ" : "Storage Test",
        isThaiLanguage ? "การเข้าถึงการจัดเก็บทำงานได้ถูกต้อง" : "Storage access is working correctly"
      );
    } catch (error) {
      updateStatus("storage", "Failed");
      console.error("Storage Test Error:", error);
      Alert.alert(
        isThaiLanguage ? "การทดสอบการจัดเก็บ" : "Storage Test",
        `${isThaiLanguage ? "การเข้าถึงการจัดเก็บล้มเหลว: " : "Storage access failed: "}${error.message}`
      );
    }
  };

  const testNetwork = async () => {
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        updateStatus("network", "Success");
        Alert.alert(
          isThaiLanguage ? "การทดสอบการเชื่อมต่อ" : "Network Test",
          isThaiLanguage ? "การเชื่อมต่ออินเทอร์เน็ตทำงานได้ถูกต้อง" : "Internet connection is working correctly"
        );
      } else {
        updateStatus("network", "Failed");
        Alert.alert(
          isThaiLanguage ? "การทดสอบการเชื่อมต่อ" : "Network Test",
          isThaiLanguage ? "ไม่มีการเชื่อมต่ออินเทอร์เน็ต" : "No internet connection"
        );
      }
    } catch (error) {
      updateStatus("network", "Failed");
      console.error("Network Test Error:", error);
      Alert.alert(
        isThaiLanguage ? "การทดสอบการเชื่อมต่อ" : "Network Test",
        `${isThaiLanguage ? "การเชื่อมต่อล้มเหลว: " : "Network test failed: "}${error.message}`
      );
    }
  };

  const testDataExchange = async () => {
    const testDocRef = doc(db, "TestCollection", "TestDocument");
    const testData = { message: "Hello, Firestore!" };

    try {
      await setDoc(testDocRef, testData);
      const docSnap = await getDoc(testDocRef);
      if (docSnap.exists() && docSnap.data().message === testData.message) {
        updateStatus("dataExchange", "Success");
        Alert.alert(
          isThaiLanguage ? "การทดสอบการแลกเปลี่ยนข้อมูล" : "Data Exchange Test",
          isThaiLanguage ? "การส่งและรับข้อมูลทำงานได้ถูกต้อง" : "Data sending and receiving is working correctly"
        );
      } else {
        updateStatus("dataExchange", "Failed");
        Alert.alert(
          isThaiLanguage ? "การทดสอบการแลกเปลี่ยนข้อมูล" : "Data Exchange Test",
          isThaiLanguage ? "การส่งและรับข้อมูลล้มเหลว" : "Data sending and receiving failed"
        );
      }
    } catch (error) {
      updateStatus("dataExchange", "Failed");
      console.error("Data Exchange Test Error:", error);
      Alert.alert(
        isThaiLanguage ? "การทดสอบการแลกเปลี่ยนข้อมูล" : "Data Exchange Test",
        `${isThaiLanguage ? "การแลกเปลี่ยนข้อมูลล้มเหลว: " : "Data exchange failed: "}${error.message}`
      );
    } finally {
      await deleteDoc(testDocRef);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkTheme ? "#333" : "#f0f0f0" }]}>
      <Text style={[styles.header, { color: isDarkTheme ? "#fff" : "#333" }]}>
        {isThaiLanguage ? "การทดสอบระบบ" : "System Test"}
      </Text>
      <View style={styles.statusContainer}>
        {Object.entries(statuses).map(([key, status]) => (
          <StatusItem
            key={key}
            label={getLabel(key, isThaiLanguage)}
            status={status}
          />
        ))}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#007BFF" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={runTests}>
          <Text style={styles.buttonText}>{isThaiLanguage ? "เริ่มการทดสอบ" : "Start Test"}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const getLabel = (key, isThaiLanguage) => {
  const labels = {
    auth: isThaiLanguage ? "สถานะการตรวจสอบสิทธิ์" : "Auth Status",
    db: isThaiLanguage ? "สถานะฐานข้อมูล" : "Database Status",
    storage: isThaiLanguage ? "สถานะการจัดเก็บ" : "Storage Status",
    network: isThaiLanguage ? "สถานะการเชื่อมต่อ" : "Network Status",
    dataExchange: isThaiLanguage ? "สถานะการแลกเปลี่ยนข้อมูล" : "Data Exchange Status",
  };
  return labels[key];
};

const StatusItem = ({ label, status }) => (
  <View style={styles.statusItem}>
    <Text style={styles.statusLabel}>{label}:</Text>
    <Icon name={getIconName(status)} size={24} color={getStatusColor(status)} style={styles.statusIcon} />
    <Text style={[styles.statusValue, { color: getStatusColor(status) }]}>{status}</Text>
  </View>
);

const getIconName = (status) => {
  switch (status) {
    case "Success":
      return "check-circle";
    case "Failed":
      return "error";
    case "Pending":
    default:
      return "hourglass-empty";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "Success":
      return "green";
    case "Failed":
      return "red";
    case "Pending":
    default:
      return "gray";
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
  },
  statusContainer: {
    width: "100%",
    marginBottom: 30,
  },
  statusItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statusLabel: {
    fontSize: 16,
  },
  statusIcon: {
    marginHorizontal: 10,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "bold",
  },
  button: {
    backgroundColor: "#007BFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});