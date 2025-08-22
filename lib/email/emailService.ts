import { fetchEmail } from '@/actions/user/fetchEmail';
import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}


export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    // Fetch the current user's email from Clerk/DB
    const result = await fetchEmail();

    if (!result.success || !result.data?.email) {
      throw new Error(result.success ? "Email not found" : result.err);
    }

    const senderEmail = result.data.email;

    const testAccount = await nodemailer.createTestAccount();
    const transporter: Transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    // Define email options
    const mailOptions: SendMailOptions = {
      from: `"Eduents Collaboration" <${senderEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    // Send the email
    const info = await transporter.sendMail(mailOptions);

    console.log("Email sent:", info.messageId);
    console.log("Preview URL:", nodemailer.getTestMessageUrl(info));

    return true;
  } catch (error) {
    console.error("Failed to send email:", error);
    return false;
  }
};


export const createCollaborationInviteEmail = (
  inviterName: string,
  folderName: string,
  inviteLink: string,
  role: string
) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">You've been invited to collaborate!</h2>
      
      <p><strong>${inviterName}</strong> has invited you to collaborate on the folder: <strong>${folderName}</strong></p>
      
      <p>Your role: <strong>${role}</strong></p>
      
      <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 15px 0;"><strong>What you can do:</strong></p>
        <ul style="margin: 0; padding-left: 20px;">
          ${role === 'editor' ? `
            <li>Add and remove questions</li>
            <li>Reorder questions</li>
            <li>Invite other collaborators</li>
          ` : `
            <li>View questions</li>
            <li>Generate PDFs</li>
          `}
        </ul>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteLink}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${inviteLink}" style="color: #007bff;">${inviteLink}</a>
      </p>
      
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
      <p style="color: #999; font-size: 12px;">
        This invitation was sent from Eduents. If you didn't expect this email, you can safely ignore it.
      </p>
    </div>
  `;
}; 