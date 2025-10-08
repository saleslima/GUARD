// Global variables
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentTeam = '';
let annotations = {};
let currentAnnotationKey = '';
let deferredPrompt;
let shiftAnnotations = {}; // New: Store shift cell annotations
let isDarkMode = false;

// Team definitions
const teams = {
    A: {
        daySequence: ['A', 'B', 'A', 'A', 'A', 'B', 'A', 'B', 'A', 'B', 'B', 'B', 'A', 'B'],
        nightSequence: ['C', 'D', 'C', 'C', 'C', 'D', 'C', 'D', 'C', 'D', 'D', 'D', 'C', 'D']
    },
    B: {
        daySequence: ['A', 'B', 'A', 'A', 'A', 'B', 'A', 'B', 'A', 'B', 'B', 'B', 'A', 'B'],
        nightSequence: ['C', 'D', 'C', 'C', 'C', 'D', 'C', 'D', 'C', 'D', 'D', 'D', 'C', 'D']
    },
    C: {
        daySequence: ['A', 'B', 'A', 'A', 'A', 'B', 'A', 'B', 'A', 'B', 'B', 'B', 'A', 'B'],
        nightSequence: ['C', 'D', 'C', 'C', 'C', 'D', 'C', 'D', 'C', 'D', 'D', 'D', 'C', 'D']
    },
    D: {
        daySequence: ['A', 'B', 'A', 'A', 'A', 'B', 'A', 'B', 'A', 'B', 'B', 'B', 'A', 'B'],
        nightSequence: ['C', 'D', 'C', 'C', 'C', 'D', 'C', 'D', 'C', 'D', 'D', 'D', 'C', 'D']
    }
};

const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// New: Shift cell annotation functions
function openShiftMenu(element, shift, date, shiftType) {
    closeShiftMenu(); // Close any existing menu
    
    const menu = document.createElement('div');
    menu.className = 'shift-menu';
    menu.id = 'shift-menu';
    
    const options = [
        { label: 'DELEGADA', value: 'DELEGADA' },
        { label: 'DEJEM', value: 'DEJEM' },
        { label: 'FOLGA MENSAL', value: 'FOLGA MENSAL' },
        { label: 'REMOVER', value: 'REMOVER' },
        { label: 'OUTROS', value: 'OUTROS' }
    ];
    
    options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'shift-menu-option';
        btn.textContent = option.label;
        btn.onclick = () => {
            if (option.value === 'OUTROS') {
                openCustomTextInput(element, shift, date, shiftType);
            } else if (option.value === 'REMOVER') {
                removeShiftAnnotation(date, shiftType);
                closeShiftMenu();
            } else {
                saveShiftAnnotation(date, shiftType, option.value);
                closeShiftMenu();
            }
        };
        menu.appendChild(btn);
    });
    
    // Position the menu
    const rect = element.getBoundingClientRect();
    menu.style.position = 'fixed';
    menu.style.left = rect.left + 'px';
    menu.style.top = (rect.bottom + 5) + 'px';
    
    // Adjust if menu goes off screen
    document.body.appendChild(menu);
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
        menu.style.left = (window.innerWidth - menuRect.width - 10) + 'px';
    }
    if (menuRect.bottom > window.innerHeight) {
        menu.style.top = (rect.top - menuRect.height - 5) + 'px';
    }
    
    // Close menu when clicking outside
    setTimeout(() => {
        document.addEventListener('click', closeShiftMenuOnClickOutside);
    }, 0);
}

