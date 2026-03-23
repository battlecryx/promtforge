import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { callModel } from '../utils/api';
import { buildOptimizationPrompt, COACH_SYSTEM, ANALYSIS_SYSTEM } from '../utils/prompts';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function OptimizerView({ config, apiKeys, saveToLibrary, sharedInput, clearSharedInput }) {
    const { t, lang } = useLanguage();
    const [input, setInput] = useState('');
    const [outcome, setOutcome] = useState('');
    const [mode, setMode] = useState('standard');
    const [optimized, setOptimized] = useState('');
    const [coachNotes, setCoachNotes] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [testResponse, setTestResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [activeTab, setActiveTab] = useState('result');
    const [copyFeedback, setCopyFeedback] = useState(false);
    const [showTechBank, setShowTechBank] = useState(false);
    const inputRef = useRef(null);

    // Modes
    const MODES = [
        { id: 'standard', label: 'Standard Prompt', icon: '📄' },
        { id: 'creative', label: 'Creative Writing', icon: '🎨' },
        { id: 'coding', label: 'Coding & Logic', icon: '💻' },
        { id: 'analysis', label: 'Data Analysis', icon: '📊' },
        { id: 'research', label: 'Deep Research', icon: '🔍' },
    ];

    // Handlers to auto-save to localStorage
    const handleInput = (val) => {
        setInput(val);
        try { localStorage.setItem('pm_autosave_input', val); } catch (e) {}
    };

    const handleOutcome = (val) => {
        setOutcome(val);
        try { localStorage.setItem('pm_autosave_outcome', val); } catch (e) {}
    };

    // Pick up shared input from templates or local storage on mount
    useEffect(() => {
        if (sharedInput) {
            handleInput(sharedInput);
            clearSharedInput();
            inputRef.current?.focus();
        } else if (!input) {
            try {
                const savedIn = localStorage.getItem('pm_autosave_input');
                const savedOut = localStorage.getItem('pm_autosave_outcome');
                if (savedIn) setInput(savedIn);
                if (savedOut) setOutcome(savedOut);
            } catch (e) {}
        }
    }, [sharedInput, clearSharedInput, input]);

    const quickTemplates = [
        { label: lang === 'es' ? '✍️ Copywriting' : '✍️ Copywriting', text: 'Write a persuasive landing page copy for a SaaS product.' },
        { label: lang === 'es' ? '💻 Código' : '💻 Coding', text: 'Write a React functional component that fetches data from an API and displays it in a table.' },
        { label: lang === 'es' ? '📊 Análisis' : '📊 Analysis', text: 'Analyze this dataset and provide the top 3 trends and actionable insights.' }
    ];

    // No need for getApiCall anymore since we use callModel uniformly


    // ─── Optimize ───
    const handleOptimize = useCallback(async () => {
        if (!input.trim()) return;
        setLoading(true);
        setOptimized('');
        setCoachNotes('');
        setAnalysis(null);
        setTestResponse('');
        setActiveTab('result');
        try {
            const sysPrompt = buildOptimizationPrompt(config.techniqueBank, outcome.trim(), mode);
            const activeProv = config.activeProvider;
            const modelId = config.models[activeProv]?.id;
            
            const result = await callModel(activeProv, sysPrompt, `Original prompt:\n\n"${input.trim()}"`, apiKeys, modelId);
            setOptimized(result);
        } catch (e) {
            setOptimized('❌ Error: ' + e.message);
        }
        setLoading(false);
    }, [input, outcome, mode, config.techniqueBank, config.activeProvider, config.models, apiKeys]);

    // ─── Test Drive ───
    const handleTest = useCallback(async () => {
        if (!optimized) return;
        setTesting(true);
        setTestResponse('');
        setActiveTab('test');
        try {
            const activeProv = config.activeProvider;
            const modelId = config.models[activeProv]?.id;
            // Sending the optimized prompt as the user message with no system prompt
            const result = await callModel(activeProv, "You are a helpful AI assistant. Answer the following prompt directly and accurately.", optimized, apiKeys, modelId);
            setTestResponse(result);
        } catch (e) {
            setTestResponse('❌ Error: ' + e.message);
        }
        setTesting(false);
    }, [optimized, config.activeProvider, config.models, apiKeys]);

    // ─── Coach ───
    const handleCoach = useCallback(async () => {
        if (!optimized || !input) return;
        setActiveTab('coach');
        setCoachNotes('⏳ ' + t('optimizer.coachAnalyzing'));
        try {
            const activeProv = config.activeProvider;
            const modelId = config.models[activeProv]?.id;
            const result = await callModel(activeProv, COACH_SYSTEM, `Original:\n"${input}"\n\nOptimized:\n"${optimized}"`, apiKeys, modelId);
            setCoachNotes(result);
        } catch (e) { setCoachNotes('❌ Error: ' + e.message); }
    }, [input, optimized, config.models, config.activeProvider, apiKeys, t]);

    // ─── Analyze ───
    const handleAnalyze = useCallback(async () => {
        setActiveTab('analysis');
        setAnalysis(null);
        try {
            const activeProv = config.activeProvider;
            const modelId = config.models[activeProv]?.id;
            const raw = await callModel(activeProv, ANALYSIS_SYSTEM, `Analyze:\n"${optimized || input}"`, apiKeys, modelId);
            setAnalysis(JSON.parse(raw.replace(/```json|```/g, '').trim()));
        } catch {
            setAnalysis({ score: 0, weaknesses: ['Analysis error'], strengths: [], suggestions: [] });
        }
    }, [input, optimized, config.models, config.activeProvider, apiKeys]);

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 1500);
    };

    const noApiKey = !apiKeys[config.activeProvider];
    const wordCount = input.trim().split(/\s+/).filter(Boolean).length;

    return (
        <div className="split-view">
            {/* LEFT COLUMN: Input & Config */}
            <div className="split-left flex-col gap-md" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                {/* No API Key Warning */}
            {noApiKey && (
                <motion.div className="info-box info-box-amber" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    ⚠️ {lang === 'es' ? 'Configura la API key de tu proveedor activo en el menú lateral para optimizar.' : 'Configure the API key for your active provider in the sidebar to optimize.'}
                </motion.div>
            )}

            {/* Quick Templates */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px', overflowX: 'auto', paddingBottom: '4px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', alignSelf: 'center', marginRight: '4px' }}>{lang === 'es' ? 'Plantillas Rápidas:' : 'Quick Templates:'}</span>
                {quickTemplates.map((t, i) => (
                    <button 
                        key={i} 
                        className="btn btn-sm" 
                        style={{ fontSize: '11px', padding: '4px 8px', whiteSpace: 'nowrap', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', background: 'rgba(255,255,255,0.03)' }}
                        onClick={() => handleInput(t.text)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Input Form Area */}
            <motion.div className="optimizer-form-container" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                
                {/* 1. Current Prompt */}
                <div className="input-group">
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {lang === 'es' ? 'Tu prompt actual' : 'Your current prompt'}
                    </span>
                    <textarea
                        ref={inputRef}
                        className="input textarea"
                        value={input}
                        onChange={e => handleInput(e.target.value)}
                        placeholder={t('optimizer.inputPlaceholder')}
                        rows={4}
                        style={{ border: 'none', background: 'rgba(0,0,0,0.2)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}
                    />
                </div>

                {/* 2. Ideal Output (Optional) */}
                <div className="input-group">
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {lang === 'es' ? 'Describe tu output ideal' : 'Describe your ideal output'}
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 400, marginLeft: '6px' }}>
                            ({lang === 'es' ? 'opcional pero recomendado' : 'optional but recommended'})
                        </span>
                    </span>
                    <textarea
                        className="input textarea"
                        value={outcome}
                        onChange={e => handleOutcome(e.target.value)}
                        placeholder={t('optimizer.outcomePlaceholder')}
                        rows={2}
                        style={{ minHeight: '60px', border: 'none', background: 'rgba(0,0,0,0.2)', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)' }}
                    />
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginLeft: '4px' }}>
                    {lang === 'es' ? 'Cuanto más específico seas sobre lo que quieres, mejor podremos optimizar el prompt.' : 'The more specific you are about what you want, the better we can optimize your prompt.'}
                </div>

                {/* Form Toolbar */}
                <div className="optimizer-form-toolbar">
                    <select 
                        className="input" 
                        value={mode} 
                        onChange={(e) => setMode(e.target.value)}
                    >
                        {MODES.map(m => (
                            <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
                        ))}
                    </select>

                    <motion.button
                        className="btn btn-primary btn-icon"
                        style={{ borderRadius: '50%', width: '40px', height: '40px', padding: 0 }}
                        onClick={handleOptimize}
                        disabled={loading || !input.trim() || noApiKey}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title={t('optimizer.optimizeBtn')}
                    >
                        {loading ? <span className="loading-spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> : '→'}
                    </motion.button>
                </div>
            </motion.div>

            <div className="keyboard-shortcut-hint">
                {lang === 'es' ? 'Presiona ⌘+Enter para optimizar' : 'Press ⌘+Enter to optimize'}
            </div>

            {/* Technique Bank Accordion */}
            <motion.div className="card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.10 }}>
                <div 
                    onClick={() => setShowTechBank(!showTechBank)}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                >
                    <span className="label" style={{ margin: 0 }}>🧠 {config.techniqueBank.length} {t('optimizer.techniques')} API</span>
                    <span style={{ transform: showTechBank ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s', fontSize: '12px' }}>▼</span>
                </div>
                
                <AnimatePresence>
                    {showTechBank && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                            <div className="grid-2" style={{ marginTop: '16px' }}>
                                {config.techniqueBank.map((tech, i) => (
                                    <div key={tech.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '8px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.015)', border: '1px solid var(--border-subtle)' }}>
                                        <span style={{ fontSize: '16px', flexShrink: 0 }}>{tech.icon}</span>
                                        <div>
                                            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>{lang === 'es' ? tech.nameEs : tech.name}</div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{lang === 'es' ? tech.descEs : tech.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div> {/* End Left Column */}

        {/* RIGHT COLUMN: Output & Results */}
        <div className="split-right" style={{ display: 'flex', flexDirection: 'column' }}>
            <AnimatePresence>
                {(optimized || loading) ? (
                    <motion.div
                        className="card"
                        style={{ padding: 0, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}
                        initial={{ opacity: 0, y: 20, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    >
                        {/* Tabs */}
                        <div className="tabs">
                            {[
                                { id: 'result', label: `⚡ ${t('optimizer.resultTab')}`, action: () => setActiveTab('result') },
                                { id: 'coach', label: `🎓 ${t('optimizer.coachTab')}`, action: handleCoach },
                                { id: 'analysis', label: `📊 ${t('optimizer.analysisTab')}`, action: handleAnalyze },
                                { id: 'test', label: `💬 ${lang === 'es' ? 'Probar Prompt' : 'Test Drive'}`, action: handleTest },
                            ].map(tab => (
                                <button key={tab.id} className={`tab ${activeTab === tab.id ? 'active' : ''}`} onClick={tab.action}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ padding: '18px' }}>
                            <AnimatePresence mode="wait">
                                {/* Result tab */}
                                {activeTab === 'result' && (
                                    <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                        <div className="code-block markdown-body" style={{ flex: 1, overflowY: 'auto' }}>
                                            {loading ? <span style={{ color: 'var(--accent-primary)' }}>⏳ {t('optimizer.applying')}</span> : (
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{optimized}</ReactMarkdown>
                                            )}
                                        </div>
                                        {optimized && !loading && (
                                            <div className="btn-group" style={{ marginTop: '14px', flexWrap: 'wrap' }}>
                                                <motion.button className="btn btn-sm btn-primary" onClick={() => copyToClipboard(optimized)} whileTap={{ scale: 0.95 }}>
                                                    {copyFeedback ? `✅ ${t('common.copied')}` : `📋 ${t('optimizer.copyBtn')}`}
                                                </motion.button>
                                                <motion.button className="btn btn-sm btn-primary" onClick={handleTest} whileTap={{ scale: 0.95 }}>
                                                    🟢 {lang === 'es' ? 'Test Launch' : 'Test Launch'}
                                                </motion.button>
                                                <a 
                                                    href={`data:text/markdown;charset=utf-8,${encodeURIComponent(optimized)}`} 
                                                    download={`optimized-prompt-${Date.now()}.md`}
                                                    style={{ textDecoration: 'none' }}
                                                >
                                                    <motion.button className="btn btn-sm" whileTap={{ scale: 0.95 }}>
                                                        📄 Export .md
                                                    </motion.button>
                                                </a>
                                                <motion.button className="btn btn-sm" onClick={() => saveToLibrary(input, optimized)} whileTap={{ scale: 0.95 }}>
                                                    💾 {t('optimizer.saveBtn')}
                                                </motion.button>
                                                <motion.button className="btn btn-sm" onClick={() => { setInput(optimized); setOptimized(''); }} whileTap={{ scale: 0.95 }}>
                                                    🔄 {t('optimizer.reoptimizeBtn')}
                                                </motion.button>
                                            </div>
                                        )}
                                    </motion.div>
                                )}

                                {/* Test Drive tab */}
                                {activeTab === 'test' && (
                                    <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <div className="markdown-body" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '16px', fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', maxHeight: '500px', overflowY: 'auto' }}>
                                            {testing ? <span style={{ color: 'var(--accent-primary)' }}>⏳ {lang === 'es' ? 'Esperando respuesta de la IA...' : 'Waiting for AI response...'}</span> : (
                                                testResponse ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{testResponse}</ReactMarkdown> : <span style={{ color: 'var(--text-dim)' }}>Pulsa Test Launch para probar.</span>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Coach tab */}
                                {activeTab === 'coach' && (
                                    <motion.div key="coach" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        <div className="markdown-body" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-md)', padding: '16px', fontSize: '14px', lineHeight: '1.8', color: 'var(--text-secondary)', maxHeight: '400px', overflowY: 'auto' }}>
                                            {coachNotes ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{coachNotes}</ReactMarkdown> : t('optimizer.coachEmpty')}
                                        </div>
                                    </motion.div>
                                )}

                                {/* Analysis tab */}
                                {activeTab === 'analysis' && analysis && (
                                    <motion.div key="analysis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-col gap-md">
                                        {/* Score Ring */}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                            <div className="score-ring" style={{ position: 'relative', width: '80px', height: '80px' }}>
                                                <svg width="80" height="80">
                                                    <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                                                    <motion.circle
                                                        cx="40" cy="40" r="34" fill="none"
                                                        stroke={analysis.score >= 80 ? 'var(--accent-green)' : analysis.score >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)'}
                                                        strokeWidth="6"
                                                        strokeDasharray={213.6}
                                                        strokeLinecap="round"
                                                        initial={{ strokeDashoffset: 213.6 }}
                                                        animate={{ strokeDashoffset: 213.6 - (analysis.score / 100) * 213.6 }}
                                                        transition={{ duration: 1.2, ease: 'easeOut' }}
                                                    />
                                                </svg>
                                                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                                                    {analysis.score}
                                                </div>
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                                    {analysis.score >= 80 ? t('optimizer.excellent') : analysis.score >= 50 ? t('optimizer.acceptable') : t('optimizer.needsWork')}
                                                </div>
                                                <div className="text-sm text-dim">{t('optimizer.qualityScore')}</div>
                                            </div>
                                        </div>

                                        <div className="grid-2">
                                            <div className="info-box info-box-green">
                                                <span className="label" style={{ color: '#6ee7b7' }}>✅ {t('optimizer.strengths')}</span>
                                                {analysis.strengths?.map((s, i) => <div key={i} style={{ fontSize: '12px', color: '#a7f3d0', padding: '3px 0' }}>• {s}</div>)}
                                            </div>
                                            <div className="info-box info-box-red">
                                                <span className="label" style={{ color: '#fca5a5' }}>⚠️ {t('optimizer.weaknesses')}</span>
                                                {analysis.weaknesses?.map((w, i) => <div key={i} style={{ fontSize: '12px', color: '#fecaca', padding: '3px 0' }}>• {w}</div>)}
                                            </div>
                                        </div>

                                        {analysis.suggestions?.length > 0 && (
                                            <div className="info-box info-box-accent">
                                                <span className="label" style={{ color: 'var(--text-accent)' }}>💡 {t('optimizer.suggestions')}</span>
                                                {analysis.suggestions.map((s, i) => <div key={i} style={{ fontSize: '12px', color: '#ddd6fe', padding: '3px 0' }}>→ {s}</div>)}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                ) : (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, border: '1px dashed var(--border-default)', borderRadius: 'var(--radius-lg)' }}>
                         <span style={{ fontSize: '32px', marginBottom: '16px' }}>✨</span>
                         <p style={{ color: 'var(--text-dim)', fontSize: '14px', maxWidth: '280px', textAlign: 'center' }}>
                            {lang === 'es' ? 'Escribe tu idea a la izquierda y el Prompt Master hará su magia aquí a la derecha.' : 'Write your idea on the left and the Prompt Master will do its magic here on the right.'}
                         </p>
                    </div>
                )}
            </AnimatePresence>
        </div> {/* End Right Column */}

        </div>
    );
}
