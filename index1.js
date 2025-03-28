require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
app.use(express.json());
app.use(cors({ origin: ["http://localhost:4200"], methods: ["GET", "POST", "PUT", "DELETE"] }));

const users = []; // Example in-memory user storage

// Rate limiter to prevent abuse
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

// Role-based access control
const roles = {
    admin: ["read", "write", "delete"],
    user: ["read"],
    editor: ["read", "write"],
};

function authorize(role, action) {
    return (req, res, next) => {
        if (!req.user || !roles[req.user.role]?.includes(action)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
}

// Middleware to verify JWT
function authenticateToken(req, res, next) {
    const token = req.headers["authorization"];
    if (!token) return res.status(403).json({ message: "No token provided" });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: "Invalid token" });
        req.user = decoded;
        next();
    });
}

// Register user
app.post("/register", async (req, res) => {
    const { username, password, role } = req.body;
    if (!roles[role]) return res.status(400).json({ message: "Invalid role" });

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword, role });
    res.json({ message: "User registered" });
});

// Login user and return JWT
app.post("/register", async (req, res) => {
    const { username, password, role } = req.body;
    if (!roles[role]) return res.status(400).json({ message: "Invalid role" });

    const hashedPassword = await bcrypt.hash(password, 10);
    users.push({ username, password: hashedPassword, role });
    res.json({ message: "User registered" });
});

app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const user = users.find((u) => u.username === username);

    if (!user) {
        return res.status(400).json({ message: "User not found" });
    }

    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err || !isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }
        const token = jwt.sign({ username: user.username, role: user.role }, "secretkey", { expiresIn: "1h" });
        res.json({ token });
    });
});


// Protected route (any authenticated user)
app.get("/protected", authenticateToken, (req, res) => {
    res.json({ message: `Hello, ${req.user.username}` });
});

// Role-protected routes
app.get("/admin", authenticateToken, authorize("admin", "delete"), (req, res) => {
    res.json({ message: "Admin access granted" });
});

app.get("/editor", authenticateToken, authorize("editor", "write"), (req, res) => {
    res.json({ message: "Editor access granted" });
});

app.get("/user", authenticateToken, authorize("user", "read"), (req, res) => {
    res.json({ message: "User access granted" });
});

app.get("/", (req, res) => {
    res.send("API is running!");
});

app.listen(3000, () => console.log("Server running on port 3000"));
