// news-loader.js — Kelowna.Oropezas.com
// Fetches articles from the Kelowna worker and renders them.

const API_BASE = 'https://kelowna.enriquegarciaoropeza.workers.dev';

function getArticleUrl(article) {
    const slug = article.slug || (article.url && article.url.split('slug=')[1]);
    return slug ? `article.html?slug=${slug}` : '#';
}

function getImageUrl(article) {
    if (article.featuredImage) return article.featuredImage;
    if (article.image) return article.image;
    if (article.slug) return `${API_BASE}/api/media/articles/noticias/${article.slug}.jpg`;
    return 'https://via.placeholder.com/800x450?text=Kelowna+News';
}

function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
}

function renderFeatured(article) {
    const container = document.getElementById('featured-container');
    if (!container || !article) return;
    const url = getArticleUrl(article);
    container.innerHTML = `
        <article class="featured-article">
            <div class="featured-image">
                <a href="${url}">
                    <img src="${getImageUrl(article)}" alt="${escapeHtml(article.title)}"
                         onerror="this.src='https://via.placeholder.com/800x450?text=Kelowna+News'">
                </a>
            </div>
            <div class="featured-content">
                <span class="news-tag">${escapeHtml(article.category || 'News')}</span>
                <h2 class="featured-title">
                    <a href="${url}">${escapeHtml(article.title)}</a>
                </h2>
                <p class="featured-excerpt">${escapeHtml(article.excerpt || article.subtitle || '')}</p>
                <div class="featured-meta">
                    <span class="news-date">${escapeHtml(article.date || '')}</span>
                    <a href="${url}" class="read-more">Read more &rarr;</a>
                </div>
            </div>
        </article>
    `;
}

function renderGrid(articles) {
    const container = document.getElementById('articles-grid');
    if (!container || !articles.length) return;
    container.innerHTML = articles.map((article, index) => {
        const url = getArticleUrl(article);
        return `
        <article class="article-card" style="animation-delay:${0.1 * index}s; cursor:pointer;" onclick="window.location='${url}'">
            <div class="article-card-image">
                <img src="${getImageUrl(article)}" alt="${escapeHtml(article.title)}"
                     onerror="this.src='https://via.placeholder.com/400x225?text=Kelowna+News'">
            </div>
            <div class="article-card-content">
                <span class="news-tag">${escapeHtml(article.category || 'News')}</span>
                <h3>${escapeHtml(article.title)}</h3>
                <p class="article-card-excerpt">${escapeHtml(article.excerpt || article.subtitle || '')}</p>
                <div class="article-card-date">${escapeHtml(article.date || '')}</div>
            </div>
        </article>
        `;
    }).join('');
}

async function loadArticles() {
    try {
        const page = document.body.dataset.page || 'index';
        const response = await fetch(`${API_BASE}/api/articles`);
        const data = await response.json();
        const articles = Array.isArray(data.articles) ? data.articles : [];

        if (!articles.length) {
            const grid = document.getElementById('articles-grid');
            if (grid) grid.innerHTML = '<p style="color:#888; padding:2rem;">No articles yet. Check back soon!</p>';
            return;
        }

        if (page === 'index') {
            renderFeatured(articles[0]);
            renderGrid(articles.slice(1, 7));
        } else {
            renderGrid(articles);
        }
    } catch (error) {
        console.error('Error loading articles:', error);
    }
}

document.addEventListener('DOMContentLoaded', loadArticles);
