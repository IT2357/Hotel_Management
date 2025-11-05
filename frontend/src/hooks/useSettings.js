import { useSettings as useSettingsContext } from '../context/SettingsContext';

// Re-export the hook for convenience
export const useSettings = useSettingsContext;

// Specific hooks for different setting categories
export const useHotelInfo = () => {
  const { getHotelInfo } = useSettingsContext();
  return getHotelInfo();
};

export const useBookingSettings = () => {
  const { getBookingSettings } = useSettingsContext();
  return getBookingSettings();
};

export const useSecuritySettings = () => {
  const { getSecuritySettings } = useSettingsContext();
  return getSecuritySettings();
};

export const useNotificationSettings = () => {
  const { getNotificationSettings } = useSettingsContext();
  return getNotificationSettings();
};

export const usePaymentSettings = () => {
  const { getPaymentSettings } = useSettingsContext();
  return getPaymentSettings();
};

export const useRoomSettings = () => {
  const { getRoomSettings } = useSettingsContext();
  return getRoomSettings();
};

export const useFinancialSettings = () => {
  const { getFinancialSettings } = useSettingsContext();
  return getFinancialSettings();
};

export const useCustomizationSettings = () => {
  const { getCustomizationSettings } = useSettingsContext();
  return getCustomizationSettings();
};

// Utility hook to get a specific setting value
export const useSetting = (key, defaultValue = null) => {
  const { getSetting } = useSettingsContext();
  return getSetting(key, defaultValue);
};

export default useSettings;
