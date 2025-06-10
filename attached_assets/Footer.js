import React from 'react';
import { useLanguage } from '../LanguageContext';
import './Footer.css';

const Footer = () => {
  const { language } = useLanguage();

  return (
    <footer className="footer">
      <p>
        &copy; 2024 ANAT Security.{' '}
        {language === 'French' 
          ? 'Tous droits réservés.' 
          : language === 'Spanish' 
          ? 'Todos los derechos reservados.' 
          : 'All Rights Reserved.'}
      </p>
      <nav>
        <a href="#">
          {language === 'French' 
            ? 'Politique de confidentialité' 
            : language === 'Spanish' 
            ? 'Política de privacidad' 
            : 'Privacy Policy'}
        </a>
        <a href="#">
          {language === 'French' 
            ? 'Conditions d’utilisation' 
            : language === 'Spanish' 
            ? 'Términos de servicio' 
            : 'Terms of Service'}
        </a>
      </nav>
    </footer>
  );
};

export default Footer;
