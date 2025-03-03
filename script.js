// Game variables
let gameStarted = false
let gameOver = false
let score = 0
let combo = 1
let comboTimer = null
let energy = 100
let isJumping = false
let canDoubleJump = false
let isDoubleJumping = false
let hasDoubleJumpPowerup = false
let hasRageModePowerup = false
let hasShieldPowerup = false
let isRageModeActive = false
let isShieldActive = false
let gameSpeed = 5
let lastActionTime = 0
let successfulActions = 0
let backgroundHue = 240 // Start with blue

// DOM Elements
const hero = document.getElementById("hero")
const gameFloor = document.getElementById("game-floor")
const entitiesContainer = document.getElementById("entities-container")
const scoreElement = document.getElementById("score")
const comboTextElement = document.getElementById("combo-text")
const comboFillElement = document.getElementById("combo-fill")
const energyFillElement = document.getElementById("energy-fill")
const doubleJumpElement = document.getElementById("double-jump")
const rageModeElement = document.getElementById("rage-mode")
const shieldElement = document.getElementById("shield")
const tutorialElement = document.getElementById("tutorial")
const gameOverElement = document.getElementById("game-over")
const finalScoreElement = document.getElementById("final-score")
const retryButton = document.getElementById("retry-button")
const jumpButton = document.getElementById("jump-button")
const attackButton = document.getElementById("attack-button")
const background = document.querySelector(".background")

// Event Listeners
document.addEventListener("keydown", handleKeyDown)
jumpButton.addEventListener("touchstart", handleJump)
jumpButton.addEventListener("mousedown", handleJump)
attackButton.addEventListener("touchstart", handleAttack)
attackButton.addEventListener("mousedown", handleAttack)
tutorialElement.addEventListener("click", startGame)
retryButton.addEventListener("click", resetGame)

// Initialize the game
function init() {
  // Set initial game state
  updateScore(0)
  updateCombo(1)
  updateEnergy(100)

  // Start animation loop
  requestAnimationFrame(gameLoop)
}

// Game Loop
function gameLoop(timestamp) {
  if (!gameStarted) {
    requestAnimationFrame(gameLoop)
    return
  }

  if (!gameOver) {
    // Update game speed based on score
    gameSpeed = 5 + Math.floor(score / 500)

    // Move entities
    moveEntities()

    // Check collisions
    checkCollisions()

    // Spawn entities randomly
    if (Math.random() < 0.02) {
      spawnEntity()
    }

    // Regenerate energy if not in rage mode
    if (!isRageModeActive && timestamp - lastActionTime > 1000) {
      updateEnergy(Math.min(energy + 0.2, 100))
    }

    // Update background based on score
    updateBackground()

    // Check for power-ups
    if (successfulActions >= 10) {
      successfulActions = 0
      spawnPowerup()
    }
  }

  requestAnimationFrame(gameLoop)
}

// Handle keyboard input
function handleKeyDown(e) {
  if (gameOver) return

  if (gameStarted) {
    if (e.key === "a" || e.key === "A") {
      handleJump()
    } else if (e.key === "d" || e.key === "D") {
      handleAttack()
    }
  } else if (e.key === " ") {
    startGame()
  }
}

// Start the game
function startGame() {
  gameStarted = true
  tutorialElement.style.display = "none"
}

// Handle jump action
function handleJump() {
  if (!gameStarted || gameOver) return

  if (!isJumping) {
    isJumping = true
    hero.classList.add("jumping")

    // Restore some energy when jumping
    updateEnergy(Math.min(energy + 10, 100))

    // Reset combo timer
    resetComboTimer()

    setTimeout(() => {
      hero.classList.remove("jumping")
      isJumping = false

      // Enable double jump if we have the powerup
      if (hasDoubleJumpPowerup) {
        canDoubleJump = true
        setTimeout(() => {
          canDoubleJump = false
        }, 500)
      }
    }, 500)

    lastActionTime = Date.now()
  } else if (canDoubleJump && !isDoubleJumping) {
    isDoubleJumping = true

    // Apply a second jump
    hero.style.animation = "none"
    setTimeout(() => {
      hero.style.animation = "jump 0.5s ease"

      setTimeout(() => {
        isDoubleJumping = false
      }, 500)
    }, 10)

    // Use up the double jump powerup
    hasDoubleJumpPowerup = false
    doubleJumpElement.classList.remove("active")
  }
}

