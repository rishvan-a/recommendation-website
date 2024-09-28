from flask import Flask, render_template, request, jsonify
import requests
import base64

app = Flask(__name__)

# API keys for different services
TMDB_API_KEY = '3ce92aa806b4c527acf526324f6cd8e9'
RAWG_API_KEY = 'b174464b232e4981a07528ad781c29b8'

# Spotify credentials
SPOTIFY_CLIENT_ID = 'aa174295d12a44268ce575f5da0a41c0'
SPOTIFY_CLIENT_SECRET = '970750adf4d140b9b3befa40289f7cbc'
SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token'
SPOTIFY_API_URL = 'https://api.spotify.com/v1'

# API URLs
TMDB_API_URL = 'https://api.themoviedb.org/3'
RAWG_API_URL = 'https://api.rawg.io/api'

# Function to fetch movies based on genre ID and page
def fetch_movies(genre_id=None, page=1):
    try:
        url = f"{TMDB_API_URL}/discover/movie?api_key={TMDB_API_KEY}&sort_by=popularity.desc&page={page}"
        if genre_id:
            url += f"&with_genres={genre_id}"
        
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        return data.get('results', [])
    except requests.RequestException as e:
        print(f"Error fetching movies: {e}")
        return []

# Function to get Spotify access token
def get_spotify_token():
    try:
        auth_str = f"{SPOTIFY_CLIENT_ID}:{SPOTIFY_CLIENT_SECRET}"
        b64_auth_str = base64.b64encode(auth_str.encode()).decode()

        headers = {
            "Authorization": f"Basic {b64_auth_str}",
            "Content-Type": "application/x-www-form-urlencoded"
        }

        data = {
            "grant_type": "client_credentials"
        }

        response = requests.post(SPOTIFY_TOKEN_URL, headers=headers, data=data)
        response.raise_for_status()
        token_data = response.json()

        return token_data.get("access_token")
    except requests.RequestException as e:
        print(f"Error fetching Spotify token: {e}")
        return None

# Function to fetch music from Spotify based on genre and offset
def fetch_spotify_music(genre, offset=0):
    try:
        token = get_spotify_token()
        if not token:
            return []

        headers = {
            "Authorization": f"Bearer {token}"
        }

        url = f"{SPOTIFY_API_URL}/search?q=genre:{genre}&type=track&limit=10&offset={offset}"
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()

        tracks = data.get('tracks', {}).get('items', [])
        
        formatted_tracks = []
        for track in tracks:
            formatted_tracks.append({
                'title': track.get('name', 'Unknown Title'),
                'artist': ', '.join([artist['name'] for artist in track.get('artists', [])]),
                'album_cover': track.get('album', {}).get('images', [{}])[0].get('url', ''),
                'preview_url': track.get('preview_url', '')
            })

        return formatted_tracks
    except requests.RequestException as e:
        print(f"Error fetching music from Spotify: {e}")
        return []

# Function to fetch games based on genre and page
def fetch_games(genre, page=1):
    try:
        url = f"{RAWG_API_URL}/games?key={RAWG_API_KEY}&genres={genre}&ordering=-added&page={page}"
        response = requests.get(url)
        response.raise_for_status()
        data = response.json()
        games = data.get('results', [])
        
        for game in games:
            game['cover'] = game.get('background_image', '')
            game['title'] = game.get('name', 'Unknown Title')
        
        return games
    except requests.RequestException as e:
        print(f"Error fetching games: {e}")
        return []

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/movies', methods=['POST'])
def filter_movies():
    genre = request.form.get('genre')
    page = request.form.get('page', 1)  # Get the page number, default to 1 if not provided
    genre_ids = {
        'action': 28,
        'comedy': 35,
        'romance': 10749,
        'thriller': 53,
        'horror': 27,
        'drama': 18,
        'science_fiction': 878
    }
    genre_id = genre_ids.get(genre, '')
    movies = fetch_movies(genre_id, page)
    return jsonify(movies)

@app.route('/music', methods=['POST'])
def filter_music():
    genre = request.form.get('genre')
    offset = int(request.form.get('offset', 0))  # Get the offset, default to 0 if not provided
    music = fetch_spotify_music(genre, offset)
    return jsonify(music)

@app.route('/games', methods=['POST'])
def filter_games():
    genre = request.form.get('genre')
    page = request.form.get('page', 1)  # Get the page number, default to 1 if not provided
    games = fetch_games(genre, page)
    return jsonify(games)

if __name__ == '__main__':
    app.run(debug=True)
