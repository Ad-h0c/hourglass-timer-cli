# Hourglass Timer CLI

`hourglass` is a simple and lightweight command-line interface (CLI) timer application. This tool lets you set a timer and receive notifications when the time is up. It is useful for productivity or any scenarios where a quick timer is needed.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
  - [Cloning the Repository](#cloning-the-repository)
  - [Installing Dependencies](#installing-dependencies)
  - [Making Hourglass Globally Available](#making-hourglass-globally-available)
- [Usage](#usage)
  - [Examples](#examples)
- [Contributing](#contributing)
- [License](#license)

## Features

- Set a timer with hours, minutes, seconds, and days.
- Timer data is saved locally so you can close the terminal and still keep the timer running.
- Customizable notifications when the timer ends.
- Easy to use command-line interface.

## Installation

### Cloning the Repository

1. First, clone the repository to your local machine using git:

```sh
git clone https://github.com/YOUR_GITHUB_USERNAME/hourglass-timer-cli.git
```

2. Navigate into the project directory:

```sh
cd hourglass-timer-cli
```

### Installing Dependencies

3. Make sure you have [Node.js](https://nodejs.org/) installed on your machine.
4. Install the dependencies by running:

```sh
npm install
```

This command installs all the necessary dependencies from the `package.json` file.

### Making Hourglass Globally Available

#### Windows

For Windows, you can make the `hourglass` command globally available by adding it to your system’s PATH variable. You can do this by navigating to your npm installation folder and adding it to the PATH.

1. Find where your global npm packages are stored by running:

```sh
npm bin -g
```

2. Add the directory to your system's PATH environment variable.

#### MacOS and Linux

For MacOS and Linux, linking the package globally will make the command available system-wide.

```sh
npm link
```

This installs `hourglass` globally and you can now access it from anywhere in the command line.

## Usage

The basic syntax of `hourglass` is as follows:

```sh
./hourglass.js [options]
```

- --hours [number] : Set the number of hours for the timer.
- --minutes [number] : Set the number of minutes for the timer.
- --days [number] : Set the number of days for the timer.
- --seconds [number] : Set the number of seconds for the timer.
- --taskName [string] : Name of the task for the timer.
- --load : Load the previous timer data.
- --analyze : Analyze the previous timer data.
- --timer [1 or 2] : Use a predefined timer.

### Examples

- Set a timer for 5 minutes:

```sh
./hourglass.js --minutes 5
```

- Set a timer for 2 hours, 30 minutes, and 15 seconds:

```sh
./hourglass.js --hours 2 --minutes 30 --seconds 15
```

- Set a timer with the task name.

```sh
./hourglass.js --taskname test --hours 1
```

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue on GitHub.

## License

`hourglass` is licensed under the MIT License. See [LICENSE](LICENSE) file for more details.
