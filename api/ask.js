export default async function handler(req, res) {
    // Chỉ cho phép POST
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { message } = req.body || {};

        // Kiểm tra câu hỏi
        if (
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                error: "Bạn chưa nhập câu hỏi."
            });
        }

        // Lấy API key từ Vercel Environment Variables
        const apiKey = process.env.AI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "Chưa cấu hình AI_API_KEY trên Vercel."
            });
        }

        // Gọi OpenRouter
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiKey}`,
                    "X-Title": "StudyForge"
                },

                body: JSON.stringify({
                    model: "openrouter/free",

                    messages: [
                        {
                            role: "system",
                            content:
                                "Bạn là StudyForge AI, trợ lý học tập thân thiện. " +
                                "Hãy giải thích rõ ràng, dễ hiểu, ưu tiên từng bước. " +
                                "Nếu là bài toán, hãy trình bày cách giải và đáp án. " +
                                "Nếu đề thiếu dữ kiện, hãy nói rõ."
                        },

                        {
                            role: "user",
                            content: message.trim()
                        }
                    ]
                })
            }
        );

        const data = await response.json();

        // OpenRouter trả lỗi
        if (!response.ok) {
            console.error("OpenRouter error:", data);

            return res.status(response.status).json({
                error:
                    data?.error?.message ||
                    "AI không thể trả lời lúc này."
            });
        }

        const reply =
            data?.choices?.[0]?.message?.content;

        if (!reply) {
            return res.status(500).json({
                error: "AI không trả về câu trả lời."
            });
        }

        return res.status(200).json({
            reply: reply
        });

    } catch (error) {

        console.error("Server error:", error);

        return res.status(500).json({
            error: "Có lỗi xảy ra khi kết nối AI."
        });
    }
}
