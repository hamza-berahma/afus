import { apiConfig } from '../config/api.js';

// SMS Queue for retry mechanism
const smsQueue = [];
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Twilio client (lazy loaded)
let twilioClient = null;

/**
 * Initialize Twilio client
 * @returns {Promise<Object|null>} Twilio client or null if not configured
 */
const getTwilioClient = async () => {
  if (!apiConfig.twilio.accountSid || !apiConfig.twilio.authToken) {
    return null;
  }

  if (!twilioClient) {
    try {
      const twilio = await import('twilio');
      twilioClient = twilio.default(
        apiConfig.twilio.accountSid,
        apiConfig.twilio.authToken
      );
    } catch (error) {
      console.error('Failed to load Twilio SDK:', error);
      return null;
    }
  }

  return twilioClient;
};

/**
 * Send SMS using Twilio
 * @param {string} phone - Phone number to send to
 * @param {string} message - Message content
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<boolean>} True if sent successfully
 */
const sendSMS = async (phone, message, retryCount = 0) => {
  const client = await getTwilioClient();

  if (!client) {
    console.warn('Twilio not configured, skipping SMS:', { phone, message });
    return false;
  }

  const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!twilioPhoneNumber) {
    console.error('TWILIO_PHONE_NUMBER not configured');
    return false;
  }

  try {
    const result = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phone,
    });

    console.log(`SMS sent successfully to ${phone}:`, {
      messageSid: result.sid,
      status: result.status,
      retryCount,
    });

    return true;
  } catch (error) {
    console.error(`Failed to send SMS to ${phone} (attempt ${retryCount + 1}):`, {
      error: error.message,
      code: error.code,
      status: error.status,
      message,
    });

    // Queue for retry if not exceeded max retries
    if (retryCount < MAX_RETRIES - 1) {
      queueSMSForRetry(phone, message, retryCount + 1);
    } else {
      console.error(`Max retries exceeded for SMS to ${phone}. Message: ${message}`);
    }

    return false;
  }
};

/**
 * Queue SMS for retry
 * @param {string} phone - Phone number
 * @param {string} message - Message content
 * @param {number} retryCount - Retry attempt number
 */
const queueSMSForRetry = (phone, message, retryCount) => {
  const retryAt = Date.now() + RETRY_DELAY * retryCount;
  
  smsQueue.push({
    phone,
    message,
    retryCount,
    retryAt,
  });

  console.log(`SMS queued for retry:`, {
    phone,
    retryCount,
    retryAt: new Date(retryAt).toISOString(),
  });
};

/**
 * Process SMS queue (should be called periodically)
 */
export const processSMSQueue = async () => {
  const now = Date.now();
  const readyToRetry = smsQueue.filter((item) => item.retryAt <= now);
  
  for (const item of readyToRetry) {
    const index = smsQueue.indexOf(item);
    smsQueue.splice(index, 1);
    
    await sendSMS(item.phone, item.message, item.retryCount);
  }
};

// Start processing queue every 10 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(processSMSQueue, 10000);
}

/**
 * Format message template with variables
 * @param {string} template - Message template with {{variables}}
 * @param {Object} data - Data object to replace variables
 * @returns {string} Formatted message
 */
const formatMessage = (template, data) => {
  let message = template;
  Object.keys(data).forEach((key) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    message = message.replace(regex, data[key] || '');
  });
  return message;
};

/**
 * Send order notification to producer
 * @param {string} producerPhone - Producer's phone number
 * @param {Object} transactionDetails - Transaction details
 * @param {string} transactionDetails.id - Transaction ID
 * @param {number} transactionDetails.amount - Transaction amount
 * @param {string} transactionDetails.address - Delivery address
 * @param {string} transactionDetails.url - Tracking URL
 * @returns {Promise<boolean>} True if sent successfully
 */
export const sendOrderNotification = async (producerPhone, transactionDetails) => {
  const { id, amount, address, url } = transactionDetails;

  if (!producerPhone) {
    console.warn('Producer phone not provided for order notification');
    return false;
  }

  const message = formatMessage(
    'Order #{{id}}: {{amount}} MAD secured. Ship to {{address}}. Track: {{url}}',
    {
      id: id || 'N/A',
      amount: amount || '0',
      address: address || 'Address not provided',
      url: url || 'N/A',
    }
  );

  console.log('Sending order notification:', { producerPhone, transactionId: id });
  return await sendSMS(producerPhone, message);
};

/**
 * Send shipping notification to buyer
 * @param {string} buyerPhone - Buyer's phone number
 * @param {Object} transactionDetails - Transaction details
 * @param {string} transactionDetails.id - Transaction ID
 * @param {string} transactionDetails.date - Expected delivery date
 * @returns {Promise<boolean>} True if sent successfully
 */
export const sendShippingNotification = async (buyerPhone, transactionDetails) => {
  const { id, date } = transactionDetails;

  if (!buyerPhone) {
    console.warn('Buyer phone not provided for shipping notification');
    return false;
  }

  const message = formatMessage(
    'Your order #{{id}} has been shipped. Expected delivery: {{date}}',
    {
      id: id || 'N/A',
      date: date || 'TBD',
    }
  );

  console.log('Sending shipping notification:', { buyerPhone, transactionId: id });
  return await sendSMS(buyerPhone, message);
};

/**
 * Send payment confirmation
 * @param {string} phone - Phone number to send to
 * @param {Object} transactionDetails - Transaction details
 * @param {string} transactionDetails.id - Transaction ID
 * @param {number} transactionDetails.amount - Payment amount
 * @returns {Promise<boolean>} True if sent successfully
 */
export const sendPaymentConfirmation = async (phone, transactionDetails) => {
  const { id, amount } = transactionDetails;

  if (!phone) {
    console.warn('Phone not provided for payment confirmation');
    return false;
  }

  const message = formatMessage(
    'Payment of {{amount}} MAD confirmed. Transaction: {{id}}',
    {
      id: id || 'N/A',
      amount: amount || '0',
    }
  );

  console.log('Sending payment confirmation:', { phone, transactionId: id });
  return await sendSMS(phone, message);
};

/**
 * Send delivery reminder to buyer
 * @param {string} buyerPhone - Buyer's phone number
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<boolean>} True if sent successfully
 */
export const sendDeliveryReminder = async (buyerPhone, transactionId) => {
  if (!buyerPhone) {
    console.warn('Buyer phone not provided for delivery reminder');
    return false;
  }

  const message = formatMessage(
    'Order #{{id}} delivered? Scan QR code to release payment.',
    {
      id: transactionId || 'N/A',
    }
  );

  console.log('Sending delivery reminder:', { buyerPhone, transactionId });
  return await sendSMS(buyerPhone, message);
};

/**
 * Get SMS queue status (for monitoring)
 * @returns {Object} Queue status
 */
export const getSMSQueueStatus = () => {
  return {
    queueLength: smsQueue.length,
    queuedItems: smsQueue.map((item) => ({
      phone: item.phone.substring(0, 4) + '****', // Partially mask phone
      retryCount: item.retryCount,
      retryAt: new Date(item.retryAt).toISOString(),
    })),
  };
};

/**
 * Clear SMS queue (for testing/admin purposes)
 */
export const clearSMSQueue = () => {
  const cleared = smsQueue.length;
  smsQueue.length = 0;
  console.log(`Cleared ${cleared} items from SMS queue`);
  return cleared;
};

