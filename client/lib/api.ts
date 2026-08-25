const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://devh-1.onrender.com").replace(/\/$/, "");
export const assetUrl = (value?: string | null) => !value ? "" : value.startsWith("http") ? value : `${API_URL}${value}`;

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_URL}${path}`, options);
  let body: any = null;
  try { body = await res.json(); } catch { /* empty response */ }
  if (!res.ok) throw new Error(body?.error || body?.message || `Request failed (${res.status})`);
  return body;
}

export async function registerUser(data: FormData | Record<string, unknown>) {
  const isForm = data instanceof FormData;
  return request("/api/auth/register", { method: "POST", headers: isForm ? undefined : { "Content-Type": "application/json" }, body: isForm ? data : JSON.stringify(data) });
}
export async function loginUser(data: { email: string; password: string }) {
  return request("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
}
export async function fetchCurrentUser(token: string) { return request("/api/auth/me", { headers: { Authorization: `Bearer ${token}` } }); }
const authHeaders = (token: string) => ({ Authorization: `Bearer ${token}` });
export async function fetchUsers(token: string) { return request("/api/users", { headers: authHeaders(token) }); }
export async function fetchUserById(id: string) { return request(`/api/users/${encodeURIComponent(id)}`); }
export async function updateMyProfile(data: FormData, token: string) { return request("/api/users/me", { method: "PUT", headers: authHeaders(token), body: data }); }
export async function searchCandidates(query: string, token: string) { return request(`/api/users/search?q=${encodeURIComponent(query)}`, { headers: authHeaders(token) }); }
export async function fetchPosts(page = 1, limit = 20) { const body = await request(`/api/posts?page=${page}&limit=${limit}`); return body.posts || body; }
export async function createPost(data: { title: string; content: string; tags?: string[] }, token: string) { return request("/api/posts", { method: "POST", headers: { ...authHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function likePost(postId: string, token: string) { return request(`/api/posts/${encodeURIComponent(postId)}/like`, { method: "POST", headers: authHeaders(token) }); }
export async function addComment(postId: string, text: string, token: string) { return request(`/api/posts/${encodeURIComponent(postId)}/comments`, { method: "POST", headers: { ...authHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify({ text }) }); }
export async function fetchMessages(token: string, page = 1, limit = 100) { return request(`/api/messages?page=${page}&limit=${limit}`, { headers: authHeaders(token) }); }
export async function fetchMessagesWithUser(userId: string, token: string, page = 1, limit = 100) { return request(`/api/messages/${encodeURIComponent(userId)}?page=${page}&limit=${limit}`, { headers: authHeaders(token) }); }
export async function sendMessage(data: { receiverId: string; text: string }, token: string) { return request("/api/messages", { method: "POST", headers: { ...authHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function postMessage(data: { receiverId: string; text: string }, token: string) { return sendMessage(data, token); }
export async function fetchRecruiters() { return request("/api/recruiters"); }
export async function fetchResources() { return request("/api/resources"); }
export async function addResource(data: Record<string, unknown>, token: string) { return request("/api/resources", { method: "POST", headers: { ...authHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function fetchJobs() { return request("/api/recruiters/jobs"); }
export async function createJob(data: Record<string, unknown>, token: string) { return request("/api/recruiters/jobs", { method: "POST", headers: { ...authHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
export async function addRecruiter(data: Record<string, unknown>, token: string) { return request("/api/recruiters/register", { method: "POST", headers: { ...authHeaders(token), "Content-Type": "application/json" }, body: JSON.stringify(data) }); }
