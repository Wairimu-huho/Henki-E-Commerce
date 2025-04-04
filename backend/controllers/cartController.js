const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

// Helper function to get or create cart
const getOrCreateCart = async (userId, sessionId) => {
  let cart;
  
  // For logged in users
  if (userId) {
    console.log('Finding cart for user:', userId);
    // Find existing user cart
    cart = await Cart.findOne({ user: userId });
    
    // If user has no cart but has sessionId, find and transfer session cart
    if (!cart && sessionId) {
      console.log('No user cart found, checking for session cart with ID:', sessionId);
      const sessionCart = await Cart.findOne({ sessionId });
      if (sessionCart) {
        console.log('Found session cart, transferring to user');
        // Transfer the session cart to the user
        sessionCart.user = userId;
        sessionCart.sessionId = undefined;
        await sessionCart.save();
        return sessionCart;
      }
    }
    
    // If still no cart, create a new one for the user
    if (!cart) {
      console.log('Creating new cart for user:', userId);
      cart = await Cart.create({ user: userId });
    } else {
      console.log('Found existing user cart:', cart._id);
    }
    
    return cart;
  }
  
  // For guest users
  if (sessionId) {
    console.log('Finding cart for session:', sessionId);
    cart = await Cart.findOne({ sessionId });
    if (!cart) {
      console.log('Creating new cart for session');
      cart = await Cart.create({ sessionId });
    } else {
      console.log('Found existing session cart:', cart._id);
    }
    return cart;
  }
  
  throw new Error('User ID or Session ID is required');
};

// @desc    Get cart
// @route   GET /api/cart
// @access  Public
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user._id : null;
  const sessionId = req.cookies.sessionId || req.body.sessionId || req.query.sessionId;

  console.log('getCart called for user:', userId, 'session:', sessionId);

  // Create session ID for new guests
  if (!userId && !sessionId) {
    const newSessionId = uuidv4();
    console.log('Creating new session ID for guest:', newSessionId);
    res.cookie('sessionId', newSessionId, { 
      httpOnly: true, 
      maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
    });
    
    const newCart = await Cart.create({ sessionId: newSessionId });
    console.log('Created new cart for guest:', newCart._id);
    return res.json(newCart);
  }

  try {
    const cart = await getOrCreateCart(userId, sessionId);
    console.log('Got cart with items:', cart.items.length);
    
    // Populate product details to get the latest information
    await cart.populate({
      path: 'items.product',
      select: 'name price image countInStock'
    });
    
    // Update items with current product information
    let cartModified = false;
    for (let i = 0; i < cart.items.length; i++) {
      const item = cart.items[i];
      const product = item.product;
      
      // Remove item if product no longer exists or is inactive
      if (!product || !product.isActive) {
        console.log('Removing unavailable product from cart:', item.product);
        cart.items.splice(i, 1);
        i--;
        cartModified = true;
        continue;
      }
      
      // Update price if it changed
      if (item.price !== product.price) {
        console.log('Updating price for product:', item.product);
        item.price = product.price;
        cartModified = true;
      }
      
      // Update availability
      if (item.quantity > product.countInStock) {
        console.log('Adjusting quantity for product:', item.product);
        item.quantity = Math.max(1, product.countInStock);
        cartModified = true;
      }
    }
    
    if (cartModified) {
      console.log('Cart was modified, saving changes');
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
    console.error('Error getting cart:', error);
    res.status(500);
    throw new Error(`Error getting cart: ${error.message}`);
  }
});

