let questions = {
    easy: [],
    medium: [],
    hard: [],
};

let currentQuestionIndex = 0
    ,score = 0
    ,hintsRemaining = 10
    ,isBossQuestion = false
    ,currentDifficulty = 'easy';

let mainTitleEl,questionEl,optionsEl,submitBtn,hintBtn,hintContainer,hintCountEl,progressBar,scoreEl,difficultyEl;

//main model (don't change)
const containerModel = `<h1></h1>
                        <div class="quiz-container animate__animated animate__fadeIn">
                            <div class="progress-bar"><div class="progress"></div></div>
                            <div class="info-bar">
                                <div class="hint-count">남은 힌트: <span id="hintCount">10</span></div>
                                <div class="score">점수: <span id="score">0</span></div>
                                <div class="difficulty">난이도: <span id="difficulty">Easy</span></div>
                            </div>
                            <div id="question" class="question">
                                <span class="question-number">&nbsp;</span>
                            </div>
                            <div id="options" class="options">
                                <button type="button" class="option">&nbsp;</button>
                                <button type="button" class="option">&nbsp;</button>
                                <button type="button" class="option">&nbsp;</button>
                                <button type="button" class="option">&nbsp;</button>
                            </div>
                            <div id="hintContainer" class="hint-container"></div>
                            <div class="controls">
                                <button type="button" id="hintBtn" class="animate__animated animate__fadeIn">힌트 보기</button>
                                <button type="button" id="submitBtn" class="animate__animated animate__fadeIn" disabled>제출</button>
                            </div>
                        </div>`;

async function fetchQuestions(app) {
    try {
        if(app != "ready"){
            document.querySelector(`.container.app-${app}`).innerHTML = containerModel;
            mainTitleEl = document.querySelector('.container>h1');
            questionEl = document.getElementById('question');
            optionsEl = document.getElementById('options');
            submitBtn = document.getElementById('submitBtn');
            hintBtn = document.getElementById('hintBtn');
            hintContainer = document.getElementById('hintContainer');
            hintCountEl = document.getElementById('hintCount');
            progressBar = document.querySelector('.progress');
            scoreEl = document.getElementById('score');
            difficultyEl = document.getElementById('difficulty');
    
            mainTitleEl.textContent = `🐶${app.toUpperCase()}🐹`;
            submitBtn.addEventListener('click', checkAnswer);
            hintBtn.addEventListener('click', showHint);
            const difficulties = ['easy', 'medium', 'hard'];
            for (let diff of difficulties) {
                const response = await fetch(`/_common/json/${app}/quiz-${diff}.json`);
                questions[diff] = await response.json();
                shuffleArray(questions[diff]);
            }
            displayQuestion();
        }else{
            document.querySelector('.container').innerHTML = containerModel;
            mainTitleEl = document.querySelector('.container>h1');
            questionEl = document.getElementById('question');
            mainTitleEl.textContent = '문제를 준비중입니다!';
            questionEl.classList.add(app);
        }
    } catch (error) {
        console.error('Error fetching questions:', error);
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.opacity = 1;
    setTimeout(() => {
        toast.style.opacity = 0;
    }, 1000);
}

function showResult(isCorrect) {
    const result = document.getElementById('result');
    result.textContent = isCorrect ? 'ㅇ' : '×';
    result.className = `result ${isCorrect ? 'correct' : 'incorrect'}`;
    result.style.animation = 'fadeInOut 1s ease-in-out';
    setTimeout(() => {
        result.style.animation = '';
    }, 1000);
}

function displayQuestion() {
    const question = questions[currentDifficulty][currentQuestionIndex];
    questionEl.innerHTML = `<span class="question-number">${getOverallQuestionNumber()}.</span> ${question.question}`;
    optionsEl.innerHTML = '';
    
    const shuffledOptions = [...question.options];
    shuffleArray(shuffledOptions);
    
    shuffledOptions.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option;
        button.type = 'button';
        button.dataset.opVal = option;
        button.classList.add('option');
        button.addEventListener('click', () => selectOption(index));
        optionsEl.appendChild(button);
    });
    
    hintContainer.textContent = '';
    submitBtn.disabled = true;
    
    updateProgressBar();
    checkBossQuestion();
    updateDifficultyDisplay();
}

function getOverallQuestionNumber() {
    let questionNumber = currentQuestionIndex + 1;
    if (currentDifficulty === 'medium') questionNumber += 50;
    if (currentDifficulty === 'hard') questionNumber += 100;
    return questionNumber;
}

function selectOption(index) {
    const options = optionsEl.children;
    for (let i = 0; i < options.length; i++) {
        options[i].classList.remove('selected');
    }
    options[index].classList.add('selected');
    submitBtn.disabled = false;
}

