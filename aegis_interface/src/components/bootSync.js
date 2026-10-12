export class BootSync {
    constructor() {
        this.root = document.getElementById('neural-sync');
        this.steps = this.root ? this.root.querySelectorAll('.sync__step') : [];
    }

    typewrite(el, text, speed = 20) {
        return new Promise(resolve => {
            el.textContent = '';
            let i = 0;
            const iv = setInterval(() => {
                el.textContent += text[i++];
                if (i >= text.length) { clearInterval(iv); resolve(); }
            }, speed);
        });
    }

    async play() {
        for (const s of this.steps) {
            const fullText = s.textContent;
            const fadeIn = s.animate([
                { opacity: '0', transform: 'translateX(-50%) translateY(8px)' },
                { opacity: '1', transform: 'translateX(-50%) translateY(0)' }
            ], { duration: 250, fill: 'forwards', easing: 'ease-out' });
            await fadeIn.finished;
            await this.typewrite(s, fullText);
            await new Promise(r => setTimeout(r, 600));
            const fadeOut = s.animate([
                { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
                { opacity: '0', transform: 'translateX(-50%) translateY(-8px)' }
            ], { duration: 200, fill: 'forwards', easing: 'ease-in' });
            await fadeOut.finished;
        }

        await new Promise(r => setTimeout(r, 400));
        this.root.style.opacity = '0';
        this.root.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out';
        this.root.style.transform = 'scale(0.95)';
        await new Promise(resolve => {
            this.root.addEventListener('transitionend', () => {
                this.root.style.display = 'none';
                const ui = document.getElementById('main-content');
                if (ui) ui.classList.remove('hidden');
                resolve();
            }, { once: true });
            setTimeout(resolve, 600);
        });
    }
}
