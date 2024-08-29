import React from "react";
import { ThemeProvider } from "../app/ThemeContext";
import { LanguageProvider } from "../app/LanguageContext";
import MainNavigator from "../app/Maintab/MainIndex";
import { useFonts } from "expo-font";

export default function App() {
  const [fontsLoaded] = useFonts({
    "NotoSansThai-Regular": require("../assets/fonts/NotoSansThai-Regular.ttf"),
  });
  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <MainNavigator />
      </LanguageProvider>
    </ThemeProvider>
  );
}
