
import { Button } from "../components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center max-w-md mx-auto p-8">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Page introuvable</p>
        <p className="text-gray-500 mb-8">La page que vous recherchez n'existe pas.</p>
        <Button 
          onClick={() => window.location.href = '/'}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2"
        >
          Retour à l'accueil
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