function closeShiftMenu() {
    const menu = document.getElementById('shift-menu');
    if (menu) {
        menu.remove();
        document.removeEventListener('click', closeShiftMenuOnClickOutside);
    }
    const modal = document.getElementById('custom-text-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeShiftMenuOnClickOutside(e) {
    const menu = document.getElementById('shift-menu');
    if (menu && !menu.contains(e.target)) {
        closeShiftMenu();
    }
}

function openCustomTextInput(element, shift, date, shiftType) {
    closeShiftMenu();
    
    let modal = document.getElementById('custom-text-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'custom-text-modal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Texto Personalizado</h3>
                    <button class="close-btn custom-text-close">&times;</button>
                </div>
                <input type="text" id="custom-text-input" class="custom-text-input" 
                       placeholder="Digite o texto (4-20 caracteres)" 
                       minlength="4" maxlength="20">
                <div class="modal-buttons">
                    <button id="cancel-custom-text" class="btn btn-cancel">Cancelar</button>
                    <button id="save-custom-text" class="btn btn-save">Salvar</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        modal.querySelector('.custom-text-close').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('cancel-custom-text').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }
    
    const input = document.getElementById('custom-text-input');
    input.value = '';
    modal.style.display = 'block';
    input.focus();
    
    const saveBtn = document.getElementById('save-custom-text');
    const newSaveHandler = () => {
        const text = input.value.trim().toUpperCase();
        if (text.length >= 4 && text.length <= 20) {
            saveShiftAnnotation(date, shiftType, text);
            modal.style.display = 'none';
        } else {
            alert('O texto deve ter entre 4 e 20 caracteres.');
        }
    };
    
    saveBtn.replaceWith(saveBtn.cloneNode(true));
    document.getElementById('save-custom-text').addEventListener('click', newSaveHandler);
    
    input.onkeydown = (e) => {
        if (e.key === 'Enter') {
            newSaveHandler();
        }
    };
}

function saveShiftAnnotation(date, shiftType, text) {
    const key = `${date}-${shiftType}`;
    shiftAnnotations[key] = text;
    localStorage.setItem('shiftAnnotations', JSON.stringify(shiftAnnotations));
    generateSchedule();
}

function removeShiftAnnotation(date, shiftType) {
    const key = `${date}-${shiftType}`;
    delete shiftAnnotations[key];
    localStorage.setItem('shiftAnnotations', JSON.stringify(shiftAnnotations));
    generateSchedule();
}

function loadShiftAnnotations() {
    const saved = localStorage.getItem('shiftAnnotations');
    if (saved) {
        try {
            shiftAnnotations = JSON.parse(saved);
        } catch (e) {
            shiftAnnotations = {};
        }
    }
}

function getShiftAnnotationDisplay(text) {
    if (!text) return '';
    return text.substring(0, 5);
}

// Add Brazilian national and São Paulo state holidays function
function isHoliday(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    
    // Fixed national holidays
    const fixedHolidays = [
        [0, 1],   // Ano Novo
        [3, 21],  // Tiradentes
        [4, 1],   // Dia do Trabalho
        [8, 7],   // Independência do Brasil
        [9, 12],  // Nossa Senhora Aparecida
        [10, 2],  // Finados
        [10, 15], // Proclamação da República
        [10, 20], // Dia da Consciência Negra (SP)
        [11, 25], // Natal
    ];
    
    // Check fixed holidays
    for (let [m, d] of fixedHolidays) {
        if (month === m && day === d) return true;
    }
    
    // Easter-based holidays (Carnaval and Corpus Christi)
    const easter = getEasterDate(year);
    const carnaval = new Date(easter);
    carnaval.setDate(easter.getDate() - 47);
    
    const corpusChristi = new Date(easter);
    corpusChristi.setDate(easter.getDate() + 60);
    
    if (date.getMonth() === carnaval.getMonth() && date.getDate() === carnaval.getDate()) return true;
    if (date.getMonth() === corpusChristi.getMonth() && date.getDate() === corpusChristi.getDate()) return true;
    
    // São Paulo city anniversary
    if (month === 0 && day === 25) return true;
    
    return false;
}

function getEasterDate(year) {
    const f = Math.floor;
    const G = year % 19;
    const C = f(year / 100);
    const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
    const I = H - f(H / 28) * (1 - f(29 / (H + 1)) * f((21 - G) / 11));
    const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
    const L = I - J;
    const month = 3 + f((L + 40) / 44);
    const day = L + 28 - 31 * f(month / 4);
    return new Date(year, month - 1, day);
}

// Schedule generation function
function generateSchedule() {
    const scheduleBody = document.getElementById('schedule-body');
    scheduleBody.innerHTML = '';
    
    const { daySequence, nightSequence } = teams[currentTeam] || { 
        daySequence: ['A', 'B', 'A', 'A', 'A', 'B', 'A', 'B', 'A', 'B', 'B', 'B', 'A', 'B'],
        nightSequence: ['C', 'D', 'C', 'C', 'C', 'D', 'C', 'D', 'C', 'D', 'D', 'D', 'C', 'D']
    };
    
    const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const baseDate = new Date(2025, 9, 1);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const today = new Date();
    const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    const todayDay = today.getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(currentYear, currentMonth, day);
        const dayOfWeek = weekDays[currentDate.getDay()];
        const isWeekendOrHoliday = currentDate.getDay() === 0 || currentDate.getDay() === 6 || isHoliday(currentDate);
        
        const daysDifference = Math.floor((currentDate - baseDate) / (1000 * 60 * 60 * 24));
        const sequenceIndex = ((daysDifference % 14) + 14) % 14;
        
        const dayShift = daySequence[sequenceIndex];
        const nightShift = nightSequence[sequenceIndex];
        
        const row = document.createElement('div');
        const isToday = isCurrentMonth && day === todayDay;
        row.className = isToday ? 'row current-day' : 'row';
        
        const annotationKey = `${currentYear}-${currentMonth}-${day}`;
        const annotation = annotations[annotationKey] || '';
        
        const dateKey = `${currentYear}-${currentMonth}-${day}`;
        const dayShiftAnnotation = shiftAnnotations[`${dateKey}-day`] || '';
        const nightShiftAnnotation = shiftAnnotations[`${dateKey}-night`] || '';
        
        const dayClass = currentTeam && dayShift === currentTeam ? 'shift-cell highlighted' : 'shift-cell';
        const nightClass = currentTeam && nightShift === currentTeam ? 'shift-cell highlighted' : 'shift-cell';
        const dayCellClass = isWeekendOrHoliday ? 'cell day-cell weekend-holiday' : 'cell day-cell';
        
        row.innerHTML = `
            <div class="cell date-cell">${day}</div>
            <div class="${dayCellClass}">
                ${dayOfWeek}
                ${annotation ? `<span class="annotation-text">${annotation.substring(0, 10)}${annotation.length > 10 ? '...' : ''}</span>` : ''}
            </div>
            <div class="cell ${dayClass}" data-shift="${dayShift}" data-date="${dateKey}" data-type="day">
                ${dayShift}
                ${dayShiftAnnotation ? `<span class="shift-annotation">${getShiftAnnotationDisplay(dayShiftAnnotation)}</span>` : ''}
            </div>
            <div class="cell ${nightClass}" data-shift="${nightShift}" data-date="${dateKey}" data-type="night">
                ${nightShift}
                ${nightShiftAnnotation ? `<span class="shift-annotation">${getShiftAnnotationDisplay(nightShiftAnnotation)}</span>` : ''}
            </div>
        `;
        
        row.addEventListener('dblclick', function(e) {
            const target = e.target.closest('.cell');
            if (target && target.classList.contains('shift-cell')) {
                const shift = target.dataset.shift;
                const date = target.dataset.date;
                const type = target.dataset.type;
                openShiftMenu(target, shift, date, type);
            } else if (target && target.classList.contains('day-cell')) {
                openAnnotationModal(annotationKey, annotation);
            }
        });
        
        scheduleBody.appendChild(row);
    }
}

// Modal functions
function openAnnotationModal(key, currentAnnotation) {
    currentAnnotationKey = key;
    const modal = document.getElementById('annotation-modal');
    const input = document.getElementById('annotation-input');
    
    input.value = currentAnnotation;
    modal.style.display = 'block';
    input.focus();
}

function closeAnnotationModal() {
    const modal = document.getElementById('annotation-modal');
    modal.style.display = 'none';
    currentAnnotationKey = '';
}

function saveAnnotation() {
    const input = document.getElementById('annotation-input');
    const text = input.value.trim().toUpperCase();
    
    if (text) {
        annotations[currentAnnotationKey] = text;
    } else {
        delete annotations[currentAnnotationKey];
    }
    
    saveAnnotations();
    generateSchedule();
    closeAnnotationModal();
}

// Storage functions
function saveAnnotations() {
    const data = {
        annotations: annotations,
        selectedTeam: currentTeam,
        darkMode: isDarkMode
    };
    localStorage.setItem('scheduleAnnotations', JSON.stringify(data));
}

function loadAnnotations() {
    const saved = localStorage.getItem('scheduleAnnotations');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (typeof data === 'object' && data.annotations) {
                annotations = data.annotations || {};
                if (data.selectedTeam && teams[data.selectedTeam]) {
                    currentTeam = data.selectedTeam;
                    document.getElementById('team-select').value = data.selectedTeam;
                }
                if (data.darkMode !== undefined) {
                    isDarkMode = data.darkMode;
                    applyTheme();
                }
            } else {
                annotations = data;
            }
        } catch (e) {
            annotations = {};
        }
    }
}

// Theme toggle functions
function toggleTheme() {
    isDarkMode = !isDarkMode;
    applyTheme();
    saveAnnotations();
}

