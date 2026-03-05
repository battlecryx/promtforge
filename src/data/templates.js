// ═══════════════════════════════════════════════════════
// PROMPT MASTER — Template Bank (8 Categories)
// ═══════════════════════════════════════════════════════

const TEMPLATES = {
    en: [
        // ─── Developer ───
        { id: 'dev1', cat: 'dev', icon: '💻', name: 'App Architecture', prompt: 'Design the architecture for a web application about [description]. Stack: React + [backend]. Include: folder structure, main components, database schema, and API endpoints.', tags: ['architecture', 'react', 'web'] },
        { id: 'dev2', cat: 'dev', icon: '🐛', name: 'Assisted Debugging', prompt: 'I have this error in my code: [error]. The relevant code is: [code]. Explain: what causes it, how to fix it step by step, and how to prevent it from happening again.', tags: ['debug', 'error', 'code'] },
        { id: 'dev3', cat: 'dev', icon: '🚀', name: 'Performance Optimization', prompt: 'Optimize this code/component for performance: [code]. Analyze: bottlenecks, memory usage, unnecessary calls, and provide the optimized version with explanations.', tags: ['optimization', 'performance'] },
        { id: 'dev4', cat: 'dev', icon: '📖', name: 'Code Documentation', prompt: 'Generate comprehensive documentation for this code: [code]. Include: overview, function descriptions, parameters, return values, usage examples, and edge cases.', tags: ['docs', 'documentation'] },

        // ─── Design ───
        { id: 'des1', cat: 'design', icon: '🎨', name: 'UI/UX Redesign', prompt: 'Redesign the UI/UX for [app/page description]. Current problems: [issues]. Target audience: [audience]. Provide: layout suggestions, color palette, typography, and interaction patterns.', tags: ['ui', 'ux', 'redesign'] },
        { id: 'des2', cat: 'design', icon: '🖼️', name: 'Brand Identity', prompt: 'Create a brand identity guide for [company/project]. Include: logo concept, color scheme (with hex codes), typography pairings, visual style, tone of voice, and usage guidelines.', tags: ['branding', 'identity'] },
        { id: 'des3', cat: 'design', icon: '📱', name: 'Mobile App Design', prompt: 'Design a mobile app interface for [purpose]. Include: key screens, navigation flow, component library suggestions, and accessibility considerations. Style: [modern/minimal/bold].', tags: ['mobile', 'app', 'interface'] },

        // ─── Medical ───
        { id: 'med1', cat: 'medical', icon: '🏥', name: 'Prepare Medical Visit', prompt: 'Help me prepare for a medical appointment. I want a list of important questions to ask my doctor about [condition/symptom], including treatment options, side effects, and follow-up care.', tags: ['appointment', 'questions', 'doctor'] },
        { id: 'med2', cat: 'medical', icon: '💊', name: 'Research Medication', prompt: 'Explain in simple language the medication [name]. I want to know: what it\'s for, common side effects, dangerous interactions, and what to ask my pharmacist.', tags: ['medication', 'pharmacy'] },
        { id: 'med3', cat: 'medical', icon: '📋', name: 'Health Summary', prompt: 'Help me organize my medical history. I have these conditions, medications, and recent appointments: [details]. Create a clear summary I can share with a new doctor.', tags: ['history', 'summary'] },

        // ─── SEO & Web ───
        { id: 'seo1', cat: 'seo', icon: '🔍', name: 'Landing Page SEO', prompt: 'Create SEO-optimized content for a landing page about [product/service]. Include: meta title, meta description, H1-H3 structure, hero copy, feature sections, and CTA. Target keyword: [keyword].', tags: ['landing', 'seo', 'content'] },
        { id: 'seo2', cat: 'seo', icon: '📝', name: 'Blog Post SEO', prompt: 'Write an SEO-optimized blog post outline about [topic]. Include: keyword strategy, title options, meta description, H2/H3 structure, intro hook, and CTA. Target audience: [audience]. Length: 1500-2000 words.', tags: ['blog', 'content', 'keywords'] },
        { id: 'seo3', cat: 'seo', icon: '🏪', name: 'E-Commerce Product', prompt: 'Write SEO-optimized product descriptions for [product]. Include: compelling title, bullet-point features, detailed description, meta tags, and JSON-LD schema suggestions. Keywords: [keywords].', tags: ['ecommerce', 'product'] },

        // ─── Marketing & Copywriting ───
        { id: 'mkt1', cat: 'marketing', icon: '📣', name: 'Ad Copy Generator', prompt: 'Create ad copy for [product/service] on [platform: Google/Facebook/Instagram]. Target: [audience]. Include: 3 headline variations, 2 description variations, CTA options. Tone: [tone]. Budget-conscious.', tags: ['ads', 'copy', 'social'] },
        { id: 'mkt2', cat: 'marketing', icon: '📧', name: 'Email Sequence', prompt: 'Design a 5-email marketing sequence for [goal: launch/nurture/conversion]. Product: [product]. Audience: [audience]. Include: subject lines, preview text, body outline, and CTA for each email.', tags: ['email', 'sequence', 'marketing'] },
        { id: 'mkt3', cat: 'marketing', icon: '📱', name: 'Social Media Plan', prompt: 'Create a 1-week social media content plan for [brand/product]. Platforms: [Instagram/Twitter/LinkedIn]. Include: post ideas, captions, hashtag strategy, and best posting times. Voice: [tone].', tags: ['social', 'content', 'plan'] },

        // ─── Education ───
        { id: 'edu1', cat: 'education', icon: '📚', name: 'Explain Concept', prompt: 'Explain [complex topic] as if teaching a [level: beginner/intermediate/advanced]. Use analogies, examples, and visual descriptions. Break it into digestible sections with key takeaways.', tags: ['explain', 'learn', 'concept'] },
        { id: 'edu2', cat: 'education', icon: '📝', name: 'Study Guide', prompt: 'Create a comprehensive study guide for [subject/exam]. Include: key concepts, summary of each topic, practice questions, mnemonics, and recommended study schedule.', tags: ['study', 'guide', 'exam'] },
        { id: 'edu3', cat: 'education', icon: '🎓', name: 'Lesson Plan', prompt: 'Design a lesson plan for teaching [topic] to [audience]. Duration: [time]. Include: learning objectives, engagement activities, assessment methods, and supplementary resources.', tags: ['lesson', 'teaching', 'plan'] },

        // ─── Business ───
        { id: 'biz1', cat: 'business', icon: '💼', name: 'Business Proposal', prompt: 'Write a business proposal for [project/service]. Client: [target]. Include: executive summary, problem statement, proposed solution, timeline, pricing structure, and expected outcomes.', tags: ['proposal', 'client'] },
        { id: 'biz2', cat: 'business', icon: '📊', name: 'Market Analysis', prompt: 'Conduct a market analysis for [industry/product]. Include: market size, growth trends, key competitors (with strengths/weaknesses), target audience segments, and opportunity areas.', tags: ['analysis', 'market', 'research'] },
        { id: 'biz3', cat: 'business', icon: '📈', name: 'Presentation Deck', prompt: 'Create a presentation outline for [topic/pitch]. Audience: [who]. Include: slide-by-slide breakdown, key talking points, data visualization suggestions, and a compelling closing.', tags: ['presentation', 'pitch'] },

        // ─── Creative Writing ───
        { id: 'cre1', cat: 'creative', icon: '✍️', name: 'Blog Article', prompt: 'Write an engaging blog article about [topic]. Target audience: [who]. Tone: [tone]. Length: [word count]. Include: hook intro, subheadings, practical examples, and actionable conclusion.', tags: ['blog', 'article', 'writing'] },
        { id: 'cre2', cat: 'creative', icon: '📖', name: 'Story Outline', prompt: 'Create a story outline for a [genre] story. Theme: [theme]. Include: main characters with motivations, 3-act structure, key plot points, conflict, climax, and resolution.', tags: ['story', 'fiction', 'outline'] },
        { id: 'cre3', cat: 'creative', icon: '🎬', name: 'Video Script', prompt: 'Write a video script for a [duration]-minute YouTube video about [topic]. Include: hook (first 10 seconds), intro, 3-5 main points with transitions, B-roll suggestions, and CTA.', tags: ['video', 'script', 'youtube'] },
    ],

    es: [
        // ─── Developer ───
        { id: 'dev1', cat: 'dev', icon: '💻', name: 'Arquitectura de App', prompt: 'Diseña la arquitectura para una aplicación web de [descripción]. Stack: React + [backend]. Incluye: estructura de carpetas, componentes principales, esquema de base de datos y API endpoints.', tags: ['arquitectura', 'react', 'web'] },
        { id: 'dev2', cat: 'dev', icon: '🐛', name: 'Debug Asistido', prompt: 'Tengo este error en mi código: [error]. El código relevante es: [código]. Explícame: qué causa el error, cómo solucionarlo paso a paso, y cómo prevenir que ocurra de nuevo.', tags: ['debug', 'error', 'código'] },
        { id: 'dev3', cat: 'dev', icon: '🚀', name: 'Optimizar Rendimiento', prompt: 'Optimiza este código/componente para rendimiento: [código]. Analiza: cuellos de botella, uso de memoria, llamadas innecesarias, y proporciona la versión optimizada con explicación.', tags: ['optimización', 'rendimiento'] },
        { id: 'dev4', cat: 'dev', icon: '📖', name: 'Documentar Código', prompt: 'Genera documentación completa para este código: [código]. Incluye: overview, descripción de funciones, parámetros, valores de retorno, ejemplos de uso y casos edge.', tags: ['docs', 'documentación'] },

        // ─── Design ───
        { id: 'des1', cat: 'design', icon: '🎨', name: 'Rediseño UI/UX', prompt: 'Rediseña la UI/UX de [app/página]. Problemas actuales: [problemas]. Audiencia: [audiencia]. Incluye: sugerencias de layout, paleta de colores, tipografía y patrones de interacción.', tags: ['ui', 'ux', 'rediseño'] },
        { id: 'des2', cat: 'design', icon: '🖼️', name: 'Identidad de Marca', prompt: 'Crea una guía de identidad de marca para [empresa/proyecto]. Incluye: concepto de logo, esquema de colores (con hex), tipografías, estilo visual, tono de voz y guías de uso.', tags: ['branding', 'identidad'] },
        { id: 'des3', cat: 'design', icon: '📱', name: 'Diseño App Móvil', prompt: 'Diseña la interfaz de una app móvil para [propósito]. Incluye: pantallas clave, flujo de navegación, componentes sugeridos y consideraciones de accesibilidad. Estilo: [moderno/minimal/bold].', tags: ['móvil', 'app', 'interfaz'] },

        // ─── Medical ───
        { id: 'med1', cat: 'medical', icon: '🏥', name: 'Preparar Cita Médica', prompt: 'Necesito prepararme para una cita médica. Quiero una lista de preguntas importantes para hacerle al doctor sobre [condición/síntoma], incluyendo opciones de tratamiento, efectos secundarios y seguimiento.', tags: ['citas', 'preguntas', 'doctor'] },
        { id: 'med2', cat: 'medical', icon: '💊', name: 'Investigar Medicamento', prompt: 'Explícame en lenguaje simple el medicamento [nombre]. Quiero saber: para qué sirve, efectos secundarios comunes, interacciones peligrosas y qué preguntar a mi farmacéutico.', tags: ['medicamento', 'farmacia'] },
        { id: 'med3', cat: 'medical', icon: '📋', name: 'Resumen de Historial', prompt: 'Ayúdame a organizar mi historial médico. Tengo las siguientes condiciones, medicamentos y citas recientes: [detalles]. Crea un resumen claro que pueda compartir con un nuevo doctor.', tags: ['historial', 'resumen'] },

        // ─── SEO & Web ───
        { id: 'seo1', cat: 'seo', icon: '🔍', name: 'SEO Landing Page', prompt: 'Crea contenido optimizado para SEO para una landing page sobre [producto/servicio]. Incluye: meta título, meta descripción, estructura H1-H3, copy del hero, secciones y CTA. Keyword: [keyword].', tags: ['landing', 'seo', 'contenido'] },
        { id: 'seo2', cat: 'seo', icon: '📝', name: 'Blog Post SEO', prompt: 'Escribe un outline de blog post optimizado para SEO sobre [tema]. Incluye: estrategia de keywords, opciones de título, meta description, estructura H2/H3, intro hook y CTA. Audiencia: [audiencia].', tags: ['blog', 'contenido', 'keywords'] },
        { id: 'seo3', cat: 'seo', icon: '🏪', name: 'Producto E-Commerce', prompt: 'Escribe descripciones optimizadas para SEO para [producto]. Incluye: título compelling, features en bullet points, descripción detallada, meta tags y sugerencias de schema JSON-LD. Keywords: [keywords].', tags: ['ecommerce', 'producto'] },

        // ─── Marketing ───
        { id: 'mkt1', cat: 'marketing', icon: '📣', name: 'Copy para Ads', prompt: 'Crea copy publicitario para [producto/servicio] en [plataforma: Google/Facebook/Instagram]. Target: [audiencia]. Incluye: 3 variaciones de headline, 2 descripciones, opciones de CTA. Tono: [tono].', tags: ['ads', 'copy', 'social'] },
        { id: 'mkt2', cat: 'marketing', icon: '📧', name: 'Secuencia de Emails', prompt: 'Diseña una secuencia de 5 emails de marketing para [objetivo: lanzamiento/nurture/conversión]. Producto: [producto]. Audiencia: [audiencia]. Incluye: asuntos, preview text, cuerpo y CTA por email.', tags: ['email', 'secuencia', 'marketing'] },
        { id: 'mkt3', cat: 'marketing', icon: '📱', name: 'Plan Redes Sociales', prompt: 'Crea un plan de contenido semanal para redes sociales de [marca/producto]. Plataformas: [Instagram/Twitter/LinkedIn]. Incluye: ideas de posts, captions, estrategia de hashtags y mejores horarios.', tags: ['social', 'contenido', 'plan'] },

        // ─── Education ───
        { id: 'edu1', cat: 'education', icon: '📚', name: 'Explicar Concepto', prompt: 'Explica [tema complejo] como si enseñaras a un [nivel: principiante/intermedio/avanzado]. Usa analogías, ejemplos y descripciones visuales. Divide en secciones con puntos clave.', tags: ['explicar', 'aprender', 'concepto'] },
        { id: 'edu2', cat: 'education', icon: '📝', name: 'Guía de Estudio', prompt: 'Crea una guía de estudio completa para [materia/examen]. Incluye: conceptos clave, resumen por tema, preguntas de práctica, mnemotécnicos y cronograma de estudio recomendado.', tags: ['estudio', 'guía', 'examen'] },
        { id: 'edu3', cat: 'education', icon: '🎓', name: 'Plan de Lección', prompt: 'Diseña un plan de lección para enseñar [tema] a [audiencia]. Duración: [tiempo]. Incluye: objetivos de aprendizaje, actividades, métodos de evaluación y recursos complementarios.', tags: ['lección', 'enseñanza', 'plan'] },

        // ─── Business ───
        { id: 'biz1', cat: 'business', icon: '💼', name: 'Propuesta de Negocio', prompt: 'Escribe una propuesta de negocio para [proyecto/servicio]. Cliente: [target]. Incluye: resumen ejecutivo, problema, solución propuesta, timeline, estructura de precios y resultados esperados.', tags: ['propuesta', 'cliente'] },
        { id: 'biz2', cat: 'business', icon: '📊', name: 'Análisis de Mercado', prompt: 'Realiza un análisis de mercado de [industria/producto]. Incluye: tamaño del mercado, tendencias, competidores (fortalezas/debilidades), segmentos de audiencia y áreas de oportunidad.', tags: ['análisis', 'mercado'] },
        { id: 'biz3', cat: 'business', icon: '📈', name: 'Presentación Deck', prompt: 'Crea un outline de presentación para [tema/pitch]. Audiencia: [quién]. Incluye: desglose slide por slide, puntos clave, sugerencias de visualización de datos y cierre compelling.', tags: ['presentación', 'pitch'] },

        // ─── Creative Writing ───
        { id: 'cre1', cat: 'creative', icon: '✍️', name: 'Artículo de Blog', prompt: 'Escribe un artículo de blog engaging sobre [tema]. Audiencia: [quién]. Tono: [tono]. Largo: [palabras]. Incluye: intro hook, subtítulos, ejemplos prácticos y conclusión accionable.', tags: ['blog', 'artículo', 'escritura'] },
        { id: 'cre2', cat: 'creative', icon: '📖', name: 'Outline de Historia', prompt: 'Crea un outline para una historia de [género]. Tema: [tema]. Incluye: personajes principales con motivaciones, estructura en 3 actos, puntos de trama, conflicto, clímax y resolución.', tags: ['historia', 'ficción'] },
        { id: 'cre3', cat: 'creative', icon: '🎬', name: 'Guión de Video', prompt: 'Escribe un guión para un video de YouTube de [duración] minutos sobre [tema]. Incluye: hook (primeros 10 segundos), intro, 3-5 puntos principales con transiciones, sugerencias de B-roll y CTA.', tags: ['video', 'guión', 'youtube'] },
    ],
};

export const CATEGORIES = [
    { id: 'dev', icon: '💻' },
    { id: 'design', icon: '🎨' },
    { id: 'medical', icon: '🏥' },
    { id: 'seo', icon: '🔍' },
    { id: 'marketing', icon: '📣' },
    { id: 'education', icon: '📚' },
    { id: 'business', icon: '💼' },
    { id: 'creative', icon: '✍️' },
];

export default TEMPLATES;
