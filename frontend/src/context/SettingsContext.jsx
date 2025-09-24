import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import adminService from '../services/adminService';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminService.getAdminSettings();
      setSettings(response.data || {});
    } catch (err) {
      console.error('Failed to fetch settings:', err);
      // Check if it's an authentication error (403)
      if (err.status === 403 || err.response?.status === 403) {
        console.log('Admin settings require authentication, using default settings');
      } else {
        console.error('Settings fetch error:', err);
      }
      setError(err.message);
      // Set default settings if fetch fails
      setSettings({
        siteName: 'Hotel Management System',
        hotelName: 'Grand Hotel',
        currency: 'USD',
        timezone: 'UTC',
        sessionTimeout: 30,
        passwordMinLength: 8,
        maxLoginAttempts: 5,
        defaultCheckInTime: '15:00',
        defaultCheckOutTime: '11:00',
        maxGuestsPerRoom: 4,
        enableEmailNotifications: true,
        bookingConfirmations: true,
        allowGuestBooking: true,
        requireApproval: false
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSettings = useCallback(async (newSettings) => {
    try {
      const response = await adminService.updateAdminSettings(newSettings);
      setSettings(response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to update settings:', err);
      throw err;
    }
  }, []);

  const getSetting = useCallback((key, defaultValue = null) => {
    const keys = key.split('.');
    let value = settings;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }
    
    return value !== undefined ? value : defaultValue;
  }, [settings]);

  const getHotelInfo = useCallback(() => ({
    siteName: getSetting('siteName', 'Hotel Management System'),
    hotelName: getSetting('hotelName', 'Grand Hotel'),
    description: getSetting('description', 'A luxury hotel experience'),
    contactEmail: getSetting('contactEmail', 'info@grandhotel.com'),
    contactPhone: getSetting('contactPhone', '+1 (555) 123-4567'),
    address: getSetting('address', '123 Hotel Street, City, State 12345'),
    currency: getSetting('currency', 'USD'),
    timezone: getSetting('timezone', 'UTC')
  }), [getSetting]);

  const getBookingSettings = useCallback(() => ({
    allowGuestBooking: getSetting('allowGuestBooking', true),
    requireApproval: getSetting('requireApproval', false),
    maxAdvanceBooking: getSetting('maxAdvanceBooking', 365),
    defaultCheckInTime: getSetting('defaultCheckInTime', '15:00'),
    defaultCheckOutTime: getSetting('defaultCheckOutTime', '11:00'),
    maxGuestsPerRoom: getSetting('maxGuestsPerRoom', 4),
    cancellationPolicy: getSetting('cancellationPolicy', '24 hours before check-in')
  }), [getSetting]);

  const getSecuritySettings = useCallback(() => ({
    passwordMinLength: getSetting('passwordMinLength', 8),
    requireSpecialCharacters: getSetting('requireSpecialCharacters', true),
    sessionTimeout: getSetting('sessionTimeout', 30),
    maxLoginAttempts: getSetting('maxLoginAttempts', 5),
    twoFactorRequired: getSetting('twoFactorRequired', false)
  }), [getSetting]);

  const getNotificationSettings = useCallback(() => ({
    enableEmailNotifications: getSetting('enableEmailNotifications', true),
    enableSMSNotifications: getSetting('enableSMSNotifications', false),
    bookingConfirmations: getSetting('bookingConfirmations', true),
    promotionalEmails: getSetting('promotionalEmails', true),
    adminNotifications: getSetting('adminNotifications', true)
  }), [getSetting]);

  const getPaymentSettings = useCallback(() => ({
    provider: getSetting('paymentGateway.provider', 'stripe'),
    testMode: getSetting('paymentGateway.testMode', true),
    autoCapture: getSetting('paymentGateway.autoCapture', true),
    supportedCurrencies: getSetting('paymentGateway.supportedCurrencies', ['USD', 'EUR', 'GBP'])
  }), [getSetting]);

  const getRoomSettings = useCallback(() => ({
    autoAssignment: getSetting('roomSettings.autoAssignment', true),
    overbookingAllowed: getSetting('roomSettings.overbookingAllowed', false),
    housekeepingBuffer: getSetting('roomSettings.housekeepingBuffer', 30),
    minimumStay: getSetting('roomSettings.minimumStay', 1),
    maximumStay: getSetting('roomSettings.maximumStay', 30)
  }), [getSetting]);

  const getFinancialSettings = useCallback(() => ({
    taxRate: getSetting('financialSettings.taxRate', 0),
    serviceFee: getSetting('financialSettings.serviceFee', 0),
    depositRequired: getSetting('financialSettings.depositRequired', true),
    depositAmount: getSetting('financialSettings.depositAmount', 100),
    depositType: getSetting('financialSettings.depositType', 'fixed'),
    currency: getSetting('currency', 'USD')
  }), [getSetting]);

  const getCustomizationSettings = useCallback(() => ({
    theme: getSetting('customizationSettings.theme', 'default'),
    primaryColor: getSetting('customizationSettings.primaryColor', '#4F46E5'),
    secondaryColor: getSetting('customizationSettings.secondaryColor', '#7C3AED'),
    language: getSetting('customizationSettings.language', 'en'),
    dateFormat: getSetting('customizationSettings.dateFormat', 'MM/DD/YYYY'),
    timeFormat: getSetting('customizationSettings.timeFormat', '12')
  }), [getSetting]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const value = {
    settings,
    loading,
    error,
    fetchSettings,
    updateSettings,
    getSetting,
    getHotelInfo,
    getBookingSettings,
    getSecuritySettings,
    getNotificationSettings,
    getPaymentSettings,
    getRoomSettings,
    getFinancialSettings,
    getCustomizationSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export default SettingsContext;
