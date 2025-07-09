//src/components/auth/AuthForm.jsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PasswordStrength from './PasswordStrength';

export default function AuthForm({
  fields,
  onSubmit,
  submitText = 'Submit',
  loading = false
}) {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [serverError, setServerError] = useState('');

  const handleFormSubmit = async (data) => {
    try {
      setServerError('');
      await onSubmit(data);
    } catch (error) {
      setServerError(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {fields.map((field) => (
        <div key={field.name}>
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
          </label>
          {field.type === 'password' ? (
            <>
              <input
                type="password"
                {...register(field.name, field.validation)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
              <PasswordStrength password={watch(field.name)} />
            </>
          ) : (
            <input
              type={field.type || 'text'}
              {...register(field.name, field.validation)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              readOnly={field.readOnly}
            />
          )}
          {errors[field.name] && (
            <p className="mt-1 text-sm text-red-600">{errors[field.name].message}</p>
          )}
        </div>
      ))}
      
      {serverError && (
        <div className="text-red-500 text-sm">{serverError}</div>
      )}
      
      <button
        type="submit"
        disabled={loading}
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        {loading ? 'Processing...' : submitText}
      </button>
    </form>
  );
}