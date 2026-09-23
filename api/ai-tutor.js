// api/ai-tutor.js
module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).end();
    const { mode, selectedText, context } = req.body;
    
    // --- TEMPORARY HEALTH CHECK LOGGING ---
    console.log("=== AI TUTOR HEALTH CHECK START ===");
    console.log("1. Request received at /api/ai-tutor");
    console.log(`2. Mode received: ${mode || 'UNDEFINED'}`);
    console.log(`3. Context length: ${context ? context.length : 0} characters`);
    console.log(`4. Selected text length: ${selectedText ? selectedText.length : 0} characters`);
    console.log(`5. Environment Variable (OPENROUTER_API_KEY) loaded: ${!!process.env.OPENROUTER_API_KEY}`);
    // --------------------------------------

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

        // --- TEMPORARY HEALTH CHECK LOGGING ---
        console.log(`6. OpenRouter response status: ${response.status} ${response.statusText}`);
        console.log("=== AI TUTOR HEALTH CHECK END ===");
        // --------------------------------------

        // Detailed error catch for bad OpenRouter responses (e.g., 401 Unauthorized, 402 Payment Required)
        if (!response.ok) {
            const errorText = await response.text();
            console.error("OpenRouter API Error Details:", errorText);
            return res.status(response.status).json({ 
                error: "OpenRouter connection failed.", 
                status: response.status,
                diagnostic_details: errorText 
            });
        }

        const data = await response.json();
        res.status(200).json({ reply: data.choices[0].message.content });
        
    } catch (e) {
        // Detailed error catch for Vercel/Node execution failures
        console.error("Vercel Execution Exception:", e.message);
        res.status(500).json({ 
            error: "Internal Server Execution Failed.",
            diagnostic_details: e.message
        });
    }
};