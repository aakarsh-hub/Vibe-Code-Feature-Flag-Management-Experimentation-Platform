import React, { useState, useEffect, useMemo } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, Legend, Cell, PieChart, Pie } from 'recharts';
import { INITIAL_FLAGS, INITIAL_LOGS } from './services/mockData';
import { FeatureFlag, Environment, AuditLog, FlagType, AIAnalysisResult, Variant } from './types';
import { Icons } from './components/Icons';
import { analyzeFlagRisk, generateFlagDescription } from './services/geminiService';

// --- Context ---
interface AppState {
  flags: FeatureFlag[];
  logs: AuditLog[];
  currentEnv: Environment;
}

const AppContext = React.createContext<{
  state: AppState;
  setEnv: (env: Environment) => void;
  addFlag: (flag: FeatureFlag) => void;
  updateFlag: (flag: FeatureFlag) => void;
  deleteFlag: (id: string) => void;
  addLog: (log: AuditLog) => void;
} | null>(null);

const useAppContext = () => {
  const context = React.useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppContext.Provider");
  return context;
};

// --- Constants ---
const VARIANT_COLORS = ['#64748b', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#14b8a6'];
const TAILWIND_VARIANT_BG = ['bg-slate-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500'];

// --- Components ---

const SidebarItem = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link 
      to={to} 
      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </Link>
  );
};

const Header = () => {
  const { state, setEnv } = useAppContext();
  
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-20">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-bold text-slate-800 tracking-tight">Vibe Code</h2>
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-indigo-100 text-indigo-700 uppercase tracking-wide">Beta</span>
      </div>
      
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg">
           {Object.values(Environment).map((env) => (
             <button 
               key={env}
               onClick={() => setEnv(env)}
               className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${state.currentEnv === env ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
             >
               {env}
             </button>
           ))}
        </div>
        
        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
          JD
        </div>
      </div>
    </header>
  );
};

