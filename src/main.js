import './style.css';
import Alpine from 'alpinejs';
import Sortable from 'sortablejs';
import defaultConfig from './config.json';

document.addEventListener('alpine:init', () => {
    Alpine.directive('favicon', (el, { expression }, { evaluate }) => {
        const siteUrl = evaluate(expression);
        let domain = '';
        try {
            domain = new URL(siteUrl).hostname;
        } catch (e) {
            domain = siteUrl.replace(/^https?:\/\//, '').split('/')[0];
        }

        const baseUrl = `https://favicon.vemetric.com/${domain}`;
        const highResUrl = `${baseUrl}?size=128`;

        el.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                observer.disconnect();
                const img = new Image();
                img.onload = () => { el.src = highResUrl; };
                img.onerror = () => {
                    const retryImg = new Image();
                    retryImg.onload = () => { el.src = baseUrl; };
                    retryImg.onerror = () => { el.style.display = 'none'; };
                    retryImg.src = baseUrl;
                };
                img.src = highResUrl;
            }
        }, { rootMargin: '100% 0px' });

        observer.observe(el);
    });
});

window.Alpine = Alpine;

Alpine.store('data', {
    groups: [],
    config: {},
    saveTimer: null,

    init() {
        this.config = defaultConfig || {};
        const local = localStorage.getItem('app_nav_data');
        if (local) {
            try {
                const parsed = JSON.parse(local);
                this.groups = parsed.groups || parsed;
            } catch(e) { console.error(e); }
        }
        else if (defaultConfig && defaultConfig.groups) {
            this.groups = JSON.parse(JSON.stringify(defaultConfig.groups));
        }
    },

    persist() {
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            localStorage.setItem('app_nav_data', JSON.stringify({ groups: this.groups }));
        }, 500);
    },

    addGroup(name) { this.groups.push({ id: `g-${Date.now()}`, name, sites: [] }); this.persist(); },
    deleteGroup(idx) { this.groups.splice(idx, 1); this.persist(); },
    updateGroup(idx, name) { this.groups[idx].name = name; this.persist(); },

    addSite(gIdx, site) { this.groups[gIdx].sites.push({ ...site, id: `s-${Date.now()}` }); this.persist(); },
    updateSite(gIdx, sIdx, site) {
        const id = this.groups[gIdx].sites[sIdx].id;
        this.groups[gIdx].sites[sIdx] = { ...site, id };
        this.persist();
    },
    deleteSite(gIdx, sIdx) { this.groups[gIdx].sites.splice(sIdx, 1); this.persist(); },

    moveGroup(from, to) {
        const item = this.groups.splice(from, 1)[0];
        this.groups.splice(to, 0, item);
        this.persist();
    },
    moveSite(fromG, toG, fromS, toS) {
        const item = this.groups[fromG].sites.splice(fromS, 1)[0];
        this.groups[toG].sites.splice(toS, 0, item);
        this.persist();
    }
});

Alpine.store('ui', {
    isDark: false,
    isEditMode: false,
    searchQuery: '',
    modal: { type: null, context: null },

    init() {
        const saved = localStorage.getItem('app_theme_mode');
        const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.isDark = saved === 'dark' || (!saved && sysDark);
        this.applyTheme();
    },

    toggleTheme() {
        this.isDark = !this.isDark;
        localStorage.setItem('app_theme_mode', this.isDark ? 'dark' : 'light');
        this.applyTheme();
    },

    applyTheme() { document.documentElement.classList.toggle('dark', this.isDark); },

    toggleEditMode() {
        this.isEditMode = !this.isEditMode;
        window.dispatchEvent(new CustomEvent('edit-mode-toggled', { detail: this.isEditMode }));
    },

    openModal(type, context = {}) {
        this.modal.type = type;
        this.modal.context = JSON.parse(JSON.stringify(context));
    },
    closeModal() { this.modal.type = null; this.modal.context = null; }
});

