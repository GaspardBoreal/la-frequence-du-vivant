import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import ApiMcpGrid from '@/components/api-mcp/ApiMcpGrid';

const ApiMcpPublic: React.FC = () => {
  useEffect(() => {
    document.title = 'API & MCP · L\'écosystème vivant — La Fréquence du Vivant';
    const meta = document.querySelector('meta[name="description"]');
    const desc = 'Découvrez chacune des API et intégrations MCP qui font vivre l\'application : biodiversité, territoire, IA et infrastructure.';
    if (meta) meta.setAttribute('content', desc);
    else {
      const m = document.createElement('meta');
      m.name = 'description';
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="relative">
      <Link
        to="/"
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/20 text-xs text-emerald-200 backdrop-blur hover:bg-emerald-900"
      >
        <ArrowLeft className="w-3 h-3" />
        Retour
      </Link>
      <ApiMcpGrid />
    </div>
  );
};

export default ApiMcpPublic;
