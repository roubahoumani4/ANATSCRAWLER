import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { Link } from "wouter";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { fadeIn, itemVariants } from "@/utils/animations";

const NotFoundPage = () => {
  const { language } = useLanguage();

  const translations = {
    title: {
      English: "Page Not Found",
      French: "Page Non Trouvée",
      Spanish: "Página No Encontrada"
    },
    message: {
      English: "The page you are looking for doesn't exist or has been moved.",
      French: "La page que vous recherchez n'existe pas ou a été déplacée.",
      Spanish: "La página que está buscando no existe o ha sido movida."
    },
    button: {
      English: "Back to Dashboard",
      French: "Retour au Tableau de Bord",
      Spanish: "Volver al Panel"
    }
  };

  return (
    <div className="min-h-screen bg-jetBlack flex flex-col items-center justify-center px-4">
      <motion.div
        className="max-w-md w-full p-8 bg-darkGray rounded-xl shadow-xl text-center"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-crimsonRed/10 mb-6 mx-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <AlertTriangle className="h-10 w-10 text-crimsonRed" />
        </motion.div>
        
        <motion.h1
          className="text-3xl font-bold text-coolWhite mb-4"
          variants={itemVariants}
        >
          {translations.title[language as keyof typeof translations.title]}
        </motion.h1>
        
        <motion.p
          className="text-gray-400 mb-8"
          variants={itemVariants}
        >
          {translations.message[language as keyof typeof translations.message]}
        </motion.p>
        
        <motion.div
          variants={itemVariants}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link href="/">
            <a className="inline-flex items-center justify-center px-6 py-3 bg-crimsonRed text-coolWhite rounded-lg font-medium transition-colors hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-crimsonRed focus:ring-offset-2 focus:ring-offset-darkGray">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {translations.button[language as keyof typeof translations.button]}
            </a>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;