import React, { useState } from 'react';

const FoodDialog = ({ trigger, children }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 relative min-w-[300px]">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setOpen(false)}>&times;</button>
            {children}
          </div>
        </div>
      )}
    </>
  );
};

export default FoodDialog;