import * as React from "react";
import {
  Text,
  View,
  TextInput,
  StyleSheet,
  Image,
  Button,
  Alert,
} from "react-native";
import { auth } from "../firebase/Firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import logo from "../assets/Rosmontis.gif";

export default function Login({ navigation }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert("โปรดใส่อีเมลและรหัสผ่าน");
        return;
      }
      await signInWithEmailAndPassword(auth, email, password);

      Alert.alert("Success", "เข้าสู่ระบบแล้ว");
      navigation.navigate("Home");
    } catch (error) {
      Alert.alert("Error", "โปรดใส่อีเมลและรหัสผ่านให้ถูกต้อง");
    }
  };
  return (
    <View style={styles.container}>
      <Image style={{ width: 200, height: 200 }} source={logo} />
      <Text>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.nativeEvent.text)}
      />
      <Text>Password</Text>
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        secureTextEntry={true}
        onChange={(e) => setPassword(e.nativeEvent.text)}
      />
      <Button title="Login" onPress={handleLogin} />
      <Button
        title="Register"
        onPress={() => navigation.navigate("Register")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    height: 40,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});
