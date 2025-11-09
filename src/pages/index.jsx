import React from "react";
import { motion } from "framer-motion";

const services = [
  {
    title: "Engine Parts",
    description: "Complete engine components from filters to pistons",
    features: ["OEM & Aftermarket", "All Makes & Models", "Warranty Included"],
    icon: "/car.png",
  },
  {
    title: "Electrical Systems",
    description: "Batteries, alternators, starters, and wiring",
    features: ["High Performance", "Long Lasting", "Expert Installation"],
    icon: "/battery.png",
  },
  {
    title: "Suspension & Brakes",
    description: "Safety-critical components for smooth rides",
    features: ["Premium Brands", "Safety Tested", "Professional Grade"],
    icon: "/truck.png",
  },
  {
    title: "Tools & Equipment",
    description: "Professional tools for DIY and mechanics",
    features: ["Professional Grade", "Lifetime Warranty", "Expert Support"],
    icon: "/wrench.png",
  },
];

const features = [
  {
    title: "Quality Guarantee",
    description: "All parts come with manufacturer warranty",
    icon: "/shield.png",
  },
  {
    title: "Fast Delivery",
    description: "Same-day shipping on most orders",
    icon: "/clock.png",
  },
  {
    title: "Expert Support",
    description: "Professional mechanics available 24/7",
    icon: "/reward.png",
  },
];