Alpine.store('sync', {
    config: { owner: '', repo: '', token: '' },
    status: 'idle',
    message: '',

    init() {
        const saved = localStorage.getItem('app_gh_config');
        if (saved) { try { this.config = JSON.parse(saved); } catch(e) {} }
    },

    saveConfig(cfg) {
        this.config = cfg;
        localStorage.setItem('app_gh_config', JSON.stringify(cfg));
    },

    checkConfig() { return this.config.owner && this.config.repo && this.config.token; },

    async _fetchFile(path, method = 'GET', body = null) {
        const { owner, repo, token } = this.config;
        const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        };
        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);

        const res = await fetch(url, opts);
        if (!res.ok && res.status !== 404) throw new Error(`GitHub API Error: ${res.status}`);
        return res;
    },

    async push() {
        if (!this.checkConfig()) return Alpine.store('ui').openModal('sync');

        const storeData = Alpine.store('data');
        this.status = 'syncing';
        this.message = '连接 GitHub...';

        try {
            let sha = '';
            const checkRes = await this._fetchFile('src/config.json');
            if (checkRes.ok) {
                const data = await checkRes.json();
                sha = data.sha;
            }

            this.message = '上传配置...';
            const contentObj = {
                title: storeData.config.title || '个人导航',
                groups: storeData.groups
            };

            const jsonStr = JSON.stringify(contentObj, null, 4);
            const encoder = new TextEncoder();
            const data = encoder.encode(jsonStr);
            const contentEncoded = btoa(String.fromCharCode(...data));

            const updateRes = await this._fetchFile('src/config.json', 'PUT', {
                message: 'Update via Web UI',
                content: contentEncoded,
                sha: sha || undefined
            });

            if (!updateRes.ok) throw new Error('上传失败，请检查 Token 权限');

            this.status = 'success';
            this.message = '同步成功';
            setTimeout(() => {
                if(this.status === 'success') {
                    this.status = 'idle';
                    Alpine.store('ui').closeModal();
                }
            }, 1500);
        } catch (error) {
            console.error(error);
            this.status = 'error';
            this.message = error.message;
        }
    },

    async pull() {
        if (!this.checkConfig()) return Alpine.store('ui').openModal('sync');

        this.status = 'syncing';
        this.message = '下载配置...';

        try {
            const res = await this._fetchFile('src/config.json');
            if (!res.ok) throw new Error('云端未找到配置文件');

            const fileData = await res.json();

            const binaryStr = atob(fileData.content);
            const bytes = Uint8Array.from(binaryStr, c => c.charCodeAt(0));
            const content = new TextDecoder('utf-8').decode(bytes);

            const parsed = JSON.parse(content);
            if (!parsed.groups) throw new Error('配置格式不符');

            localStorage.setItem('app_nav_data', JSON.stringify({ groups: parsed.groups }));

            this.status = 'success';
            this.message = '下载成功，刷新中...';
            setTimeout(() => location.reload(), 1000);
        } catch (error) {
            this.status = 'error';
            this.message = error.message;
        }
    }
});

document.addEventListener('alpine:initialized', () => {
    let sortables = [];
    const dataStore = Alpine.store('data');

    function initSortable(enable) {
        sortables.forEach(s => s.destroy());
        sortables = [];
        if (!enable) return;

        const groupContainer = document.getElementById('groups-container');
        if (groupContainer) {
            sortables.push(new Sortable(groupContainer, {
                handle: '.group-handle',
                animation: 150,
                ghostClass: 'ghost',
                onEnd: (evt) => dataStore.moveGroup(evt.oldIndex, evt.newIndex)
            }));
        }

        document.querySelectorAll('.site-list').forEach(el => {
            sortables.push(new Sortable(el, {
                group: 'sites',
                draggable: '[data-id]',
                animation: 150,
                ghostClass: 'ghost',
                onEnd: (evt) => {
                    const fromGroupIdx = parseInt(evt.from.closest('.group-section').dataset.index);
                    const toGroupIdx = parseInt(evt.to.closest('.group-section').dataset.index);
                    dataStore.moveSite(fromGroupIdx, toGroupIdx, evt.oldIndex, evt.newIndex);
                }
            }));
        });
    }

    window.addEventListener('edit-mode-toggled', (e) => initSortable(e.detail));
});

Alpine.start();