
# Complete Me Plugin for Obsidian

AI-powered text completion for Obsidian, with streaming and stop functionality.


## Features

- **Streaming AI Completion**: Use the "Complete me (short)" and "Complete me (Long)" commands to stream text completions directly into your editor, powered by OpenAI.
- **Stop Streaming**: Instantly stop the current completion stream with the "Stop Streaming" command.
- **Customizable Settings**: Configure API base URL, key, model, system prompt, temperature, and completion limits from the settings tab.



## How to Use

1. **Install**: Place this plugin in your vault's `.obsidian/plugins/complete-me` folder and run `npm i` then `npm run dev` to build.
2. **Enable**: Enable the plugin in Obsidian's settings.
3. **Configure**: Go to the plugin settings to set your OpenAI API key, base URL, model, system prompt, temperature, and completion limits.
4. **Complete Text**:
	- Use the "Complete me (short)" command for a short completion (default: 20 tokens).
	- Use the "Complete me (Long)" command for a longer completion (default: 200 tokens).
5. **Stop Streaming**: Use the "Stop Streaming" command to immediately abort the current completion stream.
6. **Recommended:**
	- On desktop, set a keyboard shortcut for the completion commands for faster access (Settings → Hotkeys).
	- On mobile, add the completion commands to your toolbar for quick access (Settings → Toolbar).


## Commands

- **Complete me (short)**: Streams a short AI-generated text completion into your editor.
- **Complete me (Long)**: Streams a longer AI-generated text completion into your editor.
- **Stop Streaming**: Aborts the current streaming completion.


## Settings

- **Base URL**: The API endpoint for OpenAI.
- **API Key**: Your OpenAI API key.
- **Model**: The model to use (e.g., `gpt-3.5-turbo`).
- **System Prompt**: Custom system prompt to guide completions.
- **Temperature**: Controls randomness/creativity of completions.
- **Complete Limit (Long)**: Maximum tokens for long completions.
- **Complete Limit (Short)**: Maximum tokens for short completions.

## Development

- Requires Node.js v16 or higher.
- Run `npm i` to install dependencies.
- Run `npm run dev` to build in watch mode.
- Edit `main.ts` for plugin logic and settings.

## Manual Installation

Copy `main.js`, `styles.css`, and `manifest.json` to your vault's plugin folder.

## API Documentation

See [Obsidian API documentation](https://github.com/obsidianmd/obsidian-api).
