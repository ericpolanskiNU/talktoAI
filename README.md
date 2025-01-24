# Talk to AI Web App

This web app uses the OpenAI API to transcribe audio input, processes the transcription using OpenAI's real-time API, and responds with audio output. The app features start and stop recording buttons and displays live information on user input and AI output.

## Prerequisites

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [OpenAI API Key](https://openai.com/)

## Setup

1. **Clone the repository**:
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2. **Install dependencies**:
    ```sh
    npm install
    ```

3. **Set up environment variables**:
    - Create a [.env](http://_vscodecontentref_/1) file in the root directory.
    - Add your OpenAI API key to the [.env](http://_vscodecontentref_/2) file:
      ```env
      OPENAI_API_KEY="your-openai-api-key"
      ```

4. **Run the server**:
    ```sh
    node src/app.js
    ```

5. **Open the web app**:
    - Open your browser and navigate to `http://localhost:3000`.

## Project Structure
.env package.json public/ app.js index.html styles.css README.md src/ app.js

## Dependencies

- `express`
- `path`
- `body-parser`
- `dotenv`
- `node-fetch`

## What the Code Does

- **Server-side (`src/app.js`)**:
  - Sets up an Express server to serve static files and handle API requests.
  - Provides an endpoint to create a session with OpenAI's real-time API.
  - Provides an endpoint to transcribe audio using OpenAI's API.
  - Provides an endpoint to check if the transcription is in English using OpenAI's API.
  - Listens on the specified port (default: 3000).

- **Client-side (`public/app.js`)**:
  - Handles audio recording and silence detection.
  - Sends recorded audio to the server for transcription.
  - Sends transcribed text to the server for AI processing.
  - Plays the AI's audio response.

- **HTML and CSS (`public/index.html` and [styles.css](http://_vscodecontentref_/3))**:
  - Provides the user interface with start and stop recording buttons.
  - Styles the web app.

## How to Use (Does not work yet as described below)

1. **Start Recording**:
    - Click the "Start Recording" button to begin recording audio.

2. **Stop Recording**:
    - Click the "Stop Recording" button to stop recording audio.

3. **View Transcription and AI Response**:
    - The app will display the live transcription of your input and the AI's response.
    - The AI's response will be played as audio.