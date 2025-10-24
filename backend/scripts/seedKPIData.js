import mongoose from 'mongoose';
import KPI from '../models/KPI.js';
import { connectDB } from '../config/database.js';

const generateKPIs = () => {
  const kpis = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6); // 6 months ago
  
  for (let i = 0; i < 180; i++) { // 6 months of daily data
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Booking metrics
    const totalBookings = Math.floor(Math.random() * 20) + 5;
    const totalRooms = 50;
    const occupiedRooms = Math.floor(Math.random() * 40) + 5;
    const occupancyRate = (occupiedRooms / totalRooms) * 100;
    
    // Revenue metrics
    const baseRevenue = 100000 + Math.floor(Math.random() * 400000);
    const totalRevenue = baseRevenue + (Math.random() - 0.5) * 50000;
    const roomRevenue = Math.floor(totalRevenue * 0.7);
    const foodRevenue = Math.floor(totalRevenue * 0.2);
    const serviceRevenue = totalRevenue - roomRevenue - foodRevenue;
    
    // Expense metrics
    const totalExpenses = Math.floor(totalRevenue * (0.5 + Math.random() * 0.2));
    const staffExpenses = Math.floor(totalExpenses * 0.4);
    const maintenanceExpenses = Math.floor(totalExpenses * 0.2);
    const foodExpenses = Math.floor(totalExpenses * 0.15);
    const utilitiesExpenses = Math.floor(totalExpenses * 0.15);
    const otherExpenses = totalExpenses - staffExpenses - maintenanceExpenses - foodExpenses - utilitiesExpenses;
    
    // Profit metrics
    const grossProfit = totalRevenue - totalExpenses;
    const netProfit = grossProfit * 0.8; // Assuming 20% other costs
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Task metrics
    const totalTasks = Math.floor(Math.random() * 50) + 20;
    const completedTasks = Math.floor(totalTasks * (0.7 + Math.random() * 0.3));
    const taskCompletionRate = (completedTasks / totalTasks) * 100;
    
    kpis.push({
      date: date,
      period: 'daily',
      
      // Booking metrics
      totalBookings: totalBookings,
      totalRooms: totalRooms,
      occupiedRooms: occupiedRooms,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      averageRoomRate: Math.floor(totalRevenue / (totalBookings || 1)),
      revenuePerAvailableRoom: Math.floor(totalRevenue / totalRooms),
      
      // Revenue metrics
      totalRevenue: Math.floor(totalRevenue),
      roomRevenue: roomRevenue,
      foodRevenue: foodRevenue,
      serviceRevenue: serviceRevenue,
      averageRevenuePerBooking: Math.floor(totalRevenue / (totalBookings || 1)),
      
      // Expense metrics
      totalExpenses: totalExpenses,
      staffExpenses: staffExpenses,
      maintenanceExpenses: maintenanceExpenses,
      foodExpenses: foodExpenses,
      utilitiesExpenses: utilitiesExpenses,
      otherExpenses: otherExpenses,
      
      // Profit metrics
      grossProfit: Math.floor(grossProfit),
      netProfit: Math.floor(netProfit),
      profitMargin: Math.round(profitMargin * 100) / 100,
      
      // Task metrics
      totalTasks: totalTasks,
      completedTasks: completedTasks,
      taskCompletionRate: Math.round(taskCompletionRate * 100) / 100,
      averageTaskCompletionTime: Math.floor(Math.random() * 120) + 30, // 30-150 minutes
      
      // Quality metrics
      guestSatisfactionScore: Math.round((3.5 + Math.random() * 1.5) * 100) / 100, // 3.5-5.0
      totalReviews: Math.floor(Math.random() * 20) + 5,
      averageResponseTime: Math.floor(Math.random() * 60) + 15, // 15-75 minutes
      
      // Efficiency metrics
      staffEfficiencyScore: Math.round((70 + Math.random() * 30) * 100) / 100, // 70-100
      energyEfficiencyScore: Math.round((60 + Math.random() * 40) * 100) / 100, // 60-100
      maintenanceScore: Math.round((70 + Math.random() * 30) * 100) / 100, // 70-100
      cleanlinessScore: Math.round((80 + Math.random() * 20) * 100) / 100, // 80-100
      serviceQualityScore: Math.round((75 + Math.random() * 25) * 100) / 100 // 75-100
    });
  }
  
  return kpis;
};

const seedKPIData = async () => {
  try {
    console.log('🌱 Starting KPI data seeding...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database\n');
    
    // Clear existing KPI data
    console.log('🧹 Clearing existing KPI data...');
    await KPI.deleteMany({});
    console.log('✅ Cleared existing KPI data\n');
    
    // Generate and save KPI data
    console.log('📊 Creating sample KPI data...');
    const kpis = generateKPIs();
    await KPI.insertMany(kpis);
    console.log(`✅ Created ${kpis.length} KPI records\n`);
    
    // Show sample
    const latest = kpis[kpis.length - 1];
    console.log('📈 Latest KPI Record:');
    console.log(`   - Date: ${latest.date.toISOString().split('T')[0]}`);
    console.log(`   - Occupancy Rate: ${latest.occupancyRate}%`);
    console.log(`   - Total Revenue: LKR ${latest.totalRevenue.toLocaleString()}`);
    console.log(`   - Net Profit: LKR ${latest.netProfit.toLocaleString()}`);
    console.log(`   - Profit Margin: ${latest.profitMargin}%`);
    console.log(`   - Task Completion: ${latest.taskCompletionRate}%`);
    console.log(`   - Guest Satisfaction: ${latest.guestSatisfactionScore}/5\n`);
    
    console.log('🎉 KPI data seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding KPI data:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

seedKPIData();
