import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity, Modal, Alert, TextInput, ActivityIndicator } from 'react-native';
import { db, auth } from '../../../../firebase/Firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../ThemeContext';
import { useLanguage } from '../../../LanguageContext';

const predefinedReasons = [
  { id: 1, text: "Inappropriate content" },
  { id: 2, text: "Spam" },
  { id: 3, text: "False information" },
  { id: 4, text: "Harassment" },
  { id: 5, text: "Hate speech" },
];

export default function ArticleDetail({ route, navigation }) {
  const { articleId } = route.params;
  const [article, setArticle] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedReasons, setSelectedReasons] = useState([]);
  const [customReason, setCustomReason] = useState("");
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const docRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const userDoc = await getDoc(doc(db, 'Users', data.userId));
          const userName = userDoc.exists() ? userDoc.data().username : 'Unknown';
          setArticle({ ...data, userName });
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error("Error fetching article: ", error);
      }
    };

    const fetchLikes = async () => {
      try {
        const likesQuery = query(collection(db, 'favoriteArticles'), where('articleId', '==', articleId));
        const likesSnapshot = await getDocs(likesQuery);
        setLikesCount(likesSnapshot.size);

        const user = auth.currentUser;
        if (user) {
          const userLikeQuery = query(collection(db, 'favoriteArticles'), where('articleId', '==', articleId), where('userId', '==', user.uid));
          const userLikeSnapshot = await getDocs(userLikeQuery);
          setIsLiked(!userLikeSnapshot.empty);
        }
      } catch (error) {
        console.error("Error fetching likes: ", error);
      }
    };

    fetchArticle();
    fetchLikes();
  }, [articleId]);

  const openImageModal = useCallback((image) => {
    setSelectedImage(image);
    setModalVisible(true);
  }, []);

  const formatDate = (timestamp) => {
    const date = timestamp.toDate();
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()} ${isThaiLanguage ? 'น.' : 'PM'}`;
  };

  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (user) {
      const favoriteDocRef = doc(db, 'favoriteArticles', `${user.uid}_${articleId}`);
      try {
        if (isLiked) {
          await deleteDoc(favoriteDocRef);
          setLikesCount(likesCount - 1);
        } else {
          await setDoc(favoriteDocRef, { userId: user.uid, articleId });
          setLikesCount(likesCount + 1);
        }
        setIsLiked(!isLiked);
      } catch (error) {
        console.error("Error toggling favorite: ", error);
      }
    }
  };

  const openReportModal = () => {
    setReportModalVisible(true);
  };

  const toggleReasonSelection = (reasonText) => {
    setSelectedReasons((prev) =>
      prev.includes(reasonText)
        ? prev.filter((r) => r !== reasonText)
        : [...prev, reasonText]
    );
  };

  const submitReport = async () => {
    const user = auth.currentUser;
    if (user) {
      const reasons = [...predefinedReasons.filter(r => selectedReasons.includes(r.text)).map(r => r.text), customReason].filter(Boolean);
      if (reasons.length === 0) {
        Alert.alert(isThaiLanguage ? "กรุณาเลือกหรือใส่เหตุผล" : "Please select or enter a reason");
        return;
      }
      try {
        const reportDocRef = doc(db, "reports", `${user.uid}_${articleId}`);
        await setDoc(reportDocRef, { userId: user.uid, articleId, reasons }, { merge: true });
        Alert.alert(isThaiLanguage ? "รายงานสำเร็จ" : "Report Successful", isThaiLanguage ? "บทความนี้ถูกรีพอร์ตแล้ว" : "This article has been reported.");
        setReportModalVisible(false);
        setSelectedReasons([]);
        setCustomReason("");
      } catch (error) {
        console.error("Error submitting report: ", error);
      }
    }
  };

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

  if (!article) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDarkTheme ? '#fff' : '#000'} />
        <Text style={[styles.loadingText, { color: isDarkTheme ? '#fff' : '#000' }]}>{isThaiLanguage ? "กำลังโหลด..." : "Loading..."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkTheme ? '#333' : '#f5f5f5' }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={28} color={isDarkTheme ? "#fff" : "#000"} />
      </TouchableOpacity>
      <FlatList
        data={article.images}
        horizontal
        renderItem={({ item: image }) => (
          <TouchableOpacity onPress={() => openImageModal(image)} style={styles.imageWrapper}>
            <Image source={{ uri: image }} style={styles.image} />
          </TouchableOpacity>
        )}
        keyExtractor={(image, index) => index.toString()}
        showsHorizontalScrollIndicator={false}
      />
      <Text style={[styles.title, { color: isDarkTheme ? '#fff' : '#333' }]}>{article.title}</Text>
      <Text style={[styles.description, { color: isDarkTheme ? '#ccc' : '#555' }]}>{article.description}</Text>
      <Text style={[styles.author, { color: isDarkTheme ? '#aaa' : '#777' }]}>{isThaiLanguage ? "โพสโดย" : "Posted by"}: {article.userName}</Text>
      <Text style={[styles.date, { color: isDarkTheme ? '#aaa' : '#777' }]}>{isThaiLanguage ? "วันที่" : "Date"}: {formatDate(article.createdAt)}</Text>
      <View style={styles.likesContainer}>
        <Icon name="heart" size={20} color="red" />
        <Text style={[styles.likesText, { color: isDarkTheme ? '#aaa' : '#777' }]}>{likesCount} {isThaiLanguage ? "ถูกใจ" : "Likes"}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity onPress={toggleFavorite} style={[styles.favoriteButton, { backgroundColor: isLiked ? '#ff4d4d' : '#eee' }]}>
          <Icon name={isLiked ? "heart" : "heart-outline"} size={28} color={isLiked ? "#fff" : "#777"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={openReportModal} style={styles.reportButton}>
          <Icon name="alert-circle-outline" size={28} color="orange" />
        </TouchableOpacity>
      </View>

      <Modal visible={modalVisible} transparent={true}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Icon name="close" size={28} color={isDarkTheme ? '#fff' : '#000'} />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullImage} />
          )}
        </View>
      </Modal>

      <Modal visible={reportModalVisible} transparent={true} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: isDarkTheme ? "#333" : "#fff" }]}>
            <Text style={[styles.modalTitle, { color: isDarkTheme ? "#fff" : "#000" }]}>
              {isThaiLanguage ? "เลือกเหตุผลในการรายงาน" : "Select Report Reasons"}
            </Text>
            {predefinedReasons.map((reason) => (
              <TouchableOpacity key={reason.id} style={styles.reasonButton} onPress={() => toggleReasonSelection(reason.text)}>
                <Text style={[styles.reasonText, { color: isDarkTheme ? "#fff" : "#000" }]}>
                  {isThaiLanguage ? translateReasonToThai(reason.text) : reason.text}
                </Text>
                {selectedReasons.includes(reason.text) && (
                  <Icon name="check" size={20} color="green" />
                )}
              </TouchableOpacity>
            ))}
            <TextInput
              style={[styles.customReasonInput, { backgroundColor: isDarkTheme ? "#444" : "#fff", color: isDarkTheme ? "#fff" : "#000" }]}
              placeholder={isThaiLanguage ? "หรือใส่เหตุผลของคุณเอง..." : "Or enter your own reason..."}
              placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
              value={customReason}
              onChangeText={setCustomReason}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.submitButton} onPress={submitReport}>
                <Text style={styles.submitButtonText}>{isThaiLanguage ? "ส่ง" : "Submit"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setReportModalVisible(false)}>
                <Text style={styles.cancelButtonText}>{isThaiLanguage ? "ยกเลิก" : "Cancel"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  backButton: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  imageWrapper: {
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  description: {
    fontSize: 16,
    marginTop: 20,
  },
  author: {
    fontSize: 14,
    marginTop: 10,
  },
  date: {
    fontSize: 14,
    marginTop: 5,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  likesText: {
    fontSize: 14,
    marginLeft: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  favoriteButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  reportButton: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 5,
    marginLeft: 5,
    backgroundColor: '#eee',
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
  },
  customReasonInput: {
    width: "100%",
    height: 40,
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
    backgroundColor: "#4CAF50",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginRight: 5,
  },
  submitButtonText: {
    color: "white",
  },
  cancelButton: {
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    alignItems: "center",
    marginLeft: 5,
  },
  cancelButtonText: {
    color: "white",
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  fullImage: {
    width: '90%',
    height: '70%',
    borderRadius: 10,
  },
});