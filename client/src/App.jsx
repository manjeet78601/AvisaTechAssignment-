import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'

export default function App(){ 
  const navigate = useNavigate()
  async function logout(){ 
    await fetch('http://localhost:5000/api/auth/logout', { method:'POST', credentials:'include' })
    localStorage.removeItem('token'); // fallback
    navigate('/login') 
  }
  return (
    <div className="container">
      <header className="header">
        <h1>JSON ToDo App</h1>
        <nav>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
          <button onClick={logout}>Logout</button>
        </nav>
      </header>
      <main><Outlet/></main>
    </div>
  )
}
