const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
//const io = socketIo(server);
const io = socketIo(server, {
    cors: {
        origin: "*", // React app URL
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// MongoDB setup
mongoose.connect('mongodb://localhost:27017/chatapp', { useNewUrlParser: true, useUnifiedTopology: true });

const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: String,
});

const MessageSchema = new mongoose.Schema({
    sender: String,
    content: String,
    timestamp: { type: Date, default: Date.now },
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access denied' });
    try {
        const verified = jwt.verify(token, 'SECRET');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

// Routes
app.post('/register', async (req, res) => {
    res.send({ message: 'Access Denied!' });
    // const { username, password } = req.body;
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, salt);
    // const user = new User({ username, password: hashedPassword });
    // try {
    //     await user.save();
    //     res.send({ message: 'User registered successfully' });
    // } catch (err) {
    //     res.status(400).send(err);   
    // }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ _id: user._id }, 'SECRET');
    res.header('Authorization', token).send({ token });
});

app.get('/messages', authenticateToken, async (req, res) => {
    // const messages = await Message.find();
    // res.json(messages);
    const { page = 1, limit = 20 } = req.query;
    const messages = await Message.find()
        .sort({ timestamp: -1 })  // Sort messages by timestamp in descending order
        .skip((page - 1) * limit)
        .limit(parseInt(limit));
    res.json(messages.reverse());
});

io.on('connection', (socket) => {
    console.log('New client connected');
    socket.on('sendMessage', async ({ sender, content }) => {
        const message = new Message({ sender, content });
        await message.save();
        io.emit('receiveMessage', message);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT,'0.0.0.0', () => console.log(`Server running on port ${PORT}`));
