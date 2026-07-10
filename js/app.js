let questions = [];
let currentQuestion = 0;
let userAnswers = {};
let examFinished = false;

async function loadQuestions() {
    try {
        const response = await fetch("./data/questions.json");
        if (!response.ok) {
            throw new Error("Failed to load questions");
        }
        questions = await response.json();
        console.log("Questions Loaded:", questions.length);
        buildPalette();
        showQuestion();
        updateStats();
        startTimer();
    } catch (error) {
        console.error(error);
        const main = document.querySelector(".main-content");
        if (main) {
            main.innerHTML = `
                <div class="question-card">
                    <div class="question-body">
                        <h2>فشل تحميل الأسئلة</h2>
                        <p>Failed to load questions</p>
                    </div>
                </div>
            `;
        }
    }
}

function buildPalette() {
    const palette = document.getElementById("questionPalette");
    if (!palette) return;
    palette.innerHTML = "";
    questions.forEach((q, idx) => {
        const btn = document.createElement("button");
        btn.textContent = idx + 1;
        btn.setAttribute("data-index", idx);
        btn.addEventListener("click", () => goToQuestion(idx));
        palette.appendChild(btn);
    });
    const totalQ = document.getElementById("totalQ");
    if (totalQ) totalQ.textContent = questions.length;
}

function updatePalette() {
    const buttons = document.querySelectorAll("#questionPalette button");
    buttons.forEach((btn, idx) => {
        btn.classList.remove("current", "correct", "wrong", "unanswered");
        if (idx === currentQuestion) {
            btn.classList.add("current");
        } else if (userAnswers[idx] !== undefined) {
            btn.classList.add(userAnswers[idx] === questions[idx].correctAnswer ? "correct" : "wrong");
        } else {
            btn.classList.add("unanswered");
        }
    });
    const currentQEl = document.getElementById("currentQ");
    if (currentQEl) currentQEl.textContent = currentQuestion + 1;
}

function showQuestion() {
    if (!questions.length) return;
    const question = questions[currentQuestion];

    document.getElementById("questionArabic").textContent = question.arabic;
    document.getElementById("questionEnglish").textContent = question.english;
    document.getElementById("questionNumber").textContent = `السؤال ${currentQuestion + 1} من ${questions.length}`;
    document.getElementById("currentQuestion").textContent = currentQuestion + 1;
    document.getElementById("totalQuestions").textContent = questions.length;

    const answerCards = document.querySelectorAll(".answer-card");
    answerCards.forEach(card => card.classList.remove("selected", "correct", "wrong"));

    const feedbackCard = document.getElementById("feedbackCard");
    feedbackCard.classList.add("hidden");
    feedbackCard.classList.remove("correct", "wrong");

    const badge = document.getElementById("questionBadge");
    badge.className = "question-badge unanswered";
    badge.textContent = "بدون إجابة";

    if (userAnswers[currentQuestion] !== undefined) {
        const selected = document.querySelector(`.answer-card[data-answer="${userAnswers[currentQuestion]}"]`);
        if (selected) selected.classList.add("selected");
        showFeedback(question, userAnswers[currentQuestion]);
    }

    updateStats();
    updatePalette();
    updateNavigation();
}

function showFeedback(question, answer) {
    const feedbackCard = document.getElementById("feedbackCard");
    const feedbackTitle = document.getElementById("feedbackTitle");
    const correctAnswerSpan = document.getElementById("correctAnswer");
    const explanation = document.getElementById("explanation");
    const reference = document.getElementById("reference");
    const badge = document.getElementById("questionBadge");

    feedbackCard.classList.remove("hidden");
    feedbackCard.classList.remove("correct", "wrong");

    if (answer === question.correctAnswer) {
        feedbackCard.classList.add("correct");
        feedbackTitle.textContent = "إجابة صحيحة";
        document.querySelector(".feedback-header i").className = "fa-solid fa-circle-check";
        badge.className = "question-badge correct";
        badge.textContent = "صحيح";
    } else {
        feedbackCard.classList.add("wrong");
        feedbackTitle.textContent = "إجابة خاطئة";
        document.querySelector(".feedback-header i").className = "fa-solid fa-circle-xmark";
        badge.className = "question-badge wrong";
        badge.textContent = "خطأ";
    }

    correctAnswerSpan.textContent = question.correctAnswer ? "صحيح" : "خطأ";
    explanation.textContent = question.explanation;
    reference.textContent = `${question.reference.article} | ص. ${question.reference.page}`;
}

function selectAnswer(answer) {
    if (examFinished) return;
    if (userAnswers[currentQuestion] !== undefined) return;

    const question = questions[currentQuestion];
    userAnswers[currentQuestion] = answer;

    const answerCards = document.querySelectorAll(".answer-card");
    answerCards.forEach(card => {
        const val = card.getAttribute("data-answer") === "true";
        if (val === answer) {
            card.classList.add("selected");
            card.classList.add(answer === question.correctAnswer ? "correct" : "wrong");
        }
    });

    showFeedback(question, answer);
    updateStats();
    updatePalette();
}

