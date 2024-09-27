import React, { useState, useEffect, useCallback, useMemo } from "react";
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
  ActivityIndicator,
} from "react-native";
import { Picker } from '@react-native-picker/picker';
import { db, storage } from "../../../../firebase/Firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";
import translate from 'google-translate-api-x';

const translateToEnglish = async (text) => {
  try {
    const res = await translate(text, { from: 'th', to: 'en' });
    return res.text;
  } catch (error) {
    console.error("Translation error: ", error);
    return text;
  }
};

export default function EditMenu({ route, navigation }) {
  const { menuId } = route.params;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState([]);
  const [ingredients, setIngredients] = useState([{ name: "", amount: "", unit: "g" }]);
  const [instructions, setInstructions] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [calories, setCalories] = useState(null);
  const [loading, setLoading] = useState(false);
  const [caloriesCalculated, setCaloriesCalculated] = useState(false);
  const [ingredientsModified, setIngredientsModified] = useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const themeStyles = useMemo(() => (isDarkTheme ? styles.dark : styles.light), [isDarkTheme]);

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
          setIngredients(data.ingredients || [{ name: "", amount: "", unit: "g" }]);
          setInstructions(data.instructions || "");
          setCalories(data.calories || 0);
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

  const pickImages = useCallback(async () => {
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
  }, []);

  const fetchCalories = useCallback(async (ingredient) => {
    try {
      const response = await fetch(`https://api.edamam.com/api/nutrition-data?app_id=31ef3024&app_key=9e81114be629a33766a4d71739dfbad2&ingr=${encodeURIComponent(ingredient)}`);
      const data = await response.json();
      return data.calories || 0;
    } catch (error) {
      console.error("Error fetching calorie data: ", error);
      return 0;
    }
  }, []);

  const calculateTotalCalories = useCallback(async () => {
    let totalCalories = 0;
    for (const ingredient of ingredients) {
      try {
        const translatedName = await translateToEnglish(ingredient.name);
        const ingredientDescription = `${ingredient.amount} ${ingredient.unit} ${translatedName}`;
        const calories = await fetchCalories(ingredientDescription);
        totalCalories += calories;
      } catch (error) {
        console.error("Error calculating calories for ingredient:", ingredient.name, error);
      }
    }
    setCalories(totalCalories);
    setCaloriesCalculated(true);
    Alert.alert(
      isThaiLanguage ? "คำนวณแคลอรี่แล้ว" : "Calories Calculated",
      `${isThaiLanguage ? "แคลอรี่ทั้งหมด" : "Total Calories"}: ${totalCalories}`
    );
  }, [ingredients, isThaiLanguage, fetchCalories]);

  const handleSaveChanges = useCallback(async () => {
    if (!name || !description || !instructions || ingredients.some(ing => !ing.name || !ing.amount)) {
      Alert.alert(isThaiLanguage ? "ข้อผิดพลาด" : "Error", isThaiLanguage ? "กรุณากรอกข้อมูลให้ครบทุกช่อง" : "Please fill in all fields.");
      return;
    }

    if (ingredientsModified && !caloriesCalculated) {
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage ? "กรุณาคำนวณแคลอรี่ก่อนบันทึก" : "Please calculate calories before saving."
      );
      return;
    }

    setLoading(true);

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
        calories,
      });

      Alert.alert(isThaiLanguage ? "สำเร็จ" : "Success", isThaiLanguage ? "อัปเดตเมนูเรียบร้อยแล้ว!" : "Menu updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.error("Error updating menu: ", error);
      Alert.alert(isThaiLanguage ? "ข้อผิดพลาด" : "Error", isThaiLanguage ? "ไม่สามารถอัปเดตเมนูได้ กรุณาลองใหม่อีกครั้ง" : "Failed to update menu. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [name, description, instructions, ingredients, images, calories, isThaiLanguage, ingredientsModified, caloriesCalculated, menuId, navigation]);

  const handleAddIngredient = useCallback(() => {
    setIngredients([...ingredients, { name: "", amount: "", unit: "g" }]);
    setIngredientsModified(true);
  }, [ingredients]);

  const handleRemoveIngredient = useCallback((index) => {
    Alert.alert(
      isThaiLanguage ? "ยืนยันการลบ" : "Confirm Deletion",
      isThaiLanguage ? "คุณแน่ใจหรือไม่ว่าต้องการลบส่วนผสมนี้?" : "Are you sure you want to delete this ingredient?",
      [
        {
          text: isThaiLanguage ? "ยกเลิก" : "Cancel",
          style: "cancel",
        },
        {
          text: isThaiLanguage ? "ลบ" : "Delete",
          onPress: () => {
            const newIngredients = ingredients.filter((_, i) => i !== index);
            setIngredients(newIngredients);
            setIngredientsModified(true);
          },
        },
      ]
    );
  }, [ingredients, isThaiLanguage]);

  const handleIngredientChange = useCallback((index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
    setIngredientsModified(true);
  }, [ingredients]);

  const handleImagePress = useCallback((imageUri) => {
    setSelectedImage(imageUri);
    setIsModalVisible(true);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.container, themeStyles.background]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={isDarkTheme ? "#fff" : "#000"} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDarkTheme ? "#fff" : "#000" }]}>
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
          style={[styles.input, themeStyles.cardBackground, { color: isDarkTheme ? "#fff" : "#000" }]}
          placeholder={isThaiLanguage ? "ชื่อเมนู" : "Menu Name"}
          placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, themeStyles.cardBackground, { color: isDarkTheme ? "#fff" : "#000" }]}
          placeholder={isThaiLanguage ? "คำอธิบาย" : "Description"}
          placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
          value={description}
          onChangeText={setDescription}
        />
        <Text style={[styles.sectionTitle, { color: isDarkTheme ? "#fff" : "#000" }]}>
          {isThaiLanguage ? "ส่วนผสม" : "Ingredients"}
        </Text>
        {ingredients.map((ingredient, index) => (
          <View key={index} style={styles.ingredientRow}>
            <TextInput
              style={[styles.ingredientInput, themeStyles.cardBackground, { color: isDarkTheme ? "#fff" : "#000" }]}
              placeholder={isThaiLanguage ? "ชื่อส่วนผสม" : "Ingredient Name"}
              placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
              value={ingredient.name}
              onChangeText={(text) => handleIngredientChange(index, "name", text)}
            />
            <TextInput
              style={[styles.ingredientInput, themeStyles.cardBackground, { color: isDarkTheme ? "#fff" : "#000" }]}
              placeholder={isThaiLanguage ? "จำนวน" : "Amount"}
              placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
              value={ingredient.amount}
              onChangeText={(text) => handleIngredientChange(index, "amount", text)}
            />
            <Picker
              selectedValue={ingredient.unit}
              style={[styles.unitPicker, { color: isDarkTheme ? "#fff" : "#000" }]}
              onValueChange={(itemValue) => handleIngredientChange(index, "unit", itemValue)}
            >
              <Picker.Item label={isThaiLanguage ? "กรัม" : "g"} value="g" />
              <Picker.Item label={isThaiLanguage ? "กิโลกรัม" : "kg"} value="kg" />
              <Picker.Item label={isThaiLanguage ? "มิลลิลิตร" : "ml"} value="ml" />
              <Picker.Item label={isThaiLanguage ? "ลิตร" : "l"} value="l" />
              <Picker.Item label={isThaiLanguage ? "ถ้วย" : "cup"} value="cup" />
              <Picker.Item label={isThaiLanguage ? "ช้อนโต๊ะ" : "tbsp"} value="tbsp" />
              <Picker.Item label={isThaiLanguage ? "ช้อนชา" : "tsp"} value="tsp" />
            </Picker>
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
          style={[styles.textArea, themeStyles.cardBackground, { color: isDarkTheme ? "#fff" : "#000" }]}
          placeholder={isThaiLanguage ? "วิธีทำ" : "Instructions"}
          placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
          value={instructions}
          onChangeText={setInstructions}
          multiline
        />
        <View style={styles.calorieRow}>
          <TouchableOpacity style={styles.calculateButton} onPress={calculateTotalCalories}>
            <Text style={styles.calculateButtonText}>
              {isThaiLanguage ? "คำนวณแคลอรี่" : "Calculate Calories"}
            </Text>
          </TouchableOpacity>
          {calories !== null && (
            <Text style={[styles.calorieText, { color: isDarkTheme ? "#fff" : "#000" }]}>
              {isThaiLanguage ? `แคลอรี่: ${calories}` : `Calories: ${calories}`}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveChanges}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isThaiLanguage ? "บันทึกการเปลี่ยนแปลง" : "Save Changes"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

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
    </View>
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
    marginBottom: 20,
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
  unitPicker: {
    height: 40,
    width: 140,
    marginRight: 5,
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
  calorieRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  calculateButton: {
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  calculateButtonText: {
    color: "white",
    fontFamily: "NotoSansThai-Regular",
    fontSize: 16,
  },
  calorieText: {
    fontSize: 16,
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
    cardBackground: {
      backgroundColor: "#fff",
    },
  },
  dark: {
    background: {
      backgroundColor: "#333",
    },
    cardBackground: {
      backgroundColor: "#444",
    },
  },
});