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
    'timer': { type: 'number', describe: 'Predefined timer (1 or 2)' },
    'taskName': { type: 'string', default: '', describe: 'Name of the task' }
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

if (process.argv.length === 2) {
  console.log(`
      Welcome to Hourglass!
  
      Hourglass is a command-line timer application that allows you to start timers with different durations, save timer data, and analyze your timer usage.
  
      Commands and Options:
      --hours [number]    : Set the number of hours for the timer.
      --minutes [number]  : Set the number of minutes for the timer.
      --days [number]     : Set the number of days for the timer.
      --seconds [number]  : Set the number of seconds for the timer.
      --taskName [string] : Name of the task for the timer.
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

function startTimer(duration, restartDuration, taskName = '') {
  startTime = Date.now();
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

    let taskInfo = taskName ? `Task: ${taskName}, ` : '';
    process.stdout.write(`\r${taskInfo}Time remaining: ${formattedTime}`);
  }

  timerInterval = setInterval(() => {
    remainingTime--;
    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      saveElapsedTimeToFile();
      if (restartDuration) {
        console.log('\nStarting a new timer!');
        startTimer(restartDuration, null, taskName);
      } else {
        process.exit(0);
      }
    } else {
      displayTime();
    }
  }, 1000);

  displayTime();
}

function saveTimerData(duration, taskName, callback) {
  const data = {
    timestamp: new Date(Date.now()).toLocaleString(),
    taskName: taskName,
    duration: {
      hours: duration.hours,
      minutes: duration.minutes,
      days: duration.days,
      seconds: duration.seconds
    }
  };
  timerData.push(data);
  fs.writeFile(DATA_FILE, JSON.stringify(timerData), callback);
}

function saveElapsedTimeToFile() {
  if (startTime) {
    const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    const duration = {
      hours: Math.floor(elapsedTime / 3600),
      minutes: Math.floor((elapsedTime % 3600) / 60),
      days: Math.floor(elapsedTime / 86400),
      seconds: elapsedTime % 60
    };
    saveTimerData(duration, argv.taskName, () => process.exit(0));
  }
}

async function loadTimerData() {
  try {
    timerData = JSON.parse(await fs.promises.readFile(DATA_FILE));
    console.log(timerData);
  } catch (error) {
    console.error('Failed to load timer data:', error.message);
  }
}

async function analyzeTimerData() {
  try {
    timerData = JSON.parse(await fs.promises.readFile(DATA_FILE));
    // Add your analysis logic here...
  } catch (error) {
    console.error('Failed to analyze timer data:', error.message);
  }
}

async function executeCommand() {
  const taskName = argv.taskName;

  if (argv.load) {
    await loadTimerData();
  } else if (argv.analyze) {
    await analyzeTimerData();
  } else if (argv.timer) {
    const predefinedTimer = PREDEFINED_TIMERS[argv.timer];
    if (predefinedTimer) {
      await startTimer(predefinedTimer.duration, predefinedTimer.restartDuration, taskName);
    } else {
      console.log('Invalid timer number. Choose 1 or 2.');
    }
  } else if (argv.hours || argv.minutes || argv.days || argv.seconds) {
    const duration = {
      days: argv.days,
      hours: argv.hours,
      minutes: argv.minutes,
      seconds: argv.seconds,
    };
    startTimer(duration, null, taskName);
  }
}

// process.on('SIGINT', saveElapsedTimeToFile);



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

executeCommand();
