// Global state management for serverless functions
// Since serverless functions are stateless, this acts as a simple in-memory store
// that persists for the duration of the function execution

let globalState = {
  tasks: [],
  loadingBoards: false,
  error: null,
  userEmail: '',
  userId: '',
  checkingCredential: false,
  needsAuth: false,
  emailSubmitted: false,
};

// State management functions
const stateManager = {
  // Get all state
  getState: () => ({ ...globalState }),

  // Get specific state value
  get: (key) => globalState[key],

  // Set specific state value
  set: (key, value) => {
    globalState[key] = value;
    return globalState[key];
  },

  // Update multiple state values
  update: (updates) => {
    globalState = { ...globalState, ...updates };
    return globalState;
  },

  // Reset state to initial values
  reset: () => {
    globalState = {
      tasks: [],
      loadingBoards: false,
      error: null,
      userEmail: '',
      userId: '',
      checkingCredential: false,
      needsAuth: false,
      emailSubmitted: false,
    };
    return globalState;
  },

  // Initialize state from external data (e.g., localStorage simulation)
  initialize: (initialData) => {
    globalState = { ...globalState, ...initialData };
    return globalState;
  }
};

module.exports = stateManager;