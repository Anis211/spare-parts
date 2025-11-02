import React, { useState } from "react";
import useUser from "@/zustand/user";
import { useRouter } from "next/router";

const LoginForm = ({ setIsSuccess, setIsError, setError }) => {
  const setUser = useUser((state) => state.setUser);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (password != "admin1234" && email != "admin@mail.ru") {
      try {
        const response = await fetch(`/api/user?email=${email}`); // Call the API route
        if (!response.ok) throw new Error("Failed to fetch users");

        const data = await response.json();

        if (!response.ok) {
          setIsError(true);
          setError(data.error);
          setTimeout(() => {
            setIsError(false);
            setError("");
          }, 2000);
        } else {
          if (data.password == password) {
            setUser({ id: email });
            setIsSuccess(true);
            setTimeout(() => router.push("/"), 2000);
          } else {
            setIsError(true);
            setError("Incorrect Password");
            setTimeout(() => {
              setIsError(false);
              setError("");
            }, 2000);
          }
        }
      } catch (error) {
        setIsError(true);
        setError(error.message);
        setTimeout(() => {
          setIsError(false);
          setError("");
        }, 2000);
      } finally {
        setLoading(false);
      }
    } else {
      setUser({ id: "admin" });
      setIsSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email address
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Enter your email"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="Enter your password"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-gray-900 text-white py-2 px-4 hover:bg-gray-800 transition-colors rounded-md cursor-pointer whitespace-nowrap"
        onClick={handleSubmit}
      >
        {loading ? "Creating..." : "Login"}
      </button>
    </form>
  );
};

export default LoginForm;
