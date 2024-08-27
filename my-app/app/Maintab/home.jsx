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
import { auth, db } from "../../firebase/Firebase";
import { collection, getDocs } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function Home({ navigation }) {
  const [user, setUser] = useState(null);
  const [articles, setArticles] = useState([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchArticles = async () => {
    const querySnapshot = await getDocs(collection(db, "articles"));
    const articles = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    setArticles(articles.slice(0, 4)); // Get the latest 4 articles
  };

  useFocusEffect(
    useCallback(() => {
      fetchArticles();
    }, [])
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>หมวดหมู่</Text>
      <View style={styles.grid}>
        <CategoryItem 
          image={require("../../assets/images/150.png")}
          label="จัดตารางออกกำลังกาย"
          onPress={() => navigation.navigate("Schedule")}
        />
        <CategoryItem
          image={require("../../assets/images/150.png")}
          label="บทความ"
          onPress={() => navigation.navigate("ArticleList")}
        />
        <CategoryItem
          image={require("../../assets/images/150.png")}
          label="ExerciseTracker"
          onPress={() => navigation.navigate("ExerciseTracker")}
        />
        <CategoryItem
          image={require("../../assets/images/150.png")}
          label="UserStatistics"
          onPress={() => navigation.navigate("UserStatistics")}
        />
      </View>

      <Text style={styles.header}>บทความที่น่าสนใจ</Text>
      <View style={styles.articles}>
        {articles.map((article) => (
          <ArticleItem
            key={article.id}
            article={article}
            onPress={() => navigation.navigate("ArticleDetail", { articleId: article.id })}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function CategoryItem({ image, label, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Image source={image} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

function ArticleItem({ article, onPress }) {
  const formatDate = (timestamp) => {
    const date = timestamp.toDate(); // Convert Firestore Timestamp to Date
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  };

  return (
    <TouchableOpacity style={styles.articleItem} onPress={onPress}>
      <View style={styles.imageContainer}>
        {article.images.slice(0, 2).map((img, index) => (
          <Image key={index} source={{ uri: img }} style={styles.articleImage} />
        ))}
        {article.images.length > 2 && (
          <View style={styles.moreImagesOverlay}>
            <Text style={styles.moreImagesText}>+{article.images.length - 2}</Text>
          </View>
        )}
      </View>
      <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
      <Text style={styles.articleDate}>{formatDate(article.createdAt)}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    fontFamily: 'NotoSansThai-bold',
    fontSize: 24,
    marginVertical: 10,
    color: "#333",
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
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  icon: {
    width: 75,
    height: 75,
    marginBottom: 5,
  },
  label: {
    fontFamily: 'NotoSansThai-Regular',
    textAlign: "center",
    fontSize: 16,
    color: "#555",
  },
  articles: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  articleItem: {
    width: "48%",
    marginVertical: 10,
    backgroundColor: "#fff",
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
  moreImagesOverlay: {
    position: "absolute",
    right: 5,
    bottom: 5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 5,
    padding: 5,
  },
  moreImagesText: {
    fontFamily: 'NotoSansThai-bold',
    color: "white",
  },
  articleTitle: {
    fontFamily: 'NotoSansThai-Regular',
    textAlign: "center",
    fontSize: 16,
    marginTop: 5,
    color: "#333",
  },
  articleDate: {
    fontFamily: 'NotoSansThai-Regular',
    textAlign: "center",
    fontSize: 14,
    color: "#777",
    marginTop: 5,
  },
});