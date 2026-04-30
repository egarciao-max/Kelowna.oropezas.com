document.addEventListener("DOMContentLoaded", function () {
    // 1. Find root path from this script tag
    const scriptTag = document.querySelector('script[src*="main.js"]');
    const scriptPath = scriptTag ? scriptTag.getAttribute('src') : 'js/main.js';
    const rootPath = scriptPath.replace('js/main.js', '');

    // 2. Fix internal links in injected HTML
    const fixLinks = (html, base) => {
        let div = document.createElement('div');
        div.innerHTML = html;

        div.querySelectorAll('a[href^="/"]').forEach(link => {
            const page = link.getAttribute('href').substring(1);
            link.setAttribute('href', base + page);
        });

        div.querySelectorAll('img[src^="/"]').forEach(img => {
            const src = img.getAttribute('src').substring(1);
            img.setAttribute('src', base + src);
        });

        return div.innerHTML;
    };

    // 3. Load Navbar
    fetch(rootPath + 'navbar.html')
        .then(r => r.text())
        .then(data => {
            const headerEl = document.querySelector('header');
            if (!headerEl) return;
            headerEl.innerHTML = fixLinks(data, rootPath);
            headerEl.classList.add('loaded');

            // Highlight active nav link
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            headerEl.querySelectorAll('nav a').forEach(link => {
                const href = link.getAttribute('href').split('/').pop();
                if (href === currentPage) link.classList.add('active');
            });
        })
        .catch(console.error);

    // 4. Intersection Observer for scroll animations
    const observeEls = document.querySelectorAll('.article-card, .featured-article, .section-title');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    observeEls.forEach(el => observer.observe(el));

    // 5. Ripple effect on buttons
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('.read-more, .btn-primary');
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        ripple.style.cssText = `
            position:absolute; border-radius:50%; transform:scale(0);
            animation:ripple 0.6s linear; background:rgba(255,255,255,0.4);
            width:${size}px; height:${size}px;
            left:${e.clientX - rect.left - size / 2}px;
            top:${e.clientY - rect.top - size / 2}px;
            pointer-events:none;
        `;
        btn.style.position = 'relative';
        btn.style.overflow = 'hidden';
        btn.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    });

    // 6. Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
});
