# SparkBoard - AI-Powered Brainstorming Board

## 🚀 Features Implemented

✅ **Complete AI-Powered Brainstorming Board** with all required features:

### 1. User Authentication
- Simple username/password authentication
- Session-based login system
- User-specific boards

### 2. Board Features
- Add/edit/delete idea cards
- **Drag & drop cards between columns** (like Trello)
- **Database persistence** - board state saved in PostgreSQL
- **User isolation** - each user has their own board

### 3. AI Features (Core Focus)
- **AI-powered idea suggestions** - When adding a card, AI generates 2-3 related ideas
- **AI clustering** - Groups cards into thematic clusters with visual colors
- **AI board summarization** - One-click button generates comprehensive board summary

### 4. UI/UX
- Clean, modern drag-drop board interface
- Left toolbar: add card, cluster, summarize
- Right panel: AI summary + suggested ideas log
- Dark/light theme toggle
- Responsive design

## 🛠️ Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=your_postgresql_connection_string_here

# OpenAI Configuration (Optional - will use mock data if not provided)
OPENAI_API_KEY=your_openai_api_key_here

# Session Configuration
SESSION_SECRET=your_session_secret_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 2. Database Setup
1. Set up a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env` file
3. Run database migrations:
   ```bash
   npm run db:push
   ```

### 3. OpenAI API (Optional)
- Get an API key from [OpenAI](https://platform.openai.com/api-keys)
- Add it to your `.env` file as `OPENAI_API_KEY`
- **Note**: The app works without this - it will use intelligent mock data

### 4. Install Dependencies
```bash
npm install
```

### 5. Run the Application
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🎯 How to Use

1. **Register/Login** - Create an account or login
2. **Add Ideas** - Click "Add Idea Card" to create new ideas
3. **AI Suggestions** - When you add an idea, AI automatically suggests related concepts
4. **Drag & Drop** - Drag cards between "Ideas", "In Progress", and "Completed" columns
5. **AI Clustering** - Click "Cluster Ideas" to group related ideas with color coding
6. **AI Summary** - Click "Summarize Board" to get an AI-generated overview

## 🏗️ Technical Architecture

- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-3.5-turbo (with fallback to mock data)
- **Drag & Drop**: @dnd-kit library
- **Authentication**: Session-based with bcrypt password hashing

## 📁 Project Structure

```
├── client/          # React frontend
├── server/          # Express backend
├── shared/          # Shared types and schemas
├── package.json     # Dependencies
└── SETUP.md         # This file
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:push` - Push database schema changes

## 🎨 Features in Detail

### AI-Powered Suggestions
- Uses OpenAI GPT-3.5-turbo to generate contextual suggestions
- Fallback to intelligent mock suggestions if no API key
- Suggestions are saved to database and can be added as new ideas

### AI Clustering
- Analyzes idea content and groups them thematically
- Visual color coding for different clusters
- Updates database with cluster information

### AI Summarization
- Generates comprehensive board summaries
- Includes key themes, top ideas, and next steps
- Formatted in markdown for easy reading

### Drag & Drop
- Smooth drag and drop between columns
- Visual feedback during dragging
- Automatic database updates on drop

## 🚀 Ready to Use!

Your AI-Powered Brainstorming Board is now fully functional with all the requested features. The application works with or without an OpenAI API key, making it easy to get started and test all functionality.

