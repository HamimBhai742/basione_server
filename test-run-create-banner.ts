import dotenv from 'dotenv';
dotenv.config();

import { bannerService } from './src/app/modules/banner/banner.service';

async function run() {
  try {
    console.log('Testing createBannerByTemplate service method...');
    
    const mockReq = {
      body: {
        data: JSON.stringify({
          width: 120,
          height: 80,
          sizeType: 'custom',
          headline: 'Test Banner Headline',
          occasion: 'wedding',
          imageUrl: 'https://spandeokprint-assets.s3.eu-north-1.amazonaws.com/tests/test-1781764003555.txt',
          canvasJson: '{}',
        })
      },
      user: { id: '69f2023a58e85db08cda4c21' }
    } as any;

    const result = await bannerService.createBannerByTemplate(mockReq);
    console.log('Service call succeeded! Created Banner:', JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Service call failed:', error);
  }
}
run();
