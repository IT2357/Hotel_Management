import axios from 'axios';

const API_BASE = 'http://localhost:5002/api/reports';

async function testKPIAPI() {
  try {
    console.log('🧪 Testing KPI API...\n');
    
    // Test the KPI endpoint
    console.log('📡 GET /api/reports/kpis');
    const response = await axios.get(`${API_BASE}/kpis`, {
      params: {
        period: 'daily',
        includeTrends: true,
        includeAlerts: true
      }
    });
    
    console.log('\n✅ Response received!');
    console.log('\n📊 KPI Data:');
    console.log('─────────────────────────────────────');
    
    const { kpis, performance, alerts } = response.data.data;
    
    if (kpis) {
      console.log('\n🎯 Key Performance Indicators:');
      console.log(`   📈 Occupancy Rate: ${kpis.occupancy?.current}% (Target: ${kpis.occupancy?.target}%)`);
      console.log(`   💰 Revenue: LKR ${kpis.revenue?.current?.toLocaleString()} (Target: LKR ${kpis.revenue?.target?.toLocaleString()})`);
      console.log(`   📊 Profit Margin: ${kpis.profitMargin?.current}% (Target: ${kpis.profitMargin?.target}%)`);
      console.log(`   ⭐ Guest Satisfaction: ${kpis.guestSatisfaction?.current}/5 (Target: ${kpis.guestSatisfaction?.target})`);
      console.log(`   ✅ Task Completion: ${kpis.taskCompletion?.current}% (Target: ${kpis.taskCompletion?.target}%)`);
      console.log(`   🏨 Average Room Rate: LKR ${kpis.averageRoomRate?.current?.toLocaleString()}`);
    }
    
    if (performance) {
      console.log('\n💪 Performance Metrics:');
      console.log(`   📍 Revenue Per Room: LKR ${performance.revenuePerRoom?.toLocaleString()}`);
      console.log(`   ⏱️  Task Efficiency: ${performance.taskEfficiency} min`);
      console.log(`   👥 Staff Utilization: ${performance.staffUtilization}%`);
      console.log(`   🔄 Guest Retention: ${performance.guestRetention}%`);
    }
    
    if (alerts && alerts.length > 0) {
      console.log('\n⚠️  Alerts:');
      alerts.forEach(alert => {
        console.log(`   ${alert.severity === 'high' ? '🔴' : alert.severity === 'medium' ? '🟡' : '🟢'} ${alert.message}`);
      });
    }
    
    console.log('\n─────────────────────────────────────');
    console.log('✅ KPI API is working correctly!\n');
    
    return response.data;
    
  } catch (error) {
    console.error('\n❌ Error testing KPI API:');
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Message: ${error.response.data?.message || error.message}`);
    } else {
      console.error(`   ${error.message}`);
    }
    console.log('\n💡 Make sure:');
    console.log('   1. Backend server is running on port 5002');
    console.log('   2. MongoDB is running and has KPI data');
    console.log('   3. Run: node scripts/seedKPIData.js (if no data)\n');
    throw error;
  }
}

testKPIAPI();
