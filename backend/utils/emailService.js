const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Create email transporter
const createTransporter = () => {
  // For production
  if (process.env.NODE_ENV === 'production') {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  } 
  
  // For development - use Ethereal for testing
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.ETHEREAL_EMAIL,
      pass: process.env.ETHEREAL_PASSWORD
    }
  });
};

// Read email template
const readTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.html`);
  const template = fs.readFileSync(templatePath, 'utf-8');
  return handlebars.compile(template);
};

// Send email using template
const sendEmail = async (to, subject, templateName, data) => {
  try {
    const transporter = createTransporter();
    const template = readTemplate(templateName);
    const html = template(data);
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || '"Your E-commerce Store" <noreply@yourdomain.com>',
      to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, '') // Simple text version
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log(`Email sent: ${info.messageId}`);
    
    // For development - log test URL
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

// Order confirmation email
const sendOrderConfirmation = async (order, user) => {
  const subject = `Order Confirmation #${order.orderNumber}`;
  
  const data = {
    customerName: order.shippingAddress.fullName,
    orderNumber: order.orderNumber,
    orderDate: new Date(order.createdAt).toLocaleDateString(),
    orderItems: order.orderItems.map(item => ({
      name: item.name,
      price: item.price.toFixed(2),
      quantity: item.quantity,
      subtotal: (item.price * item.quantity).toFixed(2),
      image: item.image
    })),
    shippingAddress: {
      fullName: order.shippingAddress.fullName,
      address: order.shippingAddress.address,
      city: order.shippingAddress.city,
      postalCode: order.shippingAddress.postalCode,
      country: order.shippingAddress.country
    },
    subtotal: order.itemsPrice.toFixed(2),
    shipping: order.shippingPrice.toFixed(2),
    tax: order.taxPrice.toFixed(2),
    discount: order.discountPrice.toFixed(2),
    total: order.totalPrice.toFixed(2),
    paymentMethod: order.paymentMethod,
    orderLink: `${process.env.FRONTEND_URL}/orders/${order._id}`
  };
  
  return sendEmail(user.email, subject, 'order-confirmation', data);
};

// Shipping notification email
const sendShippingNotification = async (order, user, trackingInfo) => {
  const subject = `Your Order #${order.orderNumber} Has Shipped`;
  
  const data = {
    customerName: order.shippingAddress.fullName,
    orderNumber: order.orderNumber,
    shippingDate: new Date().toLocaleDateString(),
    trackingNumber: trackingInfo.trackingNumber,
    carrierName: trackingInfo.carrier || 'Our Shipping Partner',
    trackingUrl: trackingInfo.trackingUrl || '#',
    estimatedDelivery: trackingInfo.estimatedDelivery || 'Soon',
    orderLink: `${process.env.FRONTEND_URL}/orders/${order._id}`
  };
  
  return sendEmail(user.email, subject, 'shipping-notification', data);
};

// Delivery confirmation email
const sendDeliveryConfirmation = async (order, user) => {
  const subject = `Your Order #${order.orderNumber} Has Been Delivered`;
  
  const data = {
    customerName: order.shippingAddress.fullName,
    orderNumber: order.orderNumber,
    deliveryDate: new Date(order.deliveredAt).toLocaleDateString(),
    orderItems: order.orderItems.map(item => ({
      name: item.name,
      image: item.image
    })),
    reviewLink: `${process.env.FRONTEND_URL}/review/${order._id}`,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@yourdomain.com'
  };
  
  return sendEmail(user.email, subject, 'delivery-confirmation', data);
};

// Order cancellation email
const sendCancellationNotification = async (order, user, reason) => {
  const subject = `Your Order #${order.orderNumber} Has Been Cancelled`;
  
  const data = {
    customerName: order.shippingAddress.fullName,
    orderNumber: order.orderNumber,
    cancellationDate: new Date().toLocaleDateString(),
    cancellationReason: reason || 'As requested',
    refundInfo: order.isPaid ? 'A refund has been initiated and will be processed according to your payment method\'s policy.' : 'No payment was processed for this order.',
    orderItems: order.orderItems.map(item => ({
      name: item.name,
      quantity: item.quantity
    })),
    supportEmail: process.env.SUPPORT_EMAIL || 'support@yourdomain.com'
  };
  
  return sendEmail(user.email, subject, 'order-cancellation', data);
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendShippingNotification,
  sendDeliveryConfirmation,
  sendCancellationNotification
};