import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface SearchResult {
  id: string;
  score?: number;
  content?: string;
  name?: string;
  phone?: string;
  location?: string;
  link?: string;
  timestamp?: string;
  fileType?: string;
  fileName?: string;
  extractionConfidence?: string;
  highlights?: string[];
  matchedTerms?: string[];
  context?: string;
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
  },
  phone: {
    English: "Phone",
    French: "Téléphone"
  },
  name: {
    English: "Name",
    French: "Nom"
  },
  location: {
    English: "Location",
    French: "Lieu"
  },
  link: {
    English: "Link",
    French: "Lien"
  },
  timestamp: {
    English: "Timestamp",
    French: "Horodatage"
  },
  fileType: {
    English: "File Type",
    French: "Type de fichier"
  },
  fileName: {
    English: "File Name",
    French: "Nom du fichier"
  },
  extractionConfidence: {
    English: "Extraction Confidence",
    French: "Confiance d'extraction"
  },
  context: {
    English: "Context",
    French: "Contexte"
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
    <div className="overflow-x-auto p-4">
      <p className="text-sm text-muted-foreground italic text-center mb-4">
        {translations.confidentialNotice[language]}
      </p>
      <table className="min-w-full border text-sm bg-card rounded-lg overflow-hidden">
        <thead className="bg-muted/10">
          <tr>
            <th className="px-3 py-2">{translations.phone[language]}</th>
            <th className="px-3 py-2">{translations.name[language]}</th>
            <th className="px-3 py-2">{translations.location[language]}</th>
            <th className="px-3 py-2">{translations.link[language]}</th>
            <th className="px-3 py-2">{translations.timestamp[language]}</th>
            <th className="px-3 py-2">{translations.fileType[language]}</th>
            <th className="px-3 py-2">{translations.fileName[language]}</th>
            <th className="px-3 py-2">{translations.extractionConfidence[language]}</th>
            <th className="px-3 py-2">{translations.score[language]}</th>
            <th className="px-3 py-2">{translations.context[language]}</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <motion.tr
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="border-b last:border-none"
            >
              <td className="px-3 py-2">{result.phone || '-'}</td>
              <td className="px-3 py-2">{result.name || '-'}</td>
              <td className="px-3 py-2">{result.location || '-'}</td>
              <td className="px-3 py-2 break-all">
                {result.link ? (
                  <a href={result.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                    {result.link}
                  </a>
                ) : '-'}
              </td>
              <td className="px-3 py-2">{result.timestamp || '-'}</td>
              <td className="px-3 py-2">{result.fileType || '-'}</td>
              <td className="px-3 py-2">{result.fileName || '-'}</td>
              <td className="px-3 py-2">{result.extractionConfidence || '-'}</td>
              <td className="px-3 py-2">{result.score !== undefined ? Math.round(result.score * 100) + '%' : '-'}</td>
              <td className="px-3 py-2 max-w-xs truncate" title={result.context || ''}>{result.context || '-'}</td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};