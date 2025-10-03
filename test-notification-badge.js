// Test script to create a report notification immediately
// You can run this in your browser console or call the API directly

const testReportNotification = async () => {
  try {
    const response = await fetch('http://localhost:5000/api/notifications/test-report-notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        businessId: 1,
        userId: 1
      })
    });

    const result = await response.json();
    console.log('Test notifications created:', result);
    
    if (result.success) {
      alert(`✅ Created ${result.data.created} test report notifications! Check your notification bell icon.`);
    } else {
      alert('❌ Failed to create test notifications: ' + result.error);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('❌ Error creating test notifications: ' + error.message);
  }
};

// Call the function
testReportNotification();
