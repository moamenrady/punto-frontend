import React from 'react';

const Avatar = ({ photo, name = '?', size = 26, className = '', style = {} }) => {
    // Determine the actual image source
    let src = '';
    
    // Team check (teams often have an _id in name or we can just render the name)
    const isTeam = name.startsWith('Team+');

    if (photo) {
        src = photo.startsWith('http') || photo.startsWith('data:') ? photo : `https://punto-production-21ed.up.railway.app${photo}`;
    } else {
        src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=random&size=${size * 2}`;
    }

    return (
        <img 
            src={src} 
            alt={name.replace('Team+', 'Team ')} 
            style={{ 
                width: size, 
                height: size, 
                borderRadius: '50%', 
                objectFit: 'cover', 
                flexShrink: 0,
                ...style
            }} 
            className={className} 
        />
    );
};

export default Avatar;
