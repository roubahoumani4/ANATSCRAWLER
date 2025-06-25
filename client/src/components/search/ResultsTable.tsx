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
                {Object.prototype.hasOwnProperty.call(result, 'name') && result.name !== undefined && <div><b>Name:</b> {String(result.name)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'first_name') && result.first_name !== undefined && <div><b>First Name:</b> {String(result.first_name)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'last_name') && result.last_name !== undefined && <div><b>Last Name:</b> {String(result.last_name)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'phone') && result.phone !== undefined && <div><b>Phone:</b> {String(result.phone)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'email') && result.email !== undefined && <div><b>Email:</b> {String(result.email)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'birthdate') && result.birthdate !== undefined && <div><b>Birthdate:</b> {String(result.birthdate)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'gender') && result.gender !== undefined && <div><b>Gender:</b> {String(result.gender)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'locale') && result.locale !== undefined && <div><b>Locale:</b> {String(result.locale)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'city') && result.city !== undefined && <div><b>City:</b> {String(result.city)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'location') && result.location !== undefined && <div><b>Location:</b> {String(result.location)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'location2') && result.location2 !== undefined && <div><b>Location 2:</b> {String(result.location2)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'link') && result.link !== undefined && <div><b>Link:</b> <a href={String(result.link)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{String(result.link)}</a></div>}
                {Object.prototype.hasOwnProperty.call(result, 'link2') && result.link2 !== undefined && <div><b>Link 2:</b> <a href={String(result.link2)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{String(result.link2)}</a></div>}
                {Object.prototype.hasOwnProperty.call(result, 'protocol') && result.protocol !== undefined && <div><b>Protocol:</b> {String(result.protocol)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'social_link') && result.social_link !== undefined && <div><b>Social Link:</b> <a href={String(result.social_link)} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{String(result.social_link)}</a></div>}
                {Object.prototype.hasOwnProperty.call(result, 'timestamp') && result.timestamp !== undefined && <div><b>Timestamp:</b> {String(result.timestamp)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'fileType') && result.fileType !== undefined && <div><b>File Type:</b> {String(result.fileType)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'fileName') && result.fileName !== undefined && <div><b>File Name:</b> {String(result.fileName)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'extractionConfidence') && result.extractionConfidence !== undefined && <div><b>Extraction Confidence:</b> {String(result.extractionConfidence)}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'exposed') && Array.isArray(result.exposed) && <div className="col-span-2"><b>Exposed:</b> {result.exposed.join(", ")}</div>}
                {Object.prototype.hasOwnProperty.call(result, 'context') && result.context !== undefined && <div className="col-span-2"><b>Context:</b> {String(result.context)}</div>}
                {/* If none of the above fields are present, show a fallback */}
                {!(Object.keys(result).some(key => [
                  'name','first_name','last_name','phone','email','birthdate','gender','locale','city','location','location2','link','link2','protocol','social_link','timestamp','fileType','fileName','extractionConfidence','exposed','context'
                ].includes(key) && (result as any)[key] !== undefined)) && (
                  <div className="col-span-2 text-muted-foreground">No available details for this record.</div>
                )}
              </div>
            </details>
          </motion.div>
        );
      })}
    </div>
  );
};