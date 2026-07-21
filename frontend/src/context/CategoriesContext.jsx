import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Tag } from "lucide-react";
import { api } from "../api/client.js";
import { getIconComponent } from "../constants/icons.js";

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const { categories: loaded } = await api.categories.list();
      setCategories(loaded);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const categoriesById = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  // Display-ready lookup: resolved icon component + graceful fallback for a
  // categoryId that no longer exists (e.g. stale reference during a race).
  const getCategoryDisplay = useCallback(
    categoryId => {
      const category = categoriesById.get(categoryId);
      if (!category) {
        return { id: categoryId, name: "Uncategorized", icon: Tag, tone: "slate" };
      }
      return { ...category, icon: getIconComponent(category.icon) };
    },
    [categoriesById]
  );

  const createCategory = async body => {
    const { category } = await api.categories.create(body);
    setCategories(prev => [...prev, category]);
    return category;
  };

  const updateCategory = async (id, body) => {
    const { category } = await api.categories.update(id, body);
    setCategories(prev => prev.map(c => (c.id === id ? category : c)));
    return category;
  };

  const deleteCategory = async (id, reassignToId) => {
    await api.categories.remove(id, reassignToId);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  return (
    <CategoriesContext.Provider
      value={{
        categories,
        categoriesById,
        isLoading,
        getCategoryDisplay,
        createCategory,
        updateCategory,
        deleteCategory,
        refresh
      }}
    >
      {children}
    </CategoriesContext.Provider>
  );
}

export function useCategories() {
  const ctx = useContext(CategoriesContext);
  if (!ctx) throw new Error("useCategories must be used within CategoriesProvider");
  return ctx;
}
