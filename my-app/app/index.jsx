import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import Login from "./Login";
import Register from "./Register";
import MainIndex from "./Maintab/MainIndex";
import ForgotPassword from "./ForgotPassword";
import { useFonts } from "expo-font";

const Stack = createStackNavigator();

export default function Index() {
  const [fontsLoaded] = useFonts({
    'NotoSansThai-Regular': require('../assets/fonts/NotoSansThai-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={Login}
        options={{
          headerShown: false, // ซ่อน Header
        }}
      />
      <Stack.Screen
        name="Register"
        component={Register}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="MainIndex"
        component={MainIndex}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPassword}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}