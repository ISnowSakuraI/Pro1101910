import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import AntDesign from "react-native-vector-icons/AntDesign";
import Login from "./AuthTab/Login";
import Register from "./AuthTab/Register";
import ForgotPassword from "./AuthTab/ForgotPassword";
import Profile from "./ProfileTab/Profile";
import EditProfile from "./ProfileTab/EditProfile";
import Settings from "./ProfileTab/Settings";
import Home from "./HomeTab/Home";
import Schedule from "./HomeTab/Schedule";
import ExerciseTracker from "./HomeTab/ExerciseTracker";
import UserStatistics from "./HomeTab/UserStatistics";
import ArticleList from "./HomeTab/ArticleTab/ArticleList";
import AddArticle from "./HomeTab/ArticleTab/AddArticle";
import ManageMyArticles from "./HomeTab/ArticleTab/ManageMyArticles";
import EditArticle from "./HomeTab/ArticleTab/EditArticle";
import ArticleDetail from "./HomeTab/ArticleTab/ArticleDetail";
import FavoriteArticles from "./HomeTab/ArticleTab/FavoriteArticles";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator initialRouteName="AuthStack">
      <Stack.Screen
        name="AuthStack"
        component={AuthStack}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="MainTabs"
        component={MainTabs}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="LoginScreen">
      <Stack.Screen
        name="LoginScreen"
        component={Login}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: "#ff7f50",
        tabBarInactiveTintColor: isDarkTheme ? "#aaa" : "#555",
        tabBarStyle: {
          backgroundColor: isDarkTheme ? "#333" : "#fff",
          borderTopWidth: 0,
          elevation: 5,
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 15,
          fontFamily: "NotoSansThai-Regular",
        },
        tabBarIconStyle: {
          marginTop: 5,
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
          tabBarLabel: isThaiLanguage ? "หน้าหลัก" : "Home",
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
          tabBarLabel: isThaiLanguage ? "โปรไฟล์" : "Profile",
        }}
      />
    </Tab.Navigator>
  );
}

function ArticleStack() {
  return (
    <Stack.Navigator initialRouteName="MainArticleList">
      <Stack.Screen
        name="MainArticleList"
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
      <Stack.Screen
        name="FavoriteArticles"
        component={FavoriteArticles}
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
        name="ArticleStack"
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
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetail}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator initialRouteName="ProfileScreen">
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
      <Stack.Screen
        name="ManageMyArticles"
        component={ManageMyArticles}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FavoriteArticles"
        component={FavoriteArticles}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetail}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={Settings}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
