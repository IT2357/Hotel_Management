import React, { useEffect } from 'react';
import TaskManagement from '../../components/tasks/TaskAssignment';

export default function TaskManagementPage() {
  useEffect(() => {
    document.title = 'Task Management | Hotel Management';
    return () => {
      document.title = 'Hotel Management';
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <TaskManagement />
    </div>
  );
}
