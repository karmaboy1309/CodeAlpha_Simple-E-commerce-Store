const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { db, initDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'super-secret-ecommerce-key-123'; // In production, use environment variable

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Initialize DB
initDb();

// --- Auth Middleware ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token." });
        req.user = user;
        next();
    });
};

// --- Routes ---

// Register
app.post('/api/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: "All fields are required" });

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, 
            [username, email, hashedPassword], 
            function(err) {
                if (err) return res.status(400).json({ error: "Username or email already exists" });
                res.status(201).json({ message: "User registered successfully", userId: this.lastID });
            }
        );
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "All fields are required" });

    db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
        if (err) return res.status(500).json({ error: "Server error" });
        if (!user) return res.status(401).json({ error: "Invalid email or password" });

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(401).json({ error: "Invalid email or password" });

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ message: "Logged in successfully", token, user: { id: user.id, username: user.username } });
    });
});

// Get all products
app.get('/api/products', (req, res) => {
    db.all(`SELECT * FROM products`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: "Server error" });
        res.json(rows);
    });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    db.get(`SELECT * FROM products WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) return res.status(500).json({ error: "Server error" });
        if (!row) return res.status(404).json({ error: "Product not found" });
        res.json(row);
    });
});

// Create Order (Protected)
app.post('/api/orders', authenticateToken, (req, res) => {
    const { items, totalPrice } = req.body; // items: [{productId, quantity, price}]
    if (!items || items.length === 0) return res.status(400).json({ error: "Cart is empty" });

    db.serialize(() => {
        db.run(`INSERT INTO orders (user_id, total_price) VALUES (?, ?)`, 
            [req.user.id, totalPrice], 
            function(err) {
                if (err) return res.status(500).json({ error: "Failed to create order" });
                
                const orderId = this.lastID;
                const stmt = db.prepare(`INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`);
                
                items.forEach(item => {
                    stmt.run(orderId, item.productId, item.quantity, item.price);
                });
                
                stmt.finalize();
                res.status(201).json({ message: "Order placed successfully", orderId });
            }
        );
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
