import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, Bell, FileText, Wrench } from 'lucide-react';

export function AdminLayout() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Admin Sidebar */}
      <div className="w-64 bg-indigo-800 text-white min-h-screen flex flex-col">
        <div className="p-4 border-b border-indigo-700">
          <h2 className="text-xl font-semibold">Admin Panel</h2>
        </div>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            <li>
              <NavLink 
                to="/admin" 
                end
                className={({ isActive }) => 
                  `flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-700 ${isActive ? 'bg-indigo-700 font-medium' : ''}`
                }
              >
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </NavLink>
            </li>
            
            <li>
              <NavLink 
                to="/admin/articles" 
                className={({ isActive }) => 
                  `flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-700 ${isActive ? 'bg-indigo-700 font-medium' : ''}`
                }
              >
                <FileText className="w-5 h-5" />
                Articles
              </NavLink>
            </li>
            
            <li>
              <NavLink 
                to="/admin/users" 
                className={({ isActive }) => 
                  `flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-700 ${isActive ? 'bg-indigo-700 font-medium' : ''}`
                }
              >
                <Users className="w-5 h-5" />
                Users
              </NavLink>
            </li>
            
            <li>
              <NavLink 
                to="/admin/notifications" 
                className={({ isActive }) => 
                  `flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-700 ${isActive ? 'bg-indigo-700 font-medium' : ''}`
                }
              >
                <Bell className="w-5 h-5" />
                Notifications
              </NavLink>
            </li>
            
            <li>
              <NavLink 
                to="/admin/tools" 
                className={({ isActive }) => 
                  `flex items-center gap-2 p-2 rounded-lg hover:bg-indigo-700 ${isActive ? 'bg-indigo-700 font-medium' : ''}`
                }
              >
                <Wrench className="w-5 h-5" />
                Tools
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
} 