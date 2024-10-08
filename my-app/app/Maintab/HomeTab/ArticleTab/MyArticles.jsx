import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  TextInput,
} from "react-native";
import { db, auth } from "../../../../firebase/Firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";

export default function ManageMyArticles({ navigation }) {
  const [myArticles, setMyArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const fetchMyArticles = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const q = query(
          collection(db, "articles"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const querySnapshot = await getDocs(q);
        const articles = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
          images: doc.data().images || [],
        }));
        setMyArticles(articles);
      } catch (error) {
        console.error("Error fetching articles: ", error);
        Alert.alert(
          isThaiLanguage ? "ข้อผิดพลาด" : "Error",
          isThaiLanguage
            ? "ไม่สามารถดึงข้อมูลบทความได้"
            : "Failed to fetch articles."
        );
      }
    }
  }, [isThaiLanguage]);

  useFocusEffect(
    useCallback(() => {
      fetchMyArticles();
    }, [fetchMyArticles])
  );

  const handleDeleteArticle = async (articleId) => {
    try {
      await deleteDoc(doc(db, "articles", articleId));
      setMyArticles((prevArticles) =>
        prevArticles.filter((article) => article.id !== articleId)
      );
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

  const filteredArticles = myArticles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const themeStyles = isDarkTheme ? styles.dark : styles.light;

  return (
    <View style={[styles.container, themeStyles.background]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={themeStyles.text.color} />
      </TouchableOpacity>
      <Text style={[styles.header, themeStyles.text]}>
        {isThaiLanguage ? "จัดการบทความของฉัน" : "Manage My Articles"}
      </Text>
      <TextInput
  style={[
    styles.searchInput,
    themeStyles.cardBackground,
    { color: isDarkTheme ? "#fff" : "#000" } // Adjust input text color
  ]}
  placeholder={isThaiLanguage ? "ค้นหาบทความ..." : "Search articles..."}
  placeholderTextColor={isDarkTheme ? "#aaa" : "#555"} // Adjust placeholder text color
  value={searchQuery}
  onChangeText={setSearchQuery}
/>
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, themeStyles.cardBackground]}>
            <View style={styles.imageContainer}>
              {item.images.slice(0, 3).map((image, index) => (
                <Image
                  key={index}
                  source={{ uri: image }}
                  style={styles.articleImage}
                />
              ))}
              {item.images.length > 3 && (
                <View style={styles.moreImagesOverlay}>
                  <Text style={styles.moreImagesText}>
                    +{item.images.length - 3}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.title, themeStyles.text]}>{item.title}</Text>
            <Text
              style={[
                styles.description,
                { color: isDarkTheme ? "#ccc" : "#555" },
              ]}
              numberOfLines={3}
            >
              {item.description}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.editButton, { backgroundColor: "#00A047" }]}
                onPress={() =>
                  navigation.navigate("EditArticle", { articleId: item.id })
                }
                activeOpacity={0.7}
              >
                <Icon name="edit" size={20} color="white" />
                <Text style={styles.buttonText}>
                  {isThaiLanguage ? "แก้ไข" : "Edit"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteButton, { backgroundColor: "#F44336" }]}
                onPress={() => handleDeleteArticle(item.id)}
                activeOpacity={0.7}
              >
                <Icon name="delete" size={20} color="white" />
                <Text style={styles.buttonText}>
                  {isThaiLanguage ? "ลบ" : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text
            style={[
              styles.noDataText,
              { color: isDarkTheme ? "#aaa" : "#777" },
            ]}
          >
            {isThaiLanguage ? "ไม่มีบทความ" : "No articles found"}
          </Text>
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
  backButton: {
    marginBottom: 10,
  },
  header: {
    fontSize: 24,
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 20,
    textAlign: "center",
  },
  searchInput: {
    fontFamily: "NotoSansThai-Regular",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
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
  imageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
    position: "relative",
  },
  articleImage: {
    width: "30%",
    height: 100,
    borderRadius: 10,
    marginBottom: 5,
  },
  moreImagesOverlay: {
    position: "absolute",
    right: 5,
    bottom: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 5,
    padding: 5,
  },
  moreImagesText: {
    color: "white",
    fontFamily: "NotoSansThai-Regular",
  },
  title: {
    fontSize: 16,
    fontFamily: "NotoSansThai-Regular",
    marginVertical: 10,
  },
  description: {
    fontFamily: "NotoSansThai-Regular",
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: "white",
    marginLeft: 5,
    fontFamily: "NotoSansThai-Regular",
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "NotoSansThai-Regular",
    marginTop: 20,
  },
  light: {
    background: {
      backgroundColor: "#f0f0f0",
    },
    text: {
      color: "#333333",
    },
    cardBackground: {
      backgroundColor: "#ffffff",
    },
    primaryBackground: {
      backgroundColor: "#ff7f50",
    },
  },
  dark: {
    background: {
      backgroundColor: "#212121",
    },
    text: {
      color: "#ffffff",
    },
    cardBackground: {
      backgroundColor: "#2c2c2c",
    },
    primaryBackground: {
      backgroundColor: "#ff7f50",
    },
  },
});
