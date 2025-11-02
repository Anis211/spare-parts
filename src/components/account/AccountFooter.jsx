export default function Footer() {
  return (
    <footer className="bg-gray-900 py-12 px-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto grid sm:grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-xl font-bold mb-4 text-yellow-400">CARMAX</h3>
          <p className="text-gray-400 mb-4">
            Your trusted source for quality auto parts since 2010. We provide
            parts for all major vehicle makes and models.
          </p>
          <div className="flex space-x-4">
            <a
              href="#"
              className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer"
            >
              <i className="fab fa-facebook-f"></i>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer"
            >
              <i className="fab fa-twitter"></i>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer"
            >
              <i className="fab fa-instagram"></i>
            </a>
            <a
              href="#"
              className="text-gray-400 hover:text-yellow-400 transition-colors cursor-pointer"
            >
              <i className="fab fa-youtube"></i>
            </a>
          </div>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4 text-yellow-400">
            Quick Links
          </h3>
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                Home
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                About Us
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                Catalog
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                Contacts
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                Blog
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4 text-yellow-400">
            Customer Service
          </h3>
          <ul className="space-y-2">
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                My Account
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                Order Tracking
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                Wishlist
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                Returns & Warranty
              </a>
            </li>
            <li>
              <a
                href="#"
                className="text-gray-400 hover:text-yellow-400 transition-colors"
              >
                FAQ
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-lg font-bold mb-4 text-yellow-400 ml-3">
            Contact Info
          </h3>
          <ul className="space-y-2">
            <li className="flex items-start">
              <i className="fas fa-map-marker-alt mt-1 mr-3 text-yellow-400"></i>
              <span className="text-gray-400">
                123 Auto Parts Street, New York, NY 10001
              </span>
            </li>
            <li className="flex items-center">
              <i className="fas fa-phone-alt mr-3 text-yellow-400"></i>
              <span className="text-gray-400">+1 (800) 123-4567</span>
            </li>
            <li className="flex items-center">
              <i className="fas fa-envelope mr-3 text-yellow-400"></i>
              <span className="text-gray-400">info@carmax.com</span>
            </li>
            <li className="flex items-center">
              <i className="fas fa-clock mr-3 text-yellow-400"></i>
              <span className="text-gray-400">Mon-Fri: 9AM-6PM</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
        <p className="text-gray-500 text-sm mb-4 md:mb-0">
          © 2025 CARMAX. All rights reserved.
        </p>
        <div className="flex space-x-6">
          <a
            href="#"
            className="text-gray-500 hover:text-yellow-400 transition-colors text-sm"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-gray-500 hover:text-yellow-400 transition-colors text-sm"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="text-gray-500 hover:text-yellow-400 transition-colors text-sm"
          >
            Shipping Policy
          </a>
        </div>
        <div className="flex items-center space-x-3 mt-4 md:mt-0">
          <i className="fab fa-cc-visa text-2xl text-gray-400"></i>
          <i className="fab fa-cc-mastercard text-2xl text-gray-400"></i>
          <i className="fab fa-cc-amex text-2xl text-gray-400"></i>
          <i className="fab fa-cc-paypal text-2xl text-gray-400"></i>
        </div>
      </div>
    </footer>
  );
}
