import React from 'react';

const Avatar = ({ photo, name = '?', size = 26, className = '', style = {} }) => {
    // Determine if the photo is a default/placeholder or invalid string
    const isDefault = !photo || 
                      photo === 'null' || 
                      photo === 'undefined' || 
                      photo.includes('default.png') || 
                      photo.includes('default.jpg');
    
    // Determine the actual image source
    const src = isDefault
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=7F6FF5&color=fff&size=${size * 2}`
        : (photo.startsWith('http') || photo.startsWith('data:') ? photo : `https://punto-production-21ed.up.railway.app${photo}`);

    return (
        <img 
            src={src} 
            alt={name.replace('Team+', 'Team ')} 
            onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'U')}&background=7F6FF5&color=fff&size=${size * 2}`;
            }}
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
