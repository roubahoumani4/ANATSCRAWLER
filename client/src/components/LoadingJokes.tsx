import { useEffect, useState } from 'react';

const DARK_HUMOR_JOKES = [
  "Scanning your digital footprint... Don't worry, we've seen worse.",
  'Collecting OSINT data... Your secrets are safe with us. Maybe.',
  'Analyzing target... We promise this is for security, not stalking.',
  "Running reconnaissance modules... At least it's legal this time.",
  "Gathering intelligence... The NSA called, they're impressed.",
  'Scanning networks... Finding more holes than Swiss cheese.',
  "Analyzing DNS records... Your domain's past is darker than mine.",
  'Collecting social media traces... Privacy is so last century anyway.',
  'Running vulnerability scans... We found issues. Lots of them.',
  "Checking security headers... They're more missing than my motivation.",
  'Crawling web archives... Your embarrassing 2010 website lives forever.',
  "Scanning for exposed data... Found your password: 'password123'.",
  'Analyzing SSL certificates... They expired faster than my last relationship.',
  'Checking for data leaks... Your information is everywhere. Literally.',
  'Running port scans... More open than a 24/7 diner.',
  'Collecting metadata... Big Brother would be jealous of our collection.',
  'Analyzing traffic patterns... You visit some... interesting sites.',
  'Scanning for IoT devices... Your smart toaster is part of a botnet now.',
  "Checking breach databases... You're famous! In all the wrong ways.",
  "Running WHOIS queries... Anonymous? That's adorable.",
  'Analyzing email patterns... Spam folders fear your domain.',
  "Scanning for weak passwords... 'qwerty' is not quantum encryption.",
  'Checking security misconfigurations... Found 404 errors in your security.',
  'Running geolocation queries... We know where you live. And work. And shop.',
  'Analyzing certificate transparency logs... Your certificates are transparent. So is your security.',
  'Scanning for exposed APIs... More endpoints than a medical conference.',
  'Checking for subdomain takeovers... Your infrastructure is up for adoption.',
  'Running reputation checks... Even your ISP is concerned.',
  'Analyzing HTTP headers... They leak more than the Titanic.',
  'Scanning for exposed databases... MongoDB left the door wide open. Again.',
  'Checking for XSS vulnerabilities... Your website accepts everything. How trusting.',
  'Running SQL injection tests... Bobby Tables would be proud.',
  "Analyzing cookie security... They're softer than grandma's chocolate chip.",
  "Scanning for directory traversal... We're taking the scenic route through your files.",
  'Checking CORS policies... Cross-origin? More like cross-eyed security.',
  'Running CSRF tests... Your tokens are as fake as my enthusiasm.',
  'Analyzing session management... Sessions last longer than Hollywood marriages.',
  "Scanning for information disclosure... You're an open book. A very boring one.",
  'Checking for clickjacking... Your frames are more exposed than a museum exhibit.',
  "Running authentication bypass tests... Security through obscurity isn't security.",
];

interface LoadingJokesProps {
  className?: string;
}

export const LoadingJokes: React.FC<LoadingJokesProps> = ({ className = '' }) => {
  const [currentJoke, setCurrentJoke] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);

      setTimeout(() => {
        setCurrentJoke((prev) => (prev + 1) % DARK_HUMOR_JOKES.length);
        setIsVisible(true);
      }, 300); // Fade out time
    }, 3000); // Change joke every 3 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`transition-all duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-30'
      } ${className}`}
    >
      <p className="text-gray-400 text-sm text-center max-w-md mx-auto leading-relaxed">
        {DARK_HUMOR_JOKES[currentJoke]}
      </p>
      <div className="mt-3 flex items-center justify-center gap-1">
        {DARK_HUMOR_JOKES.slice(0, Math.min(5, DARK_HUMOR_JOKES.length)).map((_, idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
              idx === currentJoke % 5 ? 'bg-blue-400' : 'bg-gray-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingJokes;
