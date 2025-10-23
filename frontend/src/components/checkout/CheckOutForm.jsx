import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useSnackbar } from 'notistack';
import { 
  checkOutGuest, 
  generateReceipt as generateReceiptService,
  approveOverstayPayment
} from '../../services/checkInOutService';
import ReceiptPreview from './ReceiptPreview';

const CheckOutForm = ({ checkInRecord, onSuccess }) => {
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptData, setReceiptData] = useState(null);

  const schema = yup.object().shape({
    keyCardReturned: yup.boolean().required('Key card status is required'),
    damageReport: yup.string().when('hasDamage', {
      is: true,
      then: yup.string().required('Damage description is required when damage exists'),
    }),
    hasDamage: yup.boolean(),
    additionalCharges: yup.number().min(0).default(0),
    damageImages: yup.mixed(),
  });

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      keyCardReturned: false,
      hasDamage: false,
      additionalCharges: 0,
    }
  });

  const hasDamage = watch('hasDamage');

  const generateReceipt = async () => {
    try {
      const receipt = await generateReceiptService(checkInRecord._id);
      setReceiptData(receipt);
    } catch (error) {
      enqueueSnackbar('Error generating receipt', { variant: 'error' });
    }
  };

  const [overstayWarning, setOverstayWarning] = useState(null);

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);

      const checkOutData = {
        checkInOutId: checkInRecord._id,
        damageReport: data.hasDamage ? data.damageReport : '',
        keyCardReturned: data.keyCardReturned,
        additionalCharges: data.additionalCharges || 0
      };

      const response = await checkOutGuest(checkInRecord._id, checkOutData);
      enqueueSnackbar('Guest checked out successfully', { variant: 'success' });
      onSuccess(response);
    } catch (error) {
      if (error.response?.status === 402 && error.response?.data?.overstay) {
        // This is an overstay error - display the warning
        setOverstayWarning({
          message: error.response.data.message,
          overstay: error.response.data.overstay
        });
        enqueueSnackbar('Checkout blocked: Guest has overstayed their booking period', { 
          variant: 'warning',
          autoHideDuration: 10000
        });
      } else {
        enqueueSnackbar(error.response?.data?.message || 'Check-out failed', { variant: 'error' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Check-Out Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Guest Information</h3>
            <p className="mt-1">{checkInRecord.guest.firstName} {checkInRecord.guest.lastName}</p>
            <p className="text-sm text-gray-500">{checkInRecord.guest.email}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-gray-900">Room Information</h3>
            <p className="mt-1">Room {checkInRecord.room.number} - {checkInRecord.room.type}</p>
            <p className="text-sm text-gray-500">
              Checked in: {new Date(checkInRecord.checkInTime).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Overstay Warning */}
        {overstayWarning && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Checkout Blocked: Overstay Detected</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{overstayWarning.message}</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Days overstayed: <span className="font-semibold">{overstayWarning.overstay.daysOverstayed}</span></li>
                    <li>Amount due: <span className="font-semibold">रु{overstayWarning.overstay.amount}</span></li>
                    <li>Invoice: <span className="font-semibold">{overstayWarning.overstay.invoiceNumber || 'Pending'}</span></li>
                  </ul>
                </div>
                <div className="mt-3 flex space-x-3">
                  <button
                    type="button"
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                    onClick={() => window.alert('Please direct the guest to reception for payment processing.')}
                  >
                    Process Payment at Reception
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to mark the overstay payment as received? This will approve a payment of रु${overstayWarning.overstay.amount}.`)) {
                        try {
                          approveOverstayPayment(
                            overstayWarning.overstay.invoiceId, 
                            `Payment received and approved by ${localStorage.getItem('userName') || 'staff'}`
                          ).then(() => {
                            enqueueSnackbar('Overstay payment approved. Guest can now check out.', { variant: 'success' });
                            setOverstayWarning(null);
                          }).catch(err => {
                            enqueueSnackbar(`Error approving payment: ${err.message}`, { variant: 'error' });
                          });
                        } catch (error) {
                          enqueueSnackbar(`Error approving payment: ${error.message}`, { variant: 'error' });
                        }
                      }
                    }}
                  >
                    Mark as Paid (Staff Only)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="keyCardReturned"
              {...register('keyCardReturned')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="keyCardReturned" className="ml-2 block text-sm font-medium text-gray-700">
              Key Card Returned
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasDamage"
              {...register('hasDamage')}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="hasDamage" className="ml-2 block text-sm font-medium text-gray-700">
              Room Damage Reported
            </label>
          </div>

          {hasDamage && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Damage Description</label>
                <textarea
                  {...register('damageReport')}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                {errors.damageReport && <p className="mt-1 text-sm text-red-600">{errors.damageReport.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Damage Photos</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  {...register('damageImages')}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Additional Charges (if any)</label>
                <input
                  type="number"
                  {...register('additionalCharges')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={generateReceipt}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Generate Receipt
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Processing...' : 'Complete Check-Out'}
            </button>
          </div>
        </form>
      </div>

      {receiptData && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Receipt Preview</h2>
          <ReceiptPreview data={receiptData} />
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Print Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckOutForm;
