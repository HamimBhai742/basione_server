import sendEmail from "./nodemailerTransport";

export const registrationSuccessTemplate = async (
  userName: string,
  email: string,
  subject: string
) => {
  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Welcome to Spandoek Print</title>
<style>
body {
  margin: 0;
  padding: 0;
  background-color: #f5f5f5;
  font-family: Arial, sans-serif;
}

.container {
  max-width: 650px;
  margin: 20px auto;
  background: #ffffff;
  border-radius: 6px;
  overflow: hidden;
  text-align: center;
}

.header {
  background-color: #ff6f61;
  color: #ffffff;
  padding: 20px;
}

.header img {
  width: 150px;
  height: auto;
  margin-bottom: 10px;
}

.header h1 {
  font-size: 22px;
  font-weight: bold;
  margin: 0;
}

.content {
  padding: 25px 30px;
  color: #333;
  text-align: left;
}

.button {
  display: inline-block;
  padding: 12px 25px;
  background-color: #ff6f61;
  color: #fff;
  text-decoration: none;
  border-radius: 5px;
  margin-top: 20px;
  font-weight: bold;
}

.footer {
  background: #fafafa;
  text-align: center;
  padding: 15px;
  font-size: 12px;
  color: #777;
}
</style>
</head>

<body>

<div class="container">

  <div class="header">
    <img src="https://i.ibb.co.com/k6rKTqjh/Screenshot-242-removebg-preview.png" alt="Spandoek Print Logo"/>
    <h1>Welcome to Spandoek Print! 🎨</h1>
  </div>

  <div class="content">
    <p>Hello <strong>${userName}</strong>,</p>

    <p>
      Your account has been successfully created on <strong>Spandoek Print</strong> — the AI-powered banner generator. Now you can start creating stunning banners instantly!
    </p>

    <a href="https://spandoekprint.com/login" class="button">Start Designing</a>

    <p style="margin-top:20px;">
      Need help or have questions? Our support team is ready to assist you anytime.
    </p>
  </div>

  <div class="footer">
    © ${new Date().getFullYear()} Spandoek Print. All rights reserved.
  </div>

</div>

</body>
</html>
`;

  await sendEmail(email, subject, html);
};