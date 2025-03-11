const axios = require('axios');
const moment = require('moment');

/**
 * M-Pesa Daraja API integration utility
 * Documentation: https://developer.safaricom.co.ke/
 */

// Base URLs
const SANDBOX_URL = 'https://sandbox.safaricom.co.ke';
const PRODUCTION_URL = 'https://api.safaricom.co.ke';

// Get base URL based on environment
const getBaseUrl = () => {
  return process.env.NODE_ENV === 'production' 
    ? PRODUCTION_URL 
    : SANDBOX_URL;
};

/**
 * Generate OAuth token for authentication
 * @returns {Promise<string>} OAuth token
 */
const generateToken = async () => {
  try {
    // Get consumer key and secret from env variables
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    
    if (!consumerKey || !consumerSecret) {
      throw new Error('M-Pesa consumer key or secret not configured');
    }
    
    // Create auth string (base64 encoded)
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    
    // Make request to get OAuth token
    const response = await axios.get(
      `${getBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error generating M-Pesa token:', error);
    throw new Error(`Failed to generate M-Pesa token: ${error.message}`);
  }
};

/**
 * Initiate STK Push (Lipa Na M-Pesa Online)
 * @param {Object} options Payment options
 * @param {string} options.phoneNumber Customer phone number (format: 254XXXXXXXXX)
 * @param {number} options.amount Amount to be paid
 * @param {string} options.referenceCode Order reference code
 * @param {string} options.description Transaction description
 * @returns {Promise<Object>} STK Push response
 */
const initiateSTKPush = async (options) => {
  try {
    // Get required parameters
    const { 
      phoneNumber, 
      amount, 
      referenceCode, 
      description = 'Payment for order'
    } = options;
    
    // Validate inputs
    if (!phoneNumber || !amount || !referenceCode) {
      throw new Error('Phone number, amount, and reference code are required');
    }
    
    // Format phone number (remove leading 0 or +)
    const formattedPhone = phoneNumber.toString().replace(/^(0|\+254)/, '254');
    
    // Get timestamp in M-Pesa format (YYYYMMDDHHmmss)
    const timestamp = moment().format('YYYYMMDDHHmmss');
    
    // Get business shortcode and passkey from env variables
    const businessShortCode = process.env.MPESA_SHORTCODE;
    const passKey = process.env.MPESA_PASSKEY;
    
    if (!businessShortCode || !passKey) {
      throw new Error('M-Pesa shortcode or passkey not configured');
    }
    
    // Generate password (base64 encoded string of shortcode + passkey + timestamp)
    const password = Buffer.from(businessShortCode + passKey + timestamp).toString('base64');
    
    // Get callback URLs
    const callbackUrl = process.env.MPESA_CALLBACK_URL;
    
    if (!callbackUrl) {
      throw new Error('M-Pesa callback URL not configured');
    }
    
    // Get token for authentication
    const token = await generateToken();
    
    // Prepare STK Push request
    const data = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: formattedPhone,
      PartyB: businessShortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: callbackUrl,
      AccountReference: referenceCode,
      TransactionDesc: description
    };
    
    // Make STK Push request
    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpush/v1/processrequest`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error initiating M-Pesa STK Push:', error);
    throw new Error(`Failed to initiate M-Pesa payment: ${error.message}`);
  }
};

/**
 * Check STK Push transaction status
 * @param {string} checkoutRequestId The checkout request ID from STK Push response
 * @returns {Promise<Object>} Transaction status response
 */
const checkTransactionStatus = async (checkoutRequestId) => {
  try {
    // Get business shortcode from env variables
    const businessShortCode = process.env.MPESA_SHORTCODE;
    
    // Get timestamp in M-Pesa format (YYYYMMDDHHmmss)
    const timestamp = moment().format('YYYYMMDDHHmmss');
    
    // Get passkey from env variables
    const passKey = process.env.MPESA_PASSKEY;
    
    // Generate password (base64 encoded string of shortcode + passkey + timestamp)
    const password = Buffer.from(businessShortCode + passKey + timestamp).toString('base64');
    
    // Get token for authentication
    const token = await generateToken();
    
    // Prepare request data
    const data = {
      BusinessShortCode: businessShortCode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };
    
    // Make status query request
    const response = await axios.post(
      `${getBaseUrl()}/mpesa/stkpushquery/v1/query`,
      data,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error checking M-Pesa transaction status:', error);
    throw new Error(`Failed to check M-Pesa transaction status: ${error.message}`);
  }
};

module.exports = {
  generateToken,
  initiateSTKPush,
  checkTransactionStatus
};