function applyTheme() {
    const themeIcon = document.querySelector('.theme-icon');
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        themeIcon.textContent = '🌙';
    } else {
        document.body.classList.remove('dark-mode');
        themeIcon.textContent = '☀️';
    }
}

// Utility functions
function updateTitle() {
    const title = document.getElementById('month-title');
    title.textContent = `${monthNames[currentMonth]} ${currentYear}`;
}

// PDF generation functions
function openPdfModal() {
    const modal = document.getElementById('pdf-modal');
    const yearSelect = document.getElementById('pdf-year');
    const monthSelect = document.getElementById('pdf-month');
    
    yearSelect.value = currentYear;
    monthSelect.value = 'completo';
    
    modal.style.display = 'block';
}

function closePdfModal() {
    const modal = document.getElementById('pdf-modal');
    modal.style.display = 'none';
}

function generatePDF() {
    const year = parseInt(document.getElementById('pdf-year').value);
    const monthValue = document.getElementById('pdf-month').value;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    if (monthValue === 'completo') {
        generateCompletePDF(doc, year);
    } else {
        const month = parseInt(monthValue);
        generateMonthPDF(doc, year, month);
    }
}

function generateCompletePDF(doc, year) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const cellWidth = (pageWidth - margin * 2) / 4;
    const cellHeight = 8;
    let currentY = 20;
    let isFirstPage = true;
    
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`Escala Completa ${year}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 20;
    
    for (let month = 0; month < 12; month++) {
        if (!isFirstPage || currentY > 100) {
            doc.addPage();
            currentY = 20;
            isFirstPage = false;
        }
        
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(0, 0, 0);
        const headers = ['Data', 'Dia da Semana', 'Dia', 'Noite'];
        headers.forEach((header, index) => {
            doc.text(header, margin + (index * cellWidth) + (cellWidth / 2), currentY, { align: 'center' });
        });
        
        doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2);
        currentY += 6;
        
        currentY = generateMonthData(doc, year, month, currentY, margin, cellWidth, cellHeight);
        currentY += 10;
    }
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('Criado por CB PM SALES LIMA', pageWidth / 2, 290, { align: 'center' });
    
    doc.save(`Escala_Completa_${year}.pdf`);
}

function generateMonthPDF(doc, year, month) {
    const pageWidth = doc.internal.pageSize.width;
    const margin = 10;
    const cellWidth = (pageWidth - margin * 2) / 4;
    const cellHeight = 8;
    let currentY = 20;
    
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`${monthNames[month]} ${year}`, pageWidth / 2, currentY, { align: 'center' });
    currentY += 15;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    const headers = ['Data', 'Dia da Semana', 'Dia', 'Noite'];
    headers.forEach((header, index) => {
        doc.text(header, margin + (index * cellWidth) + (cellWidth / 2), currentY, { align: 'center' });
    });
    
    doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2);
    currentY += 8;
    
    generateMonthData(doc, year, month, currentY, margin, cellWidth, cellHeight);
    
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('Criado por CB PM SALES LIMA', pageWidth / 2, 290, { align: 'center' });
    
    doc.save(`Escala_${monthNames[month]}_${year}.pdf`);
}

function generateMonthData(doc, year, month, startY, margin, cellWidth, cellHeight) {
    let currentY = startY;
    const daySequence = ['A', 'B', 'A', 'A', 'A', 'B', 'A', 'B', 'A', 'B', 'B', 'B', 'A', 'B'];
    const nightSequence = ['C', 'D', 'C', 'C', 'C', 'D', 'C', 'D', 'C', 'D', 'D', 'D', 'C', 'D'];
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const baseDate = new Date(2025, 9, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dayOfWeek = weekDays[currentDate.getDay()];
        const daysDifference = Math.floor((currentDate - baseDate) / (1000 * 60 * 60 * 24));
        const sequenceIndex = ((daysDifference % 14) + 14) % 14;
        
        const dayShift = daySequence[sequenceIndex];
        const nightShift = nightSequence[sequenceIndex];
        
        const annotationKey = `${year}-${month}-${day}`;
        const annotation = annotations[annotationKey] || '';
        
        doc.setTextColor(0, 0, 0);
        doc.text(day.toString(), margin + (0 * cellWidth) + (cellWidth / 2), currentY, { align: 'center' });
        
        const dayWeekText = annotation ? `${dayOfWeek}\n${annotation.substring(0, 15)}` : dayOfWeek;
        doc.text(dayWeekText, margin + (1 * cellWidth) + (cellWidth / 2), currentY, { align: 'center' });
        
        if (currentTeam && dayShift === currentTeam) {
            doc.setFillColor(0, 0, 0);
            doc.rect(margin + (2 * cellWidth), currentY - 5, cellWidth, cellHeight - 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        }
        doc.text(dayShift, margin + (2 * cellWidth) + (cellWidth / 2), currentY, { align: 'center' });
        
        if (currentTeam && nightShift === currentTeam) {
            doc.setFillColor(0, 0, 0);
            doc.rect(margin + (3 * cellWidth), currentY - 5, cellWidth, cellHeight - 1, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFont(undefined, 'bold');
        } else {
            doc.setTextColor(0, 0, 0);
            doc.setFont(undefined, 'normal');
        }
        doc.text(nightShift, margin + (3 * cellWidth) + (cellWidth / 2), currentY, { align: 'center' });
        
        currentY += cellHeight;
        
        if (currentY > 270) {
            doc.addPage();
            currentY = 20;
        }
    }
    
    return currentY;
}

// PWA and Service Worker functions
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
                
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            if (confirm('Nova versão disponível. Recarregar página?')) {
                                window.location.reload();
                            }
                        }
                    });
                });
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}

// Connection status functions
window.addEventListener('online', function() {
    console.log('App is online');
    showConnectionStatus('Online', '#28a745');
});

window.addEventListener('offline', function() {
    console.log('App is offline');
    showConnectionStatus('Offline - Funcionando localmente', '#ffc107');
});

function showConnectionStatus(message, color) {
    let statusDiv = document.getElementById('connection-status');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'connection-status';
        statusDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            padding: 8px;
            text-align: center;
            font-size: 12px;
            font-weight: 500;
            z-index: 1001;
            transition: all 0.3s ease;
        `;
        document.body.appendChild(statusDiv);
    }
    
    statusDiv.textContent = message;
    statusDiv.style.backgroundColor = color;
    statusDiv.style.color = color === '#ffc107' ? '#000' : '#fff';
    statusDiv.style.transform = 'translateY(0)';
    
    if (color === '#28a745') {
        setTimeout(() => {
            statusDiv.style.transform = 'translateY(-100%)';
        }, 3000);
    }
}

// Install prompt functions
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
        showInstallPrompt();
    }, 2000);
});

function showInstallPrompt() {
    if (deferredPrompt && (window.innerWidth <= 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))) {
        if (confirm('Deseja instalar o aplicativo Escala 2025 em seu dispositivo?')) {
            installApp();
        } else {
            deferredPrompt = null;
        }
    }
}

function installApp() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('App installed successfully');
            } else {
                console.log('User dismissed the install prompt');
            }
            deferredPrompt = null;
        });
    }
}

window.addEventListener('appinstalled', (evt) => {
    console.log('App was installed.');
});

// Event listeners setup
document.addEventListener('DOMContentLoaded', function() {
    loadAnnotations();
    loadShiftAnnotations(); // New: Load shift annotations
    updateTitle();
    generateSchedule();
    
    document.getElementById('prev-month').addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateTitle();
        generateSchedule();
    });
    
    document.getElementById('next-month').addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateTitle();
        generateSchedule();
    });
    
    document.getElementById('team-select').addEventListener('change', function(e) {
        currentTeam = e.target.value;
        saveAnnotations();
        generateSchedule();
    });
    
    // Theme toggle event listener
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
    
    // Modal event listeners
    document.getElementById('save-btn').addEventListener('click', saveAnnotation);
    document.getElementById('cancel-btn').addEventListener('click', closeAnnotationModal);
    document.querySelector('.close-btn').addEventListener('click', closeAnnotationModal);
    
    document.getElementById('annotation-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeAnnotationModal();
        }
    });
    
    document.getElementById('annotation-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            saveAnnotation();
        }
    });
    
    // PDF modal event listeners
    document.getElementById('pdf-btn').addEventListener('click', openPdfModal);
    document.getElementById('generate-pdf-btn').addEventListener('click', generatePDF);
    document.getElementById('cancel-pdf-btn').addEventListener('click', closePdfModal);
    document.querySelector('.pdf-close').addEventListener('click', closePdfModal);
    
    document.getElementById('pdf-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closePdfModal();
        }
    });
});