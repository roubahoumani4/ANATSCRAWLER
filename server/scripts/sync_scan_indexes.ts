import scansConnection from '../services/mongodbScans.service';
import { Schema } from 'mongoose';

async function run() {
  try {
    // Wait for connection ready
    if (scansConnection.readyState !== 1) {
      console.log('Waiting for scans DB connection...');
      await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('Timeout waiting for scans DB')), 10000);
        scansConnection.once('connected', () => { clearTimeout(t); resolve(true); });
        scansConnection.once('error', (err) => { clearTimeout(t); reject(err); });
      });
    }

    // Define a temporary schema/model to ensure indexes are created matching server model
    const tempSchema = new Schema({ jobId: String }, { strict: false });
    const Temp = scansConnection.model('___tmp_scan_sync', tempSchema, 'scans');
    await Temp.syncIndexes();
    // Cleanup model
    try { scansConnection.deleteModel('___tmp_scan_sync'); } catch { }
    console.log('Scan indexes synchronized (collection: scans).');
    process.exit(0);
  } catch (err) {
    console.error('Failed to sync scan indexes:', err);
    process.exit(1);
  }
}

run();
