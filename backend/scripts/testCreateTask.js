import axios from 'axios';

const testCreateTask = async () => {
  try {
    console.log('Testing task creation...');

    // First, login as manager to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'manager@hotel.com',
      password: 'manager123'
    });

    const token = loginResponse.data.data.token;
    console.log('Login successful, token received');
    console.log('Login response:', loginResponse.data);
    console.log('Token:', token);

    // Now test creating a task
    const taskData = {
      title: 'Test Task Creation',
      description: 'This is a test task to verify the create functionality works',
      type: 'general',
      department: 'Kitchen Staff',
      priority: 'medium',
      location: 'Kitchen Area',
      instructions: 'Please handle this test task promptly'
    };

    const createResponse = await axios.post('http://localhost:5000/api/task-management/tasks', taskData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Task creation successful!');
    console.log('Created task:', createResponse.data);

  } catch (error) {
    console.error('Task creation failed:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Full error:', error.response?.data);
    console.error('Network error:', error.code);
    console.error('Full error object:', error);
  }
};

testCreateTask();