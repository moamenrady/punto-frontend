import React from 'react';

const TicketCard = ({ ticket, onClick }) => {
    const getCategoryTheme = (category) => {
        switch (category.toLowerCase()) {
            case 'network': return 'badge-network';
            case 'hardware': return 'badge-hardware';
            case 'software': return 'badge-software';
            default: return 'badge-software';
        }
    };

    const getStatusTheme = (status) => {
        switch (status.toLowerCase()) {
            case 'open': return 'badge-open';
            case 'in progress': return 'badge-inprogress';
            case 'closed': return 'badge-closed';
            default: return 'badge-open';
        }
    };

    return (
        <div className="ticket-card" onClick={onClick}>
            <div className="ticket-header">
                <div className="ticket-title-wrapper">
                    <h3 className="ticket-title">{ticket.title}</h3>
                    <span className={`badge ${getCategoryTheme(ticket.category)}`}>
                        {ticket.category}
                    </span>
                </div>
                <span className={`badge ${getStatusTheme(ticket.status)}`}>
                    {ticket.status}
                </span>
            </div>

            <div className="ticket-desc">
                <p>{ticket.description}</p>
                <span className="ticket-id">{ticket.id}</span>
            </div>

            <div className="ticket-footer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>Updated {ticket.updatedAt}</span>
            </div>
        </div>
    );
};

export default TicketCard;
