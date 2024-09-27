import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { db } from '../../../../firebase/Firebase';
import { doc, getDoc } from 'firebase/firestore';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../../ThemeContext';
import { useLanguage } from '../../../LanguageContext';

export default function MenuDetail({ route, navigation }) {
  const { menuId } = route.params;
  const [menu, setMenu] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const docRef = doc(db, 'menus', menuId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMenu(data);
          setSelectedImage(data.images[0]); // Set the first image as the default selected image
        } else {
          setMenu(null);
        }
      } catch (error) {
        console.error("Error fetching menu: ", error);
      }
    };

    fetchMenu();
  }, [menuId]);

  if (!menu) {
    return (
      <View style={styles.loadingContainer}>
        <Text>{isThaiLanguage ? "ไม่พบเมนู" : "Menu not found"}</Text>
      </View>
    );
  }

  const themeStyles = isDarkTheme ? styles.dark : styles.light;

  return (
    <ScrollView style={[styles.container, themeStyles.background]}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-left" size={28} color={themeStyles.text.color} />
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setImageModalVisible(true)}>
        <Image source={{ uri: selectedImage }} style={styles.mainImage} />
      </TouchableOpacity>
      <ScrollView horizontal style={styles.thumbnailContainer}>
        {menu.images.map((img, index) => (
          <TouchableOpacity key={index} onPress={() => setSelectedImage(img)}>
            <Image source={{ uri: img }} style={styles.thumbnail} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={[styles.title, themeStyles.text]}>{menu.name}</Text>
      <Text style={[styles.description, themeStyles.subtext]}>{menu.description}</Text>
      <Text style={[styles.sectionTitle, themeStyles.text]}>
        {isThaiLanguage ? "ส่วนผสม" : "Ingredients"}
      </Text>
      {menu.ingredients.map((ingredient, index) => (
        <Text key={index} style={[styles.ingredient, themeStyles.subtext]}>
          {ingredient.name}: {ingredient.amount} {ingredient.unit}
        </Text>
      ))}
      <Text style={[styles.sectionTitle, themeStyles.text]}>
        {isThaiLanguage ? "วิธีทำ" : "Instructions"}
      </Text>
      <Text style={[styles.instructions, themeStyles.subtext]}>{menu.instructions}</Text>

      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalCloseButton} onPress={() => setImageModalVisible(false)}>
            <Icon name="close" size={30} color="#fff" />
          </TouchableOpacity>
          <Image source={{ uri: selectedImage }} style={styles.fullImage} />
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
  backButton: {
    marginBottom: 10,
  },
  mainImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
    marginBottom: 20,
  },
  thumbnailContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontFamily: 'NotoSansThai-Regular',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    fontFamily: 'NotoSansThai-Regular',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'NotoSansThai-Regular',
    marginBottom: 10,
  },
  ingredient: {
    fontSize: 16,
    fontFamily: 'NotoSansThai-Regular',
    marginBottom: 5,
  },
  instructions: {
    fontSize: 16,
    fontFamily: 'NotoSansThai-Regular',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
  },
  fullImage: {
    width: '90%',
    height: '70%',
    resizeMode: 'contain',
  },
  light: {
    background: {
      backgroundColor: '#f5f5f5',
    },
    text: {
      color: '#000',
    },
    subtext: {
      color: '#666',
    },
  },
  dark: {
    background: {
      backgroundColor: '#333',
    },
    text: {
      color: '#fff',
    },
    subtext: {
      color: '#ccc',
    },
  },
});