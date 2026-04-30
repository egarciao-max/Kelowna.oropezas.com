// auth.js — Kelowna.Oropezas.com
// Google Sign-In using Google Identity Services (GIS) — no Firebase, no extra deps.

const KELOWNA_AUTH = (function () {
    const GOOGLE_CLIENT_ID = '233406003665-udr6c9vv4jej9ur8bsa22tdr9edouvfl.apps.googleusercontent.com';
    const WORKER_URL = 'https://kelowna.enriquegarciaoropeza.workers.dev';
    const USER_KEY = 'kelowna_user_v1';
    const CACHE_KEY = 'kelowna_account_cache';
    const CACHE_TTL_MS = 5 * 60 * 1000;

    let currentUser = null;
    let navbarObserver = null;

    function init() {
        if (!document.getElementById('google-gsi-script')) {
            const script = document.createElement('script');
            script.id = 'google-gsi-script';
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = _setupGSI;
            document.head.appendChild(script);
        } else {
            _setupGSI();
        }
        _restoreSession();
        _watchNavbar();
    }

    function _restoreSession() {
        const saved = localStorage.getItem(USER_KEY);
        if (!saved) return;
        try {
            const parsed = JSON.parse(saved);
            if (_isTokenValid(parsed.token)) {
                currentUser = parsed;
                _updateUI(currentUser);
            } else {
                localStorage.removeItem(USER_KEY);
                localStorage.removeItem(CACHE_KEY);
                currentUser = null;
                _updateUI(null);
            }
        } catch (e) {
            localStorage.removeItem(USER_KEY);
        }
    }

    function _isTokenValid(token) {
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            return payload.exp * 1000 > Date.now();
        } catch { return false; }
    }

    function _setupGSI() {
        if (!window.google || !window.google.accounts) {
            setTimeout(_setupGSI, 300);
            return;
        }
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: _handleCredentialResponse,
            auto_select: false,
        });
    }

    function _handleCredentialResponse(response) {
        try {
            const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            currentUser = {
                token: response.credential,
                name: payload.name,
                email: payload.email,
                picture: payload.picture,
                uid: payload.sub,
            };
            localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            _updateUI(currentUser);
            _closeModal();
        } catch (e) {
            console.error('Auth error:', e);
        }
    }

    function _updateUI(user) {
        const loginBtn = document.getElementById('auth-login-btn');
        const avatarEl = document.getElementById('auth-user-avatar');
        const pictureEl = document.getElementById('auth-user-picture');
        const nameEl = document.getElementById('auth-user-name');

        if (!loginBtn) return;

        if (user) {
            loginBtn.style.display = 'none';
            if (avatarEl) avatarEl.style.display = 'flex';
            if (pictureEl) pictureEl.src = user.picture || '';
            if (nameEl) nameEl.textContent = user.name ? user.name.split(' ')[0] : '';
        } else {
            loginBtn.style.display = 'flex';
            if (avatarEl) avatarEl.style.display = 'none';
        }
    }

    function _watchNavbar() {
        if (navbarObserver) navbarObserver.disconnect();
        navbarObserver = new MutationObserver(() => {
            if (document.getElementById('auth-login-btn')) {
                _updateUI(currentUser);
            }
        });
        navbarObserver.observe(document.body, { childList: true, subtree: true });
    }

    function logout() {
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem(CACHE_KEY);
        currentUser = null;
        _updateUI(null);
        if (window.google && window.google.accounts) {
            window.google.accounts.id.disableAutoSelect();
        }
        const menu = document.getElementById('auth-user-menu');
        if (menu) menu.classList.remove('open');
    }

    function openLoginModal() {
        let modal = document.getElementById('kelowna-auth-modal');
        if (!modal) modal = _createModal();
        modal.style.display = 'flex';

        if (window.google && window.google.accounts) {
            const btnContainer = document.getElementById('kelowna-gsi-btn');
            if (btnContainer) {
                btnContainer.innerHTML = '';
                window.google.accounts.id.renderButton(btnContainer, {
                    theme: 'outline',
                    size: 'large',
                    width: 280,
                    text: 'signin_with',
                });
            }
        }
    }

    function _closeModal() {
        const modal = document.getElementById('kelowna-auth-modal');
        if (modal) modal.style.display = 'none';
    }

    function _createModal() {
        const modal = document.createElement('div');
        modal.id = 'kelowna-auth-modal';
        modal.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,.55); z-index:9999;
            display:flex; align-items:center; justify-content:center;
        `;
        modal.innerHTML = `
            <div style="background:#fff; border-radius:8px; padding:2.5rem 2rem; max-width:360px; width:90%; text-align:center; position:relative;">
                <button id="kelowna-modal-close" style="position:absolute;top:1rem;right:1rem;background:none;border:none;font-size:1.4rem;cursor:pointer;color:#888;">&times;</button>
                <h3 style="margin:0 0 .5rem; font-size:1.3rem; font-weight:800;">Sign In</h3>
                <p style="font-size:.85rem; color:#666; margin:0 0 1.5rem;">Access your Kelowna.Oropezas.com account</p>
                <div id="kelowna-gsi-btn" style="display:flex; justify-content:center;"></div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', e => { if (e.target === modal) _closeModal(); });
        modal.querySelector('#kelowna-modal-close').addEventListener('click', _closeModal);
        return modal;
    }

    function toggleUserMenu() {
        const menu = document.getElementById('auth-user-menu');
        if (menu) menu.classList.toggle('open');
    }

    document.addEventListener('click', function (e) {
        const avatar = document.getElementById('auth-user-avatar');
        const menu = document.getElementById('auth-user-menu');
        if (menu && avatar && !avatar.contains(e.target) && !menu.contains(e.target)) {
            menu.classList.remove('open');
        }
    });

    function getCache() {
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw);
            if (Date.now() - parsed._cachedAt > CACHE_TTL_MS) return null;
            return parsed.data;
        } catch { return null; }
    }

    function setCache(data) {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({ _cachedAt: Date.now(), data }));
        } catch { }
    }

    function clearCache() {
        localStorage.removeItem(CACHE_KEY);
    }

    return {
        init,
        logout,
        openLoginModal,
        toggleUserMenu,
        getUser: () => currentUser,
        isLoggedIn: () => !!currentUser && _isTokenValid(currentUser?.token),
        getCache,
        setCache,
        clearCache,
    };
})();

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => KELOWNA_AUTH.init());
} else {
    KELOWNA_AUTH.init();
}
