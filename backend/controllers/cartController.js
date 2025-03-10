const asyncHandler = require('express-async-handler');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

// Helper function to get or create cart
const getOrCreateCart = async (userId, sessionId) => {
  let cart;
  
  // For logged in users
  if (userId) {
    // Find existing user cart
    cart = await Cart.findOne({ user: userId });
    
    // If user has no cart but has sessionId, find and transfer session cart
    if (!cart && sessionId) {
      const sessionCart = await Cart.findOne({ sessionId });
      if (sessionCart) {
        // Transfer the session cart to the user
        sessionCart.user = userId;
        sessionCart.sessionId = undefined;
        await sessionCart.save();
        return sessionCart;
      }
    }
    
    // If still no cart, create a new one for the user
    if (!cart) {
      cart = await Cart.create({ user: userId });
    }
    
    return cart;
  }
  
  // For guest users
  if (sessionId) {
    cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = await Cart.create({ sessionId });
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

  // Create session ID for new guests
  if (!userId && !sessionId) {
    const newSessionId = uuidv4();
    res.cookie('sessionId', newSessionId, { 
      httpOnly: true, 
      maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
    });
    
    const newCart = await Cart.create({ sessionId: newSessionId });
    return res.json(newCart);
  }

  try {
    const cart = await getOrCreateCart(userId, sessionId);
    
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
        cart.items.splice(i, 1);
        i--;
        cartModified = true;
        continue;
      }
      
      // Update price if it changed
      if (item.price !== product.price) {
        item.price = product.price;
        cartModified = true;
      }
      
      // Update availability
      if (item.quantity > product.countInStock) {
        item.quantity = Math.max(1, product.countInStock);
        cartModified = true;
      }
    }
    
    if (cartModified) {
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
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
  
  if (!productId) {
    res.status(400);
    throw new Error('Product ID is required');
  }
  
  // Create session ID for new guests
  if (!userId && !sessionId) {
    const newSessionId = uuidv4();
    res.cookie('sessionId', newSessionId, { 
      httpOnly: true, 
      maxAge: 30 * 24 * 60 * 60 * 1000  // 30 days
    });
    req.body.sessionId = newSessionId;
  }
  
  try {
    // Find or create cart
    const cart = await getOrCreateCart(userId, sessionId || req.body.sessionId);
    
    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error('Product not found');
    }
    
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
      item.product.toString() === productId && 
      JSON.stringify(item.variant) === JSON.stringify(variant)
    );
    
    if (existingItemIndex > -1) {
      // Update quantity if product already in cart
      const newQuantity = cart.items[existingItemIndex].quantity + requestedQuantity;
      
      if (newQuantity > product.countInStock) {
        res.status(400);
        throw new Error(`Cannot add ${requestedQuantity} more items. Only ${product.countInStock} available in total.`);
      }
      
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item to cart
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
    
    await cart.save();
    res.status(201).json(cart);
  } catch (error) {
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
      cart.items.splice(itemIndex, 1);
      await cart.save();
      res.status(400);
      throw new Error('Product is no longer available');
    }
    
    // Check if requested quantity is valid
    const requestedQuantity = parseInt(quantity);
    
    if (requestedQuantity <= 0) {
      // Remove item if quantity is 0 or negative
      cart.items.splice(itemIndex, 1);
    } else if (requestedQuantity > product.countInStock) {
      // Set to max available if requested more than available
      cart.items[itemIndex].quantity = product.countInStock;
      res.status(200); // Still return 200 but with a modified quantity
    } else {
      // Update to requested quantity
      cart.items[itemIndex].quantity = requestedQuantity;
    }
    
    // Update price in case it changed
    if (product.price !== cart.items[itemIndex].price) {
      cart.items[itemIndex].price = product.price;
    }
    
    await cart.save();
    res.json(cart);
  } catch (error) {
    res.status(res.statusCode === 200 ? 500 : res.statusCode);
    throw new Error(`Error updating cart item: ${error.message}`);
  }
});

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
// @access  Public
const removeCartItem = asyncHandler(async (req, res) => {
  const { itemId } = req.params;
  const userId = req.user ? req.user._id : null;
  const sessionId = req.cookies.sessionId || req.body.sessionId || req.query.sessionId;
  
  if (!userId && !sessionId) {
    res.status(400);
    throw new Error('User ID or Session ID is required');
  }
  
  try {
    const cart = await getOrCreateCart(userId, sessionId);
    
    // Find the item in the cart
    const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
    
    if (itemIndex === -1) {
      res.status(404);
      throw new Error('Item not found in cart');
    }
    
    // Remove the item
    cart.items.splice(itemIndex, 1);
    await cart.save();
    
    res.json(cart);
  } catch (error) {
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
  
  if (!userId && !sessionId) {
    res.status(400);
    throw new Error('User ID or Session ID is required');
  }
  
  try {
    const cart = await getOrCreateCart(userId, sessionId);
    
    // Clear all items
    cart.items = [];
    cart.appliedCoupon = undefined;
    cart.shippingMethod = undefined;
    
    await cart.save();
    
    res.json(cart);
  } catch (error) {
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
    
    // In a real app, you would validate the coupon against a Coupon model
    // For now, we'll just simulate a basic coupon check
    
    // Mock coupon validation - replace with actual coupon validation logic
    const validCoupon = {
      code: couponCode.toUpperCase(),
      discountType: 'percentage',
      discountValue: 10 // 10% discount
    };
    
    // Apply the coupon to the cart
    cart.appliedCoupon = validCoupon;
    await cart.save();
    
    res.json(cart);
  } catch (error) {
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
  
  if (!userId && !sessionId) {
    res.status(400);
    throw new Error('User ID or Session ID is required');
  }
  
  try {
    const cart = await getOrCreateCart(userId, sessionId);
    
    // Remove coupon
    cart.appliedCoupon = undefined;
    await cart.save();
    
    res.json(cart);
  } catch (error) {
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
    
    // In a real app, you would validate the shipping method against a ShippingMethod model
    // For now, we'll just use the provided shipping method
    
    // Set the shipping method
    cart.shippingMethod = {
      name: shippingMethod.name,
      price: shippingMethod.price || 0
    };
    
    await cart.save();
    
    res.json(cart);
  } catch (error) {
    res.status(500);
    throw new Error(`Error setting shipping method: ${error.message}`);
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
  setShippingMethod
};
