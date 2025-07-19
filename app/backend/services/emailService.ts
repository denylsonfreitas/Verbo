import nodemailer from 'nodemailer';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config();

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outros
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('Configurações de email não definidas. Email não será enviado.');
        return false;
      }

      const mailOptions = {
        from: `"Verbo Game" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '') // Remove HTML tags para texto simples
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado com sucesso:', result.messageId);
      return true;
    } catch (error) {
      console.error('Erro ao enviar email:', error);
      return false;
    }
  }

  // Template para recuperação de senha
  generatePasswordResetEmail(username: string, resetToken: string, baseUrl: string): { subject: string; html: string } {
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;
    
    return {
      subject: 'Redefinir senha - Verbo Game',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Redefinir Senha</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #007bff; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .token { background: #e9ecef; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; margin: 15px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; border: 2px dashed #007bff; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Verbo Game</h1>
            </div>
            <div class="content">
              <h2>Redefinir Senha</h2>
              <p>Olá <strong>${username}</strong>,</p>
              <p>Você solicitou a redefinição da sua senha. Clique no botão abaixo para criar uma nova senha:</p>
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
              <p><strong>Ou digite este código no sistema:</strong></p>
              <div class="token">${resetToken}</div>
              <p style="text-align: center; margin-top: 5px;"><small>Digite exatamente como mostrado acima</small></p>
              <p>Se você não conseguir clicar no botão, copie e cole este link no seu navegador:</p>
              <p><a href="${resetUrl}">${resetUrl}</a></p>
              <p><strong>Este link expira em 1 hora.</strong></p>
              <p>Se você não solicitou esta redefinição, ignore este email.</p>
            </div>
            <div class="footer">
              <p>© 2025 Verbo Game. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Template para verificação de email
  generateEmailVerificationEmail(username: string, newEmail: string, verificationToken: string, baseUrl: string): { subject: string; html: string } {
    const verificationUrl = `${baseUrl}/verify-email?token=${verificationToken}`;
    
    return {
      subject: 'Verificar novo email - Verbo Game',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Verificar Email</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: #fff; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .button { display: inline-block; padding: 12px 24px; background: #28a745; color: #fff; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .token { background: #e9ecef; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; margin: 15px 0; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 3px; border: 2px dashed #28a745; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Verbo Game</h1>
            </div>
            <div class="content">
              <h2>Verificar Novo Email</h2>
              <p>Olá <strong>${username}</strong>,</p>
              <p>Você solicitou a alteração do seu email para: <strong>${newEmail}</strong></p>
              <p>Clique no botão abaixo para confirmar esta alteração:</p>
              <a href="${verificationUrl}" class="button">Verificar Email</a>
              <p><strong>Ou digite este código de verificação no sistema:</strong></p>
              <div class="token">${verificationToken}</div>
              <p style="text-align: center; margin-top: 5px;"><small>Digite exatamente como mostrado acima</small></p>
              <p>Se você não conseguir clicar no botão, copie e cole este link no seu navegador:</p>
              <p><a href="${verificationUrl}">${verificationUrl}</a></p>
              <p><strong>Este link expira em 24 horas.</strong></p>
              <p>Se você não solicitou esta alteração, ignore este email.</p>
            </div>
            <div class="footer">
              <p>© 2025 Verbo Game. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
  }

  // Verificar se o serviço está configurado
  isConfigured(): boolean {
    return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
  }

  // Testar configuração de email
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('Conexão SMTP verificada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro na verificação SMTP:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default EmailService;
