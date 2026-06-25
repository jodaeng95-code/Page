(() => {
  const STORAGE_KEY = 'yt-slots-v1';

  function loadAll() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }

  function saveAll(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch {}
  }

  function getSlotData(id) {
    return id ? (loadAll()[id] || null) : null;
  }

  function setSlotData(id, data) {
    if (!id) return;
    const all = loadAll();
    if (data) all[id] = data;
    else delete all[id];
    saveAll(all);
  }

  function parseYtId(url) {
    if (!url) return null;
    url = url.trim();
    try {
      const u = new URL(url);
      if (u.hostname === 'youtu.be')
        return u.pathname.slice(1).split(/[?&]/)[0];
      if (u.hostname.includes('youtube.com')) {
        if (u.pathname.startsWith('/shorts/'))
          return u.pathname.replace('/shorts/', '').split(/[?/]/)[0];
        if (u.pathname.startsWith('/embed/'))
          return u.pathname.replace('/embed/', '').split(/[?/]/)[0];
        return u.searchParams.get('v');
      }
    } catch {}
    const m = url.match(/(?:v=|youtu\.be\/|\/embed\/|\/shorts\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  const CSS = `
    :host {
      display: block;
      position: relative;
      width: 100%;
    }
    * { box-sizing: border-box; }

    .wrap {
      position: absolute;
      inset: 0;
      overflow: hidden;
      border-radius: var(--slot-r, 14px);
    }

    /* ── Empty state ── */
    .empty {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      background: rgba(255,255,255,0.04);
      border: 1.5px dashed rgba(255,255,255,0.16);
      border-radius: var(--slot-r, 14px);
      color: rgba(237,235,255,0.45);
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s, color 0.15s;
      user-select: none;
    }
    .empty:hover {
      background: rgba(124,92,255,0.08);
      border-color: rgba(124,92,255,0.45);
      color: rgba(237,235,255,0.75);
    }
    .empty:hover .yt-icon { opacity: 0.9; }
    .yt-icon { transition: opacity 0.15s; }
    .empty .cap { font-size: 12px; font-weight: 600; font-family: "Pretendard Variable", Pretendard, system-ui; }
    .empty .sub { font-size: 11px; opacity: 0.6; font-family: "Pretendard Variable", Pretendard, system-ui; }

    /* ── Input state ── */
    .input-wrap {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px;
      background: rgba(8,7,17,0.94);
      border-radius: var(--slot-r, 14px);
      border: 1px solid rgba(124,92,255,0.35);
    }
    .input-wrap .label {
      font-size: 12px;
      font-weight: 700;
      color: rgba(237,235,255,0.6);
      font-family: "Pretendard Variable", Pretendard, system-ui;
      letter-spacing: 0.04em;
      align-self: flex-start;
    }
    .input-wrap input {
      width: 100%;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.14);
      border-radius: 8px;
      padding: 9px 12px;
      color: #EDEBFF;
      font-size: 12px;
      font-family: "Pretendard Variable", Pretendard, system-ui;
      outline: none;
      transition: border-color 0.15s, background 0.15s;
    }
    .input-wrap input:focus {
      border-color: rgba(124,92,255,0.55);
      background: rgba(124,92,255,0.07);
    }
    .input-wrap input.error {
      border-color: rgba(255,80,80,0.6);
      background: rgba(255,50,50,0.06);
    }
    .input-wrap input::placeholder { color: rgba(237,235,255,0.25); }
    .btns { display: flex; gap: 7px; width: 100%; margin-top: 2px; }
    .btn-confirm {
      flex: 1;
      background: linear-gradient(135deg, #7C5CFF, #22D3EE);
      color: #08070F;
      border: none;
      border-radius: 7px;
      padding: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      font-family: "Pretendard Variable", Pretendard, system-ui;
      transition: opacity 0.15s;
    }
    .btn-confirm:hover { opacity: 0.88; }
    .btn-cancel {
      background: rgba(255,255,255,0.07);
      color: rgba(237,235,255,0.65);
      border: 1px solid rgba(255,255,255,0.13);
      border-radius: 7px;
      padding: 8px 13px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      font-family: "Pretendard Variable", Pretendard, system-ui;
    }
    .btn-cancel:hover { background: rgba(255,255,255,0.11); }

    /* ── Filled state ── */
    .filled {
      position: absolute;
      inset: 0;
      border-radius: var(--slot-r, 14px);
      overflow: hidden;
      cursor: pointer;
    }
    .thumb {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.35s ease;
    }
    .filled:hover .thumb {
      transform: scale(1.04);
    }
    .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(8,7,17,0.72) 0%, rgba(8,7,17,0.1) 55%, transparent 100%);
      transition: background 0.25s;
    }
    .filled:hover .overlay {
      background: linear-gradient(to top, rgba(8,7,17,0.78) 0%, rgba(8,7,17,0.25) 55%, rgba(8,7,17,0.1) 100%);
    }
    .play {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      width: 46px;
      height: 46px;
      background: rgba(255,255,255,0.14);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: transform 0.2s, opacity 0.2s, background 0.2s;
    }
    .filled:hover .play {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
      background: rgba(255,255,255,0.22);
    }
    .yt-badge {
      position: absolute;
      bottom: 10px;
      left: 10px;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .filled:hover .yt-badge { opacity: 1; }
    .ctl {
      position: absolute;
      top: 8px;
      right: 8px;
      display: flex;
      gap: 5px;
      opacity: 0;
      transition: opacity 0.15s;
      pointer-events: none;
    }
    .filled:hover .ctl {
      opacity: 1;
      pointer-events: auto;
    }
    .ctl button {
      appearance: none;
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 4px 10px;
      cursor: pointer;
      background: rgba(8,7,17,0.78);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: #EDEBFF;
      font-size: 11px;
      font-weight: 600;
      font-family: "Pretendard Variable", Pretendard, system-ui;
      transition: background 0.12s;
    }
    .ctl button:hover { background: rgba(8,7,17,0.96); }
    .ctl button.del:hover { background: rgba(180,30,30,0.75); border-color: rgba(255,80,80,0.3); }
  `;

  const YT_ICON = `<svg width="30" height="21" viewBox="0 0 30 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="30" height="21" rx="5" fill="#FF0033"/>
    <path d="M12 6.5v8l7-4-7-4z" fill="white"/>
  </svg>`;

  const PLAY_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="white">
    <path d="M8 5v14l11-7z"/>
  </svg>`;

  class YtSlot extends HTMLElement {
    static get observedAttributes() { return ['placeholder', 'radius']; }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${CSS}</style><div class="wrap"></div>`;
      this._wrap = root.querySelector('.wrap');
      this._state = 'empty';
      this._data = null;
    }

    connectedCallback() {
      this._applyRadius();
      const stored = getSlotData(this.id);
      if (stored && stored.id) {
        this._data = stored;
        this._state = 'filled';
      }
      this._render();
    }

    attributeChangedCallback() {
      if (this.shadowRoot) {
        this._applyRadius();
        this._render();
      }
    }

    _applyRadius() {
      const r = this.getAttribute('radius') || '14';
      this._wrap.style.setProperty('--slot-r', r + 'px');
      this.shadowRoot.host.style.setProperty('--slot-r', r + 'px');
    }

    _render() {
      this._wrap.innerHTML = '';

      if (this._state === 'empty') {
        this._renderEmpty();
      } else if (this._state === 'inputting') {
        this._renderInput();
      } else if (this._state === 'filled') {
        this._renderFilled();
      }
    }

    _renderEmpty() {
      const el = document.createElement('div');
      el.className = 'empty';
      const ph = this.getAttribute('placeholder') || '유튜브 링크 입력';
      el.innerHTML = `
        <div class="yt-icon">${YT_ICON}</div>
        <div class="cap">${ph}</div>
        <div class="sub">클릭해서 링크 붙여넣기</div>
      `;
      el.addEventListener('click', () => {
        this._state = 'inputting';
        this._render();
      });
      this._wrap.appendChild(el);
    }

    _renderInput() {
      const el = document.createElement('div');
      el.className = 'input-wrap';
      el.innerHTML = `
        <div class="yt-icon">${YT_ICON}</div>
        <div class="label">유튜브 링크 붙여넣기</div>
        <input type="text" placeholder="https://youtube.com/watch?v=..." autocomplete="off" spellcheck="false">
        <div class="btns">
          <button class="btn-confirm">확인</button>
          <button class="btn-cancel">취소</button>
        </div>
      `;

      const input = el.querySelector('input');
      const confirmBtn = el.querySelector('.btn-confirm');
      const cancelBtn = el.querySelector('.btn-cancel');

      const confirm = () => {
        const ytId = parseYtId(input.value);
        if (!ytId) {
          input.classList.add('error');
          input.focus();
          setTimeout(() => input.classList.remove('error'), 1200);
          return;
        }
        this._data = { id: ytId, url: `https://www.youtube.com/watch?v=${ytId}` };
        setSlotData(this.id, this._data);
        this._state = 'filled';
        this._render();
      };

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') confirm();
        if (e.key === 'Escape') {
          this._state = this._data ? 'filled' : 'empty';
          this._render();
        }
      });

      // Auto-confirm when a URL is pasted
      input.addEventListener('paste', () => {
        setTimeout(() => {
          if (parseYtId(input.value)) confirm();
        }, 60);
      });

      confirmBtn.addEventListener('click', confirm);
      cancelBtn.addEventListener('click', () => {
        this._state = this._data ? 'filled' : 'empty';
        this._render();
      });

      this._wrap.appendChild(el);
      requestAnimationFrame(() => input.focus());
    }

    _renderFilled() {
      const { id, url } = this._data;
      const el = document.createElement('div');
      el.className = 'filled';

      const img = document.createElement('img');
      img.className = 'thumb';
      img.src = `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
      img.alt = '';
      // fallback: maxresdefault may be a black 120×90 for older videos
      img.addEventListener('error', () => {
        img.src = `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
      });

      const overlay = document.createElement('div');
      overlay.className = 'overlay';

      const play = document.createElement('div');
      play.className = 'play';
      play.innerHTML = PLAY_ICON;

      const badge = document.createElement('div');
      badge.className = 'yt-badge';
      badge.innerHTML = YT_ICON;

      const ctl = document.createElement('div');
      ctl.className = 'ctl';
      ctl.innerHTML = `<button>변경</button><button class="del">삭제</button>`;

      ctl.querySelectorAll('button').forEach((btn, i) => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (i === 0) {
            this._state = 'inputting';
          } else {
            this._data = null;
            setSlotData(this.id, null);
            this._state = 'empty';
          }
          this._render();
        });
      });

      el.addEventListener('click', (e) => {
        if (e.target.closest('.ctl')) return;
        window.open(url, '_blank', 'noopener,noreferrer');
      });

      el.appendChild(img);
      el.appendChild(overlay);
      el.appendChild(play);
      el.appendChild(badge);
      el.appendChild(ctl);
      this._wrap.appendChild(el);
    }
  }

  if (!customElements.get('yt-slot')) {
    customElements.define('yt-slot', YtSlot);
  }
})();
