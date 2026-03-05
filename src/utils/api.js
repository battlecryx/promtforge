// ═══════════════════════════════════════════════════════
// PROMPT MASTER — API Integration Layer
// ═══════════════════════════════════════════════════════

/**
 * Call Claude (Anthropic) API
 * In dev: proxied via Vite (/api/claude -> api.anthropic.com)
 * In prod: requires a backend proxy or Firebase Cloud Function
 */
export async function callClaude(systemPrompt, userMessage, apiKey, modelId = 'claude-sonnet-4-20250514') {
    if (!apiKey) throw new Error('Claude API key not configured');

    const isDev = import.meta.env.DEV;
    const baseUrl = isDev ? '/api/claude' : 'https://api.anthropic.com';

    const res = await fetch(`${baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: modelId,
            max_tokens: 2048,
            system: systemPrompt,
            messages: [{ role: 'user', content: userMessage }],
        }),
    });

    if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Claude API error ${res.status}: ${errBody || res.statusText}`);
    }

    const data = await res.json();
    return data.content?.map(b => b.text || '').join('\n').trim() || '';
}

/**
 * Call Gemini (Google) API
 * Works directly from the browser — no proxy needed
 */
export async function callGemini(systemPrompt, userMessage, apiKey, modelId = 'gemini-2.5-flash') {
    if (!apiKey) throw new Error('Gemini API key not configured');

    const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: systemPrompt }] },
                contents: [{ parts: [{ text: userMessage }] }],
                generationConfig: { maxOutputTokens: 2048 },
            }),
        }
    );

    if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Gemini API error ${res.status}: ${errBody || res.statusText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'No response received';
}

/**
 * Call the preferred model (auto-selects based on available keys)
 */
export async function callModel(provider, systemPrompt, userMessage, apiKeys, models) {
    if (provider === 'claude' || provider === 'anthropic') {
        return callClaude(systemPrompt, userMessage, apiKeys.claude, models?.claude?.id);
    } else if (provider === 'gemini' || provider === 'google') {
        return callGemini(systemPrompt, userMessage, apiKeys.google, models?.gemini?.id);
    }
    throw new Error(`Unknown provider: ${provider}`);
}
