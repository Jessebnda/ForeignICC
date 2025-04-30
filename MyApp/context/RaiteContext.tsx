import React, { createContext, useContext, useState } from 'react';

interface RaiteContextType {
  hasActiveRaiteRequest: boolean;
  setHasActiveRaiteRequest: (value: boolean) => void;
}

const RaiteContext = createContext<RaiteContextType>({
  hasActiveRaiteRequest: false,
  setHasActiveRaiteRequest: () => {},
});

export const useRaite = () => useContext(RaiteContext);

export const RaiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasActiveRaiteRequest, setHasActiveRaiteRequest] = useState(false);

  return (
    <RaiteContext.Provider value={{ hasActiveRaiteRequest, setHasActiveRaiteRequest }}>
      {children}
    </RaiteContext.Provider>
  );
};
