// === GLOBAL STATE ===
let timerInterval;
let timeLeft = 60 * 60; // 60 minutes in seconds
let penaltyCount = 0;
let isStarted = false;

// Trial States
let trialsState = {
    t1: false,
    t2: false,
    t3: false,
    t4: false,
    t5: false,
    t6: false
};

// Trial 4 logic array
let selectedSteps = [];
const correctT4Order = [
    "Extracció d'ADN",
    "Amplificació mitjançant PCR del marcador",
    "Seqüenciació de Nova Generació/Sanger",
    "Comparació en base de dades bioinformàtica",
    "Identificació de l'espècie",
    "Emissió de l'informe biològic forense"
];

// Start Flash overlay
const flashOverlay = document.createElement('div');
flashOverlay.id = 'penalty-flash';
document.body.appendChild(flashOverlay);

// === NAVIGATION ===
function showScreen(screenId) {
    // Hide all screens except the target one
    document.querySelectorAll('.screen').forEach(s => {
        if (s.id !== screenId) {
            s.classList.remove('active');
            setTimeout(() => s.classList.add('hidden'), 50); // Small delay for transition
        }
    });
    
    // Show target screen
    const target = document.getElementById(screenId);
    if(target) {
        target.classList.remove('hidden');
        setTimeout(() => target.classList.add('active'), 60); // Apply active after others are hidden
    }

    // Timer logic on entering first block
    if (screenId === 'screen-pre-diagnosis' && !timerInterval && timeLeft > 0) {
        startTimer();
    }

    // Handle HUD visibility
    if (screenId === 'screen-start' || screenId === 'screen-intro1' || screenId === 'screen-intro2' || screenId === 'screen-pre-diagnosis' || screenId === 'screen-pre-wordsearch') {
        document.getElementById('global-hud').classList.add('hidden');
    } else {
        document.getElementById('global-hud').classList.remove('hidden');
    }
}

// === GAME CORE LOGIC ===
function startInvestigation() {
    showScreen('screen-pre-diagnosis');
}

function startGame() {
    isStarted = true;
    showScreen('screen-dashboard');
    updateDashboardUI();
}

function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            timeLeft = 0;
            clearInterval(timerInterval);
            gameOverTimeOut();
        }
        updateTimerDisplay();
    }, 1000);
}

