import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { callClaude, callGemini } from '../utils/api';
import { buildSEOPrompt } from '../utils/prompts';

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
    const [loading, setLoading] = useState(false);
    const [copyFeedback, setCopyFeedback] = useState(false);

    const updateField = (key, val) => setFields(p => ({ ...p, [key]: val }));

    const applyPreset = (preset) => {
        setFields(p => ({ ...p, ...PRESETS[preset] }));
    };

    const handleGenerate = useCallback(async () => {
        if (!fields.industry || !fields.keywords) return;
        setLoading(true);
        setResult('');
        try {
            const seoPrompt = buildSEOPrompt({ ...fields, lang });
            let res;
            if (apiKeys.claude) {
                res = await callClaude('You are an SEO expert. Follow the instructions precisely.', seoPrompt, apiKeys.claude, config.models.claude.id);
            } else if (apiKeys.google) {
                res = await callGemini('You are an SEO expert. Follow the instructions precisely.', seoPrompt, apiKeys.google, config.models.gemini.id);
            } else {
                throw new Error('No API key configured');
            }
            setResult(res);
        } catch (e) {
            setResult('❌ Error: ' + e.message);
        }
        setLoading(false);
    }, [fields, lang, apiKeys, config.models]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 1500);
    };

    const noApiKey = !apiKeys.claude && !apiKeys.google;
    const canGenerate = fields.industry.trim() && fields.keywords.trim() && !noApiKey;

    return (
        <div className="flex-col gap-md">
            {noApiKey && (
                <motion.div className="info-box info-box-amber" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    ⚠️ {lang === 'es' ? 'Configura al menos una API key en Ajustes.' : 'Configure at least one API key in Settings.'}
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

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
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

            {/* Result */}
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
                            <span className="label label-accent">📊 {t('seo.resultTitle')}</span>
                        </div>
                        <div className="code-block" style={{ maxHeight: '500px' }}>
                            {loading ? <span style={{ color: 'var(--accent-primary)' }}>⏳ {t('seo.generating')}</span> : result}
                        </div>
                        {result && !loading && (
                            <div className="btn-group" style={{ marginTop: '14px' }}>
                                <motion.button className="btn btn-sm btn-primary" onClick={() => copyToClipboard(result)} whileTap={{ scale: 0.95 }}>
                                    {copyFeedback ? `✅ ${t('common.copied')}` : `📋 ${t('optimizer.copyBtn')}`}
                                </motion.button>
                                <motion.button className="btn btn-sm" onClick={() => saveToLibrary(`SEO: ${fields.industry} - ${fields.pageType}`, result, 'seo')} whileTap={{ scale: 0.95 }}>
                                    💾 {t('optimizer.saveBtn')}
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
