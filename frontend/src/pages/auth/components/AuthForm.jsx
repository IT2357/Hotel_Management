//src/pages/auth/components/AuthForm.jsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PasswordStrength from './PasswordStrength';
import Alert from '../../../components/common/Alert';

export default function AuthForm({
  fields,
  onSubmit,
  submitText = 'Submit',
  loading = false
}) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [serverError, setServerError] = useState(null);

  const handleFormSubmit = async (data) => {
    setServerError(null);
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {fields
        .filter((field) => field.type !== 'hidden')
        .map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
            </label>
            {field.type === 'password' ? (
              <>
                <input
                  type="password"
                  {...register(field.name, field.validation)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                <PasswordStrength password={watch(field.name)} />
              </>
            ) : (
              <input
                type={field.type || 'text'}
                {...register(field.name, field.validation)}
                className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${
                  field.readOnly ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                readOnly={field.readOnly}
                defaultValue={field.defaultValue}
              />
            )}
            {errors[field.name] && (
              <p className="mt-1 text-sm text-red-600">{errors[field.name].message}</p>
            )}
          </div>
        ))}
        
      {fields
        .filter((field) => field.type === 'hidden')
        .map((field) => (
          <input
            key={field.name}
            type="hidden"
            {...register(field.name)}
            defaultValue={field.defaultValue}
          />
        ))}


      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {loading ? 'Processing...' : submitText}
      </button>
    </form>
  );
}
