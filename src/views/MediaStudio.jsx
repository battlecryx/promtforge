import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { callModel } from '../utils/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MediaStudio({ config, apiKeys, saveToLibrary }) {
    const { t, lang } = useLanguage();
    const [input, setInput] = useState('');
    const [selectedTarget, setSelectedTarget] = useState('nano_banana');
    
    // We treat Veo 3.1 differently since generating video directly in the browser via api key often needs server handling.
    // For Nano Banana, we try to use the textual completion returning a base64 encoded image or an image URL if the API supports it.
    // Here we will mock it returning a base64 placeholder or use an actual call if supported.
    const [result, setResult] = useState(null); // Either { type: 'image', data: url } or { type: 'text', data: string }
    const [loading, setLoading] = useState(false);

    const handleGenerate = useCallback(async () => {
        if (!input.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const isVideo = selectedTarget === 'veo';
            
            // Text-to-Image / Video Script generation
            const promptContext = isVideo 
                ? `You are an expert cinematic director. The user wants a video script about: "${input}". Provide a highly detailed prompt ready for Veo 3.1 generator, focusing on camera movements, lighting, and framing.`
                : `You are an expert prompt engineer for Nano Banana (Imagen). The user wants an image of: "${input}". Expand this into a highly detailed, comma-separated image generation prompt including style, lighting, and camera details. Return ONLY the prompt string.`;

            // First, optimize the prompt
            const activeProv = config.activeProvider;
            const engineId = config.models[activeProv]?.id;
            
            const optimizedPrompt = await callModel(
                activeProv, 
                "You are an expert AI media prompter. Follow the instructions precisely.", 
                promptContext, 
                apiKeys, 
                engineId
            );

            if (isVideo) {
                setResult({ type: 'text', data: optimizedPrompt });
            } else {
                // If it is Nano Banana, we ideally would call a predict endpoint. 
                // We'll show the optimized prompt as the output (since standard chat completions don't return raw images).
                setResult({ type: 'text', data: `[Optimized for Nano Banana]:\n${optimizedPrompt}\n\n(Note: Direct API image rendering requires a dedicated generativeLanguage.predict REST integration for Nano Banana natively.)` });
            }
        } catch (e) {
            setResult({ type: 'text', data: '❌ Error: ' + e.message });
        }
        setLoading(false);
    }, [input, config.activeProvider, config.models, selectedTarget, apiKeys]);

    const noApiKey = !apiKeys[config.activeProvider];

    return (
        <div className="flex-col gap-md">
            {noApiKey && (
                <motion.div className="info-box info-box-amber" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    ⚠️ {lang === 'es' ? 'Configura la API key de tu proveedor activo en el menú lateral.' : 'Configure the API key for your active provider in the sidebar.'}
                </motion.div>
            )}

            <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <span className="label">🎥 {t('media.promptLabel')}</span>
                <textarea
                    className="input textarea"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={t('media.promptPlaceholder')}
                    rows={4}
                />
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{lang === 'es' ? 'MOTOR:' : 'ENGINE:'}</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{config.activeProvider.toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize: '16px', color: 'var(--text-tertiary)' }}>→</span>
                        <select className="input input-mono" style={{ width: 'auto', padding: '8px 12px', fontSize: '12px' }} value={selectedTarget} onChange={e => setSelectedTarget(e.target.value)}>
                            {/* Filter only Media Models targets */}
                            {['nano_banana', 'nano_banana_pro', 'veo'].map(key => (
                                <option key={key} value={key}>{config.models[key]?.label || key}</option>
                            ))}
                        </select>
                    </div>
                    <motion.button
                        className="btn btn-primary"
                        onClick={handleGenerate}
                        disabled={loading || !input.trim() || noApiKey}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {loading ? <><span className="loading-spinner" /> {t('media.generating')}</> : `✨ ${t('media.generateBtn')}`}
                    </motion.button>
                </div>
            </motion.div>

            <AnimatePresence>
                {(result || loading) && (
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <div className="card-header">
                            <span className="label label-accent">
                                {selectedTarget === 'veo' ? `🎬 ${t('media.videoPromptReady')}` : `🖼️ ${t('media.imageResult')}`}
                            </span>
                        </div>

                        {loading ? (
                            <div className="code-block" style={{ textAlign: 'center', padding: '40px' }}>
                                <span className="loading-spinner" style={{ width: '24px', height: '24px', borderWidth: '3px' }} />
                                <div style={{ marginTop: '16px', color: 'var(--accent-primary)' }}>{t('media.generating')}</div>
                            </div>
                        ) : (
                            result?.type === 'text' ? (
                                <div className="code-block markdown-body" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.data}</ReactMarkdown>
                                </div>
                            ) : (
                                <div style={{ width: '100%', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                                    <img src={result.data} alt="Generated" style={{ width: '100%', height: 'auto', display: 'block' }} />
                                </div>
                            )
                        )}

                        {result && !loading && result.type === 'text' && (
                            <div className="btn-group" style={{ marginTop: '14px' }}>
                                <motion.button className="btn btn-sm btn-primary" onClick={() => navigator.clipboard.writeText(result.data)} whileTap={{ scale: 0.95 }}>
                                    📋 Copy
                                </motion.button>
                                <motion.button className="btn btn-sm" onClick={() => saveToLibrary(`[${selectedTarget}]: ${input}`, result.data, 'media')} whileTap={{ scale: 0.95 }}>
                                    💾 {t('media.saveBtn')}
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
