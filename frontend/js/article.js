// article.js — Kelowna.Oropezas.com
const WORKER_API = 'https://kelowna.enriquegarciaoropeza.workers.dev';

function getSlugFromUrl() {
    return new URLSearchParams(window.location.search).get('slug');
}

function normalizeContentBlock(block) {
    if (typeof block === 'string') return { html: `<p>${block}</p>` };
    if (block && typeof block === 'object') {
        if (typeof block.html === 'string') return { html: block.html };
        if (typeof block.text === 'string') return { html: `<p>${block.text}</p>` };
        if (typeof block.content === 'string') return { html: `<p>${block.content}</p>` };
    }
    return null;
}

function appendHtmlBlock(container, html) {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    Array.from(wrapper.childNodes).forEach(node => container.appendChild(node));
}

async function fetchArticleBySlug(slug) {
    const response = await fetch(`${WORKER_API}/api/articles?slug=${encodeURIComponent(slug)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data.articles) || !data.articles.length) return null;
    const summary = data.articles[0];
    const detailRes = await fetch(`${WORKER_API}/api/article/${encodeURIComponent(slug)}`);
    return detailRes.ok ? detailRes.json() : summary;
}

function renderAuthor(article) {
    const info = article.authorInfo;
    if (!info) return;
    const profileUrl = info.profileUrl || ('#');

    const topWrap = document.getElementById('article-author-top');
    if (topWrap) {
        topWrap.style.display = 'block';
        document.getElementById('article-author-top-link').href = profileUrl;
        const av = document.getElementById('article-author-top-avatar');
        av.src = info.picture || '';
        av.onerror = () => av.style.display = 'none';
        const topNameEl = document.getElementById('article-author-top-name');
        topNameEl.textContent = info.name || '';
        if (info.verified) {
            topNameEl.insertAdjacentHTML('beforeend', ' <i class="bi bi-patch-check-fill" style="color:#1d9bf0;font-size:.85em;"></i>');
        }
        document.getElementById('article-author-top-title').textContent = info.title || '';
    }

    const botWrap = document.getElementById('article-author-bottom');
    if (botWrap) {
        botWrap.style.display = 'block';
        document.getElementById('article-author-bottom-link').href = profileUrl;
        const av2 = document.getElementById('article-author-bottom-avatar');
        av2.src = info.picture || '';
        av2.onerror = () => av2.style.display = 'none';
        const botNameEl = document.getElementById('article-author-bottom-name');
        botNameEl.textContent = info.name || '';
        if (info.verified) {
            botNameEl.insertAdjacentHTML('beforeend', ' <i class="bi bi-patch-check-fill" style="color:#1d9bf0;font-size:.9em;"></i>');
        }
        document.getElementById('article-author-bottom-title').textContent = info.title || '';
        if (info.uid) {
            fetch(`${WORKER_API}/api/user/profile?uid=${encodeURIComponent(info.uid)}`)
                .then(r => r.json())
                .then(u => {
                    if (u && u.bio) {
                        const bioEl = document.getElementById('article-author-bottom-bio');
                        if (bioEl) bioEl.textContent = u.bio;
                    }
                })
                .catch(() => {});
        }
    }
}

function renderArticle(article) {
    document.title = `${article.title || 'Article'} — Kelowna.Oropezas.com`;

    const cat = document.getElementById('article-category');
    if (cat) cat.textContent = article.category || 'News';

    const titleEl = document.getElementById('article-title');
    if (titleEl) titleEl.textContent = article.title || '';

    const dateEl = document.getElementById('article-date');
    if (dateEl) dateEl.textContent = article.date || '';

    const excerptEl = document.getElementById('article-excerpt');
    if (excerptEl) excerptEl.textContent = article.excerpt || article.subtitle || '';

    renderAuthor(article);

    // Image
    const imageEl = document.getElementById('article-image');
    if (imageEl) {
        const imgUrl = article.featuredImage || article.image ||
            `${WORKER_API}/api/media/articles/noticias/${article.slug}.jpg`;
        imageEl.src = imgUrl;
        imageEl.alt = article.title || '';
        imageEl.style.display = 'block';
        imageEl.onerror = () => imageEl.style.display = 'none';
    }

    // Video
    if (article.videoUrl) {
        const videoEl = document.getElementById('article-video');
        if (videoEl) {
            videoEl.src = article.videoUrl;
            videoEl.style.display = 'block';
        }
    }

    // Content
    const contentEl = document.getElementById('article-content');
    if (contentEl) {
        contentEl.innerHTML = '';
        if (Array.isArray(article.content)) {
            article.content.forEach(block => {
                const normalized = normalizeContentBlock(block);
                if (normalized) appendHtmlBlock(contentEl, normalized.html);
            });
        } else if (article.html) {
            contentEl.innerHTML = article.html;
        } else if (article.body) {
            contentEl.innerHTML = `<p>${article.body}</p>`;
        }
    }
}

async function init() {
    const slug = getSlugFromUrl();
    if (!slug) {
        document.title = 'Article not found — Kelowna.Oropezas.com';
        return;
    }
    try {
        const article = await fetchArticleBySlug(slug);
        if (article) {
            renderArticle(article);
        } else {
            document.getElementById('article-title').textContent = 'Article not found';
        }
    } catch (err) {
        console.error('Error loading article:', err);
        const titleEl = document.getElementById('article-title');
        if (titleEl) titleEl.textContent = 'Error loading article';
    }
}

document.addEventListener('DOMContentLoaded', init);
