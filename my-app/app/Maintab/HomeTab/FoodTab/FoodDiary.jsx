import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Animated,
} from "react-native";
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

  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();
  const { setOnSelectMenu } = useMenu();

  const themeStyles = useMemo(
    () => (isDarkTheme ? styles.dark : styles.light),
    [isDarkTheme]
  );

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
          collection(db, "Favorites"),
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
      fetchMeals();
      fetchFavorites();
    }, [fetchMeals, fetchFavorites])
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
    try {
      await deleteDoc(doc(db, "FoodDiary", menuId));
      setMeals((prevMeals) => ({
        ...prevMeals,
        [mealType]: prevMeals[mealType].filter((meal) => meal.id !== menuId),
      }));
    } catch (error) {
      console.error("Error deleting menu: ", error);
    }
  };

  const handleImagePress = (imageUri) => {
    setSelectedImage(imageUri);
    setImageModalVisible(true);
  };

  const toggleFavorite = async (menuId) => {
    const user = auth.currentUser;
    if (user) {
      const favoriteRef = doc(db, "Favorites", `${user.uid}_${menuId}`);
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
      ].map((meal) => (
        <View key={meal.key} style={styles.mealContainer}>
          <View style={styles.mealHeader}>
            <Icon name={meal.icon} size={24} color="#ff7f50" />
            <Text style={[styles.mealTitle, themeStyles.text]}>
              {meal.label}
            </Text>
          </View>
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
      ))}

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
    </ScrollView>
  );
}

const HeaderButton = ({ icon, text, onPress, style }) => (
  <TouchableOpacity style={style} onPress={onPress}>
    <Icon name={icon} size={20} color="#fff" style={{ marginRight: 5 }} />
    <Text style={styles.myMenusButtonText}>{text}</Text>
  </TouchableOpacity>
);

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
  mealContainer: {
    marginBottom: 20,
  },
  mealHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  mealTitle: {
    fontSize: 20,
    marginLeft: 10,
    fontFamily: "NotoSansThai-Regular",
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
