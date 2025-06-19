import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface SearchResult {
  id: string;
  score: number;
  snippet: string;
  type: 'document' | 'user';
}

interface ResultsTableProps {
  results: SearchResult[];
  loading: boolean;
}

const translations = {
  noResults: {
    English: "No results found",
    French: "Aucun résultat trouvé"
  },
  confidentialNotice: {
    English: "Some details have been redacted for privacy and security",
    French: "Certains détails ont été masqués pour des raisons de confidentialité et de sécurité"
  },
  score: {
    English: "Relevance",
    French: "Pertinence"
  }
};

export const ResultsTable = ({ results, loading }: ResultsTableProps) => {
  const { language } = useLanguage();

  if (loading) {
    return (
      <div className="w-full p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-muted/20 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {translations.noResults[language]}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-muted-foreground italic text-center mb-4">
        {translations.confidentialNotice[language]}
      </p>
      
      {results.map((result, index) => (
        <motion.div
          key={result.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="relative p-4 rounded-lg border bg-card text-card-foreground shadow-sm"
        >
          <div className="absolute top-2 right-2 px-2 py-1 bg-primary/10 rounded text-xs">
            {translations.score[language]}: {Math.round(result.score * 100)}%
          </div>
          
          <div className="space-y-2">
            <div 
              className="text-sm font-medium leading-relaxed" 
              dangerouslySetInnerHTML={{ __html: result.snippet }}
            />
          </div>
        </motion.div>
      ))}
    </div>
  );
};