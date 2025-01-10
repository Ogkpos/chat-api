# 📡 Server-to-Server Chat Application

A real-time chat application using **WebSockets**, **TypeScript**, **Express**, **Prisma (PostgreSQL)**, and **Socket.io**, supporting both **direct** and **group conversations**. This project also includes a **client-side interface** for testing messaging functionality.

## Features

- Real-time messaging with WebSockets
- Direct and group chats
- Friendship system (users can only message friends)
- Message storage using PostgreSQL and Prisma ORM
- WebSocket rooms for efficient message delivery
- Simple frontend client for testing

## Project Structure

```
chat-api
│
│── src
│   │── controllers (Handles API logic)
│   │── services (Business logic for chat and WebSockets)
│   │── models (Prisma schema for database)
│   │── routes (Express routes for auth and friends)
│   │── utils (Helper functions)
│   │── public/index.html (Client-side UI for testing)
│── server.ts (WebSocket logic + Express setup)
│── prisma/schema.prisma (Database schema)
│── .env.example (Example environment variables)
|── README.md (Project documentation)
|── package.json (Dependencies and scripts)
```

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Ogkpos/chat-api.git
```

### 2. Install Dependencies

```bash
npm install
```

```
frontend
# No dependencies required, just open index.html in a browser
```

### 3. Set Up Environment Variables

Create a `.env` file in the `root/` directory and add the following:

```
DATABASE_URL=postgresql://user:password@localhost:5432/chatdb
JWT_SECRET=your_jwt_secret
PORT=3000
```

### 4. Run Database Migrations

```
npx prisma migrate dev --name init
```

### 5. Start the Server

```
npm run dev
```

### 6. Open the Client

Simply open `public/index.html` in a browser to test chat functionality.

## WebSocket Events

### Server-Side Events

- **sendMessage**: Sends a message (direct or group)
- **newMessage**: Broadcasts a new message to connected users
- **joinConversations**: Joins WebSocket rooms for all conversations the user is part of
- **createGroupChat**: Creates a new group chat

## API Endpoints

- **POST /api/auth/signup** → Registers a new user
- **POST /api/auth/login** → Logs in a user
- **POST /api/friends/request** → Sends a friend request
- **POST /api/friends/respond** → Accepts or declines a friend request
- **POST /api/friends/remove** → Remove a friend
- **POST /api/messages/send** → Sends a message

## Next Steps

- Improve the **client UI** for better testing
- Add **user authentication** to WebSocket connections
- Implement **message read receipts**

## Contributions

Feel free to fork this project, submit issues, or open a PR! 🚀

---
