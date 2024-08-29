import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [isThaiLanguage, setIsThaiLanguage] = useState(false);

  const toggleLanguage = () => {
    setIsThaiLanguage((prev) => !prev);
  };

  return (
    <LanguageContext.Provider value={{ isThaiLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
