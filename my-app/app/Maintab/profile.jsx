import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase/Firebase";
import { doc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect } from "@react-navigation/native";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function Profile({ navigation }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchUserData = async (currentUser) => {
    if (currentUser) {
      setUser(currentUser);
      const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setUserData(data);
        setImage(data.photoURL || null);
      }
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      const unsubscribe = onAuthStateChanged(auth, fetchUserData);
      return () => {
        unsubscribe();
      };
    }, [])
  );

  const pickImage = async () => {
    setLoading(true);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    setLoading(false);
  };

  return (
    <ScrollView>
      <View style={styles.container}>
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
        <View style={styles.infoContainer}>
          <Icon name="person" size={20} color="#ff7f50" />
          <Text style={styles.label}>Username</Text>
          <Text style={styles.infoText}>{userData.username || "N/A"}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Icon name="email" size={20} color="#ff7f50" />
          <Text style={styles.label}>Email</Text>
          <Text style={styles.infoText}>{userData.email || "N/A"}</Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate("EditProfile")}
        >
          <Icon name="edit" size={20} color="#fff" />
          <Text style={styles.buttonText}>แก้ไขโปรไฟล์</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    padding: 20,
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
    backgroundColor: "#fff",
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
    color: "#333",
    marginLeft: 10,
  },
  infoText: {
    fontSize: 16,
    color: "#555",
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
    fontSize: 18,
    fontFamily: "NotoSansThai-Regular",
    marginLeft: 5,
  },
});