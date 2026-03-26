let currentUser = localStorage.getItem('danzzbot_user');
        let currentBotsData = {};

        if(currentUser) showDashboard();

        async function req(url, body) {
            body.user = currentUser; 
            const res = await fetch(url, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body) });
            return res.json();
        }

        async function login() {
            const u = document.getElementById('logUser').value, p = document.getElementById('logPass').value;
            if(!u || !p) return alert("Silakan lengkapi form!");
            const btn = document.getElementById('btn-login');
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Memeriksa...';
            
            const res = await req('/api/login', { u, p });
            if(res.success) { 
                currentUser = u; 
                localStorage.setItem('danzzbot_user', u); 
                if (res.isAdmin) localStorage.setItem('danzzbot_admin', 'true');
                else localStorage.removeItem('danzzbot_admin');
                showDashboard(); 
            } 
            else { 
                alert("Gagal Login! Username atau password salah."); 
                btn.innerHTML = '<i class="fa-solid fa-right-to-bracket mr-2"></i> Masuk Sistem'; 
            }
        }

        function logout() { localStorage.clear(); location.reload(); }

        function showDashboard() {
            document.getElementById('login-view').style.display = 'none';
            document.getElementById('dashboard-view').classList.remove('hidden');
            document.getElementById('user-display').innerText = currentUser;
            
            if (localStorage.getItem('danzzbot_admin') === 'true') {
                document.getElementById('admin-section').classList.remove('hidden');
            }
            
            loadBots(); setInterval(loadBots, 3000);
        }

        async function addUser() {
            const u = document.getElementById('newUsername').value, p = document.getElementById('newPassword').value;
            if(!u || !p) return alert("Isi username & password!");
            const res = await req('/api/add_user', { newU: u, newP: p });
            alert(res.message);
            if(res.success) { document.getElementById('newUsername').value = ''; document.getElementById('newPassword').value = ''; }
        }

        async function pairBot() {
            const bot = document.getElementById('botNumber').value; if(!bot) return;
            document.getElementById('btn-pair').classList.add('hidden');
            document.getElementById('loading-section').classList.remove('hidden');
            document.getElementById('code-section').classList.add('hidden');
            
            const res = await req('/api/pair', { botNumber: bot });
            document.getElementById('loading-section').classList.add('hidden');
            
            if(res.success) {
                document.getElementById('code-section').classList.remove('hidden');
                document.getElementById('pairing-code').innerText = res.code;
            } else { 
                alert(res.message); 
            }
            document.getElementById('btn-pair').classList.remove('hidden');
            loadBots();
        }

        async function actionBot(botNumber, action) {
            if(action === 'delete' && !confirm('Yakin hapus permanen?')) return;
            await req('/api/bot_action', { botNumber, action }); loadBots();
        }

        function openEditModal(bot) {
            const data = currentBotsData[bot];
            document.getElementById('edit-oldNumber').value = bot;
            document.getElementById('edit-botName').value = data.botName || 'Danzz';
            document.getElementById('edit-ownerName').value = data.ownerName || 'Owner';
            document.getElementById('edit-ownerNumber').value = data.ownerNum || '';
            document.getElementById('edit-packname').value = data.packname || 'Created by Danzz';
            let cleanAuthor = data.author || '';
            cleanAuthor = cleanAuthor.replace(' | izjtanzala.web.id', '');
            document.getElementById('edit-author').value = cleanAuthor;
            document.getElementById('edit-modal').classList.remove('hidden');
        }

        function closeEditModal() { document.getElementById('edit-modal').classList.add('hidden'); }

        async function saveEditBot() {
            const oldNumber = document.getElementById('edit-oldNumber').value;
            const res = await req('/api/edit_bot', { 
                oldNumber, 
                botName: document.getElementById('edit-botName').value, 
                ownerName: document.getElementById('edit-ownerName').value,
                ownerNum: document.getElementById('edit-ownerNumber').value,
                packname: document.getElementById('edit-packname').value, 
                author: document.getElementById('edit-author').value 
            });
            if(res.success) { closeEditModal(); loadBots(); }
        }

        async function loadBots() {
            try {
                const res = await req('/api/get_bots', {});
                currentBotsData = res.bots; 
                const tbody = document.getElementById('bot-list'); tbody.innerHTML = '';
                for(const bot in res.bots) {
                    const d = res.bots[bot];
                    const isOnline = d.status === 'online';
                    const badge = isOnline 
                        ? '<span class="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center"><i class="fa-solid fa-circle-check mr-1.5"></i>ONLINE</span>' 
                        : '<span class="bg-rose-100 text-rose-700 px-3 py-1.5 rounded-full text-[11px] font-bold inline-flex items-center"><i class="fa-solid fa-circle-xmark mr-1.5"></i>OFFLINE</span>';
                    
                    tbody.innerHTML += `
                        <tr class="hover:bg-slate-50 transition-colors">
                            <td class="p-4 border-b border-slate-100">
                                <div class="font-extrabold text-slate-800 text-sm mb-1.5 flex items-center"><i class="fa-brands fa-whatsapp text-emerald-500 mr-2 text-lg"></i>${bot}</div>
                                <div class="text-[11px] text-slate-500 font-semibold flex items-center gap-3">
                                    <span><i class="fa-solid fa-user text-slate-400 mr-1"></i> Mas ${d.botName || 'Danzz'}</span>
                                    <span><i class="fa-solid fa-crown text-amber-500 mr-1"></i> ${d.ownerName || 'Owner'}</span>
                                    <span><i class="fa-solid fa-phone text-blue-400 mr-1"></i> ${d.ownerNum || 'Belum di-set'}</span>
                                </div>
                            </td>
                            <td class="p-4 border-b border-slate-100 text-center">${badge}</td>
                            <td class="p-4 border-b border-slate-100 text-right space-x-1.5">
                                ${!isOnline ? `<button onclick="actionBot('${bot}', 'start')" class="text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-lg text-sm"><i class="fa-solid fa-play"></i></button>` : ''}
                                ${isOnline ? `<button onclick="actionBot('${bot}', 'stop')" class="text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3.5 py-2 rounded-lg text-sm"><i class="fa-solid fa-stop"></i></button>` : ''}
                                ${isOnline ? `<button onclick="actionBot('${bot}', 'restart')" class="text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg text-sm"><i class="fa-solid fa-rotate-right"></i></button>` : ''}
                                <button onclick="openEditModal('${bot}')" class="text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3.5 py-2 rounded-lg text-sm"><i class="fa-solid fa-sliders"></i></button>
                                <button onclick="actionBot('${bot}', 'delete')" class="text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-lg text-sm"><i class="fa-solid fa-trash-can"></i></button>
                            </td>
                        </tr>`;
                }
            } catch(e) {}
              }
