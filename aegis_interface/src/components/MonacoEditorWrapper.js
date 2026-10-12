/**
 * MonacoEditorWrapper Component
 * Wraps Monaco Editor with textarea fallback for terminal code highlighting
 * Used by TerminalSystem.js for interactive code syntax highlighting
 */

export function MonacoEditor(container, options) {
    const editor = {
        container: container,
        options: Object.assign({
            language: 'javascript',
            theme: 'aegis-dark',
            readOnly: false,
            fontSize: 13,
            minimap: false,
            lineNumbers: true,
            wordWrap: 'on',
            tabSize: 4,
            value: ''
        }, options || {}),
        monaco: null,
        editorInstance: null,
        fallbackActive: false,
        fallbackTextarea: null,
        resizeObserver: null
    };

    function init() {
        container.innerHTML = '';
        container.className = 'monaco-editor-wrapper';
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '100%';
        container.style.overflow = 'hidden';
        container.style.background = 'var(--bg-primary, #0a0a1a)';

        if (typeof window.monaco !== 'undefined' && window.monaco.editor) {
            initMonaco();
        } else {
            loadMonacoCDN()
                .then(() => initMonaco())
                .catch(() => initFallback());
        }
    }

    function loadMonacoCDN() {
        return new Promise((resolve, reject) => {
            if (typeof window.monaco !== 'undefined' && window.monaco.editor) {
                resolve();
                return;
            }
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/editor/editor.min.css';
            document.head.appendChild(link);

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.min.js';
            script.async = true;
            script.onload = () => {
                require.config({
                    paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' }
                });
                require(['vs/editor/editor.main'], () => {
                    defineAegisTheme();
                    resolve();
                });
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    function defineAegisTheme() {
        if (!window.monaco || !window.monaco.editor) return;
        window.monaco.editor.defineTheme('aegis-dark', {
            base: 'vs-dark',
            inherit: true,
            rules: [
                { token: 'comment', foreground: '48486a', fontStyle: 'italic' },
                { token: 'keyword', foreground: '7c3aed' },
                { token: 'string', foreground: '00ff88' },
                { token: 'number', foreground: '00f0ff' },
                { token: 'type', foreground: '00f0ff' },
                { token: 'function', foreground: 'ff8800' },
                { token: 'variable', foreground: 'd0d0ec' },
                { token: 'operator', foreground: 'ff2244' }
            ],
            colors: {
                'editor.background': '#04040a',
                'editor.foreground': '#d0d0ec',
                'editor.lineHighlightBackground': 'rgba(0,240,255,0.04)',
                'editor.selectionBackground': 'rgba(0,240,255,0.12)',
                'editorCursor.foreground': '#00f0ff',
                'editorLineNumber.foreground': '#48486a',
                'editorLineNumber.activeForeground': '#00f0ff',
                'editor.selectionHighlightBackground': 'rgba(0,240,255,0.06)',
                'editorBracketMatch.background': 'rgba(0,240,255,0.1)',
                'editorBracketMatch.border': 'rgba(0,240,255,0.3)'
            }
        });
    }

    function initMonaco() {
        if (editor.monaco) return;
        editor.monaco = window.monaco;
        defineAegisTheme();
        editor.editorInstance = editor.monaco.editor.create(container, {
            value: editor.options.value,
            language: editor.options.language,
            theme: 'aegis-dark',
            readOnly: editor.options.readOnly,
            fontSize: editor.options.fontSize,
            minimap: { enabled: editor.options.minimap },
            lineNumbers: editor.options.lineNumbers ? 'on' : 'off',
            wordWrap: editor.options.wordWrap,
            tabSize: editor.options.tabSize,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: 'selection',
            bracketPairColorization: { enabled: true },
            padding: { top: 4, bottom: 4 },
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                verticalScrollbarSize: 6,
                horizontalScrollbarSize: 6,
                useShadows: false
            }
        });
        editor.editorInstance.onDidChangeModelContent(() => {
            if (editor.options.onChange) {
                editor.options.onChange(editor.getValue());
            }
        });
        editor.editorInstance.focus();
        editor.fallbackActive = false;
    }

    function initFallback() {
        if (editor.fallbackTextarea) return;
        editor.fallbackActive = true;
        editor.fallbackTextarea = document.createElement('textarea');
        const ta = editor.fallbackTextarea;
        ta.className = 'monaco-fallback-textarea';
        ta.value = editor.options.value;
        ta.spellcheck = false;
        ta.style.cssText = `
            width:100%;height:100%;resize:none;
            background:#04040a;color:#d0d0ec;
            font-family:'JetBrains Mono','Fira Code','Cascadia Code',monospace;
            font-size:${editor.options.fontSize}px;
            border:none;outline:none;padding:8px;
            tab-size:4;
            line-height:1.5;
            caret-color:#00f0ff;
        `;
        ta.addEventListener('input', () => {
            if (editor.options.onChange) {
                editor.options.onChange(ta.value);
            }
        });
        container.appendChild(ta);
        ta.focus();
    }

    function getValue() {
        if (editor.editorInstance) return editor.editorInstance.getValue();
        if (editor.fallbackTextarea) return editor.fallbackTextarea.value;
        return editor.options.value;
    }

    function setValue(val) {
        if (editor.editorInstance) {
            editor.editorInstance.setValue(val);
        } else if (editor.fallbackTextarea) {
            editor.fallbackTextarea.value = val;
        }
        editor.options.value = val;
    }

    function setLanguage(lang) {
        editor.options.language = lang;
        if (editor.editorInstance && editor.monaco) {
            editor.monaco.editor.setModelLanguage(editor.editorInstance.getModel(), lang);
        }
    }

    function setReadOnly(ro) {
        editor.options.readOnly = ro;
        if (editor.editorInstance) {
            editor.editorInstance.updateOptions({ readOnly: ro });
        } else if (editor.fallbackTextarea) {
            editor.fallbackTextarea.readOnly = ro;
        }
    }

    function focus() {
        if (editor.editorInstance) {
            editor.editorInstance.focus();
        } else if (editor.fallbackTextarea) {
            editor.fallbackTextarea.focus();
        }
    }

    function dispose() {
        if (editor.editorInstance) {
            editor.editorInstance.dispose();
            editor.editorInstance = null;
        }
        if (editor.resizeObserver) {
            editor.resizeObserver.disconnect();
            editor.resizeObserver = null;
        }
        if (editor.fallbackTextarea) {
            editor.fallbackTextarea.remove();
            editor.fallbackTextarea = null;
        }
        container.innerHTML = '';
    }

    return {
        init,
        getValue,
        setValue,
        setLanguage,
        setReadOnly,
        focus,
        dispose,
        isFallbackActive: () => editor.fallbackActive
    };
}
