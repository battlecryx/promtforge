import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';

const FILTER_OPTIONS = ['all', 'general', 'medical', 'crypto', 'dev', 'design', 'seo', 'marketing'];

export default function LibraryView({ library, deleteFromLibrary, onUseTemplate }) {
    const { t } = useLanguage();
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [copyFeedback, setCopyFeedback] = useState(null);

    const filtered = useMemo(() => {
        let items = library;
        if (filter !== 'all') items = items.filter(l => l.category === filter);
        if (search) {
            const q = search.toLowerCase();
            items = items.filter(l => l.original.toLowerCase().includes(q) || l.optimized.toLowerCase().includes(q));
        }
        return items;
    }, [library, filter, search]);

    const copyTo = (text, id) => {
        navigator.clipboard.writeText(text);
        setCopyFeedback(id);
        setTimeout(() => setCopyFeedback(null), 1500);
    };

    return (
        <div className="flex-col gap-md">
            {/* Search & Filter */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <input
                    className="input"
                    style={{ flex: 1, minWidth: '200px' }}
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={`🔍 ${t('library.searchPlaceholder')}`}
                />
                <select className="input" style={{ width: 'auto' }} value={filter} onChange={e => setFilter(e.target.value)}>
                    {FILTER_OPTIONS.map(f => (
                        <option key={f} value={f}>{t(`library.${f}`)}</option>
                    ))}
                </select>
            </motion.div>

            {/* Empty State */}
            {filtered.length === 0 ? (
                <motion.div className="card empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="empty-state-icon">📚</div>
                    <h3 style={{ fontSize: '16px', marginBottom: '6px' }}>{t('library.emptyTitle')}</h3>
                    <p>{t('library.emptyDesc')}</p>
                </motion.div>
            ) : (
                <AnimatePresence>
                    {filtered.map((item, i) => (
                        <motion.div
                            key={item.id}
                            className="card"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ delay: i * 0.03 }}
                            layout
                        >
                            {/* Meta */}
                            <div className="text-xs text-dim" style={{ marginBottom: '8px' }}>
                                {new Date(item.createdAt).toLocaleDateString()} · {item.user} · <span className="tag" style={{ marginLeft: '4px' }}>{item.category}</span>
                            </div>

                            {/* Original */}
                            <div className="text-sm" style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>
                                <strong>{t('library.original')}:</strong>{' '}
                                {item.original.length > 120 ? item.original.substring(0, 120) + '...' : item.original}
                            </div>

                            {/* Optimized */}
                            <div className="code-block" style={{ maxHeight: '160px', fontSize: '12px' }}>
                                {item.optimized}
                            </div>

                            {/* Actions */}
                            <div className="btn-group" style={{ marginTop: '12px' }}>
                                <motion.button className="btn btn-sm" onClick={() => copyTo(item.optimized, item.id)} whileTap={{ scale: 0.95 }}>
                                    {copyFeedback === item.id ? '✅' : '📋'} {t('library.copyBtn')}
                                </motion.button>
                                <motion.button className="btn btn-sm" onClick={() => onUseTemplate(item.original, 'optimize')} whileTap={{ scale: 0.95 }}>
                                    🔄 {t('library.reoptimize')}
                                </motion.button>
                                <motion.button className="btn btn-sm" onClick={() => onUseTemplate(item.optimized, 'arena')} whileTap={{ scale: 0.95 }}>
                                    ⚔️ {t('library.arenaBtn')}
                                </motion.button>
                                <motion.button className="btn btn-sm btn-danger" onClick={() => deleteFromLibrary(item.id)} whileTap={{ scale: 0.95 }}>
                                    🗑️ {t('library.deleteBtn')}
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            )}
        </div>
    );
}
