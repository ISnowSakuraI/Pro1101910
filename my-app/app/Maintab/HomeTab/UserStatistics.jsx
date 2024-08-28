import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions, Alert } from "react-native";
import { db, auth } from "../../../firebase/Firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { LineChart } from "react-native-chart-kit";

export default function UserStatistics() {
  const [dailyData, setDailyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserStatistics = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert("Error", "User not authenticated");
          return;
        }

        const q = query(collection(db, "exerciseData"), where("userId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const dailyStats = {};

        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const date = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
          if (!dailyStats[date]) {
            dailyStats[date] = { distance: 0, calories: 0 };
          }
          dailyStats[date].distance += parseFloat(data.distance);
          dailyStats[date].calories += parseFloat(data.calories);
        });

        const dailyDataArray = Object.keys(dailyStats).map(date => ({
          date,
          ...dailyStats[date],
        }));

        setDailyData(dailyDataArray);
      } catch (error) {
        console.error("Error fetching user statistics: ", error);
        Alert.alert("Error", "Failed to fetch data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserStatistics();
  }, []);

  const chartConfig = {
    backgroundColor: "#e26a00",
    backgroundGradientFrom: "#fb8c00",
    backgroundGradientTo: "#ffa726",
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: "#ffa726"
    }
  };

  if (loading) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  const isValidData = dailyData.length > 0 && dailyData.every(data => data.distance !== undefined && data.calories !== undefined);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>User Statistics</Text>
      {isValidData ? (
        <>
          <LineChart
            data={{
              labels: dailyData.map(data => data.date),
              datasets: [
                {
                  data: dailyData.map(data => data.distance),
                  color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`,
                  strokeWidth: 2
                }
              ],
              legend: ["Distance (Km)"]
            }}
            width={Dimensions.get("window").width - 40}
            height={220}
            yAxisSuffix=" Km"
            chartConfig={chartConfig}
            style={styles.chart}
          />
          <LineChart
            data={{
              labels: dailyData.map(data => data.date),
              datasets: [
                {
                  data: dailyData.map(data => data.calories),
                  color: (opacity = 1) => `rgba(255, 99, 132, ${opacity})`,
                  strokeWidth: 2
                }
              ],
              legend: ["Calories (cal)"]
            }}
            width={Dimensions.get("window").width - 40}
            height={220}
            yAxisSuffix=" cal"
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </>
      ) : (
        <Text style={styles.noDataText}>No data available</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginVertical: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  noDataText: {
    textAlign: "center",
    fontSize: 16,
    color: "#777",
    marginTop: 20,
  },
  loadingText: {
    textAlign: "center",
    fontSize: 18,
    color: "#333",
    marginTop: 20,
  },
});