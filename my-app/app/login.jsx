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
import Icon from "react-native-vector-icons/MaterialIcons";
import logo from "../assets/images/150.png";

export default function Login({ navigation }) {
  const [input, setInput] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);

  const handleLogin = async () => {
    try {
      if (!input || !password) {
        Alert.alert("โปรดใส่อีเมล/ชื่อผู้ใช้ และรหัสผ่าน");
        return;
      }

      let emailToLogin = input;

      if (!input.includes("@")) {
        const q = query(collection(db, "Users"), where("username", "==", input));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          Alert.alert("Error", "ไม่พบชื่อผู้ใช้ในระบบ");
          return;
        }

        const userDoc = querySnapshot.docs[0];
        emailToLogin = userDoc.data().email;
      }

      await signInWithEmailAndPassword(auth, emailToLogin, password);
      navigation.navigate("MainIndex");
      setInput("");
      setPassword("");
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
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry={!showPassword}
          value={password}
          onChange={(e) => setPassword(e.nativeEvent.text)}
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={() => setShowPassword(!showPassword)}
        >
          <Icon name={showPassword ? "visibility" : "visibility-off"} size={24} color="#aaa" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Icon name="login" size={20} color="white" />
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
        <Text style={styles.forgotText}>Forgot Password?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Register")}>
        <Text style={styles.registerText}>Don't have an account? <Text style={styles.registerHighlight}>Register</Text></Text>
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
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    borderColor: "#ddd",
    borderWidth: 1,
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
    borderRadius: 8,
    marginBottom: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 5,
  },
  forgotText: {
    color: "#ff7f50",
    marginBottom: 15,
  },
  registerText: {
    color: "#888",
  },
  registerHighlight: {
    color: "#ff7f50",
    fontWeight: "bold",
  },
});