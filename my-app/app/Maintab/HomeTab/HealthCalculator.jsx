import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";

export default function HealthCalculator() {
  const { isDarkTheme, toggleTheme } = useTheme();
  const { isThaiLanguage, toggleLanguage } = useLanguage();
  const [mode, setMode] = useState("BMI");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [systolic, setSystolic] = useState("");
  const [diastolic, setDiastolic] = useState("");
  const [bmi, setBmi] = useState(null);
  const [bmiCategory, setBmiCategory] = useState("");
  const [bpCategory, setBpCategory] = useState("");
  const [animation] = useState(new Animated.Value(0));

  const toggleMode = () => {
    Animated.timing(animation, {
      toValue: mode === "BMI" ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      setMode(mode === "BMI" ? "BP" : "BMI");
    });
  };

  const calculateBMI = () => {
    const heightInMeters = parseFloat(height) / 100;
    const weightInKg = parseFloat(weight);
    if (heightInMeters > 0 && weightInKg > 0) {
      const bmiValue = weightInKg / (heightInMeters * heightInMeters);
      setBmi(bmiValue.toFixed(1));
      determineBMICategory(bmiValue);
    } else {
      Alert.alert("Invalid input", "Please enter valid height and weight.");
    }
  };

  const determineBMICategory = (bmiValue) => {
    if (bmiValue < 18.5) {
      setBmiCategory(isThaiLanguage ? "น้ำหนักน้อย" : "Underweight");
    } else if (bmiValue >= 18.5 && bmiValue < 24.9) {
      setBmiCategory(isThaiLanguage ? "น้ำหนักปกติ" : "Normal weight");
    } else if (bmiValue >= 25 && bmiValue < 29.9) {
      setBmiCategory(isThaiLanguage ? "น้ำหนักเกิน" : "Overweight");
    } else {
      setBmiCategory(isThaiLanguage ? "โรคอ้วน" : "Obesity");
    }
  };

  const calculateBloodPressure = () => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    if (sys > 0 && dia > 0) {
      if (sys < 120 && dia < 80) {
        setBpCategory(isThaiLanguage ? "ปกติ" : "Normal");
      } else if (sys < 140 && dia < 90) {
        setBpCategory(isThaiLanguage ? "เริ่มสูง" : "Elevated");
      } else if (sys < 160 || dia < 100) {
        setBpCategory(
          isThaiLanguage
            ? "สูงกว่าปกติระดับ 1"
            : "High Blood Pressure (Stage 1)"
        );
      } else if (sys < 180 || dia < 110) {
        setBpCategory(
          isThaiLanguage
            ? "สูงกว่าปกติระดับ 2"
            : "High Blood Pressure (Stage 2)"
        );
      } else {
        setBpCategory(
          isThaiLanguage
            ? "สูงกว่าปกติระดับ 3"
            : "High Blood Pressure (Stage 3)"
        );
      }
    } else {
      Alert.alert("Invalid input", "Please enter valid blood pressure values.");
    }
  };

  const getHealthAdvice = () => {
    if (mode === "BMI") {
      switch (bmiCategory) {
        case "Underweight":
        case "น้ำหนักน้อย":
          return isThaiLanguage
            ? "ควรเพิ่มน้ำหนักด้วยการรับประทานอาหารที่มีประโยชน์และออกกำลังกาย"
            : "Consider gaining weight through a balanced diet and exercise.";
        case "Normal weight":
        case "น้ำหนักปกติ":
          return isThaiLanguage
            ? "รักษาน้ำหนักปัจจุบันด้วยการรับประทานอาหารที่สมดุลและออกกำลังกาย"
            : "Maintain your current weight with a balanced diet and regular exercise.";
        case "Overweight":
        case "น้ำหนักเกิน":
          return isThaiLanguage
            ? "พิจารณาลดน้ำหนักด้วยการควบคุมอาหารและออกกำลังกาย"
            : "Consider losing weight through diet control and exercise.";
        case "Obesity":
        case "โรคอ้วน":
          return isThaiLanguage
            ? "ควรปรึกษาแพทย์เพื่อแผนการลดน้ำหนักที่เหมาะสม"
            : "Consult a healthcare provider for a suitable weight loss plan.";
        default:
          return "";
      }
    } else {
      switch (bpCategory) {
        case "Normal":
        case "ปกติ":
          return isThaiLanguage
            ? "รักษาความดันโลหิตให้อยู่ในระดับปกติด้วยการรับประทานอาหารที่มีประโยชน์และออกกำลังกาย"
            : "Maintain normal blood pressure with a healthy diet and regular exercise.";
        case "Elevated":
        case "เริ่มสูง":
          return isThaiLanguage
            ? "ควรเริ่มปรับเปลี่ยนพฤติกรรมการรับประทานอาหารและการออกกำลังกาย"
            : "Consider lifestyle changes in diet and exercise.";
        case "High Blood Pressure (Stage 1)":
        case "สูงกว่าปกติระดับ 1":
          return isThaiLanguage
            ? "ควรปรึกษาแพทย์เพื่อคำแนะนำเพิ่มเติม"
            : "Consult a healthcare provider for further advice.";
        case "High Blood Pressure (Stage 2)":
        case "สูงกว่าปกติระดับ 2":
        case "สูงกว่าปกติระดับ 3":
          return isThaiLanguage
            ? "ควรปรึกษาแพทย์ทันทีเพื่อการรักษา"
            : "Seek medical advice immediately for treatment.";
        default:
          return "";
      }
    }
  };

  const buttonBackgroundColor = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ["#004d40", "#00796b"],
  });

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkTheme ? "#333" : "#fff" },
      ]}
    >
      <Text
        style={[styles.header, { color: isDarkTheme ? "#fff" : "#00796b" }]}
      >
        {isThaiLanguage ? "โปรแกรมคำนวณสุขภาพ" : "Health Calculator"}
      </Text>
      <Animated.View
        style={[
          styles.toggleButton,
          { backgroundColor: buttonBackgroundColor },
        ]}
      >
        <TouchableOpacity onPress={toggleMode}>
          <Text style={styles.toggleButtonText}>
            {mode === "BMI"
              ? isThaiLanguage
                ? "เปลี่ยนเป็นความดันโลหิต"
                : "Switch to Blood Pressure"
              : isThaiLanguage
              ? "เปลี่ยนเป็น BMI"
              : "Switch to BMI"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
      {mode === "BMI" ? (
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <Icon name="straighten" size={24} color="#ff7f50" />
            <TextInput
              style={styles.input}
              placeholder={isThaiLanguage ? "ส่วนสูง (ซม.)" : "Height (cm)"}
              keyboardType="numeric"
              value={height}
              onChangeText={setHeight}
            />
          </View>
          <View style={styles.inputRow}>
            <Icon name="fitness-center" size={24} color="#ff7f50" />
            <TextInput
              style={styles.input}
              placeholder={isThaiLanguage ? "น้ำหนัก (กก.)" : "Weight (kg)"}
              keyboardType="numeric"
              value={weight}
              onChangeText={setWeight}
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={calculateBMI}>
            <Text style={styles.buttonText}>
              {isThaiLanguage ? "คำนวณ BMI" : "Calculate BMI"}
            </Text>
          </TouchableOpacity>
          {bmi && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsHeader}>
                {isThaiLanguage ? "ผลลัพธ์" : "Results"}
              </Text>
              <Text style={styles.resultText}>BMI: {bmi}</Text>
              <Text style={styles.resultText}>
                {isThaiLanguage ? "หมวดหมู่" : "Category"}: {bmiCategory}
              </Text>
              <Text style={styles.adviceText}>{getHealthAdvice()}</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <Icon name="favorite" size={24} color="#ff7f50" />
            <TextInput
              style={styles.input}
              placeholder={
                isThaiLanguage
                  ? "ความดันโลหิต (ตัวบน)"
                  : "Blood Pressure (Systolic)"
              }
              keyboardType="numeric"
              value={systolic}
              onChangeText={setSystolic}
            />
          </View>
          <View style={styles.inputRow}>
            <Icon name="favorite" size={24} color="#ff7f50" />
            <TextInput
              style={styles.input}
              placeholder={
                isThaiLanguage
                  ? "ความดันโลหิต (ตัวล่าง)"
                  : "Blood Pressure (Diastolic)"
              }
              keyboardType="numeric"
              value={diastolic}
              onChangeText={setDiastolic}
            />
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={calculateBloodPressure}
          >
            <Text style={styles.buttonText}>
              {isThaiLanguage
                ? "คำนวณความดันโลหิต"
                : "Calculate Blood Pressure"}
            </Text>
          </TouchableOpacity>
          {bpCategory && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsHeader}>
                {isThaiLanguage ? "ผลลัพธ์" : "Results"}
              </Text>
              <Text style={styles.resultText}>
                {isThaiLanguage ? "หมวดหมู่" : "Category"}: {bpCategory}
              </Text>
              <Text style={styles.adviceText}>{getHealthAdvice()}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  toggleButton: {
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  toggleButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 5,
    padding: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#ff7f50",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  resultsContainer: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#b2dfdb",
    borderRadius: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  resultsHeader: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    marginBottom: 5,
  },
  adviceText: {
    fontSize: 14,
    marginTop: 10,
    color: "#00796b",
  },
});