function updateStats() {
    let correct = 0;
    let wrong = 0;
    questions.forEach((q, idx) => {
        if (userAnswers[idx] !== undefined) {
            if (userAnswers[idx] === q.correctAnswer) correct++;
            else wrong++;
        }
    });

    const answered = correct + wrong;
    const remaining = questions.length - answered;
    const percent = questions.length ? Math.round((answered / questions.length) * 100) : 0;

    const correctCountEl = document.getElementById("correctCount");
    const wrongCountEl = document.getElementById("wrongCount");
    const remainingCountEl = document.getElementById("remainingCount");
    const progressPercentEl = document.getElementById("progressPercent");
    const progressFillEl = document.querySelector(".progress-fill");

    if (correctCountEl) correctCountEl.textContent = correct;
    if (wrongCountEl) wrongCountEl.textContent = wrong;
    if (remainingCountEl) remainingCountEl.textContent = remaining;
    if (progressPercentEl) progressPercentEl.textContent = `${percent}%`;
    if (progressFillEl) progressFillEl.style.width = `${percent}%`;
}

function updateNavigation() {
    const prevBtn = document.getElementById("previousQuestion");
    const nextBtn = document.getElementById("nextQuestion");
    if (prevBtn) prevBtn.disabled = currentQuestion === 0;
    if (nextBtn) nextBtn.disabled = currentQuestion === questions.length - 1;
}

function goToQuestion(index) {
    if (index < 0 || index >= questions.length) return;
    currentQuestion = index;
    showQuestion();
}

function nextQuestion() {
    goToQuestion(currentQuestion + 1);
}

function previousQuestion() {
    goToQuestion(currentQuestion - 1);
}

function finishExam() {
    if (examFinished) return;
    examFinished = true;
    stopTimer();

    let correct = 0;
    let wrong = 0;
    questions.forEach((q, idx) => {
        if (userAnswers[idx] !== undefined) {
            if (userAnswers[idx] === q.correctAnswer) correct++;
            else wrong++;
        }
    });

    const total = questions.length;
    const percentage = Math.round((correct / total) * 100);

    const main = document.querySelector(".main-content");
    main.innerHTML = `
        <div class="question-card" style="text-align:center; padding:28px;">
            <h2 style="font-size:22px; margin-bottom:20px; color:var(--primary); font-weight:800;">انتهى الامتحان</h2>
            <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap; margin-bottom:20px;">
                <div class="stat success" style="flex:1; min-width:100px; padding:14px;">
                    <i class="fa-solid fa-circle-check"></i>
                    <span>صحيحة</span>
                    <h3>${correct}</h3>
                </div>
                <div class="stat danger" style="flex:1; min-width:100px; padding:14px;">
                    <i class="fa-solid fa-circle-xmark"></i>
                    <span>خاطئة</span>
                    <h3>${wrong}</h3>
                </div>
                <div class="stat warning" style="flex:1; min-width:100px; padding:14px;">
                    <i class="fa-solid fa-circle"></i>
                    <span>النسبة</span>
                    <h3>${percentage}%</h3>
                </div>
            </div>
            <p style="margin-bottom:20px; font-size:15px; color:var(--gray500);">
                ${percentage >= 60 ? "أحسنت! لقد نجحت في الامتحان." : "للأسف، لم تحقق النجاح. حاول مرة أخرى."}
            </p>
            <button id="restartExam" style="background:var(--primary); color:#fff; padding:12px 24px; border-radius:10px; font-size:14px; font-weight:700; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:all .3s ease; box-shadow: 0 2px 8px rgba(15,23,42,.08);">
                <i class="fa-solid fa-rotate-right"></i>
                إعادة الامتحان
            </button>
        </div>
    `;

    document.getElementById("finishExam").style.display = "none";

    document.getElementById("restartExam").addEventListener("click", restartExam);
}

function restartExam() {
    window.location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
    const yearEl = document.getElementById("currentYear");
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    document.querySelectorAll(".answer-card").forEach(card => {
        card.addEventListener("click", () => {
            const answer = card.getAttribute("data-answer") === "true";
            selectAnswer(answer);
        });
    });

    const prevBtn = document.getElementById("previousQuestion");
    const nextBtn = document.getElementById("nextQuestion");
    const finishBtn = document.getElementById("finishExam");

    if (prevBtn) prevBtn.addEventListener("click", previousQuestion);
    if (nextBtn) nextBtn.addEventListener("click", nextQuestion);
    if (finishBtn) finishBtn.addEventListener("click", finishExam);
});

loadQuestions();
