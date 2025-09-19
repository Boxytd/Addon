# VidSrc Stremio Add-on

A self-contained Stremio add-on that scrapes sources from VidSrc.

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   cd YOUR_REPO_NAME
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create an environment file:**
   Create a file named `.env` and add your TMDB API key:
   ```
   TMDB_API_KEY=your_key_here
   ```

4. **Run the add-on:**
   ```bash
   node server.js
   ```

The add-on will be running at `http://127.0.0.1:3000`.
