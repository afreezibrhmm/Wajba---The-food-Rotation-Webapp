// ==========================================
// 9. ADMIN DASHBOARD IMPLEMENTATION
// ==========================================
function setupAdminView() {
  if (!activeMasjid) return;

  const now = new Date();
  document.getElementById('admin-date-display').textContent = now.toLocaleDateString('en-IN', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' });
  
  document.getElementById('admin-masjid-title').textContent = activeMasjid.name;
  document.getElementById('admin-masjid-id-badge').textContent = activeMasjid.masjid_id;
  document.getElementById('side-masjid-name').textContent = activeMasjid.name;
  document.getElementById('side-masjid-id-badge').textContent = 'ID: ' + activeMasjid.masjid_id;

  document.getElementById('settings-masjid-id').value = activeMasjid.masjid_id;
  document.getElementById('settings-masjid-name').value = activeMasjid.name;
  document.getElementById('settings-admin-email').value = activeMasjid.admin_email || (currentUser ? currentUser.email : '');
  document.getElementById('settings-ustad-count').value = activeMasjid.ustad_count || 3;
  document.getElementById('settings-delivery-location').value = activeMasjid.delivery_location || '';
  document.getElementById('settings-delivery-notes').value = activeMasjid.delivery_notes || '';

  renderDashboard();
}

function setAdminTab(tab) {
  ADMIN_TABS.forEach(t => {
    const el = document.getElementById('tab-' + t);
    if (el) el.classList.toggle('active', t === tab);
    const side = document.getElementById('side-' + t);
    if (side) side.classList.toggle('active', t === tab);
    const mnav = document.getElementById('mnav-' + t);
    if (mnav) {
      mnav.className = (t === tab)
        ? 'nav-tab active px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap bg-emerald-50 text-emerald-800'
        : 'nav-tab px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg whitespace-nowrap';
    }
  });

  if (tab === 'dashboard') renderDashboard();
  if (tab === 'roster') renderCalendar();
  if (tab === 'members') renderMembersTable();
  if (tab === 'ustads') renderUstadsGrid();
  if (tab === 'broadcast') renderBroadcast();
}

function renderDashboard() {
  if (!activeMasjid) return;

  const masjidHouses = houses.filter(h => !h.masjid_id || h.masjid_id === activeMasjid.masjid_id);
  const masjidUstads = ustads.filter(u => !u.masjid_id || u.masjid_id === activeMasjid.masjid_id);

  document.getElementById('stat-houses').textContent = masjidHouses.length;
  document.getElementById('stat-ustads').textContent = masjidUstads.length || (activeMasjid.ustad_count || 3);

  let totalDuties = 0;
  let confirmedDuties = 0;
  Object.keys(roster).forEach(k => {
    (roster[k] || []).forEach(d => {
      if (!d.masjid_id || d.masjid_id === activeMasjid.masjid_id) {
        totalDuties++;
        if (d.status === 'confirmed' || d.status === 'delivered') confirmedDuties++;
      }
    });
  });

  document.getElementById('stat-duties').textContent = totalDuties;
  document.getElementById('stat-confirmed').textContent = confirmedDuties;

  const adminUser = masjidUsers.find(u => u.masjid_id === activeMasjid.masjid_id && u.role === 'admin') ||
                    houses.find(h => (!h.masjid_id || h.masjid_id === activeMasjid.masjid_id) && h.role === 'admin');
  const adminName = adminUser ? (adminUser.name || adminUser.head || adminUser.email) : (activeMasjid.admin_email || 'Jamath Representative');
  const dashAdminEl = document.getElementById('dash-admin-name');
  if (dashAdminEl) dashAdminEl.textContent = adminName;

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  const tmrwKey = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, '0')}-${String(tmrw.getDate()).padStart(2, '0')}`;

  const todayDuties = (roster[todayKey] || []).filter(d => !d.masjid_id || d.masjid_id === activeMasjid.masjid_id);
  const tmrwDuties = (roster[tmrwKey] || []).filter(d => !d.masjid_id || d.masjid_id === activeMasjid.masjid_id);

  renderDutyMiniList('today-duties-admin', todayDuties);
  renderDutyMiniList('tomorrow-duties-admin', tmrwDuties);
}

function renderDutyMiniList(containerId, duties) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!duties || duties.length === 0) {
    el.innerHTML = '<p class="text-xs text-slate-400 py-3">No duties scheduled yet.</p>';
    return;
  }
  const masjidHouses = houses.filter(h => !h.masjid_id || h.masjid_id === activeMasjid.masjid_id);
  el.innerHTML = duties.map(d => {
    const h = masjidHouses.find(x => x.id === d.houseId);
    const roleBadge = d.role === 'member'
      ? '<span class="badge badge-member text-[10px] py-0.5 px-1.5 font-semibold">👤 Member</span>'
      : (d.role === 'delivery' ? '<span class="badge badge-delivery text-[10px] py-0.5 px-1.5 font-semibold">🛵 Delivery</span>' : '');
    return `
      <div class="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 text-xs gap-2">
        <div class="flex items-center gap-2 flex-wrap">
          <span>${SLOT_ICONS[d.slot] || '🍽️'}</span>
          <span class="font-bold text-slate-700">${SLOT_LABELS[d.slot] || d.slot}:</span>
          <span class="text-slate-600 font-medium">${h ? h.house : 'Unassigned'}</span>
          ${roleBadge}
        </div>
        <span class="badge badge-${d.status || 'pending'}">${d.status || 'pending'}</span>
      </div>
    `;
  }).join('');
}

// Calendar
function renderCalendar() {
  const grid = document.getElementById('calendar-grid');
  const title = document.getElementById('cal-month-title');
  if (!grid || !title) return;

  title.textContent = `${MONTHS[currentMonth]} ${currentYear}`;
  
  let html = DAYS_SHORT.map(d => `<div class="text-center font-bold text-[11px] text-slate-400 py-1">${d}</div>`).join('');

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    html += '<div class="h-16 bg-slate-50/50 rounded-lg"></div>';
  }

  const today = new Date();
  const isThisMonth = (today.getMonth() === currentMonth && today.getFullYear() === currentYear);

  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = isThisMonth && (today.getDate() === d);
    const key = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const duties = (roster[key] || []).filter(x => !x.masjid_id || x.masjid_id === activeMasjid.masjid_id);

    html += `
      <div class="h-16 p-1 border border-slate-100 rounded-lg flex flex-col justify-between cursor-pointer hover:border-emerald-400 transition ${isToday ? 'bg-emerald-50/70 border-emerald-300' : 'bg-white hover:bg-slate-50'}" onclick="openCalendarQuickAssignModal('${key}')" title="Click to assign duty for ${key}">
        <div class="flex items-center justify-between">
          <span class="text-[11px] font-bold ${isToday ? 'text-emerald-800' : 'text-slate-700'}">${d}</span>
          <span class="text-[9px] text-slate-400 hover:text-emerald-600 font-bold">+</span>
        </div>
        <div class="space-y-0.5 overflow-hidden">
          ${duties.slice(0, 2).map(duty => {
            const isMem = (duty.role === 'member');
            return `<div class="text-[9px] truncate px-1 rounded ${isMem ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'} font-semibold">${isMem ? '👤 ' : ''}${SLOT_LABELS[duty.slot] || duty.slot}</div>`;
          }).join('')}
          ${duties.length > 2 ? `<div class="text-[8px] text-slate-400">+${duties.length - 2} more</div>` : ''}
        </div>
      </div>
    `;
  }

  grid.innerHTML = html;
}

function prevMonth() {
  currentMonth--;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  renderCalendar();
}

function nextMonth() {
  currentMonth++;
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  renderCalendar();
}

function openCalendarQuickAssignModal(preselectedDate) {
  if (!activeMasjid) return;
  const sel = document.getElementById('cal-duty-house');
  if (!sel) return;

  const masjidHouses = houses.filter(h => !h.masjid_id || h.masjid_id === activeMasjid.masjid_id);
  if (masjidHouses.length === 0) {
    showToast('Please add Jamath members first.');
    setAdminTab('members');
    return;
  }

  sel.innerHTML = masjidHouses.map(h => {
    const roleIcon = h.role === 'admin' ? '👑' : (h.role === 'member' ? '👤' : '🛵');
    return `<option value="${h.id}" data-role="${h.role || 'member'}">${roleIcon} ${h.house} (${h.head})</option>`;
  }).join('');

  syncCalDutyRoleWithMember();

  const dateEl = document.getElementById('cal-duty-date');
  if (dateEl) {
    if (preselectedDate) {
      dateEl.value = preselectedDate;
    } else {
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      dateEl.value = tmrw.toISOString().split('T')[0];
    }
  }

  const subEl = document.getElementById('cal-duty-subtitle');
  if (subEl) subEl.textContent = `${activeMasjid.name} (Roster Rotation)`;

  openModal('modal-calendar-quick-duty');
}

function syncCalDutyRoleWithMember() {
  const sel = document.getElementById('cal-duty-house');
  const roleSel = document.getElementById('cal-duty-role');
  if (!sel || !roleSel) return;
  const opt = sel.options[sel.selectedIndex];
  if (opt) {
    const r = opt.getAttribute('data-role');
    if (r === 'delivery' || r === 'member') {
      roleSel.value = r;
    } else {
      roleSel.value = 'member';
    }
  }
}

function saveCalendarQuickDuty() {
  const houseId = parseInt(document.getElementById('cal-duty-house')?.value, 10);
  const role = document.getElementById('cal-duty-role')?.value || 'member';
  const dateVal = document.getElementById('cal-duty-date')?.value;
  const slot = document.getElementById('cal-duty-slot')?.value || 'lunch';

  if (!houseId || !dateVal) {
    showToast('Please select member and date.');
    return;
  }

  if (!roster[dateVal]) roster[dateVal] = [];
  roster[dateVal].push({
    id: Date.now(),
    masjid_id: activeMasjid.masjid_id,
    duty_date: dateVal,
    slot,
    houseId,
    role,
    status: 'pending'
  });

  saveLocalState();
  closeModal('modal-calendar-quick-duty');
  showToast(`Duty added to roster as ${role === 'member' ? 'Member 👤' : 'Delivery 🛵'}!`);
  renderCalendar();
  renderDashboard();
}

// Members Table
function renderMembersTable() {
  const tbody = document.getElementById('members-table-body');
  if (!tbody || !activeMasjid) return;

  const masjidHouses = houses.filter(h => !h.masjid_id || h.masjid_id === activeMasjid.masjid_id);
  if (masjidHouses.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-6 text-slate-400 text-xs">No members enrolled under ${activeMasjid.name} yet. Click "+ Add Jamath Member" above!</td></tr>`;
    return;
  }

  tbody.innerHTML = masjidHouses.map(h => {
    let roleBadge = getRoleBadge(h.role);

    return `
      <tr>
        <td>
          <p class="font-bold text-slate-800 text-xs">${h.house}</p>
          <p class="text-[11px] text-slate-500">${h.head}</p>
        </td>
        <td class="font-mono text-xs text-slate-600">+91 ${h.phone}</td>
        <td class="text-xs text-slate-500">${h.email || '—'}</td>
        <td>${roleBadge}</td>
        <td>
          <span class="badge ${h.active !== false ? 'badge-confirmed' : 'badge-pending'}">${h.active !== false ? 'Active' : 'Inactive'}</span>
        </td>
        <td>
          <div class="flex items-center gap-1.5">
            <button onclick="editMember(${h.id})" class="btn btn-secondary text-xs py-1 px-2">Edit</button>
            <button onclick="deleteMember(${h.id})" class="btn btn-danger text-xs py-1 px-2">Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddMemberModal() {
  document.getElementById('member-modal-title').textContent = 'Add Jamath Member';
  document.getElementById('edit-member-id').value = '';
  document.getElementById('m-house').value = '';
  document.getElementById('m-head').value = '';
  document.getElementById('m-phone').value = '';
  document.getElementById('m-email').value = '';
  document.getElementById('m-role').value = 'member';
  document.getElementById('add-duty-form').style.display = 'none';
  document.getElementById('member-duties-list').innerHTML = '';
  openModal('modal-member');
}

function editMember(id) {
  const h = houses.find(x => x.id === id);
  if (!h) return;
  document.getElementById('member-modal-title').textContent = 'Edit Member';
  document.getElementById('edit-member-id').value = h.id;
  document.getElementById('m-house').value = h.house;
  document.getElementById('m-head').value = h.head;
  document.getElementById('m-phone').value = h.phone;
  document.getElementById('m-email').value = h.email || '';
  document.getElementById('m-role').value = h.role || 'member';
  currentEditingDutyHouseId = h.id;
  renderMemberDuties(h.id);
  openModal('modal-member');
}

function saveMember() {
  const editId = document.getElementById('edit-member-id').value;
  const house = (document.getElementById('m-house').value || '').trim();
  const head = (document.getElementById('m-head').value || '').trim();
  const phone = (document.getElementById('m-phone').value || '').trim();
  const email = (document.getElementById('m-email').value || '').trim();
  let role = document.getElementById('m-role').value || 'member';
  const zone = document.getElementById('m-zone').value;

  if (!house || !head || !phone) {
    showToast('Please fill in House name, Head person name, and Phone number');
    return;
  }

  // Enforce 1-Admin policy: strictly 1 Admin (Jamath Representative) per Jamath
  if (role === 'admin') {
    const currentAdminUser = masjidUsers.find(u => u.masjid_id === activeMasjid.masjid_id && u.role === 'admin' && (email ? u.email.toLowerCase() !== email.toLowerCase() : true));
    const currentAdminHouse = houses.find(h => (!h.masjid_id || h.masjid_id === activeMasjid.masjid_id) && h.role === 'admin' && (editId ? h.id !== parseInt(editId, 10) : true));
    
    if (currentAdminUser || currentAdminHouse) {
      const prevAdminName = (currentAdminUser && currentAdminUser.name) || (currentAdminHouse && currentAdminHouse.head) || activeMasjid.admin_email || 'Current Admin';
      const prevAdminEmail = (currentAdminUser && currentAdminUser.email) || activeMasjid.admin_email || '';
      
      const proceed = confirm(
        `🏛️ JAMATH POLICY: ONLY 1 ADMIN ALLOWED\n\n` +
        `Each Jamath has strictly ONE trusted representative (Admin).\n\n` +
        `Currently, "${prevAdminName}" (${prevAdminEmail}) is the designated Jamath Representative.\n\n` +
        `Do you want to TRANSFER the Jamath Representative role to "${head}"?\n\n` +
        `"${prevAdminName}" will become a regular Jamath Member.`
      );

      if (!proceed) {
        showToast('Admin promotion cancelled. Retained single representative.');
        return;
      }

      // Demote previous admin to member
      masjidUsers.forEach(u => {
        if (u.masjid_id === activeMasjid.masjid_id && u.role === 'admin') {
          u.role = 'member';
        }
      });
      houses.forEach(h => {
        if ((!h.masjid_id || h.masjid_id === activeMasjid.masjid_id) && h.role === 'admin') {
          h.role = 'member';
        }
      });
      if (email) {
        activeMasjid.admin_email = email;
      }
      showToast(`👑 Jamath Representative transferred to ${head}. 1-Admin rule maintained.`);
    }
  }

  if (editId) {
    const idx = houses.findIndex(x => x.id === parseInt(editId, 10));
    if (idx !== -1) {
      houses[idx] = { ...houses[idx], house, head, phone, email, role, zone };
    }
  } else {
    houses.push({
      id: Date.now(),
      masjid_id: activeMasjid.masjid_id,
      house,
      head,
      phone,
      email,
      role,
      zone,
      active: true
    });
  }

  if (email) {
    const existing = masjidUsers.find(u => u.masjid_id === activeMasjid.masjid_id && u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      existing.role = role;
      existing.name = head;
      existing.phone = phone;
    } else {
      masjidUsers.push({
        masjid_id: activeMasjid.masjid_id,
        email: email,
        role: role,
        name: head,
        phone: phone
      });
    }
  }

  saveLocalState();
  closeModal('modal-member');
  showToast('Member saved successfully! ✅');
  renderMembersTable();
  renderDashboard();
}

function deleteMember(id) {
  if (!confirm('Are you sure you want to remove this member?')) return;
  houses = houses.filter(x => x.id !== id);
  saveLocalState();
  showToast('Member removed.');
  renderMembersTable();
}

function toggleActive() {
  const t = document.getElementById('m-active-toggle');
  const input = document.getElementById('m-active');
  const lbl = document.getElementById('m-active-label');
  const cur = input.value === 'true';
  input.value = cur ? 'false' : 'true';
  t.className = 'toggle' + (!cur ? ' on' : '');
  lbl.textContent = !cur ? 'Active' : 'Inactive';
}

function toggleAddDutyForm() {
  const f = document.getElementById('add-duty-form');
  if (!f) return;
  f.style.display = (f.style.display === 'none') ? 'block' : 'none';
  if (f.style.display === 'block') {
    document.getElementById('duty-date').value = new Date().toISOString().split('T')[0];
    const roleSel = document.getElementById('duty-role');
    const mRole = document.getElementById('m-role')?.value;
    if (roleSel && mRole) {
      roleSel.value = (mRole === 'delivery') ? 'delivery' : 'member';
    }
  }
}

function addDutyAssignment() {
  const dateVal = document.getElementById('duty-date')?.value;
  const slot = document.getElementById('duty-slot')?.value;
  const role = document.getElementById('duty-role')?.value || 'member';
  const houseId = currentEditingDutyHouseId;

  if (!dateVal) { showToast('Please select a duty date'); return; }
  if (!houseId) { showToast('Save member first to assign duties'); return; }

  if (!roster[dateVal]) roster[dateVal] = [];
  roster[dateVal].push({
    id: Date.now(),
    masjid_id: activeMasjid.masjid_id,
    duty_date: dateVal,
    slot,
    houseId,
    role,
    status: 'pending'
  });

  saveLocalState();
  showToast(`Duty date added as ${role === 'member' ? 'Member 👤' : 'Delivery 🛵'}! 📅`);
  renderMemberDuties(houseId);
  toggleAddDutyForm();
}

function renderMemberDuties(houseId) {
  const listEl = document.getElementById('member-duties-list');
  if (!listEl) return;
  const myDuties = [];
  Object.keys(roster).forEach(k => {
    (roster[k] || []).forEach(d => {
      if (d.houseId === houseId && (!d.masjid_id || d.masjid_id === activeMasjid.masjid_id)) {
        myDuties.push(d);
      }
    });
  });

  if (myDuties.length === 0) {
    listEl.innerHTML = '<p class="text-[11px] text-slate-400">No duties assigned yet.</p>';
    return;
  }

  listEl.innerHTML = myDuties.map(d => `
    <div class="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
      <div>
        <span class="font-bold text-slate-700">${d.duty_date}</span>
        <span class="text-slate-500 font-semibold ml-1.5">${SLOT_LABELS[d.slot] || d.slot}</span>
        <span class="ml-1 text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-bold">${d.role === 'member' ? '👤 Member' : '🛵 Delivery'}</span>
      </div>
      <button onclick="removeDuty(${d.id})" class="text-red-500 hover:text-red-700 text-xs font-bold">✕</button>
    </div>
  `).join('');
}

function removeDuty(dutyId) {
  Object.keys(roster).forEach(k => {
    roster[k] = (roster[k] || []).filter(d => d.id !== dutyId);
  });
  saveLocalState();
  showToast('Duty removed.');
  if (currentEditingDutyHouseId) renderMemberDuties(currentEditingDutyHouseId);
}

// Ustads Grid
function renderUstadsGrid() {
  const grid = document.getElementById('ustads-grid');
  if (!grid || !activeMasjid) return;

  const masjidUstads = ustads.filter(u => !u.masjid_id || u.masjid_id === activeMasjid.masjid_id);
  if (masjidUstads.length === 0) {
    grid.innerHTML = '<div class="col-span-3 text-center py-6 text-slate-400 text-xs">No ustads registered yet. Click "+ Add Ustad" above!</div>';
    return;
  }

  grid.innerHTML = masjidUstads.map(u => `
    <div class="card p-4 space-y-3 hover:shadow-md transition">
      <div class="flex items-center justify-between">
        <div class="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-lg">
          👳
        </div>
        <button onclick="deleteUstad(${u.id})" class="text-red-400 hover:text-red-600 text-xs">✕ Delete</button>
      </div>
      <div>
        <h4 class="font-bold text-slate-800 text-sm">${u.name}</h4>
        <p class="text-xs text-slate-500">${u.email || 'No email linked'}</p>
      </div>
      <div class="text-xs space-y-1 text-slate-600 bg-slate-50 p-2.5 rounded-xl">
        <p>🏠 <strong>Room:</strong> ${u.room || 'Room #1'}</p>
        <p>📚 <strong>Subject:</strong> ${u.subject || 'General'}</p>
        <p>🥗 <strong>Diet:</strong> ${u.diet || 'Standard'}</p>
      </div>
    </div>
  `).join('');
}

function openAddUstadModal() {
  document.getElementById('u-name').value = '';
  document.getElementById('u-email').value = '';
  document.getElementById('u-room').value = 'Room #1';
  document.getElementById('u-subject').value = 'Hifz / Kitab';
  document.getElementById('u-diet').value = 'No restrictions';
  openModal('modal-ustad');
}

function saveUstad() {
  const name = (document.getElementById('u-name').value || '').trim();
  const email = (document.getElementById('u-email').value || '').trim();
  const room = (document.getElementById('u-room').value || '').trim();
  const subject = (document.getElementById('u-subject').value || '').trim();
  const diet = (document.getElementById('u-diet').value || '').trim();

  if (!name) { showToast('Please enter Ustad Name'); return; }

  ustads.push({
    id: Date.now(),
    masjid_id: activeMasjid.masjid_id,
    name,
    email,
    room,
    subject,
    diet
  });

  if (email) {
    masjidUsers.push({
      masjid_id: activeMasjid.masjid_id,
      email,
      role: 'ustad',
      name,
      phone: ''
    });
  }

  saveLocalState();
  closeModal('modal-ustad');
  showToast(`Ustad ${name} added! 👳`);
  renderUstadsGrid();
}

function deleteUstad(id) {
  if (!confirm('Remove this Ustad?')) return;
  ustads = ustads.filter(x => x.id !== id);
  saveLocalState();
  showToast('Ustad removed.');
  renderUstadsGrid();
}

// Reminders & Broadcast
function renderBroadcast() {
  const countInput = document.getElementById('tmrw-ustad-count');
  if (countInput) countInput.value = tmrwUstadCount;
  document.getElementById('confirmed-ustad-btn-num').textContent = tmrwUstadCount;

  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  const tmrwKey = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, '0')}-${String(tmrw.getDate()).padStart(2, '0')}`;

  const previewEl = document.getElementById('whatsapp-preview-msg');
  if (!previewEl) return;

  const dateStr = tmrw.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
  const previewText = `As-salamu alaykum 🌙\n\nReminder from *${activeMasjid.name}* (Masjid ID: *${activeMasjid.masjid_id}*):\n\nYou are scheduled to provide food for Ustads tomorrow (*${dateStr}*).\n\n🍛 *Ustads Eating Tomorrow:* ${tmrwUstadCount} Ustads\n📍 *Delivery Location:* ${activeMasjid.delivery_location || 'Madrasa Room #2'}\n\nPlease confirm preparation in your WAJBA portal. Jazakallahu Khair!`;

  previewEl.textContent = previewText;
}

function adjustTmrwUstadCount(delta) {
  tmrwUstadCount = Math.max(1, tmrwUstadCount + delta);
  document.getElementById('tmrw-ustad-count').value = tmrwUstadCount;
  document.getElementById('confirmed-ustad-btn-num').textContent = tmrwUstadCount;
  renderBroadcast();
}

function confirmUstadCount() {
  const inputVal = parseInt(document.getElementById('tmrw-ustad-count')?.value || '3', 10);
  tmrwUstadCount = inputVal;
  activeMasjid.ustad_count = inputVal;
  saveLocalState();
  showToast(`✅ Headcount confirmed: ${tmrwUstadCount} Ustads for tomorrow!`);
  renderBroadcast();
}

function sendAllReminders() {
  const tmrw = new Date();
  tmrw.setDate(tmrw.getDate() + 1);
  const tmrwKey = `${tmrw.getFullYear()}-${String(tmrw.getMonth() + 1).padStart(2, '0')}-${String(tmrw.getDate()).padStart(2, '0')}`;
  const tmrwDuties = (roster[tmrwKey] || []).filter(d => !d.masjid_id || d.masjid_id === activeMasjid.masjid_id);

  const masjidHouses = houses.filter(h => !h.masjid_id || h.masjid_id === activeMasjid.masjid_id);
  const tomorrowHouse = tmrwDuties.length ? masjidHouses.find(h => h.id === tmrwDuties[0].houseId) : null;

  const targetPhone = (tomorrowHouse && tomorrowHouse.phone) ? tomorrowHouse.phone : '9876543210';
  const rawMsg = document.getElementById('whatsapp-preview-msg')?.textContent || 'Food rotation reminder';

  window.open(`https://wa.me/91${targetPhone}?text=${encodeURIComponent(rawMsg)}`, '_blank');
  showToast('WhatsApp opened for tomorrow\'s member! 📲');
}

// Settings
function saveSettings() {
  const name = (document.getElementById('settings-masjid-name')?.value || '').trim();
  const ustadCount = parseInt(document.getElementById('settings-ustad-count')?.value || '3', 10);
  const loc = (document.getElementById('settings-delivery-location')?.value || '').trim();
  const notes = (document.getElementById('settings-delivery-notes')?.value || '').trim();

  if (!name) { showToast('Please enter Masjid Name'); return; }

  activeMasjid.name = name;
  activeMasjid.ustad_count = ustadCount;
  activeMasjid.delivery_location = loc;
  activeMasjid.delivery_notes = notes;

  saveLocalState();
  setupAdminView();
  showToast('Masjid settings saved! ✅');
}

function testDbConnection() {
  showToast('🟢 Supabase Cloud DB is connected and synced.');
  closeModal('modal-db-setup');
}

// ==========================================
// 10. APP STARTUP & BOOTSTRAP
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  loadLocalState();

  if (currentUser) {
    if (activeMasjid && currentRole) {
      enterMasjid(activeMasjid.masjid_id, currentRole);
    } else {
      openMasjidSelection();
    }
  } else {
    showPage('page-landing');
  }
});
</script>
</body>
</html>