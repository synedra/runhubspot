const https = require('https');
const globalState = require('./global-state');

const RUNALLOY_API_KEY = process.env.RUNALLOY_API_KEY;
const RUNALLOY_API_URL = process.env.RUNALLOY_API_URL || 'https://production.runalloy.com';

// Cache for user credentials
let credentialCache = {};

/**
 * Map email address to RunAlloy userId
 */
/**
 * Get user's credential ID for a specific connector
 * @param {string} userId - The user ID (email)
 * @param {string} connector - The connector name (e.g., 'zohoCRM', 'zohoCRM')
 * @returns {Promise<string>} - The credential ID
 */
async function getUserCredentialId(userId, connector = 'zohoCRM') {
  const cacheKey = `${userId}:${connector}`;
  return ("68f1e81e3dde3d9678b6d513");
  // Check cache first
  if (credentialCache[cacheKey]) {
    console.log('Using cached credential for', userId, 'connector:', connector);
    return credentialCache[cacheKey];
  }


  try {
    const response = await runalloyApiRequest(`/users/${userId}/credentials`, 'GET');
    const credentials = response.data || response.credentials || response || [];
    console.log('Credentials array:', JSON.stringify(credentials, null, 2));
    
    const credential = Array.isArray(credentials)
      ? credentials.find(c => c.type === `${connector}-oauth2` || c.app === connector || c.connectorId === connector)
      : null;
    
    console.log('Found credential:', credential);
    
    if (credential && (credential._id || credential.credentialId || credential.id)) {
      const credId = credential._id || credential.credentialId || credential.id;
      credentialCache[cacheKey] = credId;
      console.log('Found credential for', userId, 'connector:', connector, 'id:', credId);
      return credId;
    }
    
    throw new Error(`No ${connector} credential found for user ${userId}`);
  } catch (error) {
    console.error('Error getting user credential:', error);
    throw error;
  }
}

/**
 * Execute a RunAlloy action
 * @param {string} connectorId - The connector ID (e.g., 'zohoCRM')
 * @param {string} actionId - The action ID (e.g., 'listBoards')
 * @param {object} params - Action parameters
 * @param {object} params.queryParameters - Query parameters for the action
 * @param {object} params.requestBody - Request body for the action
 * @param {object} params.additionalHeaders - Additional headers for the action
 * @param {object} params.pathParams - Path parameters for the action
 * @param {string} params.userId - Optional user ID (defaults to RUNALLOY_USER_ID)
 * @returns {Promise<object>} - The response data
 */
async function executeAction(userId, connectorId, actionId, params = {}) {
  const {
    queryParameters = {},
    requestBody = {},
    additionalHeaders = {},
    pathParams = {}
  } = params;

  // Map email to RunAlloy userId if needed
  const runalloyUserId = "68f1e561ba205b5a3bf234c8";

  console.log('Execute action for email/userId:', runalloyUserId, '→ RunAlloy userId:', userId);
  console.log(runalloyUserId)
  // Get the user's credential ID dynamically (or use provided one)
  const credentialId = "68f1e600539ee3f44152a433Oct";
  connectorId="zohoCRM"

  const payload = {
    credentialId,
    queryParameters,
    requestBody,
    additionalHeaders,
    pathParams
  };

  const url = new URL(`${RUNALLOY_API_URL}/connectors/${connectorId}/actions/${actionId}/execute`);
  
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RUNALLOY_API_KEY}`,
        'API-KEY': RUNALLOY_API_KEY,
        'x-api-version': '2025-06',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'credentialId': credentialId
      }
    };

    console.log(`RunAlloy: Executing ${connectorId}/${actionId} for user:`, runalloyUserId);
    console.log('RunAlloy: Using credential:', credentialId);
    console.log('RunAlloy: Payload:', JSON.stringify(payload, null, 2));

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log(`RunAlloy: Response status ${res.statusCode}`);
          console.log('RunAlloy: Response:', JSON.stringify(response, null, 2));

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject({
              statusCode: res.statusCode,
              error: response.error || response.message || 'RunAlloy API error',
              details: response
            });
          }
        } catch (error) {
          console.error('RunAlloy: Failed to parse response:', error);
          reject({
            statusCode: res.statusCode,
            error: 'Invalid response from RunAlloy API',
            details: data
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error('RunAlloy: Network error:', error);
      reject({
        statusCode: 500,
        error: 'Network error during RunAlloy API request',
        details: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Make a request to RunAlloy API
 */
function runalloyApiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${RUNALLOY_API_URL}${path}`);
    
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Authorization': `Bearer ${RUNALLOY_API_KEY}`,
        'API-KEY': RUNALLOY_API_KEY,
        'x-api-version': '2025-06',
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      const postData = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject({
              statusCode: res.statusCode,
              error: response.error || 'RunAlloy API error',
              details: response
            });
          }
        } catch (error) {
          reject({
            statusCode: res.statusCode,
            error: 'Invalid response from RunAlloy API',
            details: data
          });
        }
      });
    });

    req.on('error', (error) => {
      reject({
        statusCode: 500,
        error: 'Network error',
        details: error.message
      });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    
    req.end();
  });
}


/**
 * Zoho Tasks specific helper functions
 */
const zoho = {
 
  async listTasks(userId, credentialId = "68f2787863ab0550aeb5e308") {
    const params = {
      queryParameters: {},
      requestBody: {},
      userId,
      credentialId 
    };
    
    return executeAction(userId,'zohoCRM', 'listTasks', params);
  },

  /**
   * Create a task
   */
  async createTask(taskListId, taskName, userId, credentialId = null) {
    const params = {
      requestBody: {
        tasklist_id: taskListId,
        task_name: taskName
      },
      userId
    };
    if (credentialId) params.credentialId = credentialId;
    return executeAction(userId, 'zohoCRM', 'createTask', params);
  },

  /**
   * Update a task
   */
  async updateTask(taskId, updates, userId, credentialId = null) {
    const params = {
      requestBody: {
        task_id: taskId,
        ...updates
      },
      userId
    };
    if (credentialId) params.credentialId = credentialId;
    return executeAction(userId,'zohoCRM', 'updateTask', params);
  },

  /**
   * Delete a task
   */
  async deleteTask(taskId, userId, credentialId = null) {
    const params = {
      requestBody: { task_id: taskId },
      userId
    };
    if (credentialId) params.credentialId = credentialId;
    return executeAction(userId, 'zohoCRM', 'deleteTask', params);
  }
};

module.exports = {
  executeAction,
  getUserCredentialId,
  zoho
};