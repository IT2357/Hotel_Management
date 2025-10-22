import React, { createContext, useContext, useState } from "react";

const ModernFeatureFlagContext = createContext();

export const ModernFeatureFlagProvider = ({ children }) => {
  // Toggle to enable/disable modern food features
  const [modernFoodEnabled, setModernFoodEnabled] = useState(true);
  return (
    <ModernFeatureFlagContext.Provider value={{ modernFoodEnabled, setModernFoodEnabled }}>
      {children}
    </ModernFeatureFlagContext.Provider>
  );
};

export const useModernFeatureFlag = () => useContext(ModernFeatureFlagContext);
