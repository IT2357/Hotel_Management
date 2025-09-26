import React from 'react';
import { Card, CardContent } from '../ui/Card';

const StatisticsCard = ({
  title,
  value,
  icon: Icon,
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    orange: 'from-orange-50 to-orange-100 border-orange-200',
    green: 'from-green-50 to-green-100 border-green-200',
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    red: 'from-red-50 to-red-100 border-red-200',
    yellow: 'from-yellow-50 to-yellow-100 border-yellow-200'
  };

  const iconColorClasses = {
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500'
  };

  return (
    <Card className={`bg-gradient-to-br ${colorClasses[color]} p-6 rounded-xl border shadow-sm ${className}`}>
      <CardContent className="p-0">
        <div className="flex items-center justify-between">
          <div>
            <p className={`${color === 'orange' ? 'text-orange-600' :
                          color === 'green' ? 'text-green-600' :
                          color === 'blue' ? 'text-blue-600' :
                          color === 'purple' ? 'text-purple-600' :
                          color === 'red' ? 'text-red-600' :
                          'text-yellow-600'} text-sm font-medium`}>
              {title}
            </p>
            <p className={`text-3xl font-bold ${color === 'orange' ? 'text-orange-900' :
                                              color === 'green' ? 'text-green-900' :
                                              color === 'blue' ? 'text-blue-900' :
                                              color === 'purple' ? 'text-purple-900' :
                                              color === 'red' ? 'text-red-900' :
                                              'text-yellow-900'}`}>
              {value}
            </p>
          </div>
          <div className={`p-3 rounded-full ${iconColorClasses[color]}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export { StatisticsCard };