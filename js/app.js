let questions = [];
let currentQuestion = 0;
let userAnswers = {};
let examFinished = false;
let examMode = 'practice';
let timerInterval = null;
let timeRemaining = 900; // 15 minutes in seconds
let examStartedAt = null;

async function loadQuestions() {
    try {
        const response = await fetch("./data/questions.json");
        if (!response.ok) {
            throw new Error("Failed to load questions");
        }
        questions = await response.json();
        console.log("Questions Loaded:", questions.length);
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

function startExam(mode) {
    examMode = mode;
    document.getElementById('modeOverlay').style.display = 'none';
    document.getElementById('appContainer').style.display = 'flex';

    // Reset state
    currentQuestion = 0;
    userAnswers = {};
    examFinished = false;
    examStartedAt = new Date().toISOString();

    if (mode === 'real') {
        // Select 30 random questions from the pool
        const shuffled = [...questions];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        questions = shuffled.slice(0, 30);

        // Show timer
        document.getElementById('timerBox').classList.remove('hidden');
        document.getElementById('examModeLabel').textContent = 'امتحان فعلي';

        // Hide correct/wrong statistics during exam
        document.getElementById('correctStat').style.display = 'none';
        document.getElementById('wrongStat').style.display = 'none';

        // Start timer
        timeRemaining = 900;
        startTimer();
    } else {
        document.getElementById('examModeLabel').textContent = 'امتحان تجريبي';
        document.getElementById('timerBox').classList.add('hidden');

        // Show correct/wrong statistics
        document.getElementById('correctStat').style.display = 'flex';
        document.getElementById('wrongStat').style.display = 'flex';
    }

    buildPalette();
    showQuestion();
    updateStats();
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
        btn.classList.remove("current", "correct", "wrong", "unanswered", "answered");
        if (idx === currentQuestion) {
            btn.classList.add("current");
        } else if (userAnswers[idx] !== undefined) {
            if (examMode === 'practice') {
                btn.classList.add(userAnswers[idx] === questions[idx].correctAnswer ? "correct" : "wrong");
            } else {
                btn.classList.add("answered");
            }
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
        if (selected) {
            selected.classList.add("selected");
            if (examMode === 'practice') {
                selected.classList.add(userAnswers[currentQuestion] === question.correctAnswer ? "correct" : "wrong");
                showFeedback(question, userAnswers[currentQuestion]);
            }
        }
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
            if (examMode === 'practice') {
                card.classList.add(answer === question.correctAnswer ? "correct" : "wrong");
            }
        }
    });

    if (examMode === 'practice') {
        showFeedback(question, answer);
    }

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

function startTimer() {
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            finishExam();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    document.getElementById('timerDisplay').textContent =
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    const timerBox = document.getElementById('timerBox');
    if (timeRemaining <= 60) {
        timerBox.classList.add('timer-warning');
    } else {
        timerBox.classList.remove('timer-warning');
    }
}

function finishExam() {
    if (examFinished) return;
    examFinished = true;

    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }

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

    // ===== Send result to parent platform (if embedded in iframe) =====
    try {
        window.parent.postMessage({
            type: "EXAM_COMPLETE",
            score: correct,
            wrong: wrong,
            totalQuestions: total,
            percentage: percentage,
            passed: percentage >= 60,
            examType: "kata",
            examMode: examMode,
            startedAt: examStartedAt,
            completedAt: new Date().toISOString()
        }, "*");
    } catch (e) {
        // Silently fail if not in an iframe / cross-origin issue
        console.log("Exam result sent to parent platform.");
    }

    const main = document.querySelector(".main-content");
    main.innerHTML = `
        <div class="question-card" style="text-align:center; padding:28px;">
            <h2 style="font-size:22px; margin-bottom:20px; color:var(--card-foreground); font-weight:800;">انتهى الامتحان</h2>
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
            <p style="margin-bottom:20px; font-size:15px; color:var(--muted-foreground);">
                ${percentage >= 60 ? "أحسنت! لقد نجحت في الامتحان." : "للأسف، لم تحقق النجاح. حاول مرة أخرى."}
            </p>
            <button id="restartExam" style="background:var(--gold); color:#ffffff; padding:12px 24px; border-radius:var(--radius); font-size:14px; font-weight:700; border:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:all .3s ease; box-shadow:var(--shadow-gold);">
                <i class="fa-solid fa-rotate-right"></i>
                إعادة الامتحان
            </button>
        </div>
    `;

    document.getElementById("finishExam").style.display = "none";
    document.getElementById("timerBox").classList.add("hidden");
    document.getElementById("progressSection").style.display = "none";
    document.querySelector(".palette-section").style.display = "none";

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

    // ========== Keyboard Navigation (Arrow Keys) ==========
    document.addEventListener("keydown", (e) => {
        // Only navigate if the app container is visible (exam started)
        const appContainer = document.getElementById("appContainer");
        if (!appContainer || appContainer.style.display !== "flex") return;

        if (e.key === "ArrowRight" && !examFinished) {
            // Right arrow = next question (Arabic RTL)
            e.preventDefault();
            nextQuestion();
        } else if (e.key === "ArrowLeft" && !examFinished) {
            // Left arrow = previous question (Arabic RTL)
            e.preventDefault();
            previousQuestion();
        }
    });

    // ========== Touch Swipe Navigation (Mobile) ==========
    let touchStartX = 0;
    let touchEndX = 0;
    const swipeThreshold = 50; // minimum px distance for swipe

    const mainContent = document.querySelector(".main-content");
    if (mainContent) {
        mainContent.addEventListener("touchstart", (e) => {
            touchStartX = e.changedTouches[0].screenX;
        }, { passive: true });

        mainContent.addEventListener("touchend", (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        }, { passive: true });
    }

    function handleSwipe() {
        const appContainer = document.getElementById("appContainer");
        if (!appContainer || appContainer.style.display !== "flex") return;
        if (examFinished) return;

        const diff = touchStartX - touchEndX;
        const absDiff = Math.abs(diff);

        if (absDiff < swipeThreshold) return;

        if (diff > 0) {
            // Swipe left → next question (Arabic RTL)
            nextQuestion();
        } else {
            // Swipe right → previous question (Arabic RTL)
            previousQuestion();
        }
    }
});

loadQuestions();
