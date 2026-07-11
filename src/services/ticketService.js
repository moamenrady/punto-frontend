// const BASE_URL = "/api/v1";

const getAuthHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

export const getTickets = async () => {
  const res = await fetch("/api/v1/tickets", {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch tickets");
  const data = await res.json();
  return data.data.docs;
};

export const createTicket = async (ticketData) => {
  const res = await fetch("/api/v1/tickets", {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(ticketData),
  });
  if (!res.ok) throw new Error("Failed to create ticket");
  const data = await res.json();
  return data.data.doc;
};