const App = () => {
  const handleClick = async () => {
    const proxyShatemAuthUrl = `/api/py/shatem_auth`;
    const proxyShatemUrl = `/api/py/shatem`;
    const partNumber = "CRG-32";
    const partName = "Тяга рулевая";
    const agreement = "KSAGR00684";

    const scrapeShatemAuthResponse = await fetch(proxyShatemAuthUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    const scrapeShatemAuthData = await scrapeShatemAuthResponse.json();
    console.log(scrapeShatemAuthData);

    const scrapeShatemResponse = await fetch(proxyShatemUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partNumber,
        partName,
        agreement,
        antiforgery: scrapeShatemAuthData.auth_data.find(
          (c) => c.name === ".AspNetCore.Antiforgery.VyLW6ORzMgk"
        )?.value,
        x_access_token: scrapeShatemAuthData.auth_data.find(
          (c) => c.name === "X-Access-Token"
        )?.value,
        x_refresh_token: scrapeShatemAuthData.auth_data.find(
          (c) => c.name === "X-Refresh-Token"
        )?.value,
      }),
    });
    const scrapeShatemData = await scrapeShatemResponse.json();
    console.log(scrapeShatemData);
  };

  return (
    <div className="min-h-screen text-white bg-gradient-to-r from-[#0C1F54] to-[#040E26]">
      {/* Main Content */}
      <main className="w-full">
        {/* Hero Section */}
        <section className="relative bg-gray-900 overflow-hidden mb-12">
          <div className="relative h-[100vh]">
            {/* Background Image */}
            <div className="absolute inset-0">
              <img
                src="/main.jpg"
                alt="Luxury Car"
                className="w-full h-full object-cover object-center opacity-30 z-50"
              />
              <div className="absolute inset-0 backdrop-blur-xs bg-opacity-80"></div>
            </div>
            {/* Content */}
            <div className="relative flex flex-col items-center justify-center h-full text-center px-4 py-20">
              <div className="flex flex-col items-center justify-center flex-grow">
                <div className="mb-8">
                  <h2 className="text-yellow-400 font-bold mb-1 text-4xl">
                    CARMAX
                  </h2>
                </div>
                <div className="mb-12">
                  <p className="text-gray-200 text-lg mb-6">
                    GET THE BEST AUTO PARTS
                  </p>
                  <h1 className="text-6xl font-bold mb-4 text-white">
                    FOR HUNDREDS
                  </h1>
                  <h1 className="text-6xl font-bold mb-10">
                    OF <span className="text-yellow-400">VEHICLES</span>
                  </h1>
                  <button
                    onClick={handleClick}
                    className="bg-yellow-400 text-black px-10 py-4 rounded-full font-medium hover:bg-yellow-300 transition-colors duration-300 cursor-pointer !rounded-button whitespace-nowrap text-lg"
                  >
                    <i className="fas fa-shopping-cart mr-2"></i>
                    SHOP AUTO PARTS
                  </button>
                </div>
              </div>
              <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-600"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Chat Integration Section */}
        <section className="py-16">
          <div className="flex mx-auto px-4">
            <div className="w-full md:max-w-5xl mx-auto text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                <h2 className="text-4xl font-bold text-white mb-4">
                  Need Expert Help?
                </h2>
                <p className="text-xl text-gray-200 mb-8">
                  Our automotive specialists are ready to help you find the
                  perfect parts for your vehicle. Get instant answers and
                  personalized recommendations.
                </p>

                <div className="flex md:flex-row mx-auto gap-4 justify-center mb-8 max-w-[80%]">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.4, type: "spring" }}
                    className="text-lg w-[45%] bg-yellow-500 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-500 transition-colors cursor-pointer whitespace-nowrap !rounded-button mb-2 sm:mb-0"
                  >
                    Chat with Expert Now
                  </motion.button>
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: "white",
                      color: "#040E26",
                    }}
                    transition={{ duration: 0.4, type: "spring" }}
                    className="text-lg text-white w-[45%] border-white border px-6 py-3 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap !rounded-button"
                  >
                    Call (555) 123-4567
                  </motion.button>
                </div>

                <div className="grid md:grid-cols-3 gap-6 text-white">
                  <div className="text-center flex flex-col items-center">
                    <img
                      src="/time.png"
                      alt="time"
                      className="w-16 h-16 mb-2"
                    />
                    <h3 className="font-semibold text-xl mb-2">24/7 Support</h3>
                    <p className="text-md text-gray-300">
                      Always available when you need us
                    </p>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <img
                      src="/message.png"
                      alt="time"
                      className="w-16 h-16 mb-2"
                    />
                    <h3 className="font-semibold text-xl mb-2">
                      Instant Responses
                    </h3>
                    <p className="text-md text-gray-300">
                      Get answers in seconds
                    </p>
                  </div>
                  <div className="text-center flex flex-col items-center">
                    <img
                      src="/mail.png"
                      alt="time"
                      className="w-16 h-16 mb-2"
                    />
                    <h3 className="font-semibold text-xl mb-2">
                      Expert Advice
                    </h3>
                    <p className="text-md text-gray-300">
                      Professional automotive guidance
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {/* Services Section */}
        <section id="services" className="py-20 bg-white">
          <div className="flex flex-col mx-auto px-4">
            {/* Section Header */}
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-4xl lg:text-5xl font-bold text-[#040E26] mb-4">
                Our Services
              </h2>
              <p className="text-xl text-[#535760] max-w-2xl mx-auto">
                Comprehensive automotive solutions with premium parts and expert
                support
              </p>
            </div>

            {/* Services Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
              {services.map((service, index) => (
                <div
                  className="transition-all duration-300 hover:-translate-y-2 border-2 hover:border-[#C79F36] rounded-lg"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-[#C79F36] rounded-full flex items-center justify-center mx-auto mb-4">
                      <img
                        src={service.icon}
                        alt={service.title}
                        className="w-9 h-9 items-center"
                      />
                    </div>
                    <h3 className="text-xl font-bold text-[#040E26] mb-3">
                      {service.title}
                    </h3>
                    <p className="text-[#535760] mb-4 text-xs">
                      {service.description}
                    </p>
                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="text-sm text-[#535760] flex items-center justify-center"
                        >
                          <div className="w-2 h-2 bg-[#C79F36] rounded-full mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button className="w-full bg-white hover:bg-[#C79F36] text-[#040E26] font-semibold py-2 px-4 rounded-lg border-2 border-[#C79F36] transition-colors duration-300 cursor-pointer whitespace-nowrap !rounded-button">
                      Learn More
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Features Row */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="text-center animate-fade-in"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="w-20 h-20 bg-[#0C1F54] rounded-full flex items-center justify-center mx-auto mb-4">
                    <img
                      src={feature.icon}
                      alt={feature.title}
                      className="w-10 h-10"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-[#040E26] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-[#535760]">{feature.description}</p>
                </div>
              ))}
            </div>

            {/* CTA Section */}
            <div className="text-center mt-16 animate-fade-in w-[90vw] mx-auto">
              <div className="bg-gradient-to-r from-[#0C1F54] to-[#040E26] rounded-lg p-8 text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  Need Help Finding the Right Part?
                </h3>
                <p className="text-lg md:text-xl mb-6 text-gray-200">
                  Our expert mechanics are standing by to help you find exactly
                  what you need
                </p>
                <div className="flex flex-row gap-6 justify-center">
                  <motion.button
                    initial={{ borderRadius: "99px" }}
                    whileHover={{ borderRadius: "4px", scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.6, type: "spring" }}
                    className="min-w-[35%] bg-[#C79F36] text-[#040E26] font-semibold py-2 px-4"
                  >
                    Get Free Quote
                  </motion.button>
                  <motion.button
                    initial={{ borderRadius: "99px" }}
                    whileHover={{ borderRadius: "4px", scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="min-w-[35%] bg-gradient-to-r from-[#0C1F54] to-[#040E26] text-white font-semibold py-2 px-4 rounded-full border-2 border-white hover:border-yellow-400 transition-colors duration-300 cursor-pointer whitespace-nowrap !rounded-button"
                  >
                    Call Expert Now
                  </motion.button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
