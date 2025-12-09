import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Config, MessageConfig, State } from '../../types';
import { getConfig, setConfig, getState } from '../../core/storage';
import '../../globals.css';

function App() {
  const [config, setConfigState] = useState<Config | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [newMessageStreamers, setNewMessageStreamers] = useState('');
  const [newEnabledStreamer, setNewEnabledStreamer] = useState('');
  const [newDisabledStreamer, setNewDisabledStreamer] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const cfg = await getConfig();
    const st = await getState();
    setConfigState(cfg);
    setState(st);
  }

  async function saveConfig(newConfig: Config) {
    await setConfig(newConfig);
    setConfigState(newConfig);
  }

  function handleToggleEnabled() {
    if (!config) return;
    saveConfig({ ...config, enabled: !config.enabled });
  }

  function handleAddMessage() {
    if (!config || !newMessage.trim()) return;

    const streamers = newMessageStreamers
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const message: MessageConfig = {
      text: newMessage.trim(),
      streamers: streamers.length > 0 ? streamers : undefined,
    };

    saveConfig({
      ...config,
      messages: [...config.messages, message],
    });

    setNewMessage('');
    setNewMessageStreamers('');
  }

  function handleDeleteMessage(index: number) {
    if (!config) return;

    const newMessages = config.messages.filter((_, i) => i !== index);
    saveConfig({ ...config, messages: newMessages });
  }

  function handleFrequencyChange(hours: number) {
    if (!config) return;
    saveConfig({ ...config, defaultFrequency: hours * 3600000 });
  }

  function handleDelayRangeChange(min: number, max: number) {
    if (!config) return;
    saveConfig({ ...config, delayRange: [min, max] });
  }

  async function handleClearHistory() {
    if (!state) return;
    const newState = { ...state, lastMessageTimes: {} };
    await browser.storage.local.set({ state: newState });
    setState(newState);
  }

  function handleAddEnabledStreamer() {
    if (!config || !newEnabledStreamer.trim()) return;
    const streamer = newEnabledStreamer.trim().toLowerCase();
    if (config.enabledStreamers?.includes(streamer)) return;

    saveConfig({
      ...config,
      enabledStreamers: [...(config.enabledStreamers || []), streamer],
    });
    setNewEnabledStreamer('');
  }

  function handleRemoveEnabledStreamer(streamer: string) {
    if (!config) return;
    saveConfig({
      ...config,
      enabledStreamers: config.enabledStreamers?.filter((s) => s !== streamer),
    });
  }

  function handleAddDisabledStreamer() {
    if (!config || !newDisabledStreamer.trim()) return;
    const streamer = newDisabledStreamer.trim().toLowerCase();
    if (config.disabledStreamers?.includes(streamer)) return;

    saveConfig({
      ...config,
      disabledStreamers: [...(config.disabledStreamers || []), streamer],
    });
    setNewDisabledStreamer('');
  }

  function handleRemoveDisabledStreamer(streamer: string) {
    if (!config) return;
    saveConfig({
      ...config,
      disabledStreamers: config.disabledStreamers?.filter((s) => s !== streamer),
    });
  }

  function formatLastSeen(timestamp: number) {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);

    if (hours > 0) {
      return `${hours}h ${minutes}m ago`;
    }
    return `${minutes}m ago`;
  }

  if (!config || !state) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Twitch Auto-Greeter
          </h1>
          <p className="text-gray-600 mb-6">
            Automatically send greetings in Twitch chat
          </p>

          {/* Enable/Disable */}
          <div className="mb-8">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={handleToggleEnabled}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-lg font-medium">Enable auto-greeter</span>
            </label>
          </div>

          {/* Frequency Settings */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Greeting Frequency (hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={config.defaultFrequency / 3600000}
                  onChange={(e) =>
                    handleFrequencyChange(parseInt(e.target.value) || 24)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                />
                <p className="mt-1 text-sm text-gray-500">
                  How long to wait before greeting the same streamer again
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delay Range (seconds)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={config.delayRange[0]}
                    onChange={(e) =>
                      handleDelayRangeChange(
                        parseInt(e.target.value) || 10,
                        config.delayRange[1],
                      )
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={config.delayRange[1]}
                    onChange={(e) =>
                      handleDelayRangeChange(
                        config.delayRange[0],
                        parseInt(e.target.value) || 15,
                      )
                    }
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  Random delay after joining a stream
                </p>
              </div>
            </div>
          </div>

          {/* Streamer Filtering */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Streamer Filtering
            </h2>

            {/* Only Enable For */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Only Enable For (leave empty for all)
              </label>
              {config.enabledStreamers && config.enabledStreamers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {config.enabledStreamers.map((streamer) => (
                    <div
                      key={streamer}
                      className="flex items-center bg-green-50 px-3 py-1 rounded-md"
                    >
                      <span className="text-sm font-medium">{streamer}</span>
                      <button
                        onClick={() => handleRemoveEnabledStreamer(streamer)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Streamer name"
                  value={newEnabledStreamer}
                  onChange={(e) => setNewEnabledStreamer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEnabledStreamer()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
                <button
                  onClick={handleAddEnabledStreamer}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                If set, only greet these streamers
              </p>
            </div>

            {/* Disable For */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Disable For
              </label>
              {config.disabledStreamers && config.disabledStreamers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {config.disabledStreamers.map((streamer) => (
                    <div
                      key={streamer}
                      className="flex items-center bg-red-50 px-3 py-1 rounded-md"
                    >
                      <span className="text-sm font-medium">{streamer}</span>
                      <button
                        onClick={() => handleRemoveDisabledStreamer(streamer)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Streamer name"
                  value={newDisabledStreamer}
                  onChange={(e) => setNewDisabledStreamer(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddDisabledStreamer()}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                />
                <button
                  onClick={handleAddDisabledStreamer}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
                >
                  Add
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Never greet these streamers (takes precedence)
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Messages</h2>

            <div className="space-y-2 mb-4">
              {config.messages.map((msg, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                >
                  <div>
                    <p className="font-medium">{msg.text}</p>
                    {msg.streamers && msg.streamers.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Only for: {msg.streamers.join(', ')}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMessage(index)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Add New Message
              </h3>
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Message text (use <streamer> for streamer name)"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Streamers (comma-separated, leave empty for all)"
                    value={newMessageStreamers}
                    onChange={(e) => setNewMessageStreamers(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <button
                  onClick={handleAddMessage}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 font-medium"
                >
                  Add Message
                </button>
              </div>
            </div>
          </div>

          {/* Greeting History */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Greeting History
              </h2>
              {Object.keys(state.lastMessageTimes).length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md font-medium"
                >
                  Clear History
                </button>
              )}
            </div>
            {Object.keys(state.lastMessageTimes).length === 0 ? (
              <p className="text-gray-600">No greetings sent yet</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(state.lastMessageTimes)
                  .sort(([, a], [, b]) => b - a)
                  .map(([streamer, timestamp]) => (
                    <div
                      key={streamer}
                      className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                    >
                      <span className="font-medium">{streamer}</span>
                      <span className="text-sm text-gray-600">
                        {formatLastSeen(timestamp)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
