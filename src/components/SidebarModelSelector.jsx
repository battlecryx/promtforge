import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { fetchProviderModels } from '../utils/api';

const PROVIDERS = [
    { id: 'openai', name: 'OpenAI (ChatGPT)', icon: '🟢', color: '#10a37f' },
    { id: 'anthropic', name: 'Anthropic (Claude)', icon: '🟠', color: '#d97757' },
    { id: 'google', name: 'Google (Gemini)', icon: '🔵', color: '#4285f4' },
    { id: 'perplexity', name: 'Perplexity', icon: '🌌', color: '#25ced1' },
    { id: 'xai', name: 'xAI (Grok)', icon: '✖️', color: '#000000' }
];

export default function SidebarModelSelector({ apiKeys, saveApiKeys, config, saveConfig }) {
    const { t, lang } = useLanguage();
    const [expanded, setExpanded] = useState('openai');
    const [modelsList, setModelsList] = useState({});
    const [loadingModels, setLoadingModels] = useState({});

    // Fetch models when a provider expands or API key changes
    useEffect(() => {
        const loadModels = async (providerId) => {
            const key = apiKeys[providerId];
            if (!key && providerId !== 'google' && providerId !== 'perplexity' && providerId !== 'xai') {
                // If it's a provider that really needs a key to even get the list, and we don't have it,
                // we'll still call it to get fallbacks, but we might skip the network loading state.
            }
            
            setLoadingModels(prev => ({ ...prev, [providerId]: true }));
            const list = await fetchProviderModels(providerId, key);
            setModelsList(prev => ({ ...prev, [providerId]: list }));
            setLoadingModels(prev => ({ ...prev, [providerId]: false }));
            
            // Check if current selected model is in the newly fetched list. If not, pick the first one.
            const currentSelected = config.models?.[providerId]?.id;
            if (list.length > 0 && (!currentSelected || !list.includes(currentSelected))) {
                handleModelSelect(providerId, list[0]);
            }
        };

        if (expanded) {
            loadModels(expanded);
        }
    }, [expanded, apiKeys[expanded]]); // Re-run if expanded provider changes or its API key changes

    const handleKeyChange = (providerId, value) => {
        saveApiKeys({ ...apiKeys, [providerId]: value });
    };

    const handleModelSelect = (providerId, modelId) => {
        const newConfig = {
            ...config,
            models: {
                ...config.models,
                [providerId]: {
                    ...config.models[providerId],
                    id: modelId,
                    provider: providerId
                }
            },
            // Also update the global default 'active' model family if we want it to be this provider
            activeProvider: providerId
        };
        saveConfig(newConfig);
    };

    return (
        <div style={{ padding: '0 12px', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)', marginBottom: '8px', marginLeft: '4px' }}>
                {lang === 'es' ? 'Motores de IA' : 'AI Engines'}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {PROVIDERS.map(prov => {
                    const isExpanded = expanded === prov.id;
                    const isActiveGlobal = config.activeProvider === prov.id;
                    const curModel = config.models?.[prov.id]?.id || '';
                    const hasKey = !!apiKeys[prov.id];

                    return (
                        <div key={prov.id} style={{ 
                            background: isExpanded ? 'rgba(255,255,255,0.05)' : 'transparent',
                            border: `1px solid ${isExpanded || isActiveGlobal ? 'var(--border-strong)' : 'transparent'}`,
                            borderRadius: 'var(--radius-md)',
                            overflow: 'hidden',
                            transition: 'all 0.2s'
                        }}>
                            {/* Accordion Header */}
                            <div 
                                onClick={() => {
                                    setExpanded(isExpanded ? null : prov.id);
                                    if (!isExpanded && hasKey && !isActiveGlobal) {
                                        // Auto-select this as global provider when expanding if it has a key
                                        saveConfig({ ...config, activeProvider: prov.id });
                                    }
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '8px 10px',
                                    cursor: 'pointer',
                                    opacity: (!hasKey && !isExpanded) ? 0.6 : 1
                                }}
                            >
                                <span style={{ fontSize: '14px' }}>{prov.icon}</span>
                                <span style={{ fontSize: '13px', fontWeight: isActiveGlobal ? 600 : 500, flex: 1, color: isActiveGlobal ? '#fff' : 'var(--text-secondary)' }}>
                                    {prov.name}
                                </span>
                                {isActiveGlobal && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: prov.color, boxShadow: `0 0 6px ${prov.color}` }} />}
                            </div>

                            {/* Accordion Body */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ padding: '0 10px 10px 10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            
                                            {/* API Key Input */}
                                            <div>
                                                <input
                                                    type="password"
                                                    className="input input-mono"
                                                    style={{ fontSize: '11px', padding: '6px 8px', width: '100%', height: '28px' }}
                                                    placeholder={`${prov.name} API Key`}
                                                    value={apiKeys[prov.id] || ''}
                                                    onChange={e => handleKeyChange(prov.id, e.target.value)}
                                                />
                                            </div>

                                            {/* Model Selector Dropdown */}
                                            <div style={{ position: 'relative' }}>
                                                {loadingModels[prov.id] ? (
                                                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', padding: '4px' }}>
                                                        {lang === 'es' ? 'Cargando modelos...' : 'Fetching models...'}
                                                    </div>
                                                ) : (
                                                    <select 
                                                        className="input" 
                                                        style={{ fontSize: '12px', padding: '4px 8px', width: '100%', height: '28px', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.2)' }}
                                                        value={curModel}
                                                        onChange={(e) => handleModelSelect(prov.id, e.target.value)}
                                                    >
                                                        {!modelsList[prov.id]?.length && <option value="">No models found</option>}
                                                        {modelsList[prov.id]?.map(m => (
                                                            <option key={m} value={m}>{m}</option>
                                                        ))}
                                                    </select>
                                                )}
                                            </div>

                                            {!isActiveGlobal && hasKey && (
                                                <button 
                                                    className="btn btn-sm" 
                                                    style={{ fontSize: '10px', padding: '4px 0', border: '1px solid var(--border-default)', background: 'transparent' }}
                                                    onClick={(e) => { e.stopPropagation(); saveConfig({ ...config, activeProvider: prov.id }); }}
                                                >
                                                    {lang === 'es' ? 'Usar este modelo por defecto' : 'Set as default'}
                                                </button>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    );
                })}
            </div>
            
            <div style={{ marginTop: '12px', height: '1px', background: 'var(--border-default)' }} />
        </div>
    );
}
