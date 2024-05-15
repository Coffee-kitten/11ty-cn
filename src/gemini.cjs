const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs").promises;
const readline = require('readline');

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function run() {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Enter the file path you want to translate: ', async (filePath) => {
        rl.close();

        try {
            const markdownContent = await fs.readFile(filePath, "utf8");

            const prompt = "Translate the following content into Chinese. Only the content does not translate the code. If markdown metadata exists, do not translate the content inside. Return it to me in original code format\n" + markdownContent;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = await response.text();

            await fs.writeFile("translated.txt", text, "utf8");
            console.log("OK");
        } catch (error) {
            console.error("Error:", error);
        }
    });
}

run();
