import React from 'react';
import moment from 'moment';

const ReceiptPreview = ({ data }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 max-w-md mx-auto print:max-w-full print:border-0 print:shadow-none">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Hotel Management System</h2>
        <p className="text-gray-600">123 Hotel Street, City, Country</p>
        <p className="text-gray-600">Phone: +1 234 567 8900</p>
      </div>

      <div className="border-t border-b border-gray-200 py-4 my-4">
        <h3 className="text-lg font-semibold text-gray-800">Guest Receipt</h3>
        <div className="flex justify-between mt-2">
          <span className="text-gray-600">Date:</span>
          <span>{moment().format('MMMM D, YYYY h:mm A')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Receipt #:</span>
          <span>{Math.floor(Math.random() * 1000000)}</span>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="font-medium">Guest Name:</span>
          <span>{data.guestName}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="font-medium">Room Number:</span>
          <span>{data.roomNumber}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="font-medium">Check-In:</span>
          <span>{moment(data.checkInDate).format('MMM D, YYYY h:mm A')}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="font-medium">Check-Out:</span>
          <span>{moment(data.checkOutDate).format('MMM D, YYYY h:mm A')}</span>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-semibold text-gray-800 mb-2">Charges</h4>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span>Room Charges:</span>
          <span>රු{data.baseCharge.toLocaleString()}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span>Services:</span>
          <span>රු{data.servicesCharges.toLocaleString()}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span>Taxes:</span>
          <span>රු{data.taxes.toLocaleString()}</span>
        </div>
        <div className="flex justify-between py-2 font-semibold text-lg">
          <span>Total:</span>
          <span>රු{data.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500 mt-8">
        <p>Thank you for staying with us!</p>
        <p>We hope to see you again soon.</p>
      </div>
    </div>
  );
};

export default ReceiptPreview;
