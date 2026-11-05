const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('#main-nav');
const year = document.querySelector('#year');
const filmGrid = document.querySelector('#film-grid');
const performanceToggle = document.querySelector('#performance-toggle');
const filmCount = document.querySelector('#film-count');
const loadMoreButton = document.querySelector('#load-more-videos');
const filmsPerBatch = 8;
const thumbnailObserver = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const image = entry.target;
                image.src = image.dataset.src;
                observer.unobserve(image);
            }
        });
    }, { rootMargin: '500px 0px' })
    : null;

function getYouTubeVideoId(value) {
    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^www\./, '');
        let videoId = '';

        if (host === 'youtu.be') {
            videoId = url.pathname.split('/').filter(Boolean)[0] || '';
        } else if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
            if (url.pathname === '/watch') {
                videoId = url.searchParams.get('v') || '';
            } else {
                videoId = url.pathname.match(/^\/(?:embed|shorts)\/([^/?]+)/)?.[1] || '';
            }
        }

        return /^[\w-]{11}$/.test(videoId) ? videoId : null;
    } catch {
        return null;
    }
}

function createFilmCard(film) {
    const videoId = getYouTubeVideoId(film.url);
    if (!videoId) {
        console.error(`Lien YouTube invalide pour « ${film.title} » :`, film.url);
        return null;
    }

    const card = document.createElement('article');
    card.className = 'film-card';

    const videoContainer = document.createElement('div');
    videoContainer.className = 'film-video';

    const preview = document.createElement(window.location.protocol === 'file:' ? 'a' : 'button');
    preview.className = 'film-preview';

    if (window.location.protocol === 'file:') {
        preview.href = `https://www.youtube.com/watch?v=${videoId}`;
        preview.target = '_blank';
        preview.rel = 'noopener noreferrer';
        preview.setAttribute('aria-label', `Regarder ${film.title} sur YouTube`);
    } else {
        preview.type = 'button';
        preview.setAttribute('aria-label', `Lire ${film.title}`);
        preview.addEventListener('click', () => {
            const iframe = document.createElement('iframe');
            iframe.src = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
            iframe.title = film.title;
            iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
            iframe.referrerPolicy = 'strict-origin-when-cross-origin';
            iframe.allowFullscreen = true;
            videoContainer.replaceChildren(iframe);
        }, { once: true });
    }

    const thumbnail = document.createElement('img');
    thumbnail.dataset.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    thumbnail.alt = '';
    thumbnail.loading = 'lazy';
    thumbnail.decoding = 'async';
    thumbnail.fetchPriority = 'low';
    if (thumbnailObserver) {
        thumbnailObserver.observe(thumbnail);
    } else {
        thumbnail.src = thumbnail.dataset.src;
    }

    const playLabel = document.createElement('span');
    playLabel.className = 'film-preview-label';
    playLabel.textContent = window.location.protocol === 'file:' ? 'Regarder sur YouTube' : 'Lire la vidéo';

    preview.append(thumbnail, playLabel);
    videoContainer.append(preview);

    const info = document.createElement('div');
    info.className = 'film-info';

    const category = document.createElement('span');
    category.className = 'film-category';
    category.textContent = film.category || 'Sur la chaîne YouTube';

    const title = document.createElement('h3');
    title.textContent = film.title;

    const description = document.createElement('p');
    description.textContent = film.description || 'Retrouvez cette vidéo sur la chaîne YouTube Estgaming.';

    const link = document.createElement('a');
    link.href = `https://youtu.be/${videoId}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.className = 'film-link';
    link.textContent = 'Voir sur YouTube →';

    info.append(category, title, description, link);
    card.append(videoContainer, info);
    return card;
}

if (filmGrid) {
    const films = window.ESTGAMING_VIDEOS;

    if (!Array.isArray(films)) {
        console.error('La liste des vidéos est introuvable. Vérifiez le fichier videos.js.');
    } else {
        let nextFilmIndex = 0;
        let displayedFilmCount = 0;
        const appendNextBatch = () => {
            const fragment = document.createDocumentFragment();
            const endIndex = Math.min(nextFilmIndex + filmsPerBatch, films.length);

            for (; nextFilmIndex < endIndex; nextFilmIndex += 1) {
                const card = createFilmCard(films[nextFilmIndex]);
                if (card) {
                    fragment.append(card);
                    displayedFilmCount += 1;
                }
            }

            filmGrid.append(fragment);

            const remaining = films.length - nextFilmIndex;
            if (filmCount) {
                filmCount.textContent = `${displayedFilmCount} vidéo${displayedFilmCount > 1 ? 's' : ''} affichée${displayedFilmCount > 1 ? 's' : ''} sur ${films.length}.`;
            }
            if (loadMoreButton) {
                loadMoreButton.hidden = remaining === 0;
                loadMoreButton.textContent = remaining > 0
                    ? `Afficher plus de vidéos (${remaining} restante${remaining > 1 ? 's' : ''})`
                    : '';
            }
        };

        appendNextBatch();
        loadMoreButton?.addEventListener('click', appendNextBatch);
    }
}

if (year) {
    year.textContent = new Date().getFullYear();
}

if (performanceToggle) {
    let performanceMode = false;

    try {
        performanceMode = localStorage.getItem('estgaming-performance-mode') === 'true';
    } catch (error) {
        console.warn('Le mode performance ne peut pas être mémorisé dans ce navigateur.', error);
    }

    const setPerformanceMode = (enabled) => {
        document.body.classList.toggle('performance-mode', enabled);
        performanceToggle.setAttribute('aria-pressed', String(enabled));
        performanceToggle.textContent = `Mode performance : ${enabled ? 'activé' : 'désactivé'}`;
    };

    setPerformanceMode(performanceMode);
    performanceToggle.addEventListener('click', () => {
        performanceMode = !document.body.classList.contains('performance-mode');
        setPerformanceMode(performanceMode);

        try {
            localStorage.setItem('estgaming-performance-mode', String(performanceMode));
        } catch (error) {
            console.warn('Le choix du mode performance ne peut pas être mémorisé.', error);
        }
    });
}

if (menuToggle && nav) {
    const closeMenu = () => {
        nav.classList.remove('active');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Ouvrir le menu');
    };

    menuToggle.addEventListener('click', () => {
        const isOpen = nav.classList.toggle('active');

        menuToggle.classList.toggle('active', isOpen);
        menuToggle.setAttribute('aria-expanded', String(isOpen));
        menuToggle.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    });

    nav.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', closeMenu);
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeMenu();
            menuToggle.focus();
        }
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 800) {
            closeMenu();
        }
    });
}
