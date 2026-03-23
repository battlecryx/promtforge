// ═══════════════════════════════════════════════════════
// PROMPT MASTER — System Prompts & Technique Bank
// ═══════════════════════════════════════════════════════

export const DEFAULT_CONFIG = {
    models: {
        anthropic: { id: 'claude-sonnet-4-6', label: 'Claude 4.6 Sonnet', provider: 'anthropic', color: '#a78bfa' },
        google: { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', provider: 'google', color: '#34d399' },
        openai: { id: 'gpt-5.4', label: 'ChatGPT 5.4', provider: 'openai', color: '#fca5a5' },
        perplexity: { id: 'sonar-pro', label: 'Sonar Pro', provider: 'perplexity', color: '#25ced1' },
        xai: { id: 'grok-4.20-beta', label: 'Grok 4.20 Beta', provider: 'xai', color: '#000000' }
    },
    techniqueBank: [
        { id: 'role', name: 'Role Assignment', nameEs: 'Asignación de Rol', icon: '🎯', desc: 'Assign a relevant expert', descEs: 'Asigna un experto relevante', prompt: 'Assign a specific expert persona relevant to the task.' },
        { id: 'cot', name: 'Chain of Thought', nameEs: 'Cadena de Pensamiento', icon: '🔗', desc: 'Step-by-step reasoning', descEs: 'Razonamiento paso a paso', prompt: 'Instruct the model to think step-by-step before answering.' },
        { id: 'scaffold', name: 'Output Scaffolding', nameEs: 'Estructura de Salida', icon: '📐', desc: 'Defined format & structure', descEs: 'Estructura y formato definido', prompt: 'Define exact format, length, sections, and structure of the output.' },
        { id: 'negative', name: 'Negative Constraints', nameEs: 'Restricciones Negativas', icon: '🚫', desc: 'What to avoid', descEs: 'Qué evitar', prompt: 'Explicitly state what to avoid, what NOT to do.' },
        { id: 'fewshot', name: 'Few-Shot Examples', nameEs: 'Ejemplos Few-Shot', icon: '📝', desc: 'Input/output examples', descEs: 'Ejemplos de entrada/salida', prompt: 'Include 1-2 example input/output pairs when helpful.' },
        { id: 'meta', name: 'Meta-Instructions', nameEs: 'Meta-Instrucciones', icon: '🔍', desc: 'Self-verification', descEs: 'Auto-verificación', prompt: 'Add self-checking: "Before responding, verify that..."' },
        { id: 'tone', name: 'Tone & Audience', nameEs: 'Tono y Audiencia', icon: '🎨', desc: 'Tone and audience', descEs: 'Tono y audiencia', prompt: 'Specify tone, reading level, and target audience explicitly.' },
        { id: 'context', name: 'Context Injection', nameEs: 'Inyección de Contexto', icon: '⚙️', desc: 'Added context', descEs: 'Contexto añadido', prompt: 'Add relevant background context and constraints.' },
        { id: 'decompose', name: 'Task Decomposition', nameEs: 'Descomposición', icon: '🧩', desc: 'Break into subtasks', descEs: 'Dividir en subtareas', prompt: 'Break complex tasks into labeled sub-steps.' },
        { id: 'prefill', name: 'Output Priming', nameEs: 'Preparación de Salida', icon: '✨', desc: 'Prime the response', descEs: 'Iniciar la respuesta', prompt: 'Provide the beginning of the desired output format to prime the model.' },
    ],
};

/**
 * Build the optimization system prompt with optional outcome focus and mode context
 */
export function buildOptimizationPrompt(techniques, expectedOutcome = '', mode = 'standard') {
    const techInstructions = techniques.map((t, i) => `${i + 1}. **${t.name}**: ${t.prompt}`).join('\n');

    const outcomeSection = expectedOutcome
        ? `\n\nEXPECTED OUTCOME FOCUS:\nThe user has specified they want the final output to achieve: "${expectedOutcome}"\nMake sure the optimized prompt explicitly instructs the AI to produce this exact type of result.`
        : '';

    let modeRules = '';
    switch(mode) {
        case 'creative':
            modeRules = '- The optimized prompt must focus on storytelling, creative angles, vivid details, and emotional resonance.';
            break;
        case 'coding':
            modeRules = '- The optimized prompt must demand clean architecture, comments, edge cases handling, and specific technology stacks.';
            break;
        case 'analysis':
            modeRules = '- The optimized prompt must request data structuring, identification of trends, statistical reasoning, and actionable insights.';
            break;
        case 'research':
            modeRules = '- The optimized prompt must instruct the model to gather comprehensive facts, cite sources, list pros/cons, and synthesize complex information.';
            break;
        default:
            modeRules = '- Make the optimized prompt highly specific, clear, and actionable.';
    }

    return `You are an elite prompt engineer. Transform the user's rough prompt into a highly optimized, production-grade prompt.

Apply ALL these techniques:
${techInstructions}
${outcomeSection}

CRITICAL RULES:
- Respond with ONLY the optimized prompt text
- No explanations, no preamble, no markdown code fences
- The output must be ready to copy-paste directly into any AI
- Write the optimized prompt in the SAME LANGUAGE as the original
- Make it significantly better than the original while preserving the user's intent
${modeRules}`;
}

export const COACH_SYSTEM = `You are a prompt engineering teacher. The user will give you an original prompt and its optimized version. Explain EACH improvement made, why it matters, and what technique was applied. Be educational but concise. Use the SAME LANGUAGE as the prompts. Format as a numbered list of changes with brief explanations. Max 8 items.`;

export const ANALYSIS_SYSTEM = `Analyze the given prompt quality. Respond ONLY in valid JSON (no markdown, no fences):
{"score":85,"weaknesses":["issue 1","issue 2","issue 3"],"strengths":["strength 1","strength 2","strength 3"],"suggestions":["actionable tip 1","actionable tip 2"]}
Score 0-100. Max 3 per array. Under 50 chars each. Respond in the same language as the prompt.`;

/**
 * Build SEO-specific content prompt
 */
export function buildSEOPrompt(fields) {
    const { pageType, industry, keywords, audience, tone, cta, lang = 'en' } = fields;

    const langInstruction = lang === 'es'
        ? 'Responde completamente en ESPAÑOL.'
        : 'Respond entirely in ENGLISH.';

    return `You are an expert SEO content strategist and web copywriter. Create a comprehensive, optimized content brief and copy for the following:

PAGE TYPE: ${pageType}
INDUSTRY: ${industry}
TARGET KEYWORDS: ${keywords}
TARGET AUDIENCE: ${audience}
TONE: ${tone}
PRIMARY CTA: ${cta}

${langInstruction}

Generate the following sections:

1. **SEO Meta Tags**
   - Title Tag (50-60 chars, include primary keyword)
   - Meta Description (150-160 chars, compelling + keyword)
   - H1 Tag

2. **Page Structure**
   - Hero Section (headline + subheadline + CTA)
   - 3-5 Key Sections with H2 headings (keyword-optimized)
   - Content outline for each section (2-3 bullet points)

3. **Copy Recommendations**
   - Opening hook paragraph
   - Key value propositions (3-5)
   - Social proof suggestions
   - Final CTA section copy

4. **Technical SEO Notes**
   - Internal linking suggestions
   - Image alt text recommendations
   - Schema markup type recommendation
   - Page speed considerations

5. **Content Strategy**
   - Related blog topics (3-5)
   - Long-tail keyword variations (5-8)
   - FAQ section (4-6 questions)

Make every piece of content optimized for both search engines and human readers. The copy should be compelling, conversion-focused, and naturally incorporate the target keywords.`;
}
