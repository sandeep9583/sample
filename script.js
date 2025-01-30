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

**Output Format:** Output should be in Markdown. Utilize bullet points frequently to present information clearly and concisely. If a practical example would significantly enhance understanding, include one formatted appropriately within the Markdown. Use newline characters (\n) for formatting and line breaks where needed.

**Contextual Information:**

* **Hidden Context:** ${hiddenContext} (Use this to understand the current context and any specific instructions on the page.)
* **Previous Conversation:** ${chatMessages.map(m => m).join('\n')} (Use this to maintain context and avoid repetition.)

**Current User Input:** ${userMessage}`;

                        // Assistant call (example using fetch)
                        fetch('https://api.groq.com/openai/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer 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'
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
