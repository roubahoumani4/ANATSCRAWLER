import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

interface SearchResult {
  id: string;
  score: number;
  phone?: string;
  name?: string;
  link?: string;
  timestamp?: string;
  snippet?: string;
  type?: 'document' | 'user';
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
  link: {
    English: "Link",
    French: "Lien"
  },
  timestamp: {
    English: "Timestamp",
    French: "Horodatage"
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
      <table className="min-w-full bg-card rounded-lg shadow">
        <thead>
          <tr>
            <th className="px-4 py-2">#</th>
            <th className="px-4 py-2">{translations.phone[language]}</th>
            <th className="px-4 py-2">{translations.name[language]}</th>
            <th className="px-4 py-2">{translations.link[language]}</th>
            <th className="px-4 py-2">{translations.score[language]}</th>
            <th className="px-4 py-2">{translations.timestamp[language]}</th>
          </tr>
        </thead>
        <tbody>
          {results.map((result, index) => (
            <tr key={result.id} className="border-b last:border-0">
              <td className="px-4 py-2 font-mono text-xs">{index + 1}</td>
              <td className="px-4 py-2">{result.phone || '-'}</td>
              <td className="px-4 py-2">{result.name || '-'}</td>
              <td className="px-4 py-2">
                {result.link ? (
                  <a href={result.link.startsWith('http') ? result.link : `https://${result.link}`} target="_blank" rel="noopener noreferrer" className="underline text-blue-500 hover:text-blue-700 break-all">
                    {result.link}
                  </a>
                ) : '-'}
              </td>
              <td className="px-4 py-2">{result.score !== undefined ? Math.round(result.score * 100) + '%' : '-'}</td>
              <td className="px-4 py-2">{result.timestamp || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};