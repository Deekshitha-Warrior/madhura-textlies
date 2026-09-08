const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

// Load environment from 'env' file (not .env as per project structure)
const envPath = path.resolve(process.cwd(), 'env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // fallback
}

const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Supabase URL or Key is missing from the environment variables.");
  process.exit(1);
}

const supabase = createClient(url, key);

async function syncBrand() {
  console.log("🔄 Starting Madhura Tex Brand Sync...");

  const settingsPayload = {
    id: 1,
    name: 'Madhura Tex',
    owner_name: 'Madhura Tex Management',
    phone: '+91 9626555535',
    email: 'madhuratex1@gmail.com',
    address: 'Malar complex, Pondy - Sellipet Main road, Kalithirampattu - Kandamangalam Junction',
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('store_settings')
    .upsert(settingsPayload, { onConflict: 'id' })
    .select();

  if (error) {
    if (error.code === '42P01') {
      console.warn("⚠️ Table 'store_settings' does not exist. Skipping settings update.");
    } else {
      console.error("❌ Failed to update store settings:", error.message);
    }
  } else {
    console.log("✅ Store settings updated successfully.");
  }

  console.log("🎉 Sync completed successfully.");
}

syncBrand().catch(err => {
  console.error("❌ Unexpected error during sync:", err);
});
