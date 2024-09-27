import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db, auth } from "../../../../firebase/Firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";
import { useFocusEffect } from "@react-navigation/native";
import { useMenu } from "../../../MenuContext";

const ACTIVITY_LEVEL_KEY = "activityLevel";

const MealItem = React.memo(
  ({
    item,
    mealType,
    themeStyles,
    isThaiLanguage,
    toggleFavorite,
    handleDeleteMenu,
    handleImagePress,
    favoriteAnimations,
    favorites,
    navigation,
  }) => (
    <View style={[styles.mealItem, themeStyles.cardBackground]}>
      <TouchableOpacity
        onPress={() => handleDeleteMenu(mealType, item.id)}
        style={styles.deleteButton}
      >
        <Icon name="close" size={20} color="#ff7f50" />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => handleImagePress(item.images?.[0])}>
        {item.images && item.images[0] ? (
          <Image source={{ uri: item.images[0] }} style={styles.mealImage} />
        ) : (
          <View style={styles.placeholderImage} />
        )}
      </TouchableOpacity>
      <View style={styles.mealDetails}>
        <Text style={[styles.mealText, themeStyles.text]}>
          {item.name || (isThaiLanguage ? "ไม่มีชื่อ" : "No Name")}
        </Text>
        <Text style={[styles.mealCreator, { color: themeStyles.text.color }]}>
          {isThaiLanguage ? "โดย" : "by"} {item.username || "Unknown"}
        </Text>
        <Text style={[styles.mealCalories, { color: themeStyles.text.color }]}>
          {isThaiLanguage ? "แคลอรี่" : "Calories"}: {item.calories || 0}
        </Text>
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() =>
            navigation.navigate("MenuDetail", { menuId: item.menuId })
          }
        >
          <Icon
            name="book-open-outline"
            size={16}
            color="#fff"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.detailsButtonText}>
            {isThaiLanguage ? "รายละเอียด" : "Details"}
          </Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.favoriteIcon}
        onPress={() => toggleFavorite(item.menuId)}
      >
        <Animated.View
          style={{
            transform: [{ scale: favoriteAnimations[item.menuId] || 1 }],
          }}
        >
          <Icon
            name={favorites.includes(item.menuId) ? "heart" : "heart-outline"}
            size={24}
            color={favorites.includes(item.menuId) ? "#F44336" : "grey"}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  )
);

