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
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import logo from "../assets/images/150.png";

export default function Register({ navigation }) {
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const handleSubmit = async () => {
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert("Error", "โปรดใส่ข้อมูลให้ครบทุกช่อง");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "รหัสผ่านไม่ตรงกัน");
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      await setDoc(doc(db, "Users", uid), {
        email: email,
        username: username,
        uid: uid,
      });

      Alert.alert("Success", "สร้างบัณชีเสร็จสิ้น");
      navigation.navigate("Login");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "เกิดข้อผิดพลาดในการสร้างบัณชี");
    }
  };

  return (
    <View style={styles.container}>
      <Image style={styles.logo} source={logo} />
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChange={(e) => setEmail(e.nativeEvent.text)}
      />
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#aaa"
        value={username}
        onChange={(e) => setUsername(e.nativeEvent.text)}
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
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Icon name={showPassword ? "visibility" : "visibility-off"} size={24} color="#aaa" />
        </TouchableOpacity>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          placeholderTextColor="#aaa"
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.nativeEvent.text)}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
          <Icon name={showConfirmPassword ? "visibility" : "visibility-off"} size={24} color="#aaa" />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Icon name="person-add" size={20} color="white" />
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.loginText}>Already have an account? <Text style={styles.loginLink}>Login</Text></Text>
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
    fontFamily: 'NotoSansThai-Regular',
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
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderColor: "#ddd",
    borderWidth: 1,
  },
  passwordInput: {
    fontFamily: 'NotoSansThai-Regular',
    flex: 1,
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
    fontFamily: 'NotoSansThai-Regular',
    marginLeft: 5,
  },
  loginText: {
    color: "#888",
  },
  loginLink: {
    color: "#ff7f50",
    fontFamily: 'NotoSansThai-Regular',
  },
});