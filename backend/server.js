const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productImageRoutes = require('./routes/productImageRoutes');
const cookieParser = require('cookie-parser');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const searchRoutes = require('./routes/searchRoutes');
const { logSlowQueries } = require('./middleware/mongoQueryMiddleware');
const dbMetrics = require('./utils/dbMetrics');
const { protect, admin } = require('./middleware/authMiddleware');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors({
  origin: 'http://localhost:5173', // Your frontend development URL
  credentials: true
}));

// Add cookie parser middleware 
app.use(cookieParser());

// Use the slow query monitoring middleware (before routes)
app.use(logSlowQueries);

// Start database metrics monitoring
dbMetrics.startMonitoring();

// Mount routers
app.use('/api/auth', authRoutes);
// Mount the user routes
app.use('/api/users', userRoutes);
// Mount the admin routes
app.use('/api/admin', adminRoutes);
// reviews //
app.use('/api/reviews', reviewRoutes);
// products and category //
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
// product image //
app.use('/api/products', productImageRoutes);
//shopping cart
app.use('/api/cart', cartRoutes);
//order routes
app.use('/api/orders', orderRoutes);
// payment routes
app.use('/api/payments', paymentRoutes);
// search routes
app.use('/api/search', searchRoutes);

// Add database metrics endpoint (admin only)
app.get('/api/admin/metrics/db', protect, admin, (req, res) => {
  res.json(dbMetrics.getStats());
});

// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));