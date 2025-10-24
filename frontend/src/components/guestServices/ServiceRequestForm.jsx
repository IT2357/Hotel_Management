import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import axios from 'axios';
import { useSnackbar } from 'notistack';

const requestTypes = [
  'room_service',
  'housekeeping',
  'concierge',
  'transport',
  'maintenance',
  'laundry',
  'wakeup_call',
  'dining',
  'spa',
  'other'
];

const ServiceRequestForm = ({ guest, room, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachments, setAttachments] = useState([]);

  const schema = yup.object().shape({
    requestType: yup.string().required('Request type is required').oneOf(requestTypes),
    title: yup.string().required('Title is required').max(100),
    description: yup.string().required('Description is required').max(500),
    guestLocation: yup.string().required('Location is required'),
    isAnonymous: yup.boolean(),
    specialInstructions: yup.string().max(200)
  });

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      requestType: 'room_service',
      isAnonymous: false
    }
  });

  const handleAttachmentUpload = (e) => {
    setAttachments(Array.from(e.target.files));
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      
      const formData = new FormData();
      
      // Convert checkbox value to string 'true' or 'false'
      const isAnonymous = data.isAnonymous === true || data.isAnonymous === 'true';
      
      // Add all fields as strings
      formData.append('requestType', String(data.requestType || ''));
      formData.append('title', String(data.title || ''));
      formData.append('description', String(data.description || ''));
      formData.append('guestLocation', String(data.guestLocation || ''));
      formData.append('isAnonymous', String(isAnonymous));
      
      // Add optional fields
      if (data.specialInstructions) {
        formData.append('specialInstructions', String(data.specialInstructions));
      }
      
      // Add guest and room if available (server also derives from active check-in)
      const guestId = guest?.userId || guest?._id;
      if (guestId && !isAnonymous) {
        formData.append('guest', String(guestId));
      }
      // Always try to pass room to aid backend population
      if (room?._id) {
        formData.append('room', String(room._id));
      }
      
      // Add attachments if any
      if (attachments && attachments.length > 0) {
        attachments.forEach((file, index) => {
          if (file) {
            formData.append(`attachments`, file);
          }
        });
      }

      console.log('Submitting form data:', {
        requestType: data.requestType,
        title: data.title,
        description: data.description,
        guestLocation: data.guestLocation,
        isAnonymous,
        guestId: guestId,
        roomId: room?._id,
        attachmentCount: attachments?.length || 0
      });

      const response = await axios.post('/api/guest-services/request', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        withCredentials: true
      });
      
      enqueueSnackbar('Service request submitted successfully', { variant: 'success' });
      if (onSuccess) onSuccess(response.data);
    } catch (error) {
      enqueueSnackbar(error.response?.data?.message || 'Request failed', { variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Request Type</label>
          <select
            {...register('requestType')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            {requestTypes.map(type => (
              <option key={type} value={type}>
                {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </option>
            ))}
          </select>
          {errors.requestType && <p className="mt-1 text-sm text-red-600">{errors.requestType.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            {...register('title')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
        {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Your Location</label>
          <input
            type="text"
            {...register('guestLocation')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          {errors.guestLocation && <p className="mt-1 text-sm text-red-600">{errors.guestLocation.message}</p>}
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isAnonymous"
            {...register('isAnonymous')}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isAnonymous" className="ml-2 block text-sm text-gray-700">
            Submit Anonymously
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
        <textarea
          {...register('specialInstructions')}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Attachments (if any)</label>
        <input
          type="file"
          accept="image/*, .pdf"
          multiple
          onChange={handleAttachmentUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <div className="mt-2 grid grid-cols-3 gap-2">
          {attachments.map((file, index) => (
            <div key={index} className="relative group">
              {file?.type?.startsWith?.('image/') ? (
                <img 
                  src={URL.createObjectURL(file)} 
                  alt={file.name || 'Preview'} 
                  className="h-24 w-full object-cover rounded-md" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZpbGUtaW1hZ2UiPjcmIzQ1OzxwYXRoIGQ9Ik0xNC41IDJINmEyIDIgMCAwIDAtMiAydDEuMTcgMS45OTMiLz48cGF0aCBkPSJNMTggMThhMiAyIDAgMCAxLTIgMkg0YTIgMiAwIDAgMS0yLTJWNWEyIDIgMCAwIDEgMi0yaEkuNWMuNDUyIDAgLjg0OS4xNSAxLjE4My40MjRMMTMuNSA4aDVBMS45OTggMS45OTggMCAwIDEgMTggMTBaIi8+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMiIvPjxwYXRoIGQ9Im0yMS43IDIxLjM5MS0xLjNjLS4yLjI5OS0uNS41ODMtLjkxLjgxMy0uNDMuMjM5LS45Ni4zNDYtMSLjU5LjM0NnMtMS4xNi0uMTA3LTE41OS0uMzQ2Yy0uNDItLjIzLS43Mi0uNTE0LS45MS0uODEzLS4xOS0uMy0uzYtLjYyMy0uNjktLjg1NS0uMjY1LS41ODMtLjQxMi0xLjI3LS40MTItMi4xM3MuMTQ3LTEuNTQ3LjQxMi0yLjEzYy4wOS0uMjMyLjUtLjU1NS42OS0uODU1LjE5LS4zLjQ5LS41ODMuOTEtLjgxM1MxNS4zNCAxMyAxNS45NyAxM3MxLjE2LjEwNyAxLjU5LjM0NmMuNDMuMjMuNzMuNTE0LjkxLjgxMy4xOS4zLjMzLjYyMy40Mi44NTUuMjY1LjU4My40MSAxLjI3LjQxIDIuMTNzLS4xNDUgMS41NDctLjQxIDIuMTNjLS4wOS4yMzItLjIzLjU1NS0uNDIuODU1WiIvPjwvc3ZnPg==';
                  }}
                />
              ) : (
                <div className="h-24 flex items-center justify-center bg-gray-100 rounded-md p-2">
                  <span className="text-xs text-gray-500 text-center break-all">{file?.name || 'File'}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Request'}
        </button>
      </div>
    </form>
  );
};

export default ServiceRequestForm;
