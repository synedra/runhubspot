# Zoho Tasks Todo List App

A React application that provides a todo list interface backed by Zoho Tasks, integrated through RunAlloy.

## Features

- **Task List Management**: Create, update, and delete task lists (equivalent to boards)
- **Task Management**: Add, edit, delete, and mark tasks as complete/incomplete
- **OAuth Authentication**: Secure authentication via RunAlloy's Zoho Tasks integration
- **Real-time Updates**: Changes sync immediately with Zoho Tasks
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

This app uses:
- **Frontend**: React with hooks for state management
- **Backend**: Netlify Functions for serverless API calls
- **Integration**: RunAlloy as middleware for Zoho Tasks API
- **Authentication**: OAuth 2.0 via RunAlloy

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd runalloy-zoho-tasks
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env` file with:
   ```bash
   RUNALLOY_API_KEY=your_runalloy_api_key
   RUNALLOY_API_URL=https://production.runalloy.com
   ```

4. **Deploy to Netlify** (recommended)
   ```bash
   npm run build
   # Deploy the build folder to Netlify
   ```

## Usage

1. Enter your email address to start
2. Authenticate with Zoho through RunAlloy's OAuth flow
3. Create task lists and add tasks
4. Mark tasks as complete by checking the checkbox
5. Edit or delete tasks and task lists as needed

## API Integration

The app integrates with Zoho Tasks through RunAlloy:

- **Task Lists**: Mapped to Zoho Task Lists
- **Tasks**: Mapped to Zoho Tasks
- **Status**: "Working on it" (open) ↔ "Done" (completed)

## Development

### Available Scripts

- `npm start` - Run development server
- `npm test` - Run tests
- `npm run build` - Build for production
- `npm run eject` - Eject from Create React App

### Project Structure

```
src/
├── App.js                    # Main application component
├── BoardComponent.js         # Task list display component
├── BoardManagement.js        # Task list management UI
├── TodoList.js              # Task management UI
└── ...

netlify/functions/
├── zoho-auth.js             # Authentication via RunAlloy
├── zoho-tasklists.js        # Task list operations
├── zoho-tasks.js            # Task operations
└── runalloy-helper.js       # RunAlloy integration utilities
```

## Documentation

- [RunAlloy Integration Guide](README-RunAlloy.md)
- [Zoho Tasks Integration Guide](README-Zoho.md)
- [OAuth Setup Guide](README-OAuth.md)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
