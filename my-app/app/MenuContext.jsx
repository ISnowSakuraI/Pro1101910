import React, { createContext, useContext, useState } from 'react';

const MenuContext = createContext();

export const useMenu = () => useContext(MenuContext);

export const MenuProvider = ({ children }) => {
  const [onSelectMenu, setOnSelectMenu] = useState(() => () => {});

  return (
    <MenuContext.Provider value={{ onSelectMenu, setOnSelectMenu }}>
      {children}
    </MenuContext.Provider>
  );
};