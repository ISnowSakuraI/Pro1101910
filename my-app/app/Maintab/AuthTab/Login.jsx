import React, { useState, useCallback } from "react";
import {
  Text,
  View,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  StatusBar,
} from "react-native";
import { auth, db } from "../../../firebase/Firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import logo from "../../../assets/images/icon.png";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";

export default function Login({ navigation }) {
  const [input, setInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const handleLogin = useCallback(async () => {
    if (!input || !password) {
      Alert.alert(
        isThaiLanguage
          ? "โปรดใส่อีเมล/ชื่อผู้ใช้ และรหัสผ่าน"
          : "Please enter email/username and password"
      );
      return;
    }

    try {
      let emailToLogin = input;

      if (!input.includes("@")) {
        const userQuery = query(
          collection(db, "Users"),
          where("username", "==", input)
        );
        const querySnapshot = await getDocs(userQuery);

        if (querySnapshot.empty) {
          Alert.alert(
            "Error",
            isThaiLanguage ? "ไม่พบชื่อผู้ใช้ในระบบ" : "Username not found"
          );
          return;
        }

        const userDoc = querySnapshot.docs[0];
        emailToLogin = userDoc.data().email;
      }

      await signInWithEmailAndPassword(auth, emailToLogin, password);
      navigation.navigate("MainTabs");
      setInput("");
      setPassword("");
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Error",
        isThaiLanguage
          ? "โปรดใส่อีเมล/ชื่อผู้ใช้ และรหัสผ่านให้ถูกต้อง"
          : "Please enter correct email/username and password"
      );
    }
  }, [input, password, isThaiLanguage, navigation]);

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkTheme ? "#1a1a1a" : "#f0f0f0" },
      ]}
    >
      <StatusBar
        barStyle={isDarkTheme ? "light-content" : "dark-content"}
        backgroundColor={isDarkTheme ? "#1a1a1a" : "#f0f0f0"}
      />
      <TouchableOpacity
        style={styles.settingsIcon}
        onPress={() => navigation.navigate("Settings")}
      >
        <Icon name="settings" size={24} color={isDarkTheme ? "#fff" : "#333"} />
      </TouchableOpacity>
      <Image style={styles.logo} source={logo} />
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDarkTheme ? "#333" : "#fff",
            color: isDarkTheme ? "#fff" : "#000",
          },
        ]}
        placeholder={isThaiLanguage ? "อีเมล / ชื่อผู้ใช้" : "Email / Username"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={input}
        onChangeText={setInput}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={[
            styles.passwordInput,
            {
              backgroundColor: isDarkTheme ? "#333" : "#fff",
              color: isDarkTheme ? "#fff" : "#000",
            },
          ]}
          placeholder={isThaiLanguage ? "รหัสผ่าน" : "Password"}
          placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Icon
            name={showPassword ? "visibility" : "visibility-off"}
            size={24}
            color={isDarkTheme ? "#fff" : "#aaa"}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Icon name="login" size={20} color="#fff" />
        <Text style={styles.buttonText}>
          {isThaiLanguage ? "เข้าสู่ระบบ" : "Login"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={styles.forgotText}>
          {isThaiLanguage ? "ลืมรหัสผ่าน?" : "Forgot Password?"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.registerText}>
          {isThaiLanguage ? "ยังไม่มีบัญชี? " : "Don't have an account? "}
          <Text style={styles.registerHighlight}>
            {isThaiLanguage ? "สมัครสมาชิก" : "Register"}
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  settingsIcon: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 1,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    borderRadius: 12, // Increased for a more modern look
    paddingHorizontal: 15,
    marginBottom: 15,
    borderColor: "#ddd",
    borderWidth: 1,
    fontFamily: "NotoSansThai-Regular",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    borderRadius: 12, // Increased for a more modern look
    paddingHorizontal: 15,
    borderColor: "#ddd",
    borderWidth: 1,
    fontFamily: "NotoSansThai-Regular",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 50,
    backgroundColor: "#ff7f50",
    borderRadius: 12, // Increased for a more modern look
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 5,
    fontFamily: "NotoSansThai-Regular",
  },
  forgotText: {
    color: "#ff7f50",
    marginBottom: 15,
    fontFamily: "NotoSansThai-Regular",
  },
  registerText: {
    color: "#888",
    fontFamily: "NotoSansThai-Regular",
  },
  registerHighlight: {
    color: "#ff7f50",
    fontFamily: "NotoSansThai-Regular",
  },
});