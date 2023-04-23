// Create a custom renderer for marked
const renderer = new marked.Renderer();
renderer.code = function (code, language) {
    const validLang = language && hljs.getLanguage(language) ? language : 'python';
    const highlightedCode = hljs.highlight(validLang, code).value;
    return `<pre><code class="hljs ${language}">${highlightedCode}</code></pre>`;
};

let isFirstMessage = true;
// Set the custom renderer for marked
marked.setOptions({ renderer });

document.addEventListener("DOMContentLoaded", () => {
    const chatForm = document.getElementById("chat-form");
    const chatContent = document.getElementById("chat-content");
    const input = document.getElementById("input");

    chatForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const question = input.value;
        if (!question) return;

        appendMessage("user", question, false);
        input.value = "";
        if (isFirstMessage) {
            appendMessage("bot", "The First Message takes a while to load as the server is sleeping....", false);
            isFirstMessage = false;
        }
        // wait for a second before showing the loading dots
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const loadingMessage = appendMessage("bot", createLoadingDots());

        const response = await fetch("/ask", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ question }),
        });

        const data = await response.json();
        updateMessage(loadingMessage, data.answer, false);
    });
    function createLoadingDots() {
        return `<div class="loading-dots">
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                  <div></div>
                </div>`;
    }

    function appendMessage(cssClass, text, loading) {
        const messageWrapper = document.createElement("div");
        messageWrapper.classList.add("message-wrapper", cssClass);

        const message = document.createElement("div");
        message.classList.add("message");
        if (loading) {
            message.innerHTML = text;
        } else {
            message.innerHTML = marked.parse(text);
        }

        messageWrapper.appendChild(message);
        chatContent.appendChild(messageWrapper);
        chatContent.scrollTop = chatContent.scrollHeight;
        return message;
    }
    function updateMessage(message, text, loading) {


        message.innerHTML = marked.parse(text);

        chatContent.scrollTop = chatContent.scrollHeight;
    }
});
