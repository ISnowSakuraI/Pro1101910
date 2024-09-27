import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { db } from "../../../../firebase/Firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useTheme } from "../../../ThemeContext";
import { useLanguage } from "../../../LanguageContext";

export default function ReportedArticles({ navigation }) {
  const [reportedArticles, setReportedArticles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const themeStyles = useMemo(() => (isDarkTheme ? styles.dark : styles.light), [isDarkTheme]);

  const fetchReportedArticles = useCallback(async () => {
    try {
      const reportsSnapshot = await getDocs(collection(db, "reports"));
      const articlesSnapshot = await getDocs(collection(db, "articles"));

      const reports = reportsSnapshot.docs.map((doc) => doc.data());
      const articles = articlesSnapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      const reportDetails = reports.reduce((acc, report) => {
        const articleId = report.articleId;
        if (!acc[articleId]) {
          acc[articleId] = { count: 0, reasons: [] };
        }
        acc[articleId].count += 1;
        acc[articleId].reasons = acc[articleId].reasons.concat(report.reasons);
        return acc;
      }, {});

      const reportedList = articles
        .map((article) => ({
          ...article,
          reportCount: reportDetails[article.id]?.count || 0,
          reportReasons: reportDetails[article.id]?.reasons.join(", ") || "N/A",
        }))
        .filter((article) => reportDetails[article.id]);

      reportedList.sort((a, b) => b.reportCount - a.reportCount);

      setReportedArticles(reportedList);
    } catch (error) {
      console.error("Error fetching reported articles: ", error);
    }
  }, []);

  useEffect(() => {
    fetchReportedArticles();
  }, [fetchReportedArticles]);

  const handleDeleteArticle = useCallback(async (articleId) => {
    Alert.alert(
      isThaiLanguage ? "ยืนยันการลบ" : "Confirm Deletion",
      isThaiLanguage
        ? "คุณแน่ใจหรือไม่ว่าต้องการลบบทความนี้?"
        : "Are you sure you want to delete this article?",
      [
        {
          text: isThaiLanguage ? "ยกเลิก" : "Cancel",
          style: "cancel",
        },
        {
          text: isThaiLanguage ? "ลบ" : "Delete",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "articles", articleId));
              setReportedArticles((prevArticles) =>
                prevArticles.filter((article) => article.id !== articleId)
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
          },
        },
      ]
    );
  }, [isThaiLanguage]);

  const handleDeleteReport = useCallback(async (articleId) => {
    Alert.alert(
      isThaiLanguage ? "ยืนยันการลบ" : "Confirm Deletion",
      isThaiLanguage
        ? "คุณแน่ใจหรือไม่ว่าต้องการลบรีพอร์ตนี้?"
        : "Are you sure you want to delete this report?",
      [
        {
          text: isThaiLanguage ? "ยกเลิก" : "Cancel",
          style: "cancel",
        },
        {
          text: isThaiLanguage ? "ลบ" : "Delete",
          onPress: async () => {
            try {
              const reportsSnapshot = await getDocs(collection(db, "reports"));
              const reportDocs = reportsSnapshot.docs.filter(
                (doc) => doc.data().articleId === articleId
              );
              for (const reportDoc of reportDocs) {
                await deleteDoc(doc(db, "reports", reportDoc.id));
              }
              fetchReportedArticles();
              Alert.alert(
                isThaiLanguage ? "สำเร็จ" : "Success",
                isThaiLanguage
                  ? "ลบรีพอร์ตเรียบร้อยแล้ว!"
                  : "Report deleted successfully!"
              );
            } catch (error) {
              console.error("Error deleting report: ", error);
              Alert.alert(
                isThaiLanguage ? "ข้อผิดพลาด" : "Error",
                isThaiLanguage
                  ? "ไม่สามารถลบรีพอร์ตได้ กรุณาลองใหม่อีกครั้ง."
                  : "Failed to delete report. Please try again."
              );
            }
          },
        },
      ]
    );
  }, [isThaiLanguage]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReportedArticles().then(() => setRefreshing(false));
  }, [fetchReportedArticles]);

  const filteredArticles = useMemo(() => {
    return reportedArticles.filter(
      (article) =>
        (article.title?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (article.reportReasons?.toLowerCase() || "").includes(
          searchQuery.toLowerCase()
        )
    );
  }, [reportedArticles, searchQuery]);

  return (
    <View style={[styles.container, themeStyles.background]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={themeStyles.text.color} />
      </TouchableOpacity>
      <Text style={[styles.header, themeStyles.text]}>
        {isThaiLanguage ? "บทความที่ถูกรายงาน" : "Reported Articles"}
      </Text>
      <TextInput
        style={[styles.searchInput, themeStyles.inputBackground]}
        placeholder={isThaiLanguage ? "ค้นหาบทความ..." : "Search articles..."}
        placeholderTextColor={isDarkTheme ? "#aaa" : "#555"}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />
      <FlatList
        data={filteredArticles}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={[styles.card, themeStyles.cardBackground]}>
            <TouchableOpacity
              style={styles.deleteIcon}
              onPress={() => handleDeleteReport(item.id)}
            >
              <Icon name="close" size={20} color={themeStyles.text.color} />
            </TouchableOpacity>
            {item.images && item.images[0] ? (
              <Image source={{ uri: item.images[0] }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderText}>No Image</Text>
              </View>
            )}
            <Text style={[styles.title, themeStyles.text]} numberOfLines={4}>
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
              numberOfLines={3}
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
  backButton: {
    marginBottom: 10,
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
    position: "relative",
  },
  deleteIcon: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 1,
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
    cardBackground: {
      backgroundColor: "#ffffff",
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
    cardBackground: {
      backgroundColor: "#2c2c2c",
    },
  },
});