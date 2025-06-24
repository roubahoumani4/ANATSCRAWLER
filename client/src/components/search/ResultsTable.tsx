import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface SearchResult {
  id: string;
  source: string;
  breach_date?: string;
  email?: string;
  username?: string;
  full_name?: string;
  phone?: string;
  password?: string;
  password_hash?: string;
  dob?: string;
  gender?: string;
  location?: string;
  profile_url?: string;
  ip_address?: string;
  device?: string;
  fileType?: string;
  fileName?: string;
  extractionConfidence?: string;
  exposed?: string[];
  highlights?: string[];
  matchedTerms?: string[];
  context?: string;
  score?: number;
  index?: string;
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
    ? `Vos données (${exposed}) ont été exposées lors de la fuite ${result.source} (${result.breach_date || "N/A"}).`
    : `Your data (${exposed}) was exposed in the ${result.source} breach (${result.breach_date || "N/A"}).`;
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
              {translations.breachDate[language]}: {result.breach_date || "N/A"}
            </div>
          </div>
          <div className="mb-2">
            <span className="font-semibold">{translations.exposed[language]}:</span>
            <span className="ml-2">{result.exposed && result.exposed.length > 0 ? result.exposed.join(", ") : "-"}</span>
          </div>
          <div className="mb-2">
            <span className="font-semibold">{translations.summary[language]}:</span>
            <span className="ml-2">{getSummary(result, language)}</span>
          </div>
          <details className="mt-2">
            <summary className="cursor-pointer font-semibold text-sm text-blue-600">
              {translations.details[language]}
            </summary>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 text-xs">
              {result.email && <div><b>Email:</b> {result.email}</div>}
              {result.username && <div><b>Username:</b> {result.username}</div>}
              {result.full_name && <div><b>Full Name:</b> {result.full_name}</div>}
              {result.phone && <div><b>Phone:</b> {result.phone}</div>}
              {result.password && <div><b>Password:</b> <span className="text-red-600">{result.password}</span></div>}
              {result.password_hash && <div><b>Password Hash:</b> {result.password_hash}</div>}
              {result.dob && <div><b>DOB:</b> {result.dob}</div>}
              {result.gender && <div><b>Gender:</b> {result.gender}</div>}
              {result.location && <div><b>Location:</b> {result.location}</div>}
              {result.profile_url && <div><b>Profile URL:</b> <a href={result.profile_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{result.profile_url}</a></div>}
              {result.ip_address && <div><b>IP Address:</b> {result.ip_address}</div>}
              {result.device && <div><b>Device:</b> {result.device}</div>}
              {result.fileType && <div><b>File Type:</b> {result.fileType}</div>}
              {result.fileName && <div><b>File Name:</b> {result.fileName}</div>}
              {result.extractionConfidence && <div><b>Extraction Confidence:</b> {result.extractionConfidence}</div>}
              {result.context && <div className="col-span-2"><b>Context:</b> {result.context}</div>}
            </div>
          </details>
        </motion.div>
      ))}
    </div>
  );
};