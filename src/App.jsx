import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from './i18n/LanguageContext';
import { DEFAULT_CONFIG } from './utils/prompts';
import GlobalTargetModal from './components/GlobalTargetModal';
import OptimizerView from './views/OptimizerView';
import ArenaView from './views/ArenaView';
import MediaStudio from './views/MediaStudio';
import TemplatesView from './views/TemplatesView';
import LibraryView from './views/LibraryView';
import SettingsPanel from './views/SettingsPanel';
import { auth, googleProvider, db } from './utils/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    signOut, 
    onAuthStateChanged,
    updatePassword,
    updateEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, onSnapshot } from 'firebase/firestore';

// ─── localStorage helpers ───
function lsGet(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
    catch { return fallback; }
}
function lsSet(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch { }
}

// ─── View metadata ───
const NAV_ITEMS = [
    { id: 'optimize', icon: '⚡', viewIcon: '⚡' },
    { id: 'seo', icon: '🔍', viewIcon: '🔍' },
    { id: 'arena', icon: '⚔️', viewIcon: '⚔️' },
    { id: 'media', icon: '🎨', viewIcon: '🎨' },
    { id: 'templates', icon: '📋', viewIcon: '📋' },
    { id: 'library', icon: '📚', viewIcon: '📚' },
];

const VIEW_TITLES = {
    en: { optimize: 'Prompt Optimizer', seo: 'SEO Content Builder', arena: 'Model Arena', media: 'Media Studio', templates: 'Prompt Templates', library: 'Prompt Library' },
    es: { optimize: 'Optimizador de Prompts', seo: 'SEO Content Builder', arena: 'Arena de Modelos', media: 'Media Studio', templates: 'Plantillas de Prompts', library: 'Librería de Prompts' },
};

const VIEW_DESCS = {
    en: { optimize: 'Transform any prompt into a professional-grade one', seo: 'Generate SEO-optimized content prompts', arena: 'Compare Claude vs Gemini side by side', media: 'Generate AI images & video scripts', templates: 'Ready-to-use prompts by category', library: 'Your saved and optimized prompts' },
    es: { optimize: 'Transforma cualquier prompt en uno profesional', seo: 'Genera prompts optimizados para SEO', arena: 'Compara Claude vs Gemini lado a lado', media: 'Genera imágenes AI y scripts de vídeo', templates: 'Prompts listos para usar por categoría', library: 'Tus prompts guardados y optimizados' },
};

// ─── Page transition variants ───
const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 100 } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } },
};

