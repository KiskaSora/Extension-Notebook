/* eslint-disable no-restricted-globals */
import React, { useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { copyText, htmlToText } from './util.js';

/**
 * Component for displaying a page in the notebook.
 * @param {object} props - Component props
 * @param {import('./App').Page} props.page - The page to display
 * @param {string[]} props.groups - All group names
 * @param {function} props.onChange - The function to call when the page content changes
 * @returns
 */
export default function Page({ page, groups, onChange }) {
    const quillRef = useRef(null);

    /**
     * Turns **bold** and *italic* markers in the editor into real formatting.
     * @returns {boolean} true if something was converted
     */
    function applyMarkdown() {
        const quill = quillRef.current?.getEditor?.();
        if (!quill) return false;
        const rules = [
            { re: /()\*\*([^*\n]+)\*\*/, fmt: 'bold', mark: 2 },
            { re: /(^|[^*\w])\*([^*\n]+)\*(?![*\w])/, fmt: 'italic', mark: 1 },
        ];
        let changed = false;
        for (let guard = 0; guard < 200; guard++) {
            const text = quill.getText();
            let hit = null;
            for (const rule of rules) {
                const m = rule.re.exec(text);
                if (m) { hit = { rule, m }; break; }
            }
            if (!hit) break;
            const { rule, m } = hit;
            const start = m.index + m[1].length;
            const inner = m[2].length;
            const sel = quill.getSelection();
            const atEnd = !!sel && sel.length === 0 && sel.index === start + rule.mark * 2 + inner;
            quill.deleteText(start + rule.mark + inner, rule.mark, 'api');
            quill.deleteText(start, rule.mark, 'api');
            quill.formatText(start, inner, rule.fmt, true, 'api');
            if (atEnd) { quill.setSelection(start + inner, 0, 'api'); quill.format(rule.fmt, false, 'api'); }
            changed = true;
        }
        return changed;
    }

    const busy = useRef(false);
    function handleEditorChange(content, delta, source) {
        if (busy.current) return;
        if (source === 'user') {
            busy.current = true;
            try {
                if (applyMarkdown()) {
                    const html = quillRef.current.getEditor().root.innerHTML;
                    busy.current = false;
                    onChange({ ...page, content: html });
                    return;
                }
            } finally { busy.current = false; }
        }
        onChange({ ...page, content });
    }

    return (
        <div className="flex-container flexFlowColumn">
            <div className="flex-container alignItemsCenter">
                <input placeholder="Название..." className="text_pole flex1" type="text" value={page.title} onChange={(event) => onChange({ ...page, title: event.target.value })} />
                <i className="right_menu_button fa-solid fa-copy" title="Копировать всю заметку" onClick={() => copyText(htmlToText(page.content))}></i>
                <i className="right_menu_button fa-solid fa-trash" title="Удалить заметку" onClick={() => confirm('Удалить заметку?') && onChange(null)}></i>
            </div>
            <div className="flex-container alignItemsCenter">
                <span className="nb-group-label"><i className="fa-solid fa-folder"></i></span>
                <select className="text_pole flex1" value={page.group || ''} onChange={(event) => onChange({ ...page, group: event.target.value })}>
                    <option value="">Без группы</option>
                    {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
            </div>
            <ReactQuill ref={quillRef} placeholder="Пиши здесь..." theme="snow" value={page.content} onChange={handleEditorChange} scrollingContainer={document.getElementById('notebookPanelHolder')} />
        </div>
    );
}
