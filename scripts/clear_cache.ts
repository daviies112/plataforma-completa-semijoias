
import { clearAllCaches } from './server/lib/publicCache';
import fs from 'fs';
import path from 'path';

async function clear() {
  clearAllCaches();
  
  const cacheFile = path.join(process.cwd(), 'data', 'form_mapping_cache.json');
  if (fs.existsSync(cacheFile)) {
    fs.unlinkSync(cacheFile);
    console.log('Deleted persistent cache file');
  }
}

clear();
