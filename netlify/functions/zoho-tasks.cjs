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
    const { taskListId, taskId, userId } = event.queryStringParameters || {};

    // Task List ID is required for GET and POST
    if (!taskListId && (event.httpMethod === 'GET' || event.httpMethod === 'POST')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Task List ID is required' }),
      };
    }

    switch (event.httpMethod) {
      case 'GET':
        return await listTasks(userId, headers);
      case 'POST':
        return await createTask(userId, JSON.parse(event.body), headers);
      case 'PUT':
        return await updateTask(userId, JSON.parse(event.body), headers);
      case 'DELETE':
        return await deleteTask(userId, taskId, headers);
      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Zoho tasks error:', error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: error.error || 'Internal server error',
        details: error.details
      }),
    };
  }
};

async function listTasks(userId, headers) {
  console.log('zoho-tasks: getTasks called for ', 'user:', userId);

  try {
    const response = await zoho.getTasks(userId);

    // Extract tasks from RunAlloy response
    const tasks = response.responseData?.data?.tasks ||
                  response.data?.tasks ||
                  response.responseData?.data ||
                  response.data || [];

    console.log('zoho-tasks: Found', Array.isArray(tasks) ? tasks.length : 'unknown', 'tasks');

    // Transform to match expected item format with column_values
    const transformedTasks = Array.isArray(tasks) ? tasks.map(task => ({
      id: task.id || task.task_id,
      name: task.name || task.task_name,
      column_values: [
        {
          id: 'status',
          text: task.status === 'completed' ? 'Done' : 'Working on it',
          type: 'status'
        }
      ]
    })) : [];

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: transformedTasks }),
    };
  } catch (error) {
    console.error('zoho-tasks: Error fetching tasks:', error);
    throw error;
  }
}

async function createTask(taskListId, taskData, userId, headers) {
  const { name } = taskData;

  console.log('zoho-tasks: createTask called with:', { taskListId, name, userId });

  try {
    const response = await zoho.createTask(taskListId, name, userId);

    const task = response.responseData?.data?.task ||
                 response.data?.task ||
                 response.responseData?.data ||
                 response.data;

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ data: task }),
    };
  } catch (error) {
    console.error('zoho-tasks: Error creating task:', error);
    throw error;
  }
}

async function updateTask(taskData, userId, headers) {
  const { id, name, taskListId, columnValues } = taskData;

  console.log('zoho-tasks: updateTask called with:', { id, name, taskListId, columnValues, userId });

  try {
    const updates = {};

    if (name !== undefined) {
      updates.task_name = name;
    }

    if (taskListId !== undefined) {
      updates.tasklist_id = taskListId;
    }

    if (columnValues !== undefined) {
      // Handle status updates
      const statusColumn = columnValues.find(col => col.id === 'status');
      if (statusColumn) {
        updates.status = statusColumn.text === 'Done' ? 'completed' : 'open';
      }
    }

    const response = await zoho.updateTask(id, updates, userId);

    const result = response.responseData?.data ||
                   response.data ||
                   response;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: result }),
    };
  } catch (error) {
    console.error('zoho-tasks: Error updating task:', error);
    throw error;
  }
}

async function deleteTask(taskId, userId, headers) {
  if (!taskId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Task ID is required' }),
    };
  }

  console.log('zoho-tasks: deleteTask called with id:', taskId, 'user:', userId);

  try {
    const response = await zoho.deleteTask(taskId, userId);

    const result = response.responseData?.data ||
                   response.data ||
                   response;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ data: result }),
    };
  } catch (error) {
    console.error('zoho-tasks: Error deleting task:', error);
    throw error;
  }
}