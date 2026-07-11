export default function DonutChartWidget({ stats, isLoading }) {
  // Fallback values if stats aren't loaded yet
  const { open = 0, inProgress = 0, closed = 0, total = 0 } = stats || {};

  // Calculate percentages safely
  const openPct = total > 0 ? Math.round((open / total) * 100) : 0;
  const progressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
  const closedPct = total > 0 ? Math.round((closed / total) * 100) : 0;

  return (
    <div className="ds-card" style={{ padding: "24px", position: "relative" }}>
      <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#111827" }}>
        Active Ticket Status Breakdown
      </h3>
      <p style={{ margin: "4px 0 20px 0", fontSize: "0.875rem", color: "#6B7280" }}>
        Real-time overview of current outstanding support requests.
      </p>

      <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
        {/* OPENED STAT */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ 
            width: "40px", height: "40px", borderRadius: "8px", 
            backgroundColor: "#ECFDF5", color: "#059669",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "1.1rem"
          }}>
            {isLoading ? "..." : open}
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>Opened</div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>{openPct}%</div>
          </div>
        </div>

        {/* IN PROGRESS STAT */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ 
            width: "40px", height: "40px", borderRadius: "8px", 
            backgroundColor: "#FFFBEB", color: "#D97706",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "1.1rem"
          }}>
            {isLoading ? "..." : inProgress}
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>In Progress</div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>{progressPct}%</div>
          </div>
        </div>

        {/* CLOSED STAT (Assigned in your screenshot, changing to Closed for clarity) */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ 
            width: "40px", height: "40px", borderRadius: "8px", 
            backgroundColor: "#EFF6FF", color: "#2563EB",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: "1.1rem"
          }}>
            {isLoading ? "..." : closed}
          </div>
          <div>
            <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>Closed</div>
            <div style={{ fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>{closedPct}%</div>
          </div>
        </div>

        {/* TOTAL COUNTER ON THE RIGHT */}
        <div style={{ marginLeft: "auto", textAlign: "right" }}>
           <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", lineHeight: 1 }}>
             {isLoading ? "..." : total}
           </div>
           <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase" }}>Total Tickets</div>
        </div>
      </div>
    </div>
  );
}