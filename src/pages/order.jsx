import React, { useState } from "react";
import { useRouter } from "next/router";
import useUser from "@/zustand/user";
import DotWave from "@/components/custom/DotWave";
import ToastNotification from "@/components/custom/ToesterNotification";
import { AnimatePresence } from "motion/react";

const App = () => {
  const router = useRouter();

  const cart = useUser((state) => state.cart);
  const clearCart = useUser((state) => state.clearCart);

  const us = useUser((state) => state.user);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Состояние формы
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    email: "",
    deliveryMethod: "pickup", // pickup или courier
    city: "Бишкек",
    street: "",
    house: "",
    apartment: "",
    paymentMethod: "card", // card, cash или online
  });

  // Состояние валидации
  const [errors, setErrors] = useState({
    fullName: "",
    phone: "",
    email: "",
    street: "",
    house: "",
  });

  // Расчет стоимости
  const calculateSubtotal = () => {
    let sum = 0;
    Object.values(cart).map((item) => (sum += item.price * item.quantity));
    return sum;
  };

  const calculateShipping = () => {
    if (formData.deliveryMethod === "pickup") return 0;
    const subtotal = calculateSubtotal();
    return subtotal >= 10000 ? 0 : 500;
  };

  const calculateTax = () => {
    return Math.round(calculateSubtotal() * 0.2);
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateShipping() + calculateTax();
  };

  // Обработчик изменения полей формы
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Очистка ошибки при вводе
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Обработчик изменения радио-кнопок
  const handleRadioChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Валидация формы
  const validateForm = () => {
    const newErrors = {
      fullName: "",
      phone: "",
      email: "",
      street: "",
      house: "",
    };
    let isValid = true;
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Пожалуйста, введите ФИО";
      isValid = false;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Пожалуйста, введите номер телефона";
      isValid = false;
    } else if (!/^\+?[0-9]{10,15}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Некорректный формат номера телефона";
      isValid = false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Некорректный формат email";
      isValid = false;
    }
    if (formData.deliveryMethod === "courier") {
      if (!formData.street.trim()) {
        newErrors.street = "Пожалуйста, введите улицу";
        isValid = false;
      }
      if (!formData.house.trim()) {
        newErrors.house = "Пожалуйста, введите номер дома";
        isValid = false;
      }
    }
    setErrors(newErrors);
    return isValid;
  };

  // Обработчик отправки формы
  const [showModal, setShowModal] = useState(false);
  const [orderNumber] = useState(
    `ORDER-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  );
  const [showCheckmark, setShowCheckmark] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setShowCheckmark(true);
    setLoading(true);

    try {
      if (!validateForm()) {
        alert("Please write the whole data needed!");
        return;
      }

      const res = await fetch(`/api/user?email=${us.id}`); // Call the API route
      if (!res.ok) throw new Error("Failed to fetch users");

      const user = await res.json();

      let items = [];
      Object.values(cart).map((item) =>
        items.push({
          productId: item._id,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          size: item.size,
        })
      );

      let shippingCost = 0;

      if (formData.deliveryMethod != "pickup") {
        const subtotal = calculateSubtotal();
        shippingCost = subtotal >= 10000 ? 0 : 500;
      }

      const response = await fetch("/api/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: orderNumber,
          user: user,
          customerData: {
            name: formData.fullName,
            phone: formData.phone,
            email: formData.email,
          },
          address: {
            city: formData.city,
            street: formData.street,
            building: formData.house,
            apartment: formData.apartment,
          },
          items: items,
          paymentMethod: formData.paymentMethod,
          paymentStatus: "Pending",
          paymentData: {
            number: "**** 4242",
            transactionId: "TXN123456789",
          },
          shippingCost: shippingCost,
          shippingMethod: formData.deliveryMethod,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error);
        setTimeout(() => {
          setError("");
        }, 100000);
      } else {
        setShowModal(true);
      }
    } catch (error) {
      setError(error);
      setTimeout(() => {
        setError("");
      }, 2000);
    } finally {
      clearCart();
      setLoading(false);
    }
  };

  const generatePDF = () => {
    // Here would be the logic to generate and download PDF receipt
    const receiptContent = `
Order: ${orderNumber}
Date: ${new Date().toLocaleDateString()}
Delivery: ${
      formData.deliveryMethod === "pickup" ? "Самовывоз" : "Доставка курьером"
    }
Payment: ${
      formData.paymentMethod === "card"
        ? "Банковская карта"
        : formData.paymentMethod === "cash"
        ? "Наличными"
        : "Онлайн оплата"
    }
Total: ${calculateTotal()} ₽
`;
    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${orderNumber}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) return <DotWave />;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <main className="flex flex-col gap-2 mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <a
              data-readdy="true"
              className="text-blue-600 hover:text-blue-800 flex items-center cursor-pointer"
            >
              <span>Вернуться в корзину</span>
            </a>
          </div>
          <h1 className="text-3xl font-bold text-gray-800">
            Оформление заказа
          </h1>
          <p className="text-gray-600 mt-1">
            Заполните данные для оформления заказа
          </p>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Checkout Form */}
          <div className="lg:w-3/5">
            <form>
              {/* Контактные данные */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  1. Контактные данные
                </h2>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="fullName"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      ФИО <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className={`border ${
                        errors.fullName ? "border-red-500" : "border-gray-300"
                      } rounded-md w-full p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Иванов Иван Иванович"
                    />
                    {errors.fullName && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.fullName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Телефон <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={`border ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      } rounded-md w-full p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="+996 XXX XXX XXX"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`border ${
                        errors.email ? "border-red-500" : "border-gray-300"
                      } rounded-md w-full p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="example@mail.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-500">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* Способ доставки */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  2. Способ доставки
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="pickup"
                      name="deliveryMethod"
                      checked={formData.deliveryMethod === "pickup"}
                      onChange={() =>
                        handleRadioChange("deliveryMethod", "pickup")
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="pickup"
                      className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Самовывоз из магазина (бесплатно)
                    </label>
                  </div>
                  {formData.deliveryMethod === "pickup" && (
                    <div className="ml-6 p-4 bg-gray-50 rounded-md">
                      <p className="text-sm text-gray-700">
                        <i className="fas fa-map-marker-alt text-blue-500 mr-2"></i>
                        г. Бишкек, ул. Киевская, 95
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <i className="fas fa-clock text-blue-500 mr-2"></i>
                        Пн-Вс: 10:00 - 20:00
                      </p>
                    </div>
                  )}
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="courier"
                      name="deliveryMethod"
                      checked={formData.deliveryMethod === "courier"}
                      onChange={() =>
                        handleRadioChange("deliveryMethod", "courier")
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="courier"
                      className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Доставка курьером{" "}
                      {calculateSubtotal() >= 10000 ? "(бесплатно)" : "(500 ₽)"}
                    </label>
                  </div>
                </div>
              </div>
              {/* Адрес доставки */}
              {formData.deliveryMethod === "courier" && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    3. Адрес доставки
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="city"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Город <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="border border-gray-300 rounded-md w-full p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Бишкек"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="street"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Улица <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        className={`border ${
                          errors.street ? "border-red-500" : "border-gray-300"
                        } rounded-md w-full p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500`}
                        placeholder="Название улицы"
                      />
                      {errors.street && (
                        <p className="mt-1 text-sm text-red-500">
                          {errors.street}
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="house"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Дом <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="house"
                          name="house"
                          value={formData.house}
                          onChange={handleChange}
                          className={`border ${
                            errors.house ? "border-red-500" : "border-gray-300"
                          } rounded-md w-full p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500`}
                          placeholder="Номер дома"
                        />
                        {errors.house && (
                          <p className="mt-1 text-sm text-red-500">
                            {errors.house}
                          </p>
                        )}
                      </div>
                      <div>
                        <label
                          htmlFor="apartment"
                          className="block text-sm font-medium text-gray-700 mb-1"
                        >
                          Квартира
                        </label>
                        <input
                          type="text"
                          id="apartment"
                          name="apartment"
                          value={formData.apartment}
                          onChange={handleChange}
                          className="border border-gray-300 rounded-md w-full p-2.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Номер квартиры"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Способ оплаты */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {formData.deliveryMethod === "courier"
                    ? "4. Способ оплаты"
                    : "3. Способ оплаты"}
                </h2>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="card"
                      name="paymentMethod"
                      checked={formData.paymentMethod === "card"}
                      onChange={() =>
                        handleRadioChange("paymentMethod", "card")
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="card"
                      className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer flex items-center"
                    >
                      Банковская карта
                      <i className="fab fa-cc-visa text-blue-800 ml-2 text-lg"></i>
                      <i className="fab fa-cc-mastercard text-red-600 ml-1 text-lg"></i>
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="cash"
                      name="paymentMethod"
                      checked={formData.paymentMethod === "cash"}
                      onChange={() =>
                        handleRadioChange("paymentMethod", "cash")
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="cash"
                      className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer"
                    >
                      Наличными при получении
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="online"
                      name="paymentMethod"
                      checked={formData.paymentMethod === "online"}
                      onChange={() =>
                        handleRadioChange("paymentMethod", "online")
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label
                      htmlFor="online"
                      className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer flex items-center"
                    >
                      Онлайн оплата
                      <i className="fab fa-cc-paypal text-blue-600 ml-2 text-lg"></i>
                      <i className="fab fa-apple-pay text-gray-800 ml-1 text-lg"></i>
                    </label>
                  </div>
                </div>
              </div>
            </form>
          </div>
          {/* Order Summary */}
          <div className="lg:w-2/5">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                Ваш заказ
              </h2>
              {/* Cart Items */}
              <div className="space-y-4 mb-6">
                {Object.values(cart).map((product) => (
                  <div
                    key={product._id}
                    className="flex items-start border-b pb-4"
                  >
                    <img
                      src={product.images[0]}
                      alt={product.productName}
                      className="w-16 h-16 object-cover object-top rounded"
                    />
                    <div className="ml-4 flex-1">
                      <h3 className="text-sm font-medium text-gray-800">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500">{product.brand}</p>
                      <div className="flex justify-between mt-1">
                        <span className="text-sm text-gray-600">
                          Кол-во: {product.quantity} || Размер: {product.size}
                        </span>
                        <span className="text-sm font-medium">
                          {product.price * product.quantity} $
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Order Details */}
              <div className="space-y-3 border-b pb-4 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Сумма товаров</span>
                  <span className="font-medium">{calculateSubtotal()} $</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Доставка</span>
                  <span className="font-medium">
                    {calculateShipping() === 0
                      ? "Бесплатно"
                      : `${calculateShipping()} ₽`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">НДС (20%)</span>
                  <span className="font-medium">{calculateTax()} $</span>
                </div>
              </div>
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold">Итого</span>
                <span className="text-xl font-bold">{calculateTotal()} $</span>
              </div>
              <>
                <button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-medium !rounded-button whitespace-nowrap cursor-pointer relative"
                >
                  Подтвердить заказ
                  {showCheckmark && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500 rounded-md transition-all duration-500">
                      <i className="fas fa-check text-white text-2xl"></i>
                    </div>
                  )}
                </button>

                {showModal && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <i className="fas fa-check text-green-500 text-3xl"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">
                          Заказ успешно оформлен!
                        </h2>
                        <p className="text-gray-600 mb-6">
                          Номер вашего заказа:{" "}
                          <span className="font-semibold">{orderNumber}</span>
                        </p>

                        <div className="bg-gray-50 rounded-lg p-4 mb-6">
                          <h3 className="font-semibold text-gray-800 mb-2">
                            Детали заказа:
                          </h3>
                          <p className="text-gray-600">
                            Способ доставки:{" "}
                            {formData.deliveryMethod === "pickup"
                              ? "Самовывоз"
                              : "Доставка курьером"}
                          </p>
                          <p className="text-gray-600">
                            Способ оплаты:{" "}
                            {formData.paymentMethod === "card"
                              ? "Банковская карта"
                              : formData.paymentMethod === "cash"
                              ? "Наличными"
                              : "Онлайн оплата"}
                          </p>
                          <p className="text-gray-600">
                            Сумма заказа: {calculateTotal()} $
                          </p>
                        </div>

                        <button
                          onClick={generatePDF}
                          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-md mb-3 !rounded-button whitespace-nowrap flex items-center justify-center"
                        >
                          Скачать чек
                        </button>

                        <button
                          onClick={() => (router.push = "/account")}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md mb-3 !rounded-button whitespace-nowrap"
                        >
                          Перейти в личный кабинет
                        </button>

                        <button
                          onClick={() => router.push("/")}
                          className="w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-md !rounded-button whitespace-nowrap"
                        >
                          Вернуться на главную
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">
                  Нажимая кнопку "Подтвердить заказ", вы соглашаетесь с
                  условиями покупки
                </p>
              </div>
            </div>
          </div>
        </div>
        <AnimatePresence>
          {error != null && <ToastNotification text={"Ошибка: " + error} />}
        </AnimatePresence>
      </main>
    </div>
  );
};
export default App;
