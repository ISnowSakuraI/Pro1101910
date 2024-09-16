import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Modal,
} from "react-native";
import { db, storage } from "../../../../firebase/Firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";

export default function EditMenu({ route, navigation }) {
  const { menuId } = route.params;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [ingredients, setIngredients] = useState([{ name: "", amount: "" }]);
  const [instructions, setInstructions] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const docRef = doc(db, "menus", menuId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setName(data.name);
          setDescription(data.description);
          setImages(data.images || []);
          setIngredients(data.ingredients || [{ name: "", amount: "" }]);
          setInstructions(data.instructions || "");
        } else {
          Alert.alert("Error", "Menu not found.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching menu: ", error);
        Alert.alert("Error", "Failed to fetch menu. Please try again.");
      }
    };

    fetchMenu();
  }, [menuId, navigation]);

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

  const handleSaveChanges = async () => {
    if (!name || !description || !instructions || ingredients.some(ing => !ing.name || !ing.amount)) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }

    try {
      const imageUrls = [];
      for (const image of images) {
        if (image.startsWith("http")) {
          imageUrls.push(image);
        } else {
          const response = await fetch(image);
          const blob = await response.blob();
          const storageRef = ref(storage, `menus/${menuId}/${Date.now()}`);
          await uploadBytes(storageRef, blob);
          const imageUrl = await getDownloadURL(storageRef);
          imageUrls.push(imageUrl);
        }
      }

      await updateDoc(doc(db, "menus", menuId), {
        name,
        description,
        images: imageUrls,
        ingredients,
        instructions,
      });

      Alert.alert("Success", "Menu updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating menu: ", error);
      Alert.alert("Error", "Failed to update menu. Please try again.");
    }
  };

  const handleAddIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: "" }]);
  };

  const handleRemoveIngredient = (index) => {
    const newIngredients = ingredients.filter((_, i) => i !== index);
    setIngredients(newIngredients);
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const handleImagePress = (imageUri) => {
    setSelectedImage(imageUri);
    setIsModalVisible(true);
  };

  const themeStyles = isDarkTheme ? styles.dark : styles.light;

  return (
    <ScrollView style={[styles.container, themeStyles.background]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={themeStyles.text.color} />
      </TouchableOpacity>
      <Text style={[styles.title, themeStyles.text]}>
        {isThaiLanguage ? "แก้ไขเมนู" : "Edit Menu"}
      </Text>
      <TouchableOpacity onPress={pickImages} style={styles.addImageButton}>
        <Icon name="add-photo-alternate" size={24} color="white" />
        <Text style={styles.addImageText}>
          {isThaiLanguage ? "เพิ่มรูปภาพ" : "Add Images"}
        </Text>
      </TouchableOpacity>
      <View style={styles.imageContainer}>
        {images.map((img, index) => (
          <TouchableOpacity key={index} onPress={() => handleImagePress(img)}>
            <Image source={{ uri: img }} style={styles.image} />
          </TouchableOpacity>
        ))}
      </View>
      <TextInput
        style={[styles.input, themeStyles.cardBackground]}
        placeholder={isThaiLanguage ? "ชื่อเมนู" : "Menu Name"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, themeStyles.cardBackground]}
        placeholder={isThaiLanguage ? "คำอธิบาย" : "Description"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={description}
        onChangeText={setDescription}
      />
      <Text style={[styles.sectionTitle, themeStyles.text]}>
        {isThaiLanguage ? "ส่วนผสม" : "Ingredients"}
      </Text>
      {ingredients.map((ingredient, index) => (
        <View key={index} style={styles.ingredientRow}>
          <TextInput
            style={[styles.ingredientInput, themeStyles.cardBackground]}
            placeholder={isThaiLanguage ? "ชื่อส่วนผสม" : "Ingredient Name"}
            placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
            value={ingredient.name}
            onChangeText={(text) => handleIngredientChange(index, "name", text)}
          />
          <TextInput
            style={[styles.ingredientInput, themeStyles.cardBackground]}
            placeholder={isThaiLanguage ? "ปริมาณ" : "Amount"}
            placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
            value={ingredient.amount}
            onChangeText={(text) => handleIngredientChange(index, "amount", text)}
          />
          <TouchableOpacity onPress={() => handleRemoveIngredient(index)}>
            <Icon name="remove-circle" size={24} color="#F44336" />
          </TouchableOpacity>
        </View>
      ))}
      <TouchableOpacity onPress={handleAddIngredient} style={styles.addIngredientButton}>
        <Icon name="add-circle" size={24} color="#00A047" />
        <Text style={styles.addIngredientText}>
          {isThaiLanguage ? "เพิ่มส่วนผสม" : "Add Ingredient"}
        </Text>
      </TouchableOpacity>
      <TextInput
        style={[styles.textArea, themeStyles.cardBackground]}
        placeholder={isThaiLanguage ? "วิธีทำ" : "Instructions"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={instructions}
        onChangeText={setInstructions}
        multiline
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
        <Text style={styles.saveButtonText}>
          {isThaiLanguage ? "บันทึกการเปลี่ยนแปลง" : "Save Changes"}
        </Text>
      </TouchableOpacity>

      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setIsModalVisible(false)}
          >
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullImage} />
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
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
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
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
    backgroundColor: "#ff7f50",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
  },
  saveButtonText: {
    color: "white",
    fontFamily: "NotoSansThai-Regular",
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  ingredientRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  ingredientInput: {
    flex: 1,
    height: 40,
    borderColor: "#777",
    borderWidth: 1,
    marginRight: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addIngredientButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  addIngredientText: {
    marginLeft: 5,
    color: "#00A047",
    fontFamily: "NotoSansThai-Regular",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  fullImage: {
    width: "90%",
    height: "70%",
    resizeMode: "contain",
  },
  light: {
    background: {
      backgroundColor: "#f5f5f5",
    },
    text: {
      color: "#333",
    },
    cardBackground: {
      backgroundColor: "#fff",
    },
  },
  dark: {
    background: {
      backgroundColor: "#333",
    },
    text: {
      color: "#fff",
    },
    cardBackground: {
      backgroundColor: "#555",
    },
  },
});