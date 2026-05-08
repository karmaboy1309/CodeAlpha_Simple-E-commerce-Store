const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const initDb = () => {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            password TEXT
        )`);

        // Products table
        db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            price REAL,
            image_url TEXT,
            stock INTEGER
        )`);

        // Orders table
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total_price REAL,
            status TEXT DEFAULT 'Pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Order Items table
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            product_id INTEGER,
            quantity INTEGER,
            price REAL,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (product_id) REFERENCES products (id)
        )`);

        // Seed Products if empty
        db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
            if (row.count === 0) {
                const stmt = db.prepare(`INSERT INTO products (name, description, price, image_url, stock) VALUES (?, ?, ?, ?, ?)`);
                const products = [
                    ['Premium Wireless Headphones', 'High-quality noise-canceling wireless headphones.', 299.99, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', 50],
                    ['Minimalist Watch', 'Elegant everyday watch with a genuine leather strap.', 129.50, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80', 30],
                    ['Smart Fitness Tracker', 'Track your daily activity, heart rate, and sleep patterns.', 89.99, 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=600&q=80', 100],
                    ['Polaroid Camera', 'Vintage style instant camera with modern features.', 149.00, 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80', 15],
                    ['Mechanical Keyboard', 'RGB mechanical keyboard with tactile blue switches.', 109.99, 'https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&w=600&q=80', 40],
                    ['Eco-friendly Water Bottle', 'Insulated stainless steel water bottle, keeps drinks cold for 24h.', 35.00, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80', 200]
                ];
                products.forEach(p => stmt.run(p));
                stmt.finalize();
                console.log("Database seeded with sample products.");
            }
        });
    });
};

module.exports = { db, initDb };
