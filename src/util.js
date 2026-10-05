/**
 * Import a member from a URL, bypassing webpack.
 * @param {string} url URL to import from
 * @param {string} what Name of the member to import
 * @param {any} defaultValue Fallback value
 * @returns {any} Imported member
 */
export async function importFromUrl(url, what, defaultValue = null) {
    try {
        const module = await import(/* webpackIgnore: true */ url);
        if (!Object.hasOwn(module, what)) {
            throw new Error(`No ${what} in module`);
        }
        return module[what];
    }
     catch (error) {
        console.error(`Failed to import ${what} from ${url}: ${error}`);
        return defaultValue;
     }
}

/**
 * Copy text to clipboard (works on mobile / non-secure contexts too).
 * @param {string} text
 */
export async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text);
    } catch {
        const a = document.createElement('textarea');
        a.value = text;
        a.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(a);
        a.focus();
        a.select();
        document.execCommand('copy');
        a.remove();
    }
    // eslint-disable-next-line no-undef
    if (typeof toastr !== 'undefined') toastr.success('Скопировано');
}

/**
 * Convert Quill HTML to plain text with sane newlines.
 * @param {string} html
 * @returns {string}
 */
export function htmlToText(html) {
    const prepared = String(html || '')
        .replace(/<p><br\s*\/?><\/p>/gi, '\n')
        .replace(/<\/(p|div|h\d|li)>|<br\s*\/?>/gi, '\n');
    const div = document.createElement('div');
    div.innerHTML = prepared;
    return div.textContent.replace(/\n{3,}/g, '\n\n').trim();
}
