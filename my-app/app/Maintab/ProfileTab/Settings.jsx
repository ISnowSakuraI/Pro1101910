import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
  Image,
  Switch,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import Icon from "react-native-vector-icons/MaterialIcons";
import Modal from "react-native-modal";

// ภาพธง
import englishFlag from "../../../assets/images/englishFlag.png";
import thaiFlag from "../../../assets/images/thaiFlag.png";

export default function Settings({ navigation }) {
  const { isDarkTheme, toggleTheme } = useTheme();
  const { isThaiLanguage, toggleLanguage } = useLanguage();
  const animatedValue = useRef(new Animated.Value(0)).current;

  const [isModalVisible, setModalVisible] = useState(false);

  const theme = useMemo(
    () => (isDarkTheme ? styles.dark : styles.light),
    [isDarkTheme]
  );

  // Animate background color on mount
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false, // Not using native driver for background color animation
    }).start();
  }, [animatedValue]);

  const handleBackPress = useCallback(() => {
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
      animatedValue.setValue(0);
    });
  }, [navigation, animatedValue]);

  const handleToggleSwitch = useCallback((toggleFunction) => {
    Vibration.vibrate(Platform.OS === "ios" ? 10 : 50); // Haptic feedback
    toggleFunction();
  }, []);

  const animatedBackgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.backgroundColor, theme.backgroundColor],
  });

  const languageOptions = [
    {
      label: (
        <View style={styles.languageOption}>
          <Image source={englishFlag} style={styles.flag} />
          <Text style={[styles.languageText, { color: theme.textColor }]}>
            English
          </Text>
        </View>
      ),
      value: "en",
    },
    {
      label: (
        <View style={styles.languageOption}>
          <Image source={thaiFlag} style={styles.flag} />
          <Text style={[styles.languageText, { color: theme.textColor }]}>
            ไทย
          </Text>
        </View>
      ),
      value: "th",
    },
  ];

  return (
    <Animated.View
      style={[styles.container, { backgroundColor: animatedBackgroundColor }]}
    >
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Icon name="arrow-back" size={28} color={theme.textColor} />
      </TouchableOpacity>
      <Text style={[styles.header, { color: theme.textColor }]}>
        {isThaiLanguage ? "การตั้งค่า" : "Settings"}
      </Text>
      <View
        style={[styles.setting, { backgroundColor: theme.cardBackgroundColor }]}
      >
        <Text style={[styles.label, { color: theme.textColor }]}>
          {isThaiLanguage ? "ธีมมืด" : "Dark Theme"}
        </Text>
        <Switch
          value={isDarkTheme}
          onValueChange={() => handleToggleSwitch(toggleTheme)}
          trackColor={{ false: "#BBBBBB", true: theme.primaryColor }}
          thumbColor={isDarkTheme ? theme.secondaryColor : "#ff7f50"}
          style={styles.switch}
        />
      </View>

      <View
        style={[styles.setting, { backgroundColor: theme.cardBackgroundColor }]}
      >
        <Text style={[styles.label, { color: theme.textColor }]}>
          {isThaiLanguage ? "เลือกภาษา" : "Select Language"}
        </Text>

        <TouchableOpacity
          style={[
            styles.languageButton,
            {
              backgroundColor: theme.cardBackgroundColor,
              borderColor: theme.borderColor,
            },
          ]} // ปรับพื้นหลังและขอบให้เหมาะสม
          onPress={() => setModalVisible(true)} // เปิด modal เมื่อคลิก
        >
          <View style={styles.languageOption}>
            <Image
              source={isThaiLanguage ? thaiFlag : englishFlag}
              style={styles.flag}
            />
            <Text style={[styles.languageText, { color: theme.textColor }]}>
              {isThaiLanguage ? "ไทย" : "English"}
            </Text>
          </View>
          <Icon name="arrow-drop-down" size={28} color={theme.textColor} />
        </TouchableOpacity>
      </View>

      {/* Modal สำหรับแสดงรายการภาษา */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)} // เมื่อคลิกด้านนอกให้ปิด modal
        animationIn="slideInUp"
        animationOut="slideOutDown"
        backdropColor="rgba(0, 0, 0, 0.5)"
        backdropOpacity={0.5}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: theme.cardBackgroundColor },
          ]}
        >
          {languageOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.languageOption,
                { backgroundColor: theme.cardBackgroundColor },
              ]} // ปรับพื้นหลังให้เหมาะสม
              onPress={() => {
                toggleLanguage(option.value); // เปลี่ยนภาษา
                setModalVisible(false); // ปิด modal
              }}
            >
              <Image
                source={option.value === "en" ? englishFlag : thaiFlag}
                style={styles.flag}
              />
              <Text style={[styles.languageText, { color: theme.textColor }]}>
                {option.value === "en" ? "English" : "ไทย"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
  },
  header: {
    fontSize: 30,
    textAlign: "center",
    marginBottom: 40,
    fontFamily: "NotoSansThai-Regular",
  },
  setting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  label: {
    fontSize: 18,
    fontFamily: "NotoSansThai-Regular",
  },
  backButton: {
    marginBottom: 20,
  },
  switch: {
    transform: [{ scale: 1.2 }],
  },
  light: {
    primaryColor: "#F3F3F3", // Primary color for light theme
    secondaryColor: "#ff7f50", // Secondary color for light theme
    backgroundColor: "#f0f0f0",
    textColor: "#333333",
    cardBackgroundColor: "#ffffff",
    borderColor: "#ddd", // Border color for light theme
  },
  dark: {
    primaryColor: "#F3F3F3",
    secondaryColor: "#ff7f50",
    backgroundColor: "#212121",
    textColor: "#ffffff",
    cardBackgroundColor: "#2c2c2c",
    borderColor: "#444", // Border color for dark theme
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#f8f8f8", // หรือใช้ theme.cardBackgroundColor
  },
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  flag: {
    width: 30, // ขนาดธงที่ใหญ่ขึ้น
    height: 30,
    marginRight: 10,
    borderRadius: 5, // ให้มุมโค้งมน
  },
  languageText: {
    fontSize: 18,
    fontFamily: "NotoSansThai-Regular",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
  },
});
