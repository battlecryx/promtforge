// ═══════════════════════════════════════════════════════
// PROMPT MASTER — API Integration Layer
// ═══════════════════════════════════════════════════════

/**
 * Call Claude (Anthropic) API
 * In dev: proxied via Vite (/api/claude -> api.anthropic.com)
 * In prod: requires a backend proxy or Firebase Cloud Function
 */
export async function callAnthropic(systemPrompt, userMessage, apiKey, modelId = 'claude-sonnet-4-6') {
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
export async function callGemini(systemPrompt, userMessage, apiKey, modelId = 'gemini-3.1-pro-preview') {
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
 * Call OpenAI API
 */
export async function callOpenAI(systemPrompt, userMessage, apiKey, modelId = 'gpt-5.4') {
    if (!apiKey) throw new Error('OpenAI API key not configured');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: modelId,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ],
            max_tokens: 2048,
        }),
    });

    if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`OpenAI API error ${res.status}: ${errBody || res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No response received';
}

/**
 * Call Perplexity API
 */
export async function callPerplexity(systemPrompt, userMessage, apiKey, modelId = 'sonar-reasoning-pro') {
    if (!apiKey) throw new Error('Perplexity API key not configured');

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: modelId,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ]
        }),
    });

    if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Perplexity API error ${res.status}: ${errBody || res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No response received';
}

/**
 * Call xAI (Grok) API
 */
export async function callXAI(systemPrompt, userMessage, apiKey, modelId = 'grok-4.20-beta') {
    if (!apiKey) throw new Error('xAI API key not configured');

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: modelId,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage }
            ]
        }),
    });

    if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`xAI API error ${res.status}: ${errBody || res.statusText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || 'No response received';
}

/**
 * Call the preferred model (auto-selects based on available keys)
 */
export async function callModel(provider, systemPrompt, userMessage, apiKeys, models) {
    if (provider === 'anthropic') {
        return callAnthropic(systemPrompt, userMessage, apiKeys.anthropic || apiKeys.claude, models);
    } else if (provider === 'google') {
        return callGemini(systemPrompt, userMessage, apiKeys.google, models);
    } else if (provider === 'openai') {
        return callOpenAI(systemPrompt, userMessage, apiKeys.openai, models);
    } else if (provider === 'perplexity') {
        return callPerplexity(systemPrompt, userMessage, apiKeys.perplexity, models);
    } else if (provider === 'xai') {
        return callXAI(systemPrompt, userMessage, apiKeys.xai, models);
    }
    throw new Error(`Unknown provider: ${provider}`);
}

// ═══════════════════════════════════════════════════════
// DYNAMIC MODEL FETCHING
// ═══════════════════════════════════════════════════════

// Fallback manual lists just in case
const FALLBACKS = {
    openai: ['gpt-5.4', 'gpt-5.4-pro', 'gpt-5.1', 'o3-mini', 'gpt-4.1', 'gpt-4o'],
    anthropic: ['claude-sonnet-4-6', 'claude-opus-4-6', 'claude-sonnet-4-5', 'claude-opus-4-5'],
    google: ['gemini-3.1-pro-preview', 'gemini-3.1-flash-lite-preview', 'gemini-2.5-pro', 'gemini-2.5-flash'],
    perplexity: ['sonar-reasoning-pro', 'sonar-pro', 'sonar', 'sonar-deep-research'],
    xai: ['grok-4.20-beta', 'grok-4.1-fast', 'grok-3-mini']
};

export async function fetchProviderModels(provider, apiKey) {
    if (!apiKey) return FALLBACKS[provider] || [];

    try {
        if (provider === 'openai') {
            const res = await fetch('https://api.openai.com/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (!res.ok) return FALLBACKS[provider];
            const data = await res.json();
            // Filter to only text generation models, essentially gpt and o-series
            const models = data.data
                .map(m => m.id)
                .filter(id => id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3'))
                .sort((a, b) => b.localeCompare(a)); // simple sort for newer on top
            return models.length > 0 ? models : FALLBACKS[provider];
        }

        if (provider === 'google') {
            const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (!res.ok) return FALLBACKS[provider];
            const data = await res.json();
            const models = data.models
                .map(m => m.name.replace('models/', ''))
                .filter(id => id.startsWith('gemini'))
                .sort((a, b) => b.localeCompare(a));
            return models.length > 0 ? models : FALLBACKS[provider];
        }

        if (provider === 'anthropic') {
            const isDev = import.meta.env.DEV;
            const baseUrl = isDev ? '/api/claude' : 'https://api.anthropic.com';
            const res = await fetch(`${baseUrl}/v1/models`, {
                headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' }
            });
            if (!res.ok) return FALLBACKS[provider];
            const data = await res.json();
            const models = data.data.map(m => m.id).sort((a,b) => b.localeCompare(a));
            return models.length > 0 ? models : FALLBACKS[provider];
        }

        // Perplexity & xAI don't have standard /v1/models endpoints exposed clearly in API docs for automatic fetching
        // We rely on the fallbacks for them, but returning the promise structure for unity
        return FALLBACKS[provider] || [];

    } catch (e) {
        console.warn(`Failed to fetch dynamic models for ${provider}, using fallbacks:`, e);
        return FALLBACKS[provider] || [];
    }
}
