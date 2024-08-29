import React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity, Animated } from "react-native";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function Settings({ navigation }) {
  const { isDarkTheme, toggleTheme } = useTheme();
  const { isThaiLanguage, toggleLanguage } = useLanguage();
  const animatedValue = new Animated.Value(0);

  const handleBackPress = () => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      navigation.goBack();
      animatedValue.setValue(0);
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkTheme ? "#1e1e1e" : "#f0f0f0" }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={handleBackPress}
      >
        <Animated.View style={{ transform: [{ scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.2]
        }) }] }}>
          <Icon name="arrow-back" size={28} color={isDarkTheme ? "#fff" : "#000"} />
        </Animated.View>
      </TouchableOpacity>
      <Text style={[styles.header, { color: isDarkTheme ? "#fff" : "#000" }]}>
        {isThaiLanguage ? "การตั้งค่า" : "Settings"}
      </Text>
      <View style={[styles.setting, { backgroundColor: isDarkTheme ? "#2c2c2c" : "#fff" }]}>
        <Text style={[styles.label, { color: isDarkTheme ? "#fff" : "#000" }]}>
          {isThaiLanguage ? "ธีมมืด" : "Dark Theme"}
        </Text>
        <Switch
          value={isDarkTheme}
          onValueChange={toggleTheme}
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isDarkTheme ? "#f5dd4b" : "#f4f3f4"}
          style={styles.switch}
        />
      </View>
      <View style={[styles.setting, { backgroundColor: isDarkTheme ? "#2c2c2c" : "#fff" }]}>
        <Text style={[styles.label, { color: isDarkTheme ? "#fff" : "#000" }]}>
          {isThaiLanguage ? "ภาษาไทย" : "Thai Language"}
        </Text>
        <Switch
          value={isThaiLanguage}
          onValueChange={toggleLanguage}
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
  },
  header: {
    fontSize: 26,
    textAlign: "center",
    marginVertical: 30,
    fontFamily: "NotoSansThai-Regular",
  },
  setting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 15,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  label: {
    fontSize: 20,
    fontFamily: "NotoSansThai-Regular",
  },
  backButton: {
    marginBottom: 20,
  },
  switch: {
    transform: [{ scale: 1.1 }],
  },
});