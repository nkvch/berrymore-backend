export const emailtemplate = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width">
    <title>Email verifying</title>
  </head>
  <body style="background-color: white; font-family: Arial, Helvetica, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto;">
      <h1 style="text-align: center;">Подтвердите свой адрес электронной почты</h1>
      <p style="font-size: 16px;">Ващ код подтверждения:</p>
      <div style="border: 2px solid black; padding: 10px; font-size: 18px; font-weight: bold; text-align: center;">{{token}}</div>
      <p style="font-size: 16px;">Если вы находитесь на странице регистрации, то можете скопировать данный код и вставить его в соответствующее поле.</p>
      <p style="font-size: 16px;">Или, вы можете подтвердить свой адрес электронной почты, нажав на кнопку ниже:</p>
      <div style="text-align: center;">
        <a href="{{verificationLink}}" style="background-color: rgb(16, 143, 26); border: 1px solid black;color: white;  border-radius: 4px; color: w; font-size: 16px; font-weight: bold; padding: 10px 20px; text-decoration: none;">Завершить регистрацию</a>
      </div>
      <p style="font-size: 16px;">Код подтверждения действует 20 минут.</p>
      <br />
      <p style="font-size: 16px;">Если вы не регистрировались на сайте Berrymore, то просто проигнорируйте данное письмо.</p>
      <br />
      <p style="font-size: 16px;">С уважением,</p>
      <p style="font-size: 16px;">Команда Berrymore</p>
    </div>
  </body>
  </html>
`;
