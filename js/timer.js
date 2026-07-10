// ===============================
// Timer Configuration
// ===============================

const EXAM_DURATION = 60 * 60; // 60 Minutes

let timeRemaining = EXAM_DURATION;

let timerInterval = null;


// ===============================
// Start Timer
// ===============================

function startTimer() {

    updateTimerDisplay();

    timerInterval = setInterval(() => {

        timeRemaining--;

        updateTimerDisplay();

        if (timeRemaining <= 0) {

            clearInterval(timerInterval);

            alert("انتهى وقت الامتحان");

            if (typeof finishExam === "function") {

                finishExam();

            }

        }

    }, 1000);

}


// ===============================
// Update UI
// ===============================

function updateTimerDisplay() {

    const hours = Math.floor(timeRemaining / 3600);

    const minutes = Math.floor((timeRemaining % 3600) / 60);

    const seconds = timeRemaining % 60;

    document.getElementById("timer").textContent =

        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}


// ===============================
// Stop Timer
// ===============================

function stopTimer() {

    clearInterval(timerInterval);

}


// ===============================
// Reset Timer
// ===============================

function resetTimer() {

    stopTimer();

    timeRemaining = EXAM_DURATION;

    updateTimerDisplay();

}

startTimer();