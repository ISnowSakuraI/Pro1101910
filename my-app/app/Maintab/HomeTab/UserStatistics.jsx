import React, { useEffect, useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { db, auth } from "../../../firebase/Firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { LineChart } from "react-native-chart-kit";
import { useTheme } from "../../ThemeContext";
import { useLanguage } from "../../LanguageContext";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

export default function UserStatistics() {
  const [dailyData, setDailyData] = useState([]);
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  useEffect(() => {
    const fetchUserStatistics = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const q = query(
            collection(db, "exerciseData"),
            where("userId", "==", user.uid)
          );
          const querySnapshot = await getDocs(q);
          const dailyStats = {};

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            const date = new Date(
              data.createdAt.seconds * 1000
            ).toLocaleDateString();
            if (!dailyStats[date]) {
              dailyStats[date] = { distance: 0, calories: 0 };
            }
            dailyStats[date].distance += parseFloat(data.distance);
            dailyStats[date].calories += parseFloat(data.calories);
          });

          const dailyDataArray = Object.keys(dailyStats).map((date) => ({
            date,
            ...dailyStats[date],
          }));

          setDailyData(dailyDataArray);
        } catch (error) {
          console.error("Error fetching user statistics: ", error);
        }
      }
    };

    fetchUserStatistics();
  }, []);

  const chartConfig = useMemo(
    () => ({
      backgroundColor: isDarkTheme ? "#1e1e1e" : "#f5f5f5",
      backgroundGradientFrom: isDarkTheme ? "#1e1e1e" : "#f5f5f5",
      backgroundGradientTo: isDarkTheme ? "#3e3e3e" : "#ffffff",
      decimalPlaces: 2,
      color: (opacity = 1) => `rgba(26, 255, 146, ${opacity})`,
      labelColor: (opacity = 1) =>
        isDarkTheme
          ? `rgba(255, 255, 255, ${opacity})`
          : `rgba(0, 0, 0, ${opacity})`,
      style: {
        borderRadius: 16,
      },
      propsForDots: {
        r: "6",
        strokeWidth: "2",
        stroke: "#ffa726",
      },
      propsForLabels: {
        fontSize: 12,
        fontFamily: "NotoSansThai-Regular",
      },
      propsForBackgroundLines: {
        strokeDasharray: "", // solid background lines
      },
    }),
    [isDarkTheme]
  );

  // Get the last 4 data points
  const lastFourData = dailyData.slice(-4);

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDarkTheme ? "#1e1e1e" : "#f5f5f5" },
      ]}
    >
      <Text style={[styles.header, { color: isDarkTheme ? "#fff" : "#333" }]}>
        {isThaiLanguage ? "สถิติผู้ใช้" : "User Statistics"}
      </Text>
      {lastFourData.length > 0 ? (
        <>
          <GraphSection
            title={isThaiLanguage ? "ระยะทางตามเวลา" : "Distance Over Time"}
            icon="run"
            data={lastFourData.map((data) => data.distance)}
            labels={lastFourData.map((data) => data.date)}
            legend={isThaiLanguage ? "ระยะทาง (กม.)" : "Distance (Km)"}
            yAxisSuffix={isThaiLanguage ? " กม." : " Km"}
            chartConfig={chartConfig}
          />
          <GraphSection
            title={
              isThaiLanguage
                ? "แคลอรี่ที่เผาผลาญตามเวลา"
                : "Calories Burned Over Time"
            }
            icon="fire"
            data={lastFourData.map((data) => data.calories)}
            labels={lastFourData.map((data) => data.date)}
            legend={isThaiLanguage ? "แคลอรี่ (แคล)" : "Calories (cal)"}
            yAxisSuffix={isThaiLanguage ? " แคล" : " cal"}
            chartConfig={chartConfig}
          />
        </>
      ) : (
        <Text
          style={[styles.noDataText, { color: isDarkTheme ? "#aaa" : "#777" }]}
        >
          {isThaiLanguage ? "ไม่มีข้อมูล" : "No data available"}
        </Text>
      )}
    </ScrollView>
  );
}

const GraphSection = ({
  title,
  icon,
  data,
  labels,
  legend,
  yAxisSuffix,
  chartConfig,
}) => {
  const { isDarkTheme } = useTheme();
  return (
    <>
      <View style={styles.graphContainer}>
        <Icon name={icon} size={24} color={isDarkTheme ? "#fff" : "#333"} />
        <Text
          style={[
            styles.graphTitle,
            { color: isDarkTheme ? "#fff" : "#333" },
          ]}
        >
          {title}
        </Text>
      </View>
      <LineChart
        data={{
          labels,
          datasets: [
            {
              data,
              color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
              strokeWidth: 2,
            },
          ],
          legend: [legend],
        }}
        width={Dimensions.get("window").width - 20} // Wider chart
        height={250} // Slightly taller chart
        yAxisSuffix={yAxisSuffix}
        chartConfig={chartConfig}
        style={styles.chart}
      />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
    fontFamily: "NotoSansThai-Regular",
  },
  graphContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  graphTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    fontFamily: "NotoSansThai-Regular",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    fontFamily: "NotoSansThai-Regular",
    marginTop: 20,
  },
  light: {
    primaryColor: "#ff7f50",
    secondaryColor: "#ffa07a",
    backgroundColor: "#f5f5f5",
    textColor: "#333333",
    cardBackgroundColor: "#ffffff",
    borderColor: "#ddd",
  },
  dark: {
    primaryColor: "#ff7f50",
    secondaryColor: "#ffa07a",
    backgroundColor: "#1e1e1e",
    textColor: "#ffffff",
    cardBackgroundColor: "#2c2c2c",
    borderColor: "#444",
  },
});