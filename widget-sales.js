// ================================================================
// ВИДЖЕТ: Актуальные распродажи
// ================================================================

(function() {
    // Ссылка на JSON-файл (GitHub)
    const WIDGET_JSON_URL = 'https://raw.githubusercontent.com/maximdobizha/deckclub-data/main/sales.json';

    // Функция рендеринга виджета
    function renderWidget(data) {
        const container = document.getElementById('widget-content');
        if (!container) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Фильтруем только будущие и активные распродажи
        const relevant = [];
        const all = data.sales || [];

        all.forEach(item => {
            if (!item.start || !item.end) return;
            const start = new Date(item.start + 'T00:00:00');
            const end = new Date(item.end + 'T00:00:00');
            end.setHours(23, 59, 59, 999);

            if (today <= end) {
                relevant.push(item);
            }
        });

        // Сортируем по дате начала
        relevant.sort((a, b) => new Date(a.start) - new Date(b.start));

        // Ближайшая — первая в списке
        const nearest = relevant.length > 0 ? relevant.shift() : null;
        const upcoming = relevant.slice(0, 3);

        let html = '';

        // Ближайшая
        if (nearest) {
            html += renderItem(nearest, 'nearest');
        }

        // Предстоящие
        if (upcoming.length > 0) {
            upcoming.forEach(item => {
                html += renderItem(item, 'future');
            });
            if (relevant.length > 3) {
                html += `<div style="font-size:0.7rem; color:#8a9aa8; text-align:right; padding:2px 0;">+ ещё ${relevant.length - 3}...</div>`;
            }
        }

        if (!html) {
            html = `<div class="empty-state">Нет предстоящих распродаж</div>`;
        }

        html += `
            <div class="widget-footer">
                <a href="/p/steam-sales-calendar-2026">Весь календарь →</a>
            </div>
        `;

        container.innerHTML = html;
    }

    function renderItem(item, status) {
        let dateStr = '';
        if (item.start && item.end) {
            dateStr = formatDate(item.start) + ' – ' + formatDate(item.end);
        } else if (item.description) {
            dateStr = item.description;
        } else {
            dateStr = 'Дата TBD';
        }

        let badgeText = '', badgeClass = '';
        if (status === 'active') { badgeText = 'Идёт'; badgeClass = 'active'; }
        else if (status === 'nearest') { badgeText = '⭐ Ближайшая'; badgeClass = 'nearest'; }
        else { badgeText = 'Предстоит'; badgeClass = 'future'; }

        const nameHtml = item.url ? `<a href="${item.url}" target="_blank">${item.name}</a>` : item.name;

        return `
            <div class="sale-item">
                <span class="name">${nameHtml}</span>
                <span class="date">${dateStr}</span>
                <span class="badge ${badgeClass}">${badgeText}</span>
            </div>
        `;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        const months = { '01': 'янв', '02': 'фев', '03': 'мар', '04': 'апр', '05': 'май', '06': 'июн', '07': 'июл', '08': 'авг', '09': 'сен', '10': 'окт', '11': 'ноя', '12': 'дек' };
        return parseInt(parts[2]) + ' ' + months[parts[1]];
    }

    function loadWidgetData() {
        const container = document.getElementById('widget-content');
        if (!container) return;

        fetch(WIDGET_JSON_URL)
            .then(response => {
                if (!response.ok) throw new Error('Не удалось загрузить данные');
                return response.json();
            })
            .then(data => renderWidget(data))
            .catch(() => {
                container.innerHTML = `
                    <div style="color:#c0392b; font-size:0.8rem; padding:4px 0;">
                        ⚠️ Ошибка загрузки данных
                    </div>
                    <div class="widget-footer">
                        <a href="/p/steam-sales-calendar-2026">Перейти к календарю →</a>
                    </div>
                `;
            });
    }

    // Запускаем при загрузке и при переходах
    document.addEventListener('DOMContentLoaded', loadWidgetData);
    document.addEventListener('page:loaded', loadWidgetData);
    document.addEventListener('turbolinks:load', loadWidgetData);

    // Универсальный таймер
    let attempts = 0;
    const maxAttempts = 20;
    const interval = setInterval(function() {
        const container = document.getElementById('widget-content');
        if (container && container.innerHTML === '⏳ Загрузка данных...') {
            loadWidgetData();
        }
        attempts++;
        if (attempts >= maxAttempts) clearInterval(interval);
    }, 500);

})();