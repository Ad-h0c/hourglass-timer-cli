#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');


const argv = require('yargs/yargs')(process.argv.slice(2))
  .options({
    'hours': { type: 'number', default: 0, describe: 'Number of hours' },
    'minutes': { type: 'number', default: 0, describe: 'Number of minutes' },
    'days': { type: 'number', default: 0, describe: 'Number of days' },
    'seconds': { type: 'number', default: 0, describe: 'Number of seconds' },
    'format': { type: 'string', default: 'default', describe: 'Output format' },
    'load': { type: 'boolean', default: false, describe: 'Load previous timer data' },
    'analyze': { type: 'boolean', default: false, describe: 'Analyze previous timer data' },
    'timer': { type: 'number', describe: 'Predefined timer (1 or 2)' }
  })
  .check((argv) => {
    if (argv.timer && ![1, 2].includes(argv.timer)) {
      throw new Error('Invalid timer number. Choose 1 or 2.');
    }
    return true;
  })
  .command('q', 'Quit the application')
  .command('p', 'Pause the timer')
  .command('r', 'Resume the timer')
  .help()
  .argv;


// Display welcome message if no parameters are specified
if (process.argv.length === 2) {
  console.log(`
    Welcome to Hourglass!

    Hourglass is a command-line timer application that allows you to start timers with different durations, save timer data, and analyze your timer usage.

    Commands and Options:
    --hours [number]    : Set the number of hours for the timer.
    --minutes [number]  : Set the number of minutes for the timer.
    --days [number]     : Set the number of days for the timer.
    --seconds [number]  : Set the number of seconds for the timer.
    --load              : Load the previous timer data.
    --analyze           : Analyze the previous timer data.
    --timer [1 or 2]    : Use a predefined timer.
    q                   : Quit the application.
    p                   : Pause the timer.
    r                   : Resume the timer.

    Example usage:
    hourglass --minutes 10      : Starts a timer for 10 minutes.
    hourglass --load            : Loads previously saved timer data.
    hourglass --analyze         : Analyzes your timer usage.
  `);
  process.exit(0);
}

let startTime = null;
let timerInterval = null;
let remainingTime = 0;
let pauseTime = null;
let timerData = [];

const DATA_FILE = path.join(__dirname, 'timer_data.json');

const PREDEFINED_TIMERS = {
  1: { duration: { hours: 0, minutes: 25, days: 0, seconds: 0 }, restartDuration: { hours: 0, minutes: 5, seconds: 0 } },
  2: { duration: { hours: 0, minutes: 45, days: 0, seconds: 0 }, restartDuration: { hours: 0, minutes: 15, seconds: 0 } }
};

function startTimer(duration, restartDuration) {
  startTime = Date.now(); // Record the start time
  const totalSeconds = duration.hours * 3600 + duration.minutes * 60 + duration.days * 86400 + duration.seconds;
  remainingTime = Math.max(totalSeconds, 0);

  function displayTime() {
    let hours = Math.floor(remainingTime / 3600);
    let minutes = Math.floor((remainingTime % 3600) / 60);
    let seconds = remainingTime % 60;
    let days = Math.floor(hours / 24);
    hours = hours % 24;

    let formattedTime;
    if (argv.format === 'custom') {
      formattedTime = `${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`;
    } else {
      formattedTime = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }

    process.stdout.write(`\rTime remaining: ${formattedTime}`); // Use carriage return
  }


  function saveElapsedTimeToFile() {
    if (startTime) {
      const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
      const duration = {
        days: Math.floor(elapsedTime / 86400),
        hours: Math.floor((elapsedTime % 86400) / 3600),
        minutes: Math.floor((elapsedTime % 3600) / 60),
        seconds: elapsedTime % 60
      };
      saveTimerData(duration);
    }
  }


  function tick() {
    if (remainingTime === 0) {
      clearInterval(timerInterval);
      console.log('\x1b[5mTime\'s up!\x07\x1b[0m');
      if (restartDuration) {
        setTimeout(() => {
          console.log('Restarting timer...');
          startTimer(duration, restartDuration);
        }, restartDuration.hours * 3600000 + restartDuration.minutes * 60000 + restartDuration.seconds * 1000);
      } else {
        saveTimerData(duration, askToRepeat);
      }
    } else {
      remainingTime -= 1;
      displayTime();
    }
  }


  function start() {
    displayTime();
    timerInterval = setInterval(tick, 1000);
  }

  function askToRepeat() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('Do you want to repeat the same time again? (y/n) ', (answer) => {
      rl.close();

      if (answer.toLowerCase() === 'y' || answer === '') {
        startTimer(duration, restartDuration);
      } else {
        console.log('Exiting...');
        process.exit(0);
      }
    });
  }

  start();
}

