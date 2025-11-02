import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import vinDecoder from "vin-decode";

const App = () => {
  const router = useRouter();
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [carMakes, setCarMakes] = useState([]);
  const [carModels, setCarModels] = useState([]);
  const [years, setYears] = useState([]);
  const [capacities, setCapacities] = useState([]);
  const [selectedCapacities, setSelectedCapacities] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(
          "https://api.partsapi.ru/?method=getMakes&key=308bd5cc6d03f9d33de161f943050b75&carType=PC"
        );
        const data = await res.json();

        setCarMakes(data);
        console.log(data);
      } catch (e) {
        console.error(e.message);
      }
    };

    carMakes.length == 0 && run();
  }, [carMakes]);

  const categories = [
    { name: "Engine Parts", icon: "fa-engine", count: 1245 },
    { name: "Brakes & Suspension", icon: "fa-brake-pad", count: 876 },
    { name: "Electrical Components", icon: "fa-bolt", count: 1032 },
    { name: "Body Parts", icon: "fa-car-side", count: 943 },
    { name: "Interior Accessories", icon: "fa-chair", count: 765 },
    { name: "Filters", icon: "fa-filter", count: 432 },
    { name: "Lighting", icon: "fa-lightbulb", count: 654 },
    { name: "Wheels & Tires", icon: "fa-tire", count: 321 },
  ];

  const handleSendMessage = async () => {
    try {
      const result = vinDecoder(message).decode();

      console.log("Success:", result);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleMakeChange = async (make) => {
    setSelectedMake(make.makeName);
    try {
      const res = await fetch(
        "https://api.partsapi.ru/?method=getModels&key=d74b4f69cc26eccd6e4447aa1f4ea5db&carType=PC&makeId=5&lang=16"
      );
      const data = await res.json();

      setCarModels(data);
      console.log(data);
    } catch (e) {
      console.error(e.message);
    }
  };

  const handleModelChange = async (model) => {
    setSelectedModel(model.modelName);
    try {
      const res = await fetch(
        "https://api.partsapi.ru/?method=getCars&key=7155c2e603d7fb82eb14c85ac2eb028e&makeId=5&carType=PC&modelId=40155"
      );
      const data = await res.json();

      let onlyYears = [];
      let onlyCapacities = [];

      data.map((item, index) => {
        let num = parseFloat(item.CAPACITY / 1000) * 10;
        num = Math.round(num) / 10;

        onlyCapacities.push({
          id: item.carId,
          year: item.yearStart.split("-")[0],
          capacity: num,
          name: item.carName,
        });
        onlyYears.push(item.yearStart.split("-")[0]);
      });
      onlyYears = [...new Set(onlyYears)].sort((a, b) => a - b);

      setYears(onlyYears);
      setCapacities(onlyCapacities);
      console.log(onlyCapacities);
      console.log(data);
    } catch (e) {
      console.error(e.message);
    }
  };

  const handleYearChange = (year) => {
    let caps = [];

    capacities.map((cap) => (cap.year === year ? caps.push(cap) : ""));

    setSelectedYear(year);
    setSelectedCapacities(caps);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section className="relative py-16 px-8 bg-gradient-to-r from-black to-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              AUTO PARTS CATALOG
            </h1>
            <p className="text-xl text-gray-300">
              Find the perfect parts for your vehicle from our extensive
              collection
            </p>
          </div>
          {/* Search Tree */}
          <div className="bg-gray-900 rounded-lg p-8 shadow-lg max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">
              FIND AUTO PARTS FOR ANY MODEL
            </h2>
            <p className="text-gray-400 text-center mb-8">
              Browse our catalog for hundreds of different automotive parts
            </p>
            {/* VIN Search Bar */}
            <div className="mb-8">
              <div className="flex flex-col items-center">
                <div className="relative w-full max-w-2xl">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Enter your VIN number (17 characters)"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 pl-4 pr-32 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-full transition-colors duration-300 !rounded-button whitespace-nowrap"
                  >
                    Search by VIN
                  </button>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Or search by selecting vehicle details below
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Vehicle Make
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white"
                    value={selectedMake}
                    onChange={(e) => handleMakeChange(e.target.value)}
                  >
                    <option value="">Select Make</option>
                    {carMakes.map((make) => (
                      <option key={make.makeId} value={make.makeId}>
                        {make.makeName}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                    <i className="fas fa-chevron-down"></i>
                  </div>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Vehicle Model
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white"
                    value={selectedModel}
                    onChange={(e) => handleModelChange(e.target.value)}
                  >
                    <option value="">Select Model</option>
                    {selectedMake != "" &&
                      carModels.map((model) => (
                        <option key={model.modelId} value={model.modelId}>
                          {model.modelName}
                        </option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                    <i className="fas fa-chevron-down"></i>
                  </div>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Year
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white"
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                  >
                    <option value="">Select Year</option>
                    {years.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                    <i className="fas fa-chevron-down"></i>
                  </div>
                </div>
              </div>
              <div className="relative">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Part Category
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg py-3 px-4 appearance-none focus:outline-none focus:ring-2 focus:ring-yellow-400 text-white"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <option value="">Select Car</option>
                    {selectedCapacities.map((item, index) => (
                      <option key={index} value={index}>
                        {item.name + "  " + item.capacity + "л  "}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
                    <i className="fas fa-chevron-down"></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 text-center">
              <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 px-8 rounded-full transition-colors duration-300 !rounded-button whitespace-nowrap cursor-pointer">
                SEARCH PARTS
              </button>
            </div>
          </div>
        </div>
      </section>
      {/* Categories Section */}
      <section className="py-16 px-8 bg-black">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 text-center">
            BROWSE BY CATEGORY
          </h2>
          <p className="text-gray-400 text-center mb-12">
            Find parts organized by categories for easier navigation
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <div
                onClick={() => router.push("/catalog/1")}
                key={index}
                className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group"
              >
                <div className="p-6 flex flex-col items-center">
                  <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                    <i
                      className={`fas ${category.icon} text-black text-2xl`}
                    ></i>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {category.name}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {category.count} products
                  </p>
                </div>
                <div className="bg-gray-800 py-3 px-6 text-center group-hover:bg-yellow-400 transition-colors duration-300">
                  <span className="text-sm font-medium group-hover:text-black transition-colors duration-300">
                    View All
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
export default App;
