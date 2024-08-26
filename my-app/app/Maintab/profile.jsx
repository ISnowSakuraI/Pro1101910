import * as React from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useState, useEffect } from "react";
import { onAuthStateChanged, updateProfile, signOut } from "firebase/auth";
import { auth, db, storage } from "../../firebase/Firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Menu, Button, Provider } from "react-native-paper";

export default function Profile({ navigation }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [image, setImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setImage(data.photoURL || null);
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    let photoURL = null;
    try {
      const response = await fetch(image);
      const blob = await response.blob();
      const storageRef = ref(storage, `profilePictures/${user.uid}`);
      await uploadBytes(storageRef, blob);
      photoURL = await getDownloadURL(storageRef);
    } catch (error) {
      console.error("Error uploading image: ", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }

    try {
      await setDoc(doc(db, "Users", user.uid), {
        ...userData,
        photoURL: photoURL || "",
      });

      await updateProfile(user, { photoURL });

      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile: ", error);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || userData.birthday;
    setShowDatePicker(false);
    setUserData({
      ...userData,
      birthday: currentDate.toISOString().split("T")[0],
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logged out", "You have been logged out successfully.");
      navigation.navigate("Login");
    } catch (error) {
      Alert.alert("Error", "Failed to log out. Please try again.");
    }
  };

  return (
    <Provider>
      <ScrollView>
        <View style={styles.container}>
          <TouchableOpacity onPress={pickImage}>
            <Image
              style={styles.profileImage}
              source={{
                uri: image || "https://via.placeholder.com/150",
              }}
            />
          </TouchableOpacity>
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Username</Text>
            <Text style={styles.infoText}>{userData.username || "N/A"}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.infoText}>{userData.email || "N/A"}</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>เพศ</Text>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Button
                  onPress={() => setMenuVisible(true)}
                  mode="outlined"
                  style={styles.dropdownButton}
                >
                  {userData.gender || "เลือกเพศ"}
                </Button>
              }
            >
              <Menu.Item
                onPress={() => {
                  setUserData({ ...userData, gender: "ชาย" });
                  setMenuVisible(false);
                }}
                title="ชาย"
              />
              <Menu.Item
                onPress={() => {
                  setUserData({ ...userData, gender: "หญิง" });
                  setMenuVisible(false);
                }}
                title="หญิง"
              />
            </Menu>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>วันเกิด</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <TextInput
                style={styles.input}
                placeholder="วันเกิด (YYYY-MM-DD)"
                value={userData.birthday || ""}
                editable={false}
              />
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(userData.birthday || Date.now())}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
          <View style={styles.inputRow}>
            <View style={styles.inputGroup2}>
              <Text style={styles.label}>น้ำหนัก (กก.)</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="น้ำหนัก"
                value={userData.weight || ""}
                onChangeText={(text) =>
                  setUserData({ ...userData, weight: text })
                }
                keyboardType="numeric"
              />
            </View>
            <View style={styles.inputGroup2}>
              <Text style={styles.label}>ส่วนสูง (ซม.)</Text>
              <TextInput
                style={styles.smallInput}
                placeholder="ส่วนสูง"
                value={userData.height || ""}
                onChangeText={(text) =>
                  setUserData({ ...userData, height: text })
                }
                keyboardType="numeric"
              />
            </View>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleSaveProfile}>
            <Text style={styles.buttonText}>บันทึกโปรไฟล์</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.backText}>ออกจากระบบ</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderColor: 'black',
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 0.25,
  },
  infoContainer: {
    width: "80%",
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    color: "#555",
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  inputGroup: {
    width: "80%",
    marginBottom: 15,
  },
  inputGroup2: {
    width: "50%",
    marginBottom: 15,
  },
  dropdownButton: {
    width: "100%",
    justifyContent: "center",
  },
  input: {
    width: "100%",
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    borderColor: "#ddd",
    borderWidth: 1,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginBottom: 15,
  },
  smallInput: {
    height: 40,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 10,
    borderColor: "#ddd",
    borderWidth: 1,
    fontSize: 14,
  },
  button: {
    width: "80%",
    height: 50,
    backgroundColor: "#ff7f50",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  backText: {
    color: "#ff7f50",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
});
