import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Alert,
  Modal,
  Animated,
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
import { Menu, Provider } from "react-native-paper";
import ImageViewing from "react-native-image-viewing";

const predefinedReasons = [
  { id: 1, text: "Inappropriate content" },
  { id: 2, text: "Spam" },
  { id: 3, text: "False information" },
  { id: 4, text: "Harassment" },
  { id: 5, text: "Hate speech" },
];

export default function ArticleList({ navigation }) {
  const [articles, setArticles] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState([]);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState(null);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [customReason, setCustomReason] = useState("");
  const [menuVisible, setMenuVisible] = useState({});
  const [expandedDescriptions, setExpandedDescriptions] = useState({});
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [favoriteAnimations, setFavoriteAnimations] = useState({});
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const themeStyles = isDarkTheme ? styles.dark : styles.light;

  const fetchArticles = useCallback(async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching articles: ", error);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      try {
        const q = query(
          collection(db, "favoriteArticles"),
          where("userId", "==", user.uid)
        );
        const querySnapshot = await getDocs(q);
        const favoriteIds = querySnapshot.docs.map((doc) => doc.data().articleId);
        setFavorites(favoriteIds);
      } catch (error) {
        console.error("Error fetching favorites: ", error);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchArticles();
      fetchFavorites();
    }, [fetchArticles, fetchFavorites])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchArticles();
    await fetchFavorites();
    setRefreshing(false);
  };

  const toggleFavorite = useCallback(async (articleId) => {
    const user = auth.currentUser;
    if (user) {
      try {
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

        // Animate the favorite icon
        const animation = favoriteAnimations[articleId] || new Animated.Value(1);
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1.5,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();

        setFavoriteAnimations((prev) => ({ ...prev, [articleId]: animation }));

        // Refresh articles and favorites after toggling
        await fetchArticles();
        await fetchFavorites();
      } catch (error) {
        console.error("Error toggling favorite: ", error);
      }
    }
  }, [favorites, fetchArticles, fetchFavorites, favoriteAnimations]);

  const openReportModal = (articleId) => {
    setSelectedArticleId(articleId);
    setReportModalVisible(true);
  };

  const submitReport = async () => {
    const user = auth.currentUser;
    if (user && selectedArticleId) {
      const reasons = [...predefinedReasons.filter(r => selectedReasons.includes(r.text)).map(r => r.text), customReason].filter(Boolean);
      if (reasons.length === 0) {
        Alert.alert(isThaiLanguage ? "กรุณาเลือกหรือใส่เหตุผล" : "Please select or enter a reason");
        return;
      }
      try {
        const reportDocRef = doc(db, "reports", `${user.uid}_${selectedArticleId}`);
        await setDoc(reportDocRef, { userId: user.uid, articleId: selectedArticleId, reasons }, { merge: true });
        Alert.alert(isThaiLanguage ? "รายงานสำเร็จ" : "Report Successful", isThaiLanguage ? "บทความนี้ถูกรีพอร์ตแล้ว" : "This article has been reported.");
        setReportModalVisible(false);
        setSelectedReasons([]);
        setCustomReason("");
      } catch (error) {
        console.error("Error submitting report: ", error);
      }
    }
  };

  const filteredArticles = useMemo(() => {
    return articles.filter((article) =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [articles, searchQuery]);

  const formatDate = (timestamp) => {
    const date = timestamp.toDate();
    return `${date.getDate()}/${
      date.getMonth() + 1
    }/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()} น.`;
  };

  const toggleReasonSelection = (reasonText) => {
    setSelectedReasons((prev) => 
      prev.includes(reasonText) 
        ? prev.filter(r => r !== reasonText) 
        : [...prev, reasonText]
    );
  };

  const toggleMenu = (articleId) => {
    setMenuVisible((prev) => ({
      ...prev,
      [articleId]: !prev[articleId],
    }));
  };

  const toggleDescription = (articleId) => {
    setExpandedDescriptions((prev) => ({
      ...prev,
      [articleId]: !prev[articleId],
    }));
  };

  const openImageViewer = (images) => {
    setSelectedImages(images.map((uri) => ({ uri })));
    setImageViewerVisible(true);
  };

  return (
    <Provider>
      <View
        style={[
          styles.container,
          themeStyles.background,
        ]}
      >
        <Text style={[styles.header, themeStyles.text]}>
          {isThaiLanguage ? "บทความสุขภาพและอาหาร" : "Health and Food Articles"}
        </Text>
        <TextInput
          style={[
            styles.searchInput,
            themeStyles.cardBackground,
            themeStyles.text,
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
            <View
              style={[
                styles.card,
                themeStyles.cardBackground,
              ]}
            >
              <TouchableOpacity onPress={() => openImageViewer(item.images)}>
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
              </TouchableOpacity>
              <Text
                style={[
                  styles.title,
                  themeStyles.text,
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.description,
                  { color: isDarkTheme ? "#ddd" : "#333" },
                ]}
                numberOfLines={expandedDescriptions[item.id] ? undefined : 3}
              >
                {item.description}
              </Text>
              {item.description.length > 100 && ( // Adjust the length as needed
                <TouchableOpacity onPress={() => toggleDescription(item.id)}>
                  <Text style={styles.readMoreText}>
                    {expandedDescriptions[item.id]
                      ? isThaiLanguage ? "ดูน้อยลง" : "Read Less"
                      : isThaiLanguage ? "ดูเพิ่มเติม" : "Read More"}
                  </Text>
                </TouchableOpacity>
              )}
              <View style={styles.articleInfoContainer}>
                <Text
                  style={[
                    styles.articleInfo,
                    { color: isDarkTheme ? "#aaa" : "#555" },
                  ]}
                >
                  {formatDate(item.createdAt)} {" • "}
                  {item.userName} {" • "}
                  {item.likesCount} {isThaiLanguage ? "คนถูกใจ" : "Likes"}
                </Text>
              </View>
              <View style={styles.actionButtons}>
                <Menu
                  visible={menuVisible[item.id]}
                  onDismiss={() => toggleMenu(item.id)}
                  anchor={
                    <TouchableOpacity
                      onPress={() => toggleMenu(item.id)}
                      style={styles.moreButton}
                    >
                      <Icon name="more-vert" size={24} color="gray" />
                    </TouchableOpacity>
                  }
                >
                  <Menu.Item
                    onPress={() => {
                      navigation.navigate("ArticleDetail", { articleId: item.id });
                      toggleMenu(item.id);
                    }}
                    title={isThaiLanguage ? "ดูรายละเอียด" : "View Details"}
                  />
                  <Menu.Item
                    onPress={() => {
                      openReportModal(item.id);
                      toggleMenu(item.id);
                    }}
                    title={isThaiLanguage ? "รายงาน" : "Report"}
                  />
                </Menu>
              </View>
              <TouchableOpacity
                onPress={() => toggleFavorite(item.id)}
                style={styles.favoriteButton}
              >
                <Animated.View
                  style={{
                    transform: [
                      { scale: favoriteAnimations[item.id] || new Animated.Value(1) },
                    ],
                  }}
                >
                  <Icon
                    name={
                      favorites.includes(item.id)
                        ? "favorite"
                        : "favorite-border"
                    }
                    size={24}
                    color={favorites.includes(item.id) ? "#f44336" : "gray"}
                  />
                </Animated.View>
              </TouchableOpacity>
            </View>
          )}
          numColumns={1}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
        <Modal
          visible={reportModalVisible}
          transparent={true}
          animationType="slide"
        >
          <View style={styles.modalContainer}>
            <View
              style={[
                styles.modalContent,
                themeStyles.cardBackground,
              ]}
            >
              <Text
                style={[
                  styles.modalTitle,
                  themeStyles.text,
                ]}
              >
                {isThaiLanguage
                  ? "เลือกเหตุผลในการรายงาน"
                  : "Select Report Reasons"}
              </Text>
              {predefinedReasons.map((reason) => (
                <TouchableOpacity
                  key={reason.id}
                  style={styles.reasonButton}
                  onPress={() => toggleReasonSelection(reason.text)}
                >
                  <Text
                    style={[
                      styles.reasonText,
                      themeStyles.text,
                    ]}
                  >
                    {isThaiLanguage
                      ? translateReasonToThai(reason.text)
                      : reason.text}
                  </Text>
                  {selectedReasons.includes(reason.text) && (
                    <Icon name="check" size={20} color={themeStyles.primaryColor.color} />
                  )}
                </TouchableOpacity>
              ))}
              <TextInput
                style={[
                  styles.customReasonInput,
                  themeStyles.cardBackground,
                  themeStyles.text,
                ]}
                placeholder={
                  isThaiLanguage
                    ? "หรือใส่เหตุผลของคุณเอง..."
                    : "Or enter your own reason..."
                }
                placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
                value={customReason}
                onChangeText={setCustomReason}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.submitButton, { backgroundColor: "#00A047" }]}
                  onPress={submitReport}
                >
                  <Text style={styles.submitButtonText}>
                    {isThaiLanguage ? "ส่ง" : "Submit"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelButton, { backgroundColor: "#f44336" }]}
                  onPress={() => setReportModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>
                    {isThaiLanguage ? "ยกเลิก" : "Cancel"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        <ImageViewing
          images={selectedImages}
          imageIndex={0}
          visible={imageViewerVisible}
          onRequestClose={() => setImageViewerVisible(false)}
        />
      </View>
    </Provider>
  );
}

