const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require('path');
require("dotenv").config();

const db = require("./configs/database");
const authRoute = require("./routes/authRoutes");
const postRoutes = require("./routes/postRoutes");
const notificationRoutes = require("./routes/notiRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app); 

const io = new Server(server, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/auth", authRoute);
app.use("/api/posts", postRoutes);
app.use("/api", uploadRoutes);        
app.use("/api/notifications", notificationRoutes);


io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
