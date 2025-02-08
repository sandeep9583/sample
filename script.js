// Reader

let isEdge = /Edg\//.test(navigator.userAgent);
        let utterance = new SpeechSynthesisUtterance();
        let allWords = [];
        let allWordElements = [];
        let currentWordIndex = 0;
        let isPaused = false;
        let mainContainer;

        function loadEdgeVoice() {
            let voices = speechSynthesis.getVoices();
            let edgeVoice = voices.find(voice => voice.name === "Microsoft Emma Online (Natural) - English (United States)");
            if (edgeVoice) utterance.voice = edgeVoice;
        }

        document.addEventListener("DOMContentLoaded", function() {
            if (!isEdge) return;
            speechSynthesis.onvoiceschanged = loadEdgeVoice;

            let pageContent = document.querySelector(".page-content");
            if (!pageContent) return;

            let controls = document.createElement("div");
            controls.className = "tts-controls";
            controls.innerHTML = `
                <button onclick="togglePlayPause()">▶️ Play/Pause</button>
                <button onclick="stopSpeech()">⏹ Stop</button>
                <label for="speed">Speed:</label>
                <input type="range" id="speed" min="0.5" max="2" step="0.1" value="1" onchange="changeSpeed(this.value)">
            `;

            pageContent.insertAdjacentElement("afterend", controls);
            initializeContent("page-content");
        });

        function initializeContent(containerClass) {
            mainContainer = document.querySelector('.' + containerClass);
            if (!mainContainer) return;

            let textNodes = getAllTextNodes(mainContainer);
            allWords = [];
            allWordElements = [];

            textNodes.forEach(textNode => {
                let parent = textNode.parentNode;
                let text = textNode.textContent.trim();
                let words = text.split(/\s+/).filter(word => word.length > 0);

                let fragment = document.createDocumentFragment();

                words.forEach(word => {
                    let span = document.createElement('span');
                    span.textContent = word + ' ';
                    span.addEventListener('click', (e) => {
                        e.stopPropagation();
                        let index = allWordElements.indexOf(span);
                        if (index !== -1) {
                            startSpeakingFromIndex(index);
                        }
                    });
                    fragment.appendChild(span);
                    allWordElements.push(span);
                    allWords.push(word);
                });

                parent.replaceChild(fragment, textNode);
            });
        }

        function getAllTextNodes(element) {
            let textNodes = [];
            function getTextNodes(node) {
                if (node.nodeType === 3) {
                    let text = node.textContent.trim();
                    if (text) textNodes.push(node);
                } else {
                    for (let child of node.childNodes) {
                        getTextNodes(child);
                    }
                }
            }
            getTextNodes(element);
            return textNodes;
        }

        function startSpeakingFromIndex(startIndex) {
            isPaused = false;
            currentWordIndex = startIndex;
            speakText();
        }

        function speakText() {
            if (isPaused) {
                isPaused = false;
                speechSynthesis.resume();
                return;
            }

            utterance.text = allWords.slice(currentWordIndex).join(' ');
            utterance.rate = document.getElementById('speed').value;

            utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    highlightWord(currentWordIndex);
                    currentWordIndex++;
                }
            };

            utterance.onend = () => {
                allWordElements.forEach(span => span.classList.remove('highlight'));
            };

            speechSynthesis.cancel();
            speechSynthesis.speak(utterance);
        }

        function highlightWord(index) {
            allWordElements.forEach(span => span.classList.remove('highlight'));
            if (allWordElements[index]) {
                allWordElements[index].classList.add('highlight');
                allWordElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        function togglePlayPause() {
            if (speechSynthesis.speaking && !isPaused) {
                speechSynthesis.pause();
                isPaused = true;
            } else {
                speakText();
            }
        }

        function stopSpeech() {
            speechSynthesis.cancel();
            allWordElements.forEach(span => span.classList.remove('highlight'));
            isPaused = false;
            currentWordIndex = 0;
        }

        function changeSpeed(value) {
            let wasPlaying = speechSynthesis.speaking && !isPaused;
            utterance.rate = value;
            if (wasPlaying) {
                let currentPosition = currentWordIndex;
                speechSynthesis.cancel();
                currentWordIndex = currentPosition;
                speakText();
            }
        }








// Hex decoding function (place this outside or at the top of your script)
function hexDecode(hexString) {
    let decodedString = '';
    for (let i = 0; i < hexString.length; i += 2) {
        const hexPair = hexString.substring(i, i + 2);
        const decimalValue = parseInt(hexPair, 16);
        decodedString += String.fromCharCode(decimalValue);
    }
    return decodedString;
}

// Hex encoded Gemini API key
const geminiHexApiKey = "41497A615379443031414D6c527367427A326344436551674F6953396857724F5054426F686D6F";
const geminiApiKey = hexDecode(geminiHexApiKey);
const decodedApiKey = geminiApiKey; // Use Gemini API Key

// chat
document.addEventListener('DOMContentLoaded', function () {
    // 1) Capture the text from .page-content.clearfix, but do not display it in chat
    const pageContentDiv = document.querySelector('div.page-content.clearfix');
    let hiddenContext = '';
    if (pageContentDiv) {
        hiddenContext = pageContentDiv.innerText;
        console.log('Captured Page Content (hidden):', hiddenContext);
    }

    // 2) Avatars
    let userAvatarImage = null;
    let assistantAvatarSrc = 'https://img.icons8.com/?size=100&id=59023&format=png&color=000000'; // Example assistant avatar

    const loadUserAvatar = () => {
        const avatarInBody = document.querySelector('.avatar');
        if (avatarInBody) {
            const avatarSrc = avatarInBody.src;
            userAvatarImage = document.createElement('img');
            userAvatarImage.className = 'avatar';
            userAvatarImage.src = avatarSrc;
            userAvatarImage.alt = avatarInBody.alt || 'Avatar';
            userAvatarImage.style.width = '30px';
            userAvatarImage.style.height = '30px';
        } else {
            console.log('No user avatar found. Will proceed without it.');
        }
    };

    // 3) Session storage for chat messages (array of outerHTML strings)
    let chatMessages = [];

    // 4) Track whether chat was previously open
    const wasChatOpen = sessionStorage.getItem('isChatOpen') === 'true';

    // Store the original body content before opening chat
    let originalBodyContent = null;

    // --------- 6) CONFIGURE A CUSTOM MARKDOWN RENDERER ---------
    const customRenderer = {
        heading(text, level) {
            return `<div class="md-h${level}">${text}</div>`;
        },
        paragraph(text) {
            return `<div class="md-p">${text}</div>`;
        },
        list(body, ordered) {
            const type = ordered ? 'ol' : 'ul';
            return `<${type} class="md-list">${body}</${type}>`;
        },
        listitem(text) {
            return `<li class="md-li">${text}</li>`;
        },
        blockquote(quote) {
            return `<blockquote class="md-blockquote">${quote}</blockquote>`;
        },
        strong(text) {
            return `<strong class="md-strong">${text}</strong>`;
        },
        em(text) {
            return `<em class="md-em">${text}</em>`;
        },
        codespan(text) {
            return `<code class="md-code">${text}</code>`;
        },
        code(code, language) {
            return `<pre class="md-pre"><code>${code}</code></pre>`;
        },
        hr() {
            return `<hr class="md-hr">`;
        },
        link(href, title, text) {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<a href="${href}" class="md-link"${titleAttr} rel="noopener noreferrer">${text}</a>`;
        },
        image(href, title, text) {
            const titleAttr = title ? ` title="${title}"` : '';
            return `<img src="${href}" alt="${text}"${titleAttr} class="md-img">`;
        },
    };

    // Create "Hive Chat" toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Hive Chat';
    toggleButton.classList.add('btn-hive-chat');
    document.body.appendChild(toggleButton);

    // This function will open the chat UI
    function openChatUI() {
        // Mark chat as open in sessionStorage
        sessionStorage.setItem('isChatOpen', 'true');

        // Store the original body content
        originalBodyContent = document.body.innerHTML;

        // Main chat wrapper
        const wrapper = document.createElement('div');
        wrapper.classList.add('chat-wrapper');

        // Left section (only for desktop)
        const leftSection = document.createElement('div');
        leftSection.classList.add('left-section');

        // Right section (chat UI)
        const rightSection = document.createElement('div');
        rightSection.classList.add('right-section');

        // Chat header
        const chatHeader = document.createElement('div');
        chatHeader.classList.add('chat-header');
        const headerTitle = document.createElement('h2');
        headerTitle.classList.add('chat-header-title');
        headerTitle.textContent = 'Hive Chat';

        // Close button
        const closeButton = document.createElement('button');
        closeButton.classList.add('btn-close');
        closeButton.textContent = 'X';
        closeButton.addEventListener('click', function () {
            // Restore the original body content
            document.body.innerHTML = originalBodyContent;
            // Re-append the toggle button (it was part of the original content)
            document.body.appendChild(toggleButton);
            // Clear session storage for "isChatOpen"
            sessionStorage.removeItem('isChatOpen');
        });
        chatHeader.appendChild(headerTitle);
        chatHeader.appendChild(closeButton);
        rightSection.appendChild(chatHeader);

        // Chat history
        const chatHistory = document.createElement('div');
        chatHistory.classList.add('chat-history');

        // Input container
        const inputContainer = document.createElement('div');
        inputContainer.classList.add('input-container');

        // Multiline input
        const messageInput = document.createElement('textarea');
        messageInput.classList.add('input-message');
        messageInput.placeholder = 'Type your message...';

        // Send button
        const sendButton = document.createElement('button');
        sendButton.textContent = 'Send';
        sendButton.classList.add('btn-send');
        inputContainer.appendChild(messageInput);
        inputContainer.appendChild(sendButton);
        rightSection.appendChild(chatHistory);
        rightSection.appendChild(inputContainer);

        // Divider (only for desktop)
        const divider = document.createElement('div');
        divider.classList.add('resizable-divider');
        let isResizing = false;
        divider.addEventListener('mousedown', () => {
            isResizing = true;
            document.body.style.userSelect = 'none';
        });
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            const wrapperRect = wrapper.getBoundingClientRect();
            const newLeftWidth = e.clientX - wrapperRect.left;
            const totalWidth = wrapperRect.width;
            const newRightWidth = totalWidth - newLeftWidth;
            if (newLeftWidth > 100 && newRightWidth > 300) {
                leftSection.style.flex = `0 0 ${newLeftWidth}px`;
                rightSection.style.flex = `0 0 ${newRightWidth}px`;
            }
        });
        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.userSelect = '';
        });

        // Check if it's a mobile device
        const isMobile = window.innerWidth < 768;

        if (!isMobile) {
            // Move everything before the toggle button into leftSection on desktop
            while (document.body.firstChild && document.body.firstChild !== toggleButton) {
                leftSection.appendChild(document.body.firstChild);
            }
            wrapper.appendChild(leftSection);
            wrapper.appendChild(divider);
        }

        wrapper.appendChild(rightSection);

        // Replace body content
        document.body.innerHTML = '';
        document.body.appendChild(wrapper);

        // Load user avatar if not done
        if (!userAvatarImage) {
            loadUserAvatar();
        }

        // Render existing messages
        chatMessages.forEach((msgHTML) => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = msgHTML;
            while (tempDiv.firstChild) {
                chatHistory.appendChild(tempDiv.firstChild);
            }
        });

        // Send button => user message
        sendButton.addEventListener('click', function () {
            const userMessage = messageInput.value.trim();
            if (userMessage) {
                // Create user bubble
                const userContainer = document.createElement('div');
                userContainer.classList.add('user-message-container');
                // If we have a user avatar
                if (userAvatarImage) {
                    const cloneAvatar = userAvatarImage.cloneNode(true);
                    cloneAvatar.style.marginRight = '8px';
                    userContainer.appendChild(cloneAvatar);
                }
                const userTextNode = document.createTextNode(userMessage);
                userContainer.appendChild(userTextNode);
                chatHistory.appendChild(userContainer);

                // Add to chatMessages
                chatMessages.push(userContainer.outerHTML);

                // Build the custom prompt
                const customPrompt = `You are Hive Chat, an AI assistant created by CollegeHive, a student community platform founded by Sanjay Bandaru, Aman Thoyaj, and other Christ University students. CollegeHive offers services students need, currently operating Hive Notes (a platform for concise BBA notes based on the Program Course Plan) and a forum.

Your primary function is to answer user queries helpfully, professionally, politely, and respectfully.

**Key Behaviors:**

* **Explanations:** Provide clear and concise explanations to ensure understanding.
* **Brevity:** Be brief and to the point.
* **Conditional Detail (CRITICAL):**
    * **If the user explicitly asks for an explanation or asks "why/how":** Provide a clear and concise explanation.
    * **Otherwise:** Answer in **one sentence without explanation.**
* **Inappropriate Content:** Do not respond to inappropriate, offensive, or unethical content. Disengage politely if necessary.
* **Output Length:** Keep all responses under 500 words.
* **CollegeHive Mention:** Mention CollegeHive only if directly relevant to the user's query (e.g., if asked about your origin or services).

**Output Format:** Output should be in Markdown. Utilize bullet points frequently to present information clearly and concisely. If a practical example would significantly enhance understanding, include one formatted appropriately within the Markdown. Use newline characters (\\n) for formatting and line breaks where needed.

**Contextual Information:**

* **Hidden Context:** ${hiddenContext} (Use this to understand the current context and any specific instructions on the page.)
* **Previous Conversation:** ${chatMessages.map(m => m).join('\n')} (Use this to maintain context and avoid repetition.)

**Current User Input:** ${userMessage}`;

                // Assistant call (example using fetch)
                fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent?key=${decodedApiKey}`, { // API Key in URL
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        "contents": [{
                            "role": "user",
                            "parts": [{
                                "text": customPrompt
                            }]
                        }],
                        "generationConfig": {
                            "temperature": 1,
                            "topK": 64, // You can adjust or remove these if needed, these are from your curl example
                            "topP": 0.95,
                            "maxOutputTokens": 8192,
                            "responseMimeType": "text/plain" // Expect plain text, adjust if needed
                        }
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        return response.json(); // Expecting JSON response from Gemini
                    })
                    .then(data => {
                        console.log("Gemini API Response:", data); // Log the full response for debugging

                        // Extract the text from the Gemini API response.
                        // Assuming the text is in data.candidates[0].content.parts[0].text
                        const geminiResponseText = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

                        if (geminiResponseText) {
                            const assistantContainer = document.createElement('div');
                            assistantContainer.classList.add('assistant-message-container');
                            // Add assistant avatar
                            const assistantAvatar = document.createElement('img');
                            assistantAvatar.src = assistantAvatarSrc;
                            assistantAvatar.classList.add('avatar');
                            assistantAvatar.style.marginRight = '8px';
                            assistantContainer.appendChild(assistantAvatar);
                            // Bubble content (render with Marked.js if available)
                            const botTextDiv = document.createElement('div');
                            botTextDiv.innerHTML = (window.marked) ? marked.parse(geminiResponseText) : geminiResponseText;
                            assistantContainer.appendChild(botTextDiv);
                            chatHistory.appendChild(assistantContainer);
                            // Save chatMessages.push(assistantContainer.outerHTML);
                            chatMessages.push(assistantContainer.outerHTML);
                            sessionStorage.setItem('chatMessages', JSON.stringify(chatMessages));
                            chatHistory.scrollTop = chatHistory.scrollHeight;
                        } else {
                            console.error("No text content found in Gemini API response:", data);
                            // Handle the case where no text is returned, maybe show an error message in chat
                            const errorMsg = document.createElement('div');
                            errorMsg.classList.add('error-message-container');
                            errorMsg.textContent = 'Hive Chat: No response from AI. Please check console.';
                            chatHistory.appendChild(errorMsg);
                            chatMessages.push(errorMsg.outerHTML);
                            sessionStorage.setItem('chatMessages', JSON.stringify(chatMessages));
                            chatHistory.scrollTop = chatHistory.scrollHeight;
                        }
                    })
                    .catch(error => {
                        console.error("Error fetching from Gemini API:", error);
                        // Show error bubble
                        const errorMsg = document.createElement('div');
                        errorMsg.classList.add('error-message-container');
                        errorMsg.textContent = 'Hive Chat: Error fetching response from AI. Please check console.';
                        chatHistory.appendChild(errorMsg);
                        chatMessages.push(errorMsg.outerHTML);
                        sessionStorage.setItem('chatMessages', JSON.stringify(chatMessages));
                        chatHistory.scrollTop = chatHistory.scrollHeight;
                    });

                messageInput.value = '';
                // Scroll to bottom
                chatHistory.scrollTop = chatHistory.scrollHeight;
                // Save updated messages
                sessionStorage.setItem('chatMessages', JSON.stringify(chatMessages));
            }
        });

        // Press Enter (no shift) => send message
        messageInput.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendButton.click();
            }
        });
    }

    // Toggle button click => open the chat
    toggleButton.addEventListener('click', openChatUI);

    // If user had chat open previously, open it automatically
    if (wasChatOpen) {
        toggleButton.click();
    }
});
document.addEventListener("DOMContentLoaded", function () {
    // 1. Find the container and the reference (Settings link)
    const linksContainer = document.querySelector(".links.text-center");
    const settingsLink = document.querySelector('a[data-shortcut="settings_view"]');

    // 2. Create the Music button (a tag) entirely via JavaScript
    const musicLink = document.createElement("a");
    musicLink.href = "#";
    musicLink.id = "musicButton";
    musicLink.setAttribute("data-shortcut", "music_toggle");

    // Insert the SVG icon + text
    musicLink.innerHTML = `
      <svg class="svg-icon" data-icon="music" role="presentation"
           xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 24 24">
        <path d="M9 19V5l12-2v14"
              fill="none"
              stroke="currentColor"
              stroke-width="2"></path>
        <circle cx="6" cy="18" r="3" fill="currentColor"></circle>
        <circle cx="18" cy="16" r="3" fill="currentColor"></circle>
      </svg>
      Music
    `;

    // 3. Insert the Music button just before the Settings link
    linksContainer.insertBefore(musicLink, settingsLink);

    // 4. Create a hidden audio element with a sample MP3 URL
    const audioElement = document.createElement("audio");
    audioElement.id = "bgMusic";
    audioElement.loop = true;
    const sourceElement = document.createElement("source");
    sourceElement.src = "https://sandeep9583.github.io/sample/Restful%20Rainfall.mp3";
    sourceElement.type = "audio/mpeg";
    audioElement.appendChild(sourceElement);
    document.body.appendChild(audioElement);

    // 5. Retrieve existing music state and timestamp from sessionStorage
    let musicState = sessionStorage.getItem('musicState') || 'stopped';
    let savedTime = parseFloat(sessionStorage.getItem('musicTimestamp')) || 0;

    // 6. Set up time update listener to continuously save current timestamp
    audioElement.addEventListener('timeupdate', function() {
        if (musicState === 'playing') {
            sessionStorage.setItem('musicTimestamp', audioElement.currentTime);
        }
    });

    // 7. If previous state was 'playing', start music from saved position
    if (musicState === 'playing') {
        audioElement.addEventListener('canplaythrough', function onCanPlay() {
            audioElement.currentTime = savedTime;
            audioElement.play().catch(err => console.log(err));
            audioElement.removeEventListener('canplaythrough', onCanPlay);
        });
        audioElement.load();
    }

    // 8. Add click event to toggle music on/off
    musicLink.addEventListener("click", function (event) {
        event.preventDefault();
        if (musicState === 'playing') {
            // Pause music and save timestamp
            audioElement.pause();
            sessionStorage.setItem('musicTimestamp', audioElement.currentTime);
            musicState = 'stopped';
            sessionStorage.setItem('musicState', 'stopped');
        } else {
            // Resume music from saved timestamp
            audioElement.currentTime = parseFloat(sessionStorage.getItem('musicTimestamp')) || 0;
            audioElement.play().catch(err => console.log(err));
            musicState = 'playing';
            sessionStorage.setItem('musicState', 'playing');
        }
    });
});


