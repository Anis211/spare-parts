import React, { useState, useEffect } from "react";
import ExpandableTreeFromPath from "@/components/tree/Tree";

const App = () => {
  const [selectedItem, setSelectedItem] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({
    x: 0,
    y: 0,
  });

  const [tree, setTree] = useState([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(
          "https://api.partsapi.ru/?method=getSearchTree&key=01186691560aa5dbda9f7be1c2dcc7ec&lang=16&carId=9877&carType=PC"
        );
        const data = await res.json();

        setTree(data);
        console.log(data);
      } catch (e) {
        console.error(e.message);
      }
    };
    tree.length == 0 && run();
  }, [setTree]);

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Breadcrumb */}
      <div className="bg-gray-900 px-6 py-3 text-sm">
        <div className="flex items-center text-gray-400">
          <a href="#" className="hover:text-yellow-500 cursor-pointer mx-3">
            Original Catalog
          </a>
          {" / "}
          <a href="#" className="hover:text-yellow-500 cursor-pointer mx-3">
            Models
          </a>
          {"/"}
          <a href="#" className="hover:text-yellow-500 cursor-pointer mx-3">
            Parts
          </a>
          {"/"}
          <span className="text-white ml-3">Oil Filter</span>
        </div>
      </div>
      {/* Main Content */}
      <div className="flex flex-col md:flex-row min-h-[700px]">
        {/* Left Sidebar - Categories */}
        <div className="w-full md:w-64 bg-[#1a1f2e] p-0">
          <div style={{ padding: "20px", fontFamily: "Arial" }}>
            <h2>Каталог запчастей</h2>
            <ExpandableTreeFromPath data={tree} />
          </div>
        </div>
        {/* Center - Diagram */}
        <div className="flex-1 bg-black p-4 border-l border-r border-[#2a2f3e]">
          <div className="mb-4">
            <div className="bg-[#1a1f2e] rounded-lg p-3 mb-4">
              <h2 className="text-lg font-medium mb-1">
                {selectedItem === "block-carter"
                  ? "Engine Block Assembly Technical Diagram"
                  : selectedItem === "cylinder-head"
                  ? "Cylinder Head Assembly Technical Diagram"
                  : "GM00-095: ENGINE ASM-3.8L V6 PART 1 (L67/3.8-1)(2ND DES)"}
              </h2>
              <p className="text-sm text-gray-400">
                Technical diagram with interactive parts selection
              </p>
            </div>
            <div className="bg-[#1a1f2e] rounded-lg p-4 flex justify-center items-center relative">
              <img
                src={
                  selectedItem === "block-carter"
                    ? "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20engine%20block%20assembly%20exploded%20view%2C%20black%20and%20white%20schematic%20drawing%20with%20numbered%20components%2C%20engineering%20blueprint%20style%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=block1&orientation=landscape"
                    : selectedItem === "cylinder-head"
                    ? "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20cylinder%20head%20assembly%20exploded%20view%2C%20black%20and%20white%20schematic%20drawing%20with%20numbered%20components%2C%20engineering%20blueprint%20style%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=cylinderhead1&orientation=landscape"
                    : selectedItem === "crankshaft-gear"
                    ? "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20crankshaft%20gear%20assembly%20exploded%20view%20showing%20timing%20gear%20teeth%20and%20mounting%20components%2C%20engineering%20blueprint%20style%20with%20numbered%20parts%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=crankshaftgear1&orientation=landscape"
                    : "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20car%20engine%20parts%20exploded%20view%2C%20black%20and%20white%20schematic%20drawing%20with%20numbered%20components%2C%20engineering%20blueprint%20style%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=diagram1&orientation=landscape"
                }
                alt="Engine Diagram"
                className="max-w-full max-h-[500px] object-contain"
              />
              <div className="absolute bottom-2 right-2 flex space-x-2">
                <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded !rounded-button whitespace-nowrap cursor-pointer">
                  <i className="fas fa-search-plus"></i>
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded !rounded-button whitespace-nowrap cursor-pointer">
                  <i className="fas fa-search-minus"></i>
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded !rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i className="fas fa-expand"></i>
                </button>
                {isModalOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
                    <div className="relative w-[90vw] h-[90vh] bg-[#1a1f2e] rounded-lg p-4">
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          setScale(1);
                          setPosition({ x: 0, y: 0 });
                        }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 !rounded-button whitespace-nowrap cursor-pointer"
                      >
                        <i className="fas fa-times text-xl"></i>
                      </button>
                      <div className="absolute top-4 left-4 flex space-x-2 z-10">
                        <button
                          onClick={handleZoomIn}
                          className="bg-gray-700 hover:bg-gray-600 p-2 rounded !rounded-button whitespace-nowrap cursor-pointer"
                        >
                          <i className="fas fa-search-plus"></i>
                        </button>
                        <button
                          onClick={handleZoomOut}
                          className="bg-gray-700 hover:bg-gray-600 p-2 rounded !rounded-button whitespace-nowrap cursor-pointer"
                        >
                          <i className="fas fa-search-minus"></i>
                        </button>
                      </div>
                      <div
                        className="w-full h-full overflow-hidden"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        <div
                          style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transition: isDragging ? "none" : "transform 0.1s",
                            cursor: isDragging ? "grabbing" : "grab",
                          }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          <img
                            src={
                              selectedItem === "block-carter"
                                ? "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20engine%20block%20assembly%20exploded%20view%2C%20black%20and%20white%20schematic%20drawing%20with%20numbered%20components%2C%20engineering%20blueprint%20style%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=block1&orientation=landscape"
                                : selectedItem === "cylinder-head"
                                ? "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20cylinder%20head%20assembly%20exploded%20view%2C%20black%20and%20white%20schematic%20drawing%20with%20numbered%20components%2C%20engineering%20blueprint%20style%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=cylinderhead1&orientation=landscape"
                                : selectedItem === "crankshaft-gear"
                                ? "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20crankshaft%20gear%20assembly%20exploded%20view%20showing%20timing%20gear%20teeth%20and%20mounting%20components%2C%20engineering%20blueprint%20style%20with%20numbered%20parts%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=crankshaftgear1&orientation=landscape"
                                : "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20car%20engine%20parts%20exploded%20view%2C%20black%20and%20white%20schematic%20drawing%20with%20numbered%20components%2C%20engineering%20blueprint%20style%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=diagram1&orientation=landscape"
                            }
                            alt="Engine Diagram"
                            className="max-w-full max-h-full object-contain select-none"
                            draggable="false"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="bg-gray-800 rounded-lg p-3 mb-4">
              <h2 className="text-lg font-medium mb-1">
                GM00-151: ENGINE ASM-3.8L V6 PART 1 (L67/3.8-1)(1ST DES)
              </h2>
              <p className="text-sm text-gray-400">
                Technical diagram with interactive parts selection
              </p>
            </div>
            <div className="bg-[#1a1f2e] rounded-lg p-4 flex justify-center items-center relative">
              <img
                src="https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20car%20engine%20parts%20exploded%20view%2C%20black%20and%20white%20schematic%20drawing%20with%20numbered%20components%2C%20engineering%20blueprint%20style%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=diagram2&orientation=landscape"
                alt="Engine Diagram"
                className="max-w-full max-h-[500px] object-contain"
              />
              <div className="absolute bottom-2 right-2 flex space-x-2">
                <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded !rounded-button whitespace-nowrap cursor-pointer">
                  <i className="fas fa-search-plus"></i>
                </button>
                <button className="bg-gray-700 hover:bg-gray-600 p-2 rounded !rounded-button whitespace-nowrap cursor-pointer">
                  <i className="fas fa-search-minus"></i>
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded !rounded-button whitespace-nowrap cursor-pointer"
                >
                  <i className="fas fa-expand"></i>
                </button>
                {isModalOpen && (
                  <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
                    <div className="relative w-[90vw] h-[90vh] bg-[#1a1f2e] rounded-lg p-4">
                      <button
                        onClick={() => {
                          setIsModalOpen(false);
                          setScale(1);
                          setPosition({ x: 0, y: 0 });
                        }}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 !rounded-button whitespace-nowrap cursor-pointer"
                      >
                        <i className="fas fa-times text-xl"></i>
                      </button>
                      <div className="absolute top-4 left-4 flex space-x-2 z-10">
                        <button
                          onClick={handleZoomIn}
                          className="bg-gray-700 hover:bg-gray-600 p-2 rounded !rounded-button whitespace-nowrap cursor-pointer"
                        >
                          <i className="fas fa-search-plus"></i>
                        </button>
                        <button
                          onClick={handleZoomOut}
                          className="bg-gray-700 hover:bg-gray-600 p-2 rounded !rounded-button whitespace-nowrap cursor-pointer"
                        >
                          <i className="fas fa-search-minus"></i>
                        </button>
                      </div>
                      <div
                        className="w-full h-full overflow-hidden"
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        <div
                          style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                            transition: isDragging ? "none" : "transform 0.1s",
                            cursor: isDragging ? "grabbing" : "grab",
                          }}
                          className="w-full h-full flex items-center justify-center"
                        >
                          <img
                            src={
                              selectedItem === "block-carter"
                                ? "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20engine%20block%20assembly%20exploded%20view%2C%20black%20and%20white%20schematic%20drawing%20with%20numbered%20components%2C%20engineering%20blueprint%20style%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=block1&orientation=landscape"
                                : selectedItem === "cylinder-head"
                                ? "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20cylinder%20head%20assembly%20exploded%20view%2C%20black%20and%20white%20schematic%20drawing%20with%20numbered%20components%2C%20engineering%20blueprint%20style%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=cylinderhead1&orientation=landscape"
                                : selectedItem === "crankshaft-gear"
                                ? "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20crankshaft%20gear%20assembly%20exploded%20view%20showing%20timing%20gear%20teeth%20and%20mounting%20components%2C%20engineering%20blueprint%20style%20with%20numbered%20parts%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=crankshaftgear1&orientation=landscape"
                                : "https://readdy.ai/api/search-image?query=detailed%20technical%20diagram%20of%20car%20engine%20parts%20exploded%20view%2C%20black%20and%20white%20schematic%20drawing%20with%20numbered%20components%2C%20engineering%20blueprint%20style%2C%20high%20resolution%20technical%20illustration%20on%20transparent%20background&width=600&height=500&seq=diagram1&orientation=landscape"
                            }
                            alt="Engine Diagram"
                            className="max-w-full max-h-full object-contain select-none"
                            draggable="false"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Right Sidebar - Parts List */}
        <div className="w-full md:w-80 bg-[#1a1f2e] p-4">
          <div className="mb-4">
            <h2 className="font-medium mb-4 text-lg">Parts List</h2>
            <div className="bg-black rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#2a2f3e]">
                    <th className="py-2 px-3 text-left font-medium">#</th>
                    <th className="py-2 px-3 text-left font-medium">
                      Part Name
                    </th>
                    <th className="py-2 px-3 text-left font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedItem === "crankshaft-gear" ? (
                    <>
                      <tr className="border-b border-gray-700">
                        <td className="py-3 px-3">301</td>
                        <td className="py-3 px-3">Crankshaft Timing Gear</td>
                        <td className="py-3 px-3 text-center">
                          <button className="text-blue-400 hover:text-blue-300 !rounded-button whitespace-nowrap cursor-pointer">
                            <i className="fas fa-info-circle"></i>
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-700">
                        <td className="py-3 px-3">302</td>
                        <td className="py-3 px-3">Mounting Bolts</td>
                        <td className="py-3 px-3 text-center">
                          <button className="text-blue-400 hover:text-blue-300 !rounded-button whitespace-nowrap cursor-pointer">
                            <i className="fas fa-info-circle"></i>
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-700">
                        <td className="py-3 px-3">303</td>
                        <td className="py-3 px-3">Timing Chain</td>
                        <td className="py-3 px-3 text-center">
                          <button className="text-blue-400 hover:text-blue-300 !rounded-button whitespace-nowrap cursor-pointer">
                            <i className="fas fa-info-circle"></i>
                          </button>
                        </td>
                      </tr>
                    </>
                  ) : selectedItem === "block-carter" ? (
                    <>
                      <tr className="border-b border-gray-700">
                        <td className="py-3 px-3">101</td>
                        <td className="py-3 px-3">Engine Block Assembly</td>
                        <td className="py-3 px-3 text-center">
                          <button className="text-blue-400 hover:text-blue-300 !rounded-button whitespace-nowrap cursor-pointer">
                            <i className="fas fa-info-circle"></i>
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-700">
                        <td className="py-3 px-3">102</td>
                        <td className="py-3 px-3">Cylinder Sleeve</td>
                        <td className="py-3 px-3 text-center">
                          <button className="text-blue-400 hover:text-blue-300 !rounded-button whitespace-nowrap cursor-pointer">
                            <i className="fas fa-info-circle"></i>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3">103</td>
                        <td className="py-3 px-3">Block Mounting Bracket</td>
                        <td className="py-3 px-3 text-center">
                          <button className="text-blue-400 hover:text-blue-300 !rounded-button whitespace-nowrap cursor-pointer">
                            <i className="fas fa-info-circle"></i>
                          </button>
                        </td>
                      </tr>
                    </>
                  ) : selectedItem === "cylinder-head" ? (
                    <>
                      <tr className="border-b border-gray-700">
                        <td className="py-3 px-3">201</td>
                        <td className="py-3 px-3">Cylinder Head Assembly</td>
                        <td className="py-3 px-3 text-center">
                          <button className="text-blue-400 hover:text-blue-300 !rounded-button whitespace-nowrap cursor-pointer">
                            <i className="fas fa-info-circle"></i>
                          </button>
                        </td>
                      </tr>
                      <tr className="border-b border-gray-700">
                        <td className="py-3 px-3">202</td>
                        <td className="py-3 px-3">Valve Cover</td>
                        <td className="py-3 px-3 text-center">
                          <button className="text-blue-400 hover:text-blue-300 !rounded-button whitespace-nowrap cursor-pointer">
                            <i className="fas fa-info-circle"></i>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3">203</td>
                        <td className="py-3 px-3">Valve Spring</td>
                        <td className="py-3 px-3 text-center">
                          <button className="text-blue-400 hover:text-blue-300 !rounded-button whitespace-nowrap cursor-pointer">
                            <i className="fas fa-info-circle"></i>
                          </button>
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr className="border-b border-gray-700">
                      <td className="py-3 px-3">79</td>
                      <td className="py-3 px-3">
                        FILTER,OIL(ACDelco #PF47E)(DURAGUARD)
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button className="text-blue-400 hover:text-blue-300 !rounded-button whitespace-nowrap cursor-pointer">
                          <i className="fas fa-info-circle"></i>
                        </button>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-3 px-3">78</td>
                    <td className="py-3 px-3">FILTER,OIL(ULTRAGUARD GOLD)</td>
                    <td className="py-3 px-3 text-center">
                      <button className="text-blue-400 hover:text-blue-300 !rounded-button whitespace-nowrap cursor-pointer">
                        <i className="fas fa-info-circle"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-8 bg-gray-900 rounded-lg p-4">
            <h3 className="font-medium mb-3">Need Help?</h3>
            <p className="text-sm text-gray-400 mb-3">
              Our specialists can help you find the right parts for your
              vehicle.
            </p>
            <button className="bg-[#ffd700] hover:bg-[#ffc700] text-black py-2 px-4 rounded w-full !rounded-button whitespace-nowrap cursor-pointer">
              <i className="fas fa-headset mr-2"></i> Contact Support
            </button>
          </div>
        </div>
      </div>
      {/* Floating Edit Button */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-[#ffd700] hover:bg-[#ffc700] text-black p-3 rounded-full shadow-lg !rounded-button whitespace-nowrap cursor-pointer">
          <i className="fas fa-pencil-alt"></i>
        </button>
      </div>
    </div>
  );
};
export default App;
