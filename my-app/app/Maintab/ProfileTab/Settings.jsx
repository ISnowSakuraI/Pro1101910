import React, { useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Animated,
  Platform,
  Vibration,
} from "react-native";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function Settings({ navigation }) {
  const { isDarkTheme, toggleTheme } = useTheme();
  const { isThaiLanguage, toggleLanguage } = useLanguage();
  const animatedValue = useRef(new Animated.Value(0)).current;

  const theme = isDarkTheme ? styles.dark : styles.light;

  const handleBackPress = useCallback(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
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

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Icon name="arrow-back" size={28} color={theme.textColor} />
      </TouchableOpacity>
      <Text style={[styles.header, { color: theme.textColor }]}>
        {isThaiLanguage ? "การตั้งค่า" : "Settings"}
      </Text>
      <View style={[styles.setting, { backgroundColor: theme.cardBackgroundColor }]}>
        <Text style={[styles.label, { color: theme.textColor }]}>
          {isThaiLanguage ? "ธีมมืด" : "Dark Theme"}
        </Text>
        <Switch
          value={isDarkTheme}
          onValueChange={() => handleToggleSwitch(toggleTheme)}
          trackColor={{ false: "#767577", true: theme.secondaryColor }}
          thumbColor={isDarkTheme ? theme.primaryColor : "#f4f3f4"}
          style={styles.switch}
        />
      </View>
      <View style={[styles.setting, { backgroundColor: theme.cardBackgroundColor }]}>
        <Text style={[styles.label, { color: theme.textColor }]}>
          {isThaiLanguage ? "ภาษาไทย" : "Thai Language"}
        </Text>
        <Switch
          value={isThaiLanguage}
          onValueChange={() => handleToggleSwitch(toggleLanguage)}
          trackColor={{ false: "#767577", true: theme.secondaryColor }}
          thumbColor={isThaiLanguage ? theme.primaryColor : "#f4f3f4"}
          style={styles.switch}
        />
      </View>
    </View>
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
    borderRadius: 16, // Increased for a more modern look
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 }, // Softer shadow
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
    transform: [{ scale: 1.1 }],
  },
  light: {
    primaryColor: "#ff7f50", // Coral
    secondaryColor: "#ffa07a", // Light Coral
    backgroundColor: "#f0f0f0", // Light Gray for a softer white
    textColor: "#333333", // Dark Gray for text
    cardBackgroundColor: "#ffffff", // Pure White for cards
    borderColor: "#ddd", // Light Gray for borders
  },
  dark: {
    primaryColor: "#ff7f50", // Coral
    secondaryColor: "#ffa07a", // Light Coral
    backgroundColor: "#212121", // Dark Gray for a softer black
    textColor: "#ffffff", // White for text
    cardBackgroundColor: "#2c2c2c", // Darker Gray for cards
    borderColor: "#444", // Dark Gray for borders
  },
});