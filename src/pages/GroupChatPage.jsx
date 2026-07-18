import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ChatModal from '../components/ChatModal';
import { Search, MoreVertical, MessageSquare } from 'lucide-react';
import Avatar from '../components/Avatar';

const GroupChatPage = ({ user, theme, onProfileClick }) => {
    const [myTeams, setMyTeams] = useState([]); // List of teams user is in
    const [activeChat, setActiveChat] = useState(null); // { type: 'team' | 'dm' | 'ai', data: any, id: string }
    const [activeDMs, setActiveDMs] = useState([]); // List of users
    const [loading, setLoading] = useState(true);

    const isDark = theme.bg.includes('12102A') || theme.bg.includes('dark');
    
    const waLayout = isDark ? {
        sidebarBg: 'bg-[#111b21]',
        sidebarHeader: 'bg-[#202c33]',
        border: 'border-[#222d34]',
        hover: 'hover:bg-[#202c33]',
        textMain: 'text-[#e9edef]',
        textSec: 'text-[#8696a0]',
        searchBg: 'bg-[#202c33]',
        emptyBg: 'bg-[#222e35]'
    } : {
        sidebarBg: 'bg-[#ffffff]',
        sidebarHeader: 'bg-[#f0f2f5]',
        border: 'border-[#e9edef]',
        hover: 'hover:bg-[#f5f6f6]',
        textMain: 'text-[#111b21]',
        textSec: 'text-[#667781]',
        searchBg: 'bg-[#f0f2f5]',
        emptyBg: 'bg-[#f0f2f5]'
    };

    useEffect(() => {
        const fetchMyTeamAndDMs = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                const headers = { 'Authorization': `Bearer ${token}` };
                
                // Fetch Teams (Get all teams and filter for current user's membership)
                try {
                    const teamsRes = await axios.get(`https://punto-production-21ed.up.railway.app/api/v1/teams`, { headers });
                    const allTeams = teamsRes.data.data?.data || [];
                    const userTeams = allTeams.filter(t => 
                        t.members?.some(m => (m.user?._id || m.user) === user._id)
                    );
                    setMyTeams(userTeams);
                } catch (err) {
                    console.error("Error fetching all teams, trying fallback user endpoint:", err.message);
                    try {
                        const teamRes = await axios.get(`https://punto-production-21ed.up.railway.app/api/v1/teams/user/${user._id}`, { headers });
                        if (teamRes.data) {
                            setMyTeams([teamRes.data]);
                        } else {
                            setMyTeams([]);
                        }
                    } catch (fallbackErr) {
                        console.error("Fallback team fetch failed:", fallbackErr.message);
                        setMyTeams([]);
                    }
                }

                // Fetch Active DMs
                try {
                    const dmRes = await axios.get(`https://punto-production-21ed.up.railway.app/api/v1/messages/dms/user/${user._id}`, { headers });
                    setActiveDMs(dmRes.data);
                } catch (err) {
                    console.error("Error fetching DMs:", err.message);
                }

            } finally {
                setLoading(false);
            }
        };

        if (user?._id) {
            fetchMyTeamAndDMs();
        }
    }, [user._id]);

    const handleStartDM = (member) => {
        if (member._id === user._id) return;
        
        if (!activeDMs.find(u => u._id === member._id)) {
            setActiveDMs(prev => [...prev, member]);
        }
        
        const dmChatId = [user._id, member._id].sort().join('_');
        setActiveChat({ type: 'dm', data: member, id: dmChatId });
    };

    if (loading) return (
        <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00a884]"></div>
        </div>
    );

    return (
        <div className={`flex w-full h-full overflow-hidden ${isDark ? 'bg-[#111b21]' : 'bg-[#e9edef]'}`}>
            {/* Sidebar */}
            <div className={`w-full md:w-[35%] lg:w-[30%] min-w-[300px] max-w-[420px] flex flex-col border-r ${waLayout.border} ${waLayout.sidebarBg} ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                {/* Sidebar Header */}
                <div className={`px-4 py-3 flex justify-between items-center ${waLayout.sidebarHeader} h-[60px] shrink-0`}>
                    <div 
                        className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => onProfileClick && onProfileClick(user)}
                    >
                        <Avatar photo={user?.avatar || user?.photo} name={user?.name} size={40} className="w-full h-full" />
                    </div>
                    <div className={`flex gap-5 ${isDark ? 'text-[#aebac1]' : 'text-[#54656f]'}`}>
                        <MessageSquare size={20} className="cursor-pointer hover:opacity-80 transition-opacity" />
                        <MoreVertical size={20} className="cursor-pointer hover:opacity-80 transition-opacity" />
                    </div>
                </div>

                {/* Search Bar */}
                <div className={`px-3 py-2 border-b ${waLayout.border}`}>
                    <div className={`flex items-center gap-4 px-4 py-1.5 rounded-lg ${waLayout.searchBg}`}>
                        <Search size={18} className={waLayout.textSec} />
                        <input 
                            type="text" 
                            placeholder="Search or start new chat" 
                            className={`bg-transparent outline-none flex-1 text-sm py-0.5 ${waLayout.textMain} placeholder:text-[14px]`}
                        />
                    </div>
                </div>

                {/* Chat List */}
                <div className="flex flex-col h-full overflow-hidden">
                    {/* Fixed AI Chat Item */}
                    <div 
                        onClick={() => setActiveChat({ type: 'ai', id: 'ai_chat' })}
                        className={`flex items-center gap-3 px-3 py-2 cursor-pointer border-b ${waLayout.border} ${waLayout.hover} ${activeChat?.id === 'ai_chat' ? waLayout.sidebarHeader : ''}`}
                    >
                        <div className="w-[48px] h-[48px] rounded-full overflow-hidden shrink-0 ml-1 bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
                                <path d="M12 8v4"/>
                                <path d="M12 16h.01"/>
                            </svg>
                        </div>
                        <div className="flex-1 pb-3 pt-2">
                            <div className="flex justify-between items-center mb-0.5">
                                <h3 className={`font-bold text-[17px] ${waLayout.textMain} truncate`}>Chat with AI</h3>
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#00a884] text-white font-bold uppercase tracking-wider">Assistant</span>
                            </div>
                            <p className={`text-[14px] ${waLayout.textSec} truncate italic`}>Ask anything about your workspace...</p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {/* Team Chat Items */}
                        {myTeams.map(team => (
                            <div 
                                key={team._id}
                                onClick={() => setActiveChat({ type: 'team', data: team, id: team._id })}
                                className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${waLayout.hover} ${activeChat?.id === team._id ? waLayout.sidebarHeader : ''}`}
                            >
                                <div className="w-[48px] h-[48px] rounded-full overflow-hidden shrink-0 ml-1">
                                    <Avatar name={`Team+${team._id.substring(0,2)}`} size={48} className="w-full h-full" />
                                </div>
                                <div className={`flex-1 border-b pb-3 pt-2 ${waLayout.border}`}>
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className={`font-normal text-[17px] ${waLayout.textMain} truncate`}>{team.name}</h3>
                                        <span className={`text-[12px] ${waLayout.textSec}`}>Group</span>
                                    </div>
                                    <p className={`text-[14px] ${waLayout.textSec} truncate`}>{team.description || 'Welcome to the team chat!'}</p>
                                </div>
                            </div>
                        ))}
                        
                        {/* Active DMs Items */}
                        {activeDMs.map(dm => (
                            <div 
                                key={dm._id}
                                onClick={() => handleStartDM(dm)}
                                className={`flex items-center gap-3 px-3 py-2 cursor-pointer ${waLayout.hover} ${activeChat?.data?._id === dm._id ? waLayout.sidebarHeader : ''}`}
                            >
                                <div className="w-[48px] h-[48px] rounded-full overflow-hidden shrink-0 ml-1">
                                    <Avatar photo={dm.photo} name={dm.name} size={48} className="w-full h-full" />
                                </div>
                                <div className={`flex-1 border-b pb-3 pt-2 ${waLayout.border}`}>
                                    <div className="flex justify-between items-center mb-0.5">
                                        <h3 className={`font-normal text-[17px] ${waLayout.textMain} truncate`}>{dm.name}</h3>
                                        <span className={`text-[12px] ${waLayout.textSec}`}>Direct</span>
                                    </div>
                                    <p className={`text-[14px] ${waLayout.textSec} truncate`}>{dm.email}</p>
                                </div>
                            </div>
                        ))}

                        {myTeams.length === 0 && activeDMs.length === 0 && (
                            <div className={`p-8 text-center ${waLayout.textSec}`}>
                                No active chats.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col ${activeChat ? 'flex' : 'hidden md:flex'} ${!activeChat ? waLayout.emptyBg : ''} border-l ${waLayout.border}`}>
                {activeChat ? (
                    <ChatModal 
                        chatType={activeChat.type}
                        chatId={activeChat.id}
                        team={activeChat.type === 'team' ? activeChat.data : null}
                        contact={activeChat.type === 'dm' ? activeChat.data : null}
                        user={user} 
                        theme={theme} 
                        onClose={() => setActiveChat(null)} 
                        onStartDM={handleStartDM}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-b-[6px] border-[#25D366]">
                        <div className="mb-8 opacity-70">
                            <svg className="w-[280px] h-[280px] text-gray-300 dark:text-gray-700" viewBox="0 0 400 400" fill="currentColor">
                                <path d="M200 40C111.63 40 40 111.63 40 200C40 288.37 111.63 360 200 360C288.37 360 360 288.37 360 200C360 111.63 288.37 40 200 40ZM200 336C124.9 336 64 275.1 64 200C64 124.9 124.9 64 200 64C275.1 64 336 124.9 336 200C336 275.1 275.1 336 200 336Z"/>
                                <path d="M268 200H132C125.37 200 120 194.63 120 188V132C120 125.37 125.37 120 132 120H268C274.63 120 280 125.37 280 132V188C280 194.63 274.63 200 268 200ZM144 144V176H256V144H144Z"/>
                                <path d="M268 280H132C125.37 280 120 274.63 120 268V212C120 205.37 125.37 200 132 200H268C274.63 200 280 205.37 280 212V268C280 274.63 274.63 280 268 280ZM144 224V256H256V224H144Z"/>
                            </svg>
                        </div>
                        <h2 className={`text-3xl font-light mb-4 ${waLayout.textMain}`}>OmniSuite Web</h2>
                        <p className={`${waLayout.textSec} max-w-[420px] text-[14px] leading-relaxed`}>
                            Send and receive messages without keeping your phone online. 
                            <br/>
                            Use OmniSuite on up to 4 linked devices and 1 phone at the same time.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GroupChatPage;