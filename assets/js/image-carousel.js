(function () {
    function init(container) {
        if (!container || container.dataset.initialized === 'true') return;
        container.dataset.initialized = 'true';

        var swiperEl = container.querySelector('.image-swiper');
        var nextEl = container.querySelector('.swiper-button-next');
        var prevEl = container.querySelector('.swiper-button-prev');

        // Wait for lazy-loaded images to be ready (if lozad is active)
        var imgs = container.querySelectorAll('.image-slide img');
        var loadPromises = [];
        imgs.forEach(function(img) {
            // If image has data-src (lozad placeholder), force load it
            var realSrc = img.getAttribute('data-src') || img.getAttribute('src');
            if (realSrc && realSrc.indexOf('data:image') === 0) {
                // It's still a placeholder, skip
                return;
            }
            if (realSrc) {
                img.src = realSrc;
                if (!img.complete) {
                    loadPromises.push(new Promise(function(resolve) {
                        img.onload = resolve;
                        img.onerror = resolve;
                    }));
                }
            }
        });

        // Initialize Swiper after images are ready
        Promise.all(loadPromises).then(function() {
            initSwiper(container, swiperEl, nextEl, prevEl);
        });
    }

    function initSwiper(container, swiperEl, nextEl, prevEl) {

        var swiper = new Swiper(swiperEl, {
            effect: 'coverflow',
            coverflowEffect: { rotate: 0, stretch: 0, depth: 140, modifier: 1, slideShadows: false },
            centeredSlides: true,
            slidesPerView: 'auto',
            spaceBetween: 18,
            grabCursor: true,
            preloadImages: true,
            updateOnImagesReady: true,
            observer: true,
            observeParents: true,
            navigation: { nextEl: nextEl, prevEl: prevEl },
            watchSlidesProgress: true,
            breakpoints: { 320: { spaceBetween: 12 }, 640: { spaceBetween: 16 }, 980: { spaceBetween: 18 } }
        });

        // Tiny pager wiring (scoped)
        var pager = container.querySelector('.tiny-pager');
        var prevBtn = pager.querySelector('.tiny-prev');
        var nextBtn = pager.querySelector('.tiny-next');
        var pageEl = pager.querySelector('.page-indicator');

        function updatePager() {
            var total = swiper.slides ? swiper.slides.length : 0;
            var current = (swiper.realIndex || 0) + 1;
            if (total < 1) {
                pager.style.display = 'none';
            } else {
                pager.style.display = 'flex';
                pageEl.textContent = current + ' / ' + total;
            }
        }
        swiper.on('slideChange', updatePager);
        // Update immediately after creation
        updatePager();
        prevBtn.addEventListener('click', function () { swiper.slidePrev(); });
        nextBtn.addEventListener('click', function () { swiper.slideNext(); });

        // Modal functionality (scoped)
        var modal = container.querySelector('.image-modal');
        var modalImg = modal.querySelector('img');
        var slides = Array.from(container.querySelectorAll('.image-slide'));
        var currentIndex = -1;

        function openAt(index) {
            if (index < 0 || index >= slides.length) return;
            var s = slides[index];
            var src = s.getAttribute('data-src');
            var name = s.getAttribute('data-name') || '';
            modalImg.src = src; modalImg.alt = name;
            modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
            currentIndex = index;
        }

        function closeModal() { modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true'); currentIndex = -1; }
        function showNext() { openAt((currentIndex + 1) % slides.length); }
        function showPrev() { openAt((currentIndex - 1 + slides.length) % slides.length); }

        slides.forEach(function (slide, idx) {
            slide.addEventListener('click', function () { openAt(idx); });
        });

        modal.querySelector('.close').addEventListener('click', closeModal);
        modal.querySelector('.next').addEventListener('click', showNext);
        modal.querySelector('.prev').addEventListener('click', showPrev);

        document.addEventListener('keydown', function (e) {
            if (modal.classList.contains('open')) {
                if (e.key === 'Escape') closeModal();
                if (e.key === 'ArrowRight') showNext();
                if (e.key === 'ArrowLeft') showPrev();
            }
        });
        modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    }

    function initAll() {
        // Wait for Swiper to be available (CDN load race safety)
        var tries = 0;
        (function waitSwiper() {
            if (window.Swiper) {
                document.querySelectorAll('.image-carousel').forEach(init);
            } else if (tries++ < 40) { // ~2s at 50ms intervals
                setTimeout(waitSwiper, 50);
            } else {
                console.error('Swiper failed to load; image carousel not initialized');
            }
        })();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAll);
    } else {
        initAll();
    }
    // Handle bfcache restore or SPA-like events
    window.addEventListener('pageshow', function () { initAll(); });
})();
