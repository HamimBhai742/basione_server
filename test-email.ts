import dotenv from 'dotenv';
dotenv.config();

import sendEmail from './src/app/utils/emailTemplates/nodemailerTransport';

async function run() {
  try {
    console.log('Sending test email...');
    const result = await sendEmail(
      'mdhamim5088@gmail.com', // send to self
      'Test Email from Basione Server',
      '<h1>Hello!</h1><p>This is a test email.</p>'
    );
    console.log('Test email sent successfully!', result);
  } catch (error) {
    console.error('Test email failed:', error);
  }
}
run();
