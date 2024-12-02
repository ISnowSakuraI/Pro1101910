import React, { createContext, useContext, useState } from "react";

const LanguageContext = createContext();

const useLanguage = () => useContext(LanguageContext);

const LanguageProvider = ({ children }) => {
  const [isThaiLanguage, setIsThaiLanguage] = useState(true);

  const toggleLanguage = () => {
    setIsThaiLanguage((prevState) => !prevState);
  };

  return (
    <LanguageContext.Provider value={{ isThaiLanguage, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export { LanguageProvider, useLanguage };
