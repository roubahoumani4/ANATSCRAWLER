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

const DISPLAY_FIELDS = [
  "content",
  "fileName",
  "timestamp",
  "source",
  "context",
  "name",
  "first_name",
  "last_name",
  "phone",
  "email",
  "birthdate",
  "gender",
  "locale",
  "city",
  "location",
  "location2",
  "link",
  "link2",
  "protocol",
  "social_link",
  "fileType",
  "extractionConfidence",
  "exposed"
];

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
        // Filter to only display fields that exist and are not empty
        const availableFields = DISPLAY_FIELDS.filter(
          (field) => result[field as keyof typeof result] !== undefined && result[field as keyof typeof result] !== '' && !(Array.isArray(result[field as keyof typeof result]) && (result[field as keyof typeof result] as any[]).length === 0)
        );
        return (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.08 }}
            className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
          >
            {/* Only show available fields, or a fallback if none */}
            {availableFields.length === 0 ? (
              <div className="text-center text-muted-foreground">No data available</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {availableFields.map((field) => (
                  <div key={field} className={Array.isArray(result[field as keyof typeof result]) ? 'col-span-2' : ''}>
                    <b>{field}:</b> {Array.isArray(result[field as keyof typeof result]) ? (result[field as keyof typeof result] as any[]).join(', ') : String(result[field as keyof typeof result])}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};