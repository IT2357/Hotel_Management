import React from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

const SettingsSection = ({ 
  title, 
  description, 
  icon, 
  children, 
  onSave, 
  loading = false,
  showSaveButton = true 
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{icon}</span>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <p className="text-gray-600">{description}</p>
        </div>
      </div>
      
      <div className="space-y-6">
        {children}
      </div>
      
      {showSaveButton && (
        <div className="flex justify-end pt-6 border-t border-gray-200">
          <Button
            onClick={onSave}
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {loading ? 'Saving...' : `Save ${title}`}
          </Button>
        </div>
      )}
    </div>
  );
};

const SettingsGrid = ({ children, cols = 2 }) => {
  const colsClass = cols === 1 ? 'grid-cols-1' : cols === 3 ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2';
  return (
    <div className={`grid ${colsClass} gap-6`}>
      {children}
    </div>
  );
};

const SettingsField = ({ 
  label, 
  description, 
  required = false, 
  children 
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
      {children}
    </div>
  );
};

const SettingsToggle = ({ 
  label, 
  description, 
  checked, 
  onChange, 
  disabled = false,
  children // Support for nested content
}) => {
  return (
    <div className="space-y-3">
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all duration-200 ${
          checked 
            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-300 shadow-sm' 
            : 'bg-gray-50 border-2 border-transparent hover:border-gray-300 hover:bg-gray-100'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex-1 pointer-events-none select-none">
          <label className={`text-sm font-semibold block ${
            checked ? 'text-indigo-700' : 'text-gray-700'
          }`}>
            {label}
          </label>
          {description && (
            <p className={`text-xs mt-1 ${
              checked ? 'text-indigo-600' : 'text-gray-500'
            }`}>
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {checked && (
            <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full animate-fade-in">
              Enabled
            </span>
          )}
          <input
            type="checkbox"
            checked={checked}
            onChange={() => {}} // Handled by parent onClick
            disabled={disabled}
            className="h-5 w-5 text-indigo-600 focus:ring-2 focus:ring-indigo-500 border-gray-300 rounded pointer-events-none transition-all"
          />
        </div>
      </div>
      
      {/* Conditional content rendering with animation */}
      {children && checked && (
        <div className="ml-4 pl-6 border-l-4 border-indigo-300 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 p-4 rounded-r-xl animate-slide-in">
          {children}
        </div>
      )}
    </div>
  );
};

const SettingsCard = ({ title, children, className = "" }) => {
  return (
    <div className={`bg-gray-50 rounded-xl p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
};

export { 
  SettingsSection, 
  SettingsGrid, 
  SettingsField, 
  SettingsToggle, 
  SettingsCard 
};
export default SettingsSection;
