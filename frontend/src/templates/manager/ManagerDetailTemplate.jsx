import React from 'react';
import { 
  ManagerPageHeader, 
  ManagerPageLoader, 
  ManagerErrorState 
} from '../../components/manager';

const ManagerDetailTemplate = ({
  title,
  subtitle,
  icon,
  loading = false,
  error = null,
  onRefresh = null,
  actions = [],
  
  // Detail sections
  sections = [],
  
  children
}) => {
  if (loading) {
    return <ManagerPageLoader message="Loading details..." />;
  }

  if (error) {
    return (
      <ManagerErrorState
        title="Failed to Load Details"
        message="We couldn't load the details. Please try again."
        error={error}
        onRetry={onRefresh}
      />
    );
  }

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
        <div className="max-w-6xl mx-auto">
          {/* Detail Sections */}
          {sections.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {sections.map((section, index) => (
                <div key={index} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                  {section.title && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {section.title}
                    </h3>
                  )}
                  
                  {section.items && (
                    <dl className="space-y-3">
                      {section.items.map((item, itemIndex) => (
                        <div key={itemIndex}>
                          <dt className="text-sm font-medium text-gray-600">
                            {item.label}
                          </dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {item.render ? item.render(item.value) : item.value}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}
                  
                  {section.content && section.content}
                </div>
              ))}
            </div>
          )}

          {/* Custom Content */}
          {children && (
            <div className="space-y-6">
              {children}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagerDetailTemplate;