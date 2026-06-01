document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.navbar').forEach(function (navbar) {
        const toggle = navbar.querySelector('.nav-toggle');
        const menu = navbar.querySelector('.nav-menu');

        if (!toggle || !menu) return;

        toggle.addEventListener('click', function () {
            menu.classList.toggle('open');
            toggle.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
        });

        menu.querySelectorAll('.nav-btn, .nav-links button').forEach(function (button) {
            button.addEventListener('click', function () {
                if (window.innerWidth <= 768) {
                    menu.classList.remove('open');
                    toggle.setAttribute('aria-expanded', 'false');
                }
            });
        });
    });
});