function updateTimerDisplay() {
    const min = Math.floor(timeLeft / 60);
    const sec = timeLeft % 60;
    document.getElementById('timer').innerHTML = `<i class="fa-solid fa-clock"></i> ${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

function penalize() {
    timeLeft = Math.max(0, timeLeft - 60); // Subtract 60 seconds
    penaltyCount++;
    document.getElementById('penalty-count').innerText = penaltyCount;
    updateTimerDisplay();
    
    // Visual Flash
    flashOverlay.classList.add('flash-active');
    setTimeout(() => {
        flashOverlay.classList.remove('flash-active');
    }, 300);

    addToTerminal(`[ERROR] Parametres incorrectes. Penalització de temps (-1 min) aplicada. Intents de hackeig o errada detectada.`);
}

function addToTerminal(msg) {
    const term = document.getElementById('terminal-log');
    term.innerHTML += `<br>> ${msg}`;
    term.scrollTop = term.scrollHeight;
}

function markTrialComplete(trialNum, fieldId, valueStr, nextTrialBtnId) {
    trialsState[`t${trialNum}`] = true;
    
    // Update Dashboard Field
    const df = document.getElementById(`dashboard-f${trialNum}`);
    df.classList.remove('blocked');
    df.innerText = valueStr;

    // Update Trial Button visually
    const btn = document.getElementById(`btn-trial${trialNum}`);
    btn.classList.add('completed');
    btn.innerHTML = btn.innerHTML.replace('fa-lock text-muted', 'fa-check text-success');

    // Enable next trial button
    if (nextTrialBtnId) {
        const nextBtn = document.getElementById(nextTrialBtnId);
        if(nextBtn) nextBtn.classList.remove('disabled');
    }

    addToTerminal(`[SUCCESS] Procés ${trialNum} desxifrat. Dades validades i guardades a l'informe.`);

    // Check if fully complete
    if (trialNum === 6) {
        document.getElementById('btn-final-report').classList.remove('hidden');
        clearInterval(timerInterval);
        const min = Math.floor(timeLeft / 60);
        const sec = timeLeft % 60;
        document.getElementById('final-time').innerText = `Temps sobrant: ${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }

    // Go back to dashboard
    showScreen('screen-dashboard');
}

function updateDashboardUI() {
    // Buttons are disabled by default via HTML class 'disabled'.
    // If we want to strictly enforce no-click unless enabled
    document.querySelectorAll('.trial-btn').forEach((btn, index) => {
        // Only First button is enabled natively.
        btn.addEventListener('click', (e) => {
            if (btn.classList.contains('disabled')) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    });
}

// === TRIAL 1 SPECIFIC ===
function toggleWord(element) {
    element.classList.toggle('disabled-word');
}

function verifyTrial1() {
    const input = document.getElementById('t1-input').value.trim().toLowerCase();
    const fb = document.getElementById('t1-feedback');
    
    if (input === 'teixit muscular') {
        fb.innerHTML = '<span class="feedback-success"><i class="fa-solid fa-check"></i> Correcte! Tipus de mostra deduït.</span>';
        setTimeout(() => {
            markTrialComplete(1, 'dashboard-f1', 'TEIXIT MUSCULAR', 'btn-trial2');
        }, 1200);
    } else {
        fb.innerHTML = '<span class="feedback-error"><i class="fa-solid fa-xmark"></i> Dades invàlides. Pista: Quines paraules correctes has deixat sense ratllar? Escriu-les en ordre.</span>';
        penalize();
    }
}

// === TRIAL 2 SPECIFIC ===
function verifyTrial2() {
    const options = document.getElementsByName('techOption');
    let selected = null;
    options.forEach(opt => { if(opt.checked) selected = opt.value; });
    const fb = document.getElementById('t2-feedback');

    if (!selected) return;

    if (selected === 'F') { // DNA Barcoding
        fb.innerHTML = '<span class="feedback-success"><i class="fa-solid fa-check"></i> Correcte! Tècnica establerta al panell robotitzat.</span>';
        setTimeout(() => {
            markTrialComplete(2, 'dashboard-f2', 'DNA BARCODING', 'btn-trial3');
        }, 1200);
    } else {
        fb.innerHTML = '<span class="feedback-error"><i class="fa-solid fa-xmark"></i> Tècnica incorrecta per al tipus de mostra i objectiu.</span>';
        penalize();
    }
}

// === TRIAL 3 SPECIFIC ===
function verifyTrial3() {
    const input = document.getElementById('t3-input').value.trim().toUpperCase();
    const fb = document.getElementById('t3-feedback');
    
    if (input === 'COI' || input === 'CO1') {
        fb.innerHTML = '<span class="feedback-success"><i class="fa-solid fa-check"></i> Gen acceptat a la matriu de recerca.</span>';
        setTimeout(() => {
            markTrialComplete(3, 'dashboard-f3', 'GEN COI (MT)', 'btn-trial4');
        }, 1200);
    } else {
        fb.innerHTML = '<span class="feedback-error"><i class="fa-solid fa-xmark"></i> Mot secret incorrecte. Resol el crucigrama i utilitza les caselles destacades.</span>';
        penalize();
    }
}

// === TRIAL 4 SPECIFIC ===
function selectStep(btnElement, stepName) {
    if (btnElement.classList.contains('used')) return;
    
    selectedSteps.push(stepName);
    btnElement.classList.add('used');
    renderT4Slots();
}

function renderT4Slots() {
    const slotsContainer = document.getElementById('t4-slots');
    slotsContainer.innerHTML = '';
    
    for(let i=0; i < 6; i++) {
        const d = document.createElement('div');
        d.className = 'step-slot';
        
        const num = document.createElement('span');
        num.className = 'order-num';
        num.innerText = `0${i+1}`;
        
        const text = document.createElement('span');
        text.className = 'filled-step';
        if (selectedSteps[i]) {
            text.innerText = selectedSteps[i];
        } else {
            text.innerText = '---';
            text.style.opacity = '0.3';
        }
        
        d.appendChild(num);
        d.appendChild(text);
        slotsContainer.appendChild(d);
    }
}

function resetSteps() {
    selectedSteps = [];
    document.querySelectorAll('.step-btn').forEach(btn => btn.classList.remove('used'));
    renderT4Slots();
    document.getElementById('t4-feedback').innerHTML = '';
}

function verifyTrial4() {
    const fb = document.getElementById('t4-feedback');
    
    if (selectedSteps.length !== 6) {
        fb.innerHTML = '<span class="feedback-error"><i class="fa-solid fa-xmark"></i> Has de seleccionar tots els passos abans d\'enviar.</span>';
        return;
    }

    let isCorrect = true;
    for(let i=0; i<6; i++) {
        if(selectedSteps[i] !== correctT4Order[i]) isCorrect = false;
    }

    if (isCorrect) {
        fb.innerHTML = '<span class="feedback-success"><i class="fa-solid fa-check"></i> Flux validat i emmagatzemat correctament.</span>';
        setTimeout(() => {
            markTrialComplete(4, 'dashboard-f4', 'BARCODING STANDARD Y PROTOCOL BOLD', 'btn-trial5');
        }, 1200);
    } else {
        fb.innerHTML = '<span class="feedback-error"><i class="fa-solid fa-xmark"></i> L\'ordre no és lògic biològicament o cronològicament. Revisa el procés.</span>';
        penalize();
    }
}

// Initial render for T4 array and Pre-Tests
document.addEventListener('DOMContentLoaded', () => {
    if(document.getElementById('t4-slots')) {
        renderT4Slots();
    }
    renderPreQuiz();
    renderWordSearch();
});

// === PRE-TESTS LOGIC ===
const preQuizData = [
    { q: "Un peix és:", opts: ["Invertebrat", "Vertebrat", "Mamífer", "Amfibi"], a: "Vertebrat" },
    { q: "Els vertebrats tenen:", opts: ["Exoesquelet", "Columna vertebral", "Cap estructura", "Només teixits tous"], a: "Columna vertebral" },
    { q: "Les brànquies serveixen per:", opts: ["Alimentar-se", "Respirar", "Moure’s", "Reproduir-se"], a: "Respirar" },
    { q: "La cèl·lula és:", opts: ["Un òrgan", "La unitat bàsica de la vida", "Un sistema", "Un teixit"], a: "La unitat bàsica de la vida" },
    { q: "El nucli cel·lular:", opts: ["Controla la cèl·lula i conté ADN", "Fa la digestió", "Produeix energia", "Mou la cèl·lula"], a: "Controla la cèl·lula i conté ADN" },
    { q: "L’ADN es troba principalment al:", opts: ["Citoplasma", "Nucli", "Membrana", "Ribosoma"], a: "Nucli" },
    { q: "Un gen és:", opts: ["Un tipus de cèl·lula", "Una proteïna", "Una part de l’ADN", "Un teixit"], a: "Una part de l’ADN" },
    { q: "La mitosi serveix per:", opts: ["Produir gàmetes", "Crear cèl·lules idèntiques", "Fer mutacions", "Crear espècies noves"], a: "Crear cèl·lules idèntiques" },
    { q: "La meiosi serveix per:", opts: ["Creixement", "Reparació", "Producció de gàmetes", "Digestió"], a: "Producció de gàmetes" },
    { q: "L’ARN participa en:", opts: ["La digestió", "La respiració", "La síntesi de proteïnes", "El moviment"], a: "La síntesi de proteïnes" },
    { q: "Una mutació és:", opts: ["Una divisió cel·lular", "Un canvi en l’ADN", "Un tipus de teixit", "Un òrgan"], a: "Un canvi en l’ADN" },
    { q: "L’evolució és:", opts: ["Un canvi ràpid en un individu", "Un procés de canvi en les espècies", "Una mutació puntual", "Una malaltia"], a: "Un procés de canvi en les espècies" },
    { q: "El fenotip és:", opts: ["El conjunt de gens", "L’aspecte observable", "Una mutació", "Una cèl·lula"], a: "L’aspecte observable" },
    { q: "El genotip és:", opts: ["L’aspecte extern", "El conjunt de gens", "Un òrgan", "Un sistema"], a: "El conjunt de gens" },
    { q: "Quin procés és responsable de la variabilitat genètica?", opts: ["Mitosi", "Respiració", "Reproducció asexual", "Meiosi"], a: "Meiosi" },
    { q: "Un individu és homozigot quan:", opts: ["Té dos al·lels diferents", "Té dos al·lels iguals", "No té gens", "Té només un al·lel"], a: "Té dos al·lels iguals" },
    { q: "Un al·lel recessiu s’expressa quan:", opts: ["Sempre està present", "Hi ha un al·lel dominant", "L’individu és homozigot recessiu", "L’individu és heterozigot"], a: "L’individu és homozigot recessiu" },
    { q: "La selecció natural implica:", opts: ["Que tots sobreviuen igual", "Que sobreviuen els millor adaptats", "Que no hi ha canvis", "Que desapareixen tots els individus"], a: "Que sobreviuen els millor adaptats" },
    { q: "La selecció natural afavoreix:", opts: ["Els individus més forts físicament", "Els individus millor adaptats al medi", "Tots els individus per igual", "Els individus amb més mutacions"], a: "Els individus millor adaptats al medi" },
    { q: "L’extinció d’una espècie es produeix quan:", opts: ["Els individus evolucionen i es transformen en una nova espècie", "Desapareixen tots els individus d’una espècie sense deixar descendència", "Es produeixen mutacions en el seu ADN", "Una espècie s’adapta millor al medi"], a: "Desapareixen tots els individus d’una espècie sense deixar descendència" }
];

function renderPreQuiz() {
    const container = document.getElementById('quiz-container');
    if(!container) return;
    
    let html = '';
    preQuizData.forEach((qObj, i) => {
        let shuffledOpts = [...qObj.opts].sort(() => Math.random() - 0.5);
        html += `<div class="question-block" id="qb-${i}">
            <div class="question-title">${i + 1}. ${qObj.q}</div>
            <div class="radio-group" style="display:flex; flex-direction:column; gap:5px;">`;
        shuffledOpts.forEach((opt, j) => {
            html += `<label class="radio-label">
                <input type="radio" name="q${i}" value="${opt}">
                <span style="margin-left:8px;">${opt}</span>
            </label>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

function verifyPreDiagnosis() {
    let allAnswered = true;
    let allCorrect = true;
    let firstUnanswered = -1;
    
    preQuizData.forEach((qObj, i) => {
        const selected = document.querySelector(`input[name="q${i}"]:checked`);
        const block = document.getElementById(`qb-${i}`);
        
        if (!selected) {
            allAnswered = false;
            block.style.borderColor = "var(--danger)";
            if(firstUnanswered === -1) firstUnanswered = i;
        } else {
            if (selected.value === qObj.a) {
                block.style.borderColor = "var(--success)";
            } else {
                block.style.borderColor = "var(--danger)";
                allCorrect = false;
            }
        }
    });
    
    const fb = document.getElementById('pre-diagnosis-feedback');
    if (!allAnswered) {
        fb.innerHTML = '<span class="feedback-error"><i class="fa-solid fa-xmark"></i> Has de respondre totes les preguntes abans de validar.</span>';
        document.getElementById(`qb-${firstUnanswered}`).scrollIntoView({behavior: 'smooth', block: 'center'});
        return;
    }
    
    if (allCorrect) {
        fb.innerHTML = '<span class="feedback-success" style="font-size: 1.1em; padding: 10px; display: inline-block;"><i class="fa-solid fa-check"></i> Genial! Pots continuar amb la següent prova per demostrar que ets un bon candidat.</span>';
        document.getElementById('btn-next-pre').classList.remove('hidden');
    } else {
        fb.innerHTML = '<span class="feedback-error"><i class="fa-solid fa-xmark"></i> Hi ha respostes incorrectes. Revisa les marcades en vermell.</span>';
    }
}

const wordSearchWords = ["CROMOSOMA", "MITOSI", "MEIOSI", "VERTEBRAT", "NUCLI", "ALETES", "MUTACIO", "ARN", "ESPECIE", "EVOLUCIO", "EXTINCIO", "HERENCIA"];
let wordSearchGrid = [];
const W_SIZE = 20;
let wordsFound = new Set();
let isSelecting = false;
let startCell = null;
let currentSelection = [];

function generateWordSearch() {
    wordSearchGrid = Array(W_SIZE).fill(null).map(() => Array(W_SIZE).fill(''));
    
    let wordsToPlace = [...wordSearchWords].sort(() => Math.random() - 0.5);
    let assignedDirs = [
        ...Array(4).fill([0, 1]),
        ...Array(4).fill([1, 0]),
        ...Array(4).fill([1, 1])
    ];
    assignedDirs.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < wordsToPlace.length; i++) {
        let placed = false;
        let attempts = 0;
        let word = wordsToPlace[i];
        let d = assignedDirs[i];
        
        while (!placed && attempts < 5000) {
            attempts++;
            let r = Math.floor(Math.random() * W_SIZE);
            let c = Math.floor(Math.random() * W_SIZE);
            
            if (canPlaceWord(word, r, c, d[0], d[1], W_SIZE)) {
                for (let j = 0; j < word.length; j++) {
                    wordSearchGrid[r + j*d[0]][c + j*d[1]] = word[j];
                }
                placed = true;
            }
        }
        if(!placed) {
            return generateWordSearch(); 
        }
    }
    
    const alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for(let r=0; r<W_SIZE; r++) {
        for(let c=0; c<W_SIZE; c++) {
            if(wordSearchGrid[r][c] === '') {
                wordSearchGrid[r][c] = alpha[Math.floor(Math.random()*alpha.length)];
            }
        }
    }
}

function canPlaceWord(word, r, c, dr, dc, size) {
    if (r + dr*(word.length-1) < 0 || r + dr*(word.length-1) >= size) return false;
    if (c + dc*(word.length-1) < 0 || c + dc*(word.length-1) >= size) return false;
    
    for (let i = 0; i < word.length; i++) {
        let existing = wordSearchGrid[r + i*dr][c + i*dc];
        if (existing !== '' && existing !== word[i]) return false;
    }
    return true;
}

function renderWordSearch() {
    generateWordSearch();
    const gridContainer = document.getElementById('wordsearch-grid');
    if(!gridContainer) return;
    
    let html = '';
    for(let r=0; r<W_SIZE; r++){
        for(let c=0; c<W_SIZE; c++){
            html += `<div class="ws-cell" id="c-${r}-${c}" onmousedown="startSelectWS(event, ${r}, ${c})" ontouchstart="startSelectWS(event, ${r}, ${c})" onmouseenter="enterSelectWS(event, ${r}, ${c})">${wordSearchGrid[r][c]}</div>`;
        }
    }
    gridContainer.innerHTML = html;
    
    const listContainer = document.getElementById('wordsearch-list');
    html = '';
    wordSearchWords.forEach((w) => {
        html += `<div class="word-item" id="wi-${w}">${w}</div>`;
    });
    listContainer.innerHTML = html;
    
    document.addEventListener('mouseup', endSelectWS);
    document.addEventListener('touchend', endSelectWS);
    gridContainer.addEventListener('touchmove', handleTouchMoveWS, {passive: false});
}

function handleTouchMoveWS(e) {
    if (!isSelecting) return;
    e.preventDefault(); 
    let touch = e.touches[0];
    let el = document.elementFromPoint(touch.clientX, touch.clientY);
    if(el && el.classList.contains('ws-cell')) {
        let parts = el.id.split('-');
        let r = parseInt(parts[1]);
        let c = parseInt(parts[2]);
        enterSelectWS(null, r, c);
    }
}

function getSelectedCellsState(sr, sc, er, ec) {
    let cells = [];
    let dr = Math.sign(er - sr);
    let dc = Math.sign(ec - sc);
    
    if (dr !== 0 && dc !== 0 && Math.abs(er - sr) !== Math.abs(ec - sc)) {
        return [];
    }
    
    let steps = Math.max(Math.abs(er - sr), Math.abs(ec - sc));
    for(let i=0; i<=steps; i++) {
        cells.push({r: sr + i*dr, c: sc + i*dc});
    }
    return cells;
}

function startSelectWS(e, r, c) {
    if(e && e.cancelable) e.preventDefault();
    isSelecting = true;
    startCell = {r, c};
    clearSelectionWS();
    currentSelection = [{r, c}];
    document.getElementById(`c-${r}-${c}`).classList.add('selected');
}

function enterSelectWS(e, r, c) {
    if (!isSelecting) return;
    clearSelectionWS();
    
    currentSelection = getSelectedCellsState(startCell.r, startCell.c, r, c);
    
    currentSelection.forEach(cell => {
        let el = document.getElementById(`c-${cell.r}-${cell.c}`);
        if(el) el.classList.add('selected');
    });
}

function clearSelectionWS() {
    document.querySelectorAll('.ws-cell.selected').forEach(el => el.classList.remove('selected'));
}

function endSelectWS() {
    if(!isSelecting) return;
    isSelecting = false;
    
    if (currentSelection.length > 0) {
        let wordStr = currentSelection.map(cell => wordSearchGrid[cell.r][cell.c]).join('');
        
        let foundWord = null;
        if (wordSearchWords.includes(wordStr) && !wordsFound.has(wordStr)) foundWord = wordStr;
        
        if (foundWord) {
            wordsFound.add(foundWord);
            currentSelection.forEach(cell => {
                let el = document.getElementById(`c-${cell.r}-${cell.c}`);
                if(el) {
                    el.classList.add('found');
                    el.classList.remove('selected'); 
                }
            });
            let wi = document.getElementById(`wi-${foundWord}`);
            if(wi) wi.classList.add('found');
            
            checkWordSearchComplete();
        }
    }
    
    clearSelectionWS();
    currentSelection = [];
}

function checkWordSearchComplete() {
    if (wordsFound.size === wordSearchWords.length) {
        let fb = document.getElementById('wordsearch-feedback');
        fb.innerHTML = '<span class="feedback-success" style="font-size: 1.1em; padding: 10px; display: inline-block;"><i class="fa-solid fa-check"></i> Objectiu assolit! Has validat els teus coneixements previs. Ja pots començar la recerca.</span>';
        document.getElementById('btn-start-game-real').classList.remove('hidden');
    }
}

function verifyWordSearch() {
    let fb = document.getElementById('wordsearch-feedback');
    if (wordsFound.size === wordSearchWords.length) {
        fb.innerHTML = '<span class="feedback-success" style="font-size: 1.1em; padding: 10px; display: inline-block;"><i class="fa-solid fa-check"></i> Objectiu assolit! Has validat els teus coneixements previs. Ja pots començar la recerca.</span>';
        document.getElementById('btn-start-game-real').classList.remove('hidden');
    } else {
        fb.innerHTML = `<span class="feedback-error"><i class="fa-solid fa-xmark"></i> Et falten ${wordSearchWords.length - wordsFound.size} paraules per trobar a la graella.</span>`;
    }
}


// === TRIAL 5 SPECIFIC ===
function verifyTrial5() {
    const input = document.getElementById('t5-input').value.trim().toUpperCase();
    const fb = document.getElementById('t5-feedback');
    
    // Original fragment 3'-GCTGAACTTGGACAACCAGGATCTCTTTTA-5'
    // Complementary 5'-CGACTTGAACCTGTTGGTCCTAGAGAAAAT-3'
    
    if (input === 'CGACTTGAACCTGTTGGTCCTAGAGAAAAT') {
        fb.innerHTML = '<span class="feedback-success"><i class="fa-solid fa-check"></i> Seqüència reconstruïda. Homologia del 100%.</span>';
        setTimeout(() => {
            markTrialComplete(5, 'dashboard-f5', '100.0% DE CONCORDANÇA', 'btn-trial6');
        }, 1200);
    } else {
        fb.innerHTML = '<span class="feedback-error"><i class="fa-solid fa-xmark"></i> Error d\'aparellament. Recorda: A-T i C-G.</span>';
        penalize();
    }
}

// === TRIAL 6 SPECIFIC ===
function verifyTrial6() {
    const expected = ['5', '3', '2', '9', '3', '9', '2', '4', '0', '1'];
    let allDiffsCorrect = true;

    for (let i = 1; i <= 10; i++) {
        let val = document.getElementById(`t6-dif-${i}`).value.trim();
        if (val !== expected[i-1] && val !== `${expected[i-1]}/30`) {
            allDiffsCorrect = false;
        }
    }

    const input = document.getElementById('t6-input').value.trim().toLowerCase();
    const fb = document.getElementById('t6-feedback');
    
    let isSpeciesCorrect = input.includes('sphyrna lewini') || input === 'sphyrna lewini';

    if (allDiffsCorrect && isSpeciesCorrect) {
        fb.innerHTML = '<span class="feedback-success"><i class="fa-solid fa-check"></i> Confirmació d\'espècie i diferències: POSITIVA.</span>';
        setTimeout(() => {
            markTrialComplete(6, 'dashboard-f6', 'Sphyrna lewini', null);
        }, 1200);
    } else {
        fb.innerHTML = '<span class="feedback-error"><i class="fa-solid fa-xmark"></i> Revisa els càlculs de diferències i l\'espècie identificada. Alguna dada no quadra.</span>';
        penalize();
    }
}

function gameOverTimeOut() {
    // Basic timeout handler
    alert("MISSIÓ FALLIDA! Retenció duanera expirada. El contenidor ha desaparegut.");
    location.reload();
}
