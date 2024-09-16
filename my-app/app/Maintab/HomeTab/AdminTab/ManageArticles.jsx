import React, { useState, useEffect, useCallback } from "react";
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

export default function ManageArticles({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const themeStyles = isDarkTheme ? styles.dark : styles.light;

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

  useEffect(() => {
    if (isAdmin) {
      fetchArticles();
    }
  }, [fetchArticles, isAdmin]);

  const handleDeleteArticle = async (articleId) => {
    try {
      await deleteDoc(doc(db, "articles", articleId));
      setArticles(articles.filter((article) => article.id !== articleId));
      Alert.alert(
        isThaiLanguage ? "สำเร็จ" : "Success",
        isThaiLanguage
          ? "ลบบทความเรียบร้อยแล้ว!"
          : "Article deleted successfully!"
      );
    } catch (error) {
      console.error("Error deleting article: ", error);
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage
          ? "ไม่สามารถลบบทความได้ กรุณาลองใหม่อีกครั้ง."
          : "Failed to delete article. Please try again."
      );
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchArticles().then(() => setRefreshing(false));
  }, [fetchArticles]);

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isAdmin) {
    return null; // Render nothing if not admin
  }

  return (
    <View style={[styles.container, themeStyles.background]}>
      <Text style={[styles.header, themeStyles.text]}>
        {isThaiLanguage ? "จัดการบทความ" : "Manage Articles"}
      </Text>
      <TextInput
        style={[styles.searchInput, themeStyles.inputBackground]}
        placeholder={isThaiLanguage ? "ค้นหาบทความ..." : "Search articles..."}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, themeStyles.cardBackground]}>
            {item.images && item.images[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>No Image</Text>
              </View>
            )}
            <Text style={[styles.title, themeStyles.text]} numberOfLines={4}>
              {item.title}
            </Text>
            <Text
              style={[
                styles.description,
                { color: isDarkTheme ? "#aaa" : "#666" },
              ]}
              numberOfLines={3}
            >
              {item.description}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteArticle(item.id)}
              >
                <Icon name="delete" size={20} color="white" />
                <Text style={styles.buttonText}>
                  {isThaiLanguage ? "ลบ" : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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