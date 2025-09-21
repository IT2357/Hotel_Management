import React from 'react';
import { useSecuritySettings } from '../../hooks/useSettings';

// Inline password utilities (moved from ../../utils/passwordValidation)
const validatePassword = (password, settings = {}) => {
  const errors = [];

  const minLength = settings.passwordMinLength || 8;
  const requireSpecialChars = settings.requireSpecialCharacters !== false;

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*(),.?":{}|<>)');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

const getPasswordStrength = (password) => {
  let score = 0;

  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;

  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

  if (/(.)\1{2,}/.test(password)) score -= 1;
  if (/123|abc|qwe/i.test(password)) score -= 1;

  const strength = Math.max(0, Math.min(5, score));

  const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
  const colors = ['#ff4444', '#ff8800', '#ffaa00', '#88cc00', '#44aa00', '#00aa44'];

  return {
    score: strength,
    level: levels[strength],
    color: colors[strength],
    percentage: (strength / 5) * 100,
  };
};

const PasswordStrengthIndicator = ({ password, showValidation = true }) => {
  const securitySettings = useSecuritySettings();
  const validation = validatePassword(password, securitySettings);
  const strength = getPasswordStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength Bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: `${strength.percentage}%`,
              backgroundColor: strength.color
            }}
          />
        </div>
        <span className="text-xs font-medium" style={{ color: strength.color }}>
          {strength.level}
        </span>
      </div>

      {/* Validation Messages */}
      {showValidation && validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <p key={index} className="text-xs text-red-600 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          ))}
        </div>
      )}

      {/* Requirements Checklist */}
      <div className="space-y-1">
        <PasswordRequirement
          met={password.length >= securitySettings.passwordMinLength}
          text={`At least ${securitySettings.passwordMinLength} characters`}
        />
        <PasswordRequirement
          met={/[A-Z]/.test(password)}
          text="One uppercase letter"
        />
        <PasswordRequirement
          met={/[a-z]/.test(password)}
          text="One lowercase letter"
        />
        <PasswordRequirement
          met={/\d/.test(password)}
          text="One number"
        />
        {securitySettings.requireSpecialCharacters && (
          <PasswordRequirement
            met={/[!@#$%^&*(),.?":{}|<>]/.test(password)}
            text="One special character"
          />
        )}
      </div>
    </div>
  );
};

const PasswordRequirement = ({ met, text }) => (
  <div className="flex items-center text-xs">
    {met ? (
      <svg className="w-3 h-3 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg className="w-3 h-3 mr-2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
      </svg>
    )}
    <span className={met ? 'text-green-600' : 'text-gray-500'}>{text}</span>
  </div>
);

export default PasswordStrengthIndicator;
