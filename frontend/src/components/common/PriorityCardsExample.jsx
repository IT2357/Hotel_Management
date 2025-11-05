import React from 'react';
import PriorityCard from './PriorityCard';

/**
 * Example usage of PriorityCard component
 * Use this in Reports, Dashboard, or any page that needs priority/alert indicators
 */
const PriorityCardsExample = () => {
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">
            Priority Cards - Modern Light Theme
          </h1>
          <p className="text-gray-600">
            Redesigned alert/priority indicator cards with modern styling
          </p>
        </div>

        {/* Priority Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PriorityCard
            priority="critical"
            count={0}
            label="Critical"
            onClick={() => console.log('Critical clicked')}
          />
          
          <PriorityCard
            priority="high"
            count={0}
            label="High"
            onClick={() => console.log('High clicked')}
          />
          
          <PriorityCard
            priority="medium"
            count={0}
            label="Medium"
            onClick={() => console.log('Medium clicked')}
          />
          
          <PriorityCard
            priority="low"
            count={0}
            label="Low"
            onClick={() => console.log('Low clicked')}
          />
        </div>

        {/* Example with data */}
        <div className="mt-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">
            With Sample Data
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PriorityCard
              priority="critical"
              count={3}
              label="Critical Issues"
            />
            
            <PriorityCard
              priority="high"
              count={7}
              label="High Priority"
            />
            
            <PriorityCard
              priority="medium"
              count={12}
              label="Medium Priority"
            />
            
            <PriorityCard
              priority="low"
              count={25}
              label="Low Priority"
            />
          </div>
        </div>

        {/* Alternative labels */}
        <div className="mt-12">
          <h2 className="text-2xl font-black text-gray-900 mb-6">
            Alternative Use Cases
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <PriorityCard
              priority="critical"
              count={2}
              label="Urgent Tasks"
            />
            
            <PriorityCard
              priority="high"
              count={5}
              label="Pending Alerts"
            />
            
            <PriorityCard
              priority="medium"
              count={8}
              label="In Progress"
            />
            
            <PriorityCard
              priority="low"
              count={15}
              label="Completed"
            />
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-12 p-6 bg-white rounded-2xl border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            💡 How to Use
          </h3>
          <div className="space-y-3 text-gray-700">
            <p><strong>Import:</strong></p>
            <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
{`import PriorityCard from '@/components/common/PriorityCard';`}
            </pre>
            
            <p className="mt-4"><strong>Basic Usage:</strong></p>
            <pre className="bg-gray-50 p-3 rounded-lg text-sm overflow-x-auto">
{`<PriorityCard
  priority="critical"  // critical, high, medium, low
  count={5}
  label="Critical Alerts"
  onClick={() => handleClick()}
/>`}
            </pre>

            <p className="mt-4"><strong>Props:</strong></p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><code className="bg-gray-100 px-2 py-1 rounded">priority</code>: 'critical' | 'high' | 'medium' | 'low'</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">count</code>: number</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">label</code>: string (optional, defaults to priority.toUpperCase())</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">onClick</code>: function (optional)</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">className</code>: string (optional)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriorityCardsExample;
