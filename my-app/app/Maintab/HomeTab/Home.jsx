import React, { useState, useEffect, useCallback } from "react";
import {
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../../firebase/Firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import { useNavigation } from "@react-navigation/native";

export default function Home({ navigation }) {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [articles, setArticles] = useState([]);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const userDoc = await getDoc(doc(db, "Users", currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          setIsAdmin(true);
        }
      }
    });
    return unsubscribe;
  }, []);

  const fetchArticles = useCallback(async () => {
    const querySnapshot = await getDocs(collection(db, "articles"));
    const articles = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    setArticles(articles.slice(0, 4)); // Get the latest 4 articles
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchArticles();
    }, [fetchArticles])
  );

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkTheme ? "#222" : "#f5f5f5" },
      ]}
    >
      <SectionHeader title={isThaiLanguage ? "หมวดหมู่" : "Categories"} />
      <View style={styles.grid}>
        <CategoryItem
          icon="calendar-today"
          label={isThaiLanguage ? "จัดตารางออกกำลังกาย" : "Schedule"}
          onPress={() => navigation.navigate("Schedule")}
        />
        <CategoryItem
          icon="article"
          label={isThaiLanguage ? "บทความ" : "Articles"}
          onPress={() => navigation.navigate("ArticleStack")}
        />
        <CategoryItem
          icon="fitness-center"
          label={isThaiLanguage ? "ติดตามการวิ่ง" : "Track Run"}
          onPress={() => navigation.navigate("ExerciseTracker")}
        />
        <CategoryItem
          icon="bar-chart"
          label={isThaiLanguage ? "สถิติ" : "Statistics"}
          onPress={() => navigation.navigate("UserStatistics")}
        />
        {isAdmin && (
          <CategoryItem
            icon="manage-accounts"
            label={isThaiLanguage ? "จัดการบทความ" : "Manage Articles"}
            onPress={() => navigation.navigate("ManageArticles")}
          />
        )}
      </View>

      <SectionHeader title={isThaiLanguage ? "บทความที่น่าสนใจ" : "Interesting Articles"} />
      <View style={styles.articles}>
        {articles.map((article) => (
          <ArticleItem
            key={article.id}
            article={article}
            onPress={() =>
              navigation.navigate("ArticleDetail", { articleId: article.id })
            }
          />
        ))}
      </View>
    </ScrollView>
  );
}

const SectionHeader = React.memo(({ title }) => {
  const { isDarkTheme } = useTheme();
  return (
    <Text style={[styles.header, { color: isDarkTheme ? "#fff" : "#333" }]}>
      {title}
    </Text>
  );
});

const CategoryItem = React.memo(({ icon, label, onPress }) => {
  const { isDarkTheme } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: isDarkTheme ? "#444" : "#fff" }]}
      onPress={onPress}
    >
      <Icon name={icon} size={40} color="#ff7f50" style={styles.icon} />
      <Text style={[styles.label, { color: isDarkTheme ? "#fff" : "#555" }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

const ArticleItem = React.memo(({ article }) => {
  const { isDarkTheme } = useTheme();
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      style={[
        styles.articleItem,
        { backgroundColor: isDarkTheme ? "#444" : "#fff" },
      ]}
      onPress={() =>
        navigation.navigate("ArticleDetail", { articleId: article.id })
      }
    >
      <View style={styles.imageContainer}>
        {article.images.length === 1 ? (
          <Image
            source={{ uri: article.images[0] }}
            style={styles.fullArticleImage}
          />
        ) : (
          article.images.slice(0, 2).map((img, index) => (
            <Image
              key={index}
              source={{ uri: img }}
              style={styles.articleImage}
            />
          ))
        )}
        {article.images.length > 2 && (
          <View style={styles.moreImagesOverlay}>
            <Text style={styles.moreImagesText}>
              +{article.images.length - 2}
            </Text>
          </View>
        )}
      </View>
      <Text
        style={[styles.articleTitle, { color: isDarkTheme ? "#fff" : "#333" }]}
        numberOfLines={2}
      >
        {article.title}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontFamily: "NotoSansThai-Regular",
    fontSize: 24,
    marginVertical: 10,
    textAlign: "left",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  item: {
    width: "30%",
    alignItems: "center",
    marginVertical: 10,
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: {
    marginBottom: 5,
  },
  label: {
    fontFamily: "NotoSansThai-Regular",
    textAlign: "center",
    fontSize: 16,
  },
  articles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  articleItem: {
    width: "48%",
    marginVertical: 10,
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  imageContainer: {
    flexDirection: "row",
    position: "relative",
  },
  articleImage: {
    width: "48%",
    height: 100,
    borderRadius: 8,
    marginRight: 5,
  },
  fullArticleImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
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
    fontFamily: "NotoSansThai-Regular",
    color: "white",
  },
  articleTitle: {
    fontFamily: "NotoSansThai-Regular",
    textAlign: "center",
    fontSize: 16,
    marginTop: 5,
  },
});