import React, { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Image, Alert } from "react-native";
import { db } from "../../../../firebase/Firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";

export default function ReportedArticles({ navigation }) {
  const [reportedArticles, setReportedArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const fetchReportedArticles = useCallback(async () => {
    try {
      const reportsSnapshot = await getDocs(collection(db, "reports"));
      const articlesSnapshot = await getDocs(collection(db, "articles"));

      const reports = reportsSnapshot.docs.map(doc => doc.data());
      const articles = articlesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      }));

      const reportDetails = reports.reduce((acc, report) => {
        if (!acc[report.articleId]) {
          acc[report.articleId] = { count: 0, reasons: [] };
        }
        acc[report.articleId].count += 1;
        acc[report.articleId].reasons.push(report.reason);
        return acc;
      }, {});

      const reportedList = articles.map(article => ({
        ...article,
        reportCount: reportDetails[article.id]?.count || 0,
        reportReasons: reportDetails[article.id]?.reasons.join(", ") || "",
      })).filter(article => reportDetails[article.id]);

      setReportedArticles(reportedList);
    } catch (error) {
      console.error("Error fetching reported articles: ", error);
    }
  }, []);

  useEffect(() => {
    fetchReportedArticles();
  }, [fetchReportedArticles]);

  const handleDeleteArticle = async (articleId) => {
    try {
      await deleteDoc(doc(db, "articles", articleId));
      setReportedArticles(
        reportedArticles.filter((article) => article.id !== articleId)
      );
      Alert.alert(
        isThaiLanguage ? "สำเร็จ" : "Success",
        isThaiLanguage
          ? "ลบบทความเรียบร้อยแล้ว!"
          : "Article deleted successfully!"
      );
    } catch (error) {
      console.error("Error deleting article: ", error);
      Alert.alert(
        isThaiLanguage ? "ข้อผิดพลาด" : "Error",
        isThaiLanguage
          ? "ไม่สามารถลบบทความได้ กรุณาลองใหม่อีกครั้ง."
          : "Failed to delete article. Please try again."
      );
    }
  };

  const filteredArticles = reportedArticles.filter(
    (article) =>
      (article.title?.toLowerCase() || "").includes(
        searchQuery.toLowerCase()
      ) ||
      (article.reportReasons?.toLowerCase() || "").includes(searchQuery.toLowerCase())
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkTheme ? "#333" : "#f9f9f9" },
      ]}
    >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Icon name="arrow-back" size={24} color={isDarkTheme ? "#fff" : "#000"} />
      </TouchableOpacity>
      <Text style={[styles.header, { color: isDarkTheme ? "#fff" : "#333" }]}>
        {isThaiLanguage ? "บทความที่ถูกรายงาน" : "Reported Articles"}
      </Text>
      <TextInput
        style={[
          styles.searchInput,
          {
            backgroundColor: isDarkTheme ? "#444" : "#fff",
            color: isDarkTheme ? "#fff" : "#000",
          },
        ]}
        placeholder={isThaiLanguage ? "ค้นหาบทความ..." : "Search articles..."}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.card,
              { backgroundColor: isDarkTheme ? "#444" : "white" },
            ]}
          >
            {item.images && item.images[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>No Image</Text>
              </View>
            )}
            <Text
              style={[styles.title, { color: isDarkTheme ? "#fff" : "#333" }]}
              numberOfLines={4}
            >
              {item.title || "Untitled"}
            </Text>
            <Text
              style={[
                styles.subtitle,
                { color: isDarkTheme ? "#aaa" : "#666" },
              ]}
            >
              {isThaiLanguage ? "จำนวนรีพอร์ต: " : "Number of Reports: "}
              {item.reportCount || 0}
            </Text>
            <Text
              style={[
                styles.reason,
                { color: isDarkTheme ? "#aaa" : "#666" },
              ]}
            >
              {isThaiLanguage ? "เหตุผล: " : "Reason: "}
              {item.reportReasons || "N/A"}
            </Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.viewButton}
                onPress={() =>
                  navigation.navigate("ArticleDetail", {
                    articleId: item.id,
                  })
                }
              >
                <Icon name="visibility" size={20} color="white" />
                <Text style={styles.buttonText}>
                  {isThaiLanguage ? "ดูรายละเอียด" : "View Details"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteArticle(item.id)}
              >
                <Icon name="delete" size={20} color="white" />
                <Text style={styles.buttonText}>
                  {isThaiLanguage ? "ลบ" : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 20,
    textAlign: "center",
  },
  searchInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
    fontFamily: "NotoSansThai-Regular",
  },
  card: {
    marginBottom: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  image: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: "100%",
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#ccc",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePlaceholderText: {
    color: "#fff",
    fontFamily: "NotoSansThai-Regular",
  },
  title: {
    fontSize: 16,
    fontFamily: "NotoSansThai-Regular",
    marginVertical: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 5,
  },
  reason: {
    fontSize: 14,
    fontFamily: "NotoSansThai-Regular",
    marginBottom: 10,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginRight: 5,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f44336",
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginLeft: 5,
  },
  buttonText: {
    color: "white",
    marginLeft: 5,
    fontFamily: "NotoSansThai-Regular",
  },
});