function showHint() {
    if (hintsRemaining > 0) {
        const question = questions[currentDifficulty][currentQuestionIndex];
        if(hintContainer.textContent != "") {
            hintContainer.classList.toggle('shake', true);
            setTimeout(() => {
                hintContainer.classList.toggle('shake', false);
            }, 300);
        } else {
            hintContainer.textContent = `힌트: ${ fnDec(question.hint, getEncPo()) }`;
            hintsRemaining--;
            hintCountEl.textContent = hintsRemaining;
            if(hintsRemaining == 0) {
                hintBtn.disabled = true;
            }
        }
    } else {
        alert('힌트를 모두 사용하셨습니다.');
        hintBtn.disabled = true;
    }
}

function checkAnswer() {
    const selectedOption = optionsEl.querySelector('.selected');
    if (!selectedOption) return;
    const question = questions[currentDifficulty][currentQuestionIndex];
    if((question.options[fnDec(question.correctAnswer, getEncPo())] === selectedOption.dataset.opVal)
        ||fnDec(question.correctAnswer, getEncPo()) === selectedOption.dataset.opVal) {
        score++;
        showPositiveFeedback();
        showToast('정답입니다!');
        showResult(true);
        setTimeout(() => {
            nextQuestion();
        }, 1000);
    } else {
        showNegativeFeedback();
        showToast('틀렸습니다. 다시 시도해보세요!');
        showResult(false);
        setTimeout(() => {
            resetGame();
        }, 1000);
    }
}

function showPositiveFeedback() {
    document.body.classList.add('correct-answer');
    setTimeout(() => {
        document.body.classList.remove('correct-answer');
    }, 500);
}

function showNegativeFeedback() {
    document.body.classList.add('wrong-answer');
    setTimeout(() => {
        document.body.classList.remove('wrong-answer');
    }, 500);
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex >= 50) {
        if (currentDifficulty === 'easy') {
            currentDifficulty = 'medium';
            currentQuestionIndex = 0;
        } else if (currentDifficulty === 'medium') {
            currentDifficulty = 'hard';
            currentQuestionIndex = 0;
        } else {
            alert(`축하합니다! 모든 문제를 맞추셨습니다. 최종 점수: ${score}`);
            resetGame();
            return;
        }
    }
    displayQuestion();
    updateScore();
}

function resetGame() {
    currentDifficulty = 'easy';
    currentQuestionIndex = 0;
    score = 0;
    hintsRemaining = 10;
    hintCountEl.textContent = hintsRemaining;
    for (let diff in questions) {
        shuffleArray(questions[diff]);
    }
    displayQuestion();
    updateScore();
    showToast('게임이 리셋되었습니다. 다시 시작합니다!');
}

function updateProgressBar() {
    const totalQuestions = 150;
    const questionsSolved = getOverallQuestionNumber() - 1;
    const progress = (questionsSolved / totalQuestions) * 100;
    progressBar.style.width = `${progress}%`;
}

function checkBossQuestion() {
    isBossQuestion = (getOverallQuestionNumber() % 50 === 0);
    document.body.classList.toggle('boss-mode', isBossQuestion);
    mainTitleEl.classList.toggle('shake', isBossQuestion);
}

function updateScore() {
    scoreEl.textContent = score;
}

function updateDifficultyDisplay() {
    difficultyEl.textContent = currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1);
}

function getEncPo(){
    return document.querySelector('.enc-po[name="po1"]').value + document.querySelector('.enc-po[name="po2"]').value + document.querySelector('.enc-po[name="po3"]').value;
}

// 암호화 함수
function fnEnc(data, secretKey) {
    return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
}

// 복호화 함수
function fnDec(encryptedData, secretKey) {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

function toggleMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    
    if (sidebar.style.width === '250px') {
        sidebar.style.width = '0';
        overlay.classList.remove('active');
    } else {
        sidebar.style.width = '250px';
        overlay.classList.add('active');
    }
}

function getToggleMenu() {
    //const docFrag = document.createDocumentFragment();
    const tempEl = document.createElement("div");
    tempEl.id = `toggle-menu`;
    tempEl.innerHTML = `<header>
                        <div class="menu-icon" onclick="toggleMenu()">&#9776;</div>
                        </header>
                        <div id="overlay" onclick="toggleMenu()"></div>
                        <nav id="sidebar">
                        <ul>
                            <li><a href="/">🥔</a></li>
                            <li><a href="/oracle-sql/">ORACLE SQL</a></li>
                            <li><a href="/adsp/">ADSP</a></li>
                        </ul>
                        </nav>`;

    document.body.appendChild(tempEl);
}

function getToast(){
    const tempEl = document.createElement("div");
    tempEl.innerHTML = `<div id="toast" class="toast"></div>
                    <div id="result" class="result"></div>`;
    document.body.appendChild(tempEl);
}

// function setDisplay(){
//     document.body.classList.remove("hide");
// }

getToggleMenu();
getToast();
// setTimeout(()=>{
//     setDisplay();
// },500);