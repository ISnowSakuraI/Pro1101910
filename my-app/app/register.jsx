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
import { auth, db } from "../firebase/Firebase";
import { addDoc, collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import logo from "../assets/Rosmontis.gif";

export default function Register({ navigation }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert("Error", "โปรดใส่อีเมลและรหัสผ่าน");
      return;
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      if (!cred.user) {
        Alert.alert("Error", "โปรดตรวจสอบอีเมลและรหัสผ่านอีกที");
        return;
      }
      const uid = cred.user.uid;
      const docRef = doc(db, "Users", uid);
      await setDoc(docRef, {
        uid: uid,
      });

      Alert.alert("Success", "สร้างบัณชีเสร็จสิ้น");
      navigation.navigate("Login");
    } catch (error) {
      console.error(error);
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
      <Button title="Register" onPress={handleSubmit} />
      <Button title="Login" onPress={() => navigation.navigate("Login")} />
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
  logo: {
    width: 100,
    height: 100,
  },
});
