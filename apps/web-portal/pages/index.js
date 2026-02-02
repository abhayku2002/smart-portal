import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const API_URL = 'http://localhost:3002/api/requests';

export default function Home() {
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', requesterName: '', requesterEmail: '', category: 'General', priority: 'Low' });
  const [filters, setFilters] = useState({ category: '', status: '', priority: '' });
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) router.push('/login');
    else fetchRequests();
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const fetchRequests = async () => {
    const params = new URLSearchParams();
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);

    const res = await fetch(`${API_URL}?${params.toString()}`);
    const response = await res.json();
    setRequests(response.data || response); // Handle both paginated and non-paginated
  };

  const submit = async (e) => {
    e.preventDefault();
    await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'dev-api-key-12345'
      },
      body: JSON.stringify(form)
    });
    setForm({ title: '', description: '', requesterName: '', requesterEmail: '', category: 'General', priority: 'Low' });
    fetchRequests();
  };

  const updateStatus = async (id, newStatus) => {
    await fetch(`${API_URL}/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'dev-api-key-12345'
      },
      body: JSON.stringify({ status: newStatus })
    });
    fetchRequests();
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Smart Service Portal</h1>
        <button onClick={() => { localStorage.removeItem('user'); router.push('/login'); }}>Logout</button>
      </div>

      <div style={{ marginBottom: 40, padding: 20, background: '#f5f5f5', borderRadius: 8 }}>
        <h3>New Request</h3>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ padding: 8 }} required />
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ padding: 8 }} required />
          <input placeholder="Your Name" value={form.requesterName} onChange={e => setForm({ ...form, requesterName: e.target.value })} style={{ padding: 8 }} required />
          <input placeholder="Your Email" value={form.requesterEmail} onChange={e => setForm({ ...form, requesterEmail: e.target.value })} style={{ padding: 8 }} required />

          <div style={{ display: 'flex', gap: 10 }}>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ padding: 8, flex: 1 }}>
              <option value="General">General</option>
              <option value="IT">IT</option>
              <option value="Facilities">Facilities</option>
            </select>
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} style={{ padding: 8, flex: 1 }}>
              <option value="Low">Low</option>
              <option value="High">High</option>
            </select>
          </div>

          <button type="submit" style={{ padding: 10, background: '#0070f3', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Submit</button>
        </form>
      </div>

      <div style={{ marginBottom: 20 }}>
        <h3>Filters</h3>
        <select onChange={e => setFilters({ ...filters, category: e.target.value })} style={{ marginRight: 10 }}>
          <option value="">All Categories</option>
          <option value="IT">IT</option>
          <option value="Facilities">Facilities</option>
          <option value="General">General</option>
        </select>
        <select onChange={e => setFilters({ ...filters, priority: e.target.value })} style={{ marginRight: 10 }}>
          <option value="">All Priorities</option>
          <option value="High">High</option>
          <option value="Low">Low</option>
        </select>
        <select onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </select>
      </div>

      <h2>Requests</h2>
      {requests.length === 0 ? <p>No requests found.</p> : requests.map(r => (
        <div key={r.id} style={{ border: "1px solid #eee", marginBottom: 15, padding: 15, borderRadius: 8, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <h4 style={{ margin: "0 0 10px 0" }}>{r.title} <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'normal' }}>#{r.id}</span></h4>
            <span style={{
              background: r.priority === 'High' ? '#fee' : '#eef',
              color: r.priority === 'High' ? '#c00' : '#00c',
              padding: "2px 8px", borderRadius: 4, fontSize: '0.8em'
            }}>{r.priority}</span>
          </div>
          <p style={{ margin: "0 0 10px 0", color: '#444' }}>{r.description}</p>
          <div style={{ fontSize: '0.9em', color: '#666', marginBottom: 10 }}>
            Category: <b>{r.category}</b> | AI Sentiment: <i>{r.aiNotes}</i>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontWeight: 'bold' }}>Status: {r.status}</span>
            {r.status === 'OPEN' && <button onClick={() => updateStatus(r.id, 'IN_PROGRESS')}>Start Progress</button>}
            {r.status === 'IN_PROGRESS' && <button onClick={() => updateStatus(r.id, 'RESOLVED')}>Resolve</button>}
            {r.status === 'RESOLVED' && <button onClick={() => updateStatus(r.id, 'OPEN')}>Re-open</button>}
          </div>
        </div>
      ))}
    </div>
  );
}
