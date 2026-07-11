// import React from "react";
// import TicketList from "../components/TicketList";
// import DonutChartWidget from "../components/DonutChartWidget";

// export default function TicketingPage({
//   tickets = [], // Added default value [] here
//   isITUser,
//   searchQuery,
//   onOpenCreate,
//   isLoading,
// }) {
//   // Extra safety: Check if tickets is an array before filtering
//   const safeTickets = Array.isArray(tickets) ? tickets : [];

//   const filteredTickets = safeTickets.filter((ticket) => {
//     if (!searchQuery?.trim()) return true;
//     const term = searchQuery.toLowerCase();
//     const candidateValues = [
//       ticket.id,
//       ticket.title,
//       ticket.category,
//       ticket.status,
//       ticket.priority,
//       ticket.assignedTo,
//       ticket.createdBy?.name,
//     ];

//     return candidateValues.some((value) => value?.toLowerCase().includes(term));
//   });

//   return (
//     <div className="ds-page">
//       <div className="page-content-wrapper">
//         <div
//           style={{
//             display: "flex",
//             alignItems: "flex-start",
//             justifyContent: "space-between",
//             marginBottom: 24,
//           }}
//         >
//           <div>
//             <h1
//               style={{
//                 fontSize: "1.25rem",
//                 fontWeight: 700,
//                 color: "#111827",
//                 margin: 0,
//               }}
//             >
//               My Tickets
//             </h1>
//             <p style={{ color: "#9CA3AF", fontSize: "0.875rem", marginTop: 4 }}>
//               Manage and track your support requests
//             </p>
//           </div>
//           <button className="ds-btn ds-btn-primary" onClick={onOpenCreate}>
//             <svg
//               width="16"
//               height="16"
//               viewBox="0 0 24 24"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="2.5"
//               strokeLinecap="round"
//               strokeLinejoin="round"
//             >
//               <line x1="12" y1="5" x2="12" y2="19"></line>
//               <line x1="5" y1="12" x2="19" y2="12"></line>
//             </svg>
//             Create new ticket
//           </button>
//         </div>

//         <DonutChartWidget tickets={safeTickets} />

//         <div className="ds-card" style={{ padding: 0, overflow: "hidden" }}>
//           <div
//             style={{
//               padding: "16px 24px",
//               borderBottom: "1px solid #E9EBF0",
//               display: "flex",
//               alignItems: "center",
//               justifyContent: "space-between",
//               gap: 16,
//               flexWrap: "wrap",
//             }}
//           >
//             <h2
//               style={{
//                 fontSize: "1rem",
//                 fontWeight: 700,
//                 color: "#111827",
//                 margin: 0,
//               }}
//             >
//               Ticket History
//             </h2>
//             <span
//               style={{ fontSize: "0.75rem", color: "#9CA3AF", fontWeight: 500 }}
//             >
//               {isLoading ? "Loading..." : `${filteredTickets.length} of ${safeTickets.length} tickets shown`}
//             </span>
//           </div>
//           {isLoading ? (
//             <div style={{ padding: 40, textAlign: "center", color: "#9CA3AF" }}>
//               Fetching real-time data...
//             </div>
//           ) : (
//             <TicketList tickets={filteredTickets} isITUser={isITUser} />
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }