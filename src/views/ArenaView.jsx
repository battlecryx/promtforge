import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { callModel } from '../utils/api';
import { buildOptimizationPrompt } from '../utils/prompts';

export default function ArenaView({ config, apiKeys, arenaVotes, handleVote, saveToLibrary, sharedInput, clearSharedInput }) {
    const { t, lang } = useLanguage();
    const [input, setInput] = useState('');
    const [modelA, setModelA] = useState('openai');
    const [modelB, setModelB] = useState('anthropic');
    const [results, setResults] = useState({ modelA: '', modelB: '' });
    const [loading, setLoading] = useState({ modelA: false, modelB: false });
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

        setResults({ modelA: '', modelB: '' });
        setLoading({ modelA: true, modelB: true });

        const requestModel = async (provKey, setKey) => {
            const engineId = config.models[provKey]?.id;
            try {
                if (!apiKeys[provKey]) throw new Error(`Missing API Key for ${provKey}`);
                const res = await callModel(provKey, sysPrompt, msg, apiKeys, engineId);
                setResults(p => ({ ...p, [setKey]: res }));
            } catch (e) {
                setResults(p => ({ ...p, [setKey]: '❌ Error: ' + e.message }));
            } finally {
                setLoading(p => ({ ...p, [setKey]: false }));
            }
        };

        requestModel(modelA, 'modelA');
        requestModel(modelB, 'modelB');
    }, [input, config, apiKeys, modelA, modelB]);

    const copyTo = (key) => {
        navigator.clipboard.writeText(results[key]);
        setCopyFeedback(p => ({ ...p, [key]: true }));
        setTimeout(() => setCopyFeedback(p => ({ ...p, [key]: false })), 1500);
    };

    const isRunning = loading.modelA || loading.modelB;
    const noApiKeys = !apiKeys.claude && !apiKeys.google && !apiKeys.openai && !apiKeys.perplexity && !apiKeys.xai;

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
                {[
                    { stateKey: 'modelA', selected: modelA, setter: setModelA },
                    { stateKey: 'modelB', selected: modelB, setter: setModelB }
                ].map(({ stateKey, selected, setter }) => {
                    const engineId = config.models[selected]?.id || 'Default';
                    const isModelLoading = loading[stateKey];
                    const modelResult = results[stateKey];
                    // Pick a fallback color if not defined
                    const colorMap = { openai: '#10a37f', anthropic: '#d97757', google: '#4285f4', perplexity: '#25ced1', xai: '#000000' };
                    const dotColor = colorMap[selected] || '#fff';
                    return (
                        <motion.div
                            key={stateKey}
                            className="card"
                            style={{ borderColor: modelResult ? dotColor + '25' : undefined }}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: stateKey === 'modelB' ? 0.1 : 0.05 }}
                        >
                            {/* Model Header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', justifyContent: 'space-between' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <motion.div
                                        style={{ width: '12px', height: '12px', borderRadius: '50%', background: dotColor }}
                                        animate={isModelLoading ? { scale: [1, 1.3, 1] } : {}}
                                        transition={{ duration: 0.8, repeat: Infinity }}
                                    />
                                    <select className="input input-mono" style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', fontWeight: 700, color: dotColor, border: 'none', background: 'transparent' }} value={selected} onChange={e => setter(e.target.value)}>
                                        {['openai', 'anthropic', 'google', 'perplexity', 'xai'].map(k => (
                                            <option key={k} value={k}>{k.toUpperCase()} ({config.models[k]?.id || 'Default'})</option>
                                        ))}
                                    </select>
                                </div>
                                {isModelLoading && <span className="loading-spinner" />}
                            </div>

                            {/* Result */}
                            <div className="code-block" style={{ minHeight: '140px', maxHeight: '320px', color: 'var(--text-secondary)' }}>
                                {isModelLoading ? t('arena.optimizing') : modelResult || t('arena.resultPlaceholder')}
                            </div>

                            {/* Actions */}
                            {modelResult && !isModelLoading && !modelResult.startsWith('⚠️') && !modelResult.startsWith('❌') && (
                                <div className="btn-group" style={{ marginTop: '12px' }}>
                                    <motion.button
                                        className="btn btn-sm"
                                        style={{ borderColor: dotColor + '30', color: dotColor }}
                                        onClick={() => handleVote(selected)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        🏆 {t('arena.voteBtn')}
                                    </motion.button>
                                    <motion.button className="btn btn-sm btn-xs" onClick={() => copyTo(stateKey)} whileTap={{ scale: 0.95 }}>
                                        {copyFeedback[stateKey] ? '✅' : '📋'}
                                    </motion.button>
                                    <motion.button className="btn btn-sm btn-xs" onClick={() => saveToLibrary(input, modelResult, selected)} whileTap={{ scale: 0.95 }}>
                                        💾
                                    </motion.button>
                                </div>
                            )}
                        </motion.div>
                    )
                })}
            </div>
        </div>
    );
}
