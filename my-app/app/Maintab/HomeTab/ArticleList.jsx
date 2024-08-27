import React, { useState, useEffect, useCallback } from "react";
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
import { db } from "../../../firebase/Firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function ArticleList({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchArticles = async () => {
    const q = query(collection(db, "articles"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const articles = querySnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));
    setArticles(articles);
  };

  useFocusEffect(
    useCallback(() => {
      fetchArticles();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchArticles();
    setRefreshing(false);
  };

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (timestamp) => {
    const date = timestamp.toDate(); // Convert Firestore Timestamp to Date
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => navigation.navigate("AddArticle")}
        >
          <Icon name="add-circle-outline" size={24} color="white" />
          <Text style={styles.toolbarButtonText}>เพิ่มบทความ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.toolbarButton}
          onPress={() => navigation.navigate("ManageMyArticles")}
        >
          <Icon name="manage-accounts" size={24} color="white" />
          <Text style={styles.toolbarButtonText}>จัดการบทความของฉัน</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="ค้นหาบทความ..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <Text style={styles.header}>บทความสุขภาพและอาหาร</Text>
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("ArticleDetail", { articleId: item.id })
            }
          >
            <View style={styles.card}>
              <View style={styles.imageContainer}>
                {item.images.slice(0, 4).map((image, index) => (
                  <Image
                    key={index}
                    source={{ uri: image }}
                    style={styles.image}
                    resizeMode="cover"
                  />
                ))}
                {item.images.length > 4 && (
                  <View style={styles.moreImagesOverlay}>
                    <Text style={styles.moreImagesText}>
                      +{item.images.length - 4}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description} numberOfLines={3}>
                {item.description}
              </Text>
              <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
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
    backgroundColor: "#f5f5f5",
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    fontFamily: 'NotoSansThai-Regular',
  },
  searchInput: {
    fontFamily: 'NotoSansThai-Regular',
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    backgroundColor: "#fff",
  },
  header: {
    fontFamily: 'NotoSansThai-Regular',
    fontSize: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    marginBottom: 20,
    backgroundColor: "white",
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
    fontFamily: 'NotoSansThai-Regular',
  },
  title: {
    fontFamily: 'NotoSansThai-Regular',
    fontSize: 16,
    marginVertical: 10,
  },
  description: {
    fontFamily: 'NotoSansThai-Regular',
    fontSize: 14,
    color: "#555",
  },
  date: {
    fontFamily: 'NotoSansThai-Regular',
    fontSize: 12,
    color: "#777",
    marginTop: 5,
  },
});