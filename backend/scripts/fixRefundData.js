// 📁 backend/scripts/fixRefundData.js
import mongoose from 'mongoose';
import RefundRequest from '../models/RefundRequest.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function fixRefundDataInconsistencies() {
  try {
    // Connect to MongoDB
    const dbPath = join(__dirname, '../../database.sqlite');
    await mongoose.connect(`mongodb://localhost:27017/hotel-management`);

    console.log('🔍 Searching for ALL refunds...');

    // Find ALL refunds
    const allRefunds = await RefundRequest.find().sort({ createdAt: -1 });

    console.log(`📋 Found ${allRefunds.length} total refunds`);

    if (allRefunds.length === 0) {
      console.log('✅ No refunds found in database!');
      return;
    }

    // Show details of all refunds
    allRefunds.forEach((refund, index) => {
      console.log(`${index + 1}. Refund ${refund._id}:`);
      console.log(`   Status: ${refund.status}`);
      console.log(`   Amount: ${refund.amount} ${refund.currency}`);
      console.log(`   Has approvedBy: ${!!refund.approvedBy}`);
      console.log(`   Has deniedBy: ${!!refund.deniedBy}`);
      console.log(`   Has denialReason: ${!!refund.denialReason}`);
      console.log(`   Booking: ${refund.bookingId?.bookingNumber || 'N/A'}`);
      console.log(`   Guest: ${refund.guestId?.name || 'N/A'}`);
      console.log('   ---');
    });

    // Fix inconsistent refund data
    console.log('\n🔧 Fixing inconsistent refund data...');

    let fixedCount = 0;
    for (const refund of allRefunds) {
      let needsUpdate = false;
      let newStatus = refund.status;

      // If it has denial information, set status to "denied"
      if (refund.deniedBy && refund.deniedAt && refund.denialReason) {
        newStatus = 'denied';
        needsUpdate = true;
      }
      // If it has approval information but no denial, set status to "approved"
      else if (refund.approvedBy && refund.approvedAt && !refund.deniedBy) {
        newStatus = 'approved';
        needsUpdate = true;
      }

      if (needsUpdate && newStatus !== refund.status) {
        refund.status = newStatus;
        await refund.save();
        fixedCount++;
        console.log(`✅ Fixed refund ${refund._id}: status changed to "${newStatus}"`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} refunds with inconsistent data`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📪 Database connection closed');
  }
}

// Run the script
fixRefundDataInconsistencies();
