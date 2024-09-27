import React, { useState, useCallback, useReducer } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { auth, db, storage } from "../firebase/Firebase";
import {
  collection,
  getDocs,
  query,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useTheme } from "./ThemeContext";
import { useLanguage } from "./LanguageContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import commitData from "../scripts/commit-sha.json";

const StatusItem = React.memo(({ label, status, description, theme }) => (
  <View style={[styles.statusItem, theme.cardBackground]}>
    <View style={styles.statusHeader}>
      <Text style={[styles.statusLabel, theme.text]}>{label}:</Text>
      <Icon
        name={getIconName(status)}
        size={24}
        color={getStatusColor(status)}
        style={styles.statusIcon}
      />
      <Text style={[styles.statusValue, { color: getStatusColor(status) }]}>
        {status}
      </Text>
    </View>
    <Text style={[styles.statusDescription, theme.text]}>{description}</Text>
  </View>
));

const initialState = {
  auth: "Pending",
  db: "Pending",
  storage: "Pending",
  network: "Pending",
  dataExchange: "Pending",
  updateCheck: "Pending",
};

function statusReducer(state, action) {
  switch (action.type) {
    case 'UPDATE_STATUS':
      return { ...state, [action.key]: action.status };
    default:
      return state;
  }
}

export default function SystemTest({ navigation }) {
  const [statuses, dispatch] = useReducer(statusReducer, initialState);
  const [loading, setLoading] = useState(false);
  const [dataExchangeTime, setDataExchangeTime] = useState(null);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const themeStyles = isDarkTheme ? styles.dark : styles.light;

  const runTests = useCallback(async () => {
    Alert.alert(
      isThaiLanguage ? "ยืนยันการทดสอบ" : "Confirm Test",
      isThaiLanguage
        ? "คุณต้องการเริ่มการทดสอบระบบหรือไม่?"
        : "Do you want to start the system test?",
      [
        {
          text: isThaiLanguage ? "ยกเลิก" : "Cancel",
          style: "cancel",
        },
        {
          text: isThaiLanguage ? "ตกลง" : "OK",
          onPress: async () => {
            setLoading(true);
            try {
              await testAuth();
              await testFirestore();
              await testStorage();
              await testNetwork();
              await testDataExchange();
              await testUpdateCheck();
            } catch (error) {
              console.error("Error during tests:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }, [isThaiLanguage]);

  const updateStatus = (key, status) => {
    dispatch({ type: 'UPDATE_STATUS', key, status });
  };

  const testAuth = useCallback(async () => {
    const email = "testuser@example.com";
    const password = "testpassword";

    try {
      await signInWithEmailAndPassword(auth, email, password);
      updateStatus("auth", "Success");
      Alert.alert(
        isThaiLanguage ? "การทดสอบสิทธิ์" : "Auth Test",
        isThaiLanguage
          ? "การเชื่อมต่อกับ Firebase Authentication ทำงานได้ถูกต้อง"
          : "Connection to Firebase Authentication is working correctly"
      );
    } catch (error) {
      updateStatus("auth", "Failed");
      console.error("Auth Test Error:", error);
      Alert.alert(
        isThaiLanguage ? "การทดสอบสิทธิ์" : "Auth Test",
        `${
          isThaiLanguage
            ? "การเชื่อมต่อกับ Firebase Authentication ล้มเหลว: "
            : "Connection to Firebase Authentication failed: "
        }${error.message}`
      );
    } finally {
      await auth.signOut();
    }
  }, [isThaiLanguage]);

  const testFirestore = useCallback(async () => {
    try {
      const collections = ["Users", "FoodDiary", "reports", "articles"];
      for (const collectionName of collections) {
        const q = query(collection(db, collectionName));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          updateStatus("db", "No data found in " + collectionName);
          Alert.alert(
            isThaiLanguage ? "การทดสอบฐานข้อมูล" : "Database Test",
            isThaiLanguage
              ? `ไม่พบข้อมูลในคอลเลกชัน ${collectionName}`
              : `No data found in collection ${collectionName}`
          );
          return;
        }
      }
      updateStatus("db", "Success");
      Alert.alert(
        isThaiLanguage ? "การทดสอบฐานข้อมูล" : "Database Test",
        isThaiLanguage
          ? "การเข้าถึงฐานข้อมูลทำงานได้ถูกต้อง"
          : "Database access is working correctly"
      );
    } catch (error) {
      updateStatus("db", "Failed");
      console.error("Database Test Error:", error);
      Alert.alert(
        isThaiLanguage ? "การทดสอบฐานข้อมูล" : "Database Test",
        `${
          isThaiLanguage
            ? "การเข้าถึงฐานข้อมูลล้มเหลว: "
            : "Database access failed: "
        }${error.message}`
      );
    }
  }, [isThaiLanguage]);

  const testStorage = useCallback(async () => {
    try {
      const storageRef = ref(storage, "profilePictures/sample.png");
      await getDownloadURL(storageRef);
      updateStatus("storage", "Success");
      Alert.alert(
        isThaiLanguage ? "การทดสอบการจัดเก็บ" : "Storage Test",
        isThaiLanguage
          ? "การเข้าถึงการจัดเก็บทำงานได้ถูกต้อง"
          : "Storage access is working correctly"
      );
    } catch (error) {
      updateStatus("storage", "Failed");
      console.error("Storage Test Error:", error);
      Alert.alert(
        isThaiLanguage ? "การทดสอบการจัดเก็บ" : "Storage Test",
        `${
          isThaiLanguage
            ? "การเข้าถึงการจัดเก็บล้มเหลว: "
            : "Storage access failed: "
        }${error.message}`
      );
    }
  }, [isThaiLanguage]);

  const testNetwork = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        updateStatus("network", "Success");
        Alert.alert(
          isThaiLanguage ? "การทดสอบการเชื่อมต่อ" : "Network Test",
          isThaiLanguage
            ? "การเชื่อมต่ออินเทอร์เน็ตทำงานได้ถูกต้อง"
            : "Internet connection is working correctly"
        );
      } else {
        updateStatus("network", "Failed");
        Alert.alert(
          isThaiLanguage ? "การทดสอบการเชื่อมต่อ" : "Network Test",
          isThaiLanguage
            ? "ไม่มีการเชื่อมต่ออินเทอร์เน็ต"
            : "No internet connection"
        );
      }
    } catch (error) {
      updateStatus("network", "Failed");
      console.error("Network Test Error:", error);
      Alert.alert(
        isThaiLanguage ? "การทดสอบการเชื่อมต่อ" : "Network Test",
        `${
          isThaiLanguage ? "การเชื่อมต่อล้มเหลว: " : "Network test failed: "
        }${error.message}`
      );
    }
  }, [isThaiLanguage]);

  const testDataExchange = useCallback(async () => {
    const testDocRef = doc(db, "TestCollection", "TestDocument");
    const testData = { message: "Hello, Firestore!" };

    try {
      const startTime = Date.now();
      await setDoc(testDocRef, testData);
      const docSnap = await getDoc(testDocRef);
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      setDataExchangeTime(timeTaken);

      if (docSnap.exists() && docSnap.data().message === testData.message) {
        updateStatus("dataExchange", "Success");
        Alert.alert(
          isThaiLanguage
            ? "การทดสอบการแลกเปลี่ยนข้อมูล"
            : "Data Exchange Test",
          isThaiLanguage
            ? `การส่งและรับข้อมูลทำงานได้ถูกต้อง ใช้เวลา ${timeTaken} มิลลิวินาที`
            : `Data sending and receiving is working correctly. Time taken: ${timeTaken} ms`
        );
      } else {
        updateStatus("dataExchange", "Failed");
        Alert.alert(
          isThaiLanguage
            ? "การทดสอบการแลกเปลี่ยนข้อมูล"
            : "Data Exchange Test",
          isThaiLanguage
            ? "การส่งและรับข้อมูลล้มเหลว"
            : "Data sending and receiving failed"
        );
      }
    } catch (error) {
      updateStatus("dataExchange", "Failed");
      console.error("Data Exchange Test Error:", error);
      Alert.alert(
        isThaiLanguage
          ? "การทดสอบการแลกเปลี่ยนข้อมูล"
          : "Data Exchange Test",
        `${
          isThaiLanguage
            ? "การแลกเปลี่ยนข้อมูลล้มเหลว: "
            : "Data exchange failed: "
        }${error.message}`
      );
    } finally {
      await deleteDoc(testDocRef);
    }
  }, [isThaiLanguage]);

  const testUpdateCheck = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.github.com/repos/ISnowSakuraI/Pro1101910/commits/main"
      );
      const data = await response.json();
      const latestCommitSha = data.sha;

      const currentCommitSha = commitData.commitSha;

      if (latestCommitSha === currentCommitSha) {
        updateStatus("updateCheck", "Up to Date");
        Alert.alert(
          isThaiLanguage ? "การตรวจสอบการอัปเดต" : "Update Check",
          isThaiLanguage
            ? "แอปพลิเคชันเป็นเวอร์ชันล่าสุด"
            : "The application is up to date"
        );
      } else {
        updateStatus("updateCheck", "Update Available");
        Alert.alert(
          isThaiLanguage ? "การตรวจสอบการอัปเดต" : "Update Check",
          isThaiLanguage
            ? "มีการอัปเดตใหม่พร้อมใช้งาน"
            : "A new update is available"
        );
      }
    } catch (error) {
      updateStatus("updateCheck", "Failed");
      console.error("Update Check Error:", error);
      Alert.alert(
        isThaiLanguage ? "การตรวจสอบการอัปเดต" : "Update Check",
        `${
          isThaiLanguage
            ? "การตรวจสอบการอัปเดตล้มเหลว: "
            : "Update check failed: "
        }${error.message}`
      );
    }
  }, [isThaiLanguage]);

  return (
    <ScrollView contentContainerStyle={[styles.container, themeStyles.background]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={themeStyles.text.color} />
      </TouchableOpacity>
      <Text style={[styles.header, themeStyles.text]}>
        {isThaiLanguage ? "การทดสอบระบบ" : "System Test"}
      </Text>
      <Text style={[styles.versionInfo, themeStyles.text]}>
        {isThaiLanguage ? "เวอร์ชัน: " : "Version: "} {commitData.commitSha}
      </Text>
      <View style={styles.statusContainer}>
        {Object.entries(statuses).map(([key, status]) => (
          <StatusItem
            key={key}
            label={getLabel(key, isThaiLanguage)}
            status={status}
            description={getDescription(key, isThaiLanguage, dataExchangeTime)}
            theme={themeStyles}
          />
        ))}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={themeStyles.primaryColor} />
      ) : (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: themeStyles.primaryColor }]}
          onPress={runTests}
        >
          <Text style={styles.buttonText}>
            {isThaiLanguage ? "เริ่มการทดสอบ" : "Start Test"}
          </Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const getLabel = (key, isThaiLanguage) => {
  const labels = {
    auth: isThaiLanguage ? "สถานะการตรวจสอบสิทธิ์" : "Auth Status",
    db: isThaiLanguage ? "สถานะฐานข้อมูล" : "Database Status",
    storage: isThaiLanguage ? "สถานะการจัดเก็บ" : "Storage Status",
    network: isThaiLanguage ? "สถานะการเชื่อมต่อ" : "Network Status",
    dataExchange: isThaiLanguage
      ? "สถานะการแลกเปลี่ยนข้อมูล"
      : "Data Exchange Status",
    updateCheck: isThaiLanguage
      ? "สถานะการตรวจสอบการอัปเดต"
      : "Update Check Status",
  };
  return labels[key];
};

