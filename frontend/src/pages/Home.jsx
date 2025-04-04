// src/pages/Home.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import productService from "../services/productService";
import ProductCard from "../components/product/ProductCard";
import Button from "../components/common/Button";

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activePromotion, setActivePromotion] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Mock promotions data (replace with actual API data later)
  const promotions = [
    {
      id: 1,
      title: "Summer Sale",
      description: "Up to 50% off on summer essentials",
      bgColor: "bg-blue-600",
      image: "https://placehold.co/800x400/blue/white?text=Summer+Sale",
    },
    {
      id: 2,
      title: "New Collection",
      description: "Check out our latest fashion arrivals",
      bgColor: "bg-purple-600",
      image: "https://placehold.co/800x400/purple/white?text=New+Collection",
    },
    {
      id: 3,
      title: "Free Shipping",
      description: "On all orders over $50",
      bgColor: "bg-green-600",
      image: "https://placehold.co/800x400/green/white?text=Free+Shipping",
    },
  ];

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use Promise.allSettled to prevent one failed request from blocking others
        const [featuredResult, newArrivalsResult, categoriesResult] = await Promise.allSettled([
          productService.getFeaturedProducts(),
          productService.getProducts({
            sortBy: 'createdAt:desc',
            limit: 8
          }),
          productService.getCategories()
        ]);

        // Handle each result individually
        if (featuredResult.status === 'fulfilled') {
          setFeaturedProducts(Array.isArray(featuredResult.value) ? featuredResult.value : []);
        }

        if (newArrivalsResult.status === 'fulfilled') {
          setNewArrivals(Array.isArray(newArrivalsResult.value.products) ? newArrivalsResult.value.products : []);
        }

        if (categoriesResult.status === 'fulfilled') {
          setCategories(Array.isArray(categoriesResult.value) ? categoriesResult.value : []);
        }

      } catch (err) {
        console.error('Failed to fetch home data:', err);
        setError('Failed to load content. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Auto slide for hero carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % promotions.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [promotions.length]);

  // Rotate promotions
  useEffect(() => {
    const interval = setInterval(() => {
      setActivePromotion((prev) => (prev + 1) % promotions.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [promotions.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Announcement Bar */}
      <div
        className={`w-full py-2 text-white text-center ${promotions[activePromotion].bgColor}`}
      >
        <p className="text-sm font-medium">
          {promotions[activePromotion].description} |{" "}
          <Link to="/products" className="underline">
            Shop Now
          </Link>
        </p>
      </div>

      {/* Hero Carousel */}
      <section className="relative overflow-hidden">
        <div className="relative h-96 md:h-[500px]">
          {promotions.map((promo, index) => (
            <div
              key={promo.id}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                index === currentSlide
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10"></div>
              <img
                src={promo.image}
                alt={promo.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1/2 left-12 transform -translate-y-1/2 z-20 max-w-lg text-white">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  {promo.title}
                </h1>
                <p className="text-lg mb-6">{promo.description}</p>
                <Link to="/products">
                  <Button size="lg">Shop Now</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
        {/* Carousel navigation dots */}
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {promotions.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === index ? "w-8 bg-white" : "w-2 bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            ></button>
          ))}
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">
            Shop by Category
          </h2>
          {categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category) => (
                <Link
                  key={category._id}
                  to={`/products?category=${category._id}`}
                  className="group"
                >
                  <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden relative">
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center">
                      <h3 className="text-white text-lg font-medium text-center px-2">
                        {category.name}
                      </h3>
                    </div>
                    {category.image ? (
                      <img
                        src={category.image}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200">
                        {category.name}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center py-8">Categories coming soon.</p>
          )}
          <div className="text-center mt-8">
            <Link to="/categories">
              <Button variant="outline">View All Categories</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Featured Products</h2>
          {featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center py-8">Featured products coming soon.</p>
          )}
          <div className="text-center mt-8">
            <Link to="/products">
              <Button variant="outline">View All Products</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">New Arrivals</h2>
          {newArrivals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {newArrivals.slice(0, 4).map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center py-8">New arrivals coming soon.</p>
          )}
          <div className="text-center mt-8">
            <Link to="/products?sort=newest">
              <Button variant="outline">View All New Arrivals</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-4 bg-white">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Free Shipping</h3>
              <p className="text-gray-600">
                Free shipping on all orders over $50
              </p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Secure Payment</h3>
              <p className="text-gray-600">Safe & secure checkout experience</p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">30-Day Returns</h3>
              <p className="text-gray-600">Easy returns & exchange policy</p>
            </div>

            <div className="text-center p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer service</p>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Subscription */}
      <section className="py-12 px-4 bg-gray-100">
        <div className="container mx-auto">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">
              Subscribe to Our Newsletter
            </h2>
            <p className="text-gray-600 mb-6">
              Stay updated with our latest products, promotions, and exclusive
              offers.
            </p>
            <form className="flex flex-col sm:flex-row max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-grow px-4 py-3 rounded-l-md sm:rounded-l-md sm:rounded-r-none rounded-r-md sm:mb-0 mb-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <Button type="submit" className="sm:rounded-l-none rounded-l-md">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </section>

      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      )}

      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded-md mb-6">
          {error}
        </div>
      )}
    </div>
  );
};

export default Home;
