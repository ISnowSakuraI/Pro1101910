import React, { useRef, useCallback, useMemo, useEffect } from "react";
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

  const theme = useMemo(() => (isDarkTheme ? styles.dark : styles.light), [isDarkTheme]);

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

  return (
    <Animated.View style={[styles.container, { backgroundColor: animatedBackgroundColor }]}>
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
          trackColor={{ false: "#BBBBBB", true: theme.primaryColor }}
          thumbColor={isDarkTheme ? theme.secondaryColor : "#ff7f50"}
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
          trackColor={{ false: "#BBBBBB", true: theme.primaryColor }}
          thumbColor={isThaiLanguage ? theme.secondaryColor : "#ff7f50"}
          style={styles.switch}
        />
      </View>
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
  },
  dark: {
    primaryColor: "#F3F3F3",
    secondaryColor: "#ff7f50",
    backgroundColor: "#212121",
    textColor: "#ffffff",
    cardBackgroundColor: "#2c2c2c",
  },
});
