import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { db, auth } from "../../../../firebase/Firebase";
import { collection, getDocs, deleteDoc, doc, getDoc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";

export default function ManageContent({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [menus, setMenus] = useState([]);
  const [usernames, setUsernames] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isManagingArticles, setIsManagingArticles] = useState(true);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const themeStyles = useMemo(() => (isDarkTheme ? styles.dark : styles.light), [isDarkTheme]);

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, "Users", user.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            setIsAdmin(true);
          } else {
            Alert.alert(
              isThaiLanguage ? "ข้อผิดพลาด" : "Error",
              isThaiLanguage
                ? "คุณไม่มีสิทธิ์เข้าถึงหน้านี้"
                : "You do not have permission to access this page"
            );
            navigation.goBack();
          }
        }
      } catch (error) {
        console.error("Error checking admin status: ", error);
      }
    };

    checkAdminStatus();
  }, [navigation, isThaiLanguage]);

  const fetchUsernames = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "Users"));
      const usernamesMap = {};
      querySnapshot.forEach((doc) => {
        usernamesMap[doc.id] = doc.data().username;
      });
      setUsernames(usernamesMap);
    } catch (error) {
      console.error("Error fetching usernames: ", error);
    }
  }, []);

  const fetchArticles = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "articles"));
      const articlesList = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setArticles(articlesList);
    } catch (error) {
      console.error("Error fetching articles: ", error);
    }
  }, []);

  const fetchMenus = useCallback(async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "menus"));
      const menusList = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));
      setMenus(menusList);
    } catch (error) {
      console.error("Error fetching menus: ", error);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchUsernames();
      if (isManagingArticles) {
        fetchArticles();
      } else {
        fetchMenus();
      }
    }
  }, [fetchArticles, fetchMenus, fetchUsernames, isAdmin, isManagingArticles]);

  const handleDeleteContent = useCallback(async (contentId, type) => {
    Alert.alert(
      isThaiLanguage ? "ยืนยันการลบ" : "Confirm Deletion",
      isThaiLanguage
        ? `คุณแน่ใจหรือไม่ว่าต้องการลบ${type === "articles" ? "บทความ" : "เมนู"}นี้?`
        : `Are you sure you want to delete this ${type === "articles" ? "article" : "menu"}?`,
      [
        {
          text: isThaiLanguage ? "ยกเลิก" : "Cancel",
          style: "cancel",
        },
        {
          text: isThaiLanguage ? "ลบ" : "Delete",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, type, contentId));
              if (type === "articles") {
                setArticles((prevArticles) => prevArticles.filter((article) => article.id !== contentId));
              } else {
                setMenus((prevMenus) => prevMenus.filter((menu) => menu.id !== contentId));
              }
              Alert.alert(
                isThaiLanguage ? "สำเร็จ" : "Success",
                isThaiLanguage
                  ? `${type === "articles" ? "ลบบทความ" : "ลบเมนู"}เรียบร้อยแล้ว!`
                  : `${type === "articles" ? "Article" : "Menu"} deleted successfully!`
              );
            } catch (error) {
              console.error(`Error deleting ${type}: `, error);
              Alert.alert(
                isThaiLanguage ? "ข้อผิดพลาด" : "Error",
                isThaiLanguage
                  ? `ไม่สามารถลบ${type === "articles" ? "บทความ" : "เมนู"}ได้ กรุณาลองใหม่อีกครั้ง.`
                  : `Failed to delete ${type === "articles" ? "article" : "menu"}. Please try again.`
              );
            }
          },
        },
      ]
    );
  }, [isThaiLanguage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (isManagingArticles) {
      fetchArticles().then(() => setRefreshing(false));
    } else {
      fetchMenus().then(() => setRefreshing(false));
    }
  }, [fetchArticles, fetchMenus, isManagingArticles]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "";
    const date = new Date(timestamp.seconds * 1000);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const filteredContent = useMemo(() => {
    return (isManagingArticles ? articles : menus).filter((content) =>
      (isManagingArticles ? content.title : content.name)?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [articles, menus, searchQuery, isManagingArticles]);

  if (!isAdmin) {
    return null; // Render nothing if not admin
  }

  return (
    <View style={[styles.container, themeStyles.background]}>
      <Text style={[styles.header, themeStyles.text]}>
        {isThaiLanguage ? "จัดการเนื้อหา" : "Manage Content"}
      </Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            isManagingArticles && styles.activeToggleButton,
          ]}
          onPress={() => setIsManagingArticles(true)}
        >
          <Text
            style={[
              styles.toggleButtonText,
              isManagingArticles && styles.activeToggleButtonText,
            ]}
          >
            {isThaiLanguage ? "บทความ" : "Articles"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            !isManagingArticles && styles.activeToggleButton,
          ]}
          onPress={() => setIsManagingArticles(false)}
        >
          <Text
            style={[
              styles.toggleButtonText,
              !isManagingArticles && styles.activeToggleButtonText,
            ]}
          >
            {isThaiLanguage ? "เมนู" : "Menus"}
          </Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={[styles.searchInput, themeStyles.inputBackground]}
        placeholder={isThaiLanguage ? "ค้นหา..." : "Search..."}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredContent}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                isManagingArticles ? "ArticleDetail" : "MenuDetail",
                { articleId: item.id, menuId: item.id }
              )
            }
          >
            <View style={[styles.card, themeStyles.cardBackground]}>
              {item.images && item.images[0] ? (
                <Image source={{ uri: item.images[0] }} style={styles.image} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Text style={styles.imagePlaceholderText}>
                    {isThaiLanguage ? "ไม่มีรูปภาพ" : "No Image"}
                  </Text>
                </View>
              )}
              <Text style={[styles.title, themeStyles.text]} numberOfLines={2}>
                {isManagingArticles ? item.title : item.name}
              </Text>
              <Text
                style={[
                  styles.description,
                  { color: isDarkTheme ? "#aaa" : "#666" },
                ]}
                numberOfLines={3}
              >
                {item.description || (isThaiLanguage ? "ไม่มีคำอธิบาย" : "No Description")}
              </Text>
              <Text style={[themeStyles.text, styles.font]}>
                {isThaiLanguage
                  ? `อัปโหลดโดย: ${usernames[item.userId] || "ไม่ทราบ"}`
                  : `Uploaded by: ${usernames[item.userId] || "Unknown"}`}
              </Text>
              <Text style={[themeStyles.text, styles.font]}>
                {formatDate(item.createdAt)}
              </Text>
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteContent(item.id, isManagingArticles ? "articles" : "menus")}
                >
                  <Icon name="delete" size={20} color="white" />
                  <Text style={styles.buttonText}>
                    {isThaiLanguage ? "ลบ" : "Delete"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={styles.reportedButton}
        onPress={() => navigation.navigate("ReportedArticles")}
      >
        <Icon name="report" size={20} color="white" />
        <Text style={styles.buttonText}>
          {isThaiLanguage ? "ดูบทความที่ถูกรายงาน" : "View Reported Articles"}
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
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
  },
  activeToggleButton: {
    backgroundColor: "#ff7f50",
  },
  toggleButtonText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "NotoSansThai-Regular",
  },
  activeToggleButtonText: {
    color: "#fff",
    fontFamily: "NotoSansThai-Regular",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontFamily: "NotoSansThai-Regular",
  },
  card: {
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: "#fff",
    fontFamily: "NotoSansThai-Regular",
  },
  title: {
    fontSize: 16,
    fontFamily: "NotoSansThai-Regular",
    marginVertical: 10,
  },
  description: {
    fontSize: 14,
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 10,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
  },
  reportedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF9800",
    padding: 10,
    borderRadius: 5,
    justifyContent: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    marginLeft: 5,
    fontFamily: "NotoSansThai-Regular",
  },
  light: {
    background: {
      backgroundColor: "#f0f0f0",
    },
    text: {
      color: "#333333",
      fontFamily: "NotoSansThai-Regular",
    },
    inputBackground: {
      backgroundColor: "#ffffff",
      color: "#333333",
    },
    cardBackground: {
      backgroundColor: "#ffffff",
    },
  },
  dark: {
    background: {
      backgroundColor: "#212121",
    },
    text: {
      color: "#ffffff",
      fontFamily: "NotoSansThai-Regular",
    },
    inputBackground: {
      backgroundColor: "#2c2c2c",
      color: "#ffffff",
    },
    cardBackground: {
      backgroundColor: "#2c2c2c",
    },
  },
});