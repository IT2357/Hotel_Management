import React from "react";
import PropTypes from "prop-types";
import ModernMenuForm from "./ModernMenuForm";

const ModernAdminMenuModal = ({ open, initialValues, onSave, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4 text-primary">{initialValues && initialValues.id ? "Edit Menu Item" : "Add Menu Item"}</h2>
        <ModernMenuForm
          initialValues={initialValues}
          onSubmit={onSave}
          onCancel={onCancel}
        />
      </div>
    </div>
  );
};

ModernAdminMenuModal.propTypes = {
  open: PropTypes.bool.isRequired,
  initialValues: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

export default ModernAdminMenuModal;
