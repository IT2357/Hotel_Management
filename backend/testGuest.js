// Test guest password
import bcrypt from 'bcryptjs';

const hash = '$2b$12$rKPCJwTNOksv7Q2OU/bcmOhP7RenO856Hq.wfaNqL0OVD5zXzQawi';
const passwords = ['admin123', 'password123', 'guest123', 'manager123', 'staff123'];

async function testPasswords() {
  for (const password of passwords) {
    try {
      const isMatch = await bcrypt.compare(password, hash);
      console.log(`Password '${password}': ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
    } catch (error) {
      console.log(`Error testing '${password}':`, error.message);
    }
  }
}

testPasswords();