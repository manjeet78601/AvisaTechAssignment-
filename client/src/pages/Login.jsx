import React, {useState} from 'react'
import { useNavigate } from 'react-router-dom'
export default function Login(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const nav = useNavigate()
  async function submit(e){ e.preventDefault()
    const res = await fetch('http://localhost:5000/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password}),credentials:'include'})
    const data = await res.json()
    if (res.ok){ nav('/dashboard') } else { alert(data.message || 'Login failed') }
  }
  return (
    <div className="card">
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div className="form-row"><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
        <div className="form-row"><input placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
        <button className="btn">Login</button>
      </form>
    </div>
  )
}
