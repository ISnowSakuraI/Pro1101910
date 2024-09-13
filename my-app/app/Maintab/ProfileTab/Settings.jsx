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
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkTheme ? "#121212" : "#f7f7f7" },
      ]}
    >
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Icon
          name="arrow-back"
          size={28}
          color={isDarkTheme ? "#ffffff" : "#333333"}
        />
      </TouchableOpacity>
      <Text style={[styles.header, { color: isDarkTheme ? "#ffffff" : "#333333" }]}>
        {isThaiLanguage ? "การตั้งค่า" : "Settings"}
      </Text>
      <View
        style={[
          styles.setting,
          { backgroundColor: isDarkTheme ? "#1f1f1f" : "#ffffff" },
        ]}
      >
        <Text style={[styles.label, { color: isDarkTheme ? "#ffffff" : "#333333" }]}>
          {isThaiLanguage ? "ธีมมืด" : "Dark Theme"}
        </Text>
        <Switch
          value={isDarkTheme}
          onValueChange={() => handleToggleSwitch(toggleTheme)}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isDarkTheme ? "#f5dd4b" : "#f4f3f4"}
          style={styles.switch}
        />
      </View>
      <View
        style={[
          styles.setting,
          { backgroundColor: isDarkTheme ? "#1f1f1f" : "#ffffff" },
        ]}
      >
        <Text style={[styles.label, { color: isDarkTheme ? "#ffffff" : "#333333" }]}>
          {isThaiLanguage ? "ภาษาไทย" : "Thai Language"}
        </Text>
        <Switch
          value={isThaiLanguage}
          onValueChange={() => handleToggleSwitch(toggleLanguage)}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isThaiLanguage ? "#f5dd4b" : "#f4f3f4"}
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
});