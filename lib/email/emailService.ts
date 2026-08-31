import { fetchEmail } from '@/actions/user/fetchEmail';
import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';


export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    try {
        const result = await fetchEmail();

        if (!result.success || !result.data?.email) {
            throw new Error(result.success ? "Email not found" : result.err);
        }

        const senderEmail = result.data.email;

        const transporter: Transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            },
        });

        // Define email options
        const mailOptions: SendMailOptions = {
            from: `"Eduents" <${senderEmail}>`,
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
