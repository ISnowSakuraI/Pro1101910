import React from "react";
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
  const [email, setEmail] = React.useState("");
  const [requestSent, setRequestSent] = React.useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage
          ? "โปรดใส่อีเมลที่คุณใช้สมัครสมาชิก"
          : "Please enter the email you registered with"
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
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage
          ? "เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน"
          : "An error occurred while sending the password reset email"
      );
      console.error(error);
    }
  };

  const handleResendRequest = () => {
    setRequestSent(false);
    Alert.alert(
      isThaiLanguage ? "ข้อมูล" : "Info",
      isThaiLanguage
        ? "คุณสามารถส่งคำขอเปลี่ยนรหัสผ่านอีกครั้ง"
        : "You can send the password reset request again"
    );
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkTheme ? "#333" : "#f5f5f5" },
      ]}
    >
      <Text style={[styles.title, { color: isDarkTheme ? "#fff" : "#333" }]}>
        {isThaiLanguage ? "ลืมรหัสผ่าน?" : "Forgot Password?"}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDarkTheme ? "#555" : "#fff",
            color: isDarkTheme ? "#fff" : "#000",
          },
        ]}
        placeholder={isThaiLanguage ? "อีเมล" : "Email"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={email}
        onChange={(e) => setEmail(e.nativeEvent.text)}
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
          {isThaiLanguage ? "กลับไปที่เข้าสู่ระบบ!" : "Back to login!"}
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
  resendButton: {
    marginTop: 10,
  },
  resendButtonText: {
    color: "#ff7f50",
    fontFamily: "NotoSansThai-Regular",
  },
});
