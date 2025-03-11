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


// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Add cookie parser middleware 
app.use(cookieParser());

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


// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, console.log(`Server running on port ${PORT}`));