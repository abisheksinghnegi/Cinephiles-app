import React, { useState, useEffect } from 'react';
import axios from 'axios';
import bgvideo from '../src/assets/bg.mp4';

// TMDb API key
const apiKey = '94b1f21d4d882617dcdfbdb099ffd67c';

// Genre ID mapping for TMDb
const genreIds = {
  horror: 27,
  action: 28,
  comedy: 35,
  thriller: 53,
  historical: 36,
  drama: 18,
};

// Genre-specific usernames and passwords
const genreCredentials = {
  horror: { username: 'horrorUser', password: 'horrorPass' },
  action: { username: 'actionUser', password: 'actionPass' },
  comedy: { username: 'comedyUser', password: 'comedyPass' },
  thriller: { username: 'thrillerUser', password: 'thrillerPass' },
  historical: { username: 'historicalUser', password: 'historicalPass' },
  drama: { username: 'dramaUser', password: 'dramaPass' },
};

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [genre, setGenre] = useState('');
  const [movies, setMovies] = useState([]);
  const [trailers, setTrailers] = useState({});
  const [cast, setCast] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMovies = async (searchQuery = '', genreId = genreIds[genre]) => {
    setIsLoading(true);
    try {
      let response;
      if (searchQuery) {
        response = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
          params: { query: searchQuery, api_key: apiKey, language: 'en-US', page: 1 },
        });
      } else {
        response = await axios.get(`https://api.themoviedb.org/3/discover/movie`, {
          params: { with_genres: genreId, api_key: apiKey, language: 'en-US', page: 1 },
        });
      }

      setMovies(response.data.results);
      fetchTrailers(response.data.results);
      fetchCastAndCrew(response.data.results);
    } catch (error) {
      console.error('Error fetching movie data', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrailers = async (movies) => {
    const trailerPromises = movies.map((movie) =>
      axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/videos`, {
        params: { api_key: apiKey, language: 'en-US' },
      })
    );

    try {
      const trailerResponses = await Promise.all(trailerPromises);
      const trailerData = trailerResponses.reduce((acc, response, index) => {
        const trailer = response.data.results.find((video) => video.type === 'Trailer');
        if (trailer) {
          acc[movies[index].id] = `https://www.youtube.com/watch?v=${trailer.key}`;
        }
        return acc;
      }, {});
      setTrailers(trailerData);
    } catch (error) {
      console.error('Error fetching trailers', error);
    }
  };

  const fetchCastAndCrew = async (movies) => {
    const castPromises = movies.map((movie) =>
      axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/credits`, {
        params: { api_key: apiKey, language: 'en-US' },
      })
    );

    try {
      const castResponses = await Promise.all(castPromises);
      const castData = castResponses.reduce((acc, response, index) => {
        const topCast = response.data.cast.slice(0, 4);
        const crew = response.data.crew.filter((member) =>
          member.job === 'Director' || member.job === 'Cinematographer'
        );
        acc[movies[index].id] = { topCast, crew };
        return acc;
      }, {});
      setCast(castData);
    } catch (error) {
      console.error('Error fetching cast and crew data', error);
    }
  };

  const handleLogin = (selectedGenre) => {
    setGenre(selectedGenre);
    setUsername('');
    setPassword('');
    setErrorMessage('');
    setIsLoggedIn(false);
  };

  const handleGenreLogin = (selectedGenre) => {
    const { username: validUsername, password: validPassword } = genreCredentials[selectedGenre];

    if (username === validUsername && password === validPassword) {
      setIsLoggedIn(true);
      fetchMovies();
    } else {
      setErrorMessage('Incorrect username or password');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setGenre('');
    setMovies([]);
    setTrailers({});
    setCast({});
    setUsername('');
    setPassword('');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === '') {
      fetchMovies();
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMovies(searchTerm);
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchMovies();
    }
  }, [isLoggedIn, genre]);

  return (
    <div className="app-container">
      {!isLoggedIn && (
        <div className="video-background">
          <video src={bgvideo} autoPlay loop muted playsInline className="background-video" />
        </div>
      )}

      {!isLoggedIn ? (
        <div className="login-container">
          <h1>WELCOME CINEPHILE</h1>
          <br />
          <h2>CHOOSE YOUR GENRE</h2>
          {!genre ? (
            <div className="genre-buttons">
              <button className='genrebtn' onClick={() => handleLogin('horror')}>Login for Horror Movies</button>
              <button className='genrebtn' onClick={() => handleLogin('action')}>Login for Action Movies</button>
              <button className='genrebtn' onClick={() => handleLogin('drama')}>Login for Drama Movies</button>
              <button className='genrebtn' onClick={() => handleLogin('thriller')}>Login for Thriller Movies</button>
              <button className='genrebtn' onClick={() => handleLogin('comedy')}>Login for Comedy Movies</button>
              <button className='genrebtn' onClick={() => handleLogin('historical')}>Login for Historical Movies</button>
            </div>
          ) : (
            <div>
              <h3>Login for {genre.charAt(0).toUpperCase() + genre.slice(1)} Movies</h3>
              <div>
                <p>Username: <strong>{genreCredentials[genre]?.username}</strong></p>
                <p>Password: <strong>{genreCredentials[genre]?.password}</strong></p>
              </div>
              <input className='logininput'
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input className='logininput'
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button onClick={() => handleGenreLogin(genre)}>
                Login
              </button>
              {errorMessage && <p>{errorMessage}</p>}
            </div>
          )}
        </div>
      ) : (
        <div id='loggedinbg'>
          <div className='navbar'> 
          <h2 id='heading'>Welcome to {genre.charAt(0).toUpperCase() + genre.slice(1)} Genre!</h2>
          <button id='logoutbtn' onClick={handleLogout}>Logout</button>
          </div>
          <form onSubmit={handleSearchSubmit}>
            <input id='searchbar'
              type="text"
              placeholder="Search Movies, Actors, or Directors..."
              value={searchTerm}
              onChange={handleSearch}
            />
            <button id='searchbtn' type="submit">Search</button>
          </form>

          <div>
            {isLoading ? (
              <p>Loading movies...</p>
            ) : (
              <ul>
                {movies.map((movie) => (
                  <li key={movie.id}>
                    <div className="movie-detail">
                      <div className="movie-poster">
                        <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} alt={movie.title} />
                      </div>

                      <div className="movie-info">
                        <h3>{movie.title} ({movie.release_date?.split('-')[0]})</h3>
                        <p>{movie.overview}</p>
                        <p><strong>Genre: </strong>{genre.charAt(0).toUpperCase() + genre.slice(1)}</p>

                        <div id="cast">
                          <h4>Top Cast:</h4>
                          <div className="cast-info">
                            {cast[movie.id]?.topCast.map((actor) => (
                              <div key={actor.id} className="actor">
                                {actor.profile_path && (
                                  <img id='actorimg'
                                    src={`https://image.tmdb.org/t/p/w92${actor.profile_path}`}
                                    alt={actor.name}
                                    className="actor-photo"
                                  />
                                )}
                                <span>{actor.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4>Director(s):</h4>
                          <ul>
                            {cast[movie.id]?.crew.map((member) => (
                              <li key={member.id}>
                                <span>{member.name} ({member.job})</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <br />

                        <div className="buttons-container">
                          <a id='trailerbtn' href={trailers[movie.id]} target="_blank" rel="noopener noreferrer">Watch Trailer
                          </a>
                          <a
                          id='torrentbtn'
                          href={`https://www.1377x.to/search/${encodeURIComponent(movie.title)}/1/`}
                          target="_blank"
                          rel="noopener noreferrer">
                          Download Torrent
                          </a>
                        </div>
                      </div>   
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
