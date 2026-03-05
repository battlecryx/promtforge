import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import TEMPLATES, { CATEGORIES } from '../data/templates';

export default function TemplatesView({ onUseTemplate }) {
    const { t, lang } = useLanguage();
    const templates = useMemo(() => TEMPLATES[lang] || TEMPLATES.en, [lang]);

    return (
        <div className="flex-col gap-lg">
            {CATEGORIES.map((cat, catIdx) => {
                const catTemplates = templates.filter(tp => tp.cat === cat.id);
                if (catTemplates.length === 0) return null;
                return (
                    <motion.div
                        key={cat.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: catIdx * 0.05 }}
                    >
                        <div className="category-header">
                            <span>{cat.icon}</span>
                            {t(`templates.categories.${cat.id}`)}
                        </div>
                        <div className="flex-col gap-sm">
                            {catTemplates.map((tp, i) => (
                                <motion.div
                                    key={tp.id}
                                    className="card template-card"
                                    initial={{ opacity: 0, x: -8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: catIdx * 0.05 + i * 0.03 }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                                        <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{tp.icon} {tp.name}</span>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            {tp.tags.map(tag => (
                                                <span key={tag} className="tag">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-sm text-dim" style={{ lineHeight: '1.6', marginBottom: '12px' }}>{tp.prompt}</div>
                                    <div className="btn-group">
                                        <motion.button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => onUseTemplate(tp.prompt, 'optimize')}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            ⚡ {t('templates.optimizeBtnShort')}
                                        </motion.button>
                                        <motion.button
                                            className="btn btn-sm"
                                            onClick={() => onUseTemplate(tp.prompt, 'arena')}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            ⚔️ {t('templates.arenaBtn')}
                                        </motion.button>
                                        <motion.button
                                            className="btn btn-sm btn-xs"
                                            onClick={() => navigator.clipboard.writeText(tp.prompt)}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            📋
                                        </motion.button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
