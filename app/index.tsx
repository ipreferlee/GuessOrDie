import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ImageBackground,
  SafeAreaView,
  Animated,
  Dimensions,
  Modal,
  StatusBar,
  BackHandler,
} from 'react-native';

// Screen dimensions
const { width, height } = Dimensions.get('window');

// Programming-related word categories with clues
const WORD_CATEGORIES = {
  easy: [
    { word: 'HTML', clue: 'Markup language for creating web pages' },
    { word: 'CSS', clue: 'Styling language for web design' },
    { word: 'JAVA', clue: 'Popular object-oriented programming language' },
    { word: 'CODE', clue: 'Instructions written for computers' },
    { word: 'BUG', clue: 'An error in a program' },
    { word: 'API', clue: 'Interface for software components to communicate' },
  ],
  medium: [
    { word: 'PYTHON', clue: 'Snake-named programming language known for readability' },
    { word: 'FUNCTION', clue: 'A reusable block of code that performs a specific task' },
    { word: 'BOOLEAN', clue: 'Data type with true or false values' },
    { word: 'VARIABLE', clue: 'Container for storing data values' },
    { word: 'DATABASE', clue: 'Organized collection of structured information' },
    { word: 'BACKEND', clue: 'Server-side of an application' },
  ],
  hard: [
    { word: 'ALGORITHM', clue: 'Step-by-step procedure for solving a problem' },
    { word: 'RECURSION', clue: 'When a function calls itself' },
    { word: 'TYPESCRIPT', clue: 'JavaScript with syntax for types' },
    { word: 'INHERITANCE', clue: 'OOP concept where a class can derive properties from another class' },
    { word: 'MIDDLEWARE', clue: 'Software that acts as a bridge between systems' },
    { word: 'ENCRYPTION', clue: 'Process of encoding information' },
  ],
};

// Game levels configuration
const GAME_LEVELS = [
  { id: 1, maxAttempts: 8, category: 'easy', pointsPerLetter: 10, bonusPoints: 50 },
  { id: 2, maxAttempts: 7, category: 'easy', pointsPerLetter: 15, bonusPoints: 75 },
  { id: 3, maxAttempts: 7, category: 'medium', pointsPerLetter: 20, bonusPoints: 100 },
  { id: 4, maxAttempts: 6, category: 'medium', pointsPerLetter: 25, bonusPoints: 125 },
  { id: 5, maxAttempts: 6, category: 'hard', pointsPerLetter: 30, bonusPoints: 150 },
  { id: 6, maxAttempts: 5, category: 'hard', pointsPerLetter: 40, bonusPoints: 200 },
];

// Create alphabet array
const ALPHABET = Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i));

// Game screens
type GameScreen = 'main' | 'game' | 'leaderboard' | 'settings';

