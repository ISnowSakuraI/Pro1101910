import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import AntDesign from "react-native-vector-icons/AntDesign";
import Home from "./Home";
import Profile from "./Profile";
import EditProfile from "./EditProfile";
import Schedule from "./HomeTab/Schedule";
import ArticleList from "./HomeTab/ArticleList";
import AddArticle from "./HomeTab/AddArticle";
import ManageMyArticles from "./HomeTab/ManageMyArticles";
import EditArticle from "./HomeTab/EditArticle";
import ArticleDetail from "./HomeTab/ArticleDetail";
import ExerciseTracker from "./HomeTab/ExerciseTracker";
import UserStatistics from "./HomeTab/UserStatistics";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function Mainindex() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: "#ff7f50",
        tabBarInactiveTintColor: "#555",
        tabBarStyle: {
          backgroundColor: "#fff",
          borderTopWidth: 0,
          elevation: 5,
          height: 60, // Increase height for better touch targets
          paddingBottom: 5, // Add padding for text
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'NotoSansThai-Regular',
        },
        tabBarIconStyle: {
          marginTop: 5, // Add margin to separate icon from label
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="home" color={color} size={size} />
          ),
          tabBarLabel: "หน้าหลัก", // Use Thai language for labels
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="user" color={color} size={size} />
          ),
          tabBarLabel: "โปรไฟล์",
        }}
      />
    </Tab.Navigator>
  );
}

function ArticleStack() { 
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ArticleList"
        component={ArticleList}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AddArticle"
        component={AddArticle}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ManageMyArticles"
        component={ManageMyArticles}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditArticle"
        component={EditArticle}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetail}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HomeScreen"
        component={Home}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Schedule"
        component={Schedule}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArticleList"
        component={ArticleStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ExerciseTracker"
        component={ExerciseTracker}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserStatistics"
        component={UserStatistics}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileScreen"
        component={Profile}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfile}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}