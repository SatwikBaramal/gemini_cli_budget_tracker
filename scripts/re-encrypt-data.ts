/**
 * Re-encrypt all data in the database with the current ENCRYPTION_KEY
 * 
 * This script will:
 * 1. Find all Settings with encrypted or plain text values
 * 2. Decrypt them if encrypted (or use as-is if plain text)
 * 3. Re-encrypt with the current ENCRYPTION_KEY
 * 
 * Usage: npm run re-encrypt
 */

import { connectToDatabase } from '../src/lib/mongodb';
import { Setting } from '../src/lib/models/Setting';
import { encrypt, decrypt, isEncrypted } from '../src/lib/encryption';
import mongoose from 'mongoose';

async function reEncryptData() {
  console.log('🔄 Starting data re-encryption...\n');
  
  try {
    await connectToDatabase();
    console.log('✓ Connected to database\n');

    // Find all settings (income data)
    const settings = await Setting.find({});
    console.log(`Found ${settings.length} settings to process\n`);

    let encrypted = 0;
    let alreadyEncrypted = 0;
    let failed = 0;

    for (const setting of settings) {
      try {
        let plainValue: string;

        // Check if already encrypted with current key
        if (isEncrypted(setting.value)) {
          try {
            // Try to decrypt with current key
            plainValue = decrypt(setting.value);
            console.log(`✓ ${setting.key} (year: ${setting.year}, user: ${setting.userId.substring(0, 8)}...) - Already encrypted with current key`);
            alreadyEncrypted++;
            continue; // Skip if already encrypted with current key
          } catch (error) {
            // If decryption fails, the data is encrypted with a different key
            console.log(`⚠ ${setting.key} (year: ${setting.year}, user: ${setting.userId.substring(0, 8)}...) - Encrypted with different key, cannot decrypt`);
            failed++;
            continue;
          }
        } else {
          // Data is plain text
          plainValue = setting.value;
          console.log(`→ ${setting.key} (year: ${setting.year}, user: ${setting.userId.substring(0, 8)}...) - Plain text, encrypting...`);
        }

        // Re-encrypt with current key
        const newEncryptedValue = encrypt(plainValue);
        
        // Update in database
        await Setting.findByIdAndUpdate(setting._id, {
          value: newEncryptedValue
        });

        encrypted++;
        console.log(`  ✓ Encrypted successfully`);
      } catch (error) {
        console.error(`  ✗ Failed to process ${setting.key}:`, error);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📊 Re-encryption Summary:');
    console.log('='.repeat(50));
    console.log(`Total processed:        ${settings.length}`);
    console.log(`Already encrypted:      ${alreadyEncrypted}`);
    console.log(`Newly encrypted:        ${encrypted}`);
    console.log(`Failed/Skipped:         ${failed}`);
    console.log('='.repeat(50) + '\n');

    if (encrypted > 0) {
      console.log('✅ Re-encryption completed successfully!');
    } else if (alreadyEncrypted > 0) {
      console.log('✅ All data is already encrypted with the current key!');
    } else {
      console.log('⚠️  No data was encrypted. Check the logs above for errors.');
    }

  } catch (error) {
    console.error('❌ Error during re-encryption:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  }
}

// Run the script
reEncryptData();

