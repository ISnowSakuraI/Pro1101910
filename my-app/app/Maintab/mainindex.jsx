import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import AntDesign from "react-native-vector-icons/AntDesign";
import { StyleSheet } from "react-native";
import { useTheme } from "../ThemeContext";
import { useLanguage } from "../LanguageContext";

// Import screens
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
import HealthCalculator from "./HomeTab/HealthCalculator";
import ManageArticles from "./HomeTab/AdminTab/ManageArticles";
import ReportedArticles from "./HomeTab/AdminTab/ReportedArticles";
import SystemTest from "./HomeTab/AdminTab/SystemTest";
import ArticleList from "./HomeTab/ArticleTab/ArticleList";
import AddArticle from "./HomeTab/ArticleTab/AddArticle";
import MyArticles from "./HomeTab/ArticleTab/MyArticles";
import EditArticle from "./HomeTab/ArticleTab/EditArticle";
import ArticleDetail from "./HomeTab/ArticleTab/ArticleDetail";
import FavoriteArticles from "./HomeTab/ArticleTab/FavoriteArticles";
import FoodDiary from "./HomeTab/FoodTab/FoodDiary";
import MenuList from "./HomeTab/FoodTab/MenuList";
import AddMenu from "./HomeTab/FoodTab/AddMenu";
import MenuDetail from "./HomeTab/FoodTab/MenuDetail";
import MyMenus from "./HomeTab/FoodTab/MyMenus";
import EditMenu from "./HomeTab/FoodTab/EditMenu";
import FavoriteMenus from "./HomeTab/FoodTab/FavoriteMenus";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export default function MainNavigator() {
  return (
    <Stack.Navigator initialRouteName="AuthStack">
      <Stack.Screen name="AuthStack" component={AuthStack} options={{ headerShown: false }} />
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="LoginScreen">
      <Stack.Screen name="LoginScreen" component={Login} options={{ headerShown: false }} />
      <Stack.Screen name="Register" component={Register} options={{ headerShown: false }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { isDarkTheme } = useTheme();
  const { isThaiLanguage } = useLanguage();

  const theme = isDarkTheme ? styles.dark : styles.light;

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: theme.primaryColor,
        tabBarInactiveTintColor: theme.textColor,
        tabBarStyle: {
          backgroundColor: theme.backgroundColor,
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
          tabBarIcon: ({ color, size }) => <AntDesign name="home" color={color} size={size} />,
          tabBarLabel: isThaiLanguage ? "หน้าหลัก" : "Home",
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <AntDesign name="user" color={color} size={size} />,
          tabBarLabel: isThaiLanguage ? "โปรไฟล์" : "Profile",
        }}
      />
    </Tab.Navigator>
  );
}

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="HomeScreen" component={Home} options={{ headerShown: false }} />
      <Stack.Screen name="Schedule" component={Schedule} options={{ headerShown: false }} />
      <Stack.Screen name="ArticleStack" component={ArticleStack} options={{ headerShown: false }} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetail} options={{ headerShown: false }} />
      <Stack.Screen name="ExerciseTracker" component={ExerciseTracker} options={{ headerShown: false }} />
      <Stack.Screen name="UserStatistics" component={UserStatistics} options={{ headerShown: false }} />
      <Stack.Screen name="AdminStack" component={AdminStack} options={{ headerShown: false }} />
      <Stack.Screen name="HealthCalculator" component={HealthCalculator} options={{ headerShown: false }} />
      <Stack.Screen name="FoodStack" component={FoodStack} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator initialRouteName="ProfileScreen">
      <Stack.Screen name="ProfileScreen" component={Profile} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }} />
      <Stack.Screen name="MyArticles" component={MyArticles} options={{ headerShown: false }} />
      <Stack.Screen name="FavoriteArticles" component={FavoriteArticles} options={{ headerShown: false }} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetail} options={{ headerShown: false }} />
      <Stack.Screen name="EditArticle" component={EditArticle} options={{ headerShown: false }} />
      <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function AdminStack() {
  return (
    <Stack.Navigator initialRouteName="ManageArticles">
      <Stack.Screen name="ManageArticles" component={ManageArticles} options={{ headerShown: false }} />
      <Stack.Screen name="ReportedArticles" component={ReportedArticles} options={{ headerShown: false }} />
      <Stack.Screen name="SystemTest" component={SystemTest} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function FoodStack() {
  return (
    <Stack.Navigator initialRouteName="FoodDiary">
      <Stack.Screen name="FoodDiary" component={FoodDiary} options={{ headerShown: false }} />
      <Stack.Screen name="MenuList" component={MenuList} options={{ headerShown: false }} />
      <Stack.Screen name="AddMenu" component={AddMenu} options={{ headerShown: false }} />
      <Stack.Screen name="MenuDetail" component={MenuDetail} options={{ headerShown: false }} />
      <Stack.Screen name="MyMenus" component={MyMenus} options={{ headerShown: false }} />
      <Stack.Screen name="EditMenu" component={EditMenu} options={{ headerShown: false }} />
      <Stack.Screen name="FavoriteMenus" component={FavoriteMenus} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

function ArticleStack() {
  return (
    <Stack.Navigator initialRouteName="MainArticleList">
      <Stack.Screen name="MainArticleList" component={ArticleList} options={{ headerShown: false }} />
      <Stack.Screen name="AddArticle" component={AddArticle} options={{ headerShown: false }} />
      <Stack.Screen name="MyArticles" component={MyArticles} options={{ headerShown: false }} />
      <Stack.Screen name="EditArticle" component={EditArticle} options={{ headerShown: false }} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetail} options={{ headerShown: false }} />
      <Stack.Screen name="FavoriteArticles" component={FavoriteArticles} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  light: {
    primaryColor: "#ff7f50", // Coral
    secondaryColor: "#ffa07a", // Light Coral
    backgroundColor: "#f0f0f0", // Light Gray for a softer white
    textColor: "#333333", // Dark Gray for text
    cardBackgroundColor: "#ffffff", // Pure White for cards
    borderColor: "#ddd", // Light Gray for borders
  },
  dark: {
    primaryColor: "#ff7f50", // Coral
    secondaryColor: "#ffa07a", // Light Coral
    backgroundColor: "#212121", // Dark Gray for a softer black
    textColor: "#ffffff", // White for text
    cardBackgroundColor: "#2c2c2c", // Darker Gray for cards
    borderColor: "#444", // Dark Gray for borders
  },
});