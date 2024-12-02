import React, { createContext, useContext, useState } from "react";

const MenuContext = createContext();

const useMenu = () => useContext(MenuContext);

const MenuProvider = ({ children }) => {
  const [onSelectMenu, setOnSelectMenu] = useState(() => () => {});

  return (
    <MenuContext.Provider value={{ onSelectMenu, setOnSelectMenu }}>
      {children}
    </MenuContext.Provider>
  );
};

export { MenuProvider, useMenu };
