import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import './App.css';

function App() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);

    const handleLogin = async () => {
        try {
            const res = await axios.post('http://10.10.10.105:5000/login', { username, password });
            setToken(res.data.token);
            setLoggedIn(true);
        } catch (err) {
            console.error(err);
            alert('Login failed');
        }
    };

    const handleRegister = async () => {
        try {
            let resp=await axios.post('http://10.10.10.105:5000/register', { username, password });
            alert(resp.data.message);
            //console.log(resp);
        } catch (err) {
            console.error(err);
            alert('Registration failed');
        }
    };

    if (loggedIn) {
        return <Chat username={username} token={token} />;
    }

    return (
    <div className="lg:content-auto">
      <header className="App-header"></header>
      <div className='body-bar'>
        <div className='bodycontent max-w-sm p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700 sm:mt-20'>
          <div className='mx-auto max-w-sm text-center'>
            <h2 className="text-3xl font-bold tracking-tight text-white-900 sm:text-4xl">Login</h2>
            <form className="mx-auto mt-6 max-w-xl sm:mt-10" onSubmit={(event)=>{event.preventDefault()}}>
              <div className="grid grid-cols-20 gap-x-4 gap-y-6 sm:grid-cols-20">
                <div>
                  <div className="mt-2.5">
                    <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                </div>
                <div>
                  <div className="mt-2.5">
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                </div>
                <div>
                  <div className="mt-2.5">
                    <button onClick={handleLogin}>Login</button>
                  </div>
                </div>
                <div>
                  <div className="mt-2.5">
                    <button onClick={handleRegister}>Register</button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
    );
}

function Chat({ username, token }) {
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const socket = useRef(null);
    const chatContainerRef = useRef(null);

    // useEffect(() => {
    //     axios.get('http://10.10.12.73:5000/messages', { headers: { Authorization: token } })
    //         .then((res) => setMessages(res.data))
    //         .catch((err) => console.error(err));

    //     socket.current = io('http://10.10.12.73:5000');
    //     socket.current.on('receiveMessage', (message) => {
    //         setMessages((prevMessages) => [...prevMessages, message]);
    //     });

    //     return () => {
    //         socket.current.disconnect();
    //     };
    // }, [token]);
    const fetchMessages = async (pageNumber) => {
      setLoading(true);
      try {
        const res = await axios.get(`http://10.10.10.105:5000/messages?page=${pageNumber}`, {
          headers: { Authorization: token },
        });
        setMessages((prevMessages) => [...res.data, ...prevMessages]);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    useEffect(() => {
      fetchMessages(page);
      socket.current = io('http://10.10.10.105:5000');
      socket.current.on('receiveMessage', (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });
      return () => {
        socket.current.disconnect();
      };
  }, [page, token]);

    useEffect(() => {
      if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
  }, [messages]);

    const sendMessage = () => {
      if(!message){
        return false;
      }
        const newMessage = { sender: username, content: message };
        socket.current.emit('sendMessage', newMessage);
        setMessage('');  // Clear the input field after sending
    };

    const handleKeyPress = (event) => {
      if (event.key === 'Enter') {
          sendMessage();
      }
  };

  const handleScroll = () => {
    if (chatContainerRef.current.scrollTop === 0 && !loading) {
        setPage((prevPage) => prevPage + 1);
    }
  };

    return (
      <div className="container">
      <div className="flex h-screen">
        <div className="w-1/4 bg-white border-r border-gray-300 overflow-y-auto">
          <div className="flex items-center p-4 border-b border-gray-300">
            <div className="flex-shrink-0 mr-4">
              <img className="w-12 h-12 rounded-full" src="https://i.imgur.com/MK3eW3Am.jpg" alt="User Avatar" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">John Doe</h2>
              <p className="text-gray-600 text-sm">Online</p>
            </div>
          </div>
          <div className="p-4">
            <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500" placeholder="Search" />
          </div>
          <ul className="divide-y divide-gray-300">
            <li className="p-4 hover:bg-gray-100 cursor-pointer">
              <div className="flex items-center">
                <img className="w-10 h-10 rounded-full" src="https://via.placeholder.com/50" alt="User Avatar" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Jane Doe</h3>
                  <p className="text-gray-600 text-sm">Hey, how are you?</p>
                </div>
              </div>
            </li>
            <li className="p-4 hover:bg-gray-100 cursor-pointer">
              <div className="flex items-center">
                <img className="w-10 h-10 rounded-full" src="https://via.placeholder.com/50" alt="User Avatar" />
                <div className="ml-4">
                  <h3 className="text-lg font-semibold">Alice</h3>
                  <p className="text-gray-600 text-sm">Can you send me the file?</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
        <div className="flex-1 bg-white border-r border-gray-300 overflow-y-auto">
          <div className="p-4 border-b border-gray-300">
            <h2 className="text-lg font-semibold">ChatGPT</h2>
            <p className="text-gray-600 text-sm">GPT 4o</p>
          </div>
          <div className="p-4 chathis" onScroll={handleScroll} ref={chatContainerRef} style={{ overflowY: 'scroll', border: '1px solid grey', padding: '10px',height: '350px' }}>
            {/* <div className="flex items-start mb-4">
              <img className="w-10 h-10 rounded-full" src="https://via.placeholder.com/50" alt="User Avatar" />
              <div className="ml-4">
                <p className="text-gray-800 text-sm">Hey, how are you?</p>
                <p className="text-gray-500 text-xs">11:30 AM</p>
              </div>
            </div> */}
                {loading && <div>Loading...</div>}
                {messages.map((msg, index) => (
                    // <div key={index} style={{ textAlign: msg.sender === username ? 'right' : 'left' }}>
                    //     <strong>{msg.sender === username ? 'Me' : msg.sender}: </strong>{msg.content}
                    // </div>
                    <div key={index} className={ msg.sender === username ? 'flex items-end justify-end mb-2' : 'flex items-start mb-2' }>
                      { msg.sender === username ?'':<img className="w-10 h-10 rounded-full" src="https://via.placeholder.com/50" alt="User Avatar" />}
                      <div className={ msg.sender === username ? 'bg-blue-500 text-white text-sm rounded-lg py-2 px-4 max-w-xs' : 'ml-4'}>
                      {msg.sender === username ? msg.content :<div><p className="text-gray-800 text-sm">{msg.content}</p><p className="text-gray-500 text-xs">{msg.sender === username ? 'Me' : msg.sender}</p></div> }
                    </div>
                    </div>
                    
                ))}
            {/* <div className="flex items-end justify-end mb-4">
            <div className="bg-blue-500 text-white text-sm rounded-lg py-2 px-4 max-w-xs">
              Hi, I'm good. Thanks!
            </div>
          </div> */}
        </div>
          <div className='msg-bar-div'>
            <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} onKeyDown={handleKeyPress}/>
            <button onClick={sendMessage} className='send-button'>
            <svg class="send-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/>
            </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
    );
}

export default App;
