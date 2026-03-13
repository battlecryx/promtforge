import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

const TABS = ['account', 'lang'];

export default function SettingsPanel({ config, saveConfig, user, onUpdateEmail, onUpdatePassword, onClose }) {
    const { t, lang, setLang } = useLanguage();
    const [activeTab, setActiveTab] = useState('account');
    const [saveFeedback, setSaveFeedback] = useState('');
    const emailRef = useRef(null);
    const pwRef = useRef(null);

    const showFeedback = (msg) => {
        setSaveFeedback(msg);
        setTimeout(() => setSaveFeedback(''), 2000);
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
                        {tab === 'account' ? '👤' : '🌐'}{' '}
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
