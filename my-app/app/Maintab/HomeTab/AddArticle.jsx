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
import { db, auth, storage } from "../../../firebase/Firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function AddArticle({ navigation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [titleHeight, setTitleHeight] = useState(40);
  const [descriptionHeight, setDescriptionHeight] = useState(40);

  const pickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1,
    });

    if (!result.canceled) {
      setImages(result.assets.map((asset) => asset.uri));
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
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.header}>Add New Article</Text>
      <TouchableOpacity onPress={pickImages} style={styles.addImageButton}>
        <Icon name="add-photo-alternate" size={24} color="white" />
        <Text style={styles.addImageText}>Add Images</Text>
      </TouchableOpacity>
      <View style={styles.imageContainer}>
        {images.map((img, index) => (
          <Image key={index} source={{ uri: img }} style={styles.image} />
        ))}
      </View>
      <TextInput
        style={[styles.input, { height: titleHeight }]}
        placeholder="หัวข้อ"
        value={title}
        onChangeText={setTitle}
        multiline
        onContentSizeChange={(e) =>
          setTitleHeight(e.nativeEvent.contentSize.height)
        }
      />
      <TextInput
        style={[styles.textArea, { height: descriptionHeight }]}
        placeholder="คำอธิบาย"
        value={description}
        onChangeText={setDescription}
        multiline
        onContentSizeChange={(e) =>
          setDescriptionHeight(e.nativeEvent.contentSize.height)
        }
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleAddArticle}>
        <Text style={styles.saveButtonText}>SAVE</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  header: {
    fontSize: 24,
    fontFamily: 'NotoSansThai-Regular',
    marginBottom: 20,
    color: "#333",
  },
  addImageButton: {
    flexDirection: "row",
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  addImageText: {
    color: "white",
    fontFamily: 'NotoSansThai-Regular',
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
    fontFamily: 'NotoSansThai-Regular',
    minHeight: 50,
    maxHeight: 100,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  textArea: {
    fontFamily: 'NotoSansThai-Regular',
    minHeight: 60,
    maxHeight: 160,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    textAlignVertical: "top",
    backgroundColor: "#fff",
  },
  backButton: {
    marginBottom: 10,
  },
  saveButton: {
    backgroundColor: "#ff7f50",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontFamily: 'NotoSansThai-Regular',
    fontSize: 16,
  },
});