import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import AntDesign from "react-native-vector-icons/AntDesign";
import Home from "./Home";
import Profile from "./Profile";
import Schedule from "./HomeTab/Schedule";
import ArticleList from "./HomeTab/ArticleList";
import AddArticle from "./HomeTab/AddArticle";
import ManageMyArticles from "./HomeTab/ManageMyArticles";
import EditArticle from "./HomeTab/EditArticle";
import ArticleDetail from "./HomeTab/ArticleDetail";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Home"
        component={Home}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Schedule"
        component={Schedule}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ArticleList"
        component={ArticleList}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddArticle"
        component={AddArticle}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ManageMyArticles"
        component={ManageMyArticles}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditArticle"
        component={EditArticle}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ArticleDetail"
        component={ArticleDetail}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

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
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
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
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <AntDesign name="user" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}