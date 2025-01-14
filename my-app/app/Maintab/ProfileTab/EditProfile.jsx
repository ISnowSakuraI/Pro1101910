import React, { useState, useCallback, useMemo } from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Image,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { onAuthStateChanged, updateProfile, signOut } from "firebase/auth";
import { auth, db, storage } from "../../../firebase/Firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Menu, Button, Provider } from "react-native-paper";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";

export default function EditProfile({ navigation }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [image, setImage] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const theme = useMemo(
    () => (isDarkTheme ? styles.dark : styles.light),
    [isDarkTheme]
  );

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
        Alert.alert("Error", "Failed to fetch user data.");
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = onAuthStateChanged(auth, fetchUserData);
      return () => {
        unsubscribe();
      };
    }, [fetchUserData])
  );

  const pickImage = async () => {
    Alert.alert(
      isThaiLanguage ? "ยืนยันการเปลี่ยนรูปภาพ" : "Confirm Image Change",
      isThaiLanguage
        ? "คุณต้องการเปลี่ยนรูปภาพโปรไฟล์หรือไม่?"
        : "Do you want to change your profile picture?",
      [
        {
          text: isThaiLanguage ? "ยกเลิก" : "Cancel",
          style: "cancel",
        },
        {
          text: isThaiLanguage ? "ตกลง" : "OK",
          onPress: async () => {
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
              Alert.alert("Error", "Failed to pick image.");
            }
          },
        },
      ]
    );
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setLoading(true);
    let photoURL = userData.photoURL;
    try {
      if (image && image !== userData.photoURL) {
        const response = await fetch(image);
        const blob = await response.blob();
        const storageRef = ref(storage, `profilePictures/${user.uid}`);
        await uploadBytes(storageRef, blob);
        photoURL = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, "Users", user.uid), {
        ...userData,
        photoURL: photoURL || "",
      });

      await updateProfile(user, { photoURL });

      Alert.alert("Success", "Profile updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating profile: ", error);
      Alert.alert("Error", "Failed to update profile.");
    } finally {
      setLoading(false);
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
      navigation.reset({
        index: 0,
        routes: [{ name: "AuthStack" }],
      });
    } catch (error) {
      console.error("Error logging out: ", error);
      Alert.alert("Error", "Failed to log out.");
    }
  };

  const getGenderDisplay = (gender) => {
    if (isThaiLanguage) {
      return gender === "Male" ? "ชาย" : "หญิง";
    }
    return gender;
  };

  return (
    <Provider>
      <View style={{ backgroundColor: theme.backgroundColor }}>
        <ScrollView style={{ backgroundColor: theme.backgroundColor }}>
          <View
            style={[
              styles.container,
              { backgroundColor: theme.backgroundColor },
            ]}
          >
            <TouchableOpacity onPress={pickImage} style={styles.imageWrapper}>
              {loading ? (
                <ActivityIndicator size="large" color={theme.primaryColor} />
              ) : (
                <Image
                  style={styles.profileImage}
                  source={{
                    uri: image || "https://via.placeholder.com/150",
                  }}
                />
              )}
              <View
                style={[
                  styles.cameraIcon,
                  { backgroundColor: theme.primaryColor },
                ]}
              >
                <Icon name="camera-alt" size={24} color="#fff" />
              </View>
            </TouchableOpacity>
            <View
              style={[
                styles.infoContainer,
                { backgroundColor: theme.cardBackgroundColor },
              ]}
            >
              <Icon name="person" size={20} color={theme.primaryColor} />
              <Text style={[styles.label, { color: theme.textColor }]}>
                {isThaiLanguage ? "ชื่อผู้ใช้" : "Username"}
              </Text>
              <Text style={[styles.infoText, { color: theme.textColor }]}>
                {userData.username || "N/A"}
              </Text>
            </View>
            <View
              style={[
                styles.infoContainer,
                { backgroundColor: theme.cardBackgroundColor },
              ]}
            >
              <Icon name="email" size={20} color={theme.primaryColor} />
              <Text style={[styles.label, { color: theme.textColor }]}>
                {isThaiLanguage ? "อีเมล" : "Email"}
              </Text>
              <Text style={[styles.infoText, { color: theme.textColor }]}>
                {userData.email || "N/A"}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textColor }]}>
                {isThaiLanguage ? "เพศ" : "Gender"}
              </Text>
              <TouchableOpacity
                onPress={() => setMenuVisible(true)}
                style={[
                  styles.dropdownButton,
                  { backgroundColor: theme.cardBackgroundColor },
                ]}
              >
                <Text style={[styles.dropdownText, { color: theme.textColor }]}>
                  {getGenderDisplay(userData.gender) ||
                    (isThaiLanguage ? "เลือกเพศ" : "Select Gender")}
                </Text>
              </TouchableOpacity>
              {menuVisible && (
                <View style={styles.menu}>
                  <TouchableOpacity
                    onPress={() => {
                      setUserData({
                        ...userData,
                        gender: "Male",
                      });
                      setMenuVisible(false);
                    }}
                    style={[
                      styles.menuItem,
                      { backgroundColor: theme.cardBackgroundColor },
                    ]}
                  >
                    <Text style={{ color: theme.textColor }}>
                      {isThaiLanguage ? "ชาย" : "Male"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setUserData({
                        ...userData,
                        gender: "Female",
                      });
                      setMenuVisible(false);
                    }}
                    style={[
                      styles.menuItem,
                      { backgroundColor: theme.cardBackgroundColor },
                    ]}
                  >
                    <Text style={{ color: theme.textColor }}>
                      {isThaiLanguage ? "หญิง" : "Female"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textColor }]}>
                {isThaiLanguage ? "วันเกิด" : "Birthday"}
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(true)}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.cardBackgroundColor,
                      color: theme.textColor,
                    },
                  ]}
                  placeholder={
                    isThaiLanguage
                      ? "วันเกิด (YYYY-MM-DD)"
                      : "Birthday (YYYY-MM-DD)"
                  }
                  placeholderTextColor={theme.textColor}
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
                <Text style={[styles.label, { color: theme.textColor }]}>
                  {isThaiLanguage ? "น้ำหนัก (กก.)" : "Weight (kg)"}
                </Text>
                <TextInput
                  style={[
                    styles.smallInput,
                    {
                      backgroundColor: theme.cardBackgroundColor,
                      color: theme.textColor,
                    },
                  ]}
                  placeholder={isThaiLanguage ? "น้ำหนัก" : "Weight"}
                  placeholderTextColor={theme.textColor}
                  value={userData.weight || ""}
                  onChangeText={(text) =>
                    setUserData({
                      ...userData,
                      weight: text.replace(/[^0-9]/g, ""),
                    })
                  }
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.inputGroup2}>
                <Text style={[styles.label, { color: theme.textColor }]}>
                  {isThaiLanguage ? "ส่วนสูง (ซม.)" : "Height (cm)"}
                </Text>
                <TextInput
                  style={[
                    styles.smallInput,
                    {
                      backgroundColor: theme.cardBackgroundColor,
                      color: theme.textColor,
                    },
                  ]}
                  placeholder={isThaiLanguage ? "ส่วนสูง" : "Height"}
                  placeholderTextColor={theme.textColor}
                  value={userData.height || ""}
                  onChangeText={(text) =>
                    setUserData({
                      ...userData,
                      height: text.replace(/[^0-9]/g, ""),
                    })
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#00A047" }]}
              onPress={handleSaveProfile}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isThaiLanguage ? "บันทึกโปรไฟล์" : "Save Profile"}
                </Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: "#F44336" }]}
              onPress={handleLogout}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>
                  {isThaiLanguage ? "ออกจากระบบ" : "Logout"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 50,
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
    fontSize: 16,
    fontFamily: "NotoSansThai-Regular",
    marginLeft: 10,
  },
  infoText: {
    fontFamily: "NotoSansThai-Regular",
    fontSize: 16,
    marginLeft: 10,
  },
  inputGroup: {
    width: "90%",
    marginBottom: 15,
  },
  dropdownButton: {
    width: "100%",
    height: 40,
    justifyContent: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: "NotoSansThai-Regular",
  },
  menuItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  input: {
    width: "100%",
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderColor: "#ddd",
    borderWidth: 1,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "90%",
    marginBottom: 15,
  },
  smallInput: {
    height: 40,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderColor: "#ddd",
    borderWidth: 1,
    fontSize: 14,
  },
  inputGroup2: {
    width: "48%",
  },
  button: {
    width: "90%",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "NotoSansThai-Regular",
  },
  backText: {
    fontSize: 16,
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 15,
  },
  light: {
    primaryColor: "#ff7f50",
    secondaryColor: "#ffa07a",
    backgroundColor: "#f0f0f0",
    textColor: "#333333",
    cardBackgroundColor: "#ffffff",
    borderColor: "#ddd",
  },
  dark: {
    primaryColor: "#ff7f50",
    secondaryColor: "#ffa07a",
    backgroundColor: "#212121",
    textColor: "#ffffff",
    cardBackgroundColor: "#2c2c2c",
    borderColor: "#444",
  },
});
