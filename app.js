import words from "./words.js"

const keyboardButtonEls = document.querySelectorAll(".key")
const tipEl = document.querySelector(".tip")
const profileIconEl = document.querySelector(".profile-icon")
const profileModalEl = document.querySelector(".profile-modal")
const profileModalCloseEl = document.querySelector(
  ".profile-modal > .profile-modal-content .close-btn"
)

const TOTAL_WORDS = 6
const TOTAL_LETTERS = 5
const ALPHABETS = "abcdefghijklmnopqrstuvwxyz"
const INIT_BOARD = [[], [], [], [], [], []]
const START_DATE_VALUE = 693501 // Got this by new Date("1900").getDate() + new Date("1900").getMonth() * 12 + new Date("1900").getFullYear() * 365

const game = JSON.parse(localStorage.getItem("game"))
const profile = JSON.parse(localStorage.getItem("profile"))
const date = new Date()
const dateValue =
  date.getDate() + date.getMonth() * 12 + date.getFullYear() * 365
const wordIndex = (dateValue - START_DATE_VALUE) % words.length
const word = words[wordIndex]

let win = game?.win || false
let currentWord = game?.currentWord || 1
let currentLetter = game?.currentLetter || 1
let board = game?.board || INIT_BOARD
let tipClearTimeout = null
let wordi = game?.wordi || wordIndex
let gamesPlayed = profile?.gamesPlayed || 0
let gamesWon = profile?.gamesWon || 0

const saveGame = () =>
  localStorage.setItem(
    "game",
    JSON.stringify({
      board,
      currentWord,
      currentLetter,
      wordi,
      win,
    })
  )

const stopGame = () => {
  document.removeEventListener("keydown", handleKeydown)

  keyboardButtonEls.forEach(elem => {
    elem.disabled = true
    elem.removeEventListener("click", handleKeyPresss)
  })
}

const startGame = () => {
  if (wordIndex !== wordi) {
    win = false
    wordi = wordIndex
    board = INIT_BOARD
    currentLetter = 1
    currentWord = 1

    saveGame()
  }

  if (win || currentWord > TOTAL_WORDS) {
    stopGame()
    looseGame()
    setTimeout(toggleModal, 750)
    return
  }

  document.addEventListener("keydown", handleKeydown)

  keyboardButtonEls.forEach(elem =>
    elem.addEventListener("click", handleKeyPresss)
  )
}

const showTip = text => {
  clearTimeout(tipClearTimeout)
  tipEl.textContent = text
  tipEl.classList.toggle("show", true)
  tipClearTimeout = setTimeout(
    () => tipEl.classList.toggle("show", false),
    1500
  )
}

const isCorrectWord = word => {
  let isCorrect = word.length !== 0

  word.forEach(l => {
    if (isCorrect) isCorrect = l.inCorrectPosition === true
  })

  return isCorrect
}

const updateContents = () => {
  board.forEach((word, wi) => {
    const letterEls = document.querySelectorAll(
      `.words .word:nth-child(${wi + 1}) .letter`
    )
    letterEls.forEach((letterEl, i) => {
      const letter = board[wi][i]

      if (letter == null) {
        letterEl.classList.remove("letter-perfect-animation")
        letterEl.classList.remove("letter-correct-animation")
        letterEl.classList.remove("letter-wrong-animation")
        letterEl.textContent = ""
        return
      }

      const delay = parseFloat(
        getComputedStyle(letterEl).getPropertyValue("--delay")
      )

      const addAnimation = () => {
        letterEl.style.animationName = null
        setTimeout(() => (letterEl.style.animationName = "letter-animation"), 1)
      }

      if (letterEl.textContent.trim() === "") addAnimation()

      letterEl.textContent = letter?.letter || ""

      if (letter.exists != null) {
        const letterKeyEl = document.querySelector(
          `[data-key=${letter.letter}]`
        )

        if (
          letterEl.classList.contains("letter-perfect-animation") ||
          letterEl.classList.contains("letter-correct-animation") ||
          letterEl.classList.contains("letter-wrong-animation")
        )
          return
        letterEl.style.animationDelay = i * delay + "s"
        letterEl.style.transitionDelay = i * delay + "s"

        addAnimation()

        letterEl.classList.toggle(
          letter.inCorrectPosition
            ? "letter-perfect-animation"
            : letter.exists
            ? "letter-correct-animation"
            : "letter-wrong-animation",
          true
        )

        if (!letterKeyEl.classList.contains("perfect")) {
          if (letterKeyEl.classList.contains("correct")) return

          letterKeyEl.classList.toggle(
            letter.inCorrectPosition
              ? "perfect"
              : letter.exists
              ? "correct"
              : "wrong",
            true
          )
        }
      }
    })

    if (win) return
    if (isCorrectWord(word)) {
      !win && showTip("You got it!")
      stopGame()
      win = true
    }
  })

  saveGame()
}