function saveTimerData(duration, callback) {
  const data = {
    timestamp: new Date(Date.now()).toLocaleString(),
    duration: {
      hours: duration.hours,
      minutes: duration.minutes,
      days: duration.days,
      seconds: duration.seconds
    }
  };

  timerData.push(data);

  fs.writeFile(DATA_FILE, JSON.stringify(timerData, null, 2), (err) => {
    if (err) {
      console.error('Error saving timer data:', err);
    } else {
      process.stdout.write('Timer data saved successfully.\n');
    }
    if (callback) {
      callback();
    }
  });
}


async function loadTimerData() {
  try {
    const fileData = await fs.promises.readFile(DATA_FILE, 'utf8');
    timerData = JSON.parse(fileData);
    console.log('Previous Timer Data:');
    console.log(timerData);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('No previous timer data file found.');
    } else if (err instanceof SyntaxError) {
      console.log('Timer data file is empty or not in the correct format.');
    } else {
      console.error('Error loading timer data:', err);
    }
  } finally {
    process.exit(0);
  }
}

async function analyzeTimerData() {
  try {
    const fileData = await fs.promises.readFile(DATA_FILE, 'utf8');
    timerData = JSON.parse(fileData);

    let totalTimers = 0;
    let totalTime = 0;

    for (const data of timerData) {
      const { hours, minutes, days, seconds } = data.duration;
      const durationInSeconds = hours * 3600 + minutes * 60 + days * 86400 + seconds;

      if (durationInSeconds > 0) {
        totalTime += durationInSeconds;
        totalTimers++;
      }
    }

    const averageTime = totalTimers > 0 ? totalTime / totalTimers : 0;

    console.log('Timer Data Analysis:');
    console.log(`Total Timers: ${totalTimers}`);
    console.log(`Total Time: ${totalTime} seconds`);
    console.log(`Average Time: ${averageTime} seconds`);
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('No previous timer data file found.');
    } else if (err instanceof SyntaxError) {
      console.log('Timer data file is empty or not in the correct format.');
    } else {
      console.error('Error analyzing timer data:', err);
    }
  } finally {
    process.exit(0);
  }
}


function pauseTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
    pauseTime = Date.now();
    console.log('Timer paused. Press "r" to resume.');
  } else {
    console.log('Timer is not running.');
  }
}

function resumeTimer() {
  if (!timerInterval && pauseTime !== null) {
    const pausedDuration = Math.floor((Date.now() - pauseTime) / 1000);
    remainingTime += pausedDuration;
    startTimer({ hours: 0, minutes: 0, days: 0, seconds: remainingTime }, null);
    pauseTime = null;
    console.log('Timer resumed.');
  } else {
    console.log('Timer is not paused.');
  }
}


function saveElapsedTimeToFile() {
  if (startTime) {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const duration = {
      days: Math.floor(elapsedTime / 86400),
      hours: Math.floor((elapsedTime % 86400) / 3600),
      minutes: Math.floor((elapsedTime % 3600) / 60),
      seconds: elapsedTime % 60
    };
    saveTimerData(duration, () => process.exit(0));
  }
}

const timerFileExists = fs.existsSync(DATA_FILE);

if (timerFileExists) {
  fs.readFile(DATA_FILE, 'utf8', (err, fileData) => {
    if (err) {
      console.error('Error loading timer data:', err);
      executeCommand();
    } else {
      try {
        timerData = JSON.parse(fileData);
        // Ensure timerData is an array if the file is empty
        if (!Array.isArray(timerData)) {
          timerData = [];
        }
      } catch (err) {
        // If the file is empty, silently initialize timerData as an empty array
        timerData = [];
      }
      executeCommand();
    }
  });
} else {
  executeCommand();
}


async function executeCommand() {
  if (argv.load) {
    await loadTimerData();
  } else if (argv.analyze) {
    await analyzeTimerData();
  } else if (argv.timer) {
    const predefinedTimer = PREDEFINED_TIMERS[argv.timer];
    if (predefinedTimer) {
      await startTimer(predefinedTimer.duration, predefinedTimer.restartDuration);
    } else {
      console.log('Invalid timer number. Choose 1 or 2.');
    }
  } else if (argv.hours || argv.minutes || argv.days || argv.seconds) {
    // Start custom timer
    const duration = {
      days: argv.days,
      hours: argv.hours,
      minutes: argv.minutes,
      seconds: argv.seconds,
    };
    startTimer(duration);
  }

}

process.on('SIGINT', () => {
  console.log('\nSaving current timer data and exiting...');
  saveElapsedTimeToFile();
});


process.stdin.setRawMode(true);
process.stdin.on('data', (key) => {
  if (key.toString() === 'p') {
    pauseTimer();
  } else if (key.toString() === 'r') {
    resumeTimer();
  } else if (key.toString() === 'q') {
    console.log('\nSaving current timer data and exiting...');
    saveElapsedTimeToFile();
  }
});