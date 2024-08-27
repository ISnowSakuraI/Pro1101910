import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Image, TouchableOpacity, Alert, Modal, ScrollView } from 'react-native';
import { db, storage } from '../../../firebase/Firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

export default function EditArticle({ route, navigation }) {
  const { articleId } = route.params;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchArticle = async () => {
      const docRef = doc(db, 'articles', articleId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title);
        setDescription(data.description);
        setImages(data.images || []);
      } else {
        console.log('No such document!');
      }
    };
    fetchArticle();
  }, [articleId]);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const newImageUri = result.assets[0].uri;
      setImages([...images, newImageUri]);
    }
  };

  const handleDeleteImage = async (imageUri) => {
    setImages(images.filter(img => img !== imageUri));
    const imageRef = ref(storage, imageUri);
    try {
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image: ', error);
    }
  };

  const handleUpdateArticle = async () => {
    const imageUrls = [];
    for (const image of images) {
      if (image.startsWith('http')) {
        imageUrls.push(image);
      } else {
        try {
          const response = await fetch(image);
          const blob = await response.blob();
          const storageRef = ref(storage, `articles/${auth.currentUser.uid}/${Date.now()}`);
          await uploadBytes(storageRef, blob);
          const imageUrl = await getDownloadURL(storageRef);
          imageUrls.push(imageUrl);
        } catch (error) {
          console.error('Error uploading image: ', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
          return;
        }
      }
    }

    try {
      await updateDoc(doc(db, 'articles', articleId), {
        title,
        description,
        images: imageUrls,
      });
      Alert.alert('Success', 'Article updated successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error updating article: ', error);
      Alert.alert('Error', 'Failed to update article. Please try again.');
    }
  };

  const openImageModal = (image) => {
    setSelectedImage(image);
    setModalVisible(true);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Edit Article</Text>
      <TouchableOpacity onPress={pickImage} style={styles.addImageButton}>
        <Text style={styles.addImageText}>Add Images</Text>
      </TouchableOpacity>
      <View style={styles.imageContainer}>
        {images.map((img, index) => (
          <View key={index} style={styles.imageWrapper}>
            <TouchableOpacity onPress={() => openImageModal(img)}>
              <Image source={{ uri: img }} style={styles.image} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDeleteImage(img)} style={styles.deleteIcon}>
              <Icon name="delete" size={20} color="red" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TextInput
        style={styles.titleInput}
        value={title}
        onChangeText={setTitle}
        placeholder="Article Title"
        multiline
      />
      <TextInput
        style={styles.descriptionInput}
        value={description}
        onChangeText={setDescription}
        placeholder="Description"
        multiline
      />
      <TouchableOpacity onPress={handleUpdateArticle} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>SAVE</Text>
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
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  titleInput: {
    minHeight: 60,
    maxHeight: 120,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    fontSize: 18,
    textAlignVertical: 'top',
  },
  descriptionInput: {
    minHeight: 100,
    maxHeight: 200,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 5,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  deleteIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 2,
  },
  addImageButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  addImageText: {
    color: 'white',
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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