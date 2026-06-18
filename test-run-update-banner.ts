import dotenv from 'dotenv';
dotenv.config();

import { bannerService } from './src/app/modules/banner/banner.service';

async function run() {
  try {
    const bannerId = '6a338fb410bd62011ca98dc4';
    console.log(`Testing updateBanner service method for banner ${bannerId}...`);
    
    const mockReq = {
      body: {
        data: JSON.stringify({
          width: 120,
          height: 80,
          sizeType: 'custom',
          headline: 'Updated Test Banner Headline',
          occasion: 'wedding',
          canvasJson: '{}',
        })
      },
      file: {
        originalname: 'test-canvas.jpg',
        buffer: Buffer.from('fake image data'),
        mimetype: 'image/jpeg'
      },
      user: { id: '69f2023a58e85db08cda4c21', role: 'user' }
    } as any;

    const result = await bannerService.updateBanner(mockReq, bannerId);
    console.log('updateBanner service call succeeded! Result:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('updateBanner service call failed:', error);
  }
}
run();
