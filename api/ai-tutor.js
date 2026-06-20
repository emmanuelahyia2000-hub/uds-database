// api/ai-tutor.js
module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).end();
    const { mode, selectedText, context } = req.body;
    
    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "qwen/qwen-2.5-coder-32b-instruct",
                messages: [{
                    role: "system", 
                    content: `You are the UDS Hub AI Tutor. Mode: ${mode}. Context: ${context}. Text: ${selectedText}`
                }]
            })
        });
        const data = await response.json();
        res.status(200).json({ reply: data.choices[0].message.content });
    } catch (e) {
        res.status(500).json({ error: "Failed to connect to AI Tutor." });
    }
};