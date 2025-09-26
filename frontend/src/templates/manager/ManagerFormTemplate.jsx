import React from 'react';
import { 
  ManagerPageHeader, 
  ManagerPageLoader, 
  ManagerErrorState 
} from '../../components/manager';

const ManagerFormTemplate = ({
  title,
  subtitle,
  icon,
  loading = false,
  error = null,
  onRefresh = null,
  actions = [],
  
  // Form props
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  submitDisabled = false,
  submitLoading = false,
  
  children
}) => {
  if (loading) {
    return <ManagerPageLoader message="Loading form..." />;
  }

  if (error) {
    return (
      <ManagerErrorState
        title="Failed to Load Form"
        message="We couldn't load the form. Please try again."
        error={error}
        onRetry={onRefresh}
      />
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <div className="min-h-full">
      {/* Page Header */}
      <ManagerPageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        loading={loading}
        onRefresh={onRefresh}
        actions={actions}
      />

      {/* Page Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <form onSubmit={handleSubmit}>
              {/* Form Content */}
              <div className="p-6">
                {children}
              </div>

              {/* Form Actions */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 rounded-b-lg">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={submitLoading}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {cancelLabel}
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={submitDisabled || submitLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {submitLoading && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerFormTemplate;