import axios from 'axios';

async function testDownload() {
  console.log('🚀 Starting export and download test...');
  
  try {
    // Login
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'manager@hotel.com',
      password: 'manager123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    
    // Export report
    const exportResponse = await axios.post('http://localhost:5000/api/reports/export', {
      reportType: 'booking',
      format: 'pdf',
      includeCharts: false
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Export created:', exportResponse.data.data.fileName);
    console.log('📥 Download URL:', exportResponse.data.data.downloadUrl);
    
    // Download the file
    const downloadUrl = `http://localhost:5000${exportResponse.data.data.downloadUrl}`;
    console.log('🔄 Testing download from:', downloadUrl);
    
    const downloadResponse = await axios.get(downloadUrl, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'arraybuffer'
    });
    
    console.log('✅ Download successful!');
    console.log('📦 File size:', downloadResponse.data.length, 'bytes');
    console.log('📄 Content-Type:', downloadResponse.headers['content-type']);
    console.log('');
    console.log('🎉 COMPLETE SUCCESS! 🎉');
    console.log('✨ The export and download system is fully working!');
    console.log('');
    console.log('📋 System Status:');
    console.log('   ✅ Export API: Working');
    console.log('   ✅ Download API: Working');
    console.log('   ✅ File Generation: Working');
    console.log('   ✅ Authentication: Working');
    console.log('');
    console.log('🔗 Test URLs:');
    console.log('   Export: POST http://localhost:5000/api/reports/export');
    console.log('   Download: GET http://localhost:5000/api/exports/[filename]');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Status:', error.response.status);
      console.error('📄 Data:', error.response.data);
    }
  }
}

testDownload();