const looseGame = () => {
  localStorage.setItem("profile", JSON.stringify({ gamesPlayed, gamesWon }))
  showTip(word)
}

const validateWord = () => {
  if (!words.includes(board[currentWord - 1].map(l => l.letter).join(""))) {
    showTip("Word is not in dictionary!")
    const wordEl = document.querySelector(
      `.words .word:nth-child(${currentWord})`
    )
    wordEl.style.animationName = null
    setTimeout(() => (wordEl.style.animationName = "wrong-word-animation"), 1)
    return
  }

  board[currentWord - 1].forEach((letter, i) => {
    let currentLetterCount = 0
    let currentLetterInAnswerCount = 0

    word.split("").forEach(l => l === letter.letter && currentLetterCount++)
    board[currentWord - 1].forEach((l, il) => {
      l.letter === letter.letter && il <= i && currentLetterInAnswerCount++
    })

    letter.exists =
      word.includes(letter.letter) &&
      currentLetterInAnswerCount <= currentLetterCount
    letter.inCorrectPosition = letter.exists && word[i] === letter.letter
  })

  if (isCorrectWord(board[currentWord - 1])) {
    gamesPlayed++
    gamesWon++
    win = true
    saveGame()
    localStorage.setItem("profile", JSON.stringify({ gamesPlayed, gamesWon }))
    stopGame()
    setTimeout(toggleModal, 750)
  }

  currentLetter = 1
  currentWord++

  updateContents()

  if (currentWord > TOTAL_WORDS) {
    gamesPlayed++
    stopGame()
    looseGame()
  }
}

const onKeyPress = value => {
  if (currentLetter > TOTAL_LETTERS || currentWord > TOTAL_WORDS) return

  currentLetter++
  board[currentWord - 1].push({ letter: value })
  updateContents()
}

const onEnter = () => {
  if (currentLetter <= TOTAL_LETTERS) return
  validateWord()
}

const onDelete = () => {
  if (currentWord > TOTAL_WORDS) return

  currentLetter = currentLetter === 1 ? 1 : currentLetter - 1
  board[currentWord - 1].pop()
  updateContents()

  saveGame()
}

const handleKeydown = e => {
  if (e.key === "Enter") return onEnter()
  if (e.key === "Backspace") return onDelete()
  if (ALPHABETS.split("").includes(e.key)) onKeyPress(e.key)
}

const handleKeyPresss = e => {
  if (e.target.dataset.enterKey != null) return onEnter()
  if (e.target.dataset.deleteKey != null) return onDelete()
  onKeyPress(e.target.dataset.key)
}

const toggleModal = () => {
  const show = !profileModalEl.classList.contains("show")
  profileModalEl.classList.toggle("show", show)

  if (show) {
    const winPercent = (gamesWon / gamesPlayed) * 100

    document.querySelector("[data-games-played]").textContent = gamesPlayed
    document.querySelector("[data-games-won]").textContent = gamesWon
    document.querySelector("[data-win-percentage]").textContent = isNaN(
      winPercent
    )
      ? "0%"
      : winPercent + "%"
  }
}

profileIconEl.addEventListener("click", toggleModal)
profileModalCloseEl.addEventListener("click", toggleModal)

startGame()
updateContents()
