# JezwebKB - Knowledge Base

This is the codebase for the Jezweb Knowledge Base, a web application for managing and sharing technical documentation and tutorials.

## Feature Highlights

- Rich text editor for creating and editing articles
- User authentication with admin-specific features
- Categorized article management
- Responsive design for mobile and desktop

## Admin Tools

### Converting Tutorials to Articles

This feature allows admin users to convert pre-existing JSON tutorial data into Firestore articles:

1. Login with an admin account (email must end with @jezweb.net)
2. Navigate to Admin → Tools
3. Click the "Import Articles" button
4. The conversion script will:
   - Extract content from tutorial blocks in each tutorial
   - Format it as rich HTML content
   - Save it as articles in the Firestore database
   - Set the admin user as the creator

This is useful for:
- Initial data migration from static JSON files
- Bulk article creation
- Converting legacy content formats

## Development

### Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the development server:
   ```
   npm run dev
   ```
4. For local Firebase emulators:
   ```
   npm run emulators
   ```

### Building for Production

```
npm run build
```

## License

Copyright © Jezweb Pty Ltd. All rights reserved. 