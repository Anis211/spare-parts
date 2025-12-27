import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUser = create(
  persist(
    (set) => ({
      user: { id: "incognito" },
      setUser: (newOne) => set(() => ({ user: newOne })),
      clearUser: () => set(() => ({ user: { id: "incognito" } })),

      vin: "",
      setVin: (newVin) => set(() => ({ vin: newVin })),
      clearVin: () => set(() => ({ vin: "" })),

      salesTab: "Shop",
      setSalesTab: (newSalesTab) => set(() => ({ salesTab: newSalesTab })),

      liked: {},
      addLiked: (key, value) =>
        set((state) => ({ liked: { ...state.liked, [key]: value } })),
      removeLiked: (item) =>
        set((state) =>
          Object.keys(state.liked).length > 1
            ? {
                liked: Object.fromEntries(
                  Object.entries(state.liked).filter(
                    ([key, value]) => key !== item
                  )
                ),
              }
            : { liked: {} }
        ),
      clearLiked: () => set(() => ({ liked: {} })),

      cart: {},
      changeCart: (id, value) =>
        set((state) => ({
          cart: { ...state.cart, [id]: { ...state.cart[id], quantity: value } },
        })),
      addCart: (item) =>
        set((state) => ({
          cart: { ...state.cart, [item._id + item.size]: item },
        })),
      removeCart: (item) =>
        set((state) =>
          Object.keys(state.cart).length > 1
            ? {
                cart: Object.fromEntries(
                  Object.entries(state.cart).filter(
                    ([key, value]) => key !== item._id + item.size
                  )
                ),
              }
            : { cart: {} }
        ),
      clearCart: () => set(() => ({ cart: {} })),

      languange: true,
      changeLanguage: () => set((state) => ({ language: !state.language })),
      chat: [{ isUser: false, text: "How can i assist you today?" }],

      changeChat: (message) =>
        set((state) => ({ chat: [...state.chat, message] })),
      clearChat: () =>
        set(() => ({
          chat: [{ isUser: false, text: "How can i assist you today?" }],
        })),
    }),
    {
      name: "user-store", // Key for localStorage
      getStorage: () => localStorage, // Use localStorage as the storage engine
    }
  )
);

export default useUser;
