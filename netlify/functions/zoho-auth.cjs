const RUNALLOY_API_KEY = process.env.RUNALLOY_API_KEY;
const RUNALLOY_API_URL = process.env.RUNALLOY_API_URL || 'https://production.runalloy.com';
const RUNALLOY_USER_ID = process.env.RUNALLOY_USER_ID || 'default_user';
const globalState = require('./global-state');

console.log('Zoho Auth - RUNALLOY_API_KEY present:', !!RUNALLOY_API_KEY);
console.log('Zoho Auth - API key length:', RUNALLOY_API_KEY ? RUNALLOY_API_KEY.length : 0);

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json',
  };


  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }


  try {
    const { action, email } = event.queryStringParameters || {};

    // Handle OAuth callback (no action/userId params)
    if (!action && !email) {
      console.log('OAuth callback detected - no action/userId params');
      return {
        statusCode: 302,
        headers: {
          ...headers,
          'Location': 'https://runzoho.netlify.app/?auth=success',
        },
        body: ''
      };
    }
    
    const runalloyUserId = globalState.get("user_id") || RUNALLOY_USER_ID;
    console.log(runalloyUserId);
    console.log(action);
    
    if (!action || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing action or userId parameter' })
      };
    }
    console.log('Action:', action, 'Email:', email);

    // Map email to RunAlloy userId
    console.log('Mapping email ', email, 'to RunAlloy userId:', runalloyUserId);

    switch (action) {
      case 'create-link':
        return await createEmbeddedLink(email, headers, );
      case 'get-credential':
        return await getUserCredential(email, headers);
      case 'check-status':
        return await checkCredentialStatus(email, headers);
      case 'get-user-id':
        return await getUserIdFromEmail(email, headers);
      default:
        console.log('Invalid action received:', action, 'query params:', event.queryStringParameters);
        // If no action is provided, assume it's an OAuth callback and redirect to the main app
        if (!action && event.httpMethod === 'GET') {
          console.log('No action provided, assuming OAuth callback, redirecting to main app');
          return {
            statusCode: 302,
            headers: {
              ...headers,
              'Location':'https://runzoho.netlify.app/?auth=success',
            },
            body: ''
          };
        }
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action:' + action }),
        };
    }
  } catch (error) {
    console.error('RunAlloy auth error:', JSON.stringify(error, null, 2));
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        details: error.message,
        fullError: error
      }),
    };
  }
};

/**
 * Map email address to RunAlloy userId
 * Checks environment variables for RUNALLOY_USER_{email}
 */
async function getUserIdFromEmail(email) {
  const user_response = await runalloyApiRequest('/users', 'GET');

  // Use btoa for base64 encoding in Node.js (Buffer is available in Node.js)
  const base64Email = btoa(email);
  const envVarName = `RUNALLOY_USER_${base64Email}`;

  console.log(user_response)
  for (const user of user_response.data) {
    if (user["username"] === email) {
      globalState.set('userId', user["userId"]);
      console.log("SETTING UP MY PERSON YO")
    }
  }

  const userId = process.env[envVarName];
  console.log(`Looking for env var: ${envVarName} (${email}), found:`, userId ? userId : 'no');

  return userId;
}

async function createEmbeddedLink(userId, headers) {
  console.log('Creating credential for user:', userId);
  console.log(process.env.URL)

  // Check if we have the required environment variables
  if (!RUNALLOY_API_KEY) {
    throw new Error('RUNALLOY_API_KEY environment variable is not set');
  }

  // Don't send scopes in the payload - RunAlloy might not support it
  const payload = {
    userId: userId,
    authenticationType: 'oauth2',
    redirectUri:  'https://runzoho.netlify.app/.netlify/functions/zoho-auth',
    data: {
      region: 'com'
    }
  };

  try {
    console.log('About to create credential with payload:', JSON.stringify(payload, null, 2));
    console.log('Sending payload:', JSON.stringify(payload, null, 2));
    const response = await runalloyApiRequest('/connectors/zohoCRM/credentials', 'POST', payload);

    console.log('Credential creation response:', JSON.stringify(response, null, 2));

    if (!response.oauthUrl) {
      console.error('No oauthUrl in response:', response);
      throw new Error('Invalid response from RunAlloy - missing oauthUrl');
    }
    globalState.set("credential_id", response.credentialId)

    // Return the OAuth URL as-is - scopes are encoded in the JWT by RunAlloy
    console.log('OAuth URL:', response.oauthUrl);
    console.log(payload)
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        linkUrl: response.oauthUrl,
        userId: userId
      }),
    };
  } catch (error) {
    console.error('Error creating credential:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
  
}

async function getUserCredential(userId, headers) {
  console.log('Getting credentials for user:', userId);

  try {
    const response = await runalloyApiRequest(`/users/${userId}/credentials`, 'GET');
    
    const credentials = response.data || response.credentials || response || [];
    console.log('Credentials response:', JSON.stringify(credentials, null, 2));
    const zohoCredential = Array.isArray(credentials) 
      ? credentials.find(c => c.type === 'zohoCRM-oauth2')
      : null;

    globalState.set("credential_id", zohoCredential)

    if (zohoCredential) {
      return {
        statusCode: 200,
        headers, 
        body: JSON.stringify({
          hasCredential: true,
          credentialId: zohoCredential._id || zohoCredential.credentialId || zohoCredential.id,
          status: zohoCredential.status || 'active'
        }),
      };
    } else {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          hasCredential: false
        }),
      };
    }
  } catch (error) {
    console.error('Error getting user credential:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        hasCredential: false,
        error: error.message
      }),
    };
  }
}

async function checkCredentialStatus(userId, headers) {
  return getUserCredential(userId, headers);
}

async function getUserId(userId, headers) {
  console.log('Getting user info for:', userId);

  try {
    const response = await runalloyApiRequest(`/users`, 'GET');

    const userData = response.data || response || {};
    console.log('User data:', JSON.stringify(userData, null, 2));

    // Update global state instead of localStorage
    globalState.set('userEmail', userData.email);
    globalState.set('userId', userData.id || userData._id || userId);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        userId: userData.id || userData._id || userId,
        email: userData.email,
        data: userData
      }),
    };
  } catch (error) {
    console.error('Error getting user info:', error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        userId: userId,
        email: globalState.get('userEmail') || '',
        error: error.message
      }),
    };
  }
}
function runalloyApiRequest(path, method = 'GET', body = null) {
  const url = `${RUNALLOY_API_URL}${path}`;

  const requestOptions = {
    method: method,
    headers: {
      'Authorization': `Bearer ${RUNALLOY_API_KEY}`,
      'API-KEY': RUNALLOY_API_KEY,
      'x-api-version': '2025-06',
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  console.log(`RunAlloy API: ${method} ${url}`);
  console.log('Using API key:', RUNALLOY_API_KEY ? `${RUNALLOY_API_KEY.substring(0, 8)}...` : 'MISSING');

  return fetch(url, requestOptions)
    .then(response => {
      console.log(`RunAlloy API Response (${response.status})`);

      if (!response.ok) {
        return response.text().then(text => {
          try {
            const errorData = JSON.parse(text);
            throw {
              statusCode: response.status,
              error: errorData.error || errorData.message || 'RunAlloy API error',
              details: errorData
            };
          } catch (parseError) {
            throw {
              statusCode: response.status,
              error: 'Invalid response from RunAlloy API',
              details: response
            };
          }
        });
      }

      return response.json();
    })
    .catch(error => {
      console.error('RunAlloy API network error:', error);
      throw {
        statusCode: 500,
        error: 'Network error during RunAlloy API request',
        details: error.message
      };
    });
}