// Handle attack action
function handleAttack() {
  if (!gameStarted || gameOver) return

  // Check if we have enough energy to attack
  if (energy > 0 || isRageModeActive) {
    // Perform attack animation
    hero.classList.add("attacking")

    // Drain energy if not in rage mode
    if (!isRageModeActive) {
      updateEnergy(energy - 10)
    }

    // Check if we hit any enemies
    const enemies = document.querySelectorAll(".enemy")
    let hitEnemy = false

    enemies.forEach((enemy) => {
      const enemyRect = enemy.getBoundingClientRect()
      const heroRect = hero.getBoundingClientRect()

      // Check if enemy is in attack range
      if (
        enemyRect.left < heroRect.right + 80 &&
        enemyRect.right > heroRect.right &&
        enemyRect.top < heroRect.bottom &&
        enemyRect.bottom > heroRect.top
      ) {
        // Hit enemy
        hitEnemy = true
        destroyEnemy(enemy)

        // Increase score based on combo
        updateScore(score + 10 * combo)

        // Increase combo
        updateCombo(combo + 1)

        // Reset combo timer
        resetComboTimer()

        // Track successful action
        successfulActions++
      }
    })

    // If we didn't hit any enemies, reset combo
    if (!hitEnemy && enemies.length > 0) {
      updateCombo(1)
    }

    // Remove attack animation after a short delay
    setTimeout(() => {
      hero.classList.remove("attacking")
    }, 200)

    lastActionTime = Date.now()
  }
}

// Spawn an entity (obstacle or enemy)
function spawnEntity() {
  // Decide whether to spawn an obstacle or enemy
  const isObstacle = Math.random() < 0.4

  if (isObstacle) {
    spawnObstacle()
  } else {
    spawnEnemy()
  }
}

// Spawn an obstacle
function spawnObstacle() {
  const obstacle = document.createElement("div")
  obstacle.className = "obstacle"

  // Randomly choose obstacle type
  if (Math.random() < 0.5) {
    obstacle.classList.add("spike")
  } else {
    obstacle.classList.add("fire")
  }

  entitiesContainer.appendChild(obstacle)

  // Position the obstacle off-screen to the right
  obstacle.style.right = "-50px"
}

// Spawn an enemy
function spawnEnemy() {
  const enemy = document.createElement("div")
  enemy.className = "enemy"

  // Randomly choose enemy type
  const enemyType = Math.random()
  if (enemyType < 0.5) {
    enemy.classList.add("goblin")
  } else if (enemyType < 0.8) {
    enemy.classList.add("robot")
  } else {
    enemy.classList.add("dragon")
  }

  // Create enemy body
  const enemyBody = document.createElement("div")
  enemyBody.className = "enemy-body"
  enemy.appendChild(enemyBody)

  entitiesContainer.appendChild(enemy)

  // Position the enemy off-screen to the right
  enemy.style.right = "-50px"
}

// Move all entities
function moveEntities() {
  const entities = document.querySelectorAll(".obstacle, .enemy")

  entities.forEach((entity) => {
    const currentRight = Number.parseFloat(entity.style.right)
    entity.style.right = currentRight + gameSpeed + "px"

    // Remove entities that have moved off-screen to the left
    if (currentRight > window.innerWidth + 100) {
      entity.remove()

      // If it was an enemy that we missed, reset combo
      if (entity.classList.contains("enemy")) {
        updateCombo(1)
      }
    }
  })
}

// Check for collisions
function checkCollisions() {
  if (isJumping) return // No collisions while jumping

  const heroRect = hero.getBoundingClientRect()
  const obstacles = document.querySelectorAll(".obstacle")
  const enemies = document.querySelectorAll(".enemy")

  // Check obstacle collisions
  obstacles.forEach((obstacle) => {
    const obstacleRect = obstacle.getBoundingClientRect()

    if (
      heroRect.right > obstacleRect.left &&
      heroRect.left < obstacleRect.right &&
      heroRect.bottom > obstacleRect.top &&
      heroRect.top < obstacleRect.bottom
    ) {
      // Collision with obstacle
      if (isShieldActive) {
        // Use shield to block damage
        isShieldActive = false
        hero.classList.remove("shield-active")
        shieldElement.classList.remove("active")

        // Destroy the obstacle
        obstacle.remove()
      } else {
        endGame()
      }
    }
  })

  // Check enemy collisions
  enemies.forEach((enemy) => {
    const enemyRect = enemy.getBoundingClientRect()

    if (
      heroRect.right > enemyRect.left &&
      heroRect.left < enemyRect.right &&
      heroRect.bottom > enemyRect.top &&
      heroRect.top < enemyRect.bottom
    ) {
      // Collision with enemy
      if (isShieldActive) {
        // Use shield to block damage
        isShieldActive = false
        hero.classList.remove("shield-active")
        shieldElement.classList.remove("active")

        // Destroy the enemy
        destroyEnemy(enemy)
      } else {
        endGame()
      }
    }
  })
}

// Destroy an enemy with explosion effect
function destroyEnemy(enemy) {
  const enemyRect = enemy.getBoundingClientRect()

  // Create explosion effect
  const explosion = document.createElement("div")
  explosion.className = "explosion"
  explosion.style.left = enemyRect.left + enemyRect.width / 2 - 40 + "px"
  explosion.style.top = enemyRect.top + enemyRect.height / 2 - 40 + "px"
  document.body.appendChild(explosion)

  // Remove explosion after animation completes
  setTimeout(() => {
    explosion.remove()
  }, 300)

  // Remove the enemy
  enemy.remove()
}

