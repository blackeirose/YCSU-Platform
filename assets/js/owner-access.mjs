/** Owner login uses the existing Supabase Auth account, never a Registry API key. */
export async function setupOwnerAccess({ url, key, setAllowed, isLive, status }) {
  const dialog = document.getElementById('owner-dialog');
  const form = document.getElementById('owner-form');
  const button = document.getElementById('owner-access');
  const toolbar = document.getElementById('reorder-toolbar');
  const message = document.getElementById('owner-message');
  let client, session = null, verified = false, authRevision = 0;
  const loadClient = async () => {
    if (client) return client;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/assets/vendor/supabase-2.116.0.js';
      script.onload = resolve; script.onerror = reject; document.head.append(script);
    });
    client = window.supabase.createClient(url, key, {
      auth: { storageKey: 'ycsu-main-owner-session', persistSession:true, autoRefreshToken:true, detectSessionInUrl:true },
    });
    client.auth.onAuthStateChange((_event, next) => {
      // Do not await another Auth SDK method inside its auth-state callback.
      setTimeout(() => { void validateSession(next); }, 0);
    });
    return client;
  };
  async function validateSession(next) {
    const revision = ++authRevision;
    session = next; verified = false; setAllowed(false); toolbar.hidden = true;
    button.textContent = next ? 'Sign out' : 'Owner sign in';
    if (!next) return;
    try {
      const response = await fetch(`${url}/functions/v1/registry-ops`, {
        method:'POST', headers:{apikey:key, Authorization:`Bearer ${next.access_token}`, 'Content-Type':'application/json'},
        body:JSON.stringify({operation:'authorize'}),
      });
      if (!response.ok || !(await response.json()).canReorder) throw new Error('Owner access required.');
      if (revision !== authRevision) return;
      verified = true; toolbar.hidden = false; setAllowed(isLive());
      status.textContent = isLive() ? 'Drag the grip with a mouse, or hold a non-link card area for half a second. On touch, hold the grip. Arrow keys also work.' : 'Offline snapshot: reordering unavailable. Reload to reconnect.';
      if (dialog.open) dialog.close();
    } catch {
      if (revision !== authRevision) return;
      toolbar.hidden = false; status.textContent = 'Reordering unavailable. Sign in with the authorized owner account or retry later.';
    }
  }
  button.addEventListener('click', async () => {
    button.disabled = true;
    try {
      const c = await loadClient();
      if (session) { await c.auth.signOut({scope:'local'}); await validateSession(null); }
      else { message.textContent = ''; dialog.showModal(); }
    } catch { message.textContent = 'Sign-in could not load. Please try again.'; dialog.showModal(); }
    finally { button.disabled = false; }
  });
  document.getElementById('owner-close').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', async event => {
    event.preventDefault(); const submit = form.querySelector('[type=submit]'); submit.disabled = true;
    try {
      const c = await loadClient();
      const {error} = await c.auth.signInWithOtp({
        email:document.getElementById('owner-email').value.trim(),
        options:{shouldCreateUser:false, emailRedirectTo:'https://main.ycsu.cc/'},
      });
      if (error) throw error;
      message.textContent = 'Check your email for a sign-in link. Open it to return here and enable reordering.';
    } catch { message.textContent = 'Unable to send a sign-in link. Check your email address or try again later.'; }
    finally { submit.disabled = false; }
  });
  // Ordinary public visitors do not download the Auth SDK.
  let remembered = false;
  try { remembered = !!localStorage.getItem('ycsu-main-owner-session'); } catch {}
  if (remembered || /(?:access_token|error_description)=/.test(location.hash)) {
    try {
      const c = await loadClient();
      const {data} = await c.auth.getSession(); await validateSession(data.session);
    } catch { setAllowed(false); }
  }
  return {
    refreshAvailability() { setAllowed(verified && isLive()); },
    async save(payload) {
      if (!verified || !isLive() || !client) throw new Error('Owner session required.');
      const {data,error} = await client.auth.getSession();
      if (error || !data.session) {await validateSession(null);throw new Error('Session expired.');}
      const response = await fetch(`${url}/functions/v1/registry-ops`, {
        method:'POST', headers:{apikey:key, Authorization:`Bearer ${data.session.access_token}`, 'Content-Type':'application/json'},
        body:JSON.stringify(payload), signal:AbortSignal.timeout(15000),
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) { verified=false;setAllowed(false); }
        throw new Error('Save failed.');
      }
      const result = await response.json(); if (!result.ok) throw new Error('Save failed.'); return result;
    },
  };
}
