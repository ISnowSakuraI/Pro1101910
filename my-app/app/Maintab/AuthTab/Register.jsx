import React, { useState, useCallback, useMemo } from "react";
import {
  Text,
  View,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from "react-native";
import { auth, db } from "../../../firebase/Firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import logo from "../../../assets/images/icon.png";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";

export default function Register({ navigation }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [gender, setGender] = useState("");
  const [menuVisible, setMenuVisible] = useState(false);
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const themeStyles = useMemo(
    () => (isDarkTheme ? styles.dark : styles.light),
    [isDarkTheme]
  );

  const handleSubmit = useCallback(async () => {
    if (!email || !username || !password || !confirmPassword) {
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage
          ? "โปรดใส่ข้อมูลให้ครบทุกช่อง"
          : "Please fill in all fields"
      );
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage ? "รหัสผ่านไม่ตรงกัน" : "Passwords do not match"
      );
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      await setDoc(doc(db, "Users", uid), {
        email,
        username,
        uid,
        height,
        weight,
        gender,
      });

      Alert.alert(
        isThaiLanguage ? "สำเร็จ" : "Success",
        isThaiLanguage ? "สร้างบัญชีเสร็จสิ้น" : "Account created successfully"
      );
      navigation.navigate("LoginScreen");
    } catch (error) {
      console.error(error);
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage
          ? "เกิดข้อผิดพลาดในการสร้างบัญชี"
          : "An error occurred while creating the account"
      );
    }
  }, [email, username, password, confirmPassword, isThaiLanguage, navigation]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleShowConfirmPassword = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  const getGenderDisplay = (gender) => {
    if (!gender) return null;
    return gender === "Male"
      ? isThaiLanguage
        ? "ชาย"
        : "Male"
      : isThaiLanguage
      ? "หญิง"
      : "Female";
  };

  return (
    <View style={[styles.container, themeStyles.background]}>
      <Image style={styles.logo} source={logo} />
      <TextInput
        style={[styles.input, themeStyles.inputBackground]}
        placeholder={isThaiLanguage ? "อีเมล" : "Email"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, themeStyles.inputBackground]}
        placeholder={isThaiLanguage ? "ชื่อผู้ใช้" : "Username"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <View style={styles.inputGroup}>
        <Text style={[styles.label, { color: isDarkTheme ? "#aaa" : "#555" }]}>
          {isThaiLanguage ? "เพศ" : "Gender"}
        </Text>
        <TouchableOpacity
          onPress={() => setMenuVisible(true)}
          style={[
            styles.dropdownButton,
            { backgroundColor: themeStyles.inputBackground.backgroundColor },
          ]}
        >
          <Text
            style={[styles.dropdownText, { color: isDarkTheme ? "#aaa" : "#555" }]}
          >
            {getGenderDisplay(gender) ||
              (isThaiLanguage ? "เลือกเพศ" : "Select Gender")}
          </Text>
        </TouchableOpacity>
        {menuVisible && (
          <View style={styles.menu}>
            <TouchableOpacity
              onPress={() => {
                setGender("Male");
                setMenuVisible(false);
              }}
              style={styles.menuItem}
            >
              <Text>{isThaiLanguage ? "ชาย" : "Male"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setGender("Female");
                setMenuVisible(false);
              }}
              style={styles.menuItem}
            >
              <Text>{isThaiLanguage ? "หญิง" : "Female"}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TextInput
        style={[styles.input, themeStyles.inputBackground]}
        placeholder={isThaiLanguage ? "ส่วนสูง (cm)" : "Height (cm)"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={height}
        onChangeText={setHeight}
        keyboardType="numeric"
      />
      <TextInput
        style={[styles.input, themeStyles.inputBackground]}
        placeholder={isThaiLanguage ? "น้ำหนัก (kg)" : "Weight (kg)"}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={weight}
        onChangeText={setWeight}
        keyboardType="numeric"
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.passwordInput, themeStyles.inputBackground]}
          placeholder={isThaiLanguage ? "รหัสผ่าน" : "Password"}
          placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.eyeIcon} onPress={toggleShowPassword}>
          <Icon
            name={showPassword ? "visibility" : "visibility-off"}
            size={24}
            color={themeStyles.text.color}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.passwordInput, themeStyles.inputBackground]}
          placeholder={isThaiLanguage ? "ยืนยันรหัสผ่าน" : "Confirm Password"}
          placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.eyeIcon}
          onPress={toggleShowConfirmPassword}
        >
          <Icon
            name={showConfirmPassword ? "visibility" : "visibility-off"}
            size={24}
            color={themeStyles.text.color}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Icon name="person-add" size={20} color="white" />
        <Text style={styles.buttonText}>
          {isThaiLanguage ? "สมัครสมาชิก" : "Register"}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
        <Text style={styles.loginText}>
          {isThaiLanguage ? "มีบัญชีอยู่แล้ว? " : "Already have an account? "}
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
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  input: {
    fontFamily: "NotoSansThai-Regular",
    width: "100%",
    height: 50,
    borderRadius: 12,
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
    borderRadius: 12,
    paddingHorizontal: 15,
    borderColor: "#ddd",
    borderWidth: 1,
    backgroundColor: "#2c2c2c",
    color: "#ffffff",
    fontFamily: "NotoSansThai-Regular",
  },
  eyeIcon: {
    position: "absolute",
    right: 15,
  },
  inputGroup: {
    width: "100%",
    marginBottom: 15,
  },
  dropdownButton: {
    padding: 15,
    borderRadius: 12,
    borderColor: "#ddd",
    borderWidth: 1,
    justifyContent: "center",
  },
  dropdownText: {
    fontFamily: "NotoSansThai-Regular",
  },
  menu: {
    position: "absolute",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderColor: "#ddd",
    borderWidth: 1,
    marginTop: 10,
    width: "100%",
    zIndex: 1000,
  },
  menuItem: {
    padding: 10,
  },  
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: 50,
    backgroundColor: "#ff7f50",
    borderRadius: 12,
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
    fontFamily: "NotoSansThai-Regular",
    marginLeft: 5,
  },
  loginText: {
    color: "#888",
    fontFamily: "NotoSansThai-Regular",
  },
  loginLink: {
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
