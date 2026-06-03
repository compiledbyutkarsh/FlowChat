import { useState, useEffect, useRef } from 'react';
import { Send, Hash, Users, LogOut, Smile, Reply, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

export default function ChatRoom({ socket, user, onLeave }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState('general');
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [showUsers, setShowUsers] = useState(true);
  const bottomRef = useRef();
  const typingTimer = useRef();
  const inputRef = useRef();

  useEffect(() => {
    if (!socket) return;
    socket.emit('join', user);
    socket.on('rooms', setRooms);
    socket.on('room_history', ({ messages }) => setMessages(messages));
    socket.on('message', msg => setMessages(prev => [...prev, msg]));
    socket.on('users_list', setUsers);
    socket.on('typing', ({ username, typing: t }) => {
      setTyping(prev => t ? [...new Set([...prev, username])] : prev.filter(u => u !== username));
    });
    socket.on('reaction_update', ({ msgId, reactions }) => {
      setMessages(prev => prev.map(m => m.id === msgId ? {...m, reactions} : m));
    });
    return () => {
      socket.off('rooms'); socket.off('room_history'); socket.off('message');
      socket.off('users_list'); socket.off('typing'); socket.off('reaction_update');
    };
  }, [socket]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const switchRoom = (roomId) => {
    if (roomId === currentRoom) return;
    setCurrentRoom(roomId);
    setMessages([]);
    socket.emit('switch_room', roomId);
  };

  const sendMessage = () => {
    if (!text.trim()) return;
    socket.emit('message', { text: text.trim(), room: currentRoom, replyTo });
    setText(''); setReplyTo(null);
    socket.emit('typing', { room: currentRoom, typing: false });
  };

  const handleTyping = (val) => {
    setText(val);
    socket.emit('typing', { room: currentRoom, typing: true });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit('typing', { room: currentRoom, typing: false });
    }, 2000);
  };

  const addReaction = (msgId, emoji) => socket.emit('reaction', { msgId, room: currentRoom, emoji });

  const onEmojiClick = (emojiData) => {
    setText(prev => prev + emojiData.emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const formatTime = ts => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formatDate = ts => new Date(ts).toLocaleDateString([], { month:'long', day:'numeric', year:'numeric' });

  const onlineUsers = users.filter(u => u.room === currentRoom);
  const currentRoomData = rooms.find(r => r.id === currentRoom);

  return (
    <div className="flex h-screen overflow-hidden" style={{background:'#313338'}}>

      {/* Server sidebar */}
      <div className="w-16 flex flex-col items-center py-3 gap-2" style={{background:'#1E1F22'}}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg cursor-pointer hover:rounded-xl transition-all"
          style={{background:'#57F287', color:'#000'}}>
          FC
        </div>
        <div className="w-8 h-0.5 rounded-full my-1" style={{background:'#35373C'}}/>
        {rooms.map(r => (
          <button key={r.id} onClick={() => switchRoom(r.id)}
            title={r.name}
            className="w-12 h-12 rounded-3xl flex items-center justify-center text-lg cursor-pointer transition-all hover:rounded-xl"
            style={{
              background: currentRoom === r.id ? '#57F287' : '#313338',
              color: currentRoom === r.id ? '#000' : '#DBDEE1',
              borderRadius: currentRoom === r.id ? '16px' : '50%'
            }}>
            {r.name[0]}
          </button>
        ))}
      </div>

      {/* Channel sidebar */}
      <div className="w-56 flex flex-col" style={{background:'#2B2D31'}}>
        <div className="px-4 py-3 border-b flex items-center justify-between" style={{borderColor:'#1E1F22'}}>
          <span className="font-bold text-sm" style={{color:'#FFFFFF'}}>FlowChat</span>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          <p className="text-xs font-bold px-2 mb-1 flex items-center justify-between"
            style={{color:'#8D9096'}}>
            <span>TEXT CHANNELS</span>
          </p>
          {rooms.map(r => (
            <button key={r.id} onClick={() => switchRoom(r.id)}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded mb-0.5 text-left transition-all group"
              style={{
                background: currentRoom === r.id ? '#404249' : 'transparent',
                color: currentRoom === r.id ? '#FFFFFF' : '#8D9096'
              }}>
              <Hash size={16} style={{flexShrink:0}}/>
              <span className="text-sm font-medium truncate">{r.name.toLowerCase().replace(' ','-')}</span>
              {r.members > 0 && currentRoom !== r.id && (
                <span className="ml-auto text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold"
                  style={{background:'#ED4245', color:'white', fontSize:'10px'}}>{r.members}</span>
              )}
            </button>
          ))}
        </div>

        {/* User panel */}
        <div className="px-2 py-2 flex items-center gap-2" style={{background:'#232428'}}>
          <div className="relative flex-shrink-0">
            <span className="text-xl">{user.avatar}</span>
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
              style={{background:'#23A55A', borderColor:'#232428'}}/>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{color: user.color}}>{user.username}</p>
            <p className="text-xs" style={{color:'#8D9096'}}>Online</p>
          </div>
          <button onClick={onLeave} title="Leave"
            className="p-1.5 rounded transition-all hover:bg-white/10"
            style={{color:'#8D9096'}}>
            <LogOut size={15}/>
          </button>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b"
          style={{background:'#313338', borderColor:'#1E1F22'}}>
          <div className="flex items-center gap-2">
            <Hash size={20} style={{color:'#8D9096'}}/>
            <span className="font-bold" style={{color:'#FFFFFF'}}>
              {currentRoomData?.name.toLowerCase().replace(' ','-')}
            </span>
            <div className="w-px h-4 mx-1" style={{background:'#3F4147'}}/>
            <span className="text-sm" style={{color:'#8D9096'}}>{currentRoomData?.description}</span>
          </div>
          <button onClick={() => setShowUsers(!showUsers)}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded transition-all hover:bg-white/10"
            style={{color: showUsers ? '#FFFFFF' : '#8D9096'}}>
            <Users size={18}/>
            <span className="text-sm">{onlineUsers.length}</span>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Welcome message */}
          {messages.length === 0 && (
            <div className="mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                style={{background:'#404249'}}>
                <Hash size={32} style={{color:'#8D9096'}}/>
              </div>
              <h3 className="text-2xl font-bold mb-1" style={{color:'#FFFFFF'}}>
                Welcome to #{currentRoomData?.name.toLowerCase().replace(' ','-')}!
              </h3>
              <p style={{color:'#8D9096'}}>{currentRoomData?.description}</p>
            </div>
          )}

          <div className="space-y-0.5">
            {messages.map((msg, i) => {
              if (msg.type === 'system') return (
                <div key={msg.id} className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px" style={{background:'#3F4147'}}/>
                  <span className="text-xs px-2" style={{color:'#8D9096'}}>{msg.text}</span>
                  <div className="flex-1 h-px" style={{background:'#3F4147'}}/>
                </div>
              );

              const isMe = msg.sender?.id === socket?.id;
              const prevMsg = messages[i-1];
              const grouped = prevMsg?.sender?.id === msg.sender?.id && prevMsg?.type !== 'system'
                && (new Date(msg.timestamp) - new Date(prevMsg.timestamp)) < 300000;

              return (
                <div key={msg.id}
                  className="flex gap-4 px-2 py-0.5 rounded group transition-all msg-enter hover:bg-white/5"
                  style={{marginTop: grouped ? 0 : '16px'}}>
                  {!grouped
                    ? <span className="text-2xl flex-shrink-0 mt-0.5 w-10">{msg.sender?.avatar}</span>
                    : <div className="w-10 flex-shrink-0 flex items-center justify-end">
                        <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{color:'#8D9096', fontSize:'10px'}}>{formatTime(msg.timestamp)}</span>
                      </div>
                  }

                  <div className="flex-1 min-w-0">
                    {!grouped && (
                      <div className="flex items-baseline gap-2 mb-0.5">
                        <span className="font-semibold text-sm" style={{color: msg.sender?.color}}>
                          {msg.sender?.username}
                        </span>
                        <span className="text-xs" style={{color:'#8D9096'}}>{formatTime(msg.timestamp)}</span>
                      </div>
                    )}

                    {msg.replyTo && (
                      <div className="flex items-center gap-2 mb-1 text-xs" style={{color:'#8D9096'}}>
                        <div className="w-4 h-2 border-l-2 border-t-2 rounded-tl -mt-2 ml-3"
                          style={{borderColor:'#8D9096'}}/>
                        <span>Reply</span>
                      </div>
                    )}

                    <p className="text-sm leading-relaxed break-words" style={{color:'#DBDEE1'}}>
                      {msg.text}
                    </p>

                    {msg.reactions && Object.keys(msg.reactions).filter(e => msg.reactions[e].length > 0).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {Object.entries(msg.reactions).filter(([,ids]) => ids.length > 0).map(([emoji, ids]) => (
                          <button key={emoji} onClick={() => addReaction(msg.id, emoji)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all hover:brightness-125"
                            style={{
                              background: ids.includes(socket?.id) ? 'rgba(88,101,242,0.3)' : '#2B2D31',
                              border: ids.includes(socket?.id) ? '1px solid #5865F2' : '1px solid #3F4147'
                            }}>
                            <span>{emoji}</span>
                            <span style={{color:'#DBDEE1'}}>{ids.length}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Hover actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-start gap-1 pt-0.5 flex-shrink-0">
                    {['👍','❤️','😂','🔥'].map(e => (
                      <button key={e} onClick={() => addReaction(msg.id, e)}
                        className="w-7 h-7 rounded flex items-center justify-center text-sm transition-all hover:scale-110"
                        style={{background:'#2B2D31', border:'1px solid #3F4147'}}>
                        {e}
                      </button>
                    ))}
                    <button onClick={() => setReplyTo(msg)}
                      className="w-7 h-7 rounded flex items-center justify-center transition-all hover:bg-white/10"
                      style={{background:'#2B2D31', border:'1px solid #3F4147', color:'#B5BAC1'}}>
                      <Reply size={13}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {typing.length > 0 && (
            <div className="flex items-center gap-2 px-2 py-2 mt-1">
              <div className="flex gap-1">
                {[0,1,2].map(i => (
                  <div key={i} className="typing-dot" style={{animationDelay:`${i*0.15}s`}}/>
                ))}
              </div>
              <span className="text-xs" style={{color:'#B5BAC1'}}>
                <strong>{typing.join(', ')}</strong> {typing.length === 1 ? 'is' : 'are'} typing...
              </span>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>

        {/* Input */}
        <div className="px-4 pb-6 pt-2">
          {replyTo && (
            <div className="flex items-center justify-between px-4 py-2 mb-2 rounded-t-lg text-xs"
              style={{background:'#383A40', border:'1px solid #3F4147', borderBottom:'none'}}>
              <span style={{color:'#B5BAC1'}}>
                Replying to <span style={{color:replyTo.sender?.color}}>{replyTo.sender?.username}</span>
              </span>
              <button onClick={() => setReplyTo(null)} style={{color:'#8D9096'}}>
                <X size={14}/>
              </button>
            </div>
          )}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg"
            style={{background:'#383A40'}}>
            <input ref={inputRef} value={text}
              onChange={e => handleTyping(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={`Message #${currentRoomData?.name?.toLowerCase().replace(' ','-') || ''}`}
              className="flex-1 bg-transparent outline-none text-sm"
              style={{color:'#DBDEE1'}}/>
            <div className="relative flex-shrink-0">
              <button onClick={() => setShowEmoji(!showEmoji)}
                className="transition-all hover:scale-110"
                style={{color: showEmoji ? '#57F287' : '#8D9096'}}>
                <Smile size={20}/>
              </button>
              {showEmoji && (
                <div className="absolute bottom-10 right-0 z-50">
                  <EmojiPicker onEmojiClick={onEmojiClick} theme="dark" width={300} height={380}/>
                </div>
              )}
            </div>
            <button onClick={sendMessage} disabled={!text.trim()}
              className="transition-all hover:scale-110 disabled:opacity-30"
              style={{color: text.trim() ? '#57F287' : '#8D9096'}}>
              <Send size={20}/>
            </button>
          </div>
        </div>
      </div>

      {/* Online users */}
      {showUsers && (
        <div className="w-56 flex flex-col border-l" style={{background:'#2B2D31', borderColor:'#1E1F22'}}>
          <div className="px-3 pt-4 pb-2">
            <p className="text-xs font-bold uppercase tracking-wide" style={{color:'#8D9096'}}>
              Online — {onlineUsers.length}
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            {onlineUsers.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-2 py-2 rounded cursor-pointer transition-all hover:bg-white/10">
                <div className="relative flex-shrink-0">
                  <span className="text-xl">{u.avatar}</span>
                  <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
                    style={{background:'#23A55A', borderColor:'#2B2D31'}}/>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{color: u.color}}>{u.username}</p>
                  {u.id === socket?.id && (
                    <p className="text-xs" style={{color:'#8D9096'}}>— you</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
