import CreateAccountSection from "@/components/sign-in/CreateAccountSection";
import AlreadyHaveSection from "@/components/sign-in/AlreadyHaveSection";
import SignInForm from "@/components/sign-in/SignInForm";
import LoginForm from "@/components/sign-in/LoginForm";
import React, { useState, useRef } from "react";
import { motion, useInView } from "motion/react";

export default function Home() {
  const [have, setHave] = useState(false);

  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState(false);

  const ref1 = useRef(null);
  const inView1 = useInView(ref1);

  const ref2 = useRef(null);
  const inView2 = useInView(ref2);

  return (
    <>
      <motion.div
        ref={ref1}
        initial={{ opacity: 0, y: -60 }}
        animate={inView1 ? { opacity: [0, 1], y: [-60, 0] } : {}}
        transition={{ duration: 1, type: "spring", times: [0, 1] }}
        className={`px-6 py-2 pt-3 rounded-lg bg-[#D1FAE5] h-[80px] ml-7 mt-7 absolute ${
          isSuccess ? "visible" : "hidden"
        }`}
      >
        <h2 className="font-lexend font-semibold text-[#047857] text-[20px]">
          Успех
        </h2>
        <p className="font-lexend font-semibold text-[#047857] text-[14px]">
          Вы успешно зарегистрировали ваш Аккаунт!
        </p>
      </motion.div>
      <motion.div
        ref={ref2}
        initial={{ opacity: 0, y: -60 }}
        animate={inView2 ? { opacity: [0, 1], y: [-60, 0] } : {}}
        exit={{ opacity: [1, 0], y: [0, -60] }}
        transition={{ duration: 1, type: "spring", times: [0, 1] }}
        className={`px-6 py-2 pt-3 rounded-lg bg-red-400 h-[80px] ml-7 mt-7 absolute ${
          isError ? "visible" : "hidden"
        } `}
      >
        <h2 className="font-lexend font-semibold text-gray-50 text-[20px]">
          Ошибка
        </h2>
        <p className="font-lexend font-semibold text-gray-50 text-[14px]">
          {error}
        </p>
      </motion.div>
      <div className="min-h-screen bg-gray-50">
        <main className="max-w-7xl mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-8 md:border-r border-gray-200">
                <h2 className="text-2xl font-serif mb-6">
                  {!have ? "Sign in" : "Login"}
                </h2>
                {!have ? (
                  <SignInForm
                    setIsError={setIsError}
                    setIsSuccess={setIsSuccess}
                    setError={setError}
                  />
                ) : (
                  <LoginForm
                    setIsError={setIsError}
                    setIsSuccess={setIsSuccess}
                    setError={setError}
                  />
                )}
              </div>
              {!have ? (
                <AlreadyHaveSection setHave={setHave} />
              ) : (
                <CreateAccountSection setHave={setHave} />
              )}
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
