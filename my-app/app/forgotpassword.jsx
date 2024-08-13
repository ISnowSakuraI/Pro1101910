import * as React from "react";
import {
  Text,
  View,
  TextInput,
  StyleSheet,
  Button,
  Alert,
  TouchableOpacity,
} from "react-native";
import { auth } from "../firebase/Firebase";
import { sendPasswordResetEmail } from "firebase/auth";

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = React.useState("");
  const [requestSent, setRequestSent] = React.useState(false);


  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert("Error", "โปรดใส่อีเมลที่คุณใช้สมัครสมาชิก");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert("Success", "อีเมลรีเซ็ตรหัสผ่านถูกส่งไปที่อีเมลของคุณแล้ว");
      setRequestSent(true);
    } catch (error) {
      Alert.alert("Error", "เกิดข้อผิดพลาดในการส่งอีเมลรีเซ็ตรหัสผ่าน");
      console.error(error);
    }
  };

  const handleResendRequest = () => {
    setRequestSent(false);
    Alert.alert("Info", "คุณสามารถส่งคำขอเปลี่ยนรหัสผ่านอีกครั้ง");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ลืมรหัสผ่าน?</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
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
        <Text style={styles.buttonText}>Reset Password</Text>
      </TouchableOpacity>
      {requestSent && (
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendRequest}
          activeOpacity={0.8}
        >
          <Text style={styles.resendButtonText}>Send Request Again</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.loginText}>Back to login!</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#ff7f50",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  loginText: {
    color: "#888",
  },
});
