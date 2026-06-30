const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT == '465', // true for port 465, false for 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send email notification for a new contact form submission
 */
const sendContactNotification = async (name, email, subject, message) => {
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0B1E36; color: #E2E8F0; border-radius: 12px;">
            <h2 style="color: #D4A02B;">📩 New Contact Form Submission</h2>
            <hr style="border-color: rgba(255,255,255,0.1);" />
            <p><strong style="color: #D4A02B;">Name:</strong> ${name}</p>
            <p><strong style="color: #D4A02B;">Email:</strong> ${email}</p>
            <p><strong style="color: #D4A02B;">Subject:</strong> ${subject || 'No Subject'}</p>
            <p><strong style="color: #D4A02B;">Message:</strong><br/>${message}</p>
            <hr style="border-color: rgba(255,255,255,0.1);" />
            <p style="font-size: 0.9rem; color: #94A3B8;">
                View in admin panel: <a href="${process.env.FRONTEND_URL || 'http://localhost:5000'}/admin.html" style="color: #D4A02B; text-decoration: none;">Admin Dashboard</a>
            </p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"SCC Contact" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER,
            subject: `[SCC] New Message from ${name}`,
            html,
        });
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return false;
    }
};

module.exports = { sendContactNotification };
