import React, { useState, useEffect } from "react";
const App = () => {
  const [mainImage, setMainImage] = useState("");
  const [thumbnails, setThumbnails] = useState([]);

  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState("specifications");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    title: "",
    comment: "",
    verifiedPurchase: false,
  });

  const relatedProducts = [
    {
      id: 1,
      name: "Forged Pistons Set (4)",
      brand: "RaceTech",
      rating: 4.9,
      price: 399.99,
      image:
        "https://readdy.ai/api/search-image?query=Forged%20pistons%20set%20automotive%20parts%2C%20precision%20machined%20metal%2C%20industrial%20photography%2C%20studio%20lighting%2C%20black%20background%2C%20professional%20product%20photography%2C%20high%20resolution%2C%20mechanical%20engineering%20detail%2C%20silver%20metallic%20finish&width=280&height=280&seq=5&orientation=squarish",
    },
    {
      id: 2,
      name: "Complete Cylinder Head Assembly",
      brand: "OEMPlus",
      rating: 4.7,
      price: 599.99,
      image:
        "https://readdy.ai/api/search-image?query=Complete%20cylinder%20head%20assembly%20automotive%20part%2C%20precision%20machined%20metal%2C%20industrial%20photography%2C%20studio%20lighting%2C%20black%20background%2C%20professional%20product%20photography%2C%20high%20resolution%2C%20mechanical%20engineering%20detail%2C%20silver%20metallic%20finish&width=280&height=280&seq=6&orientation=squarish",
    },
    {
      id: 3,
      name: "Performance Intake Manifold",
      brand: "TurboForce",
      rating: 4.6,
      price: 349.99,
      image:
        "https://readdy.ai/api/search-image?query=Performance%20intake%20manifold%20automotive%20part%2C%20precision%20machined%20metal%2C%20industrial%20photography%2C%20studio%20lighting%2C%20black%20background%2C%20professional%20product%20photography%2C%20high%20resolution%2C%20mechanical%20engineering%20detail%2C%20silver%20metallic%20finish&width=280&height=280&seq=7&orientation=squarish",
    },
    {
      id: 4,
      name: "Timing Chain Kit",
      brand: "PowerTech",
      rating: 4.5,
      price: 189.99,
      image:
        "https://readdy.ai/api/search-image?query=Timing%20chain%20kit%20automotive%20part%2C%20precision%20machined%20metal%2C%20industrial%20photography%2C%20studio%20lighting%2C%20black%20background%2C%20professional%20product%20photography%2C%20high%20resolution%2C%20mechanical%20engineering%20detail%2C%20silver%20metallic%20finish&width=280&height=280&seq=8&orientation=squarish",
    },
  ];

  const specifications = [
    { name: "Material", value: "Billet Steel" },
    { name: "Lift", value: '0.550" Intake / 0.565" Exhaust' },
    { name: "Duration", value: "242° Intake / 248° Exhaust" },
    { name: "Lobe Separation", value: "112°" },
    { name: "Grind Type", value: "Hydraulic Roller" },
    { name: "Valve Springs Required", value: "Yes (Sold Separately)" },
    { name: "Weight", value: "6.2 lbs (2.8 kg)" },
    { name: "Finish", value: "Nitrided" },
    { name: "Part Number", value: "PT-CAM-HP-350" },
  ];

  const features = [
    "Increased horsepower and torque throughout the RPM range",
    "Precision ground lobes for consistent valve timing",
    "Heat-treated for extended durability",
    "CNC machined from premium billet steel",
    "Nitrided finish for reduced friction and improved wear resistance",
    "Optimized valve overlap for improved throttle response",
    "Compatible with stock valve springs (upgraded springs recommended)",
    "Designed for street performance and weekend track use",
  ];

  const compatibleVehicles = [
    "Ford Mustang GT (2015-2022)",
    "Ford F-150 5.0L (2011-2022)",
    "Ford Shelby GT350 (2016-2020)",
    "Ford Explorer ST (2020-2022)",
    "Lincoln Navigator (2018-2022)",
  ];

  const reviews = [
    {
      id: 1,
      author: "Mike R.",
      date: "May 15, 2025",
      rating: 5,
      verified: true,
      title: "Amazing power gains!",
      comment:
        "Installed this camshaft along with supporting mods and gained 45hp at the wheels. Idle is slightly lopey but not too aggressive for daily driving. Highly recommended!",
    },
    {
      id: 2,
      author: "Sarah T.",
      date: "April 22, 2025",
      rating: 4,
      verified: true,
      title: "Great performance upgrade",
      comment:
        "Good quality camshaft that delivered as promised. Installation was straightforward with the right tools. Only giving 4 stars because it did require valve spring upgrades which added to the cost.",
    },
    {
      id: 3,
      author: "David M.",
      date: "March 8, 2025",
      rating: 5,
      verified: true,
      title: "Perfect for my build",
      comment:
        "This camshaft completely transformed my Mustang. The power delivery is smooth and pulls hard all the way to redline. Customer service was excellent when I had questions about compatibility.",
    },
  ];

  const [analogs, setAnalogs] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(
          "https://api.partsapi.ru/?method=getArticles&key=f7b2c0f613bf0c9ee6fd7c963a8d01b6&lang=16&strId=100470&carId=9877&carType=PC"
        );
        const data = await res.json();

        const result = await fetch(
          "https://api.partsapi.ru/?method=getArticleMedia&key=831ecbd71823d2827768fdcaf25e26ee&ART_ID=6731574&LANG=16"
        );
        const image = await result.json();

        const resu = await fetch("/api/py/proxy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ partNumber: "OE32053" }),
        });
        const parts = await resu.json();

        setAnalogs(parseProductString(parts));
        setMainImage(image[0].ART_MEDIA_SOURCE);
      } catch (e) {
        console.error(e.message);
      }
    };
    analogs.length == 0 && run();
  }, [setAnalogs]);

  function parseProductString(str) {
    // Step 1: Convert single quotes to double quotes while preserving escaped characters
    let jsonString = str.replace(/'/g, '"');

    // Step 2: Fix escaped Unicode sequences (optional, depending on your data source)
    jsonString = jsonString.replace(/\\u([\dA-Fa-f]{4})/g, (match, grp) => {
      return String.fromCharCode(parseInt(grp, 16));
    });

    // Step 3: Parse the JSON string
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      console.error("Error parsing product string:", error);
      return [];
    }
  }

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      setQuantity(value);
    }
  };

  const incrementQuantity = () => {
    setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <header className="sticky top-0 z-50 md:bg-black md:border-b md:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 py-3 md:py-0 md:flex-row justify-between items-center h-16">
            <div className="flex items-center">
              <a
                href="/catalog"
                data-readdy="true"
                className="flex items-center text-yellow-400 hover:text-yellow-300 transition-colors cursor-pointer"
              >
                {"<  "}
                <span className="ml-3">Back</span>
              </a>
              <nav className="ml-6">
                <ol className="flex items-center space-x-2 text-sm">
                  <li>
                    <a
                      href="/"
                      data-readdy="true"
                      className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer"
                    >
                      Home
                    </a>
                  </li>
                  <li className="text-gray-600">{">"}</li>
                  <li>
                    <a
                      href={"/catalog"}
                      data-readdy="true"
                      className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer"
                    >
                      Categories
                    </a>
                  </li>
                  <li className="text-gray-600">{">"}</li>
                  <li className="text-yellow-400">Engine Parts</li>
                </ol>
              </nav>
            </div>
            <div className="flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search engine parts..."
                  className="bg-gray-900 border border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 md:w-64 w-[95vw]"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <img src="/search.png" rel="search" className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Product Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Product Images */}
          <div>
            <div className="bg-gray-800 rounded-lg overflow-hidden mb-4">
              <img
                src={mainImage}
                alt="High-Performance Camshaft"
                className="w-full h-auto object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {thumbnails.map((thumb) => (
                <div
                  key={thumb.id}
                  className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                  onClick={() => setMainImage(thumb.src)}
                >
                  <img
                    src={thumb.src}
                    alt={`Thumbnail ${thumb.id}`}
                    className="w-full h-auto object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
          {/* Product Info */}
          <div>
            <h1 className="text-3xl font-bold mb-2">
              High-Performance Camshaft
            </h1>
            <div className="flex items-center mb-4">
              <span className="text-gray-400 mr-4">PowerTech</span>
              <div className="flex items-center">
                <div className="flex text-yellow-500">
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star"></i>
                  <i className="fas fa-star-half-alt"></i>
                </div>
                <span className="ml-2 text-gray-400">(4.8) 32 reviews</span>
              </div>
            </div>
            <div className="mb-6">
              <div className="text-3xl font-bold text-yellow-500 mb-2">
                $249.99
              </div>
              <div className="flex items-center text-green-500">
                <i className="fas fa-check-circle mr-2"></i>
                <span>In Stock - Ships within 24 hours</span>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Upgrade your engine's performance with our High-Performance
                Camshaft. Designed for serious enthusiasts looking for
                significant power gains throughout the RPM range. Precision
                machined from billet steel with optimized lobe profiles for
                improved throttle response and top-end power.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-gray-700 text-sm px-3 py-1 rounded-full">
                  Performance
                </span>
                <span className="bg-gray-700 text-sm px-3 py-1 rounded-full">
                  Engine
                </span>
                <span className="bg-gray-700 text-sm px-3 py-1 rounded-full">
                  Upgrade
                </span>
                <span className="bg-gray-700 text-sm px-3 py-1 rounded-full">
                  PowerTech
                </span>
              </div>
            </div>
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="mr-4">
                  <label
                    htmlFor="quantity"
                    className="block text-sm text-gray-400 mb-1"
                  >
                    Quantity
                  </label>
                  <div className="flex">
                    <button
                      onClick={decrementQuantity}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-l-md cursor-pointer !rounded-button whitespace-nowrap"
                    >
                      {"-"}
                    </button>
                    <input
                      type="text"
                      id="quantity"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="bg-gray-800 border-none w-16 text-center py-2 text-white"
                    />
                    <button
                      onClick={incrementQuantity}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-r-md cursor-pointer !rounded-button whitespace-nowrap"
                    >
                      {"+"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-3 px-8 rounded-md flex flex-row gap-3 items-center cursor-pointer !rounded-button whitespace-nowrap">
                  <img src="/cart.png" rel="cart" className="w-7 h-7" />
                  Add to Cart
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-8 rounded-md flex flex-row gap-3 items-center cursor-pointer !rounded-button whitespace-nowrap">
                  <img src="/like.png" rel="cart" className="w-7 h-7" />
                  Add to Wishlist
                </button>
              </div>
            </div>
            <div className="border-t border-gray-700 pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center">
                  <i className="fas fa-truck text-gray-400 mr-3 text-xl"></i>
                  <div>
                    <div className="text-sm text-gray-400">Shipping</div>
                    <div className="font-medium">Free shipping (2-3 days)</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-shield-alt text-gray-400 mr-3 text-xl"></i>
                  <div>
                    <div className="text-sm text-gray-400">Warranty</div>
                    <div className="font-medium">2 Year Limited Warranty</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-exchange-alt text-gray-400 mr-3 text-xl"></i>
                  <div>
                    <div className="text-sm text-gray-400">Returns</div>
                    <div className="font-medium">30 Day Return Policy</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <i className="fas fa-credit-card text-gray-400 mr-3 text-xl"></i>
                  <div>
                    <div className="text-sm text-gray-400">Payment</div>
                    <div className="font-medium">Secure Payment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-12 mb-12">
          <h2 className="text-2xl font-bold mb-6">Analog Spare Parts</h2>
          <div className="flex flex-col gap-4">
            {analogs.map((part) => (
              <div
                key={part.name}
                className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex-1">
                  <h3 className="text-lg font-bold">{part.description}</h3>
                  <div className="text-gray-400 text-sm">
                    {part.group + "( " + part.name.split(" • ")[0] + " )"}
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-yellow-500 font-bold text-lg">
                    {part.price}
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="bg-yellow-500 hover:bg-yellow-600 text-black py-2 px-3 rounded-md flex items-center text-sm font-medium cursor-pointer !rounded-button whitespace-nowrap">
                      <i className="fas fa-shopping-cart mr-1"></i>
                      Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Product Details Tabs */}
        <div className="mt-12">
          <div className="border-b border-gray-700 mb-6">
            <div className="flex flex-wrap -mb-px">
              <button
                onClick={() => setSelectedTab("specifications")}
                className={`mr-8 py-4 font-medium text-sm border-b-2 ${
                  selectedTab === "specifications"
                    ? "border-yellow-500 text-yellow-500"
                    : "border-transparent text-gray-400 hover:text-white"
                } cursor-pointer !rounded-button whitespace-nowrap`}
              >
                Specifications
              </button>
              <button
                onClick={() => setSelectedTab("features")}
                className={`mr-8 py-4 font-medium text-sm border-b-2 ${
                  selectedTab === "features"
                    ? "border-yellow-500 text-yellow-500"
                    : "border-transparent text-gray-400 hover:text-white"
                } cursor-pointer !rounded-button whitespace-nowrap`}
              >
                Features & Benefits
              </button>
              <button
                onClick={() => setSelectedTab("compatibility")}
                className={`mr-8 py-4 font-medium text-sm border-b-2 ${
                  selectedTab === "compatibility"
                    ? "border-yellow-500 text-yellow-500"
                    : "border-transparent text-gray-400 hover:text-white"
                } cursor-pointer !rounded-button whitespace-nowrap`}
              >
                Compatibility
              </button>
              <button
                onClick={() => setSelectedTab("reviews")}
                className={`mr-8 py-4 font-medium text-sm border-b-2 ${
                  selectedTab === "reviews"
                    ? "border-yellow-500 text-yellow-500"
                    : "border-transparent text-gray-400 hover:text-white"
                } cursor-pointer !rounded-button whitespace-nowrap`}
              >
                Reviews (32)
              </button>
            </div>
          </div>
          {/* Tab Content */}
          <div className="bg-gray-800 rounded-lg p-6 mb-12">
            {selectedTab === "specifications" && (
              <div>
                <h2 className="text-xl font-bold mb-6">
                  Technical Specifications
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                  {specifications.map((spec, index) => (
                    <div key={index} className="border-b border-gray-700 pb-3">
                      <div className="text-gray-400 text-sm mb-1">
                        {spec.name}
                      </div>
                      <div className="font-medium">{spec.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedTab === "features" && (
              <div>
                <h2 className="text-xl font-bold mb-6">Features & Benefits</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <i className="fas fa-check text-green-500 mt-1 mr-3"></i>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedTab === "compatibility" && (
              <div>
                <h2 className="text-xl font-bold mb-6">Compatible Vehicles</h2>
                <div className="bg-gray-900 rounded-lg p-4 mb-6">
                  <div className="text-yellow-500 mb-2">
                    <i className="fas fa-info-circle mr-2"></i>
                    <span className="font-medium">Important Note</span>
                  </div>
                  <p className="text-gray-300">
                    While this camshaft is designed to work with the vehicles
                    listed below, we recommend consulting with a professional
                    mechanic before installation. Some applications may require
                    additional components such as valve springs, pushrods, or
                    timing chain upgrades.
                  </p>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {compatibleVehicles.map((vehicle, index) => (
                    <li key={index} className="flex items-center">
                      <i className="fas fa-car text-gray-500 mr-3"></i>
                      <span>{vehicle}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedTab === "reviews" && (
              <div>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Customer Reviews</h2>
                    <div className="flex items-center">
                      <div className="flex text-yellow-500 mr-2">
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star"></i>
                        <i className="fas fa-star-half-alt"></i>
                      </div>
                      <span className="text-lg font-medium">4.8 out of 5</span>
                      <span className="text-gray-400 ml-2">(32 reviews)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsReviewModalOpen(true)}
                    className="mt-4 md:mt-0 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center cursor-pointer !rounded-button whitespace-nowrap"
                  >
                    <i className="fas fa-pen mr-2"></i>
                    Write a Review
                  </button>

                  {isReviewModalOpen && (
                    <div className="fixed inset-0 backdrop-blur-xl bg-opacity-50 bg-blur-50 flex items-center justify-center z-50">
                      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg border-2 border-gray-400">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold">Write a Review</h3>
                          <button
                            onClick={() => setIsReviewModalOpen(false)}
                            className="text-gray-400 hover:text-white !rounded-button whitespace-nowrap"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>

                        <div className="mb-6">
                          <label className="block text-sm text-gray-400 mb-2">
                            Rating
                          </label>
                          <div className="flex text-2xl">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() =>
                                  setReviewForm({ ...reviewForm, rating: star })
                                }
                                className="text-yellow-500 mr-1 !rounded-button whitespace-nowrap"
                              >
                                <i
                                  className={`fas ${
                                    star <= reviewForm.rating
                                      ? "fa-star"
                                      : "fa-star text-gray-600"
                                  }`}
                                ></i>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mb-6">
                          <label
                            htmlFor="reviewTitle"
                            className="block text-sm text-gray-400 mb-2"
                          >
                            Title
                          </label>
                          <input
                            id="reviewTitle"
                            type="text"
                            value={reviewForm.title}
                            onChange={(e) =>
                              setReviewForm({
                                ...reviewForm,
                                title: e.target.value,
                              })
                            }
                            className="w-full bg-gray-700 border-none rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-yellow-500"
                            placeholder="Give your review a title"
                          />
                        </div>

                        <div className="mb-6">
                          <label
                            htmlFor="reviewComment"
                            className="block text-sm text-gray-400 mb-2"
                          >
                            Review
                          </label>
                          <textarea
                            id="reviewComment"
                            value={reviewForm.comment}
                            onChange={(e) =>
                              setReviewForm({
                                ...reviewForm,
                                comment: e.target.value,
                              })
                            }
                            className="w-full bg-gray-700 border-none rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-yellow-500 h-32"
                            placeholder="Share your experience with this product"
                          ></textarea>
                        </div>

                        <div className="mb-6">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={reviewForm.verifiedPurchase}
                              onChange={(e) =>
                                setReviewForm({
                                  ...reviewForm,
                                  verifiedPurchase: e.target.checked,
                                })
                              }
                              className="bg-gray-700 border-none rounded mr-2"
                            />
                            <span className="text-sm text-gray-400">
                              I verify that I purchased this product
                            </span>
                          </label>
                        </div>

                        <div className="flex justify-end gap-4">
                          <button
                            onClick={() => setIsReviewModalOpen(false)}
                            className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-2 rounded-md !rounded-button whitespace-nowrap"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              // Handle review submission here
                              setIsReviewModalOpen(false);
                              // Reset form
                              setReviewForm({
                                rating: 5,
                                title: "",
                                comment: "",
                                verifiedPurchase: false,
                              });
                            }}
                            className="bg-yellow-500 hover:bg-yellow-600 text-black px-6 py-2 rounded-md font-medium !rounded-button whitespace-nowrap"
                          >
                            Submit Review
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="border-b border-gray-700 pb-6"
                    >
                      <div className="flex justify-between mb-2">
                        <div>
                          <div className="font-medium">{review.title}</div>
                          <div className="flex items-center">
                            <div className="flex text-yellow-500 mr-2">
                              {[...Array(5)].map((_, i) => (
                                <i
                                  key={i}
                                  className={`fas ${
                                    i < review.rating
                                      ? "fa-star"
                                      : "fa-star text-gray-600"
                                  }`}
                                ></i>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {review.date}
                        </div>
                      </div>
                      <div className="flex items-center mb-3">
                        <span className="text-gray-400 text-sm mr-3">
                          by {review.author}
                        </span>
                        {review.verified && (
                          <span className="bg-green-900 text-green-400 text-xs px-2 py-1 rounded">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <p className="text-gray-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <button className="text-yellow-500 hover:text-yellow-400 font-medium cursor-pointer !rounded-button whitespace-nowrap">
                    Load More Reviews
                    <i className="fas fa-chevron-down ml-2"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Related Products */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Related Products</h2>
            <div className="flex space-x-2">
              <button className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full cursor-pointer !rounded-button whitespace-nowrap">
                {"<"}
              </button>
              <button className="bg-gray-800 hover:bg-gray-700 text-white p-2 rounded-full cursor-pointer !rounded-button whitespace-nowrap">
                {">"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                <div className="h-48 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold mb-1">{product.name}</h3>
                  <div className="text-sm text-gray-400 mb-2">
                    {product.brand}
                  </div>
                  <div className="flex items-center mb-3">
                    <div className="flex text-yellow-500 text-sm mr-1">
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star"></i>
                      <i className="fas fa-star-half-alt"></i>
                    </div>
                    <span className="text-xs text-gray-400">
                      ({product.rating})
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-yellow-500 font-bold">
                      ${product.price}
                    </div>
                    <button className="bg-gray-700 hover:bg-gray-600 text-white text-sm py-1 px-3 rounded cursor-pointer !rounded-button whitespace-nowrap">
                      {"+ Add"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;
