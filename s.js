// API Keys
const TMDB_API_KEY = '3ce92aa806b4c527acf526324f6cd8e9';
const SPOTIFY_CLIENT_ID = 'aa174295d12a44268ce575f5da0a41c0';
const SPOTIFY_CLIENT_SECRET = '970750adf4d140b9b3befa40289f7cbc';
const RAWG_API_KEY = 'b174464b232e4981a07528ad781c29b8';

// Pagination settings
const MOVIE_PAGE_SIZE = 10;
const SONG_PAGE_SIZE = 10;
const GAME_PAGE_SIZE = 10;

let currentMoviePage = 1;
let currentSongPage = 1;
let currentGamePage = 1;

// Fetch Spotify Access Token
async function getSpotifyToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET)
    },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return data.access_token;
}

// Fetch Movie Recommendations using TMDb API
async function fetchMovieRecommendations(page = 1) {
  const response = await fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`);
  const data = await response.json();
  displayRecommendations(data.results, 'movie-recommendations');
  setupPagination('movie-pagination', data.total_pages, 'movies', currentMoviePage);
}

// Fetch Song Recommendations using Spotify API
async function fetchSongRecommendations(page = 1) {
  const token = await getSpotifyToken();
  const response = await fetch(`https://api.spotify.com/v1/playlists/37i9dQZF1DXcBWIGoYBM5M`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  displayRecommendations(data.tracks.items.slice((page - 1) * SONG_PAGE_SIZE, page * SONG_PAGE_SIZE), 'song-recommendations', 'track');
  setupPagination('song-pagination', Math.ceil(data.tracks.items.length / SONG_PAGE_SIZE), 'songs', currentSongPage);
}

// Fetch Game Recommendations using RAWG API
async function fetchGameRecommendations(page = 1) {
  const response = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page_size=${GAME_PAGE_SIZE}&page=${page}`);
  const data = await response.json();
  displayRecommendations(data.results, 'game-recommendations');
  setupPagination('game-pagination', data.total_pages, 'games', currentGamePage);
}

// Display Recommendations in the DOM
function displayRecommendations(items, elementId, type = 'media') {
  const container = document.getElementById(elementId);
  container.innerHTML = '';

  items.forEach(item => {
    const recommendationDiv = document.createElement('div');
    recommendationDiv.classList.add('recommendation-item');

    const imageUrl = type === 'track' ? item.track.album.images[0].url :
                     item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : item.background_image;

    recommendationDiv.innerHTML = `
      <img src="${imageUrl}" alt="${item.title || item.name}">
      <h3>${item.title || item.name}</h3>
    `;

    container.appendChild(recommendationDiv);
  });
}

// Setup Pagination
function setupPagination(paginationId, totalPages, tab, currentPage) {
  const paginationContainer = document.getElementById(paginationId);
  paginationContainer.innerHTML = '';

  for (let page = 1; page <= totalPages; page++) {
    const button = document.createElement('button');
    button.innerText = page;
    button.disabled = page === currentPage;

    button.onclick = () => {
      if (tab === 'movies') {
        currentMoviePage = page;
        fetchMovieRecommendations(page);
      } else if (tab === 'songs') {
        currentSongPage = page;
        fetchSongRecommendations(page);
      } else if (tab === 'games') {
        currentGamePage = page;
        fetchGameRecommendations(page);
      }
    };

    paginationContainer.appendChild(button);
  }
}

// Open Tab Functionality
function openTab(event, tabName) {
  const tabs = document.querySelectorAll('.tab-content');
  const tabLinks = document.querySelectorAll('.tab');

  tabs.forEach(tab => {
    tab.classList.remove('active');
  });

  tabLinks.forEach(link => {
    link.classList.remove('active');
  });

  document.getElementById(tabName).classList.add('active');
  event.currentTarget.classList.add('active');
}

// Search Functions
async function searchMovies() {
  const query = document.getElementById('movie-search').value;
  if (query.length < 3) { // Prevent too many requests
    return;
  }
  const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
  const data = await response.json();
  displayRecommendations(data.results, 'movie-recommendations');
  setupPagination('movie-pagination', 1, 'movies', 1); // Reset pagination
}

async function searchSongs() {
  const query = document.getElementById('song-search').value;
  if (query.length < 3) { // Prevent too many requests
    return;
  }
  const token = await getSpotifyToken();
  const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  displayRecommendations(data.tracks.items, 'song-recommendations', 'track');
  setupPagination('song-pagination', 1, 'songs', 1); // Reset pagination
}

async function searchGames() {
  const query = document.getElementById('game-search').value;
  if (query.length < 3) { // Prevent too many requests
    return;
  }
  const response = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&page_size=${GAME_PAGE_SIZE}&page=1&search=${encodeURIComponent(query)}`);
  const data = await response.json();
  displayRecommendations(data.results, 'game-recommendations');
  setupPagination('game-pagination', 1, 'games', 1); // Reset pagination
}

// Initial Data Fetch
fetchMovieRecommendations();
fetchSongRecommendations();
fetchGameRecommendations();
