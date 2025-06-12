import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";

export default function ContextTest() {
  try {
    const auth = useAuth();
    const theme = useTheme();
    const language = useLanguage();

    return (
      <div className="p-4 bg-darkGray text-coolWhite">
        <h1 className="text-xl font-bold mb-4">Context Test</h1>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Auth Context:</h2>
          <p>IsAuthenticated: {auth.isAuthenticated ? 'Yes' : 'No'}</p>
          <p>Loading: {auth.loading ? 'Yes' : 'No'}</p>
          {auth.user && <p>Username: {auth.user.username}</p>}
        </div>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Theme Context:</h2>
          <p>Current Theme: {theme.theme}</p>
          <button 
            onClick={theme.toggleTheme}
            className="px-4 py-2 bg-coolWhite text-jetBlack hover:bg-crimsonRed hover:text-coolWhite mt-2"
          >
            Toggle Theme
          </button>
        </div>
        
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Language Context:</h2>
          <p>Current Language: {language.language}</p>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 bg-crimsonRed text-coolWhite">
        <h1 className="text-xl font-bold mb-4">Context Error</h1>
        <p>{(error as Error).message}</p>
      </div>
    );
  }
}