// import React, { useEffect, useState } from "react";
// import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
// import { db, auth } from "../../../firebase/Firebase";
// import { collection, getDocs, query, where } from "firebase/firestore";
// import { LineChart } from "react-native-chart-kit";

// export default function UserStatistics() {
//   const [dailyData, setDailyData] = useState([]);
//   const [totalDistance, setTotalDistance] = useState(0);
//   const [totalTime, setTotalTime] = useState(0);
//   const [totalCalories, setTotalCalories] = useState(0);

//   useEffect(() => {
//     fetchUserStatistics();
//   }, []);

//   const fetchUserStatistics = async () => {
//     const user = auth.currentUser;
//     if (user) {
//       const q = query(collection(db, "exerciseData"), where("userId", "==", user.uid));
//       const querySnapshot = await getDocs(q);
//       let distance = 0;
//       let time = 0;
//       let calories = 0;
//       const dailyStats = {};

//       querySnapshot.forEach((doc) => {
//         const data = doc.data();
//         const date = new Date(data.createdAt.seconds * 1000).toLocaleDateString();
//         if (!dailyStats[date]) {
//           dailyStats[date] = { distance: 0, time: 0, calories: 0 };
//         }
//         dailyStats[date].distance += parseFloat(data.distance);
//         dailyStats[date].time += parseInt(data.time, 10);
//         dailyStats[date].calories += parseFloat(data.calories);

//         distance += parseFloat(data.distance);
//         time += parseInt(data.time, 10);
//         calories += parseFloat(data.calories);
//       });

//       setTotalDistance(distance);
//       setTotalTime(time);
//       setTotalCalories(calories);

//       const dailyDataArray = Object.keys(dailyStats).map(date => ({
//         date,
//         ...dailyStats[date],
//       }));

//       setDailyData(dailyDataArray);
//     }
//   };

//   const chartData = {
//     labels: dailyData.map(data => data.date),
//     datasets: [
//       {
//         data: dailyData.map(data => data.distance),
//         color: (opacity = 1) => `rgba(134, 65, 244, ${opacity})`, // optional
//         strokeWidth: 2 // optional
//       }
//     ],
//     legend: ["Distance (Km)"] // optional
//   };

//   return (
//     <ScrollView style={styles.container}>
//       <Text style={styles.header}>User Statistics</Text>
//       <View style={styles.statsContainer}>
//         <Text style={styles.statText}>Total Distance: {totalDistance.toFixed(2)} Km</Text>
//         <Text style={styles.statText}>Total Time: {totalTime} min</Text>
//         <Text style={styles.statText}>Total Calories: {totalCalories.toFixed(0)} cal</Text>
//       </View>
//       <LineChart
//         data={chartData}
//         width={Dimensions.get("window").width - 20} // from react-native
//         height={220}
//         yAxisLabel=""
//         yAxisSuffix=" Km"
//         chartConfig={{
//           backgroundColor: "#e26a00",
//           backgroundGradientFrom: "#fb8c00",
//           backgroundGradientTo: "#ffa726",
//           decimalPlaces: 2, // optional, defaults to 2dp
//           color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
//           labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
//           style: {
//             borderRadius: 16
//           },
//           propsForDots: {
//             r: "6",
//             strokeWidth: "2",
//             stroke: "#ffa726"
//           }
//         }}
//         style={{
//           marginVertical: 8,
//           borderRadius: 16
//         }}
//       />
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f5f5",
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: "bold",
//     textAlign: "center",
//     marginVertical: 10,
//   },
//   statsContainer: {
//     padding: 20,
//     backgroundColor: "#fff",
//     borderRadius: 10,
//     margin: 10,
//   },
//   statText: {
//     fontSize: 18,
//     marginVertical: 5,
//   },
// });