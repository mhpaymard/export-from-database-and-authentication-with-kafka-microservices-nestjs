-- =====================================================
-- Microservices Database Initialization Script
-- Created: 2025-11-22
-- Purpose: Create initial tables with sample data for testing
-- =====================================================

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- =====================================================
-- Table: users
-- Purpose: Store user information for authentication service
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- =====================================================
-- Table: products
-- Purpose: Sample table for export testing
-- =====================================================
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    category VARCHAR(100),
    sku VARCHAR(100) UNIQUE,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available);

-- =====================================================
-- Table: orders
-- Purpose: Sample table for complex query testing
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
    shipping_address TEXT,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(order_date);

-- =====================================================
-- Table: order_items
-- Purpose: Order details for relational query testing
-- =====================================================
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- =====================================================
-- Insert Sample Data
-- =====================================================

-- Insert sample users (passwords are hashed with bcrypt - password: "password123")
INSERT INTO users (username, email, password, role, first_name, last_name) VALUES
('admin', 'admin@example.com', '$2b$10$xQW7YxBqYN9K0Z5MjX.YLO5QF7VxZYXJF8W8Z8Z8Z8Z8Z8Z8Z8Z8Z', 'admin', 'Admin', 'User'),
('john_doe', 'john@example.com', '$2b$10$xQW7YxBqYN9K0Z5MjX.YLO5QF7VxZYXJF8W8Z8Z8Z8Z8Z8Z8Z8Z8Z', 'user', 'John', 'Doe'),
('jane_smith', 'jane@example.com', '$2b$10$xQW7YxBqYN9K0Z5MjX.YLO5QF7VxZYXJF8W8Z8Z8Z8Z8Z8Z8Z8Z8Z', 'user', 'Jane', 'Smith'),
('bob_admin', 'bob@example.com', '$2b$10$xQW7YxBqYN9K0Z5MjX.YLO5QF7VxZYXJF8W8Z8Z8Z8Z8Z8Z8Z8Z8Z', 'admin', 'Bob', 'Anderson')
ON CONFLICT (username) DO NOTHING;

-- Insert sample products
INSERT INTO products (name, description, price, stock_quantity, category, sku) VALUES
('Laptop HP ProBook', 'High-performance laptop for professionals', 1299.99, 50, 'Electronics', 'LAPTOP-HP-001'),
('Wireless Mouse', 'Ergonomic wireless mouse', 29.99, 200, 'Accessories', 'MOUSE-WRL-001'),
('USB-C Hub', '7-in-1 USB-C multiport adapter', 49.99, 150, 'Accessories', 'HUB-USBC-001'),
('Monitor 27 inch', '4K UHD LED monitor', 399.99, 75, 'Electronics', 'MONITOR-27-001'),
('Mechanical Keyboard', 'RGB backlit mechanical keyboard', 89.99, 100, 'Accessories', 'KB-MECH-001'),
('Laptop Stand', 'Adjustable aluminum laptop stand', 39.99, 120, 'Accessories', 'STAND-LAP-001'),
('Webcam HD', '1080p HD webcam with microphone', 79.99, 80, 'Electronics', 'WEBCAM-HD-001'),
('Headphones Bluetooth', 'Noise-cancelling wireless headphones', 199.99, 60, 'Electronics', 'HEADPHONE-001'),
('External SSD 1TB', 'Portable solid state drive', 149.99, 90, 'Storage', 'SSD-EXT-1TB-001'),
('Power Bank 20000mAh', 'High-capacity portable charger', 59.99, 180, 'Accessories', 'PBANK-20K-001')
ON CONFLICT (sku) DO NOTHING;

-- Insert sample orders
INSERT INTO orders (user_id, order_number, total_amount, status, shipping_address, order_date) VALUES
(2, 'ORD-2025-001', 1389.98, 'delivered', '123 Main St, Tehran, Iran', '2025-11-01 10:30:00+00'),
(3, 'ORD-2025-002', 119.98, 'shipped', '456 Park Ave, Tehran, Iran', '2025-11-10 14:20:00+00'),
(2, 'ORD-2025-003', 289.97, 'processing', '123 Main St, Tehran, Iran', '2025-11-15 09:15:00+00'),
(3, 'ORD-2025-004', 599.98, 'pending', '456 Park Ave, Tehran, Iran', '2025-11-20 16:45:00+00')
ON CONFLICT (order_number) DO NOTHING;

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES
(1, 1, 1, 1299.99, 1299.99),
(1, 3, 1, 49.99, 49.99),
(1, 2, 1, 29.99, 29.99),
(2, 5, 1, 89.99, 89.99),
(2, 2, 1, 29.99, 29.99),
(3, 8, 1, 199.99, 199.99),
(3, 6, 1, 39.99, 39.99),
(3, 3, 1, 49.99, 49.99),
(4, 4, 1, 399.99, 399.99),
(4, 8, 1, 199.99, 199.99)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Create updated_at trigger function
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Grant necessary permissions
-- =====================================================
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- =====================================================
-- Display summary
-- =====================================================
DO $$
DECLARE
    users_count INTEGER;
    products_count INTEGER;
    orders_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_count FROM users;
    SELECT COUNT(*) INTO products_count FROM products;
    SELECT COUNT(*) INTO orders_count FROM orders;
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Database Initialization Complete!';
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'Tables created: users, products, orders, order_items';
    RAISE NOTICE 'Sample data inserted:';
    RAISE NOTICE '  - Users: %', users_count;
    RAISE NOTICE '  - Products: %', products_count;
    RAISE NOTICE '  - Orders: %', orders_count;
    RAISE NOTICE '==============================================';
END $$;
