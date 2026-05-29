/**
 * Admin dashboard API and helpers
 */
const AdminAPI = {
  get: (url) => api(`/admin${url}`),
  post: (url, body) => api(`/admin${url}`, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => api(`/admin${url}`, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (url, body) => api(`/admin${url}`, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (url) => api(`/admin${url}`, { method: 'DELETE' })
};

async function requireAdmin() {
  try {
    const { user } = await AuthAPI.me();
    if (!['staff', 'super_admin'].includes(user.role)) {
      window.location.href = '/admin/login.html';
      return null;
    }
    return user;
  } catch {
    window.location.href = '/admin/login.html';
    return null;
  }
}

function renderAdminNav(active) {
  const links = [
    { href: '/admin/', label: 'Dashboard', id: 'dashboard' },
    { href: '/admin/products.html', label: 'Products', id: 'products' },
    { href: '/admin/orders.html', label: 'Orders', id: 'orders' },
    { href: '/admin/customers.html', label: 'Customers', id: 'customers' },
    { href: '/admin/categories.html', label: 'Categories', id: 'categories' },
    { href: '/admin/vehicles.html', label: 'Vehicles', id: 'vehicles' },
    { href: '/admin/promotions.html', label: 'Promotions', id: 'promotions' },
    { href: '/admin/invoices.html', label: 'Invoices', id: 'invoices' },
    { href: '/admin/reports.html', label: 'Reports', id: 'reports' },
    { href: '/admin/settings.html', label: 'Settings', id: 'settings' }
  ];
  return `
  <aside class="admin-sidebar">
    <div class="brand">Monise Admin</div>
    ${links.map((l) => `<a href="${l.href}" class="${active === l.id ? 'active' : ''}">${l.label}</a>`).join('')}
    <a href="/" style="margin-top:20px">← View Store</a>
    <a href="#" id="admin-logout">Logout</a>
  </aside>`;
}

function initAdminLogout() {
  document.getElementById('admin-logout')?.addEventListener('click', async (e) => {
    e.preventDefault();
    await AuthAPI.logout();
    window.location.href = '/admin/login.html';
  });
}

/** Simple bar chart using divs */
function renderBarChart(data, containerId) {
  const el = document.getElementById(containerId);
  if (!el || !data.length) { el.innerHTML = '<p>No data</p>'; return; }
  const max = Math.max(...data.map((d) => d.revenue || 0), 1);
  el.innerHTML = `<div style="display:flex;align-items:flex-end;gap:4px;height:120px;overflow-x:auto">
    ${data.slice(-14).map((d) => `
      <div style="flex:1;min-width:30px;text-align:center">
        <div style="background:var(--accent);height:${(d.revenue / max) * 100}px;min-height:2px;border-radius:2px"></div>
        <small style="font-size:9px">${d.date?.slice(5) || ''}</small>
      </div>`).join('')}
  </div>`;
}
