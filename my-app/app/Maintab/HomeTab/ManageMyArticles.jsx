import React, { useState, useEffect } from "react";
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
import { db, auth } from "../../../firebase/Firebase";
import { collection, query, where, getDocs, deleteDoc, doc, orderBy } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function ManageMyArticles({ navigation }) {
  const [myArticles, setMyArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchMyArticles = async () => {
      const user = auth.currentUser;
      if (user) {
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
      }
    };
    fetchMyArticles();
  }, []);

  const handleDeleteArticle = async (articleId) => {
    try {
      await deleteDoc(doc(db, "articles", articleId));
      setMyArticles(myArticles.filter(article => article.id !== articleId));
      Alert.alert("Success", "Article deleted successfully!");
    } catch (error) {
      console.error("Error deleting article: ", error);
      Alert.alert("Error", "Failed to delete article. Please try again.");
    }
  };

  const filteredArticles = myArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      <Text style={styles.header}>จัดการบทความของฉัน</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="ค้นหาบทความ..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.imageContainer}>
              {item.images.slice(0, 3).map((image, index) => (
                <Image key={index} source={{ uri: image }} style={styles.articleImage} />
              ))}
              {item.images.length > 3 && (
                <View style={styles.moreImagesOverlay}>
                  <Text style={styles.moreImagesText}>
                    +{item.images.length - 3}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description} numberOfLines={3}>
              {item.description}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => navigation.navigate("EditArticle", { articleId: item.id })}
              >
                <Icon name="edit" size={20} color="white" />
                <Text style={styles.buttonText}>แก้ไข</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteArticle(item.id)}
              >
                <Icon name="delete" size={20} color="white" />
                <Text style={styles.buttonText}>ลบ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  backButton: {
    marginBottom: 10,
  },
  header: {
    fontSize: 24,
    fontFamily: 'NotoSansThai-Regular',
    marginBottom: 20,
    color: "#333",
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
  card: {
    marginBottom: 10,
    padding: 15,
    backgroundColor: "white",
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
    fontFamily: 'NotoSansThai-Regular',
  },
  title: {
    fontSize: 16,
    fontFamily: 'NotoSansThai-Regular',
    marginVertical: 10,
  },
  description: {
    fontFamily: 'NotoSansThai-Regular',
    fontSize: 14,
    color: "#555",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: "white",
    marginLeft: 5,
    fontFamily: 'NotoSansThai-Regular',
  },
});