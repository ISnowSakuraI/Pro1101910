import React, { useState, useCallback } from "react";
import {
  Text,
  View,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { auth } from "../../../firebase/Firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const handleResetPassword = useCallback(async () => {
    if (!email) {
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage
          ? "โปรดใส่อีเมลที่คุณใช้สมัครสมาชิก"
          : "Please enter the email you registered with"
      );
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage
          ? "รูปแบบอีเมลไม่ถูกต้อง"
          : "Invalid email format"
      );
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        isThaiLanguage ? "สำเร็จ" : "Success",
        isThaiLanguage
          ? "อีเมลรีเซ็ตรหัสผ่านถูกส่งไปที่อีเมลของคุณแล้ว"
          : "Password reset email has been sent to your email"
      );
      setRequestSent(true);
    } catch (error) {
      console.error(error);
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage
          ? "เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน"
          : "An error occurred while sending the password reset email"
      );
    }
  }, [email, isThaiLanguage]);

  const handleResendRequest = useCallback(() => {
    setRequestSent(false);
    Alert.alert(
      isThaiLanguage ? "ข้อมูล" : "Info",
      isThaiLanguage
        ? "คุณสามารถส่งคำขอเปลี่ยนรหัสผ่านอีกครั้ง"
        : "You can send the password reset request again"
    );
  }, [isThaiLanguage]);

  const themeStyles = isDarkTheme ? styles.dark : styles.light;

  return (
    <View style={[styles.container, themeStyles.background]}>
      <Text style={[styles.title, themeStyles.text]}>
        {isThaiLanguage ? "ลืมรหัสผ่าน?" : "Forgot Password?"}
      </Text>
      <TextInput
        style={[styles.input, themeStyles.inputBackground]}
        placeholder={isThaiLanguage ? "อีเมล" : "Email"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TouchableOpacity
        style={styles.button}
        onPress={handleResetPassword}
        activeOpacity={0.8}
      >
        <Icon name="email" size={20} color="white" />
        <Text style={styles.buttonText}>
          {isThaiLanguage ? "รีเซ็ตรหัสผ่าน" : "Reset Password"}
        </Text>
      </TouchableOpacity>
      {requestSent && (
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendRequest}
          activeOpacity={0.8}
        >
          <Text style={styles.resendButtonText}>
            {isThaiLanguage ? "ส่งคำขออีกครั้ง" : "Send Request Again"}
          </Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
        <Text style={styles.loginText}>
          {isThaiLanguage ? "กลับไปที่ " : "Already have an account? "}
          <Text style={styles.loginLink}>
            {isThaiLanguage ? "เข้าสู่ระบบ" : "Login"}
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
  input: {
    fontFamily: "NotoSansThai-Regular",
    width: "100%",
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 50,
    backgroundColor: "#ff7f50",
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "NotoSansThai-Regular",
    marginLeft: 5,
  },
  title: {
    fontSize: 24,
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 20,
  },
  loginText: {
    color: "#888",
    fontFamily: "NotoSansThai-Regular",
  },
  loginLink: {
    color: "#ff7f50",
    fontFamily: "NotoSansThai-Regular",
  },
  resendButton: {
    marginTop: 10,
  },
  resendButtonText: {
    color: "#ff7f50",
    fontFamily: "NotoSansThai-Regular",
  },
  light: {
    background: {
      backgroundColor: "#f0f0f0",
    },
    text: {
      color: "#333333",
    },
    inputBackground: {
      backgroundColor: "#ffffff",
      color: "#333333",
    },
  },
  dark: {
    background: {
      backgroundColor: "#212121",
    },
    text: {
      color: "#ffffff",
    },
    inputBackground: {
      backgroundColor: "#2c2c2c",
      color: "#ffffff",
    },
  },
});
