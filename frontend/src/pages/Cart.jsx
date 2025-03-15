// src/pages/Cart.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useCart from "../hooks/useCart";
import useAuth from "../hooks/useAuth";
import Button from "../components/common/Button";

const CartItem = ({ item, updateQuantity, removeFromCart }) => {
  const [quantity, setQuantity] = useState(item.quantity);
  const [isUpdating, setIsUpdating] = useState(false);

  // When the item.quantity changes from outside, update local state
  useEffect(() => {
    setQuantity(item.quantity);
  }, [item.quantity]);

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0 && value <= (item.countInStock || 10)) {
      setQuantity(value);
    }
  };

  const handleQuantityUpdate = () => {
    if (quantity !== item.quantity) {
      setIsUpdating(true);
      updateQuantity(item._id, quantity);
      setTimeout(() => setIsUpdating(false), 500); // UI feedback
    }
  };

  const handleRemove = () => {
    removeFromCart(item._id);
  };

  return (
    <div className="flex flex-col sm:flex-row py-6 border-b border-gray-200 last:border-b-0">
      {/* Product Image */}
      <div className="sm:w-1/6 mb-4 sm:mb-0">
        <div className="aspect-square w-full bg-gray-100 rounded-lg overflow-hidden">
          <Link to={`/products/${item._id}`}>
            <img
              src={
                item.images && item.images.length > 0
                  ? item.images[0]
                  : "https://via.placeholder.com/150"
              }
              alt={item.name}
              className="w-full h-full object-contain"
            />
          </Link>
        </div>
      </div>

      {/* Product Info */}
      <div className="sm:w-5/6 sm:pl-6 flex flex-col sm:flex-row">
        <div className="flex-grow">
          {/* Product Name & Details */}
          <Link
            to={`/products/${item._id}`}
            className="text-lg font-medium text-gray-900 hover:text-blue-600 mb-1 block"
          >
            {item.name}
          </Link>

          {/* SKU & Seller */}
          <div className="text-sm text-gray-600 mb-4">
            {item.sku && <span className="mr-4">SKU: {item.sku}</span>}
            {item.seller && (
              <span>
                Sold by:{" "}
                <Link
                  to={`/seller/${item.seller._id}`}
                  className="text-blue-600 hover:underline"
                >
                  {item.seller.name}
                </Link>
              </span>
            )}
          </div>

          {/* Quantity Controls - Mobile */}
          <div className="sm:hidden mb-4">
            <div className="flex items-center">
              <span className="mr-3 text-gray-700">Qty:</span>
              <div className="flex border border-gray-300 rounded">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M20 12H4"
                    ></path>
                  </svg>
                </button>
                <input
                  type="number"
                  min="1"
                  max={item.countInStock || 10}
                  value={quantity}
                  onChange={handleQuantityChange}
                  onBlur={handleQuantityUpdate}
                  className="w-12 h-8 text-center border-x border-gray-300 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() =>
                    setQuantity(Math.min(item.countInStock || 10, quantity + 1))
                  }
                  className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    ></path>
                  </svg>
                </button>
              </div>
              {isUpdating && (
                <span className="ml-2 text-gray-600 text-sm">Updating...</span>
              )}
            </div>
          </div>

          {/* Price - Mobile */}
          <div className="sm:hidden mb-4">
            <div className="font-medium text-lg">
              ${(item.price * quantity).toFixed(2)}
            </div>
            {quantity > 1 && (
              <div className="text-sm text-gray-600">
                ${item.price.toFixed(2)} each
              </div>
            )}
          </div>

          {/* Remove Button - Mobile */}
          <div className="sm:hidden">
            <button
              onClick={handleRemove}
              className="text-red-600 hover:text-red-800 text-sm flex items-center"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
              Remove
            </button>
          </div>
        </div>

        {/* Quantity Controls - Desktop */}
        <div className="hidden sm:flex items-center sm:w-1/4">
          <div className="flex border border-gray-300 rounded">
            <button
              type="button"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M20 12H4"
                ></path>
              </svg>
            </button>
            <input
              type="number"
              min="1"
              max={item.countInStock || 10}
              value={quantity}
              onChange={handleQuantityChange}
              onBlur={handleQuantityUpdate}
              className="w-12 h-8 text-center border-x border-gray-300 focus:outline-none"
            />
            <button
              type="button"
              onClick={() =>
                setQuantity(Math.min(item.countInStock || 10, quantity + 1))
              }
              className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 4v16m8-8H4"
                ></path>
              </svg>
            </button>
          </div>
          {isUpdating && (
            <span className="ml-2 text-gray-600 text-sm">Updating...</span>
          )}
        </div>

        {/* Price - Desktop */}
        <div className="hidden sm:block text-right sm:w-1/4">
          <div className="font-medium text-lg">
            ${(item.price * quantity).toFixed(2)}
          </div>
          {quantity > 1 && (
            <div className="text-sm text-gray-600">
              ${item.price.toFixed(2)} each
            </div>
          )}

          {/* Remove Button - Desktop */}
          <button
            onClick={handleRemove}
            className="mt-2 text-red-600 hover:text-red-800 text-sm flex items-center justify-end ml-auto"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
            Remove
          </button>
        </div>
      </div>
    </div>
  );
};

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotals,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const { subtotal, itemsCount } = getCartTotals();

  // Mock shipping rates (would come from API)
  const [shippingOptions, setShippingOptions] = useState([
    {
      id: "standard",
      name: "Standard Shipping",
      price: 5.99,
      estimate: "5-7 business days",
    },
    {
      id: "express",
      name: "Express Shipping",
      price: 14.99,
      estimate: "2-3 business days",
    },
    {
      id: "free",
      name: "Free Shipping",
      price: 0,
      estimate: "7-10 business days",
      minOrderValue: 50,
    },
  ]);
  const [selectedShipping, setSelectedShipping] = useState("standard");

  // Mock promo code
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);
  // Get selected shipping option
  const selectedShippingOption = shippingOptions.find(
    (option) => option.id === selectedShipping
  );

  // Calculate if eligible for free shipping
  const eligibleForFreeShipping = subtotal >= 50;

  // Apply promo code (mock implementation)
  const applyPromoCode = () => {
    if (!promoCode.trim()) {
      setPromoError("Please enter a promo code");
      return;
    }

    setApplyingPromo(true);
    setPromoError("");

    // Simulate API call delay
    setTimeout(() => {
      // Mock validation - in a real app this would be an API call
      if (promoCode.toUpperCase() === "DISCOUNT10") {
        setDiscount(subtotal * 0.1); // 10% discount
      } else if (promoCode.toUpperCase() === "WELCOME20") {
        setDiscount(subtotal * 0.2); // 20% discount
      } else {
        setPromoError("Invalid or expired promo code");
        setDiscount(0);
      }
      setApplyingPromo(false);
    }, 1000);
  };

  // Update shipping option based on eligibility
  useEffect(() => {
    if (eligibleForFreeShipping && selectedShipping === "standard") {
      setSelectedShipping("free");
    }
  }, [eligibleForFreeShipping, selectedShipping]);

  // Calculate order total
  const shippingCost = selectedShippingOption
    ? selectedShippingOption.price
    : 0;
  const estimatedTax = subtotal * 0.07; // Mock 7% tax rate
  const orderTotal = subtotal + shippingCost + estimatedTax - discount;

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate("/checkout");
    } else {
      navigate("/login", { state: { from: { pathname: "/checkout" } } });
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="flex justify-center mb-6">
            <svg
              className="w-20 h-20 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-medium mb-4">Your cart is empty</h2>
          <p className="text-gray-600 mb-6">
            Looks like you haven't added any products to your cart yet.
          </p>
          <Link to="/products">
            <Button variant="primary" size="lg">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items */}
        <div className="lg:w-2/3">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Cart Items ({itemsCount})</h2>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Clear Cart
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <CartItem
                    key={item._id}
                    item={item}
                    updateQuantity={updateQuantity}
                    removeFromCart={removeFromCart}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Continue Shopping Button */}
          <div className="flex justify-between mb-6">
            <Link to="/products">
              <Button variant="outline" className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  ></path>
                </svg>
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>

        {/* Order Summary */}
        <div className="lg:w-1/3">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden sticky top-4">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              {/* Subtotal */}
              <div className="flex justify-between py-2">
                <span className="text-gray-600">
                  Subtotal ({itemsCount} items)
                </span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>

              {/* Shipping Options */}
              <div className="py-2">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium">
                    {selectedShippingOption &&
                    selectedShippingOption.price === 0
                      ? "Free"
                      : `$${selectedShippingOption?.price.toFixed(2)}`}
                  </span>
                </div>

                <div className="mt-2 space-y-2">
                  {shippingOptions.map((option) => (
                    <div key={option.id} className="flex items-center">
                      <input
                        type="radio"
                        id={`shipping-${option.id}`}
                        name="shipping"
                        value={option.id}
                        checked={selectedShipping === option.id}
                        onChange={() => setSelectedShipping(option.id)}
                        disabled={
                          option.id === "free" && !eligibleForFreeShipping
                        }
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <label
                        htmlFor={`shipping-${option.id}`}
                        className="ml-2 block text-sm text-gray-700"
                      >
                        {option.name}{" "}
                        {option.price === 0
                          ? "(Free)"
                          : `($${option.price.toFixed(2)})`}
                        <span className="block text-xs text-gray-500">
                          {option.estimate}
                          {option.minOrderValue &&
                            ` - Minimum order value: $${option.minOrderValue}`}
                        </span>
                      </label>
                    </div>
                  ))}
                </div>

                {!eligibleForFreeShipping && (
                  <div className="mt-3 text-sm text-gray-600">
                    Add ${(50 - subtotal).toFixed(2)} more to qualify for free
                    shipping
                  </div>
                )}
              </div>

              {/* Estimated Tax */}
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Estimated Tax</span>
                <span className="font-medium">${estimatedTax.toFixed(2)}</span>
              </div>

              {/* Promo Code */}
              <div className="py-2">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Discount</span>
                  <span className="font-medium">-${discount.toFixed(2)}</span>
                </div>

                <div className="mt-2">
                  <label
                    htmlFor="promo-code"
                    className="block text-sm text-gray-700 mb-1"
                  >
                    Enter Promo Code
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="promo-code"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter code"
                    />
                    <Button
                      onClick={applyPromoCode}
                      disabled={applyingPromo}
                      className="rounded-l-none"
                    >
                      {applyingPromo ? "Applying..." : "Apply"}
                    </Button>
                  </div>

                  {promoError && (
                    <p className="mt-1 text-sm text-red-600">{promoError}</p>
                  )}

                  {discount > 0 && (
                    <p className="mt-1 text-sm text-green-600">
                      Promo code '{promoCode}' applied successfully!
                    </p>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-gray-200 my-4"></div>

              {/* Total */}
              <div className="flex justify-between items-center py-2">
                <span className="text-lg font-bold">Order Total</span>
                <span className="text-xl font-bold">
                  ${orderTotal.toFixed(2)}
                </span>
              </div>

              {/* Checkout Button */}
              <div className="mt-6">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleCheckout}
                >
                  {isAuthenticated ? "Proceed to Checkout" : "Login & Checkout"}
                </Button>
              </div>

              {/* Secure checkout message */}
              <div className="mt-4 flex justify-center items-center text-sm text-gray-600">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  ></path>
                </svg>
                Secure Checkout
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
