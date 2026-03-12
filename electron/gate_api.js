import crypto from 'crypto';

const BASE_URL = 'https://api.gateio.ws';

/**
 * Fetch trading history from Gate.io
 * @param {string} apiKey 
 * @param {string} apiSecret 
 * @param {string} fromTimestamp Unix timestamp in seconds (optional)
 * @param {string} toTimestamp Unix timestamp in seconds (optional)
 * @returns {Promise<Array>} List of trades
 */
export async function fetchGateIoTrades(apiKey, apiSecret, fromTimestamp = null, toTimestamp = null) {
  const method = 'GET';
  const url = '/api/v4/spot/my_trades';
  
  const queryParams = new URLSearchParams();
  queryParams.append('limit', '1000');
  if (fromTimestamp) queryParams.append('from', fromTimestamp);
  if (toTimestamp) queryParams.append('to', toTimestamp);
  
  const queryString = queryParams.toString();
  // Decode URLSearchParams because Gate.io signature requires unescaped form for specific chars, but default is fine usually.
  
  const payloadString = ''; 
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const hashedPayload = crypto.createHash('sha512').update(payloadString).digest('hex');
  const signatureString = `${method}\n${url}\n${queryString}\n${hashedPayload}\n${timestamp}`;
  const signature = crypto.createHmac('sha512', apiSecret).update(signatureString).digest('hex');

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'KEY': apiKey,
    'Timestamp': timestamp,
    'SIGN': signature
  };

  const fullUrl = queryString ? `${BASE_URL}${url}?${queryString}` : `${BASE_URL}${url}`;
  
  const response = await fetch(fullUrl, { method, headers });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gate.io API Error: ${response.status} - ${errorText}`);
  }

  return response.json();
}