// @desc    Add item to cart
// @route   POST /api/cart/items
// @access  Public
const addItemToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variant = null } = req.body;
  const userId = req.user ? req.user._id : null;
  const sessionId = req.cookies.sessionId || req.body.sessionId;
  
  console.log('addItemToCart called:');
  console.log('- User ID:', userId);
  console.log('- Session ID:', sessionId);
  console.log('- Product ID:', productId);
  console.log('- Quantity:', quantity);
  
  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required');
  }
  
  // Create session ID for new guests
  if (!userId && !sessionId) {
    const newSessionId = uuidv4();
    console.log('Creating new session ID for guest:', newSessionId);
    res.cookie('sessionId', newSessionId, { 
      httpOnly: true, 
      maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
    });
    req.body.sessionId = newSessionId;
  }
  
  try {
    // Find or create cart
    const cart = await getOrCreateCart(userId, sessionId || req.body.sessionId);
    console.log('Got cart for adding item:', cart._id);
    
    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    
    console.log('Found product:', product.name);
    
    if (!product.isActive) {
      res.status(400);
      throw new Error('Product is not available');
    }
    
    if (product.countInStock < 1) {
      res.status(400);
      throw new Error('Product is out of stock');
    }
    
    // Check if requested quantity is available
    const requestedQuantity = parseInt(quantity);
    if (isNaN(requestedQuantity) || requestedQuantity < 1) {
      res.status(400);
      throw new Error('Quantity must be at least 1');
    }
    
    if (requestedQuantity > product.countInStock) {
      res.status(400);
      throw new Error(`Only ${product.countInStock} items available`);
    }
    
    // Check if product is already in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.product && item.product.toString() === productId.toString() && 
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );
    
    if (existingItemIndex > -1) {
      // Update quantity if product already in cart
      console.log('Product already in cart, updating quantity');
      const newQuantity = cart.items[existingItemIndex].quantity + requestedQuantity;
      
      if (newQuantity > product.countInStock) {
        res.status(400);
        throw new Error(`Cannot add ${requestedQuantity} more items. Only ${product.countInStock} available in total.`);
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item to cart
      console.log('Adding new product to cart');
      const price = variant && variant.price ? variant.price : product.price;
      
      cart.items.push({
        product: productId,
        name: product.name,
        image: product.image,
        price,
        quantity: requestedQuantity,
        variant
      });
    }
    
    console.log('Saving cart with items:', cart.items.length);
    const savedCart = await cart.save();
    console.log('Cart saved successfully, items count:', savedCart.items.length);
    
    res.status(201).json(savedCart);
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(`Error adding item to cart: ${error.message}`);
  }
});

// @desc    Update cart item
// @route   PUT /api/cart/items/:itemId
// @access  Public
const updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const { itemId } = req.params;
  
  console.log('updateCartItem called for item:', itemId, 'quantity:', quantity);
  
  if (!quantity || isNaN(parseInt(quantity))) {
    res.status(400);
    throw new Error('Valid quantity is required');
  }
  
  const userId = req.user ? req.user._id : null;
  const sessionId = req.cookies.sessionId || req.body.sessionId;
  
  if (!userId && !sessionId) {
    res.status(400);
    throw new Error('User ID or Session ID is required');
  }
  
  try {
    const cart = await getOrCreateCart(userId, sessionId);
    console.log('Found cart for update:', cart._id);
    
    // Find the item in the cart
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      res.status(404);
      throw new Error('Item not found in cart');
    }
    
    // Get the latest product details
    const product = await Product.findById(cart.items[itemIndex].product);
    
    if (!product || !product.isActive) {
      // Remove item if product is no longer available
      console.log('Product no longer available, removing from cart');
      cart.items.splice(itemIndex, 1);
      await cart.save();
      res.status(400);
      throw new Error('Product is no longer available');
    }
    
    // Check if requested quantity is valid
    const requestedQuantity = parseInt(quantity);
    
    if (requestedQuantity <= 0) {
      // Remove item if quantity is 0 or negative
      console.log('Quantity <= 0, removing item from cart');
      cart.items.splice(itemIndex, 1);
    } else if (requestedQuantity > product.countInStock) {
      // Set to max available if requested more than available
      console.log('Requested quantity exceeds stock, setting to maximum available');
      cart.items[itemIndex].quantity = product.countInStock;
      res.status(200); // Still return 200 but with a modified quantity
    } else {
      // Update to requested quantity
      console.log('Updating quantity to:', requestedQuantity);
      cart.items[itemIndex].quantity = requestedQuantity;
    }
    
    // Update price in case it changed
    if (product.price !== cart.items[itemIndex].price) {
      console.log('Updating price to current price');
      cart.items[itemIndex].price = product.price;
    }
    
    console.log('Saving cart updates');
    await cart.save();
    res.json(cart);
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(`Error updating cart item: ${error.message}`);
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Public
const removeCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  console.log('removeCartItem called for item:', itemId);
  
  const userId = req.user ? req.user._id : null;
  const sessionId = req.cookies.sessionId || req.body.sessionId || req.query.sessionId;
  
  if (!userId && !sessionId) {
    res.status(400);
    throw new Error('User ID or Session ID is required');
  }
  
  try {
    const cart = await getOrCreateCart(userId, sessionId);
    console.log('Found cart for item removal:', cart._id);
    
    // Find the item in the cart
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      res.status(404);
      throw new Error('Item not found in cart');
    }
    
    // Remove the item
    console.log('Removing item at index:', itemIndex);
    cart.items.splice(itemIndex, 1);
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500);
    throw new Error(`Error removing item from cart: ${error.message}`);
  }
});

