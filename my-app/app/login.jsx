import * as React from "react";
import {
  Text,
  View,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { auth, db } from "../firebase/Firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import logo from "../assets/R.png";

export default function Login({ navigation }) {
  const [input, setInput] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleLogin = async () => {
    try {
      if (!input || !password) {
        Alert.alert("โปรดใส่อีเมล/ชื่อผู้ใช้ และรหัสผ่าน");
        return;
      }

      let emailToLogin = input;

      // Check if input is not an email, assume it's a username
      if (!input.includes("@")) {
        // Query Firestore to find the email associated with this username
        const q = query(collection(db, "Users"), where("username", "==", input));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Alert.alert("Error", "ไม่พบชื่อผู้ใช้ในระบบ");
          return;
        }

        // Assuming username is unique, get the email from the first result
        const userDoc = querySnapshot.docs[0];
        emailToLogin = userDoc.data().email;
      }

      await signInWithEmailAndPassword(auth, emailToLogin, password);

      Alert.alert("Success", "เข้าสู่ระบบแล้ว");
      navigation.navigate("Main");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "โปรดใส่อีเมล/ชื่อผู้ใช้ และรหัสผ่านให้ถูกต้อง");
    }
  };

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={logo} />
      <TextInput
        style={styles.input}
        placeholder="Email / UserName"
        placeholderTextColor="#aaa"
        value={input}
        onChange={(e) => setInput(e.nativeEvent.text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        secureTextEntry
        value={password}
        onChange={(e) => setPassword(e.nativeEvent.text)}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.registerText}>Don't have an account? Register</Text>
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
  forgotText: {
    color: "#ff7f50",
    marginBottom: 15,
  },
  registerText: {
    color: "#888",
  },
});
