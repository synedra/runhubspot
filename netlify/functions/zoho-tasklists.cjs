const { zoho } = require('./runalloy-helper');
const globalState = require('./global-state');

exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const runAlloyUser = "68f1e561ba205b5a3bf234c8"
    const credentialId = "68f2787863ab0550aeb5e308"

    console.log(credentialId)
    console.log(runAlloyUser)
    
    switch (event.httpMethod) {
      case 'GET':
        return await taskLists(runAlloyUser, credentialId, headers);
      case 'POST':
        return await createTaskList(JSON.parse(event.body), runAlloyUser, headers);
      case 'PUT':
        return await updateTaskList(JSON.parse(event.body), runAlloyUser, headers);
      case 'DELETE':
        const taskListId = event.queryStringParameters?.taskListId;
        return await deleteTask(taskListId, event.queryStringParameters?.userId, headers);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Zoho tasklists error:', error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: error.error || 'Internal server error',
        details:JSON.stringify( error.details)
      }),
    };
  }
};

async function taskLists(userId, credentialId, headers) {
  
  console.log('zoho-tasklists: listTasks called via RunAlloy for user:', userId, 'credential:', credentialId);
  const runAlloyUser = "68f1e561ba205b5a3bf234c8"
  credentialId = "68f1e600539ee3f44152a433"
  try {
    const response = await zoho.listTasks(runAlloyUser, credentialId);
    console.log("RESPONSE: " + response)

    // Extract task lists from RunAlloy response
    // The actual structure depends on what RunAlloy returns
    const taskLists = response.responseData?.data?.tasklists ||
                      response.data?.tasklists ||
                      response.responseData?.data ||
                      response.data || [];

    console.log('zoho-tasklists: Found', Array.isArray(taskLists) ? taskLists.length : 'unknown', 'task lists');

    // Update global state with tasks
    globalState.set('tasks', transformedTaskLists);

    // Transform to match expected board format
    const transformedTaskLists = Array.isArray(taskLists) ? taskLists.map(taskList => ({
      id: taskList.id || taskList.tasklist_id,
      name: taskList.name || taskList.tasklist_name,
      updated_at: taskList.updated_at || taskList.modified_time,
      items: taskList.tasks || []
    })) : [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: transformedTaskLists }),
    };
    
  } catch (error) {
    console.error('zoho-tasklists: Error fetching task lists:', error);
    throw error;
  }
}

async function createTaskList(taskListData, userId, headers) {
  const { name } = taskListData;

  console.log('zoho-tasklists: createTaskList called with name:', name, 'for user:', userId);

  try {
    const response = await zoho.createTaskList(name, userId);

    const taskList = response.responseData?.data?.tasklist ||
                     response.data?.tasklist ||
                     response.responseData?.data ||
                     response.data;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ data: taskList }),
    };
  } catch (error) {
    console.error('zoho-tasklists: Error creating task list:', error);
    throw error;
  }
}

async function updateTaskList(taskListData, userId, headers) {
  const { id, name } = taskListData;

  console.log('zoho-tasklists: updateTaskList called with:', { id, name }, 'for user:', userId);

  try {
    const response = await zoho.updateTaskList(id, name, userId);

    const taskList = response.responseData?.data?.tasklist ||
                     response.data?.tasklist ||
                     response.responseData?.data ||
                     response.data;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: taskList }),
    };
  } catch (error) {
    console.error('zoho-tasklists: Error updating task list:', error);
    throw error;
  }
}

async function deleteTask(taskListId, userId, headers) {
  if (!taskListId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Task List ID is required' }),
    };
  }

  console.log('zoho-tasklists: deleteTaskList called with id:', taskListId, 'for user:', userId);

  try {
    const response = await zoho.deleteTask(taskListId, userId);

    const result = response.responseData?.data ||
                   response.data ||
                   response;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: result }),
    };
  } catch (error) {
    console.error('zoho-tasklists: Error deleting task list:', error);
    throw error;
  }
}