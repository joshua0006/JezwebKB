import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import * as cors from 'cors';

admin.initializeApp();
const corsHandler = cors({ origin: true });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password
  }
});

export const sendEmailNotification = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      // Verify admin status
      const context = {
        auth: req.body.auth,
        rawRequest: req,
        rawResponse: res
      };
      
      if (!context.auth || !context.auth.token.admin) {
        throw new functions.https.HttpsError(
          'permission-denied',
          'Only admins can send notifications'
        );
      }

      const { to, subject, message } = req.body.data;
      
      const mailOptions = {
        from: 'Jezweb KB <noreply@jezweb.net>',
        to,
        subject,
        text: message,
        html: `<div>${message}</div>`
      };

      await transporter.sendMail(mailOptions);
      res.status(200).json({ result: 'Success' });
    } catch (error) {
      console.error('Error sending email:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  });
}); 