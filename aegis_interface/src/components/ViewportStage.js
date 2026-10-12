export function setupViewportStage() {
    const stage = document.getElementById('viewport-stage');
    if (!stage) return null;

    const bootOverlay = document.createElement('div');
    bootOverlay.className = 'viewport-boot';
    bootOverlay.style.display = 'none';
    bootOverlay.innerHTML = `
        <div class="viewport-boot__scanline"></div>
        <div class="viewport-boot__steps">
            <div class="viewport-boot__step" data-step="init">INITIALIZING AGENT CHANNEL...</div>
            <div class="viewport-boot__step" data-step="auth">AUTHENTICATING NEURAL LINK...</div>
            <div class="viewport-boot__step" data-step="ready">AGENT READY</div>
        </div>
    `;
    stage.appendChild(bootOverlay);

    const cardsContainer = document.createElement('div');
    cardsContainer.className = 'viewport-cards';
    stage.appendChild(cardsContainer);

    let cardIdCounter = 0;

    function createCard(data) {
        const cardId = `card-${++cardIdCounter}`;
        const card = document.createElement('div');
        card.className = 'viewport-card';
        card.id = cardId;

        const header = document.createElement('div');
        header.className = 'viewport-card__header';
        const label = data.intent_type === 'SEARCH' ? 'WEB INTELLIGENCE' : 'AGENT RESPONSE';
        header.innerHTML = `
            <span class="viewport-card__title">${label}</span>
            <span class="viewport-card__time">${new Date().toLocaleTimeString()}</span>
            <button class="viewport-card__close" data-card="${cardId}">✕</button>
        `;

        const content = document.createElement('div');
        content.className = 'viewport-card__content';

        const textCol = document.createElement('div');
        textCol.className = 'viewport-card__text';
        textCol.textContent = data.text_content || '';

        content.appendChild(textCol);

        if (data.image_urls && Array.isArray(data.image_urls) && data.image_urls.length > 0) {
            const imgCol = document.createElement('div');
            imgCol.className = 'viewport-card__images';
            data.image_urls.forEach(url => {
                const wrap = document.createElement('div');
                wrap.className = 'viewport-card__img-wrap';
                const img = document.createElement('img');
                img.src = url;
                img.alt = '';
                img.loading = 'lazy';
                img.style.cssText = 'width:100%;height:auto;display:block;object-fit:cover';
                wrap.appendChild(img);
                imgCol.appendChild(wrap);
            });
            content.appendChild(imgCol);
        }

        card.appendChild(header);
        card.appendChild(content);

        card.querySelector('.viewport-card__close').addEventListener('click', () => {
            card.classList.add('viewport-card--exiting');
            setTimeout(() => card.remove(), 400);
        });

        return card;
    }

    function playBoot() {
        const viewportPanel = stage.closest('.panel');
        if (viewportPanel) viewportPanel.classList.remove('hidden');
        bootOverlay.style.display = 'flex';

        const steps = bootOverlay.querySelectorAll('.viewport-boot__step');
        let i = 0;
        function advance() {
            if (i >= steps.length) {
                setTimeout(() => {
                    bootOverlay.style.opacity = '0';
                    setTimeout(() => {
                        bootOverlay.style.display = 'none';
                        bootOverlay.style.opacity = '1';
                    }, 500);
                }, 600);
                return;
            }
            steps[i].classList.add('viewport-boot__step--active');
            i++;
            setTimeout(advance, 800 + Math.random() * 400);
        }
        advance();
    }

    document.addEventListener('aegisagentresponse', e => {
        const data = e.detail;
        if (!data) return;

        switch (data.intent_type) {
            case 'WAKE':
                playBoot();
                break;
            case 'SEARCH':
            case 'TEXT_STREAM':
                const card = createCard(data);
                cardsContainer.appendChild(card);
                setTimeout(() => card.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
                break;
        }
    });

    return { playBoot, createCard };
}