const Dashboard = () => {
  const { state } = useAppContext();
  
  const stats = useMemo(() => {
    const active = state.flags.filter(f => f.isEnabled && f.environment === state.currentEnv).length;
    const total = state.flags.filter(f => f.environment === state.currentEnv).length;
    const evaluations = Math.floor(Math.random() * 500000) + 500000; // Simulated
    return { active, total, evaluations };
  }, [state.flags, state.currentEnv]);

  const chartData = useMemo(() => {
     return Array.from({ length: 12 }, (_, i) => ({
       time: `${i * 2}:00`,
       requests: Math.floor(Math.random() * 5000) + 1000,
       errors: Math.floor(Math.random() * 50)
     }));
  }, []);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Active Flags</h3>
             <Icons.Flag className="w-5 h-5 text-indigo-500" />
           </div>
           <p className="text-3xl font-bold text-slate-900">{stats.active} <span className="text-slate-400 text-lg font-normal">/ {stats.total}</span></p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Total Evaluations (24h)</h3>
             <Icons.Activity className="w-5 h-5 text-green-500" />
           </div>
           <p className="text-3xl font-bold text-slate-900">{stats.evaluations.toLocaleString()}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider">Environment</h3>
             <Icons.Settings className="w-5 h-5 text-purple-500" />
           </div>
           <p className="text-3xl font-bold text-slate-900">{state.currentEnv}</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">Traffic Volume (Requests/sec)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="requests" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const FlagList = () => {
  const { state, updateFlag, setEnv } = useAppContext();
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();

  const filteredFlags = state.flags.filter(f => 
    f.environment === state.currentEnv && 
    (f.name.toLowerCase().includes(filter.toLowerCase()) || f.key.includes(filter.toLowerCase()))
  );

  const toggleFlag = (flag: FeatureFlag, e: React.MouseEvent) => {
    e.stopPropagation();
    updateFlag({
      ...flag,
      isEnabled: !flag.isEnabled,
      lastUpdated: new Date().toISOString()
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">Feature Flags</h1>
           <p className="text-slate-500 mt-1">Manage rollouts in {state.currentEnv}</p>
        </div>
        <button 
          onClick={() => navigate('/flags/new')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg flex items-center space-x-2 font-medium shadow-sm transition-colors"
        >
          <Icons.Plus className="w-5 h-5" />
          <span>Create Flag</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-200">
           <div className="relative">
             <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
             <input 
               type="text" 
               placeholder="Search flags..." 
               className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
             />
           </div>
        </div>
        
        <div className="overflow-y-auto flex-1">
          {filteredFlags.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400">
               <Icons.Flag className="w-12 h-12 mb-4 opacity-20" />
               <p>No flags found in {state.currentEnv}</p>
             </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Flag Details</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rollout</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFlags.map(flag => (
                  <tr 
                    key={flag.id} 
                    onClick={() => navigate(`/flags/${flag.id}`)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <button 
                        onClick={(e) => toggleFlag(flag, e)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${flag.isEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{flag.name}</div>
                      <div className="text-sm text-slate-500 font-mono mt-0.5">{flag.key}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        {flag.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-green-500" style={{ width: `${flag.rolloutPercentage}%` }} />
                        </div>
                        <span className="text-xs text-slate-500">{flag.rolloutPercentage}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {new Date(flag.lastUpdated).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateFlag = () => {
    const { addFlag, state } = useAppContext();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [key, setKey] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAutoGenerate = async () => {
        setLoading(true);
        const desc = await generateFlagDescription(name);
        if (desc) setDescription(desc);
        if (!key && name) {
            setKey(name.toLowerCase().replace(/[^a-z0-9]/g, '-'));
        }
        setLoading(false);
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newFlag: FeatureFlag = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            key,
            description,
            type: FlagType.BOOLEAN,
            isEnabled: false,
            rolloutPercentage: 0,
            environment: state.currentEnv,
            variants: [],
            rules: [],
            lastUpdated: new Date().toISOString(),
            owner: 'Current User'
        };
        addFlag(newFlag);
        navigate(`/flags/${newFlag.id}`);
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-slate-900 mb-8">Create New Feature Flag</h1>
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <div className="flex gap-2">
                        <input 
                            required
                            type="text" 
                            className="flex-1 px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., New Dashboard Layout"
                        />
                        <button 
                            type="button"
                            onClick={handleAutoGenerate}
                            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center gap-2"
                            disabled={loading}
                        >
                            <Icons.Sparkles className="w-4 h-4" />
                            {loading ? 'Thinking...' : 'AI Assist'}
                        </button>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Key</label>
                    <input 
                        required
                        type="text" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        placeholder="new-dashboard-layout"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        rows={3}
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                </div>
                <div className="pt-4 flex gap-4">
                    <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700">Create Flag</button>
                    <button type="button" onClick={() => navigate('/flags')} className="px-6 py-2.5 text-slate-600 font-medium hover:text-slate-900">Cancel</button>
                </div>
            </form>
        </div>
    )
}

const FlagDetail = () => {
  const { id } = useParams();
  const { state, updateFlag } = useAppContext();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'targeting' | 'variants' | 'insights'>('targeting');
  const [riskData, setRiskData] = useState<AIAnalysisResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Local state for variant editing
  const [localVariants, setLocalVariants] = useState<Variant[]>([]);

  const flag = state.flags.find(f => f.id === id);

  useEffect(() => {
    if (flag) {
        setLocalVariants(flag.variants || []);
    }
  }, [flag]);

  if (!flag) return <div>Flag not found</div>;

  const handleSave = (updates: Partial<FeatureFlag>) => {
    updateFlag({ ...flag, ...updates, lastUpdated: new Date().toISOString() });
  };

  const handleVariantsSave = () => {
      handleSave({ variants: localVariants });
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    const result = await analyzeFlagRisk(flag);
    setRiskData(result);
    setAnalyzing(false);
  };

  // Helper to generate chart data for experiments
  const experimentData = flag.type === FlagType.MULTIVARIATE && flag.variants.length > 0
    ? flag.variants.map((v, i) => ({
        name: v.name,
        conversionRate: Math.floor(Math.random() * 25) + 5, // Mock conversion data
        conversions: Math.floor(Math.random() * 500) + 100,
        impressions: Math.floor(Math.random() * 5000) + 1000,
        fill: VARIANT_COLORS[i % VARIANT_COLORS.length]
    }))
    : [];

  const handleConvertToMultivariate = () => {
      const newVariants = [
          { id: 'control', name: 'Control', key: 'control', weight: 50 },
          { id: 'treatment', name: 'Treatment', key: 'treatment', weight: 50 }
      ];
      setLocalVariants(newVariants);
      updateFlag({
          ...flag,
          type: FlagType.MULTIVARIATE,
          variants: newVariants,
          lastUpdated: new Date().toISOString()
      });
      setActiveTab('variants');
  };

  const updateVariant = (idx: number, field: keyof Variant, value: any) => {
      const updated = [...localVariants];
      updated[idx] = { ...updated[idx], [field]: value };
      setLocalVariants(updated);
  };

  const addVariant = () => {
      // Generate unique key/name to prevent collisions with existing variants
      let counter = 1;
      let candidateKey = `treatment-${counter}`;
      let candidateName = `Treatment ${String.fromCharCode(64 + counter)}`; // Starts at A

      while (localVariants.some(v => v.key === candidateKey || v.name === candidateName)) {
          counter++;
          candidateKey = `treatment-${counter}`;
          candidateName = `Treatment ${String.fromCharCode(64 + counter)}`;
      }

      const newV = { 
          id: Math.random().toString(36).substr(2, 9), 
          name: candidateName, 
          key: candidateKey, 
          weight: 25 
      };
      setLocalVariants([...localVariants, newV]);
  };

  const removeVariant = (idx: number) => {
      const updated = [...localVariants];
      updated.splice(idx, 1);
      setLocalVariants(updated);
  };

  const distributeEvenly = () => {
      const count = localVariants.length;
      if (count === 0) return;
      const baseWeight = Math.floor(100 / count);
      const remainder = 100 - (baseWeight * count);
      
      const distributed = localVariants.map((v, i) => ({
          ...v,
          weight: i === 0 ? baseWeight + remainder : baseWeight
      }));
      setLocalVariants(distributed);
      handleSave({ variants: distributed });
  };

  // Validation Logic
  const totalWeight = localVariants.reduce((sum, v) => sum + (parseInt(v.weight as any) || 0), 0);
  const isWeightValid = totalWeight === 100;
  const areKeysUnique = new Set(localVariants.map(v => v.key)).size === localVariants.length;
  const areFieldsFilled = localVariants.every(v => v.name.trim() && v.key.trim());
  
  const canSave = isWeightValid && areKeysUnique && areFieldsFilled;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-slate-900">{flag.name}</h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${flag.isEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
              {flag.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-slate-500 font-mono text-sm">{flag.key}</p>
        </div>
        <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-sm font-medium text-slate-600">Toggle:</span>
                <button 
                    onClick={() => handleSave({ isEnabled: !flag.isEnabled })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${flag.isEnabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${flag.isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
            </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-8">
          {['targeting', 'variants', 'insights'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors capitalize ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {activeTab === 'targeting' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-900">Default Rule</h3>
                    <span className="text-xs text-slate-500">Applies to all users not matching other rules</span>
                </div>
                <div className="p-6 space-y-6">
                    <div>
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Rollout Percentage</label>
                            <span className="text-sm font-bold text-indigo-600">{flag.rolloutPercentage}%</span>
                        </div>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={flag.rolloutPercentage}
                            onChange={(e) => handleSave({ rolloutPercentage: parseInt(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                         <div className="mt-2 text-xs text-slate-500 flex justify-between">
                            <span>0% (Off)</span>
                            <span>{flag.type === FlagType.MULTIVARIATE ? 'Experiment Population' : '50%'}</span>
                            <span>100% (Full Rollout)</span>
                        </div>
                        {flag.type === FlagType.MULTIVARIATE && (
                            <p className="text-xs text-slate-500 mt-2 bg-blue-50 text-blue-700 p-2 rounded border border-blue-100">
                                <span className="font-semibold">Note:</span> This controls the percentage of users who enter the experiment. Once inside, they are split according to variant weights.
                            </p>
                        )}
                    </div>
                </div>
                
                <div className="p-6 border-t border-slate-200 bg-slate-50">
                    <h4 className="text-sm font-semibold text-slate-900 mb-4">Targeting Rules</h4>
                    {flag.rules.map((rule, idx) => (
                        <div key={rule.id} className="bg-white p-4 rounded-lg border border-slate-200 mb-3 flex items-center justify-between">
                            <div className="text-sm">
                                <span className="font-mono text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">{rule.attribute}</span>
                                <span className="mx-2 text-slate-400">{rule.operator}</span>
                                <span className="font-medium text-slate-800">{rule.values.join(', ')}</span>
                            </div>
                            <button className="text-slate-400 hover:text-red-500">Delete</button>
                        </div>
                    ))}
                    <button className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 font-medium text-sm hover:border-indigo-400 hover:text-indigo-600 transition-colors">
                        + Add Rule
                    </button>
                </div>
            </div>
          )}

          {activeTab === 'variants' && (
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                     <h3 className="font-semibold text-slate-900">Multivariate Configurations</h3>
                     {flag.type === FlagType.MULTIVARIATE && (
                        <div className="flex space-x-2">
                             <button 
                                onClick={distributeEvenly}
                                className="text-xs font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded transition-colors"
                             >
                                Distribute Evenly
                             </button>
                        </div>
                     )}
                </div>

                {flag.type === FlagType.BOOLEAN ? (
                    <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                        <Icons.Activity className="w-10 h-10 mx-auto text-slate-400 mb-3" />
                        <p className="font-medium text-slate-900">Standard Feature Flag</p>
                        <p className="text-sm text-slate-500 mb-6 max-w-xs mx-auto">Convert this flag to run A/B tests with multiple variants and traffic splitting.</p>
                        <button 
                            onClick={handleConvertToMultivariate}
                            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 shadow-sm"
                        >
                            Start A/B Experiment
                        </button>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Traffic Visualizer */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-slate-500 mb-1">
                                <span>Traffic Allocation</span>
                                <div className="flex items-center space-x-2">
                                    {!isWeightValid && <span className="text-red-600 font-bold">Total must be 100%</span>}
                                    <span className={isWeightValid ? 'text-green-600' : 'text-red-600'}>Current: {totalWeight}%</span>
                                </div>
                            </div>
                            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex relative">
                                {localVariants.map((v, i) => (
                                    <div 
                                        key={v.id} 
                                        style={{ width: `${v.weight}%` }} 
                                        className={`${TAILWIND_VARIANT_BG[i % TAILWIND_VARIANT_BG.length]} transition-all duration-300`}
                                        title={`${v.name}: ${v.weight}%`}
                                    />
                                ))}
                                {totalWeight < 100 && (
                                    <div className="bg-stripes-slate opacity-20 flex-1" style={{width: `${100 - totalWeight}%`}} />
                                )}
                            </div>
                        </div>

                        {/* Variants List */}
                        <div className="space-y-4">
                            {localVariants.map((v, i) => (
                                <div key={v.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-slate-300 transition-colors">
                                    <div className={`w-2 h-2 rounded-full mt-3 flex-shrink-0 ${TAILWIND_VARIANT_BG[i % TAILWIND_VARIANT_BG.length]}`} />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-slate-400">Name</label>
                                                <input 
                                                    type="text" 
                                                    value={v.name} 
                                                    onChange={(e) => updateVariant(i, 'name', e.target.value)}
                                                    className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
                                                    placeholder="Variant Name"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="text-[10px] uppercase font-bold text-slate-400">Key</label>
                                                <input 
                                                    type="text" 
                                                    value={v.key} 
                                                    onChange={(e) => updateVariant(i, 'key', e.target.value)}
                                                    className={`w-full px-2 py-1.5 border rounded text-sm font-mono text-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none ${
                                                        localVariants.filter(x => x.key === v.key).length > 1 ? 'border-red-300 bg-red-50' : 'border-slate-200'
                                                    }`}
                                                    placeholder="key_value"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-24">
                                        <label className="text-[10px] uppercase font-bold text-slate-400">Weight %</label>
                                        <div className="relative">
                                            <input 
                                                type="number" 
                                                min="0"
                                                max="100"
                                                value={v.weight} 
                                                onChange={(e) => updateVariant(i, 'weight', parseInt(e.target.value) || 0)}
                                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" 
                                            />
                                            <span className="absolute right-3 top-1.5 text-slate-400 text-sm">%</span>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeVariant(i)}
                                        disabled={localVariants.length <= 2}
                                        className="mt-5 p-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 disabled:hover:text-slate-400"
                                    >
                                        <Icons.Plus className="w-5 h-5 rotate-45" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Error Messages Summary */}
                        {!canSave && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                                <p className="font-bold mb-1">Cannot save changes:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                    {!isWeightValid && <li>Total traffic weight must equal 100%.</li>}
                                    {!areKeysUnique && <li>All variant keys must be unique.</li>}
                                    {!areFieldsFilled && <li>All names and keys must be filled out.</li>}
                                </ul>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-between pt-4 border-t border-slate-100">
                             <button 
                                onClick={addVariant}
                                className="flex items-center space-x-2 text-indigo-600 font-medium text-sm hover:text-indigo-800"
                             >
                                <Icons.Plus className="w-4 h-4" />
                                <span>Add Variant</span>
                             </button>

                             <button 
                                onClick={handleVariantsSave}
                                disabled={!canSave}
                                className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                             >
                                Save Changes
                             </button>
                        </div>
                    </div>
                )}
             </div>
          )}
          
          {activeTab === 'insights' && (
             <div className="space-y-6">
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                            <Icons.Sparkles className="w-5 h-5" /> AI Risk Analysis
                        </h3>
                        <p className="text-indigo-100 mb-6 max-w-lg">
                            Use Gemini to analyze your configuration for safety risks, conflicting rules, and rollout anomalies.
                        </p>
                        <button 
                            onClick={runAnalysis}
                            disabled={analyzing}
                            className="px-5 py-2 bg-white text-indigo-700 rounded-lg font-semibold hover:bg-indigo-50 transition-colors shadow-sm disabled:opacity-70"
                        >
                            {analyzing ? 'Analyzing...' : 'Run Safety Check'}
                        </button>
                    </div>
                    {/* Decorative bg elements */}
                    <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                </div>

                {riskData && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h4 className="font-semibold text-slate-900">Analysis Results</h4>
                            <div className={`px-3 py-1 rounded-full text-sm font-bold ${riskData.riskScore < 30 ? 'bg-green-100 text-green-700' : riskData.riskScore < 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                Risk Score: {riskData.riskScore}/100
                            </div>
                        </div>
                        <p className="text-slate-700 mb-6">{riskData.summary}</p>
                        
                        <h5 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-3">Suggestions</h5>
                        <ul className="space-y-3">
                            {riskData.suggestions.map((s, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                    <Icons.Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                                    <span>{s}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {flag.type === FlagType.MULTIVARIATE ? (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-semibold text-slate-900 mb-6">Experiment Results</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={experimentData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                                        <YAxis axisLine={false} tickLine={false} fontSize={12} />
                                        <Tooltip 
                                            cursor={{fill: 'transparent'}}
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                        />
                                        <Bar dataKey="conversionRate" radius={[4, 4, 0, 0]}>
                                            {experimentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.fill} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <p className="text-center text-xs text-slate-500 mt-2">Conversion Rate (%)</p>
                             </div>
                             
                             <div className="flex flex-col justify-center space-y-4">
                                {experimentData.map((v, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: v.fill}}></div>
                                            <div>
                                                <p className="font-medium text-sm text-slate-900">{v.name}</p>
                                                <p className="text-xs text-slate-500">{v.impressions.toLocaleString()} users</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-slate-900">{v.conversionRate}%</p>
                                            {i > 0 && (
                                                <p className={`text-xs font-medium ${v.conversionRate > experimentData[0].conversionRate ? 'text-green-600' : 'text-slate-400'}`}>
                                                    {v.conversionRate > experimentData[0].conversionRate ? `+${v.conversionRate - experimentData[0].conversionRate}%` : 'No Lift'}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                             </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <h3 className="font-semibold text-slate-900 mb-4">Live Performance</h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[{name: 'Enabled', value: 400}, {name: 'Disabled', value: 300}]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
             </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Metadata</h3>
             <dl className="space-y-3 text-sm">
               <div className="flex justify-between">
                 <dt className="text-slate-500">Owner</dt>
                 <dd className="font-medium text-slate-900">{flag.owner}</dd>
               </div>
               <div className="flex justify-between">
                 <dt className="text-slate-500">Created</dt>
                 <dd className="font-medium text-slate-900">2 days ago</dd>
               </div>
               <div className="flex justify-between">
                 <dt className="text-slate-500">Key</dt>
                 <dd className="font-mono text-slate-900 bg-slate-100 px-1 rounded">{flag.key}</dd>
               </div>
               <div className="flex justify-between">
                 <dt className="text-slate-500">Type</dt>
                 <dd className="font-medium text-slate-900">{flag.type}</dd>
               </div>
             </dl>
           </div>
           
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">SDK Implementation</h3>
             <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
               <pre className="text-xs text-indigo-300 font-mono">
{flag.type === FlagType.BOOLEAN ? `// Boolean Flag
const { isEnabled } = useFlag('${flag.key}');

if (isEnabled) {
  return <NewFeature />;
}` : `// Multivariate Flag
const { variant } = useVariant('${flag.key}');

switch(variant.key) {
  case 'control': return <OldCheckout />;
  case 'treatment': return <NewCheckout />;
  default: return <OldCheckout />;
}`}
               </pre>
             </div>
           </div>
           
           <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
             <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">Audit History</h3>
             <ul className="space-y-4">
               {[1,2].map(i => (
                 <li key={i} className="flex gap-3 text-sm">
                    <div className="w-2 h-2 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                    <div>
                        <p className="text-slate-900 font-medium">Updated rollout to {flag.rolloutPercentage}%</p>
                        <p className="text-slate-400 text-xs">2 hours ago by Sarah</p>
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

const AuditLogs = () => {
    const { state } = useAppContext();
    return (
        <div className="p-8 max-w-7xl mx-auto">
             <h1 className="text-2xl font-bold text-slate-900 mb-8">Audit Logs</h1>
             <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Flag</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Actor</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Environment</th>
                            <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {state.logs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 font-medium text-slate-900">{log.action}</td>
                                <td className="px-6 py-4 text-sm font-mono text-indigo-600">{log.flagKey}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{log.actor}</td>
                                <td className="px-6 py-4 text-sm text-slate-600">{log.environment}</td>
                                <td className="px-6 py-4 text-sm text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    )
}

const App = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>(INITIAL_FLAGS);
  const [logs, setLogs] = useState<AuditLog[]>(INITIAL_LOGS);
  const [currentEnv, setCurrentEnv] = useState<Environment>(Environment.PRODUCTION);

  const contextValue = {
    state: { flags, logs, currentEnv },
    setEnv: setCurrentEnv,
    addFlag: (flag: FeatureFlag) => {
        setFlags([...flags, flag]);
        setLogs(prev => [{
            id: Date.now().toString(),
            action: 'Created Flag',
            flagKey: flag.key,
            actor: 'Current User',
            timestamp: new Date().toISOString(),
            environment: currentEnv
        }, ...prev]);
    },
    updateFlag: (updatedFlag: FeatureFlag) => {
        setFlags(flags.map(f => f.id === updatedFlag.id ? updatedFlag : f));
        // Add log
        setLogs(prev => [{
            id: Date.now().toString(),
            action: 'Updated Configuration',
            flagKey: updatedFlag.key,
            actor: 'Current User',
            timestamp: new Date().toISOString(),
            environment: currentEnv
        }, ...prev]);
    },
    deleteFlag: (id: string) => setFlags(flags.filter(f => f.id !== id)),
    addLog: (log: AuditLog) => setLogs([log, ...logs])
  };

  return (
    <AppContext.Provider value={contextValue}>
      <HashRouter>
        <div className="flex min-h-screen bg-slate-50">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-30">
            <div className="h-16 flex items-center px-6 border-b border-slate-800">
               <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-lg mr-3">V</div>
               <span className="font-bold text-lg tracking-tight">Vibe Code</span>
            </div>
            
            <nav className="flex-1 p-4 space-y-1">
              <SidebarItem to="/" icon={Icons.Activity} label="Dashboard" />
              <SidebarItem to="/flags" icon={Icons.Flag} label="Feature Flags" />
              <SidebarItem to="/audit" icon={Icons.List} label="Audit Logs" />
              <SidebarItem to="/users" icon={Icons.Users} label="Users & Segments" />
              <SidebarItem to="/settings" icon={Icons.Settings} label="Settings" />
            </nav>
            
            <div className="p-4 border-t border-slate-800">
              <div className="bg-slate-800 rounded-lg p-3">
                <p className="text-xs text-slate-400 uppercase font-bold mb-1">SDK Key</p>
                <div className="flex items-center justify-between">
                   <code className="text-xs text-indigo-400 font-mono">sdk-prod-82...</code>
                   <button className="text-slate-400 hover:text-white"><Icons.Settings className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 ml-64 flex flex-col">
            <Header />
            <div className="flex-1 overflow-auto">
               <Routes>
                 <Route path="/" element={<Dashboard />} />
                 <Route path="/flags" element={<FlagList />} />
                 <Route path="/flags/new" element={<CreateFlag />} />
                 <Route path="/flags/:id" element={<FlagDetail />} />
                 <Route path="/audit" element={<AuditLogs />} />
                 <Route path="*" element={<Dashboard />} />
               </Routes>
            </div>
          </main>
        </div>
      </HashRouter>
    </AppContext.Provider>
  );
};

export default App;