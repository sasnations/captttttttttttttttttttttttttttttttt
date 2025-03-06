import React from 'react';
import { BarChart3, ShieldCheck, Users, CheckCircle, AlertTriangle, Settings, DollarSign } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Sample data - in a real application this would come from your backend
  const stats = [
    { name: 'Total Verifications Today', value: '154,372', icon: <ShieldCheck className="text-green-500" size={24} />, change: '+12.5%', changeType: 'positive' },
    { name: 'Bot Detection Rate', value: '7.2%', icon: <AlertTriangle className="text-yellow-500" size={24} />, change: '-0.8%', changeType: 'positive' },
    { name: 'Active Clients', value: '1,248', icon: <Users className="text-blue-500" size={24} />, change: '+3.2%', changeType: 'positive' },
    { name: 'Success Rate', value: '99.7%', icon: <CheckCircle className="text-green-500" size={24} />, change: '+0.2%', changeType: 'positive' },
  ];

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="mt-1 text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
              <div>{stat.icon}</div>
            </div>
            <div className={`mt-2 text-sm ${
              stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {stat.change} from yesterday
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow lg:col-span-2">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Verification Activity</h3>
          </div>
          <div className="p-4">
            <div className="h-64 flex items-center justify-center text-gray-500">
              <BarChart3 size={64} className="opacity-50" />
              <p className="ml-4 text-lg">Chart will be integrated here</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-4">
            <ul className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <li key={i} className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {i % 3 === 0 ? <Settings size={18} className="text-blue-500" /> : 
                     i % 3 === 1 ? <DollarSign size={18} className="text-green-500" /> : 
                     <Users size={18} className="text-purple-500" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {i % 3 === 0 ? 'New API key generated' : 
                       i % 3 === 1 ? 'Subscription upgraded to Professional' : 
                       'New client registered'}
                    </p>
                    <p className="text-xs text-gray-500">{30 - i * 5} minutes ago</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;