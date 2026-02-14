class OllamaWebUI {
    constructor() {
        this.ollamaUrl = 'http://localhost:11434/api/chat';
        this.model = 'qwen3-vl:4b';
        this.uploadedFiles = [];
        this.conversationHistory = [];
        this.userScrolling = false;
        this.useThinking = false;
        this.currentRequest = null;
        this.abortController = null;
        
        this.loadSettings();
        this.initElements();
        this.initEventListeners();
        this.updateHeaderTitle();
        
        // 初始化历史记录边栏位置
        setTimeout(() => {
            this.updateHistoryMarkersPosition();
        }, 100);
    }

    initElements() {
        this.messagesContainer = document.getElementById('messages');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.fileInput = document.getElementById('fileInput');
        this.uploadBtn = document.getElementById('uploadBtn');
        this.fileList = document.getElementById('fileList');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.exportHistoryBtn = document.getElementById('exportHistoryBtn');
        this.importHistoryBtn = document.getElementById('importHistoryBtn');
        this.historyFileInput = document.getElementById('historyFileInput');
        this.cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
        this.modelSelect = document.getElementById('modelSelect');
        this.apiUrlInput = document.getElementById('apiUrlInput');
        this.thinkingBtn = document.getElementById('thinkingBtn');
        this.newChatBtn = document.getElementById('newChatBtn');
        this.historyMarkers = document.getElementById('historyMarkers');
        this.chatContainer = document.querySelector('.chat-container');
        this.toast = document.getElementById('toast');
    }

    initEventListeners() {
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.uploadBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));

        this.settingsBtn.addEventListener('click', () => this.openSettings());
        this.closeModalBtn.addEventListener('click', () => this.closeSettings());
        this.cancelSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        if (this.thinkingBtn) {
            this.thinkingBtn.addEventListener('click', () => this.toggleThinking());
        }
        
        if (this.newChatBtn) {
            this.newChatBtn.addEventListener('click', () => this.newChat());
        }
        
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettings();
            }
        });

        if (this.exportHistoryBtn) {
            this.exportHistoryBtn.addEventListener('click', () => this.exportConversationHistory());
        }

        if (this.importHistoryBtn) {
            this.importHistoryBtn.addEventListener('click', () => this.historyFileInput.click());
        }

        if (this.historyFileInput) {
            this.historyFileInput.addEventListener('change', (e) => this.importConversationHistory(e));
        }

        this.messagesContainer.addEventListener('scroll', () => {
            // 检测用户是否滚动到了非底部位置
            const isNearBottom = this.messagesContainer.scrollTop + this.messagesContainer.clientHeight >= this.messagesContainer.scrollHeight - 50;
            if (!isNearBottom) {
                this.userScrolling = true;
                clearTimeout(this.scrollTimeout);
                this.scrollTimeout = setTimeout(() => {
                    // 检查滚动后是否回到了底部
                    const isBackToBottom = this.messagesContainer.scrollTop + this.messagesContainer.clientHeight >= this.messagesContainer.scrollHeight - 50;
                    if (isBackToBottom) {
                        this.userScrolling = false;
                    }
                }, 500);
            }
            
            // 更新标记的激活状态
            this.updateMarkerActiveStates();
        });
        
        // 窗口大小变化时更新历史记录边栏位置
        window.addEventListener('resize', () => this.updateHistoryMarkersPosition());
    }

    loadSettings() {
        const savedModel = localStorage.getItem('ollamaModel');
        const savedApiUrl = localStorage.getItem('ollamaApiUrl');
        
        if (savedModel) {
            this.model = savedModel;
        }
        
        if (savedApiUrl) {
            this.ollamaUrl = savedApiUrl;
        }
        
        this.loadConversationHistory();
    }

    async loadModels() {
        try {
            const apiUrl = this.ollamaUrl.replace('/api/chat', '/api/tags');
            const response = await fetch(apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.models && data.models.length > 0) {
                this.modelSelect.innerHTML = '';
                data.models.forEach(model => {
                    const option = document.createElement('option');
                    option.value = model.name;
                    option.textContent = model.name;
                    if (model.name === this.model) {
                        option.selected = true;
                    }
                    this.modelSelect.appendChild(option);
                });
            } else {
                this.modelSelect.innerHTML = '<option value="">无可用模型</option>';
            }
        } catch (error) {
            console.error('加载模型列表失败:', error);
            this.modelSelect.innerHTML = '<option value="">加载失败</option>';
        }
    }

    loadConversationHistory() {
        const savedHistory = localStorage.getItem('ollamaConversationHistory');
        if (savedHistory) {
            try {
                this.conversationHistory = JSON.parse(savedHistory);
                // 加载历史消息到界面
                this.conversationHistory.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'assistant') {
                        const thinking = this.useThinking && msg.thinking ? msg.thinking : null;
                        this.addMessage(msg.content, msg.role, thinking, msg.images || null, msg.imageMimeTypes || null);
                    }
                });
                // 更新历史标记
                setTimeout(() => {
                    this.updateHistoryMarkers();
                }, 100);
            } catch (e) {
                console.error('加载对话历史失败:', e);
                this.conversationHistory = [];
            }
        }
    }

    saveConversationHistory() {
        try {
            const historyToSave = this.conversationHistory.map(msg => {
                const { images, imageMimeTypes, ...rest } = msg;
                return rest;
            });
            localStorage.setItem('ollamaConversationHistory', JSON.stringify(historyToSave));
            console.log('对话历史已保存:', this.conversationHistory.length, '条消息');
        } catch (e) {
            console.error('保存对话历史失败:', e);
        }
        this.updateHistoryMarkers();
    }

    updateHistoryMarkers() {
        if (!this.historyMarkers) {
            console.error('historyMarkers 元素不存在');
            return;
        }
        
        // 清空现有的标记
        this.historyMarkers.innerHTML = '';
        
        // 获取所有用户消息
        const userMessages = this.conversationHistory.filter(msg => msg.role === 'user');
        
        console.log('用户消息数量:', userMessages.length);
        
        if (userMessages.length === 0) return;
        
        // 为每个用户消息创建标记
        userMessages.forEach((msg, index) => {
            const marker = document.createElement('div');
            marker.className = 'history-marker';
            marker.dataset.index = index;
            const tooltip = msg.content.substring(0, 50) + (msg.content.length > 50 ? '...' : '');
            marker.dataset.tooltip = tooltip;
            
            // 添加点击事件
            marker.addEventListener('click', (e) => {
                e.stopPropagation();
                // 找到对应的用户消息元素
                const userMessageElements = this.messagesContainer.querySelectorAll('.message.user');
                if (userMessageElements[index]) {
                    userMessageElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
            
            this.historyMarkers.appendChild(marker);
            console.log('创建了历史标记:', index + 1);
        });
        
        // 更新标记的激活状态
        this.updateMarkerActiveStates();
    }

    updateMarkerActiveStates() {
        if (!this.historyMarkers) return;
        
        const userMessageElements = this.messagesContainer.querySelectorAll('.message.user');
        const markers = this.historyMarkers.querySelectorAll('.history-marker');
        
        // 获取当前滚动位置
        const scrollTop = this.messagesContainer.scrollTop;
        const containerHeight = this.messagesContainer.clientHeight;
        const scrollBottom = scrollTop + containerHeight;
        
        markers.forEach((marker, index) => {
            if (userMessageElements[index]) {
                const messageElement = userMessageElements[index];
                const rect = messageElement.getBoundingClientRect();
                const containerRect = this.messagesContainer.getBoundingClientRect();
                
                // 计算消息元素在容器中的位置
                const messageTop = rect.top - containerRect.top + scrollTop;
                const messageBottom = messageTop + rect.height;
                
                // 检查消息是否在当前视图中
                const isInView = (messageTop >= scrollTop && messageTop <= scrollBottom) || 
                               (messageBottom >= scrollTop && messageBottom <= scrollBottom);
                
                if (isInView) {
                    marker.classList.add('active');
                } else {
                    marker.classList.remove('active');
                }
            }
        });
    }

    updateHistoryMarkersPosition() {
        if (!this.historyMarkers || !this.chatContainer) return;
        
        // 计算chat-container的高度和input-area的高度
        const chatContainerHeight = this.chatContainer.offsetHeight;
        const inputAreaHeight = this.chatContainer.querySelector('.input-area').offsetHeight;
        
        // 设置历史记录边栏的位置
        const bottomPosition = inputAreaHeight + 20; // 底部距离input-area 20px
        this.historyMarkers.style.bottom = bottomPosition + 'px';
    }

    showToast(message, duration = 1000) {
        // 使用简单的实现确保提示信息显示
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 999999;
            font-size: 14px;
            font-weight: 500;
            opacity: 0;
            transform: translateY(-20px);
            transition: all 0.3s ease;
            pointer-events: none;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        // 触发重排后添加show类
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        }, 10);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, duration);
    }

    exportConversationHistory() {
        if (this.conversationHistory.length === 0) {
            alert('没有对话历史可导出');
            return;
        }
        
        const historyData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            model: this.model,
            history: this.conversationHistory
        };
        
        const jsonString = JSON.stringify(historyData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = `ollama-history-${new Date().toISOString().slice(0, 10)}.json`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert(`导出成功: ${fileName}`);
    }

    importConversationHistory(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const historyData = JSON.parse(e.target.result);
                if (!historyData.history || !Array.isArray(historyData.history)) {
                    throw new Error('无效的历史记录文件格式');
                }
                
                // 清空当前对话历史
                this.conversationHistory = [];
                this.messagesContainer.innerHTML = '';
                
                // 加载导入的历史记录
                this.conversationHistory = historyData.history;
                this.conversationHistory.forEach(msg => {
                    if (msg.role === 'user' || msg.role === 'assistant') {
                        this.addMessage(msg.content, msg.role);
                    }
                });
                
                // 更新本地存储和历史标记
                this.saveConversationHistory();
                this.updateHistoryMarkers();
                
                // 如果文件中包含模型信息，更新模型
                if (historyData.model) {
                    this.model = historyData.model;
                    localStorage.setItem('ollamaModel', this.model);
                    this.updateHeaderTitle();
                }
                
                alert('对话历史已成功导入');
            } catch (error) {
                console.error('导入对话历史失败:', error);
                alert('导入对话历史失败: ' + error.message);
            } finally {
                // 重置文件输入
                this.historyFileInput.value = '';
            }
        };
        reader.onerror = () => {
            alert('读取文件失败');
            this.historyFileInput.value = '';
        };
        reader.readAsText(file);
    }

    openSettings() {
        this.modelSelect.value = this.model;
        this.apiUrlInput.value = this.ollamaUrl;
        this.settingsModal.classList.add('show');
        this.loadModels();
    }

    closeSettings() {
        this.settingsModal.classList.remove('show');
    }

    async saveSettings() {
        const newModel = this.modelSelect.value.trim();
        const newApiUrl = this.apiUrlInput.value.trim();

        if (!newModel) {
            alert('请选择模型');
            return;
        }

        if (!newApiUrl) {
            alert('请输入API地址');
            return;
        }

        this.saveSettingsBtn.disabled = true;
        this.saveSettingsBtn.innerHTML = '<span class="loading"></span>';

        try {
            const oldModel = this.model;
            this.model = newModel;
            this.ollamaUrl = newApiUrl;

            localStorage.setItem('ollamaModel', this.model);
            localStorage.setItem('ollamaApiUrl', this.ollamaUrl);

            this.updateHeaderTitle();
            this.closeSettings();
            
            this.addMessage(`正在切换模型：${oldModel} → ${this.model}`, 'system');
            
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const testResponse = await fetch(this.ollamaUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: this.model,
                        messages: [{ role: 'user', content: '你好' }],
                        stream: false
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!testResponse.ok) {
                    if (testResponse.status === 404) {
                        throw new Error(`模型 "${this.model}" 不存在`);
                    } else if (testResponse.status === 403) {
                        throw new Error(`CORS错误：请设置环境变量 OLLAMA_ORIGINS="*"`);
                    } else {
                        throw new Error(`连接失败: HTTP ${testResponse.status}`);
                    }
                }

                const testData = await testResponse.json();
                
                if (!testData.message || !testData.message.content) {
                    throw new Error('模型响应格式不正确');
                }

                this.addMessage(`模型切换成功：${this.model}`, 'system');
            } catch (testError) {
                console.error('模型测试错误:', testError);
                this.addMessage(`模型切换警告：${testError.message}`, 'system');
            }
        } catch (error) {
            console.error('保存设置错误:', error);
            alert(`保存设置失败：${error.message}`);
        } finally {
            this.saveSettingsBtn.disabled = false;
            this.saveSettingsBtn.innerHTML = '保存';
        }
    }

    updateHeaderTitle() {
        const headerTitle = document.querySelector('header h1');
        if (headerTitle) {
            headerTitle.textContent = `Ollama WebUI - ${this.model}`;
        }
        document.title = `Ollama WebUI - ${this.model}`;
    }

    newChat() {
        // 清空对话历史
        this.conversationHistory = [];
        // 清空界面上的消息
        this.messagesContainer.innerHTML = '';
        // 显示系统欢迎消息
        this.messagesContainer.innerHTML = `
            <div class="message system">
                <div class="message-content">
                    欢迎使用Ollama WebUI！您可以上传Word或TXT文件，然后与AI进行对话。
                </div>
            </div>
        `;
        // 清空上传的文件
        this.uploadedFiles = [];
        this.fileList.innerHTML = '';
        // 更新本地存储
        this.saveConversationHistory();
        this.updateHistoryMarkers();
    }

    async handleFileUpload(event) {
        const files = Array.from(event.target.files);
        
        for (const file of files) {
            try {
                let content = '';
                let isImage = false;
                
                if (file.name.endsWith('.txt')) {
                    content = await this.readTxtFile(file);
                } else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                    content = await this.readWordFile(file);
                } else if (file.name.endsWith('.pdf')) {
                    content = await this.readPdfFile(file);
                } else if (file.name.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
                    const imageData = await this.readImageFile(file);
                    this.uploadedFiles.push(imageData);
                    this.addFileToList(file.name);
                    continue;
                } else {
                    alert('不支持的文件格式。请上传 .txt、.doc、.docx、.pdf 或图片文件。');
                    continue;
                }

                this.uploadedFiles.push({
                    name: file.name,
                    content: content,
                    isImage: isImage
                });

                this.addFileToList(file.name);
            } catch (error) {
                console.error('文件读取错误:', error);
                alert(`读取文件 ${file.name} 时出错: ${error.message}`);
            }
        }

        this.fileInput.value = '';
    }

    readTxtFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('无法读取TXT文件'));
            reader.readAsText(file);
        });
    }

    readWordFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const arrayBuffer = e.target.result;
                    const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
                    resolve(result.value);
                } catch (error) {
                    reject(new Error('无法读取Word文件'));
                }
            };
            reader.onerror = () => reject(new Error('无法读取Word文件'));
            reader.readAsArrayBuffer(file);
        });
    }

    readPdfFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    if (!window.pdfjsLib) {
                        throw new Error('pdf.js库未加载');
                    }
                    
                    const arrayBuffer = e.target.result;
                    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                    let text = `[PDF文件内容]\n文件名: ${file.name}\n文件大小: ${(file.size / 1024).toFixed(2)} KB\n页数: ${pdf.numPages}\n\n`;
                    
                    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                        const page = await pdf.getPage(pageNum);
                        const content = await page.getTextContent();
                        const pageText = content.items.map(item => item.str).join(' ');
                        text += `--- 第 ${pageNum} 页 ---
${pageText}\n\n`;
                    }
                    
                    resolve(text);
                } catch (error) {
                    console.error('PDF解析错误:', error);
                    // 如果解析失败，回退到基本信息
                    const fallbackContent = `[PDF文件内容]\n文件名: ${file.name}\n文件大小: ${(file.size / 1024).toFixed(2)} KB\n\nPDF解析失败，无法提取内容。AI将根据文件名和上下文理解您的需求。`;
                    resolve(fallbackContent);
                }
            };
            reader.onerror = () => {
                const fallbackContent = `[PDF文件内容]\n文件名: ${file.name}\n文件大小: ${(file.size / 1024).toFixed(2)} KB\n\n文件读取失败，无法提取内容。`;
                resolve(fallbackContent);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    readImageFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const base64 = e.target.result;
                    const imageInfo = `[图片文件内容]\n文件名: ${file.name}\n文件大小: ${(file.size / 1024).toFixed(2)} KB\n文件类型: ${file.type}\n\n`;
                    resolve({
                        name: file.name,
                        content: imageInfo + base64,
                        isImage: true,
                        mimeType: file.type,
                        base64Data: base64
                    });
                } catch (error) {
                    reject(new Error('无法读取图片文件'));
                }
            };
            reader.onerror = () => reject(new Error('无法读取图片文件'));
            reader.readAsDataURL(file);
        });
    }

    addFileToList(fileName) {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <span>📄 ${fileName}</span>
            <span class="remove-file" data-filename="${fileName}">×</span>
        `;
        
        fileItem.querySelector('.remove-file').addEventListener('click', () => {
            this.removeFile(fileName);
            fileItem.remove();
        });

        this.fileList.appendChild(fileItem);
    }

    removeFile(fileName) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
    }

    toggleThinking() {
        this.useThinking = !this.useThinking;
        if (this.thinkingBtn) {
            if (this.useThinking) {
                this.thinkingBtn.classList.add('active');
                this.thinkingBtn.title = '关闭思考功能';
            } else {
                this.thinkingBtn.classList.remove('active');
                this.thinkingBtn.title = '开启思考功能';
            }
        }
    }

    addMessage(content, type, thinking = null, images = null, imageMimeTypes = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        
        if (images && images.length > 0 && type === 'user') {
            let html = '';
            images.forEach((base64, index) => {
                const mimeType = imageMimeTypes && imageMimeTypes[index] ? imageMimeTypes[index] : 'image/jpeg';
                html += `<img src="data:${mimeType};base64,${base64}" alt="上传的图片 ${index + 1}" class="message-image" style="max-width: 300px; max-height: 300px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">`;
            });
            if (content && content.trim()) {
                html += `<div style="margin-top: 10px;">${this.formatMessage(content)}</div>`;
            }
            contentDiv.innerHTML = html;
        } else if (thinking && thinking.trim()) {
            contentDiv.innerHTML = this.formatMessageWithThinking(content, thinking);
        } else {
            contentDiv.innerHTML = this.formatMessage(content);
        }
        
        messageDiv.appendChild(contentDiv);
        this.messagesContainer.appendChild(messageDiv);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
        
        return contentDiv;
    }

    formatMessage(content) {
        return content
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    formatMessageWithThinking(content, thinking) {
        let html = '';
        
        if (thinking && thinking.trim()) {
            html += `<div class="thinking-section">
                <div class="thinking-header" onclick="this.parentElement.classList.toggle('collapsed')">
                    <span class="thinking-title">💭 思考过程</span>
                    <span class="thinking-toggle">▼</span>
                </div>
                <div class="thinking-content">
                    ${this.formatMessage(thinking)}
                </div>
            </div>`;
        }
        
        if (content && content.trim()) {
            html += `<div class="response-content">
                ${this.formatMessage(content)}
            </div>`;
        }
        
        return html;
    }

    async sendMessage() {
        const message = this.messageInput.value.trim();
        
        // 如果有正在进行的请求，取消它
        if (this.currentRequest) {
            this.abortController.abort();
            this.sendBtn.innerHTML = '<span>发送</span>';
            this.currentRequest = null;
            this.abortController = null;
            return;
        }
        
        if (!message && this.uploadedFiles.length === 0) {
            alert('请输入消息或上传文件');
            return;
        }

        this.sendBtn.innerHTML = '<span class="loading-container"><span class="loading-spinner"></span><span class="stop-icon">■</span></span>';
        this.sendBtn.title = '点击取消';


        let fullMessage = message;
        let images = [];
        let imageMimeTypes = [];
        
        if (this.uploadedFiles.length > 0) {
            const textFiles = [];
            const imageFiles = [];
            
            this.uploadedFiles.forEach(file => {
                if (file.isImage) {
                    imageFiles.push(file);
                } else {
                    textFiles.push(file);
                }
            });
            
            if (textFiles.length > 0) {
                fullMessage += '\n\n--- 附件内容 ---\n';
                textFiles.forEach((file, index) => {
                    fullMessage += `\n【文件 ${index + 1}: ${file.name}】\n${file.content}\n`;
                });
                fullMessage += '--- 附件结束 ---';
            }
            
            if (imageFiles.length > 0) {
                imageFiles.forEach(file => {
                    const base64Data = file.base64Data.split(',')[1];
                    images.push(base64Data);
                    imageMimeTypes.push(file.mimeType);
                });
                if (textFiles.length === 0 && !message) {
                    fullMessage = '请分析这张图片';
                }
            }
        }

        this.addMessage(message || (textFiles.length === 0 && imageFiles.length > 0 ? '' : '已上传文件'), 'user', null, images.length > 0 ? images : null, imageMimeTypes.length > 0 ? imageMimeTypes : null);
        this.messageInput.value = '';

        const assistantMessageDiv = this.addMessage('正在思考...', 'assistant');

        const userMessage = {
            role: 'user',
            content: fullMessage
        };
        
        if (images.length > 0) {
            userMessage.images = images;
            userMessage.imageMimeTypes = imageMimeTypes;
        }
        
        this.conversationHistory.push(userMessage);

        try {
            this.abortController = new AbortController();
            this.currentRequest = true;

            const requestBody = {
                model: this.model,
                messages: this.conversationHistory,
                stream: true
            };
            
            if (this.useThinking) {
                requestBody.think = true;
            }

            console.log('发送请求到 Ollama:', {
                url: this.ollamaUrl,
                model: this.model,
                messageCount: this.conversationHistory.length,
                hasImages: this.conversationHistory.some(msg => msg.images && msg.images.length > 0)
            });

            const response = await fetch(this.ollamaUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(requestBody),
                signal: this.abortController.signal
            });

            console.log('收到响应:', response.status, response.statusText);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let assistantResponse = '';
            let thinkingContent = '';

            while (true) {
                const { done, value } = await reader.read();
                
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.trim()) {
                        try {
                            const data = JSON.parse(line);
                            if (data.message) {
                                if (data.message.content) {
                                    assistantResponse += data.message.content;
                                }
                                if (this.useThinking && data.message.thinking) {
                                    thinkingContent += data.message.thinking;
                                }
                                assistantMessageDiv.innerHTML = this.formatMessageWithThinking(assistantResponse, thinkingContent);
                                if (!this.userScrolling) {
                                    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
                                }
                            }
                        } catch (e) {
                            console.error('解析响应错误:', e);
                        }
                    }
                }
            }

            this.conversationHistory.push({
                role: 'assistant',
                content: assistantResponse,
                thinking: this.useThinking && thinkingContent ? thinkingContent : undefined
            });
            this.saveConversationHistory();

        } catch (error) {
            console.error('发送消息错误:', error);
            if (error.name !== 'AbortError') {
                assistantMessageDiv.innerHTML = `<span style="color: #dc3545;">错误: ${error.message}<br><br>请确保Ollama服务正在运行，并且已拉取${this.model}模型。<br>运行命令: ollama run ${this.model}</span>`;
            } else {
                // 保留已收到的内容，只添加取消提示
                if (assistantMessageDiv.innerHTML && !assistantMessageDiv.innerHTML.includes('对话已取消')) {
                    assistantMessageDiv.innerHTML += '<br><span style="color: #6c757d;">对话已取消</span>';
                } else if (!assistantMessageDiv.innerHTML) {
                    assistantMessageDiv.innerHTML = '<span style="color: #6c757d;">对话已取消</span>';
                }
            }
        } finally {
            this.sendBtn.innerHTML = '<span>发送</span>';
            this.sendBtn.title = '发送';
            this.uploadedFiles = [];
            this.fileList.innerHTML = '';
            this.currentRequest = null;
            this.abortController = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new OllamaWebUI();
});