// @desc    Clear cart
// @route   DELETE /api/cart/items
// @access  Public
const clearCart = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user._id : null;
  const sessionId = req.cookies.sessionId || req.body.sessionId || req.query.sessionId;
  
  console.log('clearCart called for user:', userId, 'session:', sessionId);
  
  if (!userId && !sessionId) {
    res.status(400);
    throw new Error('User ID or Session ID is required');
  }
  
  try {
    const cart = await getOrCreateCart(userId, sessionId);
    console.log('Found cart to clear:', cart._id);
    
    // Clear all items
    cart.items = [];
    cart.appliedCoupon = undefined;
    cart.shippingMethod = undefined;
    
    console.log('Clearing cart contents');
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500);
    throw new Error(`Error clearing cart: ${error.message}`);
  }
});

// @desc    Apply coupon to cart
// @route   POST /api/cart/apply-coupon
// @access  Public
const applyCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;
  const userId = req.user ? req.user._id : null;
  const sessionId = req.cookies.sessionId || req.body.sessionId;
  
  console.log('applyCoupon called with code:', couponCode);
  
  if (!couponCode) {
    res.status(400);
    throw new Error('Coupon code is required');
  }
  
  if (!userId && !sessionId) {
    res.status(400);
    throw new Error('User ID or Session ID is required');
  }
  
  try {
    const cart = await getOrCreateCart(userId, sessionId);
    console.log('Found cart for coupon application:', cart._id);
    
    // In a real app, you would validate the coupon against a Coupon model
    // For now, we'll just simulate a basic coupon check
    
    // Mock coupon validation - replace with actual coupon validation logic
    const validCoupon = {
      code: couponCode.toUpperCase(),
      discountType: 'percentage',
      discountValue: 10 // 10% discount
    };
    
    // Apply the coupon to the cart
    console.log('Applying coupon to cart');
    cart.appliedCoupon = validCoupon;
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500);
    throw new Error(`Error applying coupon: ${error.message}`);
  }
});

// @desc    Remove coupon from cart
// @route   DELETE /api/cart/coupon
// @access  Public
const removeCoupon = asyncHandler(async (req, res) => {
  const userId = req.user ? req.user._id : null;
  const sessionId = req.cookies.sessionId || req.body.sessionId || req.query.sessionId;
  
  console.log('removeCoupon called');
  
  if (!userId && !sessionId) {
    res.status(400);
    throw new Error('User ID or Session ID is required');
  }
  
  try {
    const cart = await getOrCreateCart(userId, sessionId);
    console.log('Found cart for coupon removal:', cart._id);
    
    // Remove coupon
    console.log('Removing coupon from cart');
    cart.appliedCoupon = undefined;
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    console.error('Error removing coupon:', error);
    res.status(500);
    throw new Error(`Error removing coupon: ${error.message}`);
  }
});

// @desc    Set shipping method
// @route   POST /api/cart/shipping-method
// @access  Public
const setShippingMethod = asyncHandler(async (req, res) => {
  const { shippingMethod } = req.body;
  const userId = req.user ? req.user._id : null;
  const sessionId = req.cookies.sessionId || req.body.sessionId;
  
  console.log('setShippingMethod called with method:', shippingMethod?.name);
  
  if (!shippingMethod || !shippingMethod.name) {
    res.status(400);
    throw new Error('Shipping method is required');
  }
  
  if (!userId && !sessionId) {
    res.status(400);
    throw new Error('User ID or Session ID is required');
  }
  
  try {
    const cart = await getOrCreateCart(userId, sessionId);
    console.log('Found cart for shipping method update:', cart._id);
    
    // In a real app, you would validate the shipping method against a ShippingMethod model
    // For now, we'll just use the provided shipping method
    
    // Set the shipping method
    console.log('Setting shipping method');
    cart.shippingMethod = {
      name: shippingMethod.name,
      price: shippingMethod.price || 0
    };
    
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    console.error('Error setting shipping method:', error);
    res.status(500);
    throw new Error(`Error setting shipping method: ${error.message}`);
  }
});

// Test function for direct cart manipulation
const testAddToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error('User authentication required');
  }
  
  console.log('TEST - Direct add to cart for user:', req.user._id, 'product:', productId);
  
  // Get product details
  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }
  
  // Create or update cart directly (no helper function)
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }
  
  // Add item directly to cart
  cart.items.push({
    product: productId,
    name: product.name,
    image: product.image,
    price: product.price,
    quantity: parseInt(quantity)
  });
  
  // Save with error handling
  try {
    const savedCart = await cart.save();
    console.log('Cart saved successfully:', savedCart.items.length, 'items');
    res.status(201).json(savedCart);
  } catch (error) {
    console.error('Error saving cart:', error);
    res.status(500).json({ 
      message: 'Error saving cart', 
      error: error.toString(),
      details: error.errors ? JSON.stringify(error.errors) : undefined
    });
  }
});

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  applyCoupon,
  removeCoupon,
  setShippingMethod,
  testAddToCart  // Added test function
};