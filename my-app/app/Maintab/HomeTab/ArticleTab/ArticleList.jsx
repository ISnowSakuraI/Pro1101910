import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { db, auth } from "../../../../firebase/Firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
} from "firebase/firestore";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";

export default function ArticleList({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const fetchArticles = async () => {
    const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const articles = await Promise.all(
      querySnapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data();
        const userDoc = await getDoc(doc(db, "Users", data.userId));
        const userName = userDoc.exists() ? userDoc.data().username : "Unknown";

        // Fetch likes count
        const likesQuery = query(
          collection(db, "favoriteArticles"),
          where("articleId", "==", docSnapshot.id)
        );
        const likesSnapshot = await getDocs(likesQuery);
        const likesCount = likesSnapshot.size;

        return {
          ...data,
          id: docSnapshot.id,
          userName,
          likesCount,
        };
      })
    );
    setArticles(articles);
  };

  const fetchFavorites = async () => {
    const user = auth.currentUser;
    if (user) {
      const q = query(
        collection(db, "favoriteArticles"),
        where("userId", "==", user.uid)
      );
      const querySnapshot = await getDocs(q);
      const favoriteIds = querySnapshot.docs.map((doc) => doc.data().articleId);
      setFavorites(favoriteIds);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchArticles();
      fetchFavorites();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchArticles();
    await fetchFavorites();
    setRefreshing(false);
  };

  const toggleFavorite = async (articleId) => {
    const user = auth.currentUser;
    if (user) {
      const favoriteDocRef = doc(
        db,
        "favoriteArticles",
        `${user.uid}_${articleId}`
      );
      if (favorites.includes(articleId)) {
        await deleteDoc(favoriteDocRef);
        setFavorites(favorites.filter((id) => id !== articleId));
      } else {
        await setDoc(favoriteDocRef, { userId: user.uid, articleId });
        setFavorites([...favorites, articleId]);
      }
      // Refresh articles and favorites after toggling
      await fetchArticles();
      await fetchFavorites();
    }
  };

  const filteredArticles = articles.filter((article) =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp) => {
    const date = timestamp.toDate();
    return `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()} น.`;
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkTheme ? "#121212" : "#f5f5f5" },
      ]}
    >
      <Text style={[styles.header, { color: isDarkTheme ? "#fff" : "#000" }]}>
        {isThaiLanguage ? "บทความสุขภาพและอาหาร" : "Health and Food Articles"}
      </Text>
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: isDarkTheme ? "#333" : "#fff",
            color: isDarkTheme ? "#fff" : "#000",
          },
        ]}
        placeholder={isThaiLanguage ? "ค้นหาบทความ..." : "Search articles..."}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => navigation.navigate("AddArticle")}
        >
          <Icon name="add-circle-outline" size={24} color="white" />
          <Text style={styles.toolbarButtonText}>
            {isThaiLanguage ? "เพิ่มบทความ" : "Add Article"}
          </Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ArticleDetail", { articleId: item.id })
            }
          >
            <View
              style={[
                styles.card,
                { backgroundColor: isDarkTheme ? "#333" : "#fff" },
              ]}
            >
              <View style={styles.imageContainer}>
                {(item.images || []).slice(0, 4).map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))}
                {item.images && item.images.length > 4 && (
                  <View style={styles.moreImagesOverlay}>
                    <Text style={styles.moreImagesText}>
                      +{item.images.length - 4}
                    </Text>
                  </View>
                )}
              </View>
              <Text
                style={[
                  styles.articleInfo,
                  { color: isDarkTheme ? "#ccc" : "#555" },
                ]}
              >
                {isThaiLanguage ? "โพสโดย" : "Posted by"}: {item.userName} |{" "}
                {formatDate(item.createdAt)}
              </Text>
              <Text
                style={[styles.title, { color: isDarkTheme ? "#fff" : "#000" }]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.description,
                  { color: isDarkTheme ? "#ccc" : "#555" },
                ]}
                numberOfLines={3}
              >
                {item.description}
              </Text>
              <View style={styles.likesContainer}>
                <Icon name="favorite" size={16} color="red" />
                <Text
                  style={[
                    styles.likesText,
                    { color: isDarkTheme ? "#aaa" : "#555" },
                  ]}
                >
                  {item.likesCount} {isThaiLanguage ? "คนถูกใจ" : "Likes"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => toggleFavorite(item.id)}
                style={styles.favoriteButton}
              >
                <Icon
                  name={
                    favorites.includes(item.id) ? "favorite" : "favorite-border"
                  }
                  size={24}
                  color={favorites.includes(item.id) ? "red" : "gray"}
                />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        numColumns={1}
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
  toolbar: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 10,
  },
  toolbarButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  toolbarButtonText: {
    color: "white",
    marginLeft: 5,
    fontFamily: "NotoSansThai-Regular",
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
  header: {
    fontFamily: "NotoSansThai-Regular",
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    marginBottom: 20,
    borderRadius: 10,
    padding: 15,
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
  image: {
    width: "48%",
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
    fontFamily: "NotoSansThai-Regular",
    fontSize: 16,
    marginVertical: 10,
  },
  description: {
    fontFamily: "NotoSansThai-Regular",
    fontSize: 14,
  },
  articleInfo: {
    fontSize: 12,
    marginTop: 5,
  },
  likesContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },
  likesText: {
    fontFamily: "NotoSansThai-Regular",
    fontSize: 12,
    marginLeft: 5,
  },
  favoriteButton: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});