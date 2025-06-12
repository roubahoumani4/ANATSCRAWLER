import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface SearchFormProps {
  onSearch: (query: string) => void;
  isSearching: boolean;
}

const SearchForm = ({ onSearch, isSearching }: SearchFormProps) => {
  const { translate } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <motion.form 
      className="mx-auto flex justify-center gap-3 mb-6"
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.input
        type="text"
        placeholder="username, email, password"
        className="px-4 py-2 text-base border border-coolWhite rounded-md bg-jetBlack text-coolWhite w-80 focus:outline-none focus:ring-2 focus:ring-coolWhite transition-all"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        whileFocus={{ scale: 1.02 }}
        transition={{ duration: 0.2 }}
      />
      <motion.button 
        type="submit" 
        className="px-5 py-2 bg-coolWhite text-jetBlack font-bold rounded-md hover:bg-crimsonRed hover:text-coolWhite transition-colors duration-300"
        disabled={isSearching}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
      >
        {isSearching ? translate("dashboard.searching") : translate("dashboard.search")}
      </motion.button>
    </motion.form>
  );
};

export default SearchForm;
