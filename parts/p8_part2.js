// ==========================================
// 5. MASJID SELECTION & ENROLLMENT
// ==========================================
function openMasjidSelection() {
  if (!currentUser) {
    showPage('page-landing');
    return;
  }
  
  const greetEl = document.getElementById('masjid-select-user-greeting');
  if (greetEl) {
    greetEl.textContent = `Logged in: ${currentUser.name} (${currentUser.email})`;
  }

  renderMasjidDirectory();
  showPage('page-masjid-select');
}

function renderMasjidDirectory(filterText = '') {
  const q = filterText.trim().toLowerCase();
  
  // 1. My Masjids
  const myAffiliations = masjidUsers.filter(u => u.email.toLowerCase() === currentUser.email.toLowerCase());
  const myMasjidIds = new Set(myAffiliations.map(a => a.masjid_id));
  
  const myListEl = document.getElementById('my-masjids-list');
  if (myListEl) {
    const myMasjids = masjids.filter(m => myMasjidIds.has(m.masjid_id));
    if (myMasjids.length === 0) {
      myListEl.innerHTML = `
        <div class="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500">
          You are not enrolled in any Masjid yet. Search with a <strong>Masjid ID</strong> above or enroll your own!
        </div>
      `;
    } else {
      myListEl.innerHTML = myMasjids.map(m => {
        const aff = myAffiliations.find(a => a.masjid_id === m.masjid_id);
        const role = aff ? aff.role : 'delivery';
        let roleBadge = getRoleBadge(role);

        return `
          <div class="card hover:shadow-md transition p-4 flex items-center justify-between cursor-pointer border-2 hover:border-emerald-500" onclick="enterMasjid('${m.masjid_id}', '${role}')">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-slate-800 text-sm">${m.name}</h4>
                <span class="font-mono text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">${m.masjid_id}</span>
              </div>
              <p class="text-xs text-slate-500">📍 ${m.locality}, ${m.city}</p>
              <div>${roleBadge}</div>
            </div>
            <button class="btn btn-primary text-xs py-2 px-3">
              Open Portal →
            </button>
          </div>
        `;
      }).join('');
    }
  }

  // 2. All Registered Masjids Directory
  const allListEl = document.getElementById('all-masjids-list');
  if (allListEl) {
    const filtered = masjids.filter(m => {
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.masjid_id.toLowerCase().includes(q) || m.locality.toLowerCase().includes(q) || m.city.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      allListEl.innerHTML = `
        <div class="p-4 rounded-xl bg-slate-100 border border-slate-200 text-center text-xs text-slate-500">
          No Masjids match "${filterText}". You can enroll this Masjid using the button above!
        </div>
      `;
    } else {
      allListEl.innerHTML = filtered.map(m => {
        const aff = myAffiliations.find(a => a.masjid_id === m.masjid_id);
        const role = aff ? aff.role : null;
        return `
          <div class="card p-3.5 flex items-center justify-between hover:bg-slate-50">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-800 text-sm">${m.name}</span>
                <span class="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded">${m.masjid_id}</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5">${m.locality}, ${m.city} • ${m.ustad_count || 3} Ustads</p>
            </div>
            <button onclick="selectMasjid('${m.masjid_id}')" class="btn btn-secondary text-xs py-1.5 px-3">
              ${role ? 'Enter' : 'Select / Join'}
            </button>
          </div>
        `;
      }).join('');
    }
  }
}

function handleMasjidSearch() {
  const val = document.getElementById('masjid-search-input')?.value || '';
  renderMasjidDirectory(val);
}

function handleDirectMasjidIdSearch() {
  const val = (document.getElementById('masjid-search-input')?.value || '').trim().toUpperCase();
  if (!val) {
    showToast('Please enter a Masjid ID or name');
    return;
  }
  const match = masjids.find(m => m.masjid_id.toUpperCase() === val || m.name.toLowerCase().includes(val.toLowerCase()));
  if (match) {
    selectMasjid(match.masjid_id);
  } else {
    showToast(`Masjid "${val}" not found. You can enroll it as an Admin!`);
  }
}

function openEnrollMasjidModal() {
  if (!currentUser) return;
  const adminEmailEl = document.getElementById('enroll-masjid-admin-email');
  const adminEmailDisp = document.getElementById('enroll-admin-email-display');
  if (adminEmailEl) adminEmailEl.value = currentUser.email;
  if (adminEmailDisp) adminEmailDisp.textContent = currentUser.email;
  
  generateRandomMasjidId();
  openModal('modal-enroll-masjid');
}

function generateRandomMasjidId() {
  const code = 'MSJ-' + Math.floor(1000 + Math.random() * 9000);
  const el = document.getElementById('enroll-masjid-id');
  if (el) el.value = code;
}

function executeEnrollMasjid() {
  const name = (document.getElementById('enroll-masjid-name')?.value || '').trim();
  const locality = (document.getElementById('enroll-masjid-locality')?.value || '').trim();
  const city = (document.getElementById('enroll-masjid-city')?.value || '').trim();
  let masjidId = (document.getElementById('enroll-masjid-id')?.value || '').trim().toUpperCase();
  const ustadCount = parseInt(document.getElementById('enroll-masjid-ustad-count')?.value || '3', 10);
  const location = (document.getElementById('enroll-masjid-location')?.value || '').trim();
  const notes = (document.getElementById('enroll-masjid-notes')?.value || '').trim();

  if (!name || !locality || !city) {
    showToast('Please fill in Masjid Name, Locality, and City');
    return;
  }

  if (!masjidId) {
    masjidId = 'MSJ-' + Math.floor(1000 + Math.random() * 9000);
  }

  if (masjids.some(m => m.masjid_id === masjidId)) {
    showToast('This Masjid ID is already taken. Please choose another.');
    return;
  }

  const newMasjid = {
    masjid_id: masjidId,
    name,
    locality,
    city,
    admin_email: currentUser.email,
    ustad_count: ustadCount,
    delivery_location: location || 'Madrasa Room #2, Ground Floor',
    delivery_notes: notes || 'Please bring food in covered containers.'
  };

  masjids.unshift(newMasjid);

  masjidUsers.push({
    masjid_id: masjidId,
    email: currentUser.email,
    role: 'admin',
    name: currentUser.name,
    phone: currentUser.phone
  });

  saveLocalState();
  closeModal('modal-enroll-masjid');
  showToast(`🎉 Enrolled ${name}! Unique ID: ${masjidId}`);
  enterMasjid(masjidId, 'admin');
}

// ==========================================
// 6. ROLE DIFFERENTIATION UNDER A MASJID
// ==========================================
function selectMasjid(masjidId) {
  const masjid = masjids.find(m => m.masjid_id === masjidId);
  if (!masjid) {
    showToast('Masjid not found');
    return;
  }

  const aff = masjidUsers.find(u => u.masjid_id === masjidId && u.email.toLowerCase() === currentUser.email.toLowerCase());

  if (aff && aff.role) {
    enterMasjid(masjidId, aff.role);
  } else {
    document.getElementById('join-target-masjid-id').value = masjidId;
    document.getElementById('join-masjid-subtitle').textContent = `${masjid.name} (ID: ${masjid.masjid_id})`;
    openModal('modal-join-masjid');
  }
}

function confirmJoinWithRole(role) {
  const masjidId = document.getElementById('join-target-masjid-id')?.value;
  const masjid = masjids.find(m => m.masjid_id === masjidId);
  if (!masjid) return;

  masjidUsers.push({
    masjid_id: masjidId,
    email: currentUser.email,
    role: role,
    name: currentUser.name,
    phone: currentUser.phone
  });

  if (role === 'delivery' || role === 'member') {
    const existingHouse = houses.find(h => h.masjid_id === masjidId && (h.phone === currentUser.phone || (h.email && h.email.toLowerCase() === currentUser.email.toLowerCase())));
    if (!existingHouse) {
      houses.push({
        id: Date.now(),
        masjid_id: masjidId,
        house: `${currentUser.name.split(' ')[0]} Household`,
        head: currentUser.name,
        phone: currentUser.phone || '9876543210',
        email: currentUser.email,
        zone: 'Zone A - North',
        active: true,
        role: role
      });
    } else {
      existingHouse.role = role;
    }
  } else if (role === 'ustad') {
    const existingUstad = ustads.find(u => u.masjid_id === masjidId && u.email === currentUser.email);
    if (!existingUstad) {
      ustads.push({
        id: Date.now(),
        masjid_id: masjidId,
        name: currentUser.name,
        email: currentUser.email,
        room: 'Room #1',
        subject: 'General Studies',
        diet: 'No restrictions'
      });
    }
  }

  saveLocalState();
  closeModal('modal-join-masjid');
  showToast(`Joined ${masjid.name} as ${role.toUpperCase()}!`);
  enterMasjid(masjidId, role);
}

function enterMasjid(masjidId, role) {
  activeMasjid = masjids.find(m => m.masjid_id === masjidId);
  if (!activeMasjid) {
    showToast('Error finding active masjid');
    return;
  }
  currentRole = role;
  saveLocalState();

  if (role === 'admin') {
    setupAdminView();
    showPage('page-admin');
    showToast(`Admin Portal: ${activeMasjid.name} 👑`);
  } else if (role === 'ustad') {
    setupUstadView();
    showPage('page-ustad');
    showToast(`Welcome Ustad ${currentUser.name} 👳`);
  } else {
    setupMemberView();
    showPage('page-member');
    showToast(`Welcome, ${currentUser.name}! ${role === 'member' ? '👤' : '🛵'}`);
  }
}

function switchMasjid() {
  activeMasjid = null;
  currentRole = null;
  saveLocalState();
  openMasjidSelection();
}

function copyActiveMasjidId() {
  if (!activeMasjid) return;
  navigator.clipboard.writeText(activeMasjid.masjid_id)
    .then(() => showToast(`📋 Copied Masjid ID: ${activeMasjid.masjid_id}`))
    .catch(() => showToast(`Masjid ID: ${activeMasjid.masjid_id}`));
}

// ==========================================
// 7. USTAD PORTAL IMPLEMENTATION
// ==========================================
function setupUstadView() {
  if (!activeMasjid || !currentUser) return;
  
  const nameEl = document.getElementById('ustad-welcome-name');
  if (nameEl) nameEl.textContent = currentUser.name;

  const masjidDisp = document.getElementById('ustad-masjid-name-display');
  if (masjidDisp) masjidDisp.textContent = `${activeMasjid.name} (ID: ${activeMasjid.masjid_id})`;

  const roomInst = document.getElementById('ustad-room-instructions');
  if (roomInst) roomInst.textContent = activeMasjid.delivery_location || 'Madrasa Room #2, Ground Floor';

  const roomNotes = document.getElementById('ustad-room-notes');
  if (roomNotes) roomNotes.textContent = activeMasjid.delivery_notes || 'Delivered directly to scholar quarters.';

  const myUstadRec = ustads.find(u => u.masjid_id === activeMasjid.masjid_id && u.email === currentUser.email);
  if (myUstadRec) {
    document.getElementById('ustad-info-name').textContent = myUstadRec.name;
    document.getElementById('ustad-info-room').textContent = myUstadRec.room || 'Room #1';
    document.getElementById('ustad-info-diet').textContent = myUstadRec.diet || 'No restrictions';
    document.getElementById('ustad-info-subject').textContent = myUstadRec.subject || 'Qur\'an & Islamic Studies';
  }

  renderUstadMeals();
}

function setUstadTab(tab) {
  ['today', 'upcoming', 'info'].forEach(t => {
    const el = document.getElementById('ustad-tab-' + t);
    const btn = document.getElementById('utab-' + t);
    if (el) el.style.display = (t === tab) ? 'block' : 'none';
    if (btn) {
      btn.className = (t === tab)
        ? 'py-2.5 font-bold border-b-2 border-amber-400 text-white transition'
        : 'py-2.5 font-semibold text-amber-200 opacity-70 transition';
    }
  });
}

function renderUstadMeals() {
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  document.getElementById('ustad-today-date').textContent = now.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
  document.getElementById('ustad-confirmed-count').textContent = activeMasjid.ustad_count || 3;

  const todayDuties = (roster[todayKey] || []).filter(d => !d.masjid_id || d.masjid_id === activeMasjid.masjid_id);
  const container = document.getElementById('ustad-slots-container');
  if (!container) return;

  const masjidHouses = houses.filter(h => !h.masjid_id || h.masjid_id === activeMasjid.masjid_id);

  container.innerHTML = SLOTS_ORDER.map(slot => {
    const duty = todayDuties.find(d => d.slot === slot);
    const house = duty ? masjidHouses.find(h => h.id === duty.houseId) : null;
    
    let statusBadge = '<span class="badge badge-pending">⏳ Scheduled</span>';
    if (duty && duty.status === 'confirmed') statusBadge = '<span class="badge badge-confirmed">✅ Confirmed</span>';
    if (duty && duty.status === 'delivered') statusBadge = '<span class="badge badge-delivered">🍽️ Delivered</span>';

    return `
      <div class="card p-3.5 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl">
            ${SLOT_ICONS[slot]}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h4 class="font-bold text-slate-800 text-sm">${SLOT_LABELS[slot]}</h4>
              <span class="text-xs text-slate-400 font-medium">(${SLOT_TIMES[slot]})</span>
            </div>
            <p class="text-xs font-semibold text-slate-600 mt-0.5">
              ${house ? `🏠 ${house.house} (${house.head})` : '<span class="text-amber-600">Pending Assignment</span>'}
            </p>
          </div>
        </div>
        <div class="text-right space-y-1">
          <div>${statusBadge}</div>
          ${house && house.phone ? `
            <div class="flex items-center justify-end gap-1.5">
              <a href="tel:${house.phone}" class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100">📞 Call</a>
              <a href="https://wa.me/91${house.phone}" target="_blank" class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 hover:bg-emerald-100">💬 WA</a>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  const upcomingListEl = document.getElementById('ustad-upcoming-list');
  if (upcomingListEl) {
    let html = '';
    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const dDuties = (roster[k] || []).filter(x => !x.masjid_id || x.masjid_id === activeMasjid.masjid_id);
      
      html += `
        <div class="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span class="font-bold text-slate-800">${d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <p class="text-slate-500">${dDuties.length} meal slot(s) planned</p>
          </div>
          <span class="font-mono text-emerald-700 font-bold">${dDuties.length ? '✓ Scheduled' : 'Pending'}</span>
        </div>
      `;
    }
    upcomingListEl.innerHTML = html;
  }
}

// ==========================================
// 8. FOOD DELIVERY / MEMBER PORTAL
// ==========================================
function setupMemberView() {
  if (!activeMasjid || !currentUser) return;

  const welcomeEl = document.getElementById('member-welcome-name');
  if (welcomeEl) welcomeEl.textContent = currentUser.name;

  const masjidDisp = document.getElementById('member-masjid-name-display');
  if (masjidDisp) masjidDisp.textContent = `${activeMasjid.name} (ID: ${activeMasjid.masjid_id})`;

  const locEl = document.getElementById('member-delivery-location');
  if (locEl) locEl.textContent = activeMasjid.delivery_location || 'Madrasa Room #2, Ground Floor';

  const notesEl = document.getElementById('member-delivery-notes');
  if (notesEl) notesEl.textContent = activeMasjid.delivery_notes || 'Please bring food in covered containers before meal timing.';

  const roleIconEl = document.getElementById('member-role-icon');
  const roleBadgeEl = document.getElementById('member-role-badge');
  if (currentRole === 'member') {
    if (roleIconEl) roleIconEl.textContent = '👤';
    if (roleBadgeEl) {
      roleBadgeEl.textContent = 'JAMATH MEMBER';
      roleBadgeEl.className = 'bg-purple-300/30 text-purple-100 text-[10px] font-bold px-1.5 py-0.5 rounded';
    }
  } else {
    if (roleIconEl) roleIconEl.textContent = '🛵';
    if (roleBadgeEl) {
      roleBadgeEl.textContent = 'DELIVERY';
      roleBadgeEl.className = 'bg-emerald-300/30 text-emerald-100 text-[10px] font-bold px-1.5 py-0.5 rounded';
    }
  }

  renderMemberHome();
}

function setMemberTab(tab) {
  ['home', 'upcoming', 'history'].forEach(t => {
    const el = document.getElementById('member-tab-' + t);
    const btn = document.getElementById('mtab-' + t);
    if (el) el.style.display = (t === tab) ? 'block' : 'none';
    if (btn) {
      btn.className = (t === tab)
        ? 'text-xs font-bold text-white border-b-2 border-white px-3 py-2'
        : 'text-xs font-bold text-white text-opacity-70 border-b-2 border-transparent px-3 py-2';
    }
  });

  if (tab === 'home') renderMemberHome();
  if (tab === 'upcoming') renderMemberUpcoming();
  if (tab === 'history') renderMemberHistory();
}

function renderMemberHome() {
  const myHouse = houses.find(h => (!h.masjid_id || h.masjid_id === activeMasjid.masjid_id) && (h.phone === currentUser.phone || (h.email && h.email.toLowerCase() === currentUser.email.toLowerCase())));
  const myHouseId = myHouse ? myHouse.id : null;

  const now = new Date();
  let nextDuty = null;
  let nextDutyDateStr = '';

  for (let i = 0; i <= 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const duties = (roster[k] || []).filter(x => (!x.masjid_id || x.masjid_id === activeMasjid.masjid_id) && x.houseId === myHouseId);
    if (duties.length) {
      nextDuty = duties[0];
      nextDutyDateStr = d.toLocaleDateString('en-IN', { weekday: 'long', month: 'short', day: 'numeric' });
      break;
    }
  }

  const dateEl = document.getElementById('next-duty-date');
  const slotEl = document.getElementById('next-duty-slot');
  const timeEl = document.getElementById('next-duty-time');
  const countEl = document.getElementById('next-duty-count');
  const badgeEl = document.getElementById('next-duty-status-badge');

  if (nextDuty) {
    const rolePrefix = nextDuty.role === 'member' ? '👤 Jamath Member • ' : (nextDuty.role === 'delivery' ? '🛵 Delivery • ' : '');
    if (dateEl) dateEl.textContent = nextDutyDateStr;
    if (slotEl) slotEl.textContent = rolePrefix + (SLOT_LABELS[nextDuty.slot] || 'Meal Slot');
    if (timeEl) timeEl.textContent = SLOT_TIMES[nextDuty.slot] || '';
    if (countEl) countEl.textContent = activeMasjid.ustad_count || 3;
    if (badgeEl) {
      badgeEl.className = 'badge badge-' + (nextDuty.status || 'pending');
      badgeEl.textContent = (nextDuty.status === 'confirmed') ? 'Confirmed' : (nextDuty.status === 'delivered' ? 'Delivered' : 'Pending');
    }
  } else {
    if (dateEl) dateEl.textContent = 'No Immediate Duties';
    if (slotEl) slotEl.textContent = currentRole === 'member' ? '👤 Member Active' : 'Free';
    if (timeEl) timeEl.textContent = '';
    if (countEl) countEl.textContent = activeMasjid.ustad_count || 3;
    if (badgeEl) {
      badgeEl.className = 'badge badge-confirmed';
      badgeEl.textContent = 'Active';
    }
  }

  const ustadsListEl = document.getElementById('member-ustads-list');
  if (ustadsListEl) {
    const activeUstads = ustads.filter(u => !u.masjid_id || u.masjid_id === activeMasjid.masjid_id);
    if (activeUstads.length === 0) {
      ustadsListEl.innerHTML = '<p class="text-xs text-slate-400">No ustads registered yet.</p>';
    } else {
      ustadsListEl.innerHTML = activeUstads.map(u => `
        <div class="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <p class="font-bold text-slate-800">👳 ${u.name}</p>
            <p class="text-slate-500">${u.room || 'Room #1'} • ${u.diet || 'Standard Diet'}</p>
          </div>
          <span class="badge badge-admin">${u.subject || 'Scholar'}</span>
        </div>
      `).join('');
    }
  }
}

function renderMemberUpcoming() {
  const listEl = document.getElementById('upcoming-duties-list');
  if (!listEl || !activeMasjid || !currentUser) return;

  const myHouse = houses.find(h => (!h.masjid_id || h.masjid_id === activeMasjid.masjid_id) && (h.phone === currentUser.phone || (h.email && h.email.toLowerCase() === currentUser.email.toLowerCase())));
  const myHouseId = myHouse ? myHouse.id : null;

  const myDuties = [];
  Object.keys(roster).sort().forEach(dateKey => {
    (roster[dateKey] || []).forEach(d => {
      if (d.houseId === myHouseId && (!d.masjid_id || d.masjid_id === activeMasjid.masjid_id)) {
        myDuties.push(d);
      }
    });
  });

  if (myDuties.length === 0) {
    listEl.innerHTML = `
      <div class="card p-6 text-center text-slate-400 text-xs">
        <p class="text-2xl mb-2">🗓️</p>
        <p class="font-semibold text-slate-600">No upcoming duties scheduled yet.</p>
        <p class="mt-1">Click "+ Assign Duty" above to choose your rotation date & role!</p>
      </div>
    `;
    return;
  }

  listEl.innerHTML = myDuties.map(d => {
    const roleBadge = d.role === 'member'
      ? '<span class="badge badge-member text-[11px]">👤 Jamath Member</span>'
      : '<span class="badge badge-delivery text-[11px]">🛵 Food Delivery</span>';
    return `
      <div class="card p-4 flex items-center justify-between hover:shadow-sm transition">
        <div class="space-y-1">
          <div class="flex items-center gap-2">
            <span class="font-bold text-slate-800 text-sm">${d.duty_date}</span>
            <span class="badge badge-pending">${SLOT_LABELS[d.slot] || d.slot}</span>
          </div>
          <div>${roleBadge}</div>
        </div>
        <div class="text-right">
          <span class="badge badge-${d.status || 'pending'}">${d.status || 'Pending'}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderMemberHistory() {
  const listEl = document.getElementById('history-duties-list');
  if (!listEl) return;
  listEl.innerHTML = `
    <div class="card p-4 text-center text-slate-400 text-xs">
      <p>All completed rotations will be archived here.</p>
    </div>
  `;
}

function openSelfAssignDutyModal() {
  if (!activeMasjid) return;
  const dateEl = document.getElementById('self-duty-date');
  if (dateEl) {
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    dateEl.value = tmrw.toISOString().split('T')[0];
  }
  const roleEl = document.getElementById('self-duty-role');
  if (roleEl) {
    roleEl.value = currentRole === 'delivery' ? 'delivery' : 'member';
  }
  openModal('modal-self-assign-duty');
}

function saveSelfAssignedDuty() {
  const dateVal = document.getElementById('self-duty-date')?.value;
  const slot = document.getElementById('self-duty-slot')?.value || 'lunch';
  const role = document.getElementById('self-duty-role')?.value || 'member';

  if (!dateVal) {
    showToast('Please select a duty date');
    return;
  }

  let myHouse = houses.find(h => (!h.masjid_id || h.masjid_id === activeMasjid.masjid_id) && (h.phone === currentUser.phone || (h.email && h.email.toLowerCase() === currentUser.email.toLowerCase())));
  if (!myHouse) {
    myHouse = {
      id: Date.now(),
      masjid_id: activeMasjid.masjid_id,
      house: `${currentUser.name.split(' ')[0]} Household`,
      head: currentUser.name,
      phone: currentUser.phone || '9876543210',
      email: currentUser.email,
      zone: 'Zone A - North',
      active: true,
      role: role
    };
    houses.push(myHouse);
  }

  if (!roster[dateVal]) roster[dateVal] = [];
  roster[dateVal].push({
    id: Date.now(),
    masjid_id: activeMasjid.masjid_id,
    duty_date: dateVal,
    slot,
    houseId: myHouse.id,
    role,
    status: 'pending'
  });

  currentRole = role;
  myHouse.role = role;
  const userAff = masjidUsers.find(u => u.masjid_id === activeMasjid.masjid_id && u.email.toLowerCase() === currentUser.email.toLowerCase());
  if (userAff) userAff.role = role;

  saveLocalState();
  closeModal('modal-self-assign-duty');
  showToast(`✅ Assigned duty for ${dateVal} as ${role === 'member' ? 'Member 👤' : 'Delivery 🛵'}!`);
  setupMemberView();
  setMemberTab('upcoming');
}

function confirmDuty() {
  showToast('✅ Duty Confirmed! Jazakallah Khair.');
  const badgeEl = document.getElementById('next-duty-status-badge');
  if (badgeEl) {
    badgeEl.className = 'badge badge-confirmed';
    badgeEl.textContent = 'Confirmed';
  }
}

function markDelivered() {
  showToast('🍽️ Food Marked as Delivered! Thank you.');
  const badgeEl = document.getElementById('next-duty-status-badge');
  if (badgeEl) {
    badgeEl.className = 'badge badge-delivered';
    badgeEl.textContent = 'Delivered';
  }
}