// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import ollama from 'ollama';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('deep-code-assistant.start', () => {
		const panel = vscode.window.createWebviewPanel(
			'deepChat',
		'Deep Seek Chat',
		vscode.ViewColumn.One,
		{enableScripts: true}
		);

		panel.webview.html = getWebviewContent();

		panel.webview.onDidReceiveMessage(async (message: any) => {
			if (message.command === 'chat') {
				const userPrompt = `${message.promptByUser}\n\n Please answer in English and warn the user about the fact that you are the 8b parameter model and can make mistakes more than the latest r1 model.`;
				let responseByAI = ''

				try {
					const streamResponse = await ollama.chat({
						model: 'deepseek-r1:8b',
						messages: [{ role: 'user', content: userPrompt}],
						stream: true
				});

				for await (const part of streamResponse) {
					responseByAI += part.message.content;
					panel.webview.postMessage({ command: 'chatResponse', text: responseByAI});
				}

				} catch (err) {
					panel.webview.postMessage({ command: 'chatResponse', text: `Error: ${String(err)}`});
				}
			}
		});
	});

	context.subscriptions.push(disposable);
}

function getWebviewContent(): string {
	return /*html*/`
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<style>
			body { 
				font-family: var(--vscode-font-family, sans-serif);
				background-color: var(--vscode-editor-background,);
				color: var(--vscode-editor-foreground,);
				padding: 20px;
				margin: 0; 
			}

			.container {
				max-width: 800px;
				margin: 0 auto;
			}

			h2 {
				color: var(--vscode-titleBar-activeForeground,);
				border-bottom: 1px solid var(--vscode-editor-foreground);
				padding-bottom: 8px;
				margin-bottom: 20px;
			}

			#promptByUser { 
				width: 100%; 
				padding: 12px;
				background-color: var(--vscode-input-background);
				color: var(--vscode-input-foreground);
				border: 1px solid var(--vscode-input-border);
				border-radius: 4px;
				margin-bottom: 16px;
				resize: vertical;
				min-height: 100px;
				}

				.button-group {
					display: flex;
					gap: 8px;
					margin-bottom: 20px;
				}

				button {
					padding: 8px 16px;
					background-color: var(--vscode-button-background);
					color: var(--vscode-button-foreground);
					border: none;
					border-radius: 4px;
					cursor: pointer;
					transition: opacity 0.2s;
				}

				button:hover {
					opacity: 0.8;
				}

				button#stopBtn {
					background-color: var(--vscode-errorForeground);
					display: none;
				}

			#response { 
				background-color: var(--vscode-editorWidget-background);
				border: 1px solid var(--vscode-editorWidget-border);
				border-radius: 4px;
				padding: 16px;
				white-space: pre-wrap;
				font-family: var(--vscode-editor-font-family, monospace);
				line-height: 1.5;
				min-height: 200px;
			}

			/* Loading Animation */
			.loader {
				display: none;
				border: 3px solid var(--vscode-editor-background);
				border-top: 3px solid var(--vscode-button-background);
				border-radius: 50%;
				width: 24px;
				height: 24px;
				animation: spin 1s linear infinite;
				margin: 20px auto;
			}

			@keyframes spin {
				0% { transform: rotate(0deg);}
				100% { transform: rotate(360deg);}
			}
		</style>
	</head>
	<body>
		<div class="container">
				<h2>Deep Code Assistant</h2>
				<textarea id="promptByUser" rows="3" placeholder="Ask a question">
				</textarea>
				<div class="button-group">
					<button id="askBtn">Ask</button>
					<button id="stopBtn">Stop</button>
				</div>

				<div id="loader" class="loader"></div>
				<div id="response"></div>
			</div>
			<script>
				const vscode = acquireVsCodeApi();
				const askBtn = document.getElementById('askBtn');
				const stopBtn = document.getElementById('stopBtn');
				const loader = document.getElementById('loader');
				const responseDiv = document.getElementById('response');

				document.getElementById('askBtn').addEventListener('click', () => {
					const promptByUser = document.getElementById('promptByUser').value;
					if (promptByUser.trim() !== '') {
						responseDiv.textContent = ''; //Clear previous response
						loader.style.display = 'block'; //Show loader
						stopBtn.style.display = 'inline-block'; //Show stop button
						vscode.postMessage({ command: 'chat', promptByUser });
					}
				});
				
				stopBtn.addEventListener('click', () => {
					loader.style.display = 'none';
					stopBtn.style.display = 'none';
					vscode.postMessage({ command: 'stop'});
				});

				window.addEventListener('message', event => {
					const { command, text } = event.data;
					if (command === 'chatResponse') {
						loader.style.display = 'none';
						stopBtn.style.display = 'none';
						responseDiv.textContent = text;
						
						//Smooth scroll to bottom
						responseDiv.scrollTop = responseDiv.scrollHeight;
					}
				});
			</script>
	</body>
	</html>
	`
}
// This method is called when your extension is deactivated
export function deactivate() {}
