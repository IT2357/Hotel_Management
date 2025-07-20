//src/pages/auth/components/PasswordStrength.jsx

export default function PasswordStrength({ password }) {
    const getStrength = (pass) => {
      if (!pass) return 0;
      let strength = 0;
      if (pass.length > 5) strength++;
      if (pass.length > 8) strength++;
      if (/[A-Z]/.test(pass)) strength++;
      if (/[0-9]/.test(pass)) strength++;
      if (/[^A-Za-z0-9]/.test(pass)) strength++;
      return Math.min(strength, 5);
    };
  
    const strength = getStrength(password);
    const strengthText = ['Very Weak', 'Weak', 'Okay', 'Good', 'Strong', 'Very Strong'][strength];
    const strengthColor = [
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-green-700'
    ][strength];
  
    return (
      <div className="mt-1">
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full ${i < strength ? strengthColor : 'bg-gray-200'}`}
            />
          ))}
        </div>
        {password && (
          <p className="text-xs mt-1 text-gray-500">
            Strength: <span className="font-medium">{strengthText}</span>
          </p>
        )}
      </div>
    );
  }