// Spawn a random power-up
function spawnPowerup() {
  const powerupType = Math.floor(Math.random() * 3)

  switch (powerupType) {
    case 0:
      // Double Jump
      hasDoubleJumpPowerup = true
      doubleJumpElement.classList.add("active")
      break
    case 1:
      // Rage Mode
      hasRageModePowerup = true
      rageModeElement.classList.add("active")
      break
    case 2:
      // Shield
      hasShieldPowerup = true
      shieldElement.classList.add("active")
      break
  }
}

// Activate Rage Mode
function activateRageMode() {
  if (hasRageModePowerup) {
    isRageModeActive = true
    hasRageModePowerup = false
    rageModeElement.classList.remove("active")
    hero.classList.add("rage-mode")

    // Rage mode lasts for 5 seconds
    setTimeout(() => {
      isRageModeActive = false
      hero.classList.remove("rage-mode")
    }, 5000)
  }
}

// Activate Shield
function activateShield() {
  if (hasShieldPowerup) {
    isShieldActive = true
    hasShieldPowerup = false
    shieldElement.classList.remove("active")
    hero.classList.add("shield-active")
  }
}

// Update the score
function updateScore(newScore) {
  score = newScore
  scoreElement.textContent = score
}

// Update the combo
function updateCombo(newCombo) {
  combo = newCombo
  comboTextElement.textContent = `Combo: x${combo}`

  // Update combo meter
  const comboPercentage = Math.min((combo - 1) * 20, 100)
  comboFillElement.style.width = `${comboPercentage}%`

  // Reset combo timer
  resetComboTimer()
}

// Reset the combo timer
function resetComboTimer() {
  clearTimeout(comboTimer)
  comboTimer = setTimeout(() => {
    updateCombo(1)
  }, 3000)
}

// Update the energy bar
function updateEnergy(newEnergy) {
  energy = newEnergy
  energyFillElement.style.width = `${energy}%`

  // Check if we're out of energy
  if (energy <= 0 && !isRageModeActive) {
    endGame()
  }
}

// Update background color based on score
function updateBackground() {
  // Shift hue based on score
  backgroundHue = (240 + Math.floor(score / 100)) % 360

  // Adjust saturation based on combo
  const saturation = 70 + Math.min(combo * 2, 30)

  // Set background gradient
  background.style.background = `
        linear-gradient(to bottom, 
        hsl(${backgroundHue}, ${saturation}%, 30%), 
        hsl(${(backgroundHue + 60) % 360}, ${saturation}%, 50%), 
        hsl(${(backgroundHue + 120) % 360}, ${saturation}%, 60%))
    `
}

// End the game
function endGame() {
  gameOver = true

  // Show game over screen with animation
  gameOverElement.classList.add("active")
  finalScoreElement.textContent = score

  // Apply slow-motion effect
  document.body.style.transition = "all 0.5s ease"
  document.body.style.filter = "grayscale(80%) blur(2px)"
}

// Reset the game
function resetGame() {
  // Reset game state
  gameOver = false
  score = 0
  combo = 1
  energy = 100
  isJumping = false
  canDoubleJump = false
  isDoubleJumping = false
  hasDoubleJumpPowerup = false
  hasRageModePowerup = false
  hasShieldPowerup = false
  isRageModeActive = false
  isShieldActive = false
  gameSpeed = 5
  successfulActions = 0
  backgroundHue = 240

  // Reset UI
  updateScore(0)
  updateCombo(1)
  updateEnergy(100)

  // Remove all entities
  entitiesContainer.innerHTML = ""

  // Reset hero state
  hero.className = "hero"

  // Hide game over screen
  gameOverElement.classList.remove("active")

  // Reset body styles
  document.body.style.filter = "none"

  // Reset powerups
  doubleJumpElement.classList.remove("active")
  rageModeElement.classList.remove("active")
  shieldElement.classList.remove("active")
}

// Key event handlers for powerups
document.addEventListener("keydown", (e) => {
  if (!gameStarted || gameOver) return

  // Number keys 1-3 activate powerups
  if (e.key === "1" && hasDoubleJumpPowerup) {
    // Double jump is activated automatically when jumping twice
  } else if (e.key === "2" && hasRageModePowerup) {
    activateRageMode()
  } else if (e.key === "3" && hasShieldPowerup) {
    activateShield()
  }
})

// Touch event handlers for powerups
doubleJumpElement.addEventListener("click", () => {
  // Double jump is activated automatically when jumping twice
})

rageModeElement.addEventListener("click", () => {
  if (gameStarted && !gameOver) {
    activateRageMode()
  }
})

shieldElement.addEventListener("click", () => {
  if (gameStarted && !gameOver) {
    activateShield()
  }
})

// Initialize the game
init()

