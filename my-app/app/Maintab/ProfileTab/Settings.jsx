import React from "react";
import { View, Text, StyleSheet, Switch, TouchableOpacity } from "react-native";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import Icon from "react-native-vector-icons/MaterialIcons";

export default function Settings({ navigation }) {
  const { isDarkTheme, toggleTheme } = useTheme();
  const { isThaiLanguage, toggleLanguage } = useLanguage();

  return (
    <View style={[styles.container, { backgroundColor: isDarkTheme ? "#333" : "#f5f5f5" }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={isDarkTheme ? "white" : "black"} />
      </TouchableOpacity>
      <Text style={[styles.header, { color: isDarkTheme ? "white" : "black" }]}>
        {isThaiLanguage ? "การตั้งค่า" : "Settings"}
      </Text>
      <View style={[styles.setting, { backgroundColor: isDarkTheme ? "#444" : "#fff" }]}>
        <Text style={[styles.label, { color: isDarkTheme ? "white" : "black" }]}>
          {isThaiLanguage ? "ธีมมืด" : "Dark Theme"}
        </Text>
        <Switch value={isDarkTheme} onValueChange={toggleTheme} />
      </View>
      <View style={[styles.setting, { backgroundColor: isDarkTheme ? "#444" : "#fff" }]}>
        <Text style={[styles.label, { color: isDarkTheme ? "white" : "black" }]}>
          {isThaiLanguage ? "ภาษาไทย" : "Thai Language"}
        </Text>
        <Switch value={isThaiLanguage} onValueChange={toggleLanguage} />
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
    fontSize: 24,
    textAlign: "center",
    marginVertical: 20,
    fontFamily: "NotoSansThai-Regular",
  },
  setting: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 10,
    padding: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontSize: 18,
    fontFamily: "NotoSansThai-Regular",
  },
  backButton: {
    marginBottom: 10,
  },
});