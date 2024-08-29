import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, FlatList, TouchableOpacity, Modal } from 'react-native';
import { db, auth } from '../../../../firebase/Firebase';
import { doc, getDoc, collection, query, where, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../../../ThemeContext';
import { useLanguage } from '../../../LanguageContext';

export default function ArticleDetail({ route, navigation }) {
  const { articleId } = route.params;
  const [article, setArticle] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  useEffect(() => {
    const fetchArticle = async () => {
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
    };

    const fetchLikes = async () => {
      const likesQuery = query(collection(db, 'favoriteArticles'), where('articleId', '==', articleId));
      const likesSnapshot = await getDocs(likesQuery);
      setLikesCount(likesSnapshot.size);

      const user = auth.currentUser;
      if (user) {
        const userLikeQuery = query(collection(db, 'favoriteArticles'), where('articleId', '==', articleId), where('userId', '==', user.uid));
        const userLikeSnapshot = await getDocs(userLikeQuery);
        setIsLiked(!userLikeSnapshot.empty);
      }
    };

    fetchArticle();
    fetchLikes();
  }, [articleId]);

  const openImageModal = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  const formatDate = (timestamp) => {
    const date = timestamp.toDate();
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()} น.`;
  };

  const toggleFavorite = async () => {
    const user = auth.currentUser;
    if (user) {
      const favoriteDocRef = doc(db, 'favoriteArticles', `${user.uid}_${articleId}`);
      if (isLiked) {
        // Remove from favorites
        await deleteDoc(favoriteDocRef);
        setLikesCount(likesCount - 1);
      } else {
        // Add to favorites
        await setDoc(favoriteDocRef, { userId: user.uid, articleId });
        setLikesCount(likesCount + 1);
      }
      setIsLiked(!isLiked);
    }
  };

  if (!article) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>{isThaiLanguage ? "กำลังโหลด..." : "Loading..."}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: isDarkTheme ? '#333' : '#f5f5f5' }]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color={isDarkTheme ? "#fff" : "#000"} />
      </TouchableOpacity>
      <FlatList
        data={article.images}
        horizontal
        renderItem={({ item: image }) => (
          <TouchableOpacity onPress={() => openImageModal(image)}>
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
        <Icon name="favorite" size={16} color="red" />
        <Text style={[styles.likesText, { color: isDarkTheme ? '#aaa' : '#777' }]}>{likesCount} {isThaiLanguage ? "ถูกใจ" : "Likes"}</Text>
      </View>
      <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
        <Icon name={isLiked ? "favorite" : "favorite-border"} size={24} color={isLiked ? "red" : "gray"} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
            <Icon name="close" size={30} color="white" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={styles.fullImage} />
          )}
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
    fontFamily: 'NotoSansThai-Regular',
    fontSize: 16,
    color: '#777',
  },
  backButton: {
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'NotoSansThai-Regular',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  image: {
    width: 100,
    height: 100,
    marginRight: 10,
    borderRadius: 10,
  },
  description: {
    fontSize: 16,
    fontFamily: 'NotoSansThai-Regular',
    marginTop: 20,
  },
  author: {
    fontSize: 14,
    fontFamily: 'NotoSansThai-Regular',
    marginTop: 10,
  },
  date: {
    fontSize: 14,
    fontFamily: 'NotoSansThai-Regular',
    marginTop: 5,
  },
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  likesText: {
    fontSize: 14,
    fontFamily: 'NotoSansThai-Regular',
    marginLeft: 5,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  fullImage: {
    width: '90%',
    height: '70%',
    borderRadius: 10,
  },
});