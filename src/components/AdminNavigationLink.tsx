
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Button } from './ui/button';

const AdminNavigationLink: React.FC = () => {
  return (
    <Link to="/admin/marches">
      <Button variant="outline" className="flex items-center space-x-2">
        <Settings className="h-4 w-4" />
        <span>Admin Marches</span>
      </Button>
    </Link>
  );
};

export default AdminNavigationLink;
