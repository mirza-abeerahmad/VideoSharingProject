import { useEffect, useState } from 'react'
import './App.css'

async function api(path, options = {}) {
  const response = await fetch(`/api/v1${path}`, { credentials: 'include', ...options })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(result.message || 'Request failed')
  return result.data
}

function App() {
  const [user, setUser] = useState(null)
  const [videos, setVideos] = useState([])
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [comments, setComments] = useState([])
  const [authMode, setAuthMode] = useState('')
  const [authForm, setAuthForm] = useState({ fullName: '', username: '', email: '', password: '' })
  const [authAvatar, setAuthAvatar] = useState(null)
  const [authError, setAuthError] = useState('')
  const [notice, setNotice] = useState('')
  const [search, setSearch] = useState('')
  const [comment, setComment] = useState('')
  const [showUpload, setShowUpload] = useState(false)

  async function loadVideos(query = '') {
    try { const data = await api(`/videos?limit=30${query ? `&query=${encodeURIComponent(query)}` : ''}`); setVideos(data.videos || []) } catch (error) { setNotice(error.message) }
  }
  useEffect(() => { loadVideos(); api('/users/current-user').then(setUser).catch(() => {}) }, [])

  async function openVideo(video) {
    setSelectedVideo(video)
    try { const [details, data] = await Promise.all([api(`/videos/${video._id}`), api(`/comments/${video._id}`)]); setSelectedVideo(details); setComments(data.comments || []) } catch (error) { setNotice(error.message) }
  }
  async function submitAuth(event) {
    event.preventDefault(); setAuthError('')
    try {
      const options = { method: 'POST' }
      if (authMode === 'register') {
        if (!authAvatar) throw new Error('Choose an avatar to create your account.')
        const body = new FormData(); Object.entries(authForm).forEach(([key, value]) => body.append(key, value)); body.append('avatar', authAvatar); options.body = body
      } else {
        options.headers = { 'Content-Type': 'application/json' }
        options.body = JSON.stringify({ ...authForm, username: authForm.email, email: authForm.email })
      }
      const data = await api(`/users/${authMode}`, options); setUser(data.user || data); setAuthMode(''); setAuthAvatar(null); setNotice('Welcome to streamly.')
    } catch (error) { setAuthError(error.message) }
  }
  async function submitComment(event) {
    event.preventDefault(); if (!comment.trim() || !selectedVideo) return
    try { const created = await api(`/comments/${selectedVideo._id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: comment }) }); setComments((current) => [created, ...current]); setComment('') } catch (error) { setNotice(error.message) }
  }
  async function toggleLike() { try { const result = await api(`/likes/toggle/v/${selectedVideo._id}`, { method: 'POST' }); setNotice(result.liked ? 'Added to liked videos.' : 'Removed from liked videos.') } catch (error) { setNotice(error.message) } }
  async function subscribe() { try { const result = await api(`/subscriptions/c/${selectedVideo.owner._id}`, { method: 'POST' }); setNotice(result.subscribed ? 'You are now following this creator.' : 'Subscription removed.') } catch (error) { setNotice(error.message) } }
  async function logout() { await api('/users/logout', { method: 'POST' }).catch(() => {}); setUser(null); setNotice('Signed out.') }

  return <div className="app-shell">
    <header className="topbar"><a className="logo" href="#top"><span>◒</span> streamly</a><form className="search" onSubmit={(event) => { event.preventDefault(); loadVideos(search) }}><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search the library" /><button aria-label="Search">⌕</button></form><div className="top-actions">{user ? <><button className="ghost" onClick={() => setShowUpload(true)}>＋ Publish</button><button className="avatar" onClick={logout}>{user.fullName?.[0] || 'U'}</button></> : <button className="dark-button" onClick={() => setAuthMode('login')}>Sign in</button>}</div></header>
    <main id="top"><section className="hero"><div><p className="kicker">A considered place for moving images</p><h1>Watch something<br /><em>worth keeping.</em></h1><p className="hero-copy">Discover thoughtful videos, follow the people who make them, and build a library that feels like yours.</p></div><div className="hero-art"><span>PLAY<br />/ 2026</span><strong>01</strong></div></section>
      {notice && <div className="notice">{notice}<button onClick={() => setNotice('')}>×</button></div>}
      <section className="content-grid"><div className="feed"><div className="section-heading"><div><p className="kicker">Fresh from the community</p><h2>For your next hour</h2></div><span>{videos.length} stories</span></div><div className="video-grid">{videos.map((video) => <article className="video-card" key={video._id} onClick={() => openVideo(video)}><div className="thumbnail"><img src={video.thumbnail} alt="" /><span>{Math.round((video.duration || 0) / 60)} min</span></div><div className="video-info"><h3>{video.title}</h3><p>{video.owner?.fullName || 'Streamly creator'} · {video.views || 0} views</p></div></article>)}</div>{videos.length === 0 && <div className="empty">No videos yet. Publish the first story.</div>}</div><aside className="side-panel"><p className="kicker">Your studio</p>{user ? <><h2>{user.fullName}</h2><p className="muted">@{user.username}</p><button className="outline-button" onClick={() => setShowUpload(true)}>Publish a video <span>↗</span></button><div className="studio-rule" /><p className="muted">Shape a channel around the ideas you want to return to.</p></> : <><h2>Make an entrance.</h2><p className="muted">Sign in to publish, comment, follow creators, and make the library your own.</p><button className="outline-button" onClick={() => setAuthMode('register')}>Create account <span>↗</span></button></>}</aside></section></main>
    {selectedVideo && <div className="modal-backdrop" onClick={() => setSelectedVideo(null)}><section className="watch-modal" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setSelectedVideo(null)}>×</button><video className="watch-video" controls playsInline poster={selectedVideo.thumbnail} src={selectedVideo.videoFile}>Your browser does not support video playback.</video><p className="kicker">Now watching</p><h2>{selectedVideo.title}</h2><p className="muted">{selectedVideo.description}</p><div className="watch-actions"><button className="dark-button" onClick={toggleLike}>♡ Like</button><button className="outline-button" onClick={subscribe}>Follow creator</button></div><form className="comment-form" onSubmit={submitComment}><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Leave a thought" /><button>Post</button></form><div className="comments">{comments.map((item) => <div className="comment" key={item._id}><strong>{item.owner?.fullName || 'Viewer'}</strong><span>{item.content}</span></div>)}</div></section></div>}
    {!user && authMode && <div className="modal-backdrop" onClick={() => setAuthMode('')}><section className="auth-card" onClick={(event) => event.stopPropagation()}><button className="close" onClick={() => setAuthMode('')}>×</button><p className="kicker">{authMode === 'register' ? 'Begin here' : 'Welcome back'}</p><h2>{authMode === 'register' ? 'Create your account.' : 'Sign in to streamly.'}</h2><form onSubmit={submitAuth}>{authMode === 'register' && <input placeholder="Full name" value={authForm.fullName} onChange={(event) => setAuthForm({ ...authForm, fullName: event.target.value })} required />}<input placeholder={authMode === 'register' ? 'Username' : 'Email or username'} value={authMode === 'login' ? (authForm.email || authForm.username) : authForm.username} onChange={(event) => setAuthForm({ ...authForm, [authMode === 'login' ? 'email' : 'username']: event.target.value })} required />{authMode === 'register' && <input type="email" placeholder="Email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} required />}<input type="password" placeholder="Password" value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} required />{authMode === 'register' && <label className="file-field">Avatar<input type="file" accept="image/*" required onChange={(event) => setAuthAvatar(event.target.files[0])} /></label>}<button className="dark-button wide">{authMode === 'register' ? 'Create account' : 'Sign in'} <span>→</span></button><p className="form-error">{authError}</p></form><button className="text-button" onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}>{authMode === 'register' ? 'Already have an account?' : 'New to streamly? Create one'}</button></section></div>}
    {showUpload && <UploadModal onClose={() => setShowUpload(false)} onDone={() => { setShowUpload(false); loadVideos(); setNotice('Video published successfully.') }} />}
  </div>
}

function UploadModal({ onClose, onDone }) {
  const [form, setForm] = useState({ title: '', description: '', videoFile: null, thumbnail: null }); const [error, setError] = useState('')
  async function submit(event) { event.preventDefault(); const body = new FormData(); body.append('title', form.title); body.append('description', form.description); body.append('videoFile', form.videoFile); body.append('thumbnail', form.thumbnail); try { await api('/videos', { method: 'POST', body }); onDone() } catch (err) { setError(err.message) } }
  return <div className="modal-backdrop" onClick={onClose}><section className="upload-modal" onClick={(event) => event.stopPropagation()}><button className="close" onClick={onClose}>×</button><p className="kicker">Creator studio</p><h2>Publish a new story.</h2><form onSubmit={submit}><input placeholder="Title" required onChange={(event) => setForm({ ...form, title: event.target.value })} /><textarea placeholder="What is this video about?" required onChange={(event) => setForm({ ...form, description: event.target.value })} /><label className="file-field">Video file<input type="file" accept="video/*" required onChange={(event) => setForm({ ...form, videoFile: event.target.files[0] })} /></label><label className="file-field">Thumbnail<input type="file" accept="image/*" required onChange={(event) => setForm({ ...form, thumbnail: event.target.files[0] })} /></label><button className="dark-button wide">Publish <span>↗</span></button><p className="form-error">{error}</p></form></section></div>
}

export default App
