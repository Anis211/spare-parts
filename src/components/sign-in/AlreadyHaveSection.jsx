import React from "react";

const AlreadyHaveSection = ({ setHave }) => {
  return (
    <div className="flex-1 p-8 bg-gray-50">
      <h2 className="text-2xl font-serif mb-6">
        Do you already have an Account?
      </h2>
      <p className="text-gray-600 mb-8">
        If you already have an account you can easily Login.
      </p>
      <button
        type="button"
        className="w-full border-2 border-gray-900 text-gray-900 py-2 px-4 hover:bg-gray-900 hover:text-white transition-colors rounded-md cursor-pointer whitespace-nowrap"
        onClick={() => setHave(true)}
      >
        Login
      </button>
    </div>
  );
};

export default AlreadyHaveSection;
