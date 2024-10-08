import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, TextInput, RefreshControl } from "react-native";
import { db, auth } from "../../../../firebase/Firebase";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";

export default function MyMenus({ navigation }) {
  const [menus, setMenus] = useState([]);
  const [filteredMenus, setFilteredMenus] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const fetchUserMenus = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const q = query(
          collection(db, "menus"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const userMenus = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMenus(userMenus);
        setFilteredMenus(userMenus);
      } catch (error) {
        console.error("Error fetching user menus: ", error);
      }
    }
  }, []);

  useEffect(() => {
    fetchUserMenus();
  }, [fetchUserMenus]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserMenus().then(() => setRefreshing(false));
  }, [fetchUserMenus]);

  const handleDeleteMenu = async (menuId) => {
    try {
      await deleteDoc(doc(db, "menus", menuId));
      setMenus((prevMenus) => prevMenus.filter((menu) => menu.id !== menuId));
      setFilteredMenus((prevMenus) => prevMenus.filter((menu) => menu.id !== menuId));
    } catch (error) {
      console.error("Error deleting menu: ", error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = menus.filter((menu) =>
        menu.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredMenus(filtered);
    } else {
      setFilteredMenus(menus);
    }
  };

  const themeStyles = isDarkTheme ? styles.dark : styles.light;

  return (
    <View style={[styles.container, themeStyles.background]}>
      <Text style={[styles.title, themeStyles.text]}>
        {isThaiLanguage ? "เมนูของฉัน" : "My Menus"}
      </Text>
      <TextInput
        style={[styles.searchInput, themeStyles.cardBackground, { color: themeStyles.text.color }]}
        placeholder={isThaiLanguage ? "ค้นหาเมนู" : "Search Menus"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={searchQuery}
        onChangeText={handleSearch}
      />
      <FlatList
        data={filteredMenus}
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
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => navigation.navigate("MenuDetail", { menuId: item.id })}
              >
                <Icon name="book-open-outline" size={16} color="#fff" style={{ marginRight: 5 }} />
                <Text style={styles.detailsButtonText}>
                  {isThaiLanguage ? "ดูรายละเอียด" : "View Details"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("EditMenu", { menuId: item.id })}
              >
                <Icon name="pencil" size={16} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteMenu(item.id)}
              >
                <Icon name="delete" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 20,
    textAlign: "center",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  menuImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    marginRight: 15,
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#ccc",
    marginRight: 15,
  },
  menuDetails: {
    flex: 1,
  },
  menuName: {
    fontSize: 20,
    fontFamily: "NotoSansThai-Regular",
  },
  buttonContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  detailsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ff7f50",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginTop: 10,
  },
  detailsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "NotoSansThai-Regular",
  },
  editButton: {
    backgroundColor: "#00A047",
    padding: 6,
    borderRadius: 5,
    marginLeft: 8,
  },
  deleteButton: {
    backgroundColor: "#F44336",
    padding: 6,
    borderRadius: 5,
    marginLeft: 8,
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