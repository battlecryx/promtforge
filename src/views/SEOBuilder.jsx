import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { callModel } from '../utils/api';
import { buildSEOPrompt } from '../utils/prompts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PAGE_TYPES = ['landing', 'blog', 'ecommerce', 'portfolio', 'saas', 'local'];
const TONES = ['professional', 'casual', 'persuasive', 'educational', 'inspirational'];

const PRESETS = {
    startup: { pageType: 'saas', industry: 'SaaS / Technology', tone: 'persuasive', cta: 'Start Free Trial' },
    restaurant: { pageType: 'local', industry: 'Restaurant / Food', tone: 'casual', cta: 'Make a Reservation' },
    ecommerce: { pageType: 'ecommerce', industry: 'E-Commerce / Retail', tone: 'persuasive', cta: 'Add to Cart' },
    blog: { pageType: 'blog', industry: 'Content / Media', tone: 'educational', cta: 'Subscribe for Updates' },
    portfolio: { pageType: 'portfolio', industry: 'Creative / Freelance', tone: 'professional', cta: 'Get in Touch' },
};

export default function SEOBuilder({ config, apiKeys, saveToLibrary }) {
    const { t, lang } = useLanguage();
    const [fields, setFields] = useState({
        pageType: 'landing',
        industry: '',
        keywords: '',
        audience: '',
        tone: 'professional',
        cta: '',
    });
    const [result, setResult] = useState('');
    const [testResponse, setTestResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [activeTab, setActiveTab] = useState('result');
    const [copyFeedback, setCopyFeedback] = useState(false);

    // Pick up saved fields from local storage on mount
    useEffect(() => {
        try {
            const savedFields = localStorage.getItem('pm_autosave_seo_fields');
            if (savedFields) {
                setFields(JSON.parse(savedFields));
            }
        } catch (e) {}
    }, []);

    const updateField = (key, val) => {
        setFields(p => {
            const nextFields = { ...p, [key]: val };
            try { localStorage.setItem('pm_autosave_seo_fields', JSON.stringify(nextFields)); } catch (e) {}
            return nextFields;
        });
    };

    const applyPreset = (preset) => {
        const nextFields = { ...fields, ...PRESETS[preset] };
        setFields(nextFields);
        try { localStorage.setItem('pm_autosave_seo_fields', JSON.stringify(nextFields)); } catch (e) {}
    };

    const handleGenerate = useCallback(async () => {
        if (!fields.industry || !fields.keywords) return;
        setLoading(true);
        setResult('');
        setTestResponse('');
        setActiveTab('result');
        try {
            const seoPrompt = buildSEOPrompt({ ...fields, lang });
            const activeProv = config.activeProvider;
            const modelId = config.models[activeProv]?.id;
            const res = await callModel(activeProv, 'You are an SEO expert. Follow the instructions precisely.', seoPrompt, apiKeys, modelId);
            setResult(res);
        } catch (e) {
            setResult('❌ Error: ' + e.message);
        }
        setLoading(false);
    }, [fields, lang, apiKeys, config.activeProvider, config.models]);

    // ─── Test Drive ───
    const handleTest = useCallback(async () => {
        if (!result) return;
        setTesting(true);
        setTestResponse('');
        setActiveTab('test');
        try {
            const activeProv = config.activeProvider;
            const modelId = config.models[activeProv]?.id;
            // Sending the result prompt as the user message with no system prompt
            const res = await callModel(activeProv, "You are a helpful AI assistant. Answer the following prompt directly and accurately.", result, apiKeys, modelId);
            setTestResponse(res);
        } catch (e) {
            setTestResponse('❌ Error: ' + e.message);
        }
        setTesting(false);
    }, [result, config.activeProvider, config.models, apiKeys]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 1500);
    };

    const noApiKey = !apiKeys[config.activeProvider];
    const canGenerate = fields.industry.trim() && fields.keywords.trim() && !noApiKey;

    return (
        <div className="split-view">
            {/* LEFT COLUMN: Input & Config */}
            <div className="split-left flex-col gap-md" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {noApiKey && (
                    <motion.div className="info-box info-box-amber" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        ⚠️ {lang === 'es' ? 'Configura la API key de tu proveedor activo en el menú lateral.' : 'Configure the API key for your active provider in the sidebar.'}
                    </motion.div>
                )}

            {/* Quick Presets */}
            <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <span className="label">🚀 {t('seo.presets')}</span>
                <div className="seo-presets">
                    {Object.keys(PRESETS).map(key => (
                        <motion.button
                            key={key}
                            className="seo-preset-btn"
                            onClick={() => applyPreset(key)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {key === 'startup' ? '🚀 Startup' : key === 'restaurant' ? '🍽️ Restaurant' : key === 'ecommerce' ? '🛒 E-Commerce' : key === 'blog' ? '📝 Blog' : '🎨 Portfolio'}
                        </motion.button>
                    ))}
                </div>
            </motion.div>

            {/* SEO Form */}
            <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                <div className="grid-2" style={{ gap: '16px' }}>
                    {/* Page Type */}
                    <div className="seo-field-group">
                        <label>📄 {t('seo.pageType')}</label>
                        <select className="input" value={fields.pageType} onChange={e => updateField('pageType', e.target.value)}>
                            {PAGE_TYPES.map(pt => (
                                <option key={pt} value={pt}>{t(`seo.pageTypes.${pt}`)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Tone */}
                    <div className="seo-field-group">
                        <label>🎨 {t('seo.tone')}</label>
                        <select className="input" value={fields.tone} onChange={e => updateField('tone', e.target.value)}>
                            {TONES.map(tone => (
                                <option key={tone} value={tone}>{t(`seo.tones.${tone}`)}</option>
                            ))}
                        </select>
                    </div>

                    {/* Industry */}
                    <div className="seo-field-group">
                        <label>🏢 {t('seo.industry')}</label>
                        <input className="input" value={fields.industry} onChange={e => updateField('industry', e.target.value)} placeholder={t('seo.industryPlaceholder')} />
                    </div>

                    {/* Audience */}
                    <div className="seo-field-group">
                        <label>👥 {t('seo.audience')}</label>
                        <input className="input" value={fields.audience} onChange={e => updateField('audience', e.target.value)} placeholder={t('seo.audiencePlaceholder')} />
                    </div>

                    {/* Keywords - full width */}
                    <div className="seo-field-group" style={{ gridColumn: '1 / -1' }}>
                        <label>🔑 {t('seo.keywords')}</label>
                        <input className="input" value={fields.keywords} onChange={e => updateField('keywords', e.target.value)} placeholder={t('seo.keywordsPlaceholder')} />
                    </div>

                    {/* CTA */}
                    <div className="seo-field-group" style={{ gridColumn: '1 / -1' }}>
                        <label>🎯 {t('seo.cta')}</label>
                        <input className="input" value={fields.cta} onChange={e => updateField('cta', e.target.value)} placeholder={t('seo.ctaPlaceholder')} />
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{lang === 'es' ? 'MODELO ACTIVO:' : 'ACTIVE MODEL:'}</span>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                                {config.activeProvider.toUpperCase()} — {config.models[config.activeProvider]?.id || 'Default'}
                            </span>
                        </div>
                    </div>
                    <motion.button
                        className="btn btn-primary"
                        onClick={handleGenerate}
                        disabled={loading || !canGenerate}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {loading ? <><span className="loading-spinner" /> {t('seo.generating')}</> : `🔍 ${t('seo.generateBtn')}`}
                    </motion.button>
                </div>
            </motion.div>
        </div> {/* End left column */}

        {/* RIGHT COLUMN: Results */}
        <div className="split-right" style={{ display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence>
                {(result || loading) ? (
                    <motion.div
                        className="card"
                        initial={{ opacity: 0, y: 20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4 }}
                        style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}
                    >
                        <div className="tabs" style={{ marginBottom: 0 }}>
                            {[
                                { id: 'result', label: `⚡ ${t('optimizer.resultTab')}`, action: () => setActiveTab('result') },
                                { id: 'test', label: `💬 ${lang === 'es' ? 'Probar Prompt' : 'Test Drive'}`, action: handleTest },
                            ].map(tab => (
                                <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={tab.action}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ padding: '18px' }}>
                            <AnimatePresence mode="wait">
                                {activeTab === 'result' && (
                                    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <div className="code-block markdown-body" style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
                                            {loading ? <span style={{ color: 'var(--accent-primary)' }}>⏳ {t('seo.generating')}</span> : (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
                                            )}
                                        </div>
                                        {result && !loading && (
                                            <div className="btn-group" style={{ marginTop: '14px', flexWrap: 'wrap' }}>
                                                <motion.button className="btn btn-sm btn-primary" onClick={() => copyToClipboard(result)} whileTap={{ scale: 0.95 }}>
                                                    {copyFeedback ? `✅ ${t('common.copied')}` : `📋 ${t('optimizer.copyBtn')}`}
                                                </motion.button>
                                                <motion.button className="btn btn-sm btn-primary" onClick={handleTest} whileTap={{ scale: 0.95 }}>
                                                    🟢 {lang === 'es' ? 'Test Launch' : 'Test Launch'}
                                                </motion.button>
                                                <a 
                                                    href={`data:text/markdown;charset=utf-8,${encodeURIComponent(result)}`} 
                                                    download={`seo-prompt-${Date.now()}.md`}
                                                    style={{ textDecoration: 'none' }}
                                                >
                                                    <motion.button className="btn btn-sm" whileTap={{ scale: 0.95 }}>
                                                        📄 Export .md
                                                    </motion.button>
                                                </a>
                                                <motion.button className="btn btn-sm" onClick={() => saveToLibrary(`SEO: ${fields.industry} - ${fields.pageType}`, result, 'seo')} whileTap={{ scale: 0.95 }}>
                                                    💾 {t('optimizer.saveBtn')}
                                                </motion.button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {activeTab === 'test' && (
                                    <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <div className="markdown-body" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '16px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', maxHeight: '500px', overflowY: 'auto' }}>
                                            {testing ? <span style={{ color: 'var(--accent-primary)' }}>⏳ {lang === 'es' ? 'Esperando respuesta de la IA...' : 'Waiting for AI response...'}</span> : (
                                                testResponse ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{testResponse}</ReactMarkdown> : <span style={{ color: 'var(--text-dim)' }}>Pulsa Test Launch para probar.</span>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
                         <span style={{ fontSize: '32px', marginBottom: '16px' }}>📝</span>
                         <p style={{ color: 'var(--text-dim)', fontSize: '14px', maxWidth: '280px', textAlign: 'center' }}>
                            {lang === 'es' ? 'Rellena los campos a la izquierda y tu plantilla SEO optimizada aparecerá aquí.' : 'Fill the fields on the left and your optimized SEO template will appear here.'}
                         </p>
                    </div>
                )}
            </AnimatePresence>
        </div> {/* End right column */}
        
        </div>
    );
}
