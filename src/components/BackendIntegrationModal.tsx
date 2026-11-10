import React, { useState } from 'react';
import { X, Check, Copy, Code2, Link, Server, Sparkles, ExternalLink } from 'lucide-react';
import {
  BackendEndpointConfig,
  getBackendConfig,
  saveBackendConfig,
} from '../services/carparkService';

interface BackendIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyConfig: (config: BackendEndpointConfig) => void;
}

export const BackendIntegrationModal: React.FC<BackendIntegrationModalProps> = ({
  isOpen,
  onClose,
  onApplyConfig,
}) => {
  const [config, setConfig] = useState<BackendEndpointConfig>(getBackendConfig());
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'config'>('overview');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(id);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const handleSaveAndApply = () => {
    saveBackendConfig(config);
    onApplyConfig(config);
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Pinging backend endpoint...');
    try {
      const res = await fetch(config.endpointUrl, {
        method: 'GET',
        headers: config.apiKey ? { 'AccountKey': config.apiKey } : undefined,
      });
      if (res.ok) {
        setTestStatus('success');
        setTestMessage(`Successfully reached endpoint (${res.status} OK). Ready for lot stream!`);
      } else {
        setTestStatus('error');
        setTestMessage(`Received HTTP status ${res.status}. Check CORS and API keys.`);
      }
    } catch (err: unknown) {
      setTestStatus('error');
      setTestMessage(
        `Connection failed: ${err instanceof Error ? err.message : 'Network error / CORS restrictions'}`
      );
    }
  };

  const sampleJsonSchema = `{
  "items": [
    {
      "carpark_number": "ACB",
      "carpark_info": [
        {
          "total_lots": "480",
          "lot_type": "C", // C = Car, M = Motorcycle, H = Heavy
          "lots_available": "64"
        }
      ],
      "update_datetime": "2026-11-09T19:35:00"
    }
  ]
}`;

  const expressBackendCode = `// Example Express / Node.js backend proxy for data.gov.sg or LTA DataMall
import express from 'express';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 5000;

app.get('/api/carparks/availability', async (req, res) => {
  try {
    // 1. Fetch live Singapore Carpark Availability from data.gov.sg
    const response = await axios.get(
      'https://api.data.gov.sg/v1/transport/carpark-availability'
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch Singapore carpark stream' });
  }
});

app.listen(PORT, () => console.log(\`Proxy service running on port \${PORT}\`));`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-slate-100 rounded-lg text-slate-800">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Backend Services & Live Integration Hub
              </h3>
              <p className="text-xs text-slate-500">
                Frontend is fully decoupled and ready for your Singapore live lot APIs
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-slate-100 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Official APIs
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'schema'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            JSON Contract & Sample Proxy
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'config'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Configure Live Endpoint
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600 flex-1">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-900 text-sm mb-1.5">
                  How this frontend interacts with Singapore APIs
                </h4>
                <p className="leading-relaxed">
                  The frontend maintains a clean service layer (<code>/src/services/carparkService.ts</code>)
                  with real Singapore coordinates and live occupancy models. When you are ready to integrate
                  your backend, point the service to your API proxy or directly to public Singapore endpoints.
                </p>
              </div>

              <div>
                <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-2">
                  Official Singapore Government Carpark APIs
                </h5>
                <div className="space-y-2">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">data.gov.sg Carpark Availability API v1</div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        api.data.gov.sg/v1/transport/carpark-availability
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Covers all HDB & URA electronic parking carparks (updates every 1 minute).
                      </div>
                    </div>
                    <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      No Auth Required
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900">LTA DataMall Carpark Availability API v2</div>
                      <div className="text-slate-500 font-mono text-[11px]">
                        datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Covers major shopping malls (Orchard, Marina Bay, Suntec, VivoCity, Jurong).
                      </div>
                    </div>
                    <span className="text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                      Requires LTA API Key
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <h5 className="font-bold text-slate-800">Standard Gov.sg Response Format</h5>
                  <button
                    onClick={() => handleCopy(sampleJsonSchema, 'schema')}
                    className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {copiedTab === 'schema' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedTab === 'schema' ? 'Copied' : 'Copy Schema'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {sampleJsonSchema}
                </pre>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <h5 className="font-bold text-slate-800">Node/Express Proxy Blueprint</h5>
                  <button
                    onClick={() => handleCopy(expressBackendCode, 'code')}
                    className="flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 cursor-pointer"
                  >
                    {copiedTab === 'code' ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedTab === 'code' ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto">
                  {expressBackendCode}
                </pre>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  API Endpoint URL
                </label>
                <input
                  type="text"
                  value={config.endpointUrl}
                  onChange={(e) => setConfig({ ...config, endpointUrl: e.target.value })}
                  placeholder="e.g. https://your-server.com/api/carparks or https://api.data.gov.sg/..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Optional API Header / Token (AccountKey)
                </label>
                <input
                  type="password"
                  value={config.apiKey || ''}
                  onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  placeholder="Optional token for LTA DataMall or internal backend"
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Auto-Refresh Polling Interval
                </label>
                <select
                  value={config.autoRefreshIntervalSecs}
                  onChange={(e) =>
                    setConfig({ ...config, autoRefreshIntervalSecs: Number(e.target.value) })
                  }
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-xs"
                >
                  <option value={10}>Every 10 seconds (High frequency)</option>
                  <option value={15}>Every 15 seconds (Recommended)</option>
                  <option value={30}>Every 30 seconds</option>
                  <option value={60}>Every 60 seconds (Gov.sg sync cadence)</option>
                  <option value={0}>Manual refresh only</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-medium transition-colors cursor-pointer"
                >
                  {testStatus === 'testing' ? 'Testing Connection...' : 'Test Endpoint Connection'}
                </button>
                {testMessage && (
                  <div
                    className={`mt-2 p-2 rounded-lg text-xs font-medium ${
                      testStatus === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {testMessage}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Current Mode: <strong className="text-slate-800">Frontend Simulation + Ready for Backend Hooks</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
