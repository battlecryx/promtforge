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

export default function GlobalTargetModal({ isOpen, onClose, apiKeys, saveApiKeys, config, saveConfig }) {
    const { t, lang } = useLanguage();
    const [expanded, setExpanded] = useState(config.activeProvider || 'openai');
    const [modelsList, setModelsList] = useState({});
    const [loadingModels, setLoadingModels] = useState({});

    // Keep internal local state for expanded accordion
    useEffect(() => {
        if (isOpen && config.activeProvider) {
            setExpanded(config.activeProvider);
        }
    }, [isOpen, config.activeProvider]);

    useEffect(() => {
        const loadModels = async (providerId) => {
            const key = apiKeys[providerId];
            setLoadingModels(prev => ({ ...prev, [providerId]: true }));
            const list = await fetchProviderModels(providerId, key);
            setModelsList(prev => ({ ...prev, [providerId]: list }));
            setLoadingModels(prev => ({ ...prev, [providerId]: false }));
            
            const currentSelected = config.models?.[providerId]?.id;
            if (list.length > 0 && (!currentSelected || !list.includes(currentSelected))) {
                handleModelSelect(providerId, list[0]);
            }
        };

        if (isOpen && expanded) {
            loadModels(expanded);
        }
    }, [expanded, apiKeys[expanded], isOpen]);

    const handleKeyChange = (providerId, value) => saveApiKeys({ ...apiKeys, [providerId]: value });

    const handleModelSelect = (providerId, modelId) => {
        const newConfig = {
            ...config,
            models: { ...config.models, [providerId]: { ...config.models[providerId], id: modelId, provider: providerId } },
            activeProvider: providerId
        };
        saveConfig(newConfig);
    };

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Modal Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                onClick={onClose}
            />

            {/* Modal Content */}
            <motion.div 
                className="card-glass"
                initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                style={{ position: 'relative', width: '90%', maxWidth: '440px', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-subtle)' }}
            >
                <button 
                    onClick={onClose} 
                    style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '18px' }}
                >
                    ✕
                </button>

                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ margin: '0 0 4px', fontSize: '18px', color: 'var(--text-primary)' }}>
                        {lang === 'es' ? 'Configuración de Modelos' : 'Model Configuration'}
                    </h2>
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-dim)' }}>
                        {lang === 'es' ? 'Selecciona qué motor de IA global utilizarás.' : 'Select which global AI engine you want to use.'}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                    {PROVIDERS.map(prov => {
                        const isExpanded = expanded === prov.id;
                        const isActiveGlobal = config.activeProvider === prov.id;
                        const curModel = config.models?.[prov.id]?.id || '';
                        const hasKey = !!apiKeys[prov.id];

                        return (
                            <div key={prov.id} style={{ 
                                background: isExpanded ? 'rgba(255,255,255,0.04)' : 'transparent',
                                border: `1px solid ${isActiveGlobal ? prov.color + '50' : isExpanded ? 'var(--border-strong)' : 'transparent'}`,
                                borderRadius: 'var(--radius-md)',
                                overflow: 'hidden', transition: 'all 0.2s'
                            }}>
                                <div 
                                    onClick={() => {
                                        setExpanded(isExpanded ? null : prov.id);
                                        if (!isExpanded && hasKey && !isActiveGlobal) saveConfig({ ...config, activeProvider: prov.id });
                                    }}
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', cursor: 'pointer', opacity: (!hasKey && !isExpanded) ? 0.6 : 1 }}
                                >
                                    <span style={{ fontSize: '16px' }}>{prov.icon}</span>
                                    <span style={{ fontSize: '14px', fontWeight: isActiveGlobal ? 600 : 500, flex: 1, color: isActiveGlobal ? '#fff' : 'var(--text-secondary)' }}>
                                        {prov.name}
                                    </span>
                                    {isActiveGlobal && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: prov.color, boxShadow: `0 0 8px ${prov.color}` }} />}
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                            <div style={{ padding: '0 12px 12px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div>
                                                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>API KEY</span>
                                                    <input
                                                        type="password" className="input input-mono"
                                                        style={{ fontSize: '12px', padding: '8px', width: '100%', border: '1px solid var(--border-default)' }}
                                                        placeholder={`${prov.name} API Key`} value={apiKeys[prov.id] || ''} onChange={e => handleKeyChange(prov.id, e.target.value)}
                                                    />
                                                </div>
                                                <div style={{ position: 'relative' }}>
                                                    <span style={{ display: 'block', fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>MODEL ({lang === 'es' ? 'Dinámico' : 'Dynamic'})</span>
                                                    {loadingModels[prov.id] ? (
                                                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', padding: '6px' }}>{lang === 'es' ? 'Buscando...' : 'Fetching...'}</div>
                                                    ) : (
                                                        <select 
                                                            className="input" style={{ fontSize: '13px', padding: '8px', width: '100%', cursor: 'pointer', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-default)' }}
                                                            value={curModel} onChange={(e) => handleModelSelect(prov.id, e.target.value)}
                                                        >
                                                            {!modelsList[prov.id]?.length && <option value="">No models found</option>}
                                                            {modelsList[prov.id]?.map(m => ( <option key={m} value={m}>{m}</option> ))}
                                                        </select>
                                                    )}
                                                </div>
                                                {!isActiveGlobal && hasKey && (
                                                    <button 
                                                        className="btn btn-sm" style={{ alignSelf: 'flex-start', border: '1px solid var(--border-default)', background: 'transparent' }}
                                                        onClick={(e) => { e.stopPropagation(); saveConfig({ ...config, activeProvider: prov.id }); }}
                                                    >
                                                        {lang === 'es' ? 'Activar Globalmente' : 'Set as Global Engine'}
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
            </motion.div>
        </div>
    );
}
