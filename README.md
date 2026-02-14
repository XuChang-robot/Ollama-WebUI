# Ollama WebUI

A modern, responsive web interface for interacting with Ollama AI models. Built with pure JavaScript, HTML, and CSS, it provides an intuitive and beautiful user experience for AI conversations.

## Features

- **Real-time Streaming Conversations**: Fast and responsive AI interactions with streaming responses
- **Multi-format File Upload**: Support for TXT, DOC, DOCX, PDF, and image formats (JPG, JPEG, PNG, GIF, BMP, WEBP)
- **Image Analysis**: Multi-modal model support for analyzing uploaded images
- **Conversation History Management**: Auto-save, export, and import conversation history
- **History Navigation Markers**: Visual markers for easy navigation through conversation history
- **Thinking Mode**: Display AI reasoning process with collapsible sections
- **Model Selection**: Automatically fetch and select from available Ollama models
- **Modern UI Design**: Beautiful gradient design with smooth animations
- **Responsive Layout**: Adapts to different screen sizes

## System Requirements

### Hardware
- Processor: At least 2-core CPU
- RAM: Minimum 4GB (more may be required depending on model size)
- Storage: At least 10GB free space (for model storage)
- Network: Stable internet connection

### Software
- **Ollama Service**: Must have Ollama installed and running
- **Browser**: Modern browser recommended
  - Chrome 80+ or Firefox 75+ or Edge 80+
- **Local Server** (optional): For serving the web interface
  - Python 3.6+ or Node.js 12+ or PHP 7.0+

## Installation

### 1. Install Ollama

