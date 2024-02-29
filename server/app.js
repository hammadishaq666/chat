const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
    transports: ['websocket', 'polling'],
  }));
   // Use cors middleware with default options

// MongoDB connection setup
mongoose.connect("mongodb://localhost:27017/chatApp", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define MongoDB schema and model for messages
const MessageSchema = new mongoose.Schema({
  user: String,
  message: String,
});
const Message = mongoose.model("Message", MessageSchema);

io.on("connection", (socket) => {
  console.log("New client connected");

  // Listen for new messages
  socket.on("message", async (data) => {
    const { user, message } = data;

    // Save the message to MongoDB
    const newMessage = new Message({ user, message });
    await newMessage.save();

    // Broadcast the message to all clients
    io.emit("message", { user, message });
  });

  // Fetch previous messages from MongoDB and send them to the client
  Message.find().then((messages) => {
    socket.emit("init", messages);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