const getDescription = (key, isThaiLanguage, dataExchangeTime) => {
  const descriptions = {
    auth: isThaiLanguage
      ? "ตรวจสอบการเชื่อมต่อกับ Firebase Authentication โดยใช้ข้อมูลผู้ใช้ทดสอบ"
      : "Check connection to Firebase Authentication using test user credentials",
    db: isThaiLanguage
      ? "ตรวจสอบการเข้าถึงฐานข้อมูล Firestore โดยตรวจสอบคอลเลกชันต่างๆ"
      : "Check Firestore database access by verifying multiple collections",
    storage: isThaiLanguage
      ? "ตรวจสอบการเข้าถึง Firebase Storage โดยพยายามดาวน์โหลดรูปภาพตัวอย่าง"
      : "Check Firebase Storage access by attempting to download a sample image",
    network: isThaiLanguage
      ? "ตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของอุปกรณ์"
      : "Check the device's internet connection",
    dataExchange: isThaiLanguage
      ? `ทดสอบการส่งและรับข้อมูลกับ Firestore โดยการสร้างและลบเอกสารทดสอบ ใช้เวลา ${dataExchangeTime} มิลลิวินาที`
      : `Test data sending and receiving with Firestore by creating and deleting a test document. Time taken: ${dataExchangeTime} ms`,
    updateCheck: isThaiLanguage
      ? "ตรวจสอบว่าแอปเป็นเวอร์ชันล่าสุดโดยเปรียบเทียบ SHA ของ commit ปัจจุบันกับ GitHub"
      : "Check if the app is up to date by comparing the current commit SHA with GitHub",
  };
  return descriptions[key];
};

const getIconName = (status) => {
  switch (status) {
    case "Success":
    case "Up to Date":
      return "check-circle";
    case "Failed":
    case "Update Available":
      return "error";
    case "Pending":
    default:
      return "hourglass-empty";
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "Success":
    case "Up to Date":
      return "green";
    case "Failed":
    case "Update Available":
      return "red";
    case "Pending":
    default:
      return "gray";
  }
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
  },
  versionInfo: {
    fontSize: 16,
    marginBottom: 20,
  },
  statusContainer: {
    width: "100%",
    marginBottom: 30,
  },
  statusItem: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  statusDescription: {
    fontSize: 14,
    marginTop: 5,
  },
  button: {
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
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
  },
  light: {
    background: {
      backgroundColor: "#f0f0f0",
    },
    text: {
      color: "#333333",
    },
    cardBackground: {
      backgroundColor: "#ffffff",
    },
    primaryColor: "#ff7f50",
  },
  dark: {
    background: {
      backgroundColor: "#212121",
    },
    text: {
      color: "#ffffff",
    },
    cardBackground: {
      backgroundColor: "#2c2c2c",
    },
    primaryColor: "#ff7f50",
  },
});