export default function FoodDiary({ navigation }) {
  const [meals, setMeals] = useState({
    morning: [],
    afternoon: [],
    evening: [],
  });
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favoriteAnimations, setFavoriteAnimations] = useState({});
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [activityLevel, setActivityLevel] = useState(1.2);
  const [recommendedCalories, setRecommendedCalories] = useState({
    morning: 0,
    afternoon: 0,
    evening: 0,
  });

  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();
  const { setOnSelectMenu } = useMenu();

  const themeStyles = useMemo(
    () => (isDarkTheme ? styles.dark : styles.light),
    [isDarkTheme]
  );

  useEffect(() => {
    const loadActivityLevel = async () => {
      try {
        const storedActivityLevel = await AsyncStorage.getItem(
          ACTIVITY_LEVEL_KEY
        );
        if (storedActivityLevel !== null) {
          setActivityLevel(parseFloat(storedActivityLevel));
        }
      } catch (error) {
        console.error("Error loading activity level: ", error);
      }
    };

    loadActivityLevel();
  }, []);

  const saveActivityLevel = async (level) => {
    try {
      await AsyncStorage.setItem(ACTIVITY_LEVEL_KEY, level.toString());
    } catch (error) {
      console.error("Error saving activity level: ", error);
    }
  };

  const fetchUserData = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const userDocRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const { height, weight, gender, birthday } = userData;
          const age =
            new Date().getFullYear() - new Date(birthday).getFullYear();
          const bmr =
            gender === "Male"
              ? 10 * weight + 6.25 * height - 5 * age + 5
              : 10 * weight + 6.25 * height - 5 * age - 161;
          const tdee = bmr * activityLevel;
          setRecommendedCalories({
            morning: tdee * 0.2,
            afternoon: tdee * 0.4,
            evening: tdee * 0.4,
          });
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
    }
  }, [activityLevel]);

  const fetchMeals = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const mealTypes = ["morning", "afternoon", "evening"];
        const newMeals = {};
        for (const meal of mealTypes) {
          const q = query(
            collection(db, "FoodDiary"),
            where("userId", "==", user.uid),
            where("mealType", "==", meal)
          );
          const querySnapshot = await getDocs(q);
          newMeals[meal] = await Promise.all(
            querySnapshot.docs.map(async (mealDoc) => {
              const data = mealDoc.data();
              const menuDocRef = doc(db, "menus", data.menuId);
              const menuDoc = await getDoc(menuDocRef);
              const menuData = menuDoc.exists() ? menuDoc.data() : {};
              const userDocRef = doc(db, "Users", menuData.userId);
              const userDoc = await getDoc(userDocRef);
              const username = userDoc.exists()
                ? userDoc.data().username
                : "Unknown";
              return { ...data, ...menuData, id: mealDoc.id, username };
            })
          );
        }
        setMeals(newMeals);
      } catch (error) {
        console.error("Error fetching meals: ", error);
      }
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const q = query(
          collection(db, "FavoriteMenus"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const favoriteIds = querySnapshot.docs.map((doc) => doc.data().menuId);
        setFavorites(favoriteIds);
      } catch (error) {
        console.error("Error fetching favorites: ", error);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchUserData();
      fetchMeals();
      fetchFavorites();
    }, [fetchUserData, fetchMeals, fetchFavorites])
  );

  const handleAddMenu = (meal) => {
    setOnSelectMenu(() => async (selectedMenus = []) => {
      const user = auth.currentUser;
      if (user) {
        try {
          const newMenus = (selectedMenus || []).map((selectedMenu) => ({
            userId: user.uid,
            mealType: meal,
            menuId: selectedMenu.id,
            addedAt: new Date(),
          }));

          const addedMenus = await Promise.all(
            newMenus.map(async (newMenu) => {
              const docRef = await addDoc(collection(db, "FoodDiary"), newMenu);
              return { ...newMenu, id: docRef.id };
            })
          );

          setMeals((prevMeals) => ({
            ...prevMeals,
            [meal]: [...prevMeals[meal], ...addedMenus],
          }));
        } catch (error) {
          console.error("Error adding menus to Food Diary: ", error);
        }
      }
    });

    navigation.navigate("MenuList");
  };

  const handleDeleteMenu = async (mealType, menuId) => {
    Alert.alert(
      isThaiLanguage ? "ยืนยันการลบ" : "Confirm Deletion",
      isThaiLanguage
        ? "คุณแน่ใจหรือไม่ว่าต้องการลบเมนูนี้?"
        : "Are you sure you want to delete this menu?",
      [
        {
          text: isThaiLanguage ? "ยกเลิก" : "Cancel",
          style: "cancel",
        },
        {
          text: isThaiLanguage ? "ลบ" : "Delete",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "FoodDiary", menuId));
              setMeals((prevMeals) => ({
                ...prevMeals,
                [mealType]: prevMeals[mealType].filter(
                  (meal) => meal.id !== menuId
                ),
              }));
            } catch (error) {
              console.error("Error deleting menu: ", error);
            }
          },
        },
      ]
    );
  };

  const handleImagePress = (imageUri) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };

  const toggleFavorite = async (menuId) => {
    const user = auth.currentUser;
    if (user) {
      const favoriteRef = doc(db, "FavoriteMenus", `${user.uid}_${menuId}`);
      const favoriteDoc = await getDoc(favoriteRef);
      const isFavorite = favoriteDoc.exists();

      if (isFavorite) {
        await deleteDoc(favoriteRef);
        setFavorites(favorites.filter((id) => id !== menuId));
      } else {
        await setDoc(favoriteRef, { userId: user.uid, menuId });
        setFavorites([...favorites, menuId]);
      }

      const animation = favoriteAnimations[menuId] || new Animated.Value(1);
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1.5,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setFavoriteAnimations((prev) => ({ ...prev, [menuId]: animation }));
    }
  };

  const calculateMealCalories = (mealType) => {
    return meals[mealType].reduce(
      (total, item) => total + (item.calories || 0),
      0
    );
  };

  const calculateTotalCalories = () => {
    return Object.keys(meals).reduce((total, mealType) => {
      return total + calculateMealCalories(mealType);
    }, 0);
  };

  const calculateTotalRecommendedCalories = () => {
    return Object.values(recommendedCalories).reduce(
      (total, cal) => total + cal,
      0
    );
  };

  const totalCalories = calculateTotalCalories();
  const totalRecommendedCalories = Math.round(
    calculateTotalRecommendedCalories()
  );
  const totalProgress =
    totalRecommendedCalories > 0 ? totalCalories / totalRecommendedCalories : 0;

  useEffect(() => {
    if (totalCalories > totalRecommendedCalories) {
      Alert.alert(
        isThaiLanguage ? "แจ้งเตือน" : "Alert",
        isThaiLanguage
          ? "คุณบริโภคแคลอรี่มากเกินไปในวันนี้!"
          : "You have consumed too many calories today!"
      );
    }
  }, [totalCalories, totalRecommendedCalories, isThaiLanguage]);

  return (
    <ScrollView style={[styles.container, themeStyles.background]}>
      <Text style={[styles.title, themeStyles.text]}>
        {isThaiLanguage ? "วางแผนอาหาร" : "Food Planning"}
      </Text>

      <View style={styles.headerButtons}>
        <HeaderButton
          icon="account-circle"
          text={isThaiLanguage ? "เมนูของฉัน" : "My Menu"}
          onPress={() => navigation.navigate("MyMenus")}
          style={styles.myMenusButton}
        />
        <HeaderButton
          icon="heart"
          text={isThaiLanguage ? "เมนูที่ชอบ" : "Favorite Menus"}
          onPress={() => navigation.navigate("FavoriteMenus")}
          style={styles.favoriteButton}
        />
        <HeaderButton
          icon="plus-circle"
          text={isThaiLanguage ? "เพิ่มเมนู" : "Add Menu"}
          onPress={() => navigation.navigate("AddMenu")}
          style={styles.addButton}
        />
      </View>

      {/* Activity Level Picker */}
      <View style={[styles.pickerContainer, themeStyles.cardBackground]}>
        <Text style={[styles.pickerLabel, themeStyles.text]}>
          {isThaiLanguage ? "ระดับกิจกรรม" : "Activity Level"}
        </Text>
        <Picker
          selectedValue={activityLevel}
          style={[styles.picker, { color: themeStyles.text.color }]}
          onValueChange={(itemValue) => {
            setActivityLevel(itemValue);
            saveActivityLevel(itemValue);
          }}
          dropdownIconColor={themeStyles.text.color}
        >
          <Picker.Item
            label={isThaiLanguage ? "นั่งทำงานอยู่กับที่" : "Sedentary"}
            value={1.2}
          />
          <Picker.Item
            label={isThaiLanguage ? "ออกกำลังกายเล็กน้อย" : "Lightly active"}
            value={1.375}
          />
          <Picker.Item
            label={isThaiLanguage ? "ออกกำลังกายปานกลาง" : "Moderately active"}
            value={1.55}
          />
          <Picker.Item
            label={isThaiLanguage ? "ออกกำลังกายอย่างหนัก" : "Very active"}
            value={1.725}
          />
          <Picker.Item
            label={isThaiLanguage ? "ออกกำลังกายอย่างหนักมาก" : "Extra active"}
            value={1.9}
          />
        </Picker>
      </View>

      <AnimatedProgressBar progress={totalProgress} />
      <View style={styles.totalCaloriesContainer}>
        <Text style={styles.totalCaloriesText}>
          {isThaiLanguage ? "แคลอรี่รวมของวันนี้" : "Total Calories Today"}:{" "}
          {totalCalories} / {totalRecommendedCalories}
        </Text>
      </View>

      {/* Meal Sections */}
      {[
        {
          label: isThaiLanguage ? "เช้า" : "Morning",
          key: "morning",
          icon: "weather-sunset-up",
        },
        {
          label: isThaiLanguage ? "กลางวัน" : "Afternoon",
          key: "afternoon",
          icon: "weather-sunny",
        },
        {
          label: isThaiLanguage ? "เย็น" : "Evening",
          key: "evening",
          icon: "weather-sunset-down",
        },
      ].map((meal) => {
        const mealCalories = calculateMealCalories(meal.key);
        const mealProgress =
          recommendedCalories[meal.key] > 0
            ? mealCalories / recommendedCalories[meal.key]
            : 0;
        return (
          <View key={meal.key} style={styles.mealContainer}>
            <View style={styles.mealHeader}>
              <Icon name={meal.icon} size={24} color="#ff7f50" />
              <Text style={[styles.mealTitle, themeStyles.text]}>
                {meal.label}
              </Text>
              <View style={styles.caloriesInfo}>
                <Text style={[styles.mealCalories, themeStyles.text]}>
                  {isThaiLanguage ? "แคลอรี่รวม" : "Total Calories"}:{" "}
                  {mealCalories} / {Math.round(recommendedCalories[meal.key])}
                </Text>
                <TouchableOpacity onPress={() => setInfoModalVisible(true)}>
                  <Icon name="information-outline" size={20} color="#ff7f50" />
                </TouchableOpacity>
              </View>
            </View>
            <AnimatedProgressBar progress={mealProgress} />
            {meals[meal.key].map((item, idx) => (
              <MealItem
                key={idx}
                item={item}
                mealType={meal.key}
                themeStyles={themeStyles}
                isThaiLanguage={isThaiLanguage}
                toggleFavorite={toggleFavorite}
                handleDeleteMenu={handleDeleteMenu}
                handleImagePress={handleImagePress}
                favoriteAnimations={favoriteAnimations}
                favorites={favorites}
                navigation={navigation}
              />
            ))}
            <TouchableOpacity
              style={styles.button}
              onPress={() => handleAddMenu(meal.key)}
            >
              <Icon
                name="plus-circle-outline"
                size={16}
                color="#fff"
                style={{ marginRight: 5 }}
              />
              <Text style={styles.buttonText}>
                {isThaiLanguage ? "เพิ่มเมนู" : "Add Menu"}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setImageModalVisible(false)}
          >
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullImage} />
          )}
        </View>
      </Modal>

      <Modal visible={infoModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setInfoModalVisible(false)}
          >
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <View style={styles.infoContent}>
            <Text style={styles.infoText}>
              {isThaiLanguage
                ? "จำนวนแคลอรี่ที่แสดงเป็นค่าเฉลี่ยที่แนะนำสำหรับมื้อนี้"
                : "The displayed calorie count is an average recommended for this meal."}
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const HeaderButton = ({ icon, text, onPress, style }) => (
  <TouchableOpacity style={style} onPress={onPress}>
    <Icon name={icon} size={20} color="#fff" style={{ marginRight: 5 }} />
    <Text style={styles.myMenusButtonText}>{text}</Text>
  </TouchableOpacity>
);

const AnimatedProgressBar = ({ progress }) => {
  const animatedValue = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["#00FF00", "#FFFF00", "#FF0000"],
  });

  return (
    <Animated.View
      style={[
        styles.progressBar,
        {
          width: animatedValue.interpolate({
            inputRange: [0, 1],
            outputRange: ["0%", "100%"],
          }),
          backgroundColor,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 10,
    textAlign: "center",
  },
  headerButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  myMenusButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00A047",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  myMenusButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "NotoSansThai-Regular",
  },
  favoriteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F44336",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#008AFF",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  pickerContainer: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 10,
  },
  pickerLabel: {
    fontSize: 16,
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 5,
  },
  picker: {
    height: 50,
    width: "100%",
  },
  mealContainer: {
    marginBottom: 20,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  mealTitle: {
    fontSize: 20,
    marginLeft: 0,
    fontFamily: "NotoSansThai-Regular",
  },
  caloriesInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  mealItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    position: "relative",
  },
  deleteButton: {
    position: "absolute",
    top: 5,
    right: 5,
    zIndex: 1,
  },
  mealImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
    marginRight: 10,
  },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
    backgroundColor: "#ccc",
    marginRight: 10,
  },
  mealDetails: {
    flex: 1,
  },
  mealText: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "NotoSansThai-Regular",
  },
  mealCreator: {
    fontSize: 14,
    fontFamily: "NotoSansThai-Regular",
  },
  mealCalories: {
    fontSize: 14,
    fontFamily: "NotoSansThai-Regular",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff7f50",
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 20,
    marginTop: 5,
    alignSelf: "flex-start",
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "NotoSansThai-Regular",
  },
  favoriteIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff7f50",
    padding: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
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
  infoContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  infoText: {
    fontSize: 16,
    textAlign: "center",
    fontFamily: "NotoSansThai-Regular",
  },
  totalCaloriesContainer: {
    marginVertical: 20,
    padding: 10,
    backgroundColor: "#ff7f50",
    borderRadius: 10,
    alignItems: "center",
  },
  totalCaloriesText: {
    fontSize: 18,
    color: "#fff",
    fontFamily: "NotoSansThai-Regular",
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    marginTop: 10,
    width: "100%", // Ensure the progress bar takes full width
  },
  light: {
    background: {
      backgroundColor: "#f0f0f0",
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
      backgroundColor: "#1c1c1c",
    },
    text: {
      color: "#fff",
    },
    cardBackground: {
      backgroundColor: "#2a2a2a",
    },
  },
});
