
import { BrevoClient } from '@getbrevo/brevo';

interface SendEmailData {
  to: string;
  subject: string;
  html: string;
}

class EmailService {

  private brevo: BrevoClient;

  constructor() {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      throw new Error('BREVO_API_KEY não configurada.');
    }

    this.brevo = new BrevoClient({
      apiKey
    });
  }

  async sendEmail({ to, subject, html }: SendEmailData) {

    const emailFrom = process.env.EMAIL_FROM;

    if (!emailFrom) {
      throw new Error('EMAIL_FROM não configurado.');
    }

    const response = await this.brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: 'MyExpenses',
        email: emailFrom
      },

      to: [{ email: to }],

      subject,

      htmlContent: html
    });

    return response;
  }
}

export default new EmailService();
