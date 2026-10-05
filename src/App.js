/* global SillyTavern */
/* global jQuery */
import { useState, useEffect } from 'react';
import _ from 'lodash';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import Page from './Page';
import { importFromUrl } from './util.js';

/**
 * @typedef {object} Page
 * @property {string} title - The title of the page
 * @property {string} content - The content of the page
 * @property {string} [group] - Group name ('' or missing = no group)
 */

const dragElement = await importFromUrl('/scripts/RossAscends-mods.js', 'dragElement', () => { });

/**
 * Persistent state manager for the notebook.
 */
class StateManager {
    /** @returns {Page[]} */
    static getPages() {
        return _.get(SillyTavern.getContext(), 'extensionSettings.notebook.pages', []);
    }

    /** @param {Page[]} pages */
    static setPages(pages) {
        const context = SillyTavern.getContext();
        _.set(context, 'extensionSettings.notebook.pages', pages);
        context.saveSettingsDebounced();
    }

    /** @returns {string[]} */
    static getGroups() {
        return _.get(SillyTavern.getContext(), 'extensionSettings.notebook.groups', []);
    }

    /** @param {string[]} groups */
    static setGroups(groups) {
        const context = SillyTavern.getContext();
        _.set(context, 'extensionSettings.notebook.groups', groups);
        context.saveSettingsDebounced();
    }
}

function App({ onCloseClicked }) {
    const [pages, setPages] = useState(StateManager.getPages());
    const [groups, setGroups] = useState(StateManager.getGroups());
    // null = all notes, '' = notes without group, 'name' = that group
    const [activeGroup, setActiveGroup] = useState(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        dragElement(jQuery(document.getElementById('notebookPanel')));
    }, []);

    // groups from the list plus any group names found on pages (just in case)
    const allGroups = _.uniq([...groups, ...pages.map(p => p.group).filter(Boolean)]);
    const visible = pages
        .map((page, index) => ({ page, index }))
        .filter(({ page }) => activeGroup === null || (page.group || '') === activeGroup);
    const sel = Math.min(selectedIndex, visible.length);
    const countIn = (g) => pages.filter(p => (p.group || '') === g).length;

    function commitPages(newPages) {
        setPages(newPages);
        StateManager.setPages(newPages);
    }

    function commitGroups(newGroups) {
        setGroups(newGroups);
        StateManager.setGroups(newGroups);
    }

    function handleChange(index, page) {
        const newPages = [...pages];
        if (!page) {
            newPages.splice(index, 1);
            setSelectedIndex(Math.max(0, sel - 1));
        } else {
            newPages[index] = page;
        }
        commitPages(newPages);
    }

    function addPage() {
        const group = typeof activeGroup === 'string' ? activeGroup : '';
        commitPages([...pages, { title: 'Без названия', content: '', group }]);
    }

    function pickGroup(g) {
        setActiveGroup(g);
        setSelectedIndex(0);
    }

    function addGroup() {
        const name = (prompt('Название новой группы:') || '').trim();
        if (!name) return;
        if (!allGroups.includes(name)) commitGroups([...groups, name]);
        pickGroup(name);
    }

    function renameGroup() {
        const name = (prompt('Новое название группы:', activeGroup) || '').trim();
        if (!name || name === activeGroup) return;
        if (allGroups.includes(name)) { alert('Такая группа уже есть'); return; }
        commitGroups(allGroups.map(g => g === activeGroup ? name : g));
        commitPages(pages.map(p => p.group === activeGroup ? { ...p, group: name } : p));
        setActiveGroup(name);
    }

    function deleteGroup() {
        if (!confirm(`Удалить группу «${activeGroup}»? Заметки останутся, но станут «Без группы».`)) return;
        commitGroups(allGroups.filter(g => g !== activeGroup));
        commitPages(pages.map(p => p.group === activeGroup ? { ...p, group: '' } : p));
        pickGroup(null);
    }

    function sliceTitle(title) {
        return title && title.length > 12 ? title.slice(0, 12) + '…' : title;
    }

    const chip = (label, value, count) => (
        <div key={String(value)} className={'nb-chip' + (activeGroup === value ? ' active' : '')} onClick={() => pickGroup(value)}>
            {label}{count !== undefined ? ` (${count})` : ''}
        </div>
    );

    return (
        <>
            <div className="panelControlBar flex-container alignItemsBaseline">
                <div id="notebookPanelheader" className="fa-fw fa-solid fa-grip drag-grabber"></div>
                <div id="notebookPanelMaximize" className="inline-drawer-maximize">
                    <i className="floating_panel_maximize fa-fw fa-solid fa-window-maximize"></i>
                </div>
                <div id="notebookPanelClose" className="fa-fw fa-solid fa-circle-xmark floating_panel_close" onClick={() => onCloseClicked()}></div>
            </div>
            <div id="notebookPanelHolder" name="notebookPanelHolder" className="scrollY">
                <div className="nb-groups">
                    {chip('Все', null, pages.length)}
                    {chip('Без группы', '', countIn(''))}
                    {allGroups.map(g => chip(g, g, countIn(g)))}
                    <div className="nb-chip nb-chip-add" onClick={addGroup} title="Новая группа"><i className="fa-solid fa-folder-plus"></i></div>
                    {activeGroup && (
                        <>
                            <div className="nb-chip nb-chip-add" onClick={renameGroup} title="Переименовать группу"><i className="fa-solid fa-pencil"></i></div>
                            <div className="nb-chip nb-chip-add" onClick={deleteGroup} title="Удалить группу"><i className="fa-solid fa-trash"></i></div>
                        </>
                    )}
                </div>
                <Tabs selectedIndex={sel} onSelect={(index) => setSelectedIndex(index)}>
                    <TabList>
                        {visible.map(({ page, index }) => (
                            <Tab key={index}>{sliceTitle(page.title) || '[Без названия]'}</Tab>
                        ))}
                        <Tab onClick={() => addPage()} title="Новая заметка">
                            <i className="fa-solid fa-plus"></i>
                        </Tab>
                    </TabList>
                    {visible.map(({ page, index }) => (
                        <TabPanel key={index}>
                            <Page page={page} groups={allGroups} onChange={(newPage) => handleChange(index, newPage)} />
                        </TabPanel>
                    ))}
                    <TabPanel>
                    </TabPanel>
                    {visible.length === 0 && (
                        <div className="flex-container flexFlowColumn alignItemsCenter">
                            <h3>Нажми +, чтобы добавить заметку.</h3>
                        </div>
                    )}
                </Tabs>
            </div>
        </>
    );
}

export default App;
