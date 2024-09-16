import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { db, auth, storage } from "../../../../firebase/Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";

export default function AddArticle({ navigation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [titleHeight, setTitleHeight] = useState(40);
  const [descriptionHeight, setDescriptionHeight] = useState(40);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const themeStyles = isDarkTheme ? styles.dark : styles.light;

  const pickImages = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1,
      });

      if (!result.canceled) {
        setImages(result.assets.map((asset) => asset.uri));
      }
    } catch (error) {
      console.error("Error picking images: ", error);
      Alert.alert("Error", "Failed to pick images. Please try again.");
    }
  };

  const handleAddArticle = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const imageUrls = [];
    for (const image of images) {
      try {
        const response = await fetch(image);
        const blob = await response.blob();
        const storageRef = ref(storage, `articles/${user.uid}/${Date.now()}`);
        await uploadBytes(storageRef, blob);
        const imageUrl = await getDownloadURL(storageRef);
        imageUrls.push(imageUrl);
      } catch (error) {
        console.error("Error uploading image: ", error);
        Alert.alert("Error", "Failed to upload image. Please try again.");
        return;
      }
    }

    try {
      await addDoc(collection(db, "articles"), {
        title,
        description,
        images: imageUrls,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      Alert.alert("Success", "Article added successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error adding article: ", error);
      Alert.alert("Error", "Failed to add article. Please try again.");
    }
  };

  return (
    <View style={[styles.container, themeStyles.background]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={themeStyles.text.color} />
      </TouchableOpacity>
      <Text style={[styles.header, themeStyles.text]}>
        {isThaiLanguage ? "เพิ่มบทความใหม่" : "Add New Article"}
      </Text>
      <TouchableOpacity onPress={pickImages} style={styles.addImageButton}>
        <Icon name="add-photo-alternate" size={24} color="white" />
        <Text style={styles.addImageText}>
          {isThaiLanguage ? "เพิ่มรูปภาพ" : "Add Images"}
        </Text>
      </TouchableOpacity>
      <View horizontal style={styles.imageContainer}>
        {images.map((img, index) => (
          <Image key={index} source={{ uri: img }} style={styles.image} />
        ))}
      </View>
      <TextInput
        style={[
          styles.input,
          {
            height: titleHeight,
            backgroundColor: themeStyles.cardBackground.backgroundColor,
            color: themeStyles.text.color,
          },
        ]}
        placeholder={isThaiLanguage ? "หัวข้อ" : "Title"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={title}
        onChangeText={setTitle}
        multiline
        onContentSizeChange={(e) =>
          setTitleHeight(e.nativeEvent.contentSize.height)
        }
      />
      <TextInput
        style={[
          styles.textArea,
          {
            height: descriptionHeight,
            backgroundColor: themeStyles.cardBackground.backgroundColor,
            color: themeStyles.text.color,
          },
        ]}
        placeholder={isThaiLanguage ? "คำอธิบาย" : "Description"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={description}
        onChangeText={setDescription}
        multiline
        onContentSizeChange={(e) =>
          setDescriptionHeight(e.nativeEvent.contentSize.height)
        }
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleAddArticle}>
        <Text style={styles.saveButtonText}>
          {isThaiLanguage ? "อัพโหลด" : "Upload"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 20,
    textAlign: "center",
  },
  addImageButton: {
    flexDirection: "row",
    backgroundColor: "#008AFF",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  addImageText: {
    color: "white",
    fontFamily: "NotoSansThai-Regular",
    marginLeft: 5,
  },
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 10,
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 10,
    marginBottom: 10,
    borderRadius: 10,
  },
  input: {
    fontFamily: "NotoSansThai-Regular",
    minHeight: 50,
    maxHeight: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    textAlignVertical: "top",
  },
  textArea: {
    fontFamily: "NotoSansThai-Regular",
    minHeight: 60,
    maxHeight: 160,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    textAlignVertical: "top",
  },
  backButton: {
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#00A047",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontFamily: "NotoSansThai-Regular",
    fontSize: 16,
  },
  light: {
    background: {
      backgroundColor: "#f9f9f9",
    },
    text: {
      color: "#333333",
    },
    cardBackground: {
      backgroundColor: "#ffffff",
    },
  },
  dark: {
    background: {
      backgroundColor: "#333333",
    },
    text: {
      color: "#ffffff",
    },
    cardBackground: {
      backgroundColor: "#444444",
    },
  },
});