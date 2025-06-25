import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface SearchResult {
  id: string;
  source: string;
  score: number;
  matchedTerms: string[];
  highlights: string[];
  context: string;
  index: string;
  content?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  birthdate?: string;
  gender?: string;
  locale?: string;
  city?: string;
  location?: string;
  location2?: string;
  link?: string;
  link2?: string;
  protocol?: string;
  social_link?: string;
  timestamp?: string;
  fileType?: string;
  fileName?: string;
  extractionConfidence?: string;
  exposed?: string[];
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
  breach: {
    English: "Breach",
    French: "Fuite"
  },
  breachDate: {
    English: "Breach Date",
    French: "Date de la fuite"
  },
  exposed: {
    English: "Exposed Data",
    French: "Données exposées"
  },
  summary: {
    English: "Summary",
    French: "Résumé"
  },
  details: {
    English: "Details",
    French: "Détails"
  }
};

function getSummary(result: SearchResult, language: string) {
  const exposed = result.exposed?.join(", ") || "-";
  return language === "French"
    ? `Vos données (${exposed}) ont été exposées lors de la fuite ${result.source} (${result.timestamp || "N/A"}).`
    : `Your data (${exposed}) was exposed in the ${result.source} breach (${result.timestamp || "N/A"}).`;
}

export const ResultsTable = ({ results, loading }: ResultsTableProps) => {
  console.log("ResultsTable results:", results);
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
    <div className="space-y-6 p-4">
      <p className="text-sm text-muted-foreground italic text-center mb-4">
        {translations.confidentialNotice[language]}
      </p>
      {results.map((result, index) => {
        console.log('ResultsTable individual result:', result);
        return (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
          >
            {/* TEMP DEBUG: Dump all fields for this result */}
            <pre className="text-xs text-red-500 bg-gray-100 p-2 rounded mb-2 overflow-x-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
              <div className="font-bold text-lg text-primary">
                {translations.breach[language]}: {result.source}
              </div>
              <div className="text-xs text-muted-foreground">
                {translations.breachDate[language]}: {result.timestamp || "N/A"}
              </div>
            </div>
            <div className="mb-2">
              <span className="font-semibold">{translations.exposed[language]}:</span>
              <span className="ml-2">{result.exposed && result.exposed.length > 0 ? result.exposed.join(", ") : "-"}</span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">{translations.summary[language]}:</span>
              <span className="ml-2">{result.context || getSummary(result, language)}</span>
            </div>
            <details className="mt-2">
              <summary className="cursor-pointer font-semibold text-sm text-blue-600">
                {translations.details[language]}
              </summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
                {Object.entries(result).map(([key, value]) => (
                  <div key={key} className={typeof value === 'object' && value !== null ? 'col-span-2' : ''}>
                    <b>{key}:</b> {Array.isArray(value) ? value.join(', ') : typeof value === 'object' && value !== null ? JSON.stringify(value) : String(value)}
                  </div>
                ))}
              </div>
            </details>
          </motion.div>
        );
      })}
    </div>
  );
};