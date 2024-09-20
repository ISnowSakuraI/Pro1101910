import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Animated,
  TextInput,
} from "react-native";
import { db, auth } from "../../../../firebase/Firebase";
import { collection, getDocs, doc, getDoc, query, where, setDoc, deleteDoc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";
import { useFocusEffect } from "@react-navigation/native";
import { useMenu } from "../../../MenuContext";
import moment from "moment";

export default function MenuList({ navigation }) {
  const [menus, setMenus] = useState([]);
  const [selectedMenus, setSelectedMenus] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showMyMenus, setShowMyMenus] = useState(false);
  const [showFavoriteMenus, setShowFavoriteMenus] = useState(false);
  const [favoriteMenus, setFavoriteMenus] = useState([]);
  const [favoriteAnimations, setFavoriteAnimations] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const { onSelectMenu } = useMenu();
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const fetchMenus = useCallback(async () => {
    try {
      const user = auth.currentUser;
      let q = collection(db, "menus");
      if (showMyMenus && user) {
        q = query(q, where("userId", "==", user.uid));
      }
      const querySnapshot = await getDocs(q);
      const menuList = await Promise.all(
        querySnapshot.docs.map(async (menuDoc) => {
          const data = menuDoc.data();
          const userDocRef = doc(db, "Users", data.userId);
          const userDoc = await getDoc(userDocRef);
          const username = userDoc.exists() ? userDoc.data().username : "Unknown";

          // Fetch likes count
          const likesQuery = query(
            collection(db, "Favorites"),
            where("menuId", "==", menuDoc.id)
          );
          const likesSnapshot = await getDocs(likesQuery);
          const likesCount = likesSnapshot.size;

          return { ...data, id: menuDoc.id, username, likes: likesCount };
        })
      );
      menuList.sort((a, b) => b.createdAt - a.createdAt);
      setMenus(menuList);
    } catch (error) {
      console.error("Error fetching menus: ", error);
    }
  }, [showMyMenus]);

  const fetchFavoriteMenus = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const q = query(
          collection(db, "Favorites"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const favoriteMenuIds = querySnapshot.docs.map((doc) => doc.data().menuId);
        setFavoriteMenus(favoriteMenuIds);
      } catch (error) {
        console.error("Error fetching favorite menus: ", error);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchMenus();
      fetchFavoriteMenus();
    }, [fetchMenus, fetchFavoriteMenus])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMenus().then(() => setRefreshing(false));
  }, [fetchMenus]);

  const toggleSelectMenu = (menu) => {
    setSelectedMenus((prevSelected) =>
      prevSelected.includes(menu.id)
        ? prevSelected.filter((id) => id !== menu.id)
        : [...prevSelected, menu.id]
    );
  };

  const handleSelectMenus = () => {
    const selectedMenuObjects = menus.filter((menu) =>
      selectedMenus.includes(menu.id)
    );
    if (onSelectMenu) {
      onSelectMenu(selectedMenuObjects || []);
    }
    navigation.goBack();
  };

  const toggleShowMyMenus = () => {
    setShowMyMenus((prev) => !prev);
  };

  const toggleShowFavoriteMenus = () => {
    setShowFavoriteMenus((prev) => !prev);
  };

  const toggleFavoriteMenu = async (menuId) => {
    const user = auth.currentUser;
    if (user) {
      const favoriteRef = doc(db, "Favorites", `${user.uid}_${menuId}`);
      const isFavorite = favoriteMenus.includes(menuId);

      try {
        if (isFavorite) {
          await deleteDoc(favoriteRef);
          setFavoriteMenus(favoriteMenus.filter((id) => id !== menuId));
        } else {
          await setDoc(favoriteRef, { userId: user.uid, menuId });
          setFavoriteMenus([...favoriteMenus, menuId]);
        }

        // Update the likes count in the menus state
        setMenus((prevMenus) =>
          prevMenus.map((menu) =>
            menu.id === menuId
              ? { ...menu, likes: isFavorite ? menu.likes - 1 : menu.likes + 1 }
              : menu
          )
        );

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
      } catch (error) {
        console.error("Error toggling favorite: ", error);
      }
    }
  };

  const filteredMenus = menus.filter((menu) => {
    const matchesSearch = menu.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isFavorite = showFavoriteMenus ? favoriteMenus.includes(menu.id) : true;
    return matchesSearch && isFavorite;
  });

  const themeStyles = isDarkTheme ? styles.dark : styles.light;

  return (
    <View style={[styles.container, themeStyles.background]}>
      <Text style={[styles.title, { color: isDarkTheme ? "#fff" : "#000" }]}>
        {isThaiLanguage ? "รวมเมนู" : "Menu List"}
      </Text>
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={toggleShowMyMenus}
        >
          <Icon
            name={showMyMenus ? "filter-remove" : "filter"}
            size={20}
            color="#fff"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.filterButtonText}>
            {showMyMenus
              ? isThaiLanguage
                ? "แสดงทั้งหมด"
                : "Show All"
              : isThaiLanguage
              ? "เมนูของฉัน"
              : "My Menus"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={toggleShowFavoriteMenus}
        >
          <Icon
            name={showFavoriteMenus ? "heart-off" : "heart"}
            size={20}
            color="#fff"
            style={{ marginRight: 5 }}
          />
          <Text style={styles.filterButtonText}>
            {showFavoriteMenus
              ? isThaiLanguage
                ? "แสดงทั้งหมด"
                : "Show All"
              : isThaiLanguage
              ? "เมนูที่ชอบ"
              : "Favorite Menus"}
          </Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.searchBar, { color: isDarkTheme ? "#fff" : "#000" }]}
        placeholder={isThaiLanguage ? "ค้นหาเมนู" : "Search Menus"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredMenus}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                borderColor: selectedMenus.includes(item.id)
                  ? isDarkTheme
                    ? "#ff7f50"
                    : "#333"
                  : "transparent",
                borderWidth: selectedMenus.includes(item.id) ? 2 : 0,
              },
            ]}
            onPress={() => toggleSelectMenu(item)}
          >
            {item.images && item.images[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.menuImage} />
            ) : (
              <View style={styles.placeholderImage} />
            )}
            <View style={styles.menuDetails}>
              <Text style={[styles.menuName, { color: isDarkTheme ? "#fff" : "#000" }]}>
                {item.name}
              </Text>
              <Text style={[styles.menuCreator, { color: isDarkTheme ? "#ccc" : "#666" }]}>
                {isThaiLanguage ? "โดย" : "by"} {item.username}
              </Text>
              <Text style={[styles.menuDate, { color: isDarkTheme ? "#ccc" : "#666" }]}>
                {moment(item.createdAt.toDate()).format('DD/MM/YYYY HH:mm')}
              </Text>
              <Text style={[styles.menuLikes, { color: isDarkTheme ? "#ccc" : "#666" }]}>
                {item.likes} {isThaiLanguage ? "ถูกใจ" : "Likes"}
              </Text>
              <Text style={[styles.menuCalories, { color: isDarkTheme ? "#ccc" : "#666" }]}>
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
                  {isThaiLanguage ? "รายละเอียด" : "Details"}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => toggleFavoriteMenu(item.id)}>
              <Animated.View
                style={{
                  transform: [
                    { scale: favoriteAnimations[item.id] || 1 },
                  ],
                }}
              >
                <Icon
                  name={
                    favoriteMenus.includes(item.id)
                      ? "heart"
                      : "heart-outline"
                  }
                  size={24}
                  color={favoriteMenus.includes(item.id) ? "#F44336" : "grey"}
                  style={{ marginLeft: 10 }}
                />
              </Animated.View>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <TouchableOpacity
        style={styles.selectButton}
        onPress={handleSelectMenus}
      >
        <Icon
          name="check-circle-outline"
          size={20}
          color="#fff"
          style={{ marginRight: 5 }}
        />
        <Text style={styles.selectButtonText}>
          {isThaiLanguage ? "เลือกเมนู" : "Select Menus"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AddMenu")}
      >
        <Icon
          name="plus-circle-outline"
          size={20}
          color="#fff"
          style={{ marginRight: 5 }}
        />
        <Text style={styles.addButtonText}>
          {isThaiLanguage ? "เพิ่มเมนูใหม่" : "Add New Menu"}
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
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff7f50",
    padding: 10,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
  },
  filterButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  searchBar: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    position: "relative",
  },
  menuImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 15,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: "#ccc",
    marginRight: 15,
  },
  menuDetails: {
    flex: 1,
  },
  menuName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  menuCreator: {
    fontSize: 14,
    marginBottom: 5,
  },
  menuDate: {
    fontSize: 12,
    marginBottom: 5,
  },
  menuLikes: {
    fontSize: 12,
    marginBottom: 5,
  },
  menuCalories: {
    fontSize: 12,
    marginBottom: 5,
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ff7f50",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    marginTop: 5,
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "NotoSansThai-Regular",
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#00A047",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  selectButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#008AFF",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  light: {
    background: {
      backgroundColor: "#f9f9f9",
    },
  },
  dark: {
    background: {
      backgroundColor: "#333",
    },
  },
});