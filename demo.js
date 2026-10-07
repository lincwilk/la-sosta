(function () {
  'use strict';

  var KEY = 'laSostaDemoV1';
  var menus = window.LA_SOSTA_MENUS || {};
  var cats = {
    pizze: 'Pizze',
    speciali: 'Speciali & bianche',
    primi: 'Primi',
    secondi: 'Secondi',
    hamburger: 'Hamburger',
    contorni: 'Contorni',
    dolci: 'Dolci'
  };

  var state = {
    user: null,
    reservations: [{
      id: 'LS-1001',
      name: 'Marco Rossi',
      phone: '333 1234567',
      date: '2026-10-10',
      time: '20:30',
      people: 12,
      note: 'Compleanno',
      status: 'Confermata',
      preorder: {
        items: {
          'Margherita': {qty: 4, cat: 'pizze', price: '5,00'},
          'Diavola': {qty: 3, cat: 'pizze', price: '8,00'},
          'Spaghetti alla carbonara': {qty: 2, cat: 'primi', price: '13,00'},
          'Fritto La Sosta (calamari, gamberi, polpo, gamberoni)*': {qty: 1, cat: 'secondi', price: '19,00'}
        },
        note: '2 persone vegetariane'
      },
      preorderStatus: 'Ricevuto'
    }]
  };

  function load() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved) state = JSON.parse(saved);
    } catch (e) {}
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (m) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m];
    });
  }

  function root() { return document.getElementById('demo-app'); }

  function nav(active) {
    return '<div class="demo-tabs">' +
      '<button class="' + (active === 'client' ? 'active' : '') + '" onclick="demoView(\'client\')">Area cliente</button>' +
      '<button class="' + (active === 'admin' ? 'active' : '') + '" onclick="demoView(\'admin\')">Area ristorante</button>' +
      '<button onclick="demoLogout()">Esci</button>' +
    '</div>';
  }

  function render() {
    if (!root()) return;
    if (!state.user) renderLogin();
    else if (state.user === 'admin') renderAdmin();
    else renderClient();
  }

  function renderLogin() {
    root().innerHTML =
      '<div class="demo-login">' +
        '<div class="demo-head"><div><p class="eyebrow">LA SOSTA · PROTOTIPO</p><h1>Area demo</h1><p class="demo-muted">Versione di prova: nessun dato viene inviato a un server.</p></div></div>' +
        '<div class="demo-panel"><h2>Scegli un profilo</h2><p class="demo-muted">Usa i due ruoli per mostrare il funzionamento al ristorante.</p>' +
          '<div class="demo-user-buttons">' +
            '<button onclick="demoLogin(\'client\')">👤 Cliente demo<br><small>Marco Rossi</small></button>' +
            '<button onclick="demoLogin(\'admin\')">🍽️ Ristorante<br><small>La Sosta · Admin</small></button>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function renderClient() {
    var mine = state.reservations.filter(function (r) { return r.name === 'Marco Rossi'; });
    root().innerHTML =
      '<div class="demo-shell"><div class="demo-head"><div><p class="eyebrow">AREA CLIENTE · DEMO</p><h1>Ciao, Marco.</h1><p class="demo-muted">Gestisci le tue prenotazioni e prepara il pre-ordine per i gruppi.</p></div><div class="demo-badge">LOCALSTORAGE</div></div>' +
      nav('client') +
      '<div class="demo-grid">' +
        '<section class="demo-panel"><h2>Nuova prenotazione</h2><div class="demo-form">' +
          '<label>Nome<input id="rname" value="Marco Rossi"></label>' +
          '<label>Telefono<input id="rphone" value="333 1234567"></label>' +
          '<label>Data<input id="rdate" type="date" value="2026-10-17"></label>' +
          '<label>Ora<input id="rtime" type="time" value="20:30"></label>' +
          '<label>Persone<input id="rpeople" type="number" min="1" value="4"></label>' +
          '<label class="full">Note<textarea id="rnote" placeholder="Allergie, compleanno, richieste..."></textarea></label>' +
        '</div><div class="demo-actions"><button class="btn" onclick="newReservation()">Invia richiesta</button></div></section>' +
        '<section class="demo-panel"><h2>Le mie prenotazioni</h2><div class="demo-list">' +
          (mine.length ? mine.map(resCard).join('') : '<div class="empty">Nessuna prenotazione.</div>') +
        '</div></section>' +
      '</div></div>';
  }

  function resCard(r) {
    var group = Number(r.people) >= 8;
    return '<div class="demo-row"><div class="demo-row-top"><div><b>' + esc(r.date) + ' · ' + esc(r.time) + '</b><div class="demo-muted">' + esc(r.people) + ' persone · ' + esc(r.note || 'Nessuna nota') + '</div></div><span class="demo-status ok">' + esc(r.status) + '</span></div>' +
      (group ? '<div class="demo-actions"><button class="btn" onclick="openPreorder(\'' + esc(r.id) + '\')">Preparare il pre-ordine</button></div>' : '') +
      '</div>';
  }

  function renderPreorder(id) {
    var r = state.reservations.find(function (x) { return x.id === id; });
    if (!r) return render();

    var html = '<div class="demo-shell"><div class="demo-head"><div><p class="eyebrow">PRE-ORDINE · GRUPPO</p><h1>' + esc(r.people) + ' persone.</h1><p class="demo-muted">Prenotazione ' + esc(r.date) + ' · ' + esc(r.time) + ' · ' + esc(r.id) + '</p></div></div>' +
      nav('client') +
      '<div class="demo-panel"><div class="alert"><b>Importante:</b> questo è un pre-ordine. La comanda definitiva viene confermata al vostro arrivo.</div><div id="preorder-list">';

    Object.keys(cats).forEach(function (cat) {
      html += '<div><h3>' + cats[cat] + '</h3>';
      (menus[cat] || []).forEach(function (item) {
        html += '<div class="qty-row"><div><b>' + esc(item[0]) + '</b>' + (item[1] ? '<div class="demo-muted">' + esc(item[1]) + '</div>' : '') + '</div><div class="qty"><button onclick="changeQty(this,-1)">−</button><b data-name="' + esc(item[0]) + '" data-cat="' + cat + '" data-price="' + esc(item[2]) + '">0</b><button onclick="changeQty(this,1)">+</button></div></div>';
      });
      html += '</div>';
    });

    html += '</div><div class="demo-form" style="margin-top:25px"><label class="full">Osservazioni<textarea id="ponote" placeholder="Es.: 2 vegetariani, 1 persona senza frutti di mare..."></textarea></label></div><div class="demo-actions"><button class="btn" onclick="sendPreorder(\'' + esc(r.id) + '\')">Invia pre-ordine</button><button class="btn btn-ghost" onclick="render()">Annulla</button></div></div></div>';

    root().innerHTML = html;
  }

  function renderAdmin() {
    var all = state.reservations;
    var pending = all.filter(function (r) { return r.preorderStatus === 'Ricevuto'; }).length;
    var groups = all.filter(function (r) { return Number(r.people) >= 8; }).length;

    root().innerHTML =
      '<div class="demo-shell"><div class="demo-head"><div><p class="eyebrow">AREA RISTORANTE · DEMO</p><h1>Buonasera, La Sosta.</h1><p class="demo-muted">Dashboard di prova per prenotazioni e pre-ordini.</p></div><div class="demo-badge">ADMIN</div></div>' +
      nav('admin') +
      '<div class="demo-kpis"><div class="demo-kpi"><b>' + all.length + '</b><span>Prenotazioni</span></div><div class="demo-kpi"><b>' + groups + '</b><span>Gruppi</span></div><div class="demo-kpi"><b>' + pending + '</b><span>Pre-ordini nuovi</span></div><div class="demo-kpi"><b>' + all.filter(function(r){return r.status === 'Confermata';}).length + '</b><span>Confermate</span></div></div>' +
      '<section class="demo-panel"><h2>Agenda & pre-ordini</h2><div class="demo-list">' + (all.length ? all.map(adminCard).join('') : '<div class="empty">Nessun dato.</div>') + '</div></section></div>';
  }

  function adminCard(r) {
    var items = 'Nessun pre-ordine';
    if (r.preorder && r.preorder.items) {
      items = Object.keys(r.preorder.items).map(function(n) {
        return r.preorder.items[n].qty + '× ' + n;
      }).join(' · ');
    }
    return '<div class="demo-row"><div class="demo-row-top"><div><h3>' + esc(r.name) + '</h3><b>' + esc(r.date) + ' · ' + esc(r.time) + ' · ' + esc(r.people) + ' persone</b><div class="demo-muted">' + esc(r.phone) + ' · ' + esc(r.note || '') + '</div></div><span class="demo-status pending">' + esc(r.preorderStatus || r.status) + '</span></div><p class="demo-muted" style="margin:12px 0"><b>Pre-ordine:</b> ' + esc(items) + '</p>' +
      (r.preorder && r.preorder.note ? '<p class="demo-muted"><b>Note cucina:</b> ' + esc(r.preorder.note) + '</p>' : '') +
      '<div class="demo-actions">' + (r.preorder ? '<button class="btn" onclick="confirmPreorder(\'' + esc(r.id) + '\')">Conferma ricezione</button>' : '') + '<button class="btn btn-ghost" onclick="confirmReservation(\'' + esc(r.id) + '\')">Conferma prenotazione</button></div></div>';
  }

  window.demoLogin = function(role) { state.user = role; save(); render(); };
  window.demoLogout = function() { state.user = null; save(); render(); };
  window.demoView = function(role) { state.user = role; save(); render(); };
  window.newReservation = function() {
    var r = {
      id: 'LS-' + String(Date.now()).slice(-6),
      name: document.getElementById('rname').value,
      phone: document.getElementById('rphone').value,
      date: document.getElementById('rdate').value,
      time: document.getElementById('rtime').value,
      people: Number(document.getElementById('rpeople').value),
      note: document.getElementById('rnote').value,
      status: 'In attesa'
    };
    state.reservations.unshift(r);
    save();
    render();
  };
  window.openPreorder = function(id) { renderPreorder(id); };
  window.changeQty = function(btn, delta) {
    var b = btn.parentElement.querySelector('b[data-name]');
    if (b) b.textContent = Math.max(0, Number(b.textContent) + delta);
  };
  window.sendPreorder = function(id) {
    var r = state.reservations.find(function(x){return x.id === id;});
    if (!r) return render();
    var out = {};
    document.querySelectorAll('#preorder-list b[data-name]').forEach(function(b) {
      var q = Number(b.textContent);
      if (q) out[b.getAttribute('data-name')] = {qty:q, cat:b.getAttribute('data-cat'), price:b.getAttribute('data-price')};
    });
    r.preorder = {items:out, note:document.getElementById('ponote').value};
    r.preorderStatus = 'Ricevuto';
    save();
    render();
  };
  window.confirmPreorder = function(id) {
    var r = state.reservations.find(function(x){return x.id === id;});
    if (r) { r.preorderStatus = 'Confermato'; save(); render(); }
  };
  window.confirmReservation = function(id) {
    var r = state.reservations.find(function(x){return x.id === id;});
    if (r) { r.status = 'Confermata'; save(); render(); }
  };

  load();
  render();
})();