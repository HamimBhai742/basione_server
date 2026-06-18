import dotenv from 'dotenv';
dotenv.config();

import { uploadBufferToS3 } from './src/app/utils/uploadAws';

async function run() {
  try {
    console.log('Testing S3 upload...');
    const buffer = Buffer.from('Hello S3');
    const key = `tests/test-${Date.now()}.txt`;
    const url = await uploadBufferToS3({
      buffer,
      key,
      contentType: 'text/plain'
    });
    console.log('S3 upload succeeded! URL:', url);
  } catch (error) {
    console.error('S3 upload failed:', error);
  }
}
run();
