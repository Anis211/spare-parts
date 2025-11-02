import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

const App = () => {
  const router = useRouter();
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [compatibility, setCompatibility] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(24);
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Engine parts data
  const engineParts = [
    {
      id: 1,
      name: "High-Performance Camshaft",
      price: 249.99,
      rating: 4.8,
      brand: "PowerTech",
      compatibility: ["Ford", "Toyota", "Honda"],
      image:
        "https://readdy.ai/api/search-image?query=High%20performance%20automotive%20camshaft%20on%20a%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20metal%20surface%20with%20precision%20engineering%2C%20automotive%20part%20with%20industrial%20aesthetic&width=300&height=300&seq=1&orientation=squarish",
    },
    {
      id: 2,
      name: "Forged Pistons Set (4)",
      price: 399.99,
      rating: 4.9,
      brand: "RaceTech",
      compatibility: ["BMW", "Audi", "Mercedes"],
      image:
        "https://readdy.ai/api/search-image?query=Set%20of%20four%20forged%20automotive%20pistons%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20metal%20surface%20with%20precision%20engineering%2C%20automotive%20engine%20parts%20with%20industrial%20aesthetic&width=300&height=300&seq=2&orientation=squarish",
    },
    {
      id: 3,
      name: "Complete Cylinder Head Assembly",
      price: 599.99,
      rating: 4.7,
      brand: "OEMPlus",
      compatibility: ["Honda", "Toyota", "Nissan"],
      image:
        "https://readdy.ai/api/search-image?query=Complete%20automotive%20cylinder%20head%20assembly%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20metal%20surface%20with%20precision%20engineering%2C%20complex%20automotive%20engine%20part%20with%20industrial%20aesthetic&width=300&height=300&seq=3&orientation=squarish",
    },
    {
      id: 4,
      name: "Performance Intake Manifold",
      price: 349.99,
      rating: 4.6,
      brand: "TurboForce",
      compatibility: ["Volkswagen", "Audi", "Skoda"],
      image:
        "https://readdy.ai/api/search-image?query=Performance%20automotive%20intake%20manifold%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20metal%20surface%20with%20precision%20engineering%2C%20automotive%20engine%20part%20with%20industrial%20aesthetic%20and%20flow%20design&width=300&height=300&seq=4&orientation=squarish",
    },
    {
      id: 5,
      name: "Engine Timing Chain Kit",
      price: 189.99,
      rating: 4.5,
      brand: "TimeMaster",
      compatibility: ["Ford", "Chevrolet", "Dodge"],
      image:
        "https://readdy.ai/api/search-image?query=Complete%20automotive%20engine%20timing%20chain%20kit%20with%20gears%20and%20chain%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20metal%20parts%20with%20precision%20engineering%2C%20automotive%20engine%20components%20with%20industrial%20aesthetic&width=300&height=300&seq=5&orientation=squarish",
    },
    {
      id: 6,
      name: "Oil Pump Assembly",
      price: 129.99,
      rating: 4.7,
      brand: "FlowPro",
      compatibility: ["Toyota", "Lexus", "Honda"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20oil%20pump%20assembly%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20metal%20surface%20with%20precision%20engineering%2C%20automotive%20engine%20lubrication%20component%20with%20industrial%20aesthetic&width=300&height=300&seq=6&orientation=squarish",
    },
    {
      id: 7,
      name: "Turbocharger Kit",
      price: 899.99,
      rating: 4.8,
      brand: "TurboForce",
      compatibility: ["Subaru", "Mitsubishi", "Nissan"],
      image:
        "https://readdy.ai/api/search-image?query=Complete%20automotive%20turbocharger%20kit%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20metal%20turbo%20with%20precision%20engineering%2C%20automotive%20forced%20induction%20system%20with%20industrial%20aesthetic%20and%20compressor%20wheel%20visible&width=300&height=300&seq=7&orientation=squarish",
    },
    {
      id: 8,
      name: "Connecting Rods Set (4)",
      price: 299.99,
      rating: 4.6,
      brand: "RaceTech",
      compatibility: ["Honda", "Toyota", "Mazda"],
      image:
        "https://readdy.ai/api/search-image?query=Set%20of%20four%20automotive%20connecting%20rods%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20metal%20surface%20with%20precision%20engineering%2C%20automotive%20engine%20components%20with%20industrial%20aesthetic%20and%20forged%20construction&width=300&height=300&seq=8&orientation=squarish",
    },
    {
      id: 9,
      name: "Crankshaft Pulley",
      price: 89.99,
      rating: 4.4,
      brand: "PowerDrive",
      compatibility: ["Ford", "Chevrolet", "Dodge"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20crankshaft%20pulley%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20metal%20surface%20with%20precision%20engineering%2C%20automotive%20engine%20component%20with%20industrial%20aesthetic%20and%20belt%20grooves&width=300&height=300&seq=9&orientation=squarish",
    },
    {
      id: 10,
      name: "Valve Cover Gasket Set",
      price: 39.99,
      rating: 4.5,
      brand: "SealPro",
      compatibility: ["BMW", "Mercedes", "Audi"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20valve%20cover%20gasket%20set%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20rubber%20gasket%20material%20with%20precision%20engineering%2C%20automotive%20engine%20sealing%20components%20with%20industrial%20aesthetic&width=300&height=300&seq=10&orientation=squarish",
    },
    {
      id: 11,
      name: "Engine Mount Kit",
      price: 149.99,
      rating: 4.6,
      brand: "VibeTech",
      compatibility: ["Honda", "Acura", "Toyota"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20engine%20mount%20kit%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20rubber%20and%20metal%20construction%20with%20precision%20engineering%2C%20automotive%20engine%20support%20components%20with%20industrial%20aesthetic&width=300&height=300&seq=11&orientation=squarish",
    },
    {
      id: 12,
      name: "Fuel Injector Set (6)",
      price: 279.99,
      rating: 4.7,
      brand: "FuelTech",
      compatibility: ["BMW", "Mercedes", "Audi"],
      image:
        "https://readdy.ai/api/search-image?query=Set%20of%20six%20automotive%20fuel%20injectors%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20precision%20components%20with%20engineering%20quality%2C%20automotive%20fuel%20delivery%20system%20parts%20with%20industrial%20aesthetic&width=300&height=300&seq=12&orientation=squarish",
    },
    {
      id: 13,
      name: "Timing Belt Kit",
      price: 159.99,
      rating: 4.8,
      brand: "TimeMaster",
      compatibility: ["Honda", "Toyota", "Subaru"],
      image:
        "https://readdy.ai/api/search-image?query=Complete%20automotive%20timing%20belt%20kit%20with%20tensioners%20and%20pulleys%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20components%20with%20precision%20engineering%2C%20automotive%20engine%20maintenance%20parts%20with%20industrial%20aesthetic&width=300&height=300&seq=13&orientation=squarish",
    },
    {
      id: 14,
      name: "Throttle Body Assembly",
      price: 199.99,
      rating: 4.5,
      brand: "FlowPro",
      compatibility: ["Ford", "Chevrolet", "Dodge"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20throttle%20body%20assembly%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20electronic%20and%20mechanical%20components%20with%20precision%20engineering%2C%20automotive%20air%20intake%20control%20system%20with%20industrial%20aesthetic&width=300&height=300&seq=14&orientation=squarish",
    },
    {
      id: 15,
      name: "Oil Filter Housing",
      price: 79.99,
      rating: 4.4,
      brand: "OEMPlus",
      compatibility: ["BMW", "Mercedes", "Volkswagen"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20oil%20filter%20housing%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20aluminum%20with%20precision%20engineering%2C%20automotive%20engine%20filtration%20component%20with%20industrial%20aesthetic&width=300&height=300&seq=15&orientation=squarish",
    },
    {
      id: 16,
      name: "Harmonic Balancer",
      price: 119.99,
      rating: 4.6,
      brand: "VibeTech",
      compatibility: ["Chevrolet", "Ford", "Dodge"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20harmonic%20balancer%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20metal%20with%20rubber%20damping%20section%20and%20precision%20engineering%2C%20automotive%20engine%20vibration%20control%20component%20with%20industrial%20aesthetic&width=300&height=300&seq=16&orientation=squarish",
    },
    {
      id: 17,
      name: "Water Pump Assembly",
      price: 89.99,
      rating: 4.7,
      brand: "FlowPro",
      compatibility: ["Toyota", "Honda", "Nissan"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20water%20pump%20assembly%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20metal%20with%20impeller%20and%20precision%20engineering%2C%20automotive%20engine%20cooling%20component%20with%20industrial%20aesthetic&width=300&height=300&seq=17&orientation=squarish",
    },
    {
      id: 18,
      name: "Exhaust Manifold",
      price: 249.99,
      rating: 4.5,
      brand: "FlowMaster",
      compatibility: ["Subaru", "Mitsubishi", "Mazda"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20exhaust%20manifold%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20cast%20iron%20or%20stainless%20steel%20with%20precision%20engineering%2C%20automotive%20exhaust%20component%20with%20industrial%20aesthetic%20and%20flow-optimized%20design&width=300&height=300&seq=18&orientation=squarish",
    },
    {
      id: 19,
      name: "Variable Valve Timing Solenoid",
      price: 129.99,
      rating: 4.4,
      brand: "TimeMaster",
      compatibility: ["Toyota", "Lexus", "Honda"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20variable%20valve%20timing%20solenoid%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20electronic%20component%20with%20precision%20engineering%2C%20automotive%20engine%20control%20part%20with%20industrial%20aesthetic&width=300&height=300&seq=19&orientation=squarish",
    },
    {
      id: 20,
      name: "Engine Gasket Set (Complete)",
      price: 199.99,
      rating: 4.8,
      brand: "SealPro",
      compatibility: ["Honda", "Toyota", "Nissan"],
      image:
        "https://readdy.ai/api/search-image?query=Complete%20automotive%20engine%20gasket%20set%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20various%20gasket%20shapes%20and%20materials%20with%20precision%20engineering%2C%20automotive%20engine%20sealing%20components%20with%20industrial%20aesthetic&width=300&height=300&seq=20&orientation=squarish",
    },
    {
      id: 21,
      name: "Crankshaft Position Sensor",
      price: 49.99,
      rating: 4.5,
      brand: "SensorTech",
      compatibility: ["Ford", "Chevrolet", "Dodge"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20crankshaft%20position%20sensor%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20electronic%20component%20with%20precision%20engineering%2C%20automotive%20engine%20management%20part%20with%20industrial%20aesthetic%20and%20connector&width=300&height=300&seq=21&orientation=squarish",
    },
    {
      id: 22,
      name: "Performance Camshaft Gears",
      price: 169.99,
      rating: 4.7,
      brand: "PowerTech",
      compatibility: ["Honda", "Toyota", "Mazda"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20performance%20camshaft%20gears%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20machined%20metal%20with%20precision%20teeth%20and%20adjustability%20features%2C%20automotive%20engine%20timing%20components%20with%20industrial%20aesthetic&width=300&height=300&seq=22&orientation=squarish",
    },
    {
      id: 23,
      name: "Engine Oil Pan",
      price: 109.99,
      rating: 4.4,
      brand: "OEMPlus",
      compatibility: ["BMW", "Mercedes", "Audi"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20engine%20oil%20pan%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20stamped%20or%20cast%20metal%20with%20precision%20engineering%2C%20automotive%20engine%20oil%20reservoir%20with%20industrial%20aesthetic&width=300&height=300&seq=23&orientation=squarish",
    },
    {
      id: 24,
      name: "Valve Spring Set",
      price: 89.99,
      rating: 4.6,
      brand: "PowerTech",
      compatibility: ["Ford", "Chevrolet", "Dodge"],
      image:
        "https://readdy.ai/api/search-image?query=Automotive%20valve%20spring%20set%20on%20clean%20white%20background%2C%20professional%20product%20photography%20with%20soft%20lighting%2C%20detailed%20precision%20springs%20with%20consistent%20coil%20spacing%20and%20engineering%20quality%2C%20automotive%20engine%20valve%20components%20with%20industrial%20aesthetic&width=300&height=300&seq=24&orientation=squarish",
    },
  ];

  // Brands list
  const brands = [
    "PowerTech",
    "RaceTech",
    "OEMPlus",
    "TurboForce",
    "TimeMaster",
    "FlowPro",
    "PowerDrive",
    "SealPro",
    "VibeTech",
    "FuelTech",
    "FlowMaster",
    "SensorTech",
  ];

  // Vehicle makes for compatibility filter
  const vehicleMakes = [
    "Ford",
    "Toyota",
    "Honda",
    "BMW",
    "Audi",
    "Mercedes",
    "Volkswagen",
    "Chevrolet",
    "Dodge",
    "Nissan",
    "Subaru",
    "Mitsubishi",
    "Mazda",
    "Lexus",
    "Acura",
    "Skoda",
  ];

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Filter and sort engine parts
  const filteredParts = engineParts.filter((part) => {
    const matchesPrice =
      part.price >= priceRange[0] && part.price <= priceRange[1];
    const matchesBrand =
      selectedBrands.length === 0 || selectedBrands.includes(part.brand);
    const matchesCompatibility =
      !compatibility || part.compatibility.includes(compatibility);
    return matchesPrice && matchesBrand && matchesCompatibility;
  });

  const sortedParts = [...filteredParts].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return b.rating - a.rating;
      case "newest":
        return b.id - a.id;
      default:
        return 0;
    }
  });

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedParts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedParts.length / itemsPerPage);

  // Handle brand selection
  const handleBrandChange = (brand) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  // Handle price range change
  const handlePriceChange = (type, value) => {
    const numValue = value === "" ? (type === "min" ? 0 : 1000) : Number(value);
    if (type === "min") {
      setPriceRange([numValue, priceRange[1]]);
    } else {
      setPriceRange([priceRange[0], numValue]);
    }
  };

  // Render star rating
  const renderRating = (rating) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <div className="flex">
        {[...Array(fullStars)].map((_, i) => (
          <img
            key={i}
            src="/star-full.png"
            rel="full-star"
            className="w-4 h-4"
          />
        ))}
        {halfStar && <i className="fas fa-star-half-alt text-yellow-400"></i>}
        {[...Array(emptyStars)].map((_, i) => (
          <img
            key={i}
            src="/star-empty.png"
            rel="empty-star"
            className="w-4 h-4"
          />
        ))}
        <span className="ml-1 text-sm text-gray-400">({rating})</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 py-4 justify-between items-center">
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
                  className="bg-gray-900 border border-gray-700 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 w-[85vw] md:w-64"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <img src="/search.png" rel="search" className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">Engine Parts</h1>
          <p className="text-gray-400 mt-2">
            Browse our selection of high-quality engine components
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-gray-800 py-4 sticky top-16 z-40 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-300 !rounded-button whitespace-nowrap cursor-pointer"
              >
                <i className="fas fa-filter mr-2"></i>
                Filters
              </button>

              <div className="hidden md:flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Price:</span>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={priceRange[0] || ""}
                      onChange={(e) => handlePriceChange("min", e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded-lg py-1 px-2 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={priceRange[1] || ""}
                      onChange={(e) => handlePriceChange("max", e.target.value)}
                      className="bg-gray-700 border border-gray-600 rounded-lg py-1 px-2 w-20 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                </div>

                <div className="relative">
                  <select
                    value={compatibility}
                    onChange={(e) => setCompatibility(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg py-2 pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="">All Makes</option>
                    {vehicleMakes.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                    <i className="fas fa-chevron-down text-xs"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-400">
                <span>{sortedParts.length} products</span>
              </div>

              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-700 border border-gray-600 rounded-lg py-2 pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                >
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                  <option value="newest">Newest</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                  <i className="fas fa-chevron-down text-xs"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel (Mobile/Expanded) */}
      {showFilters && (
        <div className="bg-gray-900 border-b border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Price Range */}
              <div>
                <h3 className="text-lg font-medium mb-3">Price Range</h3>
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceRange[0] || ""}
                    onChange={(e) => handlePriceChange("min", e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceRange[1] || ""}
                    onChange={(e) => handlePriceChange("max", e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 w-full text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Brands */}
              <div>
                <h3 className="text-lg font-medium mb-3">Brands</h3>
                <div className="grid grid-cols-2 gap-2">
                  {brands.slice(0, 8).map((brand) => (
                    <div key={brand} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`brand-${brand}`}
                        checked={selectedBrands.includes(brand)}
                        onChange={() => handleBrandChange(brand)}
                        className="h-4 w-4 text-yellow-400 focus:ring-yellow-400 border-gray-700 rounded"
                      />
                      <label
                        htmlFor={`brand-${brand}`}
                        className="ml-2 text-sm text-gray-300"
                      >
                        {brand}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Compatibility */}
              <div>
                <h3 className="text-lg font-medium mb-3">Compatibility</h3>
                <div className="relative">
                  <select
                    value={compatibility}
                    onChange={(e) => setCompatibility(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 w-full text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  >
                    <option value="">All Makes</option>
                    {vehicleMakes.map((make) => (
                      <option key={make} value={make}>
                        {make}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                    <i className="fas fa-chevron-down"></i>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6 space-x-4">
              <button
                onClick={() => {
                  setPriceRange([0, 1000]);
                  setSelectedBrands([]);
                  setCompatibility("");
                }}
                className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 !rounded-button whitespace-nowrap cursor-pointer"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium transition-colors duration-300 !rounded-button whitespace-nowrap cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="py-8">
        <div className="md:max-w-7xl max-w-[75vw] mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            // Loading state
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="bg-gray-800 rounded-lg overflow-hidden animate-pulse"
                >
                  <div className="h-64 bg-gray-700"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="h-10 bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : sortedParts.length === 0 ? (
            // Empty state
            <div className="text-center py-16">
              <div className="text-yellow-400 text-6xl mb-4">
                <i className="fas fa-search"></i>
              </div>
              <h2 className="text-2xl font-bold mb-2">No products found</h2>
              <p className="text-gray-400 mb-6">
                Try adjusting your filters to find what you're looking for.
              </p>
              <button
                onClick={() => {
                  setPriceRange([0, 1000]);
                  setSelectedBrands([]);
                  setCompatibility("");
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-2 rounded-lg font-medium transition-colors duration-300 !rounded-button whitespace-nowrap cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            // Product grid
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {currentItems.map((part) => (
                  <div
                    onClick={() => router.push("/part/1")}
                    key={part.id}
                    className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-900/10 group"
                  >
                    <div className="relative h-64 overflow-hidden bg-gray-800">
                      {isLoading ? (
                        <div className="absolute inset-0 bg-gray-700 animate-pulse"></div>
                      ) : (
                        <img
                          src={part.image}
                          alt={part.name}
                          className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium mb-1 group-hover:text-yellow-400 transition-colors">
                        {part.name}
                      </h3>
                      <p className="text-sm text-gray-400 mb-2">{part.brand}</p>
                      <div className="mb-3">{renderRating(part.rating)}</div>
                      <div className="flex items-center justify-between">
                        <span className="text-xl font-bold text-yellow-400">
                          ${part.price.toFixed(2)}
                        </span>
                        <button className="bg-yellow-400 hover:bg-yellow-500 text-black px-3 py-2 rounded-lg font-medium text-sm transition-colors duration-300 !rounded-button whitespace-nowrap cursor-pointer">
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              <div className="mt-12 flex flex-col sm:flex-row items-center justify-between">
                <div className="mb-4 sm:mb-0 text-sm text-gray-400">
                  Showing {indexOfFirstItem + 1}-
                  {Math.min(indexOfLastItem, sortedParts.length)} of{" "}
                  {sortedParts.length} products
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === 1
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "bg-gray-800 hover:bg-gray-700 text-white cursor-pointer"
                    } !rounded-button whitespace-nowrap`}
                  >
                    {"<"}
                  </button>

                  {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                    let pageNum = index + 1;
                    if (totalPages > 5 && currentPage > 3) {
                      pageNum = currentPage - 3 + index;
                      if (pageNum > totalPages)
                        pageNum = totalPages - (4 - index);
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg text-sm ${
                          currentPage === pageNum
                            ? "bg-yellow-400 text-black"
                            : "bg-gray-800 hover:bg-gray-700 text-white"
                        } !rounded-button whitespace-nowrap cursor-pointer`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      currentPage === totalPages
                        ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                        : "bg-gray-800 hover:bg-gray-700 text-white cursor-pointer"
                    } !rounded-button whitespace-nowrap`}
                  >
                    {">"}
                  </button>
                </div>

                <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                  <span className="text-sm text-gray-400">Show:</span>
                  <div className="relative">
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-gray-800 border border-gray-700 rounded-lg py-2 pl-3 pr-8 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    >
                      <option value={24}>24</option>
                      <option value={48}>48</option>
                      <option value={96}>96</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                      <i className="fas fa-chevron-down text-xs"></i>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
