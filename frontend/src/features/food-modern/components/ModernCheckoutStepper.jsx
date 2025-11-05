import React, { useState } from "react";
import { useModernCart } from "../context/ModernCartContext";

const steps = ["Cart Review", "Guest Details", "Order Type", "Payment"];

const ModernCheckoutStepper = () => {
  const { cart, dispatch } = useModernCart();
  const [step, setStep] = useState(0);
  const [guest, setGuest] = useState({ name: "", phone: "" });
  const [orderType, setOrderType] = useState("dine-in");
  const [table, setTable] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [paying, setPaying] = useState(false);
  const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  // Simulate payment
  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      setPaying(false);
      dispatch({ type: "CLEAR" });
      setStep(0);
      alert("Order placed! (Simulated)");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white text-[#4A4A4A] p-4 max-w-xl mx-auto">
      <div className="flex items-center mb-6">
        {steps.map((label, idx) => (
          <React.Fragment key={label}>
            <div className={`flex-1 text-center ${step === idx ? "text-primary font-bold" : "text-gray-400"}`}>{label}</div>
            {idx < steps.length - 1 && <div className="w-8 h-1 bg-gray-200 mx-1 rounded" />}
          </React.Fragment>
        ))}
      </div>
      {step === 0 && (
        <div>
          <h2 className="text-lg font-bold mb-2">Cart Review</h2>
          {cart.items.length === 0 ? <div>Cart is empty.</div> : (
            <ul className="divide-y">
              {cart.items.map(item => (
                <li key={item.id} className="py-2 flex justify-between">
                  <span>{item.name_eng} × {item.qty}</span>
                  <span>LKR {item.price * item.qty}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="text-right font-bold mt-2">Subtotal: LKR {subtotal}</div>
        </div>
      )}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-bold mb-2">Guest Details</h2>
          <input
            className="border rounded px-3 py-2 w-full mb-2"
            placeholder="Name"
            value={guest.name}
            onChange={e => setGuest(g => ({ ...g, name: e.target.value }))}
          />
          <input
            className="border rounded px-3 py-2 w-full"
            placeholder="Phone"
            value={guest.phone}
            onChange={e => setGuest(g => ({ ...g, phone: e.target.value }))}
          />
        </div>
      )}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-bold mb-2">Order Type</h2>
          <div className="flex gap-4 mb-2">
            <button
              className={`px-4 py-2 rounded ${orderType === "dine-in" ? "bg-primary text-white" : "bg-gray-100"}`}
              onClick={() => setOrderType("dine-in")}
            >Dine-In</button>
            <button
              className={`px-4 py-2 rounded ${orderType === "takeaway" ? "bg-primary text-white" : "bg-gray-100"}`}
              onClick={() => setOrderType("takeaway")}
            >Takeaway</button>
          </div>
          {orderType === "dine-in" ? (
            <input
              className="border rounded px-3 py-2 w-full"
              placeholder="Table Number (optional)"
              value={table}
              onChange={e => setTable(e.target.value)}
            />
          ) : (
            <input
              className="border rounded px-3 py-2 w-full"
              placeholder="Pickup Time (e.g. 7:30pm)"
              value={pickupTime}
              onChange={e => setPickupTime(e.target.value)}
            />
          )}
        </div>
      )}
      {step === 3 && (
        <div>
          <h2 className="text-lg font-bold mb-2">Payment</h2>
          <div className="mb-2">Subtotal: <span className="font-bold">LKR {subtotal}</span></div>
          <button
            className="w-full bg-primary text-white py-2 rounded text-lg font-bold disabled:opacity-50"
            onClick={handlePay}
            disabled={paying}
          >{paying ? "Processing..." : "Pay (Simulated)"}</button>
        </div>
      )}
      <div className="flex justify-between mt-6">
        <button
          className="px-4 py-2 rounded bg-gray-100"
          onClick={prev}
          disabled={step === 0}
        >Back</button>
        <button
          className="px-4 py-2 rounded bg-primary text-white disabled:opacity-50"
          onClick={next}
          disabled={step === steps.length - 1 || (step === 0 && cart.items.length === 0)}
        >Next</button>
      </div>
    </div>
  );
};

export default ModernCheckoutStepper;