export default function App() {
    const { lang, setLang, t } = useLanguage();

    // ─── State ───
    const [user, setUser] = useState(null);
    const [authScreen, setAuthScreen] = useState('login');
    const [authForm, setAuthForm] = useState({ name: '', email: '', password: '', newPassword: '' });
    const [authError, setAuthError] = useState('');
    const [authLoading, setAuthLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    const [view, setView] = useState('optimize');
    const [config, setConfig] = useState({ ...DEFAULT_CONFIG, activeProvider: 'openai' });
    const [apiKeys, setApiKeys] = useState({ claude: '', google: '', openai: '', perplexity: '', xai: '' });
    const [library, setLibrary] = useState([]);
    const [arenaVotes, setArenaVotes] = useState({});
    const [showSettings, setShowSettings] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isModelModalOpen, setIsModelModalOpen] = useState(false); // Global Modal state

    // Shared input state (so templates can set it)
    const [sharedInput, setSharedInput] = useState('');

    // ─── Init ───
    useEffect(() => {
        setApiKeys(lsGet('pm_apikeys', { claude: '', google: '', openai: '', perplexity: '', xai: '' }));
        setArenaVotes(lsGet('pm_arena_votes', {}));
        const cfg = lsGet('pm_config');
        if (cfg) setConfig(prev => ({ ...prev, ...cfg, models: { ...prev.models, ...(cfg.models || {}) } }));

        // Load local library first for instant display
        setLibrary(lsGet('pm_library', []));

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                // Fetch user data from Firestore
                const userRef = doc(db, 'users', currentUser.uid);
                const userSnap = await getDoc(userRef);
                
                let userData = {
                    uid: currentUser.uid,
                    email: currentUser.email,
                    name: currentUser.displayName || currentUser.email.split('@')[0],
                };

                if (userSnap.exists()) {
                    userData = { ...userData, ...userSnap.data() };
                } else {
                    // Create basic profile if it doesn't exist (e.g., first Google Login)
                    await setDoc(userRef, userData, { merge: true });
                }
                
                setUser(userData);

                // Sync library from Firestore
                const libraryRef = collection(db, 'users', currentUser.uid, 'library');
                onSnapshot(libraryRef, (snapshot) => {
                    const cloudLib = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    // Merge and sort by date descending
                    const mergedLib = [...cloudLib].sort((a, b) => b.createdAt - a.createdAt);
                    setLibrary(mergedLib);
                    lsSet('pm_library', mergedLib); // Update local cache
                });

            } else {
                setUser(null);
            }
            setInitialLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // ─── Auth ───
    const handleAuth = async (action) => {
        setAuthError('');
        setAuthLoading(true);
        const { name, email, password } = authForm;

        try {
            if (action === 'google') {
                const result = await signInWithPopup(auth, googleProvider);
                // The onAuthStateChanged will handle setting the user and checking Firestore
            } else {
                if (!email || !password) throw new Error(t('auth.emailPasswordRequired'));
                
                if (action === 'register') {
                    if (!name) throw new Error(t('auth.nameRequired'));
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    
                    // Save additional user info to Firestore
                    await setDoc(doc(db, 'users', userCredential.user.uid), {
                        name: name,
                        email: email,
                        createdAt: Date.now()
                    });
                } else if (action === 'login') {
                    await signInWithEmailAndPassword(auth, email, password);
                } else if (action === 'recover') {
                    // (Assuming you will implement sendPasswordResetEmail later if needed, 
                    // or keeping the mock logic for now to avoid breaking existing UI too much)
                    throw new Error("Recuperación de contraseña vía email no implementada aún.");
                }
            }
        } catch (error) {
            console.error(error);
            // Translate common Firebase errors
            if (error.code === 'auth/email-already-in-use') setAuthError(t('auth.emailExists') || 'Email already exists');
            else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') setAuthError(t('auth.invalidCredentials') || 'Invalid credentials');
            else setAuthError(error.message);
        } finally {
            setAuthLoading(false);
        }
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setAuthForm({ name: '', email: '', password: '', newPassword: '' });
            setLibrary([]); // Clear library from memory on logout
        } catch (error) {
            console.error("Error logging out", error);
        }
    };

    // ─── API Key management ───
    const saveApiKeys = useCallback((keys) => {
        setApiKeys(keys);
        lsSet('pm_apikeys', keys);
    }, []);

    const saveConfig = useCallback((newConfig) => {
        setConfig(newConfig);
        lsSet('pm_config', newConfig);
    }, []);

    // ─── Library ───
    const saveToLibrary = useCallback(async (original, optimizedText, category = 'general') => {
        const item = { 
            original, 
            optimized: optimizedText, 
            category, 
            createdAt: Date.now(), 
            user: user?.name || 'Anon' 
        };
        
        // Optimistic local update
        const id = Date.now().toString(); 
        const newLib = [{ id, ...item }, ...library];
        setLibrary(newLib);
        lsSet('pm_library', newLib);

        // Sync to Firestore if logged in
        if (user && user.uid) {
            try {
                const docRef = doc(collection(db, 'users', user.uid, 'library'));
                await setDoc(docRef, item);
            } catch (err) {
                console.error("Error saving to cloud library", err);
            }
        }
    }, [library, user]);

    const deleteFromLibrary = useCallback(async (id) => {
        // ... (This function needs refactoring to delete from firestore, keep simple for now or mock)
        console.warn("Delete from cloud library not fully implemented yet");
        const newLib = library.filter(l => l.id !== id);
        setLibrary(newLib);
        lsSet('pm_library', newLib);
    }, [library]);

    // ─── Arena Votes ───
    const handleVote = useCallback((winner) => {
        const newVotes = { ...arenaVotes, [winner]: (arenaVotes[winner] || 0) + 1, total: (arenaVotes.total || 0) + 1 };
        setArenaVotes(newVotes);
        lsSet('pm_arena_votes', newVotes);
    }, [arenaVotes]);

    // ─── Use template ───
    const handleUseTemplate = useCallback((prompt, targetView) => {
        setSharedInput(prompt);
        setView(targetView);
    }, []);

    // ─── Account updates ───
    const handleUpdateEmail = useCallback((newEmail) => {
        if (!newEmail || !user) return;
        const newUser = { ...user, email: newEmail };
        localStorage.removeItem(`pm_user_${user.email}`);
        lsSet(`pm_user_${newEmail}`, newUser);
        lsSet('pm_session', { email: newEmail });
        setUser(newUser);
    }, [user]);

    const handleUpdatePassword = useCallback((newPw) => {
        if (!newPw || !user) return;
        const updated = { ...user, password: newPw };
        lsSet(`pm_user_${user.email}`, updated);
        setUser(updated);
    }, [user]);

    // ═══ RENDER: Loading ═══
    if (initialLoading) {
        return (
            <div className="auth-screen">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} style={{ textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', margin: '0 auto 14px', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-glow)' }}>
                        <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div className="loading-spinner" style={{ margin: '0 auto' }} />
                    <p className="text-sm text-dim" style={{ marginTop: '14px' }}>{t('common.loading')}</p>
                </motion.div>
            </div>
        );
    }

    // ═══ RENDER: Auth ═══
    if (!user) {
        return (
            <div className="auth-screen">
                <motion.div className="auth-card card-glass" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                        <motion.div 
                            style={{ width: '70px', height: '70px', margin: '0 auto 14px', borderRadius: '20px', overflow: 'hidden', boxShadow: 'var(--shadow-glow)' }} 
                            animate={{ y: [0, -6, 0] }} 
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </motion.div>
                        <h1 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 4px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{t('auth.title')}</h1>
                        <p className="text-sm text-dim">{t('auth.subtitle')}</p>
                    </div>

                    {/* Language toggle on auth */}
                    <div className="lang-toggle" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                        <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
                        <button className={lang === 'es' ? 'active' : ''} onClick={() => setLang('es')}>ES</button>
                    </div>

                    {/* Auth Tabs */}
                    <div style={{ display: 'flex', marginBottom: '20px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
                        {['login', 'register', 'recover'].map(tab => (
                            <button key={tab} onClick={() => { setAuthScreen(tab); setAuthError(''); }} style={{
                                flex: 1, padding: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                background: authScreen === tab ? 'var(--accent-primary)' : 'transparent',
                                color: authScreen === tab ? '#fff' : 'var(--text-tertiary)',
                                fontFamily: 'var(--font-sans)', transition: 'all 0.2s',
                            }}>
                                {t(`auth.${tab}`)}
                            </button>
                        ))}
                    </div>

                    {/* Form */}
                    <div className="flex-col gap-md">
                        {authScreen === 'register' && (
                            <div>
                                <span className="label">{t('auth.name')}</span>
                                <input className="input" value={authForm.name} onChange={e => setAuthForm(p => ({ ...p, name: e.target.value }))} placeholder={t('auth.namePlaceholder')} />
                            </div>
                        )}
                        <div>
                            <span className="label">{t('auth.email')}</span>
                            <input className="input" type="email" value={authForm.email} onChange={e => setAuthForm(p => ({ ...p, email: e.target.value }))} placeholder={t('auth.emailPlaceholder')} />
                        </div>
                        <div>
                            <span className="label">{t('auth.password')}</span>
                            <input className="input" type="password" value={authForm.password} onChange={e => setAuthForm(p => ({ ...p, password: e.target.value }))} placeholder={t('auth.passwordPlaceholder')} />
                        </div>
                        {authScreen === 'recover' && (
                            <div>
                                <span className="label">{t('auth.newPassword')}</span>
                                <input className="input" type="password" value={authForm.newPassword} onChange={e => setAuthForm(p => ({ ...p, newPassword: e.target.value }))} placeholder={t('auth.passwordPlaceholder')} />
                            </div>
                        )}

                        {authError && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="info-box info-box-red">
                                ⚠️ {authError}
                            </motion.div>
                        )}

                        <motion.button
                            className="btn btn-primary"
                            style={{ width: '100%', marginTop: '4px' }}
                            onClick={() => handleAuth(authScreen)}
                            disabled={authLoading}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {authLoading ? <><span className="loading-spinner" /> {t('auth.loading')}</> : t(`auth.${authScreen}Btn`)}
                        </motion.button>
                        
                        {(authScreen === 'login' || authScreen === 'register') && (
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0' }}>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
                                    <span style={{ padding: '0 10px', fontSize: '12px', color: 'var(--text-tertiary)' }}>O</span>
                                    <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }}></div>
                                </div>
                                <motion.button
                                    className="btn"
                                    style={{ width: '100%', background: 'var(--surface-variant)', border: '1px solid var(--border-subtle)' }}
                                    onClick={() => handleAuth('google')}
                                    disabled={authLoading}
                                    whileHover={{ scale: 1.02, background: 'var(--surface-hover)' }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '18px', height: '18px', marginRight: '8px' }} />
                                    {lang === 'es' ? 'Continuar con Google' : 'Continue with Google'}
                                </motion.button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        );
    }

    // ═══ RENDER: Main App ═══
    return (
        <div className="app-layout">
            {/* Ambient */}
            <div className="ambient-bg ambient-blob-1" />
            <div className="ambient-bg ambient-blob-2" />

            {/* Global Modals */}
            <AnimatePresence>
                {isModelModalOpen && (
                    <GlobalTargetModal
                        isOpen={isModelModalOpen}
                        onClose={() => setIsModelModalOpen(false)}
                        apiKeys={apiKeys}
                        saveApiKeys={saveApiKeys}
                        config={config}
                        saveConfig={saveConfig}
                    />
                )}
            </AnimatePresence>

            {/* Mobile Overlay */}
            <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

            {/* Sidebar */}
            <motion.aside
                className={`sidebar ${sidebarOpen ? 'open' : ''}`}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
                <div className="sidebar-logo">
                    <div className="sidebar-logo-icon">
                        <img src="/logo.png" alt="Logo" />
                    </div>
                    <div className="sidebar-logo-text">
                        <h1>Prompt Master</h1>
                        <p>v1.0</p>
                    </div>
                </div>

                <div style={{ marginTop: '20px', padding: '0 12px', marginBottom: '16px' }}>
                    <motion.div 
                        onClick={() => setIsModelModalOpen(true)}
                        className="btn"
                        style={{ width: '100%', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)' }}
                        whileHover={{ scale: 1.02, background: 'rgba(255,255,255,0.06)' }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{lang === 'es' ? 'MOTOR:' : 'ENGINE:'}</span>
                            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>{config.activeProvider.toUpperCase()}</span>
                        </div>
                        <span style={{ fontSize: '14px' }}>⚙️</span>
                    </motion.div>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(item => (
                        <motion.button
                            key={item.id}
                            className={`sidebar-item ${view === item.id ? 'active' : ''}`}
                            onClick={() => { setView(item.id); setShowSettings(false); setSidebarOpen(false); }}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            <span className="sidebar-item-icon">{item.icon}</span>
                            {t(`nav.${item.id === 'optimize' ? 'optimize' : item.id}`)}
                        </motion.button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <motion.button className="sidebar-item" onClick={() => { setShowSettings(true); setSidebarOpen(false); }} whileHover={{ x: 4 }}>
                        <span className="sidebar-item-icon">⚙️</span>
                        {t('nav.settings')}
                    </motion.button>
                    <motion.button className="sidebar-item" onClick={handleLogout} whileHover={{ x: 4 }}>
                        <span className="sidebar-item-icon">🚪</span>
                        {t('nav.logout')}
                    </motion.button>
                </div>
            </motion.aside>

            {/* Main */}
            <main className="main-content">
                {/* Header */}
                <header className="main-header">
                    <div className="main-header-left">
                        <button className="btn btn-icon mobile-menu-btn" onClick={() => setSidebarOpen(true)}>☰</button>
                        <div>
                            <h2>{showSettings ? t('settings.title') : (VIEW_TITLES[lang] || VIEW_TITLES.en)[view]}</h2>
                            <p className="text-sm text-dim">{showSettings ? '' : (VIEW_DESCS[lang] || VIEW_DESCS.en)[view]}</p>
                        </div>
                    </div>
                    <div className="main-header-actions">
                        <div className="lang-toggle">
                            <button className={lang === 'en' ? 'active' : ''} onClick={() => setLang('en')}>EN</button>
                            <button className={lang === 'es' ? 'active' : ''} onClick={() => setLang('es')}>ES</button>
                        </div>
                        <div className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                            {t('header.greeting')}, <span style={{ color: 'var(--text-accent)' }}>{user.name}</span>
                        </div>
                    </div>
                </header>

                {/* Content */}
                <AnimatePresence mode="wait">
                    {showSettings ? (
                        <motion.div key="settings" className="view-container" {...pageVariants}>
                            <SettingsPanel
                                apiKeys={apiKeys}
                                saveApiKeys={saveApiKeys}
                                config={config}
                                saveConfig={saveConfig}
                                user={user}
                                onUpdateEmail={handleUpdateEmail}
                                onUpdatePassword={handleUpdatePassword}
                                onClose={() => setShowSettings(false)}
                            />
                        </motion.div>
                    ) : (
                        <motion.div key={view} className="view-container" {...pageVariants}>
                            {view === 'optimize' && (
                                <OptimizerView
                                    config={config}
                                    apiKeys={apiKeys}
                                    saveToLibrary={saveToLibrary}
                                    sharedInput={sharedInput}
                                    clearSharedInput={() => setSharedInput('')}
                                />
                            )}
                            {view === 'seo' && (
                                <SEOBuilder
                                    config={config}
                                    apiKeys={apiKeys}
                                    saveToLibrary={saveToLibrary}
                                />
                            )}
                            {view === 'arena' && (
                                <ArenaView
                                    config={config}
                                    apiKeys={apiKeys}
                                    arenaVotes={arenaVotes}
                                    handleVote={handleVote}
                                    saveToLibrary={saveToLibrary}
                                    sharedInput={sharedInput}
                                    clearSharedInput={() => setSharedInput('')}
                                />
                            )}
                            {view === 'media' && (
                                <MediaStudio
                                    config={config}
                                    apiKeys={apiKeys}
                                    saveToLibrary={saveToLibrary}
                                />
                            )}
                            {view === 'templates' && (
                                <TemplatesView onUseTemplate={handleUseTemplate} />
                            )}
                            {view === 'library' && (
                                <LibraryView
                                    library={library}
                                    deleteFromLibrary={deleteFromLibrary}
                                    onUseTemplate={handleUseTemplate}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer */}
                <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Prompt Master V1 · by Nacho · Claude + Gemini</p>
                </div>
            </main>
        </div>
    );
}
