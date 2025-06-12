import { motion } from "framer-motion";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <motion.footer 
      className="bg-jetBlack text-coolWhite text-center py-5 border-t-2 border-coolWhite"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <p>&copy; {currentYear} ANAT Security. All Rights Reserved.</p>
      <nav className="mt-2">
        <a 
          href="/privacy-policy" 
          className="text-coolWhite no-underline mx-2 font-bold hover:text-crimsonRed hover:underline transition-colors"
        >
          Privacy Policy
        </a>
        <a 
          href="/terms-of-service" 
          className="text-coolWhite no-underline mx-2 font-bold hover:text-crimsonRed hover:underline transition-colors"
        >
          Terms of Service
        </a>
      </nav>
    </motion.footer>
  );
};

export default Footer;
