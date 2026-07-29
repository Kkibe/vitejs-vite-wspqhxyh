import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init('YOUR_PUBLIC_KEY');

export const sendEmail = async (templateName, templateParams, toEmail) => {
  try {
    const response = await emailjs.send('YOUR_SERVICE_ID', templateName, {
      to_email: toEmail,
      ...templateParams,
    });
    return { success: true, response };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error };
  }
};

// Specific email functions
export const sendLoginAlert = (user, loginData) => {
  return sendEmail(
    'template_login_alert',
    {
      username: user.username,
      location: loginData.location,
      device: loginData.device,
      browser: loginData.browser,
      time: new Date().toLocaleString(),
      resetPasswordLink: `${window.location.origin}/reset-password`,
    },
    user.email
  );
};

export const sendWelcomeEmail = (user) => {
  return sendEmail(
    'template_welcome',
    {
      username: user.username,
      verificationLink: `${window.location.origin}/verify-email/${user.id}`,
      dashboardLink: `${window.location.origin}/dashboard`,
    },
    user.email
  );
};

export const sendReceipt = (user, paymentData) => {
  return sendEmail(
    'template_receipt',
    {
      username: user.username,
      transactionId: paymentData.id,
      paymentDate: new Date(paymentData.date).toLocaleString(),
      paymentMethod: paymentData.method,
      planDuration: paymentData.plan,
      expiryDate: new Date(paymentData.expiry).toLocaleDateString(),
      amount: paymentData.amount,
      currency: paymentData.currency,
      dashboardLink: `${window.location.origin}/dashboard`,
    },
    user.email
  );
};
