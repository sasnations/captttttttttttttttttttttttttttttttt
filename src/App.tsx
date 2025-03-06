import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Shield, BarChart3, Settings, Users, Tag, Layout, FileText, AlertCircle, Upload } from 'lucide-react';
import AdminPanel from './components/AdminPanel';
import Dashboard from './components/Dashboard';
import CaptchaManager from './components/CaptchaManager';
import Key from './components/Key';
import PieChart from './components/PieChart';
import Login from './components/Login';
import Register from './components/Register';
import ClientSettings from './components/ClientSettings';
import ApiIntegration from './components/ApiIntegration';
import Analytics from './components/Analytics';
import CaptchaDemo from './components/CaptchaDemo';
import ChallengeCreator from './components/ChallengeCreator';
import ChallengeUploader from './components/ChallengeUploader';
import CustomerDashboard from './components/CustomerDashboard';
import { getCurrentUser, signOut } from './lib/supabase';

// Types
export type CaptchaCategory = {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'testing';
  created_at: string;
  updated_at: string;
};

export type Captcha = {
  id: string;
  name: string;
  category_id: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'active' | 'inactive' | 'testing';
  success_rate: number;
  bot_detection_rate: number;
  created_at: string;
  updated_at: string;
  captcha_categories?: {
    name: string;
  };
};

export type NavigationItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
};

export type ClientSettings = {
  id?: string;
  client_id: string;
  risk_threshold: number;
  challenge_difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  preferred_captcha_types: string[];
  behavioral_analysis_enabled: boolean;
  created_at?: string;
  updated_at?: string;
};

function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'customer'>('admin'); // Default is admin for demo purposes
  const location = useLocation();

  useEffect(() => {
    async function loadUser() {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    }

    loadUser();

    // Set up an event listener for authentication state changes
    window.addEventListener('auth-state-change', () => {
      loadUser();
    });

    return () => {
      window.removeEventListener('auth-state-change', loadUser);
    };
  }, []);

  const adminNavigation: NavigationItem[] = [
    { name: 'Dashboard', icon: <BarChart3 size={20} />, path: '/dashboard' },
    { name: 'CAPTCHA Manager', icon: <Shield size={20} />, path: '/captcha-manager' },
    { name: 'Challenge Creator', icon: <Layout size={20} />, path: '/challenge-creator' },
    { name: 'Challenge Content', icon: <Upload size={20} />, path: '/challenge-content' },
    { name: 'Categories', icon: <Tag size={20} />, path: '/categories' },
    { name: 'Clients', icon: <Users size={20} />, path: '/clients' },
    { name: 'API Integration', icon: <Key size={20} />, path: '/api-integration' },
    { name: 'Analytics', icon: <PieChart size={20} />, path: '/analytics' },
    { name: 'Demo', icon: <Layout size={20} />, path: '/demo' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' }
  ];

  const customerNavigation: NavigationItem[] = [
    { name: 'Dashboard', icon: <BarChart3 size={20} />, path: '/customer-dashboard' },
    { name: 'Demo', icon: <Layout size={20} />, path: '/demo' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/settings' }
  ];

  const toggleUserRole = () => {
    setUserRole(userRole === 'admin' ? 'customer' : 'admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />
      <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
      
      {user ? (
        <>
          {/* Admin Routes */}
          <Route path="/dashboard" element={<AppLayout navigation={adminNavigation} currentPath="/dashboard" userRole={userRole} toggleUserRole={toggleUserRole}><Dashboard /></AppLayout>} />
          <Route path="/captcha-manager" element={<AppLayout navigation={adminNavigation} currentPath="/captcha-manager" userRole={userRole} toggleUserRole={toggleUserRole}><CaptchaManager /></AppLayout>} />
          <Route path="/challenge-creator" element={<AppLayout navigation={adminNavigation} currentPath="/challenge-creator" userRole={userRole} toggleUserRole={toggleUserRole}><ChallengeCreator /></AppLayout>} />
          <Route path="/challenge-content" element={<AppLayout navigation={adminNavigation} currentPath="/challenge-content" userRole={userRole} toggleUserRole={toggleUserRole}><ChallengeUploader /></AppLayout>} />
          <Route path="/categories" element={<AppLayout navigation={adminNavigation} currentPath="/categories" userRole={userRole} toggleUserRole={toggleUserRole}><AdminPanel section="categories" /></AppLayout>} />
          <Route path="/clients" element={<AppLayout navigation={adminNavigation} currentPath="/clients" userRole={userRole} toggleUserRole={toggleUserRole}><AdminPanel section="clients" /></AppLayout>} />
          <Route path="/api-integration" element={<AppLayout navigation={adminNavigation} currentPath="/api-integration" userRole={userRole} toggleUserRole={toggleUserRole}><ApiIntegration /></AppLayout>} />
          <Route path="/analytics" element={<AppLayout navigation={adminNavigation} currentPath="/analytics" userRole={userRole} toggleUserRole={toggleUserRole}><Analytics /></AppLayout>} />
          <Route path="/demo" element={<AppLayout navigation={userRole === 'admin' ? adminNavigation : customerNavigation} currentPath="/demo" userRole={userRole} toggleUserRole={toggleUserRole}><CaptchaDemo /></AppLayout>} />
          <Route path="/settings" element={<AppLayout navigation={userRole === 'admin' ? adminNavigation : customerNavigation} currentPath="/settings" userRole={userRole} toggleUserRole={toggleUserRole}><ClientSettings /></AppLayout>} />
          
          {/* Customer Routes */}
          <Route path="/customer-dashboard" element={<AppLayout navigation={customerNavigation} currentPath="/customer-dashboard" userRole={userRole} toggleUserRole={toggleUserRole}><CustomerDashboard /></AppLayout>} />
        </>
      ) : (
        <Route path="*" element={<Navigate to="/login" />} />
      )}
      
      {/* 404 Page */}
      <Route path="*" element={
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
          <div className="text-4xl font-bold text-gray-800 mb-4">404</div>
          <h1 className="text-2xl font-semibold text-gray-700 mb-2">Page not found</h1>
          <p className="text-gray-600 mb-6">The page you're looking for doesn't exist or has been moved.</p>
          <Link 
            to="/"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Go Home
          </Link>
        </div>
      } />
    </Routes>
  );
}

interface AppLayoutProps {
  children: React.ReactNode;
  navigation: NavigationItem[];
  currentPath: string;
  userRole: 'admin' | 'customer';
  toggleUserRole: () => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, navigation, currentPath, userRole, toggleUserRole }) => {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b flex items-center space-x-2">
          <Shield size={24} className="text-indigo-600" />
          <h1 className="text-xl font-bold text-gray-800">iCaptcha</h1>
        </div>
        <nav className="mt-4">
          <ul>
            {navigation.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`w-full flex items-center px-4 py-3 text-left space-x-3 ${
                    currentPath === item.path
                      ? 'bg-indigo-50 text-indigo-600 border-r-4 border-indigo-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">
              {navigation.find(item => item.path === currentPath)?.name || 'Dashboard'}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-600 mr-2">
                  Role: {userRole === 'admin' ? 'Admin' : 'Customer'}
                </span>
                <button
                  onClick={toggleUserRole}
                  className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                >
                  Switch to {userRole === 'admin' ? 'Customer' : 'Admin'} View
                </button>
              </div>
              <button
                onClick={async () => {
                  await signOut();
                  window.dispatchEvent(new Event('auth-state-change'));
                }}
                className="text-sm text-gray-600 hover:text-indigo-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
};

export default App;

export { ClientSettings };