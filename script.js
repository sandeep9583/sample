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

// Hex encoded API key
const hexEncodedKeys = ["67736b5f4466586b5a66386c6152796d656f37516e706b66574764796233464d41596c334178346f4e4c6d4c44545276683158466a5a","67736B5F76304B46504A76586564635842694249446B696A5747647962334659684C78355270544F45624436745A4E48546673485674496C","67736B5F6F4E756A6F783447304D394D34746D55797A363257476479623346596A655368664952646E576B6643587A626155703669696F57","67736B5F4569445A64616942493751685333516E59734432574764796233465937784F7A6C76694161743059534544633853794D5A78534F","67736B5F565633464D636F7A575444434F573846384174315747647962334659466662573048504E645A457779794854336B34683350746C"];
// Decode the API key
const hexEncodedKey = hexEncodedKeys[Math.floor(Math.random() * hexEncodedKeys.length)];
const decodedApiKey = hexDecode(hexEncodedKey);

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
                fetch('https://api.groq.com/openai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${decodedApiKey}` // Use decoded API key here
                    },
                    body: JSON.stringify({
                        "messages": [{
                            "role": "user",
                            "content": customPrompt
                        }],
                        "model": "llama-3.3-70b-specdec",
                        "temperature": 1,
                        "max_tokens": 1024,
                        "top_p": 1,
                        "stream": true
                    })
                })
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`HTTP error! Status: ${response.status}`);
                        }
                        const reader = response.body.getReader();
                        let textBuffer = '';
                        const processStream = () => {
                            reader.read().then(({
                                done,
                                value
                            }) => {
                                if (done) {
                                    // Stream done => finalize assistant bubble
                                    if (textBuffer) {
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
                                        botTextDiv.innerHTML = (window.marked) ? marked.parse(textBuffer) : textBuffer;
                                        assistantContainer.appendChild(botTextDiv);
                                        chatHistory.appendChild(assistantContainer);
                                        // Save chatMessages.push(assistantContainer.outerHTML);
                                        chatMessages.push(assistantContainer.outerHTML);
                                        sessionStorage.setItem('chatMessages', JSON.stringify(chatMessages));
                                        chatHistory.scrollTop = chatHistory.scrollHeight;
                                    }
                                    return;
                                }
                                // Handle chunk
                                const textChunk = new TextDecoder().decode(value);
                                try {
                                    const lines = textChunk.split('\n').filter(line => line.trim() !== '');
                                    for (const line of lines) {
                                        if (line.startsWith('data:')) {
                                            const jsonPart = line.substring(5).trim();
                                            const parsed = JSON.parse(jsonPart);
                                            if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                                                textBuffer += parsed.choices[0].delta.content;
                                            }
                                        }
                                    }
                                } catch (e) {
                                    console.error("Error parsing JSON chunk:", e, textChunk);
                                }
                                processStream();
                            });
                        };
                        processStream();
                    })
                    .catch(error => {
                        console.error("Error fetching from Groq API:", error);
                        // Show error bubble
                        const errorMsg = document.createElement('div');
                        errorMsg.classList.add('error-message-container');
                        errorMsg.textContent = 'Hive Chat: Error fetching response. Please check console.';
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


// music
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
    // You can replace this URL with your own music file
    sourceElement.src = "https://sandeep9583.github.io/sample/Restful%20Rainfall.mp3";
    sourceElement.type = "audio/mpeg";

    audioElement.appendChild(sourceElement);
    document.body.appendChild(audioElement);

    // 5. Retrieve existing music state from sessionStorage or default to 'stopped'
    let musicState = sessionStorage.getItem('musicState') || 'stopped';

    // 6. If previous state was 'playing', start music on page load
    if (musicState === 'playing') {
        audioElement.play().catch(err => console.log(err));
    }

    // 7. Add click event to toggle music on/off
    musicLink.addEventListener("click", function (event) {
        event.preventDefault();
        if (musicState === 'playing') {
            // Pause music
            audioElement.pause();
            musicState = 'stopped';
            sessionStorage.setItem('musicState', 'stopped');
        } else {
            // Play music
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
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${decodedApiKey}` // Use decoded API key here
                },
                body: JSON.stringify({
                    "messages": [
                        {
                            "role": "user",
                            "content": customPrompt
                        }
                    ],
                    "model": "llama-3.3-70b-specdec",
                    "temperature": 1,
                    "max_tokens": 1024,
                    "top_p": 1,
                    "stream": true
                })
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            // SSE-like streaming loop
            while (true) {
                const {
                    done,
                    value
                } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, {
                    stream: true
                });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim() || !line.startsWith('data: ')) continue;
                    if (line.includes('[DONE]')) break;

                    try {
                        const jsonStr = line.substring('data: '.length).trim();
                        const json = JSON.parse(jsonStr);

                        // If there's text content in choices, append it
                        if (json.choices && json.choices[0] && json.choices[0].delta) {
                            const contentPart = json.choices[0].delta.content;
                            if (contentPart) {
                                resultText += contentPart;
                                // Render on the fly
                                markdownContent.innerHTML = marked.parse(resultText);
                            }
                        }
                    } catch (e) {
                        console.error("JSON parse error", e, line);
                    }
                }
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