Download and install Ollama from the [official website](https://ollama.com/).

### 2. Pull a Model

Open Command Prompt or PowerShell and run:

```bash
# Example: Pull qwen3-vl:4b model
ollama pull qwen3-vl:4b
```

### 3. Configure CORS

To allow the web interface to communicate with Ollama API, configure CORS:

#### Windows Users

Run the `setup_cors.bat` script in the project root directory, or manually set the environment variable:

```powershell
# PowerShell
$env:OLLAMA_ORIGINS="*"

# CMD
set OLLAMA_ORIGINS=*
```

Restart Ollama service after setting the environment variable.

#### Linux/Mac Users

```bash
export OLLAMA_ORIGINS="*"
```

For permanent settings, add to `~/.bashrc` or `~/.zshrc`.

### 4. Start the Web Interface

Open `Ollama_WebUI.html` in your browser, or use a local server:

**Using Python:**
```bash
python -m http.server 8000
```

**Using Node.js:**
```bash
npx http-server
```

**Using PHP:**
```bash
php -S localhost:8000
```

Then open `http://localhost:8000/Ollama_WebUI.html` in your browser.

## Usage

### Basic Conversation

1. Type your message in the input box
2. Press Enter or click the Send button
3. AI will respond with streaming text

### File Upload

1. Click the "📁 Upload File" button
2. Select one or more files (TXT, DOC, DOCX, PDF, or images)
3. Files will be processed and included in your message
4. Uploaded images will be displayed as previews

### Thinking Mode

1. Click the "💭" button in the header to toggle thinking mode
2. When enabled, AI's reasoning process will be displayed
3. Click the thinking header to collapse/expand the thinking section
4. Thinking content is saved in conversation history when enabled

### Model Selection

1. Click the "⚙️" Settings button
2. Open the settings panel
3. Select a model from the dropdown list
4. Available models are automatically fetched from Ollama
5. Click Save to apply the new model

### New Conversation

Click the "📝" button to start a new conversation:
- Clears current conversation history
- Resets uploaded file list
- Shows welcome message
- Preserves model and API settings

### Conversation History

- **Auto-save**: Conversations are automatically saved to browser localStorage
- **Export**: Click "Export History" in settings to download as JSON
- **Import**: Click "Import History" in settings to restore from JSON file

### Navigation Markers

- Vertical markers on the right side of the chat container
- Click a marker to jump to that message
- Hover to see message preview
- Active marker is highlighted in blue

## Configuration

### Default Settings

- **Default Model**: `qwen3-vl:4b`
- **API URL**: `http://localhost:11434/api/chat`
- **Thinking Mode**: Disabled by default

### Model Selection

- Open settings panel to see available models
- Models are automatically fetched from Ollama's `/api/tags` endpoint
- Current model is automatically selected
- If model list fails to load, check Ollama service status

### API Configuration

- **Chat Endpoint**: `/api/chat` - For sending messages
- **Models Endpoint**: `/api/tags` - For fetching available models

## Troubleshooting

### 403 Forbidden Error

**Problem**: Browser console shows 403 Forbidden error

**Solution**:
- Run `setup_cors.bat` script
- Or manually set environment variable:
  ```powershell
  # PowerShell
  $env:OLLAMA_ORIGINS="*"
  
  # CMD
  set OLLAMA_ORIGINS=*
  ```
- Restart Ollama service

### 404 Not Found Error

**Problem**: Browser console shows 404 Not Found error

**Solution**:
- Ensure the model is installed: `ollama pull <model-name>`
- Check model name spelling
- Verify Ollama service is running

### Slow Response

**Problem**: AI responses are slow

**Solution**:
- Check network connection stability
- Try using a smaller model
- Reduce the amount of content sent at once
- Ensure Ollama service is running properly

### Model List Empty

**Problem**: No models appear in the dropdown list

**Solution**:
- Check if Ollama service is running
- Verify CORS configuration
- Check browser console for error messages
- Ensure at least one model is installed

### Image Upload Issues

**Problem**: Images not being analyzed

**Solution**:
- Ensure you're using a multi-modal model (e.g., qwen3-vl)
- Check image format is supported
- Verify image file is not corrupted
- Check browser console for error messages

## Technical Details

### Project Structure

```
Ollama_WebUI/
├── Ollama_WebUI.html    # Main HTML file
├── style.css              # Stylesheet (modern gradient design)
├── app.js                 # Core JavaScript logic
├── setup_cors.bat        # CORS configuration script (Windows)
├── skills/               # Skills documentation
│   └── skill.md          # Project documentation
├── 使用说明.md           # Chinese user manual
├── 注意事项.md           # Notes and troubleshooting
└── README.md             # This file
```

### Technologies

- **Frontend**: Pure JavaScript (ES6+)
- **Styling**: CSS3 (Flexbox layout, modern gradient design)
- **Third-party Libraries**:
  - mammoth.js (1.6.0): For parsing Word documents
  - pdf.js (4.0.379): For parsing PDF files
- **Storage**: localStorage (browser local storage)
- **API**: Ollama REST API
- **Communication**: Streaming HTTP requests (Server-Sent Events)

### API Integration

The application communicates with Ollama through its REST API:

- **Chat API**: `POST /api/chat` - Send messages and receive streaming responses
- **Models API**: `GET /api/tags` - Fetch available models

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13+

## Security Considerations

- All data is stored locally in the browser
- No data is sent to external servers except Ollama API
- Ensure CORS is properly configured for security
- Use HTTPS in production environments

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## License

This project is open source and available under the MIT License.

## Authors

Developed by: Chang Xu, Liu Yaxin

## Acknowledgments

- [Ollama](https://ollama.com/) - For providing the AI model API
- [mammoth.js](https://github.com/mwilliamson/mammoth.js) - For Word document parsing
- [pdf.js](https://mozilla.github.io/pdf.js/) - For PDF parsing

## Support

For issues and questions:
- Check the troubleshooting section above
- Review the Chinese user manual (使用说明.md) for detailed instructions
- Check the notes file (注意事项.md) for common issues

## Version History

### Version 1.0
- Initial release
- Basic chat functionality
- File upload support (TXT, DOC, DOCX, PDF)
- Conversation history management
- Thinking mode support
- Image upload and analysis
- Model selection with dropdown list
- Modern UI design
