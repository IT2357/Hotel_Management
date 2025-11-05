import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { checkInGuest } from '../../services/checkInOutService';

const CheckInForm = ({ booking, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [assignedKeyCard, setAssignedKeyCard] = useState(null);

  const schema = yup.object().shape({
    roomId: yup.string().required('Room assignment is required'),
    documentType: yup.string().required('Document type is required'),
    frontImage: yup.mixed().required('Front image of the document is required'),
    backImage: yup.mixed(),
    emergencyContactName: yup.string().required('Emergency contact name is required'),
    emergencyContactPhone: yup.string().required('Emergency contact phone is required'),
  });

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      guestId: booking?.guest?._id,
      bookingId: booking?._id,
      roomId: booking?.room?._id,
    }
  });

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key !== 'frontImage' && key !== 'backImage') {
          formData.append(key, data[key]);
        }
      });
      formData.append('frontImage', data.frontImage[0]);
      if (data.backImage && data.backImage[0]) {
        formData.append('backImage', data.backImage[0]);
      }

      const response = await checkInGuest(formData);

      // Store the assigned key card information
      if (response.data.assignedKeyCard) {
        setAssignedKeyCard(response.data.assignedKeyCard);
        enqueueSnackbar(`Guest checked in successfully! Key Card: ${response.data.assignedKeyCard.cardNumber}`, { variant: 'success' });
      } else {
        enqueueSnackbar('Guest checked in successfully', { variant: 'success' });
      }

      onSuccess(response.data);
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Check-in failed', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Room Assignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Room Number</label>
          <select
            {...register('roomId')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Room</option>
            {/* Rooms would be populated from API */}
          </select>
          {errors.roomId && <p className="mt-1 text-sm text-red-600">{errors.roomId.message}</p>}
        </div>
      </div>

      {/* Document Verification */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Document Verification</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Document Type</label>
            <select
              {...register('documentType')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Document Type</option>
              <option value="passport">Passport</option>
              <option value="id">National ID</option>
              <option value="driver_license">Driver's License</option>
              <option value="other">Other</option>
            </select>
            {errors.documentType && <p className="mt-1 text-sm text-red-600">{errors.documentType.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Document Front</label>
            <input
              type="file"
              accept="image/*"
              {...register('frontImage')}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            {errors.frontImage && <p className="mt-1 text-sm text-red-600">{errors.frontImage.message}</p>}
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Document Back (if applicable)</label>
            <input
              type="file"
              accept="image/*"
              {...register('backImage')}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Guest Preferences */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Guest Preferences</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="roomService"
              {...register('roomService')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="roomService" className="ml-2 block text-sm text-gray-700">
              Room Service Access
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Housekeeping Schedule</label>
            <select
              {...register('housekeeping')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
              <option value="both">Both</option>
              <option value="none">None</option>
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="doNotDisturb"
              {...register('doNotDisturb')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="doNotDisturb" className="ml-2 block text-sm text-gray-700">
              Do Not Disturb
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Special Requests</label>
            <textarea
              {...register('specialRequests')}
              rows={2}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              type="text"
              {...register('emergencyContactName')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.emergencyContactName && <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Relationship</label>
            <input
              type="text"
              {...register('emergencyContactRelationship')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              {...register('emergencyContactPhone')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.emergencyContactPhone && <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone.message}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
            <input
              type="email"
              {...register('emergencyContactEmail')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Processing...' : 'Complete Check-In'}
        </button>
      </div>

      {/* Assigned Key Card Display */}
      {assignedKeyCard && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <h4 className="text-lg font-medium text-green-800 mb-2">✅ Check-In Successful!</h4>
          <div className="bg-white p-3 rounded border">
            <p className="text-sm text-gray-600">Assigned Key Card:</p>
            <p className="text-xl font-bold text-green-600">{assignedKeyCard.cardNumber}</p>
            <p className="text-sm text-gray-500 mt-1">
              Valid until: {new Date(assignedKeyCard.expirationDate).toLocaleDateString()}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Please hand this key card to the guest. It will automatically expire at check-out.
            </p>
          </div>
        </div>
      )}
    </form>
  );
};

export default CheckInForm;
