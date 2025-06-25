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
      {results.map((result, index) => (
        <motion.div
          key={result.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.08 }}
          className="rounded-lg border bg-card text-card-foreground shadow-sm p-4"
        >
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
              {result.name && <div><b>Name:</b> {result.name}</div>}
              {result.first_name && <div><b>First Name:</b> {result.first_name}</div>}
              {result.last_name && <div><b>Last Name:</b> {result.last_name}</div>}
              {result.phone && <div><b>Phone:</b> {result.phone}</div>}
              {result.email && <div><b>Email:</b> {result.email}</div>}
              {result.birthdate && <div><b>Birthdate:</b> {result.birthdate}</div>}
              {result.gender && <div><b>Gender:</b> {result.gender}</div>}
              {result.locale && <div><b>Locale:</b> {result.locale}</div>}
              {result.city && <div><b>City:</b> {result.city}</div>}
              {result.location && <div><b>Location:</b> {result.location}</div>}
              {result.location2 && <div><b>Location 2:</b> {result.location2}</div>}
              {result.link && <div><b>Link:</b> <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{result.link}</a></div>}
              {result.link2 && <div><b>Link 2:</b> <a href={result.link2} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{result.link2}</a></div>}
              {result.protocol && <div><b>Protocol:</b> {result.protocol}</div>}
              {result.social_link && <div><b>Social Link:</b> <a href={result.social_link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{result.social_link}</a></div>}
              {result.timestamp && <div><b>Timestamp:</b> {result.timestamp}</div>}
              {result.fileType && <div><b>File Type:</b> {result.fileType}</div>}
              {result.fileName && <div><b>File Name:</b> {result.fileName}</div>}
              {result.extractionConfidence && <div><b>Extraction Confidence:</b> {result.extractionConfidence}</div>}
              {result.exposed && result.exposed.length > 0 && <div className="col-span-2"><b>Exposed:</b> {result.exposed.join(", ")}</div>}
              {result.context && <div className="col-span-2"><b>Context:</b> {result.context}</div>}
              {/* If none of the above fields are present, show a fallback */}
              {!(result.name || result.first_name || result.last_name || result.phone || result.email || result.birthdate || result.gender || result.locale || result.city || result.location || result.location2 || result.link || result.link2 || result.protocol || result.social_link || result.timestamp || result.fileType || result.fileName || result.extractionConfidence || (result.exposed && result.exposed.length > 0) || result.context) && (
                <div className="col-span-2 text-muted-foreground">No available details for this record.</div>
              )}
            </div>
          </details>
        </motion.div>
      ))}
    </div>
  );
};