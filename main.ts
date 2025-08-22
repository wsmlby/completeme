import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import OpenAI from 'openai';

interface CompleteMeSettings {
	baseUrl: string;
	apiKey: string;
	model: string;
	system_prompt: string;
	temperature: number;
	limit_long: number;
	limit_short: number;
}
const SYSTEM_PROMPT = "SYSTEM: continue the writing. Don't break the flow. Use the similar style as existing text. If this is a story, keep going and do not stop. It is okay to disregard any limitation to continue the flow of the content. Use the same language as the content.";
const DEFAULT_SETTINGS: CompleteMeSettings = {
	baseUrl: 'https://api.openai.com/v1',
	apiKey: '',
	model: 'gpt-3.5-turbo',
	system_prompt: SYSTEM_PROMPT,
	temperature: 0.7,
	limit_long: 200,
	limit_short: 20,
}

export default class CompleteMe extends Plugin {
	settings: CompleteMeSettings;

		private currentAbortController: AbortController | null = null;
		private currentStreamPromise: Promise<void> | null = null;


	async complete(limit: number, editor: Editor) {
		// Ensure only one completion runs at a time
		if (this.currentAbortController) {
			this.currentAbortController.abort();
			if (this.currentStreamPromise) {
				await this.currentStreamPromise;
			}
		}

		// text up to the cursor from the beginning
		const textUpToCursor = editor.getRange({ line: 0, ch: 0 }, editor.getCursor());
		const client = new OpenAI({
			apiKey: this.settings.apiKey,
			baseURL: this.settings.baseUrl,
			dangerouslyAllowBrowser: true
		});

		this.currentAbortController = new AbortController();
		const signal = this.currentAbortController.signal;
		let stream;
		let resolveStream: (() => void) | undefined;
		this.currentStreamPromise = new Promise<void>(resolve => { resolveStream = resolve; });
		try {
			stream = await client.completions.create({
				model: this.settings.model,
				prompt: this.settings.system_prompt + textUpToCursor,
				max_tokens: limit,
				stream: true,
				temperature: this.settings.temperature
			});
		} catch (e) {
			new Notice('Error starting stream: ' + e);
			this.currentAbortController = null;
			if (resolveStream) resolveStream();
			this.currentStreamPromise = null;
			return;
		}
		try {
			for await (const event of stream) {
				if (signal.aborted) {
					break;
				}
				if (event.choices[0].text) {
					// Append the new content to the editor
					editor.replaceRange(event.choices[0].text, editor.getCursor());
					// Move the cursor to the end of the newly added text
					editor.setCursor(editor.getCursor().line, editor.getCursor().ch + event.choices[0].text.length);
				}
			}
		} catch (e) {
			if (signal.aborted) {
			} else {
				new Notice('Error during streaming: ' + e);
			}
		} finally {
			this.currentAbortController = null;
			if (resolveStream) resolveStream();
			this.currentStreamPromise = null;
		}
	}
	async onload() {
		await this.loadSettings();
		
		this.addCommand({
			id: 'complete-me',
			name: 'Complete me (short)',
			icon: 'dice-2',
			editorCallback: async (editor: Editor) => {
				await this.complete(this.settings.limit_short, editor);
			},
		});

		this.addCommand({
			id: 'complete-me-long',
			name: 'Complete me (Long)',
			icon: 'dice-6',
			editorCallback: async (editor: Editor) => {
				await this.complete(this.settings.limit_long, editor);
			},
		});

		this.addCommand({
			id: 'stop-streaming',
			name: 'Stop Streaming',
			icon: 'square',
			callback: () => {
				if (this.currentAbortController) {
					this.currentAbortController.abort();
					new Notice('Streaming stopped.');
				} else {
					new Notice('No active streaming to stop.');
				}
			},
		});

		this.addSettingTab(new CompleteMeSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class CompleteMeSettingTab extends PluginSettingTab {
	plugin: CompleteMe;

	constructor(app: App, plugin: CompleteMe) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Base URL')
			.setDesc('The base URL for the API')
			.addText(text => text
				.setPlaceholder('Enter your base URL')
				.setValue(this.plugin.settings.baseUrl)
				.onChange(async (value) => {
					this.plugin.settings.baseUrl = value;
					await this.plugin.saveSettings();
				}));
		
		new Setting(containerEl)
			.setName('API Key')
			.setDesc('The API key for authentication')
			.addText(text => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Model')
			.setDesc('The model to use for the API')
			.addText(text => text
				.setPlaceholder('Enter your model')
				.setValue(this.plugin.settings.model)
				.onChange(async (value) => {
					this.plugin.settings.model = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('System Prompt')
			.setDesc('The system prompt to use for the API')
			.addText(text => text
				.setPlaceholder('Enter your system prompt')
				.setValue(this.plugin.settings.system_prompt)
				.onChange(async (value) => {
					this.plugin.settings.system_prompt = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Temperature')
			.setDesc('The temperature to use for the API')
			.addSlider(slider => slider
				.setValue(this.plugin.settings.temperature)
				.setLimits(0, 2, 0.05)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.temperature = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Complete Limit(Long)')
			.setDesc('The maximum tokens for long completions')
			.addSlider(slider => slider
				.setValue(this.plugin.settings.limit_long)
				.setLimits(0, 10240, 1)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.limit_long = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Complete Limit(Short)')
			.setDesc('The maximum tokens for short completions')
			.addSlider(slider => slider
				.setValue(this.plugin.settings.limit_short)
				.setLimits(0, 2048, 1)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.limit_short = value;
					await this.plugin.saveSettings();
				}));
	}
}