const GuessOrDie = () => {
  // Screen state
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('main');
  
  // Game state
  const [currentLevel, setCurrentLevel] = useState(1);
  const [totalPoints, setTotalPoints] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [levelConfig, setLevelConfig] = useState(GAME_LEVELS[0]);
  const [wordObj, setWordObj] = useState<{ word: string; clue: string }>({ word: '', clue: '' });
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost' | 'paused'>('playing');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [shakingLetter, setShakingLetter] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  
  // Animations
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const deathAnimation = useRef(new Animated.Value(0)).current;
  const successAnimation = useRef(new Animated.Value(0)).current;
  const titleAnimation = useRef(new Animated.Value(0)).current;

  // Start the title animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(titleAnimation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(titleAnimation, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Handle back button
  useEffect(() => {
    const backAction = () => {
      if (currentScreen === 'game' && gameStatus === 'playing') {
        setIsPaused(true);
        return true;
      } else if (currentScreen !== 'main') {
        setCurrentScreen('main');
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [currentScreen, gameStatus]);

  // Start a new level
  const startLevel = () => {
    const config = GAME_LEVELS[currentLevel - 1];
    setLevelConfig(config);
    
    // Select random word from category
    const category = config.category as keyof typeof WORD_CATEGORIES;
    const words = WORD_CATEGORIES[category];
    const randomWordObj = words[Math.floor(Math.random() * words.length)];
    
    setWordObj(randomWordObj);
    setGuessedLetters([]);
    setAttempts(0);
    setGameStatus('playing');
    setFeedbackMessage(`Level ${currentLevel}: You have ${config.maxAttempts} attempts`);
    setIsPaused(false);
  };

  // Initialize game
  useEffect(() => {
    if (currentScreen === 'game') {
      startLevel();
    }
  }, [currentLevel, currentScreen]);

  // Check if player has won
  const hasWon = wordObj.word.split('').every(letter => guessedLetters.includes(letter));

  // Check if player has lost
  const hasLost = attempts >= levelConfig.maxAttempts;

  // Update game status when win/lose conditions are met
  useEffect(() => {
    if (hasWon && gameStatus === 'playing') {
      const bonusPoints = levelConfig.bonusPoints;
      const attemptsLeft = levelConfig.maxAttempts - attempts;
      const extraBonus = attemptsLeft * 10;
      const levelPoints = bonusPoints + extraBonus;
      
      setTotalPoints(prev => prev + levelPoints);
      setGameStatus('won');
      setFeedbackMessage(`Great job! +${levelPoints} points! 🎉`);
      
      // Update high score if needed
      if (totalPoints + levelPoints > highScore) {
        setHighScore(totalPoints + levelPoints);
      }
      
      // Play success animation
      Animated.timing(successAnimation, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        setTimeout(() => {
          successAnimation.setValue(0);
        }, 1000);
      });
    } else if (hasLost && gameStatus === 'playing') {
      setGameStatus('lost');
      setFeedbackMessage(`Oh no! The word was ${wordObj.word}. Try again?`);
      
      // Play death animation
      Animated.timing(deathAnimation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();
    }
  }, [hasWon, hasLost, gameStatus]);

  // Handle letter guess
  const handleLetterPress = (letter: string) => {
    if (gameStatus !== 'playing' || guessedLetters.includes(letter) || isPaused) {
      return;
    }

    const newGuessedLetters = [...guessedLetters, letter];
    setGuessedLetters(newGuessedLetters);

    if (!wordObj.word.includes(letter)) {
      // Wrong guess
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      setFeedbackMessage(`Wrong! ${levelConfig.maxAttempts - newAttempts} attempts left`);
      
      // Shake animation for wrong guess
      setShakingLetter(letter);
      shakeAnimation.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 10,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShakingLetter('');
      });
    } else {
      // Correct guess
      const matchingLetters = wordObj.word.split('').filter(char => char === letter).length;
      const pointsEarned = matchingLetters * levelConfig.pointsPerLetter;
      setTotalPoints(prev => prev + pointsEarned);
      setFeedbackMessage(`Good! +${pointsEarned} points`);
    }
  };

  // Move to next level
  const nextLevel = () => {
    if (currentLevel < GAME_LEVELS.length) {
      setCurrentLevel(prev => prev + 1);
    } else {
      // Game completed
      Alert.alert(
        "Congratulations!",
        `You've completed all levels with ${totalPoints} points!`,
        [{ text: "Start Over", onPress: () => {
          setCurrentLevel(1);
          setTotalPoints(0);
          setCurrentScreen('main');
        }}]
      );
    }
  };

  // Restart current level
  const restartLevel = () => {
    startLevel();
  };

  // Start a new game
  const startNewGame = () => {
    setCurrentLevel(1);
    setTotalPoints(0);
    setCurrentScreen('game');
  };

  // Pause game
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // Return to main menu
  const goToMainMenu = () => {
    setCurrentScreen('main');
  };

  // Resume game from pause
  const resumeGame = () => {
    setIsPaused(false);
  };

  // Render word with masked letters
  const renderWord = () => {
    return wordObj.word.split('').map((letter, index) => (
      <View key={index} style={styles.letterContainer}>
        <Text style={styles.letter}>
          {guessedLetters.includes(letter) ? letter : '_'}
        </Text>
      </View>
    ));
  };

  // Render keyboard
  const renderKeyboard = () => {
    return ALPHABET.map(letter => {
      const isGuessed = guessedLetters.includes(letter);
      const isCorrect = wordObj.word.includes(letter) && isGuessed;
      const isWrong = !wordObj.word.includes(letter) && isGuessed;
      
      const letterStyle = [
        styles.keyboardLetter,
        isCorrect && styles.correctLetter,
        isWrong && styles.wrongLetter,
      ];
      
      const letterAnimStyle = letter === shakingLetter ? {
        transform: [{ translateX: shakeAnimation }]
      } : {};
      
      return (
        <TouchableOpacity
          key={letter}
          style={styles.keyboardButton}
          onPress={() => handleLetterPress(letter)}
          disabled={isGuessed || gameStatus !== 'playing' || isPaused}
        >
          <Animated.Text style={[letterStyle, letterAnimStyle]}>
            {letter}
          </Animated.Text>
        </TouchableOpacity>
      );
    });
  };

  // Render hangman figure
  const renderHangman = () => {
    const maxParts = levelConfig.maxAttempts;
    const partsToShow = attempts;
    const percentage = (partsToShow / maxParts) * 100;
    
    return (
      <View style={styles.hangmanContainer}>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${percentage}%` }]} />
        </View>
        <Animated.View style={[
          styles.hangmanFigure,
          {
            transform: [
              { rotate: deathAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '90deg']
              })},
              { scale: deathAnimation.interpolate({
                inputRange: [0, 0.5, 1],
                outputRange: [1, 1.2, 1]
              })}
            ]
          }
        ]}>
          <Text style={styles.hangmanIcon}>
            {attempts === 0 ? '😀' : 
             attempts <= Math.floor(maxParts * 0.3) ? '🙂' :
             attempts <= Math.floor(maxParts * 0.6) ? '😐' :
             attempts <= Math.floor(maxParts * 0.8) ? '😟' :
             attempts < maxParts ? '😰' : '💀'}
          </Text>
        </Animated.View>
      </View>
    );
  };

  // Render game screen
  const renderGameScreen = () => {
    return (
      <View style={styles.gameContainer}>
        {/* Game header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.backButton} onPress={goToMainMenu}>
              <Text style={styles.backButtonText}>⬅ Menu</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.levelText}>Level: {currentLevel}</Text>
            <Text style={styles.pointsText}>Points: {totalPoints}</Text>
          </View>
        </View>
        
        {/* Hangman visualization */}
        {renderHangman()}
        
        {/* Word clue */}
        <View style={styles.clueContainer}>
          <Text style={styles.clueLabel}>Clue:</Text>
          <Text style={styles.clueText}>{wordObj.clue}</Text>
        </View>
        
        {/* Feedback message */}
        <Animated.Text 
          style={[
            styles.feedback,
            { 
              transform: [{ 
                scale: gameStatus === 'won' ? successAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.2, 1]
                }) : 1
              }] 
            }
          ]}
        >
          {feedbackMessage}
        </Animated.Text>
        
        {/* Word to guess */}
        <Animated.View 
          style={[
            styles.wordContainer,
            { 
              transform: [{ 
                scale: gameStatus === 'won' ? successAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.3, 1]
                }) : 1
              }] 
            }
          ]}
        >
          {renderWord()}
        </Animated.View>
        
        {/* Game controls */}
        <View style={styles.controlsContainer}>
          {gameStatus === 'playing' && !isPaused && (
            <TouchableOpacity style={styles.pauseButton} onPress={togglePause}>
              <Text style={styles.buttonText}>⏸️ Pause</Text>
            </TouchableOpacity>
          )}
          {gameStatus === 'playing' && (
            <TouchableOpacity style={styles.restartButton} onPress={restartLevel}>
              <Text style={styles.buttonText}>🔄 Restart</Text>
            </TouchableOpacity>
          )}
          {gameStatus === 'won' && (
            <TouchableOpacity style={styles.nextButton} onPress={nextLevel}>
              <Text style={styles.buttonText}>Next Level</Text>
            </TouchableOpacity>
          )}
          {gameStatus === 'lost' && (
            <TouchableOpacity style={styles.restartButton} onPress={restartLevel}>
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Keyboard */}
        <View style={styles.keyboard}>
          {renderKeyboard()}
        </View>
        
        {/* Pause Modal */}
        <Modal
          visible={isPaused}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsPaused(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Game Paused</Text>
              <TouchableOpacity style={styles.modalButton} onPress={resumeGame}>
                <Text style={styles.modalButtonText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={restartLevel}>
                <Text style={styles.modalButtonText}>Restart Level</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonDanger]} onPress={goToMainMenu}>
                <Text style={styles.modalButtonText}>Main Menu</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    );
  };

  // Render main menu screen
  const renderMainMenu = () => {
    return (
      <View style={styles.menuContainer}>
        <Animated.Text 
          style={[
            styles.gameTitle,
            {
              transform: [
                { scale: titleAnimation.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [1, 1.1, 1]
                })},
              ],
              textShadowColor: 'rgba(255, 0, 0, 0.8)',
              textShadowRadius: 10, // use a fixed value or remove it entirely

            }
          ]}
        >
          GuessOrDie
        </Animated.Text>
        <Text style={styles.tagline}>The Programming Word Challenge</Text>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.highScoreText}>High Score: {highScore}</Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton} onPress={startNewGame}>
          <Text style={styles.menuButtonText}>Start Game</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton} onPress={() => setCurrentScreen('leaderboard')}>
          <Text style={styles.menuButtonText}>Leaderboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuButton} onPress={() => setCurrentScreen('settings')}>
          <Text style={styles.menuButtonText}>Settings</Text>
        </TouchableOpacity>
        
        <Text style={styles.instructions}>
          Guess programming words letter by letter before the coder meets a deadly fate! 
          Each wrong guess brings you closer to doom!
        </Text>
      </View>
    );
  };

  // Render leaderboard screen (simplified for this demo)
  const renderLeaderboard = () => {
    return (
      <View style={styles.leaderboardContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')}>
            <Text style={styles.backButtonText}>⬅ Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Leaderboard</Text>
        </View>
        
        <View style={styles.leaderboardContent}>
          <Text style={styles.leaderboardTitle}>Top Scores</Text>
          <View style={styles.leaderboardRow}>
            <Text style={styles.leaderboardRank}>1.</Text>
            <Text style={styles.leaderboardName}>YOU</Text>
            <Text style={styles.leaderboardScore}>{highScore}</Text>
          </View>
          <View style={styles.leaderboardRow}>
            <Text style={styles.leaderboardRank}>2.</Text>
            <Text style={styles.leaderboardName}>CPU</Text>
            <Text style={styles.leaderboardScore}>850</Text>
          </View>
          <View style={styles.leaderboardRow}>
            <Text style={styles.leaderboardRank}>3.</Text>
            <Text style={styles.leaderboardName}>CPU</Text>
            <Text style={styles.leaderboardScore}>720</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render settings screen (simplified for this demo)
  const renderSettings = () => {
    return (
      <View style={styles.settingsContainer}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => setCurrentScreen('main')}>
            <Text style={styles.backButtonText}>⬅ Back</Text>
          </TouchableOpacity>
          <Text style={styles.screenTitle}>Settings</Text>
        </View>
        
        <View style={styles.settingsContent}>
          <Text style={styles.settingsTitle}>Game Settings</Text>
          <TouchableOpacity style={styles.settingsOption}>
            <Text style={styles.settingsOptionText}>Sound: ON</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsOption}>
            <Text style={styles.settingsOptionText}>Difficulty: Normal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsOption}>
            <Text style={styles.settingsOptionText}>Reset High Score</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsOption}>
            <Text style={styles.settingsOptionText}>Credits</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render current screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'main':
        return renderMainMenu();
      case 'game':
        return renderGameScreen();
      case 'leaderboard':
        return renderLeaderboard();
      case 'settings':
        return renderSettings();
      default:
        return renderMainMenu();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ImageBackground 
        source={{ uri: '/api/placeholder/400/800' }}
        style={styles.background}
        resizeMode="cover"
      >
        {renderCurrentScreen()}
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  gameContainer: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: 10,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    padding: 5,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  levelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  pointsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffcc00',
  },
  gameTitle: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#ff3333',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  tagline: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  hangmanContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  progressContainer: {
    width: '80%',
    height: 10,
    backgroundColor: '#333',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ff3333',
  },
  hangmanFigure: {
    marginTop: 5,
  },
  hangmanIcon: {
    fontSize: 50,
  },
  clueContainer: {
    width: '90%',
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
    marginVertical: 10,
  },
  clueLabel: {
    color: '#ffcc00',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  clueText: {
    color: '#fff',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  feedback: {
    fontSize: 16,
    textAlign: 'center',
    color: '#fff',
    marginVertical: 5,
    fontWeight: '500',
  },
  wordContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  letterContainer: {
    width: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#fff',
    marginHorizontal: 5,
    marginVertical: 5,
  },
  letter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
  },
  keyboard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 5,
    width: '100%',
  },
  keyboardButton: {
    width: Math.min(32, width / 9),
    height: Math.min(45, width / 6),
    justifyContent: 'center',
    alignItems: 'center',
    margin: 3,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  keyboardLetter: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  correctLetter: {
    color: '#4caf50',
  },
  wrongLetter: {
    color: '#ff3333',
    textDecorationLine: 'line-through',
  },
  pauseButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  nextButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  restartButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalButtonDanger: {
    backgroundColor: '#f44336',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuContainer: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  scoreContainer: {
    marginBottom: 30,
  },
  highScoreText: {
    fontSize: 18,
    color: '#ffcc00',
    fontWeight: 'bold',
  },
  menuButton: {
    backgroundColor: '#2196f3',
    paddingHorizontal : 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  instructions: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },
  leaderboardContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  leaderboardContent: {
    marginTop: 30,
    alignItems: 'center',
  },
  leaderboardTitle: {
    fontSize: 20,
    color: '#ffcc00',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  leaderboardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#555',
  },
  leaderboardRank: {
    color: '#fff',
    fontWeight: 'bold',
    width: '10%',
  },
  leaderboardName: {
    color: '#fff',
    width: '60%',
    textAlign: 'center',
  },
  leaderboardScore: {
    color: '#ffcc00',
    fontWeight: 'bold',
    width: '30%',
    textAlign: 'right',
  },
  settingsContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
  },
  settingsContent: {
    marginTop: 30,
  },
  settingsTitle: {
    fontSize: 22,
    color: '#ffcc00',
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  settingsOption: {
    backgroundColor: '#444',
    padding: 15,
    borderRadius: 8,
    marginVertical: 8,
  },
  settingsOptionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});

export default GuessOrDie;