const translateReasonToThai = (reason) => {
  switch (reason) {
    case "Inappropriate content":
      return "เนื้อหาไม่เหมาะสม";
    case "Spam":
      return "สแปม";
    case "False information":
      return "ข้อมูลเท็จ";
    case "Harassment":
      return "การล่วงละเมิด";
    case "Hate speech":
      return "คำพูดเกลียดชัง";
    default:
      return reason;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  toolbar: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "#008AFF",
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
    position: "relative",
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
  readMoreText: {
    color: "#2196F3",
    fontFamily: "NotoSansThai-Regular",
    marginTop: 5,
  },
  articleInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  articleInfo: {
    fontSize: 12,
  },
  likesText: {
    fontFamily: "NotoSansThai-Regular",
    fontSize: 12,
  },
  actionButtons: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
  },
  favoriteButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },
  moreButton: {
    marginLeft: 10,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 20,
  },
  reasonButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  reasonText: {
    fontSize: 16,
    fontFamily: "NotoSansThai-Regular",
  },
  customReasonInput: {
    width: "100%",
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginTop: 10,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  submitButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginRight: 5,
  },
  submitButtonText: {
    color: "white",
    fontFamily: "NotoSansThai-Regular",
  },
  cancelButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginLeft: 5,
  },
  cancelButtonText: {
    color: "white",
    fontFamily: "NotoSansThai-Regular",
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
    primaryColor: {
      color: "#ff7f50",
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
    primaryColor: {
      color: "#ff7f50",
    },
  },
});