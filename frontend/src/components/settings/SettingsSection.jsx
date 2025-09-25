import React from 'react';
import Input from '../ui/input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import { Button } from '../ui/Button';

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
  disabled = false 
}) => {
  return (
    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
      <div className="flex-1">
        <label className="text-sm font-semibold text-gray-700 block">
          {label}
        </label>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
      />
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
