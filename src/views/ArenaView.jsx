import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { callClaude, callGemini } from '../utils/api';
import { buildOptimizationPrompt } from '../utils/prompts';

export default function ArenaView({ config, apiKeys, arenaVotes, handleVote, saveToLibrary, sharedInput, clearSharedInput }) {
    const { t, lang } = useLanguage();
    const [input, setInput] = useState('');
    const [results, setResults] = useState({ claude: '', gemini: '' });
    const [loading, setLoading] = useState({ claude: false, gemini: false });
    const [copyFeedback, setCopyFeedback] = useState({});

    useEffect(() => {
        if (sharedInput) {
            setInput(sharedInput);
            clearSharedInput();
        }
    }, [sharedInput, clearSharedInput]);

    const handleArena = useCallback(async () => {
        if (!input.trim()) return;
        const sysPrompt = buildOptimizationPrompt(config.techniqueBank);
        const msg = `Original prompt:\n\n"${input.trim()}"`;

        setResults({ claude: '', gemini: '' });
        setLoading({ claude: true, gemini: true });

        // Claude
        if (apiKeys.claude) {
            callClaude(sysPrompt, msg, apiKeys.claude, config.models.claude.id)
                .then(r => setResults(p => ({ ...p, claude: r })))
                .catch(e => setResults(p => ({ ...p, claude: '❌ ' + e.message })))
                .finally(() => setLoading(p => ({ ...p, claude: false })));
        } else {
            setResults(p => ({ ...p, claude: lang === 'es' ? '⚠️ Configura tu API key de Claude en Ajustes.' : '⚠️ Configure your Claude API key in Settings.' }));
            setLoading(p => ({ ...p, claude: false }));
        }

        // Gemini
        if (apiKeys.google) {
            callGemini(sysPrompt, msg, apiKeys.google, config.models.gemini.id)
                .then(r => setResults(p => ({ ...p, gemini: r })))
                .catch(e => setResults(p => ({ ...p, gemini: '❌ ' + e.message })))
                .finally(() => setLoading(p => ({ ...p, gemini: false })));
        } else {
            setResults(p => ({ ...p, gemini: t('arena.noGeminiKey') }));
            setLoading(p => ({ ...p, gemini: false }));
        }
    }, [input, config, apiKeys, lang, t]);

    const copyTo = (key) => {
        navigator.clipboard.writeText(results[key]);
        setCopyFeedback(p => ({ ...p, [key]: true }));
        setTimeout(() => setCopyFeedback(p => ({ ...p, [key]: false })), 1500);
    };

    const isRunning = loading.claude || loading.gemini;
    const noApiKeys = !apiKeys.claude && !apiKeys.google;

    return (
        <div className="flex-col gap-md">
            {/* Input */}
            <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <span className="label">⚔️ {t('arena.promptLabel')}</span>
                <textarea
                    className="input textarea"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder={t('arena.promptPlaceholder')}
                    rows={4}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div className="text-sm text-dim">
                        {t('arena.wins')} — Claude: <span className="text-accent">{arenaVotes.claude || 0}</span> · Gemini: <span style={{ color: 'var(--accent-green)' }}>{arenaVotes.gemini || 0}</span> · {t('arena.total')}: {arenaVotes.total || 0}
                    </div>
                    <motion.button
                        className="btn btn-primary"
                        onClick={handleArena}
                        disabled={isRunning || !input.trim() || noApiKeys}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                    >
                        {isRunning ? <><span className="loading-spinner" /> {t('arena.competing')}</> : `⚔️ ${t('arena.startBtn')}`}
                    </motion.button>
                </div>
            </motion.div>

            {/* Side by Side */}
            <div className="grid-2">
                {Object.entries(config.models).map(([key, model]) => (
                    <motion.div
                        key={key}
                        className="card"
                        style={{ borderColor: results[key] ? model.color + '25' : undefined }}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: key === 'gemini' ? 0.1 : 0.05 }}
                    >
                        {/* Model Header */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <motion.div
                                style={{ width: '12px', height: '12px', borderRadius: '50%', background: model.color }}
                                animate={loading[key] ? { scale: [1, 1.3, 1] } : {}}
                                transition={{ duration: 0.8, repeat: Infinity }}
                            />
                            <span style={{ fontSize: '14px', fontWeight: 700, color: model.color }}>{model.label}</span>
                            {loading[key] && <span className="loading-spinner" />}
                        </div>

                        {/* Result */}
                        <div className="code-block" style={{ minHeight: '140px', maxHeight: '320px', color: 'var(--text-secondary)' }}>
                            {loading[key] ? t('arena.optimizing') : results[key] || t('arena.resultPlaceholder')}
                        </div>

                        {/* Actions */}
                        {results[key] && !loading[key] && !results[key].startsWith('⚠️') && (
                            <div className="btn-group" style={{ marginTop: '12px' }}>
                                <motion.button
                                    className="btn btn-sm"
                                    style={{ borderColor: model.color + '30', color: model.color }}
                                    onClick={() => handleVote(key)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                >
                                    🏆 {t('arena.voteBtn')}
                                </motion.button>
                                <motion.button className="btn btn-sm btn-xs" onClick={() => copyTo(key)} whileTap={{ scale: 0.95 }}>
                                    {copyFeedback[key] ? '✅' : '📋'}
                                </motion.button>
                                <motion.button className="btn btn-sm btn-xs" onClick={() => saveToLibrary(input, results[key], key)} whileTap={{ scale: 0.95 }}>
                                    💾
                                </motion.button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
