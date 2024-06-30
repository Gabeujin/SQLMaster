let questions = {
    easy: [],
    medium: [],
    hard: []
};
let currentQuestionIndex = 0;
let score = 0;
let hintsRemaining = 10;
let isBossQuestion = false;
let currentDifficulty = 'easy';

const mainTitleEl = document.querySelector('.container>h1');
const questionEl = document.getElementById('question');
const optionsEl = document.getElementById('options');
const submitBtn = document.getElementById('submitBtn');
const hintBtn = document.getElementById('hintBtn');
const hintContainer = document.getElementById('hintContainer');
const hintCountEl = document.getElementById('hintCount');
const progressBar = document.querySelector('.progress');
const scoreEl = document.getElementById('score');
const difficultyEl = document.getElementById('difficulty');

async function fetchQuestions() {
    try {
        const difficulties = ['easy', 'medium', 'hard'];
        for (let diff of difficulties) {
            const response = await fetch(`oracle-sql-quiz-${diff}.json`);
            questions[diff] = await response.json();
            shuffleArray(questions[diff]);
        }
        displayQuestion();
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
    }, 2000);
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
            hintContainer.textContent = `힌트: ${question.hint}`;
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
    if(question.options[question.correctAnswer] === selectedOption.innerText) {
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

submitBtn.addEventListener('click', checkAnswer);
hintBtn.addEventListener('click', showHint);

fetchQuestions();