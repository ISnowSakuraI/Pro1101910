import * as React from "react";
import {
  Text,
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../firebase/Firebase";

export default function Home({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      console.log("Auth", currentUser);
      setUser(currentUser);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>หมวดหมู่</Text>
      <View style={styles.grid}>
        <CategoryItem
          image={require("../../assets/images/150.png")}
          label="Text"
          onPress={() => navigation.navigate("HealthyFood")}
        />
        <CategoryItem
          image={require("../../assets/images/150.png")}
          label="Text"
          onPress={() => navigation.navigate("ExerciseTracking")}
        />
        <CategoryItem
          image={require("../../assets/images/150.png")}
          label="Text"
          onPress={() => navigation.navigate("Measurements")}
        />
      </View>

      <Text style={styles.header}>Text</Text>
      <View style={styles.tips}>
        <TipItem
          image={require("../../assets/images/150.png")}
          label="Text"
        />
        <TipItem
          image={require("../../assets/images/150.png")}
          label="Text"
        />
      </View>
    </ScrollView>
  );
}

function CategoryItem({ image, label, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={onPress}>
      <Image source={image} style={styles.icon} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

function TipItem({ image, label }) {
  return (
    <View style={styles.tipItem}>
      <Image source={image} style={styles.tipImage} />
      <Text style={styles.tipLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  item: {
    width: "30%",
    alignItems: "center",
    marginVertical: 10,
  },
  icon: {
    width: 75,
    height: 75,
    marginBottom: 5,
  },
  label: {
    textAlign: "center",
    fontSize: 18,
  },
  tips: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tipItem: {
    width: "48%",
    alignItems: "center",
    marginVertical: 10,
  },
  tipImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
  },
  tipLabel: {
    textAlign: "center",
    fontSize: 16,
    marginTop: 5,
  },
});