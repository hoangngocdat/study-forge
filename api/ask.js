export default async function handler(req, res) {
    // ===============================
    // METHOD
    // ===============================

    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        // ===============================
        // GET MESSAGE
        // ===============================

        const { message } = req.body || {};

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                error: "Bạn chưa nhập câu hỏi."
            });
        }

        // ===============================
        // API KEY
        // ===============================

        const apiKey =
            process.env.AI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error:
                    "Chưa cấu hình AI_API_KEY trên Vercel."
            });
        }

        // ===============================
        // SYSTEM PROMPT
        // ===============================

        const systemPrompt = `
Bạn là StudyForge AI, trợ lý học tập dành cho học sinh Việt Nam.

QUY TẮC BẮT BUỘC:

1. Luôn trả lời bằng tiếng Việt, trừ khi người dùng yêu cầu ngôn ngữ khác.

2. Không sử dụng tiếng Nhật, tiếng Trung hoặc ký tự ngẫu nhiên không liên quan.

3. Nếu là bài toán:
   - Giải từng bước.
   - Giải thích ngắn gọn, dễ hiểu.
   - Ghi rõ đáp án cuối cùng.
   - Không tự bịa dữ kiện.

4. Với công thức toán:
   - Có thể dùng LaTeX.
   - Công thức riêng một dòng dùng:
     $$...$$
   - Công thức nằm trong câu dùng:
     \\(...\\)
   - Không dùng các định dạng LaTeX không cần thiết.

5. Không viết các ký hiệu Markdown bị lỗi.
6. Không đặt toàn bộ câu trả lời trong code block.
7. Không tự thêm lời chào dài dòng.
8. Nếu đề bài không đủ dữ kiện, hãy nói rõ cần thêm dữ kiện nào.
9. Ưu tiên cách giải phù hợp với học sinh THCS/THPT Việt Nam.

Ví dụ định dạng:

Bước 1: Xác định các hệ số.

$$a=1,\quad b=-5,\quad c=6$$

Bước 2: Tính biệt thức.

$$\\Delta=b^2-4ac$$

Bước 3: Kết luận.

$$x=2\\quad\\text{hoặc}\\quad x=3$$

Đáp án cuối cùng phải rõ ràng.
`;

        // ===============================
        // OPENROUTER
        // ===============================

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${apiKey}`,

                    "HTTP-Referer":
                        "https://studyforge.vercel.app",

                    "X-Title":
                        "StudyForge"
                },

                body: JSON.stringify({
                    model: "openrouter/free",

                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        },

                        {
                            role: "user",
                            content:
                                message.trim()
                        }
                    ],

                    temperature: 0.3,

                    max_tokens: 1200
                })
            }
        );

        // ===============================
        // READ RESPONSE
        // ===============================

        const data =
            await response.json();

        // ===============================
        // OPENROUTER ERROR
        // ===============================

        if (!response.ok) {

            console.error(
                "OpenRouter error:",
                data
            );

            return res
                .status(response.status)
                .json({
                    error:
                        data?.error?.message ||
                        "AI không thể trả lời lúc này."
                });
        }

        // ===============================
        // GET AI REPLY
        // ===============================

        const reply =
            data?.choices?.[0]?.message?.content;

        if (
            typeof reply !== "string" ||
            !reply.trim()
        ) {

            console.error(
                "Invalid AI response:",
                data
            );

            return res.status(500).json({
                error:
                    "AI không trả về câu trả lời."
            });
        }

        // ===============================
        // RETURN
        // ===============================

        return res.status(200).json({
            reply: reply.trim()
        });

    } catch (error) {

        console.error(
            "Server error:",
            error
        );

        return res.status(500).json({
            error:
                "Có lỗi xảy ra khi kết nối AI."
        });
    }
}
