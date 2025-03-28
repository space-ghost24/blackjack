let deckId = '';
let playerHand = [];
let dealerHand = [];
let isGameOver = false;

// Fetch a new deck on page load
fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
    .then(res => res.json())
    .then(data => {
      console.log(data);
      deckId = data.deck_id;
    })
    .catch(err => console.log(`Error: ${err}`));

document.getElementById('deal').addEventListener('click', startGame);
document.getElementById('hit').addEventListener('click', hit);
document.getElementById('stand').addEventListener('click', stand);

function startGame() {
    if (!deckId) return;
    
    isGameOver = false;
    playerHand = [];
    dealerHand = [];
    document.getElementById('result').textContent = '';

    clearCards('player-cards');
    clearCards('dealer-cards');
    
    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=4`)
        .then(res => res.json())
        .then(data => {
            let cards = data.cards;
            playerHand = [cards[0], cards[2]];
            dealerHand = [cards[1], cards[3]];

            updateUI();
            checkForBlackjack();

            document.getElementById('hit').disabled = false;
            document.getElementById('stand').disabled = false;
        })
        .catch(err => console.log(`Error: ${err}`));
}

function hit() {
    if (isGameOver) return;

    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)
        .then(res => res.json())
        .then(data => {
            playerHand.push(data.cards[0]);
            updateUI();

            if (calculateScore(playerHand) > 21) {
                endGame('Player busts! Dealer wins.');
            }
        })
        .catch(err => console.log(`Error: ${err}`));
}

function stand() {
    if (isGameOver) return;
    isGameOver = true;

    document.getElementById('hit').disabled = true;
    document.getElementById('stand').disabled = true;

    dealerTurn();
}

function dealerTurn() {
    let dealerScore = calculateScore(dealerHand);

    if (dealerScore >= 17) {
        determineWinner();
        return;
    }

    fetch(`https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`)
        .then(res => res.json())
        .then(data => {
            dealerHand.push(data.cards[0]);
            updateUI();

            if (calculateScore(dealerHand) > 21) {
                endGame('Dealer busts! Player wins.');
            } else {
                dealerTurn();
            }
        })
        .catch(err => console.log(`Error: ${err}`));
}

function updateUI() {
    clearCards('player-cards');
    clearCards('dealer-cards');

    displayCards('player-cards', playerHand);
    displayCards('dealer-cards', dealerHand);

    document.getElementById('player-score').textContent = `Score: ${calculateScore(playerHand)}`;
    document.getElementById('dealer-score').textContent = `Score: ${calculateScore(dealerHand)}`;
}

function displayCards(elementId, hand) {
    const container = document.getElementById(elementId);
    
    hand.forEach(card => {
        const cardImg = document.createElement('img');
        cardImg.src = card.image;
        cardImg.alt = card.code;
        cardImg.width = 100;
        cardImg.height = 145;
        cardImg.style.borderRadius = "5px";
        
        container.appendChild(cardImg);
    });
}

function clearCards(elementId) {
    const container = document.getElementById(elementId);
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
}

function calculateScore(hand) {
    let score = 0;
    let aceCount = 0;

    hand.forEach(card => {
        let value = card.value;
        if (['KING', 'QUEEN', 'JACK'].includes(value)) {
            score += 10;
        } else if (value === 'ACE') {
            aceCount += 1;
            score += 11; 
        } else {
            score += parseInt(value);
        }
    });

    while (score > 21 && aceCount > 0) {
        score -= 10;
        aceCount -= 1;
    }

    return score;
}

function checkForBlackjack() {
    let playerScore = calculateScore(playerHand);
    let dealerScore = calculateScore(dealerHand);

    if (playerScore === 21 && dealerScore === 21) {
        endGame("It's a tie! Both have Blackjack.");
    } else if (playerScore === 21) {
        endGame("Blackjack! Player wins!");
    } else if (dealerScore === 21) {
        endGame("Dealer has Blackjack! Dealer wins.");
    }
}

function determineWinner() {
    let playerScore = calculateScore(playerHand);
    let dealerScore = calculateScore(dealerHand);

    if (dealerScore > 21 || playerScore > dealerScore) {
        endGame("Player wins!");
    } else if (playerScore < dealerScore) {
        endGame("Dealer wins!");
    } else {
        endGame("It's a tie!");
    }
}

function endGame(message) {
    isGameOver = true;
    document.getElementById('result').textContent = message;
    document.getElementById('hit').disabled = true;
    document.getElementById('stand').disabled = true;
}