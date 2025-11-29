"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class OpenRouterClient {
    constructor() {
        this.apiKey = process.env.OPENROUTER_API_KEY;
        this.base = process.env.OPENROUTER_BASE_URL || 'https://api.openrouter.ai/v1';
    }
    async callChat(prompt, systemPrompt) {
        if (!this.apiKey)
            throw new Error('OPENROUTER_API_KEY not configured');
        const body = {
            model: process.env.OPENROUTER_MODEL || 'gpt-4o-mini',
            input: `${systemPrompt ? systemPrompt + '\n' : ''}${prompt}`,
            max_output_tokens: 512,
        };
        const fetchFn = globalThis.fetch;
        if (!fetchFn)
            throw new Error('Global fetch not available. Please set OPENROUTER_API_KEY and ensure a fetch implementation is available in your runtime (node 18+ or polyfill).');
        const res = await fetchFn(`${this.base}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const txt = await res.text();
            throw new Error(`OpenRouter error: ${res.status} ${txt}`);
        }
        const json = await res.json();
        // Expect an output field (depending on model, adjust as needed)
        // We support either text or structured output in `outputs` or `completion`
        const reply = json?.output ?? json?.outputs?.[0]?.content ?? json?.completion ?? JSON.stringify(json);
        return { raw: json, reply: typeof reply === 'string' ? reply : JSON.stringify(reply) };
    }
}
exports.default = OpenRouterClient;