// summary

document.addEventListener('DOMContentLoaded', () => {
    /********************************************************
     * 1) Dynamically create and insert the Info button next to heading
     ********************************************************/
    const heading = document.getElementById('bkmrk-page-title');
    const infoButton = document.createElement('button');
    infoButton.className = 'info-button';
    infoButton.id = 'info-button';
    infoButton.setAttribute('aria-label', 'Information');
    // infoButton.textContent = 'ⓘ';

    // const infoButton = document.getElementById('info-button');

    // Create an image element
    const assistantAvatar = document.createElement('img');
    assistantAvatar.src = 'https://img.icons8.com/?size=100&id=59023&format=png&color=000000'; // Replace with the actual image URL
    assistantAvatar.classList.add('avatar');
    assistantAvatar.style.marginRight = '8px';
    assistantAvatar.style.width = '24px'; // Adjust as needed
    assistantAvatar.style.height = '24px'; // Adjust as needed

    // Append the image to the button
    infoButton.appendChild(assistantAvatar);



    // Append the info button inside the heading at the end
    heading.appendChild(infoButton);

    /********************************************************
     * 2) Dynamically create and insert the Overlay
     ********************************************************/
    const overlayHTML = `
      <div class="overlay-header">
      <img src="https://img.icons8.com/?size=100&id=59023&format=png&color=000000" class="avatar" style="margin-right: 10px; width: 24px; height: 24px;">
        <strong>AI Summary</strong>
        <div>
          <button class="copy-button" id="copy-button">Copy</button>
          <button class="close-button" id="close-button">Close</button>
        </div>
      </div>
      <div class="markdown-content" id="markdown-content"></div>
    `;
    const overlay = document.createElement('div');
    overlay.className = 'overlay';
    overlay.id = 'overlay';
    overlay.innerHTML = overlayHTML;

    // Insert the overlay at the end of the body
    document.body.appendChild(overlay);

    /********************************************************
     * 3) Set up references for newly created elements
     ********************************************************/
    const closeButton = document.getElementById('close-button');
    const copyButton = document.getElementById('copy-button');
    const markdownContent = document.getElementById('markdown-content');
    // const contentText = document.getElementById('content-text').innerText.trim();

    // 1) Capture the text from .page-content.clearfix, but do not display it in chat
    const pageContentDiv = document.querySelector('div.page-content.clearfix');
    let hiddenContext = '';
    if (pageContentDiv) {
        hiddenContext = pageContentDiv.innerText;
        console.log('Captured Page Content (hidden):', hiddenContext);
    }

    /********************************************************
     * 4) Utility functions
     ********************************************************/
    // Toggle overlay visibility
    function toggleOverlay(show) {
        if (show) {
            overlay.classList.add('show', 'fade-in');
        } else {
            overlay.classList.remove('show', 'fade-in');
        }
    }

    // Copy overlay content
    function copyOverlayContent() {
        const textToCopy = markdownContent.innerText;
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                alert("Copied to clipboard!");
            })
            .catch(() => {
                alert("Failed to copy!");
            });
    }

    /********************************************************
     * 5) Info button click event: fetch from GROQ & stream
     ********************************************************/
    infoButton.addEventListener('click', async () => {
        toggleOverlay(true);

        // Clear any previous content
        markdownContent.innerHTML = '';
        let resultText = '';

        // Prepare your custom prompt based on the body text
        const customPrompt = `
        Given the following text:
        "${hiddenContext}"

        For students needing a quick revision of this topic, create a **memorable, concise** acronym or mnemonic highlighting the **essential concepts**.

        Present your answer **strictly** in Markdown format, ensuring the formatting is clean and does not break.

        **Acronym/Mnemonic:** [Your Acronym/Mnemonic here]

        **Explanation:**

        * **[Letter/Part 1]:**  Key idea: [Core concept concisely explained]. *Example:* [Very short, practical illustration].
        * **[Letter/Part 2]:**  Key idea: [Core concept concisely explained]. *Example:* [Very short, practical illustration].
        * ... and so on. *Keep explanations and examples ultra-brief for quick recall.*

        **Quick Summary:**
        [A concise paragraph summarizing the main takeaways. Ensure appropriate new lines are used for readability where needed, but avoid unnecessary filler.]
        `;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-preview-02-05:generateContent?key=${decodedApiKey}`, { // API Key in URL
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "contents": [{
                        "role": "user",
                        "parts": [{
                            "text": customPrompt
                        }]
                    }],
                    "generationConfig": {
                        "temperature": 1,
                        "topK": 64, // Adjust or remove if needed
                        "topP": 0.95,
                        "maxOutputTokens": 1024, // Reduced max_tokens for summary, adjust if needed
                        "responseMimeType": "text/plain"
                    }
                })
            });

            const data = await response.json(); // Parse JSON response
            console.log("Gemini Summary API Response:", data); // Log full response for debugging

            // Extract text from Gemini response (same path as chat)
            const geminiSummaryText = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text;

            if (geminiSummaryText) {
                resultText = geminiSummaryText; // Set resultText directly
                markdownContent.innerHTML = marked.parse(resultText); // Render markdown
            } else {
                console.error("No text content found in Gemini Summary API response:", data);
                markdownContent.innerHTML = '<p style="color:red;">Error: No summary response from AI.</p>';
            }


        } catch (error) {
            console.error('Error fetching data:', error);
            markdownContent.innerHTML = '<p style="color:red;">Error fetching data.</p>';
        }
    });

    /********************************************************
     * 6) Close & Copy button events
     ********************************************************/
    closeButton.addEventListener('click', () => {
        toggleOverlay(false);
    });

    copyButton.addEventListener('click', copyOverlayContent);
});


// math

window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        macros: {
            'R': '\\mathbb{R}',
            'N': '\\mathbb{N}',
            'v': '\\mathbf{v}',
            'abs': ['\\left|#1\\right|', 1],
            'norm': ['\\left\\| #1 \\right\\|', 1]
        },
    },
};

// Convert the given "file" instance to HTML and insert the results
// into the given TinyMCE "editor" instance.
function convertAndInsertDocx(editor, file) {
    // Use a FileReader to handle conversion via an ArrayBuffer
    const reader = new FileReader();
    reader.onload = async function (loadEvent) {
        // Get and convert the ArrayBuffer version of the file
        const arrayBuffer = loadEvent.target.result;
        const {
            value: html,
            messages
        } = await window.mammoth.convertToHtml({
            arrayBuffer
        });
        // If warnings exists from conversion, log them to the browser console then
        // show a warning alert via BookStack's event system.
        if (messages.length > 0) {
            console.error(messages);
            window.$events.emit('warning', `${messages.length} warnings logged to browser console during conversion`);
        }
        // Insert the resulting HTML content insert the editor
        editor.insertContent(html);
    }
    reader.readAsArrayBuffer(file);
}

// Listen to BookStack emmitted WYSWIYG editor setup event
window.addEventListener('editor-tinymce::setup', event => {
    // Get a reference to the editor and listen to file "drop" events
    const editor = event.detail.editor;
    editor.on('drop', event => {
        // For each of the files in the drop event, pass them, alonside the editor instance
        // to our "convertAndInsertDocx" function above if they're docx files.
        const files = event?.dataTransfer?.files || [];
        for (const file of files) {
            if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' && window.mammoth) {
                convertAndInsertDocx(editor, file);
            }
        }
    });
});
