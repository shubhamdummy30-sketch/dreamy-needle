/**
 * Dreamy Needle — Shared Client-Side Script
 * Instantaneous zero-flicker tab navigation, luxury custom dropdowns,
 * mobile UX, continuous scroll stitch, and dynamic reviews.
 */

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


  /* -------------------------------------------------------------
     1. Scroll Reveal with IntersectionObserver
     ------------------------------------------------------------- */
  function initRevealObserver() {
    const revealElements = document.querySelectorAll('.tab-view.active .reveal-init:not(.reveal-visible)');
    if (revealElements.length === 0) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const siblings = el.parentElement ? el.parentElement.children : [];
          const idx = Math.min(Array.prototype.indexOf.call(siblings, el), 6);
          const delay = reduceMotion ? 0 : idx * 45;
          el.style.setProperty('--d', delay + 'ms');
          el.classList.add('reveal-visible');
          obs.unobserve(el);
        });
      }, { threshold: 0.05, rootMargin: '0px 0px -20px 0px' });

      revealElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          el.classList.add('reveal-visible');
        } else {
          observer.observe(el);
        }
      });
    } else {
      revealElements.forEach(el => el.classList.add('reveal-visible'));
    }
  }

  /* -------------------------------------------------------------
     2. Mobile Menu Drawer Toggle
     ------------------------------------------------------------- */
  function initMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (menuToggle && mobileMenu) {
      const setMenu = (open) => {
        mobileMenu.classList.toggle('open', open);
        menuToggle.setAttribute('aria-expanded', String(open));
        menuToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
        const icon = menuToggle.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = open ? 'close' : 'menu';
      };
      menuToggle.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
      mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
    }
  }

  /* -------------------------------------------------------------
     3. Artisanal Custom Select Dropdown UI
     Replaces native OS blue dropdowns with luxury boutique UI
     ------------------------------------------------------------- */
  function initCustomSelects() {
    const selects = document.querySelectorAll('select:not([data-custom-enhanced])');
    selects.forEach(selectEl => {
      selectEl.setAttribute('data-custom-enhanced', 'true');
      selectEl.classList.add('custom-select-native-hidden');

      const wrapper = document.createElement('div');
      wrapper.className = 'custom-select-wrap';

      const currentOption = selectEl.options[selectEl.selectedIndex] || selectEl.options[0];
      const initialText = currentOption ? currentOption.textContent : 'Select an option';

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'custom-select-trigger';
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.innerHTML = `
        <span class="custom-select-label truncate">${initialText}</span>
        <span class="material-symbols-outlined custom-select-arrow">expand_more</span>
      `;

      const menu = document.createElement('div');
      menu.className = 'custom-select-menu';
      menu.setAttribute('role', 'listbox');

      Array.from(selectEl.options).forEach((opt, idx) => {
        const optEl = document.createElement('div');
        optEl.className = 'custom-select-option' + (idx === selectEl.selectedIndex ? ' is-selected' : '');
        optEl.setAttribute('role', 'option');
        optEl.setAttribute('data-value', opt.value);
        optEl.innerHTML = `
          <span class="truncate">${opt.textContent}</span>
          <span class="material-symbols-outlined custom-option-check">check</span>
        `;

        optEl.addEventListener('click', (e) => {
          e.stopPropagation();
          selectEl.selectedIndex = idx;
          selectEl.value = opt.value;
          selectEl.dispatchEvent(new Event('change', { bubbles: true }));

          const labelSpan = trigger.querySelector('.custom-select-label');
          if (labelSpan) labelSpan.textContent = opt.textContent;

          menu.querySelectorAll('.custom-select-option').forEach(o => o.classList.remove('is-selected'));
          optEl.classList.add('is-selected');

          closeMenu();
          trigger.focus();
        });

        menu.appendChild(optEl);
      });

      const openMenu = () => {
        document.querySelectorAll('.custom-select-wrap.is-open').forEach(w => {
          if (w !== wrapper) {
            w.classList.remove('is-open');
            w.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
          }
        });
        wrapper.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      };

      const closeMenu = () => {
        wrapper.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      };

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        if (wrapper.classList.contains('is-open')) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          openMenu();
          const firstOpt = menu.querySelector('.custom-select-option');
          if (firstOpt) firstOpt.focus();
        } else if (e.key === 'Escape') {
          closeMenu();
        }
      });

      if (selectEl.parentNode) {
        selectEl.parentNode.insertBefore(wrapper, selectEl);
        wrapper.appendChild(trigger);
        wrapper.appendChild(menu);
        wrapper.appendChild(selectEl);
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-select-wrap')) {
      document.querySelectorAll('.custom-select-wrap.is-open').forEach(w => {
        w.classList.remove('is-open');
        w.querySelector('.custom-select-trigger')?.setAttribute('aria-expanded', 'false');
      });
    }
  });

  /* -------------------------------------------------------------
     4. Category Filter Pills (Creations View) — Smooth Crossfade
     ------------------------------------------------------------- */
  function initCategoryFilterPills() {
    const filterPills = document.querySelectorAll('.filter-pill');
    const creationCards = document.querySelectorAll('.creation-card');
    if (filterPills.length === 0 || creationCards.length === 0) return;

    filterPills.forEach(pill => {
      if (pill.getAttribute('data-pill-bound')) return;
      pill.setAttribute('data-pill-bound', 'true');

      pill.addEventListener('click', () => {
        const filter = pill.getAttribute('data-filter');
        filterPills.forEach(p => {
          p.setAttribute('aria-pressed', 'false');
          p.classList.remove('bg-primary', 'text-white', 'shadow-sm');
          p.classList.add('bg-stone-100', 'text-stone-700');
        });
        pill.setAttribute('aria-pressed', 'true');
        pill.classList.remove('bg-stone-100', 'text-stone-700');
        pill.classList.add('bg-primary', 'text-white', 'shadow-sm');

        creationCards.forEach(card => {
          const category = card.getAttribute('data-category');
          const isMatch = (filter === 'all' || category === filter || (category && category.includes(filter)));
          if (isMatch) {
            card.classList.remove('filter-hidden');
            card.style.display = '';
            requestAnimationFrame(() => {
              card.classList.remove('filtering-out');
            });
          } else {
            card.classList.add('filtering-out');
            setTimeout(() => {
              if (card.classList.contains('filtering-out')) {
                card.classList.add('filter-hidden');
              }
            }, 180);
          }
        });

        setTimeout(() => {
          if (typeof window._rebuildStitch === 'function') {
            window._rebuildStitch(true);
          }
        }, 200);
      });
    });
  }

  /* -------------------------------------------------------------
     5. Accessible FAQ Accordions (Contact View)
     ------------------------------------------------------------- */
  function initFaqAccordions() {
    document.querySelectorAll('.faq-trigger').forEach(btn => {
      if (btn.getAttribute('data-faq-bound')) return;
      btn.setAttribute('data-faq-bound', 'true');

      btn.addEventListener('click', () => {
        const content = btn.nextElementSibling;
        const icon = btn.querySelector('.faq-icon');
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isExpanded));
        if (content) {
          const open = content.classList.toggle('is-open');
          content.setAttribute('aria-hidden', String(!open));
        }
        if (icon) icon.classList.toggle('is-open');
      });
    });
  }

  /* -------------------------------------------------------------
     6. Interactive WhatsApp Order Builder (Custom Order View)
     ------------------------------------------------------------- */
  function initWhatsAppOrderBuilder() {
    const waForm = document.getElementById('custom-order-builder');
    if (!waForm || waForm.getAttribute('data-bound')) return;
    waForm.setAttribute('data-bound', 'true');

    waForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const garment = document.getElementById('builder-garment')?.value || 'Custom Item';
      const source = document.querySelector('input[name="builder-source"]:checked')?.value || 'Own Garment';
      const concept = document.getElementById('builder-concept')?.value || 'Personalized Design';
      const dateNeed = document.getElementById('builder-date')?.value || 'Flexible';
      const notes = document.getElementById('builder-notes')?.value || '';

      let message = `Hi Shruti! I'd like to commission a custom embroidery piece:%0A%0A` +
        `• *Item Type*: ${encodeURIComponent(garment)}%0A` +
        `• *Garment Source*: ${encodeURIComponent(source)}%0A` +
        `• *Design Idea / Name / Motif*: ${encodeURIComponent(concept)}%0A` +
        `• *Needed By*: ${encodeURIComponent(dateNeed)}%0A`;

      if (notes.trim()) {
        message += `• *Notes*: ${encodeURIComponent(notes.trim())}%0A`;
      }
      message += `%0ACould you please share a quote and timeline? Thank you!`;

      const waUrl = `https://wa.me/917506599552?text=${message}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
    });
  }

  /* -------------------------------------------------------------
     7. Dynamic Reviews & Star Rating Modal (reviews.json storage)
     ------------------------------------------------------------- */
  function initReviewSystem() {
    const reviewGrid = document.getElementById('reviews-grid');
    const reviewModal = document.getElementById('review-modal');
    const openReviewBtns = document.querySelectorAll('.open-review-modal-btn');
    const closeReviewBtns = document.querySelectorAll('.close-review-modal-btn');
    const reviewForm = document.getElementById('review-submission-form');
    const starButtons = document.querySelectorAll('.star-rating-btn');
    const starPicker = document.getElementById('star-picker');
    const starLabel = document.getElementById('star-rating-label');
    const starError = document.getElementById('star-rating-error');

    const ratingDescriptions = {
      1: '1 Star - Needs Improvement',
      2: '2 Stars - Fair',
      3: '3 Stars - Good',
      4: '4 Stars - Very Happy!',
      5: '5 Stars - Absolutely Loved It!'
    };

    let selectedRating = 0;

    function updateStarDisplay(rating) {
      starButtons.forEach(btn => {
        const val = parseInt(btn.getAttribute('data-star') || '0', 10);
        const icon = btn.querySelector('.material-symbols-outlined');
        if (val <= rating) {
          btn.classList.remove('text-stone-300');
          btn.classList.add('text-amber-500');
          if (icon) icon.style.fontVariationSettings = "'FILL' 1";
        } else {
          btn.classList.remove('text-amber-500');
          btn.classList.add('text-stone-300');
          if (icon) icon.style.fontVariationSettings = "'FILL' 0";
        }
      });

      if (starLabel) {
        if (rating > 0) {
          starLabel.textContent = ratingDescriptions[rating] || `${rating} Stars`;
          starLabel.className = 'text-xs font-bold text-amber-600';
        } else {
          starLabel.textContent = 'Click to rate';
          starLabel.className = 'text-xs font-semibold text-stone-400';
        }
      }
    }

    if (starPicker && !starPicker.getAttribute('data-bound')) {
      starPicker.setAttribute('data-bound', 'true');
      starButtons.forEach(btn => {
        const val = parseInt(btn.getAttribute('data-star') || '0', 10);

        btn.addEventListener('mouseenter', () => updateStarDisplay(val));
        btn.addEventListener('click', () => {
          selectedRating = val;
          updateStarDisplay(selectedRating);
          if (starError) starError.classList.add('hidden');
        });
      });

      starPicker.addEventListener('mouseleave', () => {
        updateStarDisplay(selectedRating);
      });
    }

    if (reviewModal && !reviewModal.getAttribute('data-bound')) {
      reviewModal.setAttribute('data-bound', 'true');

      openReviewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          selectedRating = 0;
          updateStarDisplay(0);
          if (starError) starError.classList.add('hidden');
          reviewModal.classList.add('is-open');
          document.body.style.overflow = 'hidden';
        });
      });

      closeReviewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          reviewModal.classList.remove('is-open');
          document.body.style.overflow = '';
        });
      });

      reviewModal.addEventListener('click', (e) => {
        if (e.target === reviewModal) {
          reviewModal.classList.remove('is-open');
          document.body.style.overflow = '';
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && reviewModal.classList.contains('is-open')) {
          reviewModal.classList.remove('is-open');
          document.body.style.overflow = '';
        }
      });
    }

    if (reviewForm && !reviewForm.getAttribute('data-bound')) {
      reviewForm.setAttribute('data-bound', 'true');

      reviewForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (selectedRating === 0) {
          if (starError) {
            starError.classList.remove('hidden');
            starPicker?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
          return;
        }

        const name = document.getElementById('review-name')?.value.trim() || 'Verified Customer';
        const city = document.getElementById('review-city')?.value.trim() || 'India';
        const item = document.getElementById('review-item')?.value || 'Custom Embroidery';
        const text = document.getElementById('review-text')?.value.trim();

        if (!text) return;

        const newReview = {
          id: Date.now(),
          name: name,
          city: city,
          item: item,
          rating: selectedRating,
          date: 'Just now',
          text: text,
          isUserGenerated: true
        };

        if (window.location.protocol.startsWith('http')) {
          try {
            await fetch('/api/reviews', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newReview)
            });
          } catch (err) {
            console.warn('Server API not responding, saving to localStorage', err);
          }
        }

        try {
          const stored = JSON.parse(localStorage.getItem('dreamy_needle_reviews') || '[]');
          stored.unshift(newReview);
          localStorage.setItem('dreamy_needle_reviews', JSON.stringify(stored));
        } catch (err) {}

        selectedRating = 0;
        updateStarDisplay(0);
        reviewForm.reset();

        const reviewItemWrap = document.getElementById('review-item')?.closest('.custom-select-wrap');
        if (reviewItemWrap) {
          const firstOpt = document.getElementById('review-item').options[0];
          const labelSpan = reviewItemWrap.querySelector('.custom-select-label');
          if (labelSpan && firstOpt) labelSpan.textContent = firstOpt.textContent;
          reviewItemWrap.querySelectorAll('.custom-select-option').forEach((opt, idx) => {
            opt.classList.toggle('is-selected', idx === 0);
          });
        }

        reviewModal.classList.remove('is-open');
        document.body.style.overflow = '';

        await loadReviews(newReview.id);

        const revSection = document.getElementById('reviews-section');
        if (revSection) {
          setTimeout(() => {
            revSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }

        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#201a16] text-white text-xs sm:text-sm font-semibold px-5 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 border border-stone-700/80';
        toast.innerHTML = `
          <span class="material-symbols-outlined text-[#34d399] text-[20px]">check_circle</span>
          <span>Thank you, <strong>${name}</strong>! Your review has been submitted successfully.</span>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4500);
      });
    }

    async function loadReviews(highlightId = null) {
      let reviews = [];

      if (window.location.protocol.startsWith('http')) {
        try {
          const res = await fetch('/api/reviews?t=' + Date.now(), { cache: 'no-cache' });
          if (res.ok) {
            reviews = await res.json();
          } else {
            const fileRes = await fetch('reviews.json?t=' + Date.now(), { cache: 'no-cache' });
            if (fileRes.ok) reviews = await fileRes.json();
          }
          // Synchronize local cache with server data so deleted reviews do not linger
          try {
            localStorage.setItem('dreamy_needle_reviews', JSON.stringify(reviews));
          } catch (err) {}
        } catch (e) {
          try {
            reviews = JSON.parse(localStorage.getItem('dreamy_needle_reviews') || '[]');
          } catch (err) {
            reviews = [];
          }
        }
      } else {
        try {
          const raw = localStorage.getItem('dreamy_needle_reviews');
          reviews = raw ? JSON.parse(raw) : [];
        } catch (err) {
          reviews = [];
        }
      }

      updateReviewStats(reviews);

      if (reviewGrid) {
        reviewGrid.innerHTML = '';

        if (!reviews || reviews.length === 0) {
          const empty = document.createElement('div');
          empty.className = 'col-span-full py-12 px-6 text-center bg-stone-50/80 rounded-2xl border border-dashed border-stone-300';
          empty.innerHTML = `
            <div class="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <span class="material-symbols-outlined text-[26px]">rate_review</span>
            </div>
            <h4 class="font-serif font-bold text-lg text-charcoal">No client reviews yet</h4>
            <p class="text-xs sm:text-sm text-stone-500 max-w-sm mx-auto mt-1 mb-4">
              Be the very first client to share your experience with Dreamy Needle!
            </p>
            <button type="button" class="open-review-modal-btn inline-flex items-center gap-2 bg-primary hover:bg-primary-hover active:scale-95 text-white text-xs sm:text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer">
              <span class="material-symbols-outlined text-[18px]">rate_review</span>
              <span>Write the First Review</span>
            </button>
          `;
          reviewGrid.appendChild(empty);
          empty.querySelector('.open-review-modal-btn')?.addEventListener('click', () => {
            if (reviewModal) {
              reviewModal.classList.add('is-open');
              document.body.style.overflow = 'hidden';
            }
          });
          return;
        }

        reviews.forEach(r => {
          const card = document.createElement('div');
          const isHighlight = highlightId && (r.id === highlightId);
          card.className = `bg-white p-6 rounded-2xl border ${isHighlight ? 'review-just-added border-primary shadow-md' : 'border-stone-200/90 shadow-sm'} flex flex-col justify-between space-y-4 transition-all`;

          let starsHtml = '';
          for (let i = 1; i <= 5; i++) {
            starsHtml += `<span class="material-symbols-outlined text-[18px] ${i <= r.rating ? 'text-amber-500 fill-1' : 'text-stone-300'}" style="font-variation-settings: 'FILL' ${i <= r.rating ? 1 : 0};">star</span>`;
          }

          card.innerHTML = `
            <div>
              <div class="flex items-center justify-between mb-2">
                <div class="flex items-center gap-1">${starsHtml}</div>
                <span class="text-[11px] font-semibold text-stone-400">${r.date || 'Verified Customer'}</span>
              </div>
              <p class="text-sm text-stone-700 leading-relaxed font-normal">"${r.text}"</p>
            </div>
            <div class="pt-3 border-t border-stone-100 flex items-center justify-between">
              <div>
                <div class="flex items-center gap-1.5 flex-wrap">
                  <h4 class="font-serif font-bold text-sm text-charcoal">${r.name}</h4>
                  ${isHighlight ? '<span class="text-[10px] bg-primary text-white font-sans font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5"><span class="material-symbols-outlined text-[12px]">check</span> Your Review</span>' : '<span class="text-[10px] bg-secondary-light text-secondary font-sans font-bold px-1.5 py-0.5 rounded-full">Verified Client</span>'}
                </div>
                <p class="text-xs text-stone-500 mt-0.5">${r.city || 'India'} • <span class="text-primary font-medium">${r.item || 'Custom Embroidery'}</span></p>
              </div>
              <span class="w-8 h-8 rounded-full bg-primary/10 text-primary font-serif font-bold text-xs flex items-center justify-center shrink-0">
                ${(r.name || 'C').charAt(0).toUpperCase()}
              </span>
            </div>
          `;
          reviewGrid.appendChild(card);
        });
      }
    }

    function updateReviewStats(reviews) {
      const statsContainer = document.getElementById('review-stats-container');
      if (!statsContainer) return;

      if (!reviews || reviews.length === 0) {
        statsContainer.innerHTML = `
          <span class="text-xs font-bold text-stone-500">Customer Feedback &amp; Experiences</span>
        `;
        return;
      }

      const totalStars = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
      const avg = (totalStars / reviews.length).toFixed(1);
      const count = reviews.length;

      let starsHtml = '';
      for (let i = 1; i <= 5; i++) {
        starsHtml += `<span class="material-symbols-outlined text-[18px] ${i <= Math.round(avg) ? 'text-amber-500 fill-1' : 'text-stone-300'}" style="font-variation-settings: 'FILL' ${i <= Math.round(avg) ? 1 : 0};">star</span>`;
      }

      statsContainer.innerHTML = `
        <div class="flex items-center gap-1 text-amber-500 mb-1">
          ${starsHtml}
          <span class="text-xs font-bold text-charcoal ml-1.5">${avg} / 5.0 (${count} ${count === 1 ? 'Review' : 'Reviews'})</span>
        </div>
      `;
    }

    if (reviewGrid) loadReviews();
  }

  /* -------------------------------------------------------------
     8. Glitch-Free Authentic Hand-Stitched Seam & Needle Engine
     ------------------------------------------------------------- */
  function initStitchEngine() {
    const stitchCanvas = document.getElementById('stitch-canvas');
    if (!stitchCanvas || reduceMotion) return;

    const guidePath = document.getElementById('thread-guide');
    const puncturePath = document.getElementById('thread-punctures');
    const drawPath = document.getElementById('thread-path');
    const maskPath = document.getElementById('mask-path');
    const needleEl = document.getElementById('stitch-needle');
    const knotEl = document.getElementById('thread-knot');
    const mainEl = document.querySelector('main');

    let totalHeight = 1000;
    let targetFrac = 0;
    let currentFrac = 0;
    let rafActive = false;
    let pathLength = 1;
    let xOffset = 22;

    function buildStitchPath(silent = false) {
      if (!mainEl || !drawPath || !guidePath) return;

      // Calculate height based on the active tab-view
      const activeView = document.querySelector('.tab-view.active') || mainEl;
      const rect = activeView.getBoundingClientRect();
      const h = Math.max(600, Math.round(rect.height));
      const w = Math.round(mainEl.getBoundingClientRect().width);
      totalHeight = h;

      const isMobile = window.innerWidth < 768;
      xOffset = isMobile ? 12 : 22;

      stitchCanvas.setAttribute('viewBox', `0 0 ${w} ${h}`);

      const segments = Math.max(14, Math.floor(h / 160));
      const stepY = h / segments;
      let d = `M ${xOffset} 12`;

      for (let i = 1; i <= segments; i++) {
        const y = i * stepY;
        const wave = Math.sin(i * 1.4) * (isMobile ? 3.5 : 7);
        const x = xOffset + wave;
        const prevY = (i - 1) * stepY;
        const prevWave = Math.sin((i - 1) * 1.4) * (isMobile ? 3.5 : 7);
        const prevX = xOffset + prevWave;

        const cy1 = prevY + stepY * 0.5;
        const cy2 = prevY + stepY * 0.5;
        d += ` C ${prevX} ${cy1}, ${x} ${cy2}, ${x} ${y}`;
      }

      guidePath.setAttribute('d', d);
      if (puncturePath) puncturePath.setAttribute('d', d);
      drawPath.setAttribute('d', d);
      if (maskPath) maskPath.setAttribute('d', d);

      const refPath = maskPath || drawPath;
      pathLength = refPath.getTotalLength() || h;

      if (maskPath) {
        maskPath.style.strokeDasharray = `${pathLength}`;
        maskPath.style.strokeDashoffset = `${pathLength}`;
      } else {
        drawPath.style.strokeDasharray = `${pathLength}`;
        drawPath.style.strokeDashoffset = `${pathLength}`;
      }

      if (knotEl) {
        knotEl.setAttribute('cx', String(xOffset));
        knotEl.setAttribute('cy', '12');
      }

      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const vh = window.innerHeight;
      const focalY = scrollY + vh * 0.45;
      targetFrac = Math.min(1, Math.max(0, focalY / Math.max(1, totalHeight)));

      if (silent) {
        currentFrac = targetFrac;
        renderStitchFrame();
      } else {
        updateScrollPosition();
      }
    }

    window._rebuildStitch = buildStitchPath;

    function renderStitchFrame() {
      const offset = pathLength * (1 - currentFrac);
      if (maskPath) {
        maskPath.style.strokeDashoffset = `${offset.toFixed(1)}`;
      } else {
        drawPath.style.strokeDashoffset = `${offset.toFixed(1)}`;
      }

      if (needleEl) {
        if (currentFrac > 0.002 && currentFrac < 0.998) {
          const targetDist = pathLength * currentFrac;
          const refPath = maskPath || drawPath;
          const pt = refPath.getPointAtLength(targetDist);
          const ptNext = refPath.getPointAtLength(Math.min(pathLength, targetDist + 3));

          const angleDeg = Math.atan2(ptNext.y - pt.y, ptNext.x - pt.x) * (180 / Math.PI);
          const pierce = Math.sin((targetDist / 21) * Math.PI * 2) * 5.5;
          const scale = window.innerWidth < 768 ? 0.95 : 1.15;

          needleEl.style.transform = `translate3d(${pt.x.toFixed(1)}px, ${pt.y.toFixed(1)}px, 0) rotate(${(angleDeg + pierce).toFixed(1)}deg) scale(${scale})`;
          needleEl.style.opacity = '1';
        } else {
          needleEl.style.opacity = '0';
        }
      }
    }

    function updateScrollPosition(instant = false) {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      const vh = window.innerHeight;
      const focalY = scrollY + vh * 0.45;
      targetFrac = Math.min(1, Math.max(0, focalY / Math.max(1, totalHeight)));

      if (instant) {
        currentFrac = targetFrac;
        renderStitchFrame();
        return;
      }

      if (!rafActive) {
        rafActive = true;
        window.requestAnimationFrame(animateStitch);
      }
    }

    function animateStitch() {
      currentFrac += (targetFrac - currentFrac) * 0.35;
      if (Math.abs(targetFrac - currentFrac) < 0.0008) {
        currentFrac = targetFrac;
      }

      renderStitchFrame();

      if (currentFrac !== targetFrac) {
        window.requestAnimationFrame(animateStitch);
      } else {
        rafActive = false;
      }
    }

    if (!window._stitchListenersAttached) {
      window._stitchListenersAttached = true;

      window.addEventListener('scroll', () => {
        if (typeof window._rebuildStitch === 'function') {
          updateScrollPosition(false);
        }
      }, { passive: true });

      window.addEventListener('resize', () => {
        clearTimeout(window._resizeTimer);
        window._resizeTimer = setTimeout(() => {
          if (typeof window._rebuildStitch === 'function') {
            window._rebuildStitch(true);
          }
        }, 80);
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && typeof window._rebuildStitch === 'function') {
          window._rebuildStitch(true);
          updateScrollPosition(true);
        }
      });
    }

    if (window._stitchRO) window._stitchRO.disconnect();
    if ('ResizeObserver' in window && mainEl) {
      let lastHeight = 0;
      window._stitchRO = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const h = Math.round(entry.contentRect.height);
          if (Math.abs(h - lastHeight) > 6) {
            lastHeight = h;
            clearTimeout(window._stitchRoTimer);
            window._stitchRoTimer = setTimeout(() => {
              buildStitchPath(true);
            }, 60);
          }
        }
      });
      window._stitchRO.observe(mainEl);
    }

    buildStitchPath(true);
  }

  /* -------------------------------------------------------------
     9. Instantaneous Client-Side Tab Routing (Zero-Flicker Architecture)
     ------------------------------------------------------------- */
  const tabTitles = {
    home: 'Dreamy Needle — Handcrafted Embroidery by Shruti | Mumbai Atelier',
    creations: 'Creations & Gallery (11 Styles) — Dreamy Needle Atelier',
    'custom-order': 'Custom Embroidery Ordering & Pricing Guide — Dreamy Needle',
    about: 'About Studio & Shruti — Dreamy Needle Atelier',
    contact: 'Contact Atelier & FAQ — Dreamy Needle'
  };

  const tabUrls = {
    home: 'index.html',
    creations: 'creations.html',
    'custom-order': 'custom-order.html',
    about: 'about.html',
    contact: 'contact.html',
    reviews: 'index.html#reviews-section'
  };

  window.switchTab = switchTab;
  async function switchTab(tabId, pushState = true, scrollToTop = true) {
    const isReviews = (tabId === 'reviews');
    const viewTargetId = isReviews ? 'home' : tabId;

    let targetView = document.getElementById(`view-${viewTargetId}`);

    // Dynamic partial fetch fallback if view not pre-mounted
    if (!targetView) {
      const url = tabUrls[viewTargetId] || `${viewTargetId}.html`;
      try {
        const res = await fetch(url);
        if (res.ok) {
          const htmlText = await res.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, 'text/html');
          const fetchedView = doc.getElementById(`view-${tabId}`) || doc.querySelector('main');
          if (fetchedView) {
            const viewDiv = document.createElement('div');
            viewDiv.id = `view-${tabId}`;
            viewDiv.className = 'tab-view view-hidden';
            viewDiv.setAttribute('data-view', tabId);
            const canvasInFetched = fetchedView.querySelector('#stitch-canvas');
            if (canvasInFetched) canvasInFetched.remove();
            viewDiv.innerHTML = fetchedView.innerHTML;
            document.querySelector('main')?.appendChild(viewDiv);
            targetView = viewDiv;
          }
        }
      } catch (e) {
        // file:// CORS fallback
        window.location.href = url;
        return;
      }
    }

    if (!targetView) {
      window.location.href = tabUrls[tabId] || `${tabId}.html`;
      return;
    }

    // 1. Instant Tab View Switching
    document.querySelectorAll('.tab-view').forEach(view => {
      if (view === targetView) {
        view.classList.remove('view-hidden');
        view.classList.add('active', 'view-enter');
        setTimeout(() => view.classList.remove('view-enter'), 280);
      } else {
        view.classList.remove('active', 'view-enter');
        view.classList.add('view-hidden');
      }
    });

    // 2. Smooth Desktop Nav Indicators (Zero-Blink)
    document.querySelectorAll('#desktop-nav .nav-link').forEach(link => {
      const isTarget = link.getAttribute('data-tab') === tabId;
      link.classList.toggle('active', isTarget);
      link.classList.toggle('text-primary', isTarget);
      link.classList.toggle('font-bold', isTarget);
    });

    // 3. Smooth Mobile Drawer Nav Indicators
    document.querySelectorAll('#mobile-nav .mobile-nav-link').forEach(link => {
      const isTarget = link.getAttribute('data-tab') === tabId;
      if (isTarget) {
        link.className = 'mobile-nav-link text-primary font-bold py-2.5 px-3 rounded-xl bg-primary/10 text-sm flex items-center justify-between transition-colors';
      } else {
        link.className = 'mobile-nav-link text-stone-700 hover:text-primary hover:bg-stone-100/80 py-2.5 px-3 rounded-xl text-sm flex items-center justify-between transition-colors';
      }
    });

    // 4. Update Document Title
    if (tabTitles[tabId]) {
      document.title = tabTitles[tabId];
    }

    // 5. Update Browser History with Clean URLs
    if (pushState) {
      let targetUrl = tabUrls[tabId] || `${tabId}.html`;
      try {
        if (window.location.protocol === 'file:') {
          history.pushState({ tab: tabId }, '', `#${tabId}`);
        } else {
          if (!window.location.pathname.endsWith('.html') && tabId !== 'reviews') {
            targetUrl = (tabId === 'home') ? '/' : `${tabId}`;
          }
          history.pushState({ tab: tabId }, '', targetUrl);
        }
      } catch (e) {
        location.hash = tabId;
      }
    }

    // 6. Scroll Position
    if (isReviews) {
      setTimeout(() => {
        const revSec = document.getElementById('reviews-section');
        if (revSec) revSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 70);
    } else if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }

    // 7. Close Mobile Drawer
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      mobileMenu.classList.remove('open');
      const menuToggle = document.getElementById('menu-toggle');
      if (menuToggle) {
        menuToggle.setAttribute('aria-expanded', 'false');
        const icon = menuToggle.querySelector('.material-symbols-outlined');
        if (icon) icon.textContent = 'menu';
      }
    }

    // 8. Re-seat stitch seam smoothly to new view height
    if (typeof window._rebuildStitch === 'function') {
      requestAnimationFrame(() => {
        window._rebuildStitch(true);
      });
    }

    // 9. Re-observe above-fold reveals in newly active view
    initRevealObserver();

    // 10. Enhance any select dropdowns in newly active view
    initCustomSelects();
  }

  function detectTabFromUrl(href) {
    if (!href) return 'home';
    const [path, hash] = href.split('#');
    if (hash === 'reviews-section' || hash === 'reviews') return 'reviews';
    if (hash && document.getElementById(`view-${hash}`)) return hash;

    const file = path.split('/').pop().toLowerCase();
    if (file.includes('creation')) return 'creations';
    if (file.includes('custom') || file.includes('order')) return 'custom-order';
    if (file.includes('about')) return 'about';
    if (file.includes('contact')) return 'contact';
    if (file.includes('index') || file === '' || file === '/') return 'home';

    return 'home';
  }

  function initSmoothPageNavigation() {
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;

      // Ignore external or protocol links
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('mailto:') ||
        href.startsWith('tel:') ||
        link.getAttribute('target') === '_blank' ||
        link.hasAttribute('download')
      ) {
        return;
      }

      const dataTab = link.getAttribute('data-tab');
      if (dataTab) {
        e.preventDefault();
        switchTab(dataTab, true, true);
        return;
      }

      const targetTab = detectTabFromUrl(href);
      if (targetTab) {
        e.preventDefault();
        switchTab(targetTab, true, targetTab !== 'reviews');
      }
    });

    window.addEventListener('popstate', (e) => {
      const tabId = (e.state && e.state.tab) || detectTabFromUrl(window.location.href);
      switchTab(tabId, false, false);
    });
  }

  /* -------------------------------------------------------------
     Master Initializer
     ------------------------------------------------------------- */
  function initAllPageComponents() {
    initRevealObserver();
    initCustomSelects();
    initCategoryFilterPills();
    initFaqAccordions();
    initWhatsAppOrderBuilder();
    initReviewSystem();
    initStitchEngine();
  }

  initMobileMenu();
  initSmoothPageNavigation();
  initAllPageComponents();

  // Route to initial active tab on page load
  const initialTab = detectTabFromUrl(window.location.href);
  switchTab(initialTab, false, false);
});