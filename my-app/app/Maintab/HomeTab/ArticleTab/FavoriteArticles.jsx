import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { db, auth } from "../../../../firebase/Firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";

export default function FavoriteArticles({ navigation }) {
  const [favoriteArticles, setFavoriteArticles] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const fetchFavoriteArticles = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const q = query(
          collection(db, "favoriteArticles"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const articlePromises = querySnapshot.docs.map(async (docSnapshot) => {
          const articleRef = doc(db, "articles", docSnapshot.data().articleId);
          const articleDoc = await getDoc(articleRef);
          const articleData = articleDoc.data();

          // Fetch the author's name
          const userDoc = await getDoc(doc(db, "Users", articleData.userId));
          const userName = userDoc.exists()
            ? userDoc.data().username
            : "Unknown";

          // Count the number of likes
          const likesQuery = query(
            collection(db, "favoriteArticles"),
            where("articleId", "==", articleDoc.id)
          );
          const likesSnapshot = await getDocs(likesQuery);
          const likeCount = likesSnapshot.size;

          return { id: articleDoc.id, ...articleData, userName, likeCount };
        });
        const articles = await Promise.all(articlePromises);
        setFavoriteArticles(articles);
        setFavorites(querySnapshot.docs.map((doc) => doc.data().articleId));
      } catch (error) {
        console.error("Error fetching favorite articles: ", error);
        Alert.alert(isThaiLanguage ? "ข้อผิดพลาด" : "Error", isThaiLanguage ? "ไม่สามารถดึงข้อมูลบทความโปรดได้" : "Failed to fetch favorite articles.");
      }
    }
  }, [isThaiLanguage]);

  useEffect(() => {
    fetchFavoriteArticles();
  }, [fetchFavoriteArticles]);

  const toggleFavorite = async (articleId) => {
    const user = auth.currentUser;
    if (user) {
      const favoriteDocRef = doc(
        db,
        "favoriteArticles",
        `${user.uid}_${articleId}`
      );
      try {
        if (favorites.includes(articleId)) {
          await deleteDoc(favoriteDocRef);
          setFavorites(favorites.filter((id) => id !== articleId));
        } else {
          await setDoc(favoriteDocRef, { userId: user.uid, articleId });
          setFavorites([...favorites, articleId]);
        }
        fetchFavoriteArticles();
      } catch (error) {
        console.error("Error toggling favorite: ", error);
        Alert.alert(isThaiLanguage ? "ข้อผิดพลาด" : "Error", isThaiLanguage ? "ไม่สามารถเปลี่ยนสถานะบทความโปรดได้" : "Failed to toggle favorite status.");
      }
    }
  };

  const formatDate = (timestamp) => {
    const date = timestamp.toDate();
    return `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()} น.`;
  };

  const renderArticle = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDarkTheme ? "#444" : "#fff" }]}
      onPress={() =>
        navigation.navigate("ArticleDetail", { articleId: item.id })
      }
    >
      <View style={styles.imageContainer}>
        {(item.images || []).slice(0, 3).map((image, index) => (
          <Image
            key={index}
            source={{ uri: image }}
            style={styles.articleImage}
          />
        ))}
        {item.images && item.images.length > 3 && (
          <View style={styles.moreImagesOverlay}>
            <Text style={styles.moreImagesText}>+{item.images.length - 3}</Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.articleInfo, { color: isDarkTheme ? "#aaa" : "#555" }]}
      >
        {isThaiLanguage ? "โพสโดย" : "Posted by"}: {item.userName} |{" "}
        {formatDate(item.createdAt)}
      </Text>
      <Text
        style={[styles.articleTitle, { color: isDarkTheme ? "#fff" : "#333" }]}
      >
        {item.title}
      </Text>
      <Text
        style={[
          styles.articleSnippet,
          { color: isDarkTheme ? "#ccc" : "#777" },
        ]}
        numberOfLines={3}
      >
        {item.description}
      </Text>
      <Text
        style={[styles.likeCount, { color: isDarkTheme ? "#aaa" : "#555" }]}
      >
        {item.likeCount} {isThaiLanguage ? "คนถูกใจ" : "Likes"}
      </Text>
      <TouchableOpacity
        onPress={() => toggleFavorite(item.id)}
        style={styles.favoriteButton}
      >
        <Icon
          name={favorites.includes(item.id) ? "favorite" : "favorite-border"}
          size={24}
          color={favorites.includes(item.id) ? "red" : "gray"}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkTheme ? "#333" : "#f5f5f5" },
      ]}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon
          name="arrow-back"
          size={24}
          color={isDarkTheme ? "#fff" : "#000"}
        />
      </TouchableOpacity>
      <Text style={[styles.header, { color: isDarkTheme ? "#fff" : "#333" }]}>
        {isThaiLanguage ? "บทความโปรด" : "Favorite Articles"}
      </Text>
      <FlatList
        data={favoriteArticles}
        renderItem={renderArticle}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text
            style={[
              styles.noDataText,
              { color: isDarkTheme ? "#aaa" : "#777" },
            ]}
          >
            {isThaiLanguage ? "ไม่มีบทความโปรด" : "No favorite articles"}
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
    textAlign: "center",
    marginVertical: 10,
  },
  card: {
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
  articleTitle: {
    fontSize: 18,
    fontFamily: "NotoSansThai-Regular",
    fontWeight: "bold",
  },
  articleSnippet: {
    fontSize: 14,
    fontFamily: "NotoSansThai-Regular",
    marginTop: 5,
  },
  articleInfo: {
    fontSize: 12,
    fontFamily: "NotoSansThai-Regular",
    marginTop: 5,
  },
  likeCount: {
    fontSize: 12,
    fontFamily: "NotoSansThai-Regular",
    marginTop: 5,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "NotoSansThai-Regular",
    marginTop: 20,
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});