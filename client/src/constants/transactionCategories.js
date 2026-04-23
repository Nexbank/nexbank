import {
  FiBriefcase,
  FiCoffee,
  FiGift,
  FiShoppingBag,
  FiSmartphone,
  FiTruck,
  FiTrendingUp,
  FiZap,
} from "react-icons/fi";

export const spendingCategories = [
  "Groceries",
  "Dining",
  "Transport",
  "Entertainment",
  "Utilities",
];

export const depositCategories = ["Income", "Savings", "Refund", "Gift"];

const defaultCategoryMeta = {
  color: "#6b7280",
  icon: FiTrendingUp,
};

export const categoryMeta = {
  Groceries: {
    color: "#19c88a",
    icon: FiShoppingBag,
  },
  Dining: {
    color: "#4b8cff",
    icon: FiCoffee,
  },
  Transport: {
    color: "#ff8a1e",
    icon: FiTruck,
  },
  Entertainment: {
    color: "#a855f7",
    icon: FiSmartphone,
  },
  Utilities: {
    color: "#ff4747",
    icon: FiZap,
  },
  Income: {
    color: "#12d394",
    icon: FiTrendingUp,
  },
  Savings: {
    color: "#0ea5e9",
    icon: FiBriefcase,
  },
  Refund: {
    color: "#f59e0b",
    icon: FiTrendingUp,
  },
  Gift: {
    color: "#ec4899",
    icon: FiGift,
  },
};

export function getCategoryMeta(category) {
  return categoryMeta[category] || defaultCategoryMeta;
}
