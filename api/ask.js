export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Method not allowed"
        });
    }

    try {
        const { message } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({
                error: "Bạn chưa nhập câu hỏi."
            });
        }

        // AI sẽ được kết nối ở bước Vercel
        return res.status(200).json({
            reply: "API StudyForge đã nhận câu hỏi: " + message
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Lỗi máy chủ."
        });
    }
}
