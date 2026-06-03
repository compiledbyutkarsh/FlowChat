import { useState } from 'react';
import { MessageSquare, ArrowRight } from 'lucide-react';

const COLORS = ['#57F287','#FEE75C','#EB459E','#ED4245','#5865F2','#00B0F4','#FFFFFF','#99AAB5'];
const AVATARS = ['🐱','🐶','🦊','🐸','🐼','🦁','🐯','🦋','🐺','🦄','🐙','🦀'];

export default function Join({ onJoin }) {
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('🐱');
  const [color, setColor] = useState('#57F287');
  const [error, setError] = useState('');

  const handleJoin = () => {
    if (!username.trim()) { setError('Please enter a username'); return; }
    if (username.trim().length < 2) { setError('Minimum 2 characters required'); return; }
    onJoin({ username: username.trim(), avatar, color });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{background:'#313338'}}>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{background:'#5865F2'}}>
            <MessageSquare size={36} color="white"/>
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{color:'#FFFFFF'}}>
            Welcome to FlowChat
          </h1>
          <p className="text-sm" style={{color:'#B5BAC1'}}>
            Choose your identity before joining
          </p>
        </div>

        {/* Card */}
        <div className="rounded-lg p-6" style={{background:'#2B2D31'}}>

          {/* Avatar */}
          <div className="mb-5">
            <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{color:'#B5BAC1'}}>
              Choose Avatar
            </p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map(a => (
                <button key={a} onClick={() => setAvatar(a)}
                  className="w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{
                    background: avatar === a ? '#404249' : '#1E1F22',
                    outline: avatar === a ? '2px solid #57F287' : '2px solid transparent',
                    outlineOffset: '2px'
                  }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="mb-5">
            <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{color:'#B5BAC1'}}>
              Name Color
            </p>
            <div className="flex gap-2.5 flex-wrap">
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full transition-all hover:scale-110"
                  style={{
                    background: c,
                    outline: color === c ? `3px solid ${c}` : '3px solid transparent',
                    outlineOffset: '3px',
                    border: c === '#FFFFFF' ? '1px solid #404249' : 'none'
                  }}/>
              ))}
            </div>
          </div>

          {/* Username */}
          <div className="mb-5">
            <p className="text-xs font-bold mb-2 uppercase tracking-wide" style={{color:'#B5BAC1'}}>
              Username
            </p>
            <input
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="Enter a username"
              maxLength={20}
              className="w-full px-3 py-2.5 rounded text-sm outline-none"
              style={{
                background:'#1E1F22',
                border: error ? '1px solid #ED4245' : '1px solid #1E1F22',
                color:'#DBDEE1',
              }}/>
            {error && (
              <p className="text-xs mt-1.5 flex items-center gap-1" style={{color:'#ED4245'}}>
                {error}
              </p>
            )}
          </div>

          {/* Preview */}
          {username.trim() && (
            <div className="mb-5 px-3 py-2.5 rounded flex items-center gap-3"
              style={{background:'#1E1F22'}}>
              <span className="text-xl">{avatar}</span>
              <span className="text-sm font-semibold" style={{color}}>{username}</span>
              <span className="text-xs ml-auto" style={{color:'#6D6F78'}}>preview</span>
            </div>
          )}

          <button onClick={handleJoin}
            className="w-full py-2.5 rounded text-sm font-bold flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-95"
            style={{background:'#57F287', color:'#000000'}}>
            Continue <ArrowRight size={16}/>
          </button>
        </div>

        <p className="text-center text-xs mt-4" style={{color:'#6D6F78'}}>
          No account needed — just pick a name and jump in
        </p>
      </div>
    </div>
  );
}
