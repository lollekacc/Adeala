// quiz.js — shared logic for quiz pages

// Save quiz answers and go to offers page
function saveQuizResults(results) {
  localStorage.setItem("quizResults", JSON.stringify(results));
  window.location.href = "erbjudande.html";
}

// Example usage in quiz pages:
// saveQuizResults({ category: "mobil", dataNeed: "high", familySize: 1, maxPrice: 399 });
