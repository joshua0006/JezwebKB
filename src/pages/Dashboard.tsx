import React from 'react';
import { useLocation } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { TutorialList } from '../components/dashboard/TutorialList';
import { TagsManager } from '../components/dashboard/TagsManager';
import { CategoriesManager } from '../components/dashboard/CategoriesManager';
import { UsersManager } from '../components/dashboard/UsersManager';

export function Dashboard() {
  const location = useLocation();
  const path = location.pathname.split('/').pop();

  const renderContent = () => {
    switch (path) {
      case 'tags':
        return <TagsManager />;
      case 'categories':
        return <CategoriesManager />;
      case 'users':
        return <UsersManager />;
      default:
        return <TutorialList />;
    }
  };

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
}