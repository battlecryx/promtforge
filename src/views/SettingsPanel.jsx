import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

const TABS = ['api', 'account', 'models', 'lang'];

export default function SettingsPanel({ apiKeys, saveApiKeys, config, saveConfig, user, onUpdateEmail, onUpdatePassword, onClose }) {
    const { t, lang, setLang } = useLanguage();
    const [activeTab, setActiveTab] = useState('api');
    const [saveFeedback, setSaveFeedback] = useState('');
    const emailRef = useRef(null);
    const pwRef = useRef(null);

    const showFeedback = (msg) => {
        setSaveFeedback(msg);
        setTimeout(() => setSaveFeedback(''), 2000);
    };

    const handleKeyChange = (provider, value) => {
        const updated = { ...apiKeys, [provider]: value };
        saveApiKeys(updated);
        showFeedback(lang === 'es' ? '✅ Guardado' : '✅ Saved');
    };

    const handleModelChange = (key, newId) => {
        const newConfig = {
            ...config,
            models: { ...config.models, [key]: { ...config.models[key], id: newId } },
        };
        saveConfig(newConfig);
        showFeedback(lang === 'es' ? '✅ Modelo actualizado' : '✅ Model updated');
    };

    return (
        <div className="flex-col gap-md">
            {/* Back button */}
            <motion.button className="btn btn-sm" onClick={onClose} whileHover={{ x: -3 }} style={{ alignSelf: 'flex-start' }}>
                ← {lang === 'es' ? 'Volver' : 'Back'}
            </motion.button>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {TABS.map(tab => (
                    <motion.button
                        key={tab}
                        className={`btn btn-sm ${activeTab === tab ? 'btn-primary' : ''}`}
                        onClick={() => setActiveTab(tab)}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {tab === 'api' ? '🔑' : tab === 'account' ? '👤' : tab === 'models' ? '🤖' : '🌐'}{' '}
                        {t(`settings.${tab}Tab`)}
                    </motion.button>
                ))}
            </div>

            {/* Feedback */}
            {saveFeedback && (
                <motion.div className="info-box info-box-green" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}>
                    {saveFeedback}
                </motion.div>
            )}

            {/* ─── API Keys ─── */}
            {activeTab === 'api' && (
                <motion.div className="card flex-col gap-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div>
                        <span className="label">🔑 {t('settings.claudeKey')}</span>
                        <input
                            className="input input-mono"
                            type="password"
                            value={apiKeys.claude || ''}
                            onChange={e => handleKeyChange('claude', e.target.value)}
                            placeholder={t('settings.claudeKeyPlaceholder')}
                        />
                        <p className="text-xs text-dim" style={{ marginTop: '6px' }}>{t('settings.claudeKeyHelp')}</p>
                    </div>

                    <div>
                        <span className="label">🔑 {t('settings.googleKey')}</span>
                        <input
                            className="input input-mono"
                            type="password"
                            value={apiKeys.google || ''}
                            onChange={e => handleKeyChange('google', e.target.value)}
                            placeholder={t('settings.googleKeyPlaceholder')}
                        />
                        <p className="text-xs text-dim" style={{ marginTop: '6px' }}>
                            {t('settings.googleKeyHelp')} <span style={{ color: 'var(--accent-green)' }}>aistudio.google.com</span>
                        </p>
                    </div>

                    <div className="info-box info-box-accent">
                        💡 {lang === 'es'
                            ? 'Las API keys se guardan localmente en tu navegador. Nunca se envían a ningún servidor excepto al propio API provider.'
                            : 'API keys are stored locally in your browser. They are never sent to any server except the API provider itself.'}
                    </div>
                </motion.div>
            )}

            {/* ─── Account ─── */}
            {activeTab === 'account' && (
                <motion.div className="card flex-col gap-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div>
                        <span className="label">{t('settings.currentEmail')}: <span className="text-accent">{user?.email}</span></span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input ref={emailRef} className="input" style={{ flex: 1 }} placeholder={t('settings.newEmailPlaceholder')} />
                            <motion.button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                    if (emailRef.current?.value) {
                                        onUpdateEmail(emailRef.current.value);
                                        emailRef.current.value = '';
                                        showFeedback('✅');
                                    }
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {t('settings.changeBtn')}
                            </motion.button>
                        </div>
                    </div>

                    <div>
                        <span className="label">{t('settings.changePassword')}</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input ref={pwRef} className="input" type="password" style={{ flex: 1 }} placeholder={t('settings.newPasswordPlaceholder')} />
                            <motion.button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                    if (pwRef.current?.value) {
                                        onUpdatePassword(pwRef.current.value);
                                        pwRef.current.value = '';
                                        showFeedback('✅');
                                    }
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {t('settings.changeBtn')}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ─── Models ─── */}
            {activeTab === 'models' && (
                <motion.div className="card flex-col gap-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="text-sm text-dim">{t('settings.modelTip')}</p>
                    {Object.entries(config.models).map(([key, model]) => (
                        <div key={key}>
                            <span className="label">{model.label} — {t('settings.modelId')}</span>
                            <input
                                className="input input-mono"
                                value={model.id}
                                onChange={e => handleModelChange(key, e.target.value)}
                            />
                        </div>
                    ))}
                    <div className="info-box info-box-accent">
                        💡 {lang === 'es' ? 'Ej: "claude-sonnet-4-20250514" o "gemini-2.5-flash"' : 'E.g.: "claude-sonnet-4-20250514" or "gemini-2.5-flash"'}
                    </div>
                </motion.div>
            )}

            {/* ─── Language ─── */}
            {activeTab === 'lang' && (
                <motion.div className="card flex-col gap-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <span className="label">🌐 {t('settings.language')}</span>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <motion.button
                            className={`btn ${lang === 'en' ? 'btn-primary' : ''}`}
                            style={{ flex: 1, padding: '16px' }}
                            onClick={() => setLang('en')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            🇺🇸 {t('settings.langEn')}
                        </motion.button>
                        <motion.button
                            className={`btn ${lang === 'es' ? 'btn-primary' : ''}`}
                            style={{ flex: 1, padding: '16px' }}
                            onClick={() => setLang('es')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            🇪🇸 {t('settings.langEs')}
                        </motion.button>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
