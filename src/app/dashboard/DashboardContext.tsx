"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { StoredUser, SearchResultItem } from "@/types";

type DashboardContextType = {
  user: StoredUser | null;
  setUser: React.Dispatch<React.SetStateAction<StoredUser | null>>;
  language: "ID" | "EN";
  setLanguage: (lang: "ID" | "EN") => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  pinnedItems: SearchResultItem[];
  togglePin: (item: SearchResultItem) => void;
  removePin: (item: SearchResultItem) => void;
  isItemPinned: (item: SearchResultItem) => boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (val: boolean) => void;
  selectedItem: SearchResultItem | null;
  setSelectedItem: (item: SearchResultItem | null) => void;
  filterTipe: string;
  setFilterTipe: (val: string) => void;
  handleLogout: () => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<"ID" | "EN">("ID");
  const [pinnedItems, setPinnedItems] = useState<SearchResultItem[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<SearchResultItem | null>(null);
  const [filterTipe, setFilterTipe] = useState("Produk");

  useEffect(() => {
    // Check dark mode and selected item
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme === "dark") setIsDarkMode(true);
      const storedLang = localStorage.getItem("language");
      if (storedLang === "EN") setLanguage("EN");
      
      const storedItem = sessionStorage.getItem("selectedItem");
      if (storedItem) {
        try {
          setSelectedItem(JSON.parse(storedItem));
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", isDarkMode ? "dark" : "light");
      localStorage.setItem("language", language);
    }
  }, [isDarkMode, language]);

  // Persist selected item to survive page reloads
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedItem) {
        sessionStorage.setItem("selectedItem", JSON.stringify(selectedItem));
      } else {
        sessionStorage.removeItem("selectedItem");
      }
    }
  }, [selectedItem]);

  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem("currentUser");
      if (!stored) {
        router.push("/login");
        return;
      }
      try {
        const p = JSON.parse(stored) as StoredUser;
        setUser(p);
      } catch {
        router.push("/login");
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`pinned_items_${user.id}`);
      if (saved) {
        try {
          setPinnedItems(JSON.parse(saved));
        } catch {}
      }
    }
  }, [user]);

  const togglePin = (item: SearchResultItem) => {
    if (!user) return;
    setPinnedItems((prev) => {
      const isExist = prev.find((p) => p.id === item.id);
      let updated;
      if (isExist) {
        updated = prev.filter((p) => p.id !== item.id);
      } else {
        updated = [...prev, item];
      }
      localStorage.setItem(`pinned_items_${user.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const removePin = (item: SearchResultItem) => {
    if (!user) return;
    setPinnedItems((prev) => {
      const updated = prev.filter((p) => p.id !== item.id);
      localStorage.setItem(`pinned_items_${user.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const isItemPinned = (item: SearchResultItem) => {
    return pinnedItems.some((p) => p.id === item.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("currentUser");
    router.push("/login");
  };

  return (
    <DashboardContext.Provider
      value={{
        user,
        setUser,
        language,
        setLanguage,
        isDarkMode,
        setIsDarkMode,
        pinnedItems,
        togglePin,
        removePin,
        isItemPinned,
        isSidebarOpen,
        setIsSidebarOpen,
        selectedItem,
        setSelectedItem,
        filterTipe,
        setFilterTipe,
        handleLogout,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
