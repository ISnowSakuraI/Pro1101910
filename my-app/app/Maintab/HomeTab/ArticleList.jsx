import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useFocusEffect } from "@react-navigation/native";
import { db } from "../../../firebase/Firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export default function ArticleList({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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
      <Text style={styles.header}>บทความสุขภาพและอาหาร</Text>
      <FlatList
        data={articles}
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
    fontWeight: "bold",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
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
    fontWeight: "bold",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginVertical: 10,
  },
  description: {
    fontSize: 14,
    color: "#555",
  },
});