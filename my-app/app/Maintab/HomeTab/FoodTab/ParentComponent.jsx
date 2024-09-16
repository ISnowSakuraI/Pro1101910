// ParentComponent.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import MenuList from "./MenuList";

const Stack = createStackNavigator();

export default function ParentComponent() {
  const handleSelectMenu = (selectedMenus) => {
    console.log("Selected Menus:", selectedMenus);
    // Handle the selected menus here
  };

  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="MenuList">
          {(props) => <MenuList {...props} onSelectMenu={handleSelectMenu} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}