import React, { useState } from 'react';
import { useSnackbar } from 'notistack';
import Modal from '../ui/Modal.jsx';
import Card from '../ui/Card.jsx';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Label from '../ui/Label.jsx';
import Select from '../ui/Select.jsx';
import Textarea from '../ui/Textarea.jsx';

/**
 * OverstayPaymentForm Component
 * Handles payment for overstay charges with card, bank, and cash options
 */
const OverstayPaymentForm = ({
  isOpen,
  onClose,
  overstayCharges,
  roomBasePrice,
  daysOverstay,
  onPaymentComplete,
  isProcessing
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardholderName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    bankDetails: '',
    confirmation: false
  });
  const [loading, setLoading] = useState(false);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    // Reset card fields when changing method
    setPaymentData({
      cardNumber: '',
      cardholderName: '',
      expiryMonth: '',
      expiryYear: '',
      cvv: '',
      bankDetails: '',
      confirmation: false
    });
  };

  const validatePaymentData = () => {
    if (paymentMethod === 'card') {
      if (!paymentData.cardNumber || !paymentData.cardholderName || 
          !paymentData.expiryMonth || !paymentData.expiryYear || !paymentData.cvv) {
        enqueueSnackbar('Please fill in all card details', { variant: 'warning' });
        return false;
      }
      // Basic card validation
      if (paymentData.cardNumber.replace(/\s/g, '').length < 13) {
        enqueueSnackbar('Invalid card number', { variant: 'warning' });
        return false;
      }
      if (paymentData.cvv.length < 3) {
        enqueueSnackbar('Invalid CVV', { variant: 'warning' });
        return false;
      }
    } else if (paymentMethod === 'bank') {
      if (!paymentData.bankDetails) {
        enqueueSnackbar('Please provide bank transfer details', { variant: 'warning' });
        return false;
      }
    }
    
    if (!paymentData.confirmation) {
      enqueueSnackbar('Please confirm the payment', { variant: 'warning' });
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!validatePaymentData()) {
      return;
    }

    setLoading(true);
    try {
      await onPaymentComplete({
        paymentMethod,
        paymentData,
        amount: overstayCharges
      });
    } catch (error) {
      console.error('Payment error:', error);
      enqueueSnackbar(error.message || 'Payment processing failed', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Overstay Payment Settlement"
      size="2xl"
    >
      <div className="space-y-6">
        {/* Overstay Summary */}
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
          <h3 className="font-semibold text-red-900 mb-3">Overstay Charges</h3>
          <div className="space-y-2 text-sm text-red-800">
            <div className="flex justify-between">
              <span>Room Rate:</span>
              <span className="font-mono">රු{roomBasePrice?.toLocaleString()}/night</span>
            </div>
            <div className="flex justify-between">
              <span>Days Overstayed:</span>
              <span className="font-mono">{daysOverstay} day{daysOverstay !== 1 ? 's' : ''}</span>
            </div>
            <div className="border-t border-red-200 pt-2 mt-2 flex justify-between font-semibold text-lg">
              <span>Total Overstay Charge:</span>
              <span className="font-mono">රු{overstayCharges?.toLocaleString()}</span>
            </div>
            <p className="text-xs mt-3 text-red-700">
              ⚠️ You must settle this overstay charge before checking out.
            </p>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div>
          <Label className="text-base font-semibold mb-3">Select Payment Method</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { id: 'card', label: '💳 Credit/Debit Card', desc: 'Instant Payment' },
              { id: 'bank', label: '🏦 Bank Transfer', desc: 'Manual Verification' },
              { id: 'cash', label: '💵 Pay at Reception', desc: 'At Check-out Counter' }
            ].map((method) => (
              <button
                key={method.id}
                onClick={() => handlePaymentMethodChange(method.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  paymentMethod === method.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-sm">{method.label}</div>
                <div className="text-xs text-gray-600 mt-1">{method.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Card Payment */}
        {paymentMethod === 'card' && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-green-800">
                <strong>Instant Payment:</strong> Your overstay charge will be processed immediately, and you can proceed with checkout.
              </div>
            </div>

            <div className="space-y-4 border-t border-green-200 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number *</Label>
                  <Input
                    id="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={paymentData.cardNumber}
                    onChange={(e) => setPaymentData({ ...paymentData, cardNumber: e.target.value })}
                    maxLength="19"
                  />
                </div>
                <div>
                  <Label htmlFor="cardholderName">Cardholder Name *</Label>
                  <Input
                    id="cardholderName"
                    placeholder="John Doe"
                    value={paymentData.cardholderName}
                    onChange={(e) => setPaymentData({ ...paymentData, cardholderName: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="expiryMonth">Expiry Month *</Label>
                  <Select
                    id="expiryMonth"
                    value={paymentData.expiryMonth}
                    onChange={(e) => setPaymentData({ ...paymentData, expiryMonth: e.target.value })}
                  >
                    <option value="">MM</option>
                    {Array.from({ length: 12 }, (_, i) => {
                      const month = i + 1;
                      return (
                        <option key={month} value={month.toString().padStart(2, '0')}>
                          {month.toString().padStart(2, '0')}
                        </option>
                      );
                    })}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="expiryYear">Expiry Year *</Label>
                  <Select
                    id="expiryYear"
                    value={paymentData.expiryYear}
                    onChange={(e) => setPaymentData({ ...paymentData, expiryYear: e.target.value })}
                  >
                    <option value="">YY</option>
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() + i;
                      return (
                        <option key={year} value={year.toString().slice(-2)}>
                          {year.toString().slice(-2)}
                        </option>
                      );
                    })}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cvv">CVV *</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={paymentData.cvv}
                    onChange={(e) => setPaymentData({ ...paymentData, cvv: e.target.value })}
                    maxLength="4"
                    type="password"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bank Transfer */}
        {paymentMethod === 'bank' && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-yellow-800">
                <strong>Manual Verification:</strong> Your bank transfer will be verified by the hotel staff, and checkout will be allowed once payment is confirmed.
              </div>
            </div>

            <div className="border-t border-yellow-200 pt-4">
              <Label htmlFor="bankDetails">Bank Transfer Details *</Label>
              <Textarea
                id="bankDetails"
                placeholder="Please provide your bank transfer details&#10;(e.g., Account Number, Bank Name, Transfer Reference, etc.)"
                value={paymentData.bankDetails}
                onChange={(e) => setPaymentData({ ...paymentData, bankDetails: e.target.value })}
                rows={4}
              />
              <p className="text-xs text-gray-600 mt-2">
                Hotel Bank Account Details will be provided at the reception desk.
              </p>
            </div>
          </div>
        )}

        {/* Cash Payment */}
        {paymentMethod === 'cash' && (
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-blue-800">
                <strong>Pay at Reception:</strong> You can settle the overstay charge in cash at the hotel reception desk before checking out.
              </div>
            </div>

            <div className="bg-white p-3 rounded border border-blue-100 space-y-2 text-sm">
              <p><strong>Payment Instructions:</strong></p>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                <li>Proceed to the hotel reception desk</li>
                <li>Inform the receptionist about your overstay</li>
                <li>Present a valid ID for verification</li>
                <li>Pay රු{overstayCharges?.toLocaleString()} in cash</li>
                <li>Obtain a receipt for your records</li>
              </ul>
            </div>
          </div>
        )}

        {/* Confirmation Checkbox */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={paymentData.confirmation}
              onChange={(e) => setPaymentData({ ...paymentData, confirmation: e.target.checked })}
              className="w-4 h-4 mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">
              I confirm that I understand and agree to pay the overstay charge of{' '}
              <strong>රු{overstayCharges?.toLocaleString()}</strong> for{' '}
              <strong>{daysOverstay} day{daysOverstay !== 1 ? 's' : ''}</strong> of additional stay before checking out.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-4 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading || isProcessing}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={loading || isProcessing || !paymentData.confirmation}
            className={paymentMethod === 'cash' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            {loading || isProcessing ? 'Processing...' : (
              paymentMethod === 'cash' ? 'Proceed to Reception' : 'Process Payment'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OverstayPaymentForm;
