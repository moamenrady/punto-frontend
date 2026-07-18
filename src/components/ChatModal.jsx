import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { Send, MoreVertical, Phone, Video, Paperclip, Smile, X, Check, Mic, Search, MessageSquare } from 'lucide-react';
import Avatar from './Avatar';
import { AiFeatures } from '../services/aiOpsService';

const socket = io('https://punto-production-21ed.up.railway.app');

const ChatModal = ({ chatType, chatId, team, contact, user, theme, onClose, onStartDM }) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState("");
    const [showInfo, setShowInfo] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        if (chatType === 'team') {
            setShowInfo(true);
        } else {
            setShowInfo(false);
        }
    }, [chatType, chatId]);
    const scrollRef = useRef();

    const isDark = theme.bg.includes('12102A') || theme.bg.includes('dark');

    const waTheme = isDark ? {
        headerBg: 'bg-[#202c33]',
        headerText: 'text-[#e9edef]',
        chatBg: 'bg-[#0b141a]',
        inputBg: 'bg-[#202c33]',
        myBubble: 'bg-[#005c4b] text-[#e9edef]',
        otherBubble: 'bg-[#202c33] text-[#e9edef]',
        timestamp: 'text-[#8696a0]',
        inputBar: 'bg-[#2a3942] text-[#e9edef]',
        icon: 'text-[#aebac1]',
        infoBg: 'bg-[#111b21]',
        infoSection: 'bg-[#111b21]',
        border: 'border-[#222d34]',
        hover: 'hover:bg-[#202c33]'
    } : {
        headerBg: 'bg-[#f0f2f5]',
        headerText: 'text-[#111b21]',
        chatBg: 'bg-[#efeae2]',
        inputBg: 'bg-[#f0f2f5]',
        myBubble: 'bg-[#d9fdd3] text-[#111b21]',
        otherBubble: 'bg-white text-[#111b21]',
        timestamp: 'text-[#667781]',
        inputBar: 'bg-white text-[#111b21]',
        icon: 'text-[#54656f]',
        infoBg: 'bg-[#f0f2f5]',
        infoSection: 'bg-[#ffffff]',
        border: 'border-[#d1d7db]',
        hover: 'hover:bg-[#f5f6f6]'
    };

    useEffect(() => {
        if (chatType === 'ai') {
            const savedMessages = localStorage.getItem('ai_chat_history');
            if (savedMessages) {
                setMessages(JSON.parse(savedMessages));
            }
            return;
        }

        socket.emit('join_chat', chatId);

        axios.get(`https://punto-production-21ed.up.railway.app/api/v1/messages/${chatId}`)
             .then(res => setMessages(res.data))
             .catch(err => console.error("Error fetching messages:", err));

        const handleReceive = (msg) => {
            if (msg.chatId !== chatId) return;
            setMessages(prev => {
                if(prev.find(m => m._id === msg._id)) return prev;
                return [...prev, msg];
            });
        };

        socket.on('receive_message', handleReceive);

        return () => {
            socket.off('receive_message', handleReceive);
        };
    }, [chatId, chatType]);

    useEffect(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), [messages]);

    const send = async () => {
        if (!text.trim()) return;

        if (chatType === 'ai') {
            const userMessage = {
                _id: Date.now().toString(),
                senderId: user._id,
                senderName: user.name,
                text: text,
                createdAt: new Date().toISOString()
            };

            setMessages(prev => {
                const updated = [...prev, userMessage];
                localStorage.setItem('ai_chat_history', JSON.stringify(updated));
                return updated;
            });
            setText("");
            setIsTyping(true);
            try {
                const companyId = user?.company_id || "6a507510dd2a7f81a83e71ba";

                const priorHistory = messages.map((m) => ({
                    role: m.senderId === 'ai_assistant' ? 'assistant' : 'user',
                    content: m.text,
                }));

                const data = await AiFeatures.sendChatMessage({
                    query: text,
                    userRole: user.role || 'user',
                    userId: user._id,
                    companyId: companyId,
                    chatHistory: priorHistory,
                });

                const aiResponseText = data?.response ?? data?.answer ?? data?.message ?? "I received an empty response from my server. Please try again.";

                const aiMessage = {
                    _id: (Date.now() + 1).toString(),
                    senderId: 'ai_assistant',
                    senderName: 'AI Assistant',
                    text: aiResponseText,
                    createdAt: new Date().toISOString()
                };

                setMessages(prev => {
                    const updated = [...prev, aiMessage];
                    localStorage.setItem('ai_chat_history', JSON.stringify(updated));
                    return updated;
                });
            } catch (err) {
                console.error("AI Chat Error:", err);
                const errorMessage = {
                    _id: (Date.now() + 1).toString(),
                    senderId: 'ai_assistant',
                    senderName: 'AI Assistant',
                    text: `Sorry, I'm having trouble connecting to my brain right now (${err.message}). Please try again later.`,
                    createdAt: new Date().toISOString()
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsTyping(false);
            }
            return;
        }

        socket.emit('send_message', { 
            chatId, 
            teamId: chatType === 'team' ? team?._id : undefined,
            senderId: user._id, 
            senderName: user.name, 
            text 
        });
        setText("");
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            send();
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const chatTitle = chatType === 'ai' ? 'Chat with AI' : (chatType === 'team' ? (team?.name || 'Team Chat') : (contact?.name || 'Direct Message'));
    const chatSubTitle = chatType === 'ai' 
        ? 'Active • OmniSuite Assistant'
        : (chatType === 'team' 
            ? (team?.members?.map(m => {
                const u = m.user || m;
                return u?.name?.split(' ')[0] || '';
              }).filter(Boolean).join(', ') || 'tap here for team info') 
            : (contact?.email || 'tap here for contact info'));
    
    return (
        <div className="w-full h-full flex overflow-hidden">
            <div className={`flex-1 flex flex-col overflow-hidden relative ${waTheme.chatBg}`}>
                <div 
                    className={`${waTheme.headerBg} ${waTheme.headerText} px-4 py-2.5 flex items-center justify-between border-b ${waTheme.border} z-10 shrink-0 h-[60px] cursor-pointer`}
                    onClick={() => setShowInfo(!showInfo)}
                >
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden shrink-0">
                            {chatType === 'ai' ? (
                                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                                        <path d="M12 8v4"/>
                                        <path d="M12 16h.01"/>
                                    </svg>
                                </div>
                            ) : chatType === 'team' ? (
                                <Avatar name={`Team+${team?._id?.substring(0, 2) || 'XX'}`} size={40} className="w-full h-full" />
                            ) : (
                                <Avatar photo={contact?.photo} name={contact?.name} size={40} className="w-full h-full" />
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="font-medium text-[16px] leading-tight">{chatTitle}</span>
                            <span className={`text-[13px] ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'} line-clamp-1`}>
                                {chatSubTitle}
                            </span>
                        </div>
                    </div>
                    <div className={`flex items-center gap-5 ${isDark ? 'text-[#aebac1]' : 'text-[#54656f]'}`} onClick={(e) => e.stopPropagation()}>
                        <Video size={20} className="cursor-pointer hover:opacity-80 transition-opacity hidden sm:block" />
                        <Search size={19} className="cursor-pointer hover:opacity-80 transition-opacity hidden sm:block" />
                        <MoreVertical size={20} className="cursor-pointer hover:opacity-80 transition-opacity" />
                        {onClose && (
                            <button onClick={onClose} className="hover:bg-black/5 p-1.5 rounded-full transition-colors md:hidden">
                                <X size={22} />
                            </button>
                        )}
                    </div>
                </div>

                <div className={`flex-1 overflow-y-auto p-4 sm:p-8 space-y-2 ${waTheme.chatBg}`}
                     style={{
                         backgroundImage: isDark ? 'none' : 'url("https://w0.peakpx.com/wallpaper/818/148/HD-wallpaper-whatsapp-background-cool-dark-green-new-theme-whatsapp.jpg")',
                         backgroundSize: 'cover',
                         backgroundPosition: 'center',
                         backgroundBlendMode: isDark ? 'normal' : 'soft-light'
                     }}>
                    
                    <div className="text-center my-4">
                        <span className={`text-[12.5px] px-4 py-1.5 rounded-lg ${isDark ? 'bg-[#182229] text-[#ffd17d]' : 'bg-[#fff5c4] text-[#54656f] shadow-sm'} inline-block max-w-[85%] leading-relaxed`}>
                            <span className="mr-1">🔒</span> Messages and calls are end-to-end encrypted. No one outside of this chat, not even OmniSuite, can read or listen to them. Tap to learn more.
                        </span>
                    </div>

                    {messages.map((m, i) => {
                        const isMe = m.senderId === user._id;
                        const showName = !isMe && (i === 0 || messages[i - 1].senderId !== m.senderId);

                        return (
                            <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-[2px]`}>
                                <div className={`relative max-w-[85%] sm:max-w-[65%] px-2.5 py-1.5 rounded-lg shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] flex flex-col ${isMe ? waTheme.myBubble + ' rounded-tr-none' : waTheme.otherBubble + ' rounded-tl-none'}`}>
                                    
                                    {showName && (chatType === 'team' || chatType === 'ai') && (
                                        <span className={`text-[13px] font-medium mb-0.5 ${isDark ? 'text-[#53bdeb]' : 'text-[#128c7e]'}`}>
                                            {m.senderName}
                                        </span>
                                    )}

                                    <div className="flex flex-wrap items-end gap-3 relative">
                                        <span className="text-[14.2px] leading-[19px] whitespace-pre-wrap break-words pb-1 min-w-[50px]">
                                            {m.text}
                                        </span>
                                        
                                        <div className={`flex items-center gap-1 ml-auto shrink-0 mb-[-2px] float-right ${waTheme.timestamp}`}>
                                            <span className="text-[11px] mt-1">
                                                {formatTime(m.createdAt)}
                                            </span>
                                            {isMe && (
                                                <Check size={14} className={waTheme.timestamp} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {isTyping && (
                        <div className="flex flex-col items-start mb-2">
                            <div className={`relative px-3 py-2 rounded-lg shadow-sm flex flex-col ${waTheme.otherBubble} rounded-tl-none`}>
                                <span className={`text-[13px] font-medium mb-1 ${isDark ? 'text-[#53bdeb]' : 'text-[#128c7e]'}`}>AI Assistant</span>
                                <div className="flex gap-1 items-center h-4 px-1">
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={scrollRef} />
                </div>

                <div className={`${waTheme.inputBg} px-4 py-2.5 flex items-end gap-3 shrink-0 min-h-[62px]`}>
                    <button className={`p-2 rounded-full hover:bg-black/5 transition-colors ${waTheme.icon} shrink-0`}>
                        <Smile size={26} strokeWidth={1.5} />
                    </button>
                    <button className={`p-2 rounded-full hover:bg-black/5 transition-colors ${waTheme.icon} shrink-0 hidden sm:block`}>
                        <Paperclip size={24} strokeWidth={1.5} />
                    </button>
                    
                    <div className={`flex-1 min-h-[42px] rounded-lg flex items-center px-4 overflow-hidden ${waTheme.inputBar}`}>
                        <textarea 
                            className="w-full bg-transparent outline-none resize-none max-h-[120px] py-2.5 text-[15px] leading-snug" 
                            rows="1"
                            placeholder="Type a message"
                            value={text} 
                            onChange={e => {
                                setText(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = (e.target.scrollHeight < 120 ? e.target.scrollHeight : 120) + 'px';
                            }}
                            onKeyDown={handleKeyDown}
                            style={{ height: '42px' }}
                        />
                    </div>

                    {text.trim() ? (
                        <button 
                            onClick={send} 
                            className={`p-2 rounded-full ${isDark ? 'bg-[#00a884] text-[#111b21]' : 'text-[#54656f] hover:bg-black/5'} transition-colors shrink-0 flex items-center justify-center`}
                        >
                            <Send size={24} className={isDark ? "ml-0.5" : ""} />
                        </button>
                    ) : (
                        <button className={`p-2 rounded-full hover:bg-black/5 transition-colors ${waTheme.icon} shrink-0`}>
                            <Mic size={24} strokeWidth={1.5} />
                        </button>
                    )}
                </div>
            </div>

            {showInfo && (
                <div className={`w-[320px] lg:w-[380px] flex flex-col border-l ${waTheme.border} ${waTheme.infoBg} transition-all duration-300 z-20`}>
                    <div className={`h-[60px] flex items-center px-4 gap-4 ${waTheme.headerBg} ${waTheme.headerText} shrink-0 border-b ${waTheme.border}`}>
                        <button onClick={() => setShowInfo(false)} className={`hover:bg-black/5 p-1 rounded-full transition-colors ${waTheme.icon}`}>
                            <X size={24} />
                        </button>
                        <span className="font-medium text-[16px]">{chatType === 'team' ? 'Team info' : 'Contact info'}</span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className={`flex flex-col items-center py-8 px-6 mb-2 shadow-sm ${waTheme.infoSection}`}>
                            <div className="w-[200px] h-[200px] rounded-full bg-gray-300 overflow-hidden mb-5">
                                {chatType === 'ai' ? (
                                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white">
                                        <svg viewBox="0 0 24 24" width="100" height="100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                                            <path d="M12 8v4"/>
                                            <path d="M12 16h.01"/>
                                        </svg>
                                    </div>
                                ) : chatType === 'team' ? (
                                    <Avatar name={`Team+${team?._id?.substring(0, 2) || 'XX'}`} size={200} className="w-full h-full" />
                                ) : (
                                    <Avatar photo={contact?.photo} name={contact?.name} size={200} className="w-full h-full" />
                                )}
                            </div>
                            <h2 className={`text-[24px] text-center mb-1 ${waTheme.headerText}`}>{chatTitle}</h2>
                            <p className={`text-[14px] text-center ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
                                {chatType === 'ai' ? 'OmniSuite Virtual Assistant' : (chatType === 'team' ? `Team group • ${team?.members?.length || 0} members` : contact?.email)}
                            </p>
                        </div>

                        {chatType === 'team' && (
                            <div className={`px-6 py-4 mb-2 shadow-sm ${waTheme.infoSection}`}>
                                <div className={`text-[14px] mb-2 ${isDark ? 'text-[#00a884]' : 'text-[#008069]'}`}>Description</div>
                                <p className={`text-[15px] ${waTheme.headerText}`}>
                                    {team?.description || 'No description available for this team.'}
                                </p>
                            </div>
                        )}

                        {chatType === 'team' && (
                            <div className={`shadow-sm pb-4 ${waTheme.infoSection}`}>
                                <div className={`px-6 py-4 text-[14px] ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
                                    {team?.members?.length || 0} members
                                </div>
                                <div className="flex flex-col">
                                    {team?.members?.map((member, idx) => {
                                        const u = member.user || member;
                                        const isMe = u?._id === user._id;
                                        return (
                                            <div 
                                                key={idx} 
                                                onClick={() => !isMe && onStartDM && onStartDM(u)}
                                                className={`flex items-center gap-4 px-6 py-2.5 ${isMe ? '' : waTheme.hover + ' cursor-pointer'} transition-colors`}
                                            >
                                                <div className="w-[40px] h-[40px] rounded-full overflow-hidden shrink-0">
                                                    <Avatar photo={u?.photo} name={u?.name} size={40} className="w-full h-full" />
                                                </div>
                                                <div className={`flex-1 border-b ${waTheme.border} pb-3 pt-1 flex flex-col justify-center h-full`}>
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-[16px] ${isMe ? 'font-medium' : ''} ${waTheme.headerText}`}>
                                                            {isMe ? 'You' : u?.name}
                                                        </span>
                                                        {member.role === 'admin' && (
                                                            <span className={`text-[12px] px-2 py-0.5 rounded border ${isDark ? 'border-[#00a884] text-[#00a884]' : 'border-[#008069] text-[#008069]'}`}>
                                                                Admin
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className={`text-[13px] ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'}`}>
                                                        {u?.email}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {(chatType === 'dm' || chatType === 'ai') && (
                            <div className={`px-6 py-4 mb-2 shadow-sm ${waTheme.infoSection} flex flex-col gap-4`}>
                                <div className={`flex flex-col gap-1 ${waTheme.headerText}`}>
                                    <span className="text-[16px]">Role: {chatType === 'ai' ? 'Assistant' : (contact?.role || 'User')}</span>
                                </div>
                                <div className="border-t border-b py-4 my-2 border-dashed border-gray-300 dark:border-gray-700">
                                    <p className={`text-[14px] ${isDark ? 'text-[#8696a0]' : 'text-[#667781]'} text-center`}>
                                        {chatType === 'ai' ? 'AI-powered support for your workspace.' : 'End-to-end encrypted direct messaging channel.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatModal;