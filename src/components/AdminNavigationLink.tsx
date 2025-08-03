
import React from 'react';
import { Link } from 'react-router-dom';
import { Settings, Bird } from 'lucide-react';
import { Button } from './ui/button';

const AdminNavigationLink: React.FC = () => {
  return (
    <div className="flex space-x-2">
      <Link to="/admin/marches">
        <Button variant="outline" className="flex items-center space-x-2">
          <Settings className="h-4 w-4" />
          <span>Admin Marches</span>
        </Button>
      </Link>
      <Link to="/test-ebird">
        <Button variant="outline" className="flex items-center space-x-2">
          <Bird className="h-4 w-4" />
          <span>Test eBird</span>
        </Button>
      </Link>
    </div>
  );
};

export default AdminNavigationLink;
