// src/components/product/ProductReviews.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import productService from "../../services/productService";
import useAuth from "../../hooks/useAuth";
import Button from "../common/Button";

const StarRating = ({ rating, setRating, editable = false }) => {
  const [hoverRating, setHoverRating] = useState(0);

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!editable}
          className={`w-6 h-6 ${
            editable ? "cursor-pointer" : "cursor-default"
          }`}
          onClick={() => editable && setRating(star)}
          onMouseEnter={() => editable && setHoverRating(star)}
          onMouseLeave={() => editable && setHoverRating(0)}
        >
          <svg
            className={`w-full h-full ${
              star <= (hoverRating || rating)
                ? "text-yellow-400"
                : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
          </svg>
        </button>
      ))}
    </div>
  );
};

const ReviewItem = ({ review }) => {
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 mr-3">
            {review.user && review.user.name
              ? review.user.name.charAt(0).toUpperCase()
              : "A"}
          </div>
          <div>
            <p className="font-medium">
              {review.user ? review.user.name : "Anonymous"}
            </p>
            <div className="flex mt-1">
              <StarRating rating={review.rating} />
              <span className="ml-2 text-sm text-gray-600">
                {formatDate(review.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Helpful buttons */}
        <div className="flex items-center text-sm">
          <button className="flex items-center text-gray-500 hover:text-gray-700">
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
                d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
              ></path>
            </svg>
            Helpful ({review.helpfulCount || 0})
          </button>
          <button className="flex items-center text-gray-500 hover:text-gray-700 ml-4">
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
                d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2"
              ></path>
            </svg>
            Not Helpful ({review.notHelpfulCount || 0})
          </button>
        </div>
      </div>

      {/* Review title */}
      {review.title && (
        <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
      )}

      {/* Review content */}
      <p className="text-gray-700 mb-2">{review.comment}</p>

      {/* Review images */}
      {review.images && review.images.length > 0 && (
        <div className="flex gap-2 mt-3">
          {review.images.map((image, index) => (
            <div
              key={index}
              className="w-16 h-16 rounded overflow-hidden bg-gray-100"
            >
              <img
                src={image}
                alt={`Review image ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
const ProductReviews = ({ productId }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    averageRating: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });

  // Review form state
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const data = await productService.getProductReviews(productId);
        setReviews(data.reviews);

        // Calculate review statistics
        const total = data.reviews.length;
        const ratingSum = data.reviews.reduce(
          (sum, review) => sum + review.rating,
          0
        );
        const averageRating = total > 0 ? ratingSum / total : 0;

        // Count reviews by rating
        const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        data.reviews.forEach((review) => {
          ratingCounts[review.rating] = (ratingCounts[review.rating] || 0) + 1;
        });

        setReviewStats({
          total,
          averageRating,
          ratingCounts,
        });
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
        setError("Failed to load reviews. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [productId]);

  const handleReviewFormChange = (e) => {
    const { name, value } = e.target;
    setReviewForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!reviewForm.rating) {
      setFormError("Please select a rating");
      return;
    }

    if (!reviewForm.comment.trim()) {
      setFormError("Please enter a review comment");
      return;
    }

    setFormError("");
    setSubmitting(true);

    try {
      const newReview = await productService.addProductReview(
        productId,
        reviewForm
      );

      // Add the new review to the existing reviews
      setReviews([newReview, ...reviews]);

      // Update review stats
      const newTotal = reviewStats.total + 1;
      const newRatingSum =
        reviewStats.averageRating * reviewStats.total + newReview.rating;
      const newAverageRating = newRatingSum / newTotal;

      // Update rating counts
      const newRatingCounts = { ...reviewStats.ratingCounts };
      newRatingCounts[newReview.rating] =
        (newRatingCounts[newReview.rating] || 0) + 1;

      setReviewStats({
        total: newTotal,
        averageRating: newAverageRating,
        ratingCounts: newRatingCounts,
      });

      // Reset form
      setReviewForm({
        rating: 5,
        title: "",
        comment: "",
      });

      // Hide the form
      setShowReviewForm(false);
    } catch (err) {
      console.error("Failed to submit review:", err);
      setFormError(
        err.message || "Failed to submit your review. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate percentage for a rating level (for progress bars)
  const calculatePercentage = (count) => {
    return reviewStats.total > 0 ? (count / reviewStats.total) * 100 : 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6">Customer Reviews</h2>

        {loading ? (
          <div className="flex justify-center items-center h-20">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <div>
            {/* Reviews Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Left: Overall Rating */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-5xl font-bold text-gray-900 mb-2">
                  {reviewStats.averageRating.toFixed(1)}
                </div>
                <div className="flex mb-1">
                  <StarRating rating={Math.round(reviewStats.averageRating)} />
                </div>
                <p className="text-gray-600">
                  Based on {reviewStats.total} reviews
                </p>

                {/* Review action buttons */}
                <div className="mt-6">
                  {isAuthenticated ? (
                    <Button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="flex items-center"
                    >
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        ></path>
                      </svg>
                      {showReviewForm ? "Cancel Review" : "Write a Review"}
                    </Button>
                  ) : (
                    <Link to="/login" className="inline-block">
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
                            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                          ></path>
                        </svg>
                        Login to Write a Review
                      </Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Right: Rating Breakdown */}
              <div>
                <h3 className="font-medium mb-3">Rating Breakdown</h3>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center mb-2">
                    <div className="w-20 flex items-center">
                      <span className="mr-2">{rating}</span>
                      <svg
                        className="w-4 h-4 text-yellow-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    </div>
                    <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-yellow-400"
                        style={{
                          width: `${calculatePercentage(
                            reviewStats.ratingCounts[rating]
                          )}%`,
                        }}
                      ></div>
                    </div>
                    <div className="w-16 text-right text-sm text-gray-600">
                      {reviewStats.ratingCounts[rating] || 0}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="mb-8 p-4 border border-gray-200 rounded-lg">
                <h3 className="text-lg font-medium mb-4">Write a Review</h3>
                <form onSubmit={handleReviewSubmit}>
                  {formError && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-md">
                      {formError}
                    </div>
                  )}

                  <div className="mb-4">
                    <label
                      htmlFor="rating"
                      className="block text-gray-700 mb-2"
                    >
                      Rating <span className="text-red-500">*</span>
                    </label>
                    <StarRating
                      rating={reviewForm.rating}
                      setRating={(rating) =>
                        setReviewForm((prev) => ({ ...prev, rating }))
                      }
                      editable
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="title" className="block text-gray-700 mb-2">
                      Review Title
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={reviewForm.title}
                      onChange={handleReviewFormChange}
                      placeholder="Summarize your experience (optional)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="mb-4">
                    <label
                      htmlFor="comment"
                      className="block text-gray-700 mb-2"
                    >
                      Review <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      value={reviewForm.comment}
                      onChange={handleReviewFormChange}
                      rows="4"
                      placeholder="Share your experience with this product"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    ></textarea>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowReviewForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Submitting..." : "Submit Review"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Reviews List */}
            <div>
              <h3 className="font-medium mb-4">
                {reviewStats.total}{" "}
                {reviewStats.total === 1 ? "Review" : "Reviews"}
              </h3>

              {reviews.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-400 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    ></path>
                  </svg>
                  <p className="text-gray-600 mb-2">No reviews yet.</p>
                  <p className="text-gray-500">
                    Be the first to share your experience!
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {reviews.map((review) => (
                    <ReviewItem key={review._id} review={review} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
