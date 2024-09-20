import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db, auth } from "../../../../firebase/Firebase";
import { collection, getDocs, query, where, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";

export default function FavoriteMenus({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [favoriteAnimations, setFavoriteAnimations] = useState({});
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  useEffect(() => {
    const fetchFavorites = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(
            collection(db, "Favorites"),
            where("userId", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          const favoriteMenus = await Promise.all(
            querySnapshot.docs.map(async (favDoc) => {
              const data = favDoc.data();
              const menuDocRef = doc(db, "menus", data.menuId);
              const menuDoc = await getDoc(menuDocRef);
              if (menuDoc.exists()) {
                const menuData = menuDoc.data();
                const userDocRef = doc(db, "Users", menuData.userId);
                const userDoc = await getDoc(userDocRef);
                const username = userDoc.exists() ? userDoc.data().username : "Unknown";
                return { ...menuData, id: menuDoc.id, username };
              }
              return null;
            })
          );
          setFavorites(favoriteMenus.filter((menu) => menu !== null));
        } catch (error) {
          console.error("Error fetching favorite menus: ", error);
        }
      }
    };

    fetchFavorites();
  }, []);

  const toggleFavorite = async (menuId) => {
    const user = auth.currentUser;
    if (user) {
      const favoriteRef = doc(db, "Favorites", `${user.uid}_${menuId}`);
      const favoriteDoc = await getDoc(favoriteRef);
      const isFavorite = favoriteDoc.exists();

      if (isFavorite) {
        await deleteDoc(favoriteRef);
        setFavorites(favorites.filter((menu) => menu.id !== menuId));
      } else {
        await setDoc(favoriteRef, { userId: user.uid, menuId });
        const menuDocRef = doc(db, "menus", menuId);
        const menuDoc = await getDoc(menuDocRef);
        if (menuDoc.exists()) {
          const menuData = menuDoc.data();
          const userDocRef = doc(db, "Users", menuData.userId);
          const userDoc = await getDoc(userDocRef);
          const username = userDoc.exists() ? userDoc.data().username : "Unknown";
          setFavorites([...favorites, { ...menuData, id: menuId, username }]);
        }
      }

      // Trigger animation
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

  const themeStyles = isDarkTheme ? styles.dark : styles.light;

  return (
    <View style={[styles.container, themeStyles.background]}>
      <Text style={[styles.title, themeStyles.text]}>
        {isThaiLanguage ? "เมนูที่ชอบ" : "Favorite Menus"}
      </Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.menuItem, themeStyles.cardBackground]}>
            {item.images && item.images[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.menuImage} />
            ) : (
              <View style={styles.placeholderImage} />
            )}
            <View style={styles.menuDetails}>
              <Text style={[styles.menuName, themeStyles.text]}>
                {item.name}
              </Text>
              <Text style={[styles.menuInfo, themeStyles.text]}>
                {isThaiLanguage ? "โดย" : "by"} {item.username}
              </Text>
              <Text style={[styles.menuInfo, themeStyles.text]}>
                {isThaiLanguage ? "แคลอรี่" : "Calories"}: {item.calories || 0}
              </Text>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() =>
                  navigation.navigate("MenuDetail", { menuId: item.id })
                }
              >
                <Icon
                  name="book-open-outline"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 5 }}
                />
                <Text style={styles.detailsButtonText}>
                  {isThaiLanguage ? "ดูรายละเอียด" : "View Details"}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.favoriteIcon}
              onPress={() => toggleFavorite(item.id)}
            >
              <Animated.View
                style={{
                  transform: [
                    { scale: favoriteAnimations[item.id] || 1 },
                  ],
                }}
              >
                <Icon
                  name={
                    favorites.some((fav) => fav.id === item.id)
                      ? "heart"
                      : "heart-outline"
                  }
                  size={24}
                  color={favorites.some((fav) => fav.id === item.id) ? "#F44336" : "grey"}
                />
              </Animated.View>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 20,
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  menuImage: {
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
  menuDetails: {
    flex: 1,
  },
  menuName: {
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "NotoSansThai-Regular",
  },
  menuInfo: {
    fontSize: 14,
    fontFamily: "NotoSansThai-Regular",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
    backgroundColor: "#ff7f50",
    padding: 5,
    borderRadius: 5,
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "NotoSansThai-Regular",
  },
  favoriteIcon: {
    marginLeft: 10,
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