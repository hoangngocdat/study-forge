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

2. Không được hiển thị quá trình suy nghĩ nội bộ.

3. TUYỆT ĐỐI KHÔNG viết hoặc tiết lộ:
   - "thinking process"
   - "chain of thought"
   - "reasoning"
   - "analysis"
   - "mental process"
   - "internal thoughts"
   - Các bước suy luận nội bộ của AI.
   
4. Chỉ trả về câu trả lời cuối cùng dành cho học sinh.

5. Nếu là bài toán:
   - Giải từng bước cần thiết.
   - Giải thích ngắn gọn, dễ hiểu.
   - Ghi rõ đáp án cuối cùng.
   - Không tự bịa dữ kiện.

6. Với công thức toán:
   - Có thể dùng LaTeX.
   - Công thức riêng một dòng dùng:
     $$...$$
   - Công thức nằm trong câu dùng:
     \\(...\\)

7. Không đặt toàn bộ câu trả lời trong code block.

8. Không tự thêm lời chào dài dòng.

9. Nếu đề bài không đủ dữ kiện, hãy nói rõ cần thêm dữ kiện nào.

10. Ưu tiên cách giải phù hợp với học sinh THCS/THPT Việt Nam.

11. Không mô tả việc bạn đang suy nghĩ hoặc lập kế hoạch trả lời.

12. Câu trả lời phải bắt đầu trực tiếp bằng nội dung hữu ích.

Ví dụ:

Bước 1: Xác định các hệ số.

$$a=1,\quad b=-5,\quad c=6$$

Bước 2: Tính biệt thức.

$$\\Delta=b^2-4ac=25-24=1$$

Bước 3: Tính nghiệm.

$$x=\\frac{-b\\pm\\sqrt{\\Delta}}{2a}$$

Suy ra:

$$x_1=3,\\quad x_2=2$$

Đáp án cuối cùng: $x=2$ hoặc $x=3$.

CHỈ TRẢ VỀ CÂU TRẢ LỜI CUỐI CÙNG.
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

        let reply =
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

        reply = reply.trim();

        // ===============================
        // REMOVE THINKING PROCESS
        // DỰ PHÒNG
        // ===============================

        const thinkingMarkers = [
            "Here's a thinking process:",
            "Here is a thinking process:",
            "Thinking process:",
            "Here's my thinking process:",
            "Here is my thinking process:",
            "Chain of thought:",
            "Reasoning:",
            "Internal reasoning:",
            "My reasoning:"
        ];

        for (
            const marker of thinkingMarkers
        ) {

            const index =
                reply
                    .toLowerCase()
                    .indexOf(
                        marker.toLowerCase()
                    );

            if (index !== -1) {

                /*
                 * Nếu AI có đoạn thinking process
                 * rồi mới đến câu trả lời,
                 * lấy phần sau đoạn đó.
                 */

                const afterMarker =
                    reply.slice(
                        index +
                        marker.length
                    ).trim();

                /*
                 * Nếu phía sau có phần
                 * "Final answer" thì lấy từ đó.
                 */

                const finalMarkers = [
                    "Final answer:",
                    "Final Answer:",
                    "Đáp án cuối cùng:",
                    "Câu trả lời cuối cùng:"
                ];

                let foundFinal =
                    false;

                for (
                    const finalMarker
                    of finalMarkers
                ) {

                    const finalIndex =
                        afterMarker
                            .toLowerCase()
                            .indexOf(
                                finalMarker
                                    .toLowerCase()
                            );

                    if (
                        finalIndex !== -1
                    ) {

                        reply =
                            afterMarker.slice(
                                finalIndex +
                                finalMarker.length
                            ).trim();

                        foundFinal =
                            true;

                        break;

                    }

                }

                if (!foundFinal) {

                    /*
                     * Nếu không tìm thấy
                     * "Final answer", dùng
                     * phần sau thinking.
                     */

                    reply =
                        afterMarker;

                }

                break;

            }

        }

        // ===============================
        // REMOVE <think>...</think>
        // DỰ PHÒNG CHO MỘT SỐ MODEL
        // ===============================

        reply =
            reply.replace(
                /<think>[\s\S]*?<\/think>/gi,
                ""
            ).trim();

        // ===============================
        // REMOVE REASONING BLOCK
        // ===============================

        reply =
            reply.replace(
                /<analysis>[\s\S]*?<\/analysis>/gi,
                ""
            ).trim();

        // ===============================
        // FINAL CHECK
        // ===============================

        if (!reply) {

            return res.status(500).json({
                error:
                    "AI không trả về câu trả lời cuối cùng."
            });

        }

        // ===============================
        // RETURN
        // ===============================

        return res.status(200).json({
            reply: reply
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
