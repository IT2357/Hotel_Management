// Test the new task accept and complete endpoints
import fetch from 'node-fetch';

const API_URL = 'http://localhost:5001/api';

// You'll need to replace this with a valid staff token
const STAFF_TOKEN = 'your_staff_token_here';

async function testTaskWorkflow() {
  try {
    console.log('🧪 Testing Task Workflow...\n');

    // 1. Get available tasks
    console.log('📋 Fetching available tasks...');
    const tasksResponse = await fetch(`${API_URL}/staff/tasks?status=in_progress`, {
      headers: {
        'Authorization': `Bearer ${STAFF_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const tasksData = await tasksResponse.json();
    console.log('✅ Available tasks:', tasksData.data?.tasks?.length || 0);

    if (!tasksData.data?.tasks?.[0]) {
      console.log('⚠️  No tasks available for testing');
      return;
    }

    const testTaskId = tasksData.data.tasks[0]._id;
    console.log(`\n📝 Using task ID: ${testTaskId}`);

    // 2. Accept the task
    console.log('\n🤝 Accepting task...');
    const acceptResponse = await fetch(`${API_URL}/staff/tasks/${testTaskId}/accept`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STAFF_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const acceptData = await acceptResponse.json();
    
    if (acceptData.success) {
      console.log('✅ Task accepted successfully!');
      console.log('   Status:', acceptData.data.status);
      console.log('   Accepted by:', acceptData.data.acceptedBy?.name);
      console.log('   Accepted at:', acceptData.data.acceptedAt);
    } else {
      console.log('❌ Failed to accept task:', acceptData.message);
      return;
    }

    // 3. Complete the task
    console.log('\n✨ Completing task...');
    const completeResponse = await fetch(`${API_URL}/staff/tasks/${testTaskId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STAFF_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    const completeData = await completeResponse.json();
    
    if (completeData.success) {
      console.log('✅ Task completed successfully!');
      console.log('   Status:', completeData.data.status);
      console.log('   Completed by:', completeData.data.completedBy?.name);
      console.log('   Completed at:', completeData.data.completedAt);
      console.log('   Grace period remaining:', completeData.data.timeRemaining, 'seconds');
      console.log('   Can edit:', completeData.data.canEdit);
    } else {
      console.log('❌ Failed to complete task:', completeData.message);
    }

    console.log('\n✅ Workflow test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Instructions
console.log(`
╔════════════════════════════════════════════════════════════╗
║         Task Workflow Test Script                         ║
╚════════════════════════════════════════════════════════════╝

To run this test:

1. Get a staff user token:
   - Login as a staff user
   - Copy the authentication token

2. Update the STAFF_TOKEN variable in this file

3. Run: node testTaskWorkflow.js

4. The script will:
   ✓ Fetch available in_progress tasks
   ✓ Accept a task
   ✓ Complete the task
   ✓ Show the complete workflow

════════════════════════════════════════════════════════════

`);

// Uncomment to run the test
// testTaskWorkflow();
