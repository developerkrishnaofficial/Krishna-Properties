const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const load = (k, d) => {
  try {
    const v = JSON.parse(localStorage.getItem(k));
    return v == null ? d : v;
  } catch (e) {
    return d;
  }
};
const save = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
  } catch (e) {
    return false;
  }
};
const ADMIN = {
  name: "Admin",
  email: "admin@krishna.com",
  pass: "admin123",
  role: "admin",
};
const DEMO_USER = {
  name: "Demo User",
  email: "user@krishna.com",
  pass: "user123",
  role: "user",
};
let extra = load("kr_extra", {}),
  custom = load("kr_custom", []),
  removed = load("kr_removed", []),
  users = load("kr_users", []),
  me = null,
  favs = [],
  cur = null,
  authMode = "user",
  pend = [];
const savedSession = load("kr_session", null);
if (savedSession) {
  if (savedSession.role === "user" && savedSession.email === DEMO_USER.email)
    me = DEMO_USER;
  else if (savedSession.role === "user")
    me =
      users.find((u) => u.email === savedSession.email && u.role === "user") ||
      null;
  // Admin must authenticate again when opening the project or Admin Panel.
  if (savedSession.role === "admin" || !me)
    localStorage.removeItem("kr_session");
}
const all = () =>
  SAMPLE.filter((p) => !removed.includes(p.id))
    .concat(custom)
    .map((p) => (extra[p.id] ? { ...p, ph: [...p.ph, ...extra[p.id]] } : p));
const fmt = (p) =>
  p.mode === "rent"
    ? "₹" + (+p.price).toLocaleString("en-IN") + "/mo"
    : p.price >= 1e7
      ? "₹" + (p.price / 1e7).toFixed(2) + " Cr"
      : "₹" + (p.price / 1e5).toFixed(1) + " Lakh";
const esc = (s) =>
  String(s).replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c],
  );

function card(p) {
  const f = favs.includes(p.id);
  return `<article class="rounded-2xl overflow-hidden bg-white dark:bg-stone-800 shadow border border-red-100 dark:border-stone-700 hover:shadow-xl transition">
<div class="relative"><img src="${src(p.ph[0])}" alt="${esc(p.title)}" loading="lazy" class="w-full aspect-[16/10] object-cover cursor-pointer" data-open="${p.id}">
<span class="absolute top-3 left-3 bg-red-600 text-white text-xs px-2 py-1 rounded-full">${p.type} · ${p.mode === "buy" ? "For Sale" : "For Rent"}</span>
<button data-fav="${p.id}" class="absolute top-3 right-3 bg-white/90 rounded-full w-9 h-9 text-lg ${f ? "text-red-600" : "text-stone-400"}" aria-label="Favourite">${f ? "♥" : "♡"}</button></div>
<div class="p-4"><div class="text-lg font-extrabold text-red-600">${fmt(p)}</div><h3 class="font-semibold mt-1">${esc(p.title)}</h3><p class="text-sm text-stone-500">📍 ${esc(p.loc)}</p>
<div class="flex gap-4 text-sm mt-3 text-stone-600 dark:text-stone-300">${p.beds ? `<span>🛏 ${p.beds}</span><span>🛁 ${p.baths}</span>` : ""}<span>📐 ${p.area} sq ft</span></div>
<button data-open="${p.id}" class="mt-4 w-full rounded-lg border border-red-600 text-red-600 py-2 text-sm font-semibold hover:bg-red-600 hover:text-white">View details</button></div></article>`;
}

function list(mode) {
  const loc = $("#loc").value.trim().toLowerCase(),
    t = $("#type").value,
    mn = (mode === "buy" ? +$("#bMin").value * 1e5 : +$("#rMin").value) || 0,
    mx =
      (mode === "buy" ? +$("#bMax").value * 1e5 : +$("#rMax").value) ||
      Infinity,
    bd = +$("#beds").value,
    ba = +$("#baths").value,
    s = $("#sort").value;
  return all()
    .filter(
      (p) =>
        p.mode === mode &&
        (!loc || p.loc.toLowerCase().includes(loc)) &&
        (!t || p.type === t) &&
        p.price >= mn &&
        p.price <= mx &&
        p.beds >= bd &&
        p.baths >= ba,
    )
    .sort(
      s === "asc"
        ? (a, b) => a.price - b.price
        : s === "desc"
          ? (a, b) => b.price - a.price
          : (a, b) => b.t - a.t,
    );
}
function render() {
  favs = me ? load("kr_favs_" + me.email, []) : [];
  for (const [m, g, c] of [
    ["buy", "#gBuy", "#cBuy"],
    ["rent", "#gRent", "#cRent"],
  ]) {
    const r = list(m);
    $(c).textContent = "(" + r.length + ")";
    $(g).innerHTML = r.length
      ? r.map(card).join("")
      : '<p class="text-stone-500 col-span-full py-8 text-center">No properties match your filters.</p>';
  }
  const fl = all().filter((p) => favs.includes(p.id));
  $("#gFav").innerHTML = !me
    ? '<p class="col-span-full text-stone-500">Login to save and see your favourite properties.</p>'
    : fl.length
      ? fl.map(card).join("")
      : '<p class="col-span-full text-stone-500">No favourites yet – tap the ♡ on any property.</p>';
  $("#favCount").textContent = fl.length;
  const adm = me && me.role === "admin";
  if (!adm) view("site");
  $("#aPanel").classList.toggle("hidden", !adm);
  $("#aGate").classList.toggle("hidden", !!adm);
  $("#authBtn").textContent = me ? "Logout" : "User Login";
  if (adm)
    $("#aList").innerHTML = all()
      .map(
        (p) =>
          `<div class="flex items-center gap-3 rounded-xl bg-white dark:bg-stone-800 border border-red-100 dark:border-stone-700 p-2"><img src="${src(p.ph[0])}" class="w-16 h-12 object-cover rounded" alt=""><div class="flex-1 text-sm"><b>${esc(p.title)}</b><br><span class="text-stone-500">${p.mode === "buy" ? "Purchase" : "Rent"} · ${fmt(p)}</span></div><label class="text-sm font-semibold text-stone-600 dark:text-stone-300 cursor-pointer px-2">＋ Photos<input type="file" accept="image/*" multiple hidden data-addph="${p.id}"></label><button data-del="${p.id}" class="text-red-600 text-sm font-semibold px-2">Delete</button></div>`,
      )
      .join("");
  if (adm) {
    const a = all();
    $("#aStats").innerHTML = [
      ["Total listings", a.length],
      ["For purchase", a.filter((p) => p.mode === "buy").length],
      ["For rent", a.filter((p) => p.mode === "rent").length],
      ["Registered users", users.length],
    ]
      .map(
        ([k, v]) =>
          `<div class="rounded-2xl bg-red-600 text-white p-4"><div class="text-3xl font-extrabold">${v}</div><div class="text-sm text-red-100">${k}</div></div>`,
      )
      .join("");
  }
}
function toggleFav(id) {
  if (!me) return openAuth("Please login to save favourites");
  favs = favs.includes(id) ? favs.filter((x) => x !== id) : [...favs, id];
  save("kr_favs_" + me.email, favs);
  render();
  if (cur) fillF();
}
function fillF() {
  const f = favs.includes(cur.id);
  $("#mF").textContent = f ? "♥ Remove from favourites" : "♡ Add to favourites";
  $("#mF").className =
    "mt-1 text-sm " + (f ? "text-red-600" : "text-stone-500");
}
function openP(id) {
  const p = all().find((x) => x.id === id);
  if (!p) return;
  cur = p;
  $("#mainImg").src = src(p.ph[0]);
  $("#thumbs").innerHTML = p.ph
    .map(
      (k) =>
        `<img src="${src(k)}" data-th="1" alt="Photo" class="h-16 aspect-[16/10] object-cover rounded-lg cursor-pointer border-2 border-transparent hover:border-red-500">`,
    )
    .join("");
  $("#mT").textContent = p.title;
  $("#mL").textContent = "📍 " + p.loc;
  $("#mP").textContent = fmt(p);
  $("#mD").textContent = p.desc || "";
  const d = Math.max(0, Math.round((Date.now() - p.t) / D));
  $("#mS").innerHTML = [
    ["Type", p.type],
    ["Listing", p.mode === "buy" ? "For Sale" : "For Rent"],
    ["Area", p.area + " sq ft"],
    ["Bedrooms", p.beds || "–"],
    ["Bathrooms", p.baths || "–"],
    ["Listed", d ? d + " days ago" : "Today"],
  ]
    .map(
      ([k, v]) =>
        `<div class="rounded-lg bg-red-50 dark:bg-stone-700 p-3"><dt class="text-stone-500 dark:text-stone-300">${k}</dt><dd class="font-semibold">${v}</dd></div>`,
    )
    .join("");
  fillF();
  $("#pm").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}
const closeP = () => {
  $("#pm").classList.add("hidden");
  document.body.style.overflow = "";
  cur = null;
};

function openAuth(mode = "user", message = "") {
  authMode = mode;
  $("#uTitle").textContent =
    mode === "admin" ? "Admin Panel Login" : "Krishna User Login";
  $("#uE").value = mode === "admin" ? ADMIN.email : DEMO_USER.email;
  $("#uP").value = mode === "admin" ? ADMIN.pass : DEMO_USER.pass;
  $("#uGo").textContent = mode === "admin" ? "Login to Admin Panel" : "Login";
  $("#uMsg").textContent = message;
  $("#am").classList.remove("hidden");
}
function go() {
  const e = $("#uE").value.trim().toLowerCase(),
    pw = $("#uP").value;
  if (authMode === "admin") {
    if (e !== ADMIN.email || pw !== ADMIN.pass) {
      $("#uMsg").textContent = "Wrong admin ID or password.";
      return;
    }
    me = ADMIN;
  } else {
    if (e === DEMO_USER.email && pw === DEMO_USER.pass) me = DEMO_USER;
    else
      me =
        users.find(
          (u) => u.email === e && u.pass === pw && u.role === "user",
        ) || null;
    if (!me) {
      $("#uMsg").textContent =
        "Wrong user ID or password. Use the auto-filled demo login.";
      return;
    }
  }
  save("kr_session", { name: me.name, email: me.email, role: me.role });
  $("#am").classList.add("hidden");
  render();
  if (me.role === "admin") view("admin");
  else view("site");
}

function shrink(file) {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = () => {
      const i = new Image();
      i.onload = () => {
        const s = Math.min(1, 900 / i.width),
          c = document.createElement("canvas");
        c.width = i.width * s;
        c.height = i.height * s;
        c.getContext("2d").drawImage(i, 0, 0, c.width, c.height);
        res(c.toDataURL("image/jpeg", 0.72));
      };
      i.src = r.result;
    };
    r.readAsDataURL(file);
  });
}
$("#aF").onchange = async (e) => {
  pend = [];
  for (const f of e.target.files) pend.push(await shrink(f));
  $("#aPrev").innerHTML = pend
    .map((s) => `<img src="${s}" class="h-14 rounded" alt="">`)
    .join("");
};
$("#aAdd").onclick = () => {
  const t = $("#aT").value.trim(),
    l = $("#aL").value.trim(),
    pr = +$("#aP").value;
  if (!t || !l || !pr)
    return ($("#aMsg").textContent = "Title, location and price are required.");
  const ty = $("#aTy").value,
    p = {
      id: "c" + Date.now(),
      title: t,
      loc: l,
      type: ty,
      mode: $("#aM").value,
      price: pr,
      beds: +$("#aB").value || 0,
      baths: +$("#aBa").value || 0,
      area: +$("#aA").value || 0,
      t: Date.now(),
      desc: $("#aD").value.trim(),
      ph: pend.length ? pend : [ty === "Plot" ? "p1" : "h"],
    };
  custom.push(p);
  if (!save("kr_custom", custom)) {
    custom.pop();
    return ($("#aMsg").textContent =
      "Browser storage is full – use fewer or smaller photos.");
  }
  ["aT", "aL", "aP", "aB", "aBa", "aA", "aD", "aF"].forEach(
    (i) => ($("#" + i).value = ""),
  );
  pend = [];
  $("#aPrev").innerHTML = "";
  $("#aMsg").textContent = "✓ Property added!";
  render();
};

document.addEventListener("click", (e) => {
  const t = e.target;
  let x = t.closest("[data-fav]");
  if (x) return toggleFav(x.dataset.fav);
  x = t.closest("[data-open]");
  if (x) return openP(x.dataset.open);
  x = t.closest("[data-del]");
  if (x) {
    const id = x.dataset.del;
    if (!confirm("Delete this listing?")) return;
    if (id[0] === "c") {
      custom = custom.filter((p) => p.id !== id);
      save("kr_custom", custom);
    } else {
      removed.push(id);
      save("kr_removed", removed);
    }
    render();
  }
  if (t.dataset.th) $("#mainImg").src = t.src;
  x = t.closest("[data-gc]");
  if (x) {
    gc = x.dataset.gc;
    return gal();
  }
  if (t.dataset.lb) {
    $("#lbImg").src = t.src;
    $("#lb").classList.remove("hidden");
  }
  if (t.id === "lb" || t.id === "lbImg") $("#lb").classList.add("hidden");
  if (t.id === "pm") closeP();
  if (t.id === "am") $("#am").classList.add("hidden");
});
const needAdmin = () => {
  if (me && me.role === "admin") {
    view("admin");
    render();
  } else openAuth("admin");
};
$("#adminLink").addEventListener("click", (e) => {
  e.preventDefault();
  $("#menu").classList.add("hidden");
  needAdmin();
});
$$("header a:not(#adminLink)").forEach((a) =>
  a.addEventListener("click", () => view("site")),
);
$("#aGoBtn").onclick = () => openAuth("admin");

document.addEventListener("change", async (e) => {
  const id = e.target.dataset.addph;
  if (!id) return;
  const r = [];
  for (const f of e.target.files) r.push(await shrink(f));
  const old = extra[id] || [];
  extra[id] = old.concat(r);
  if (!save("kr_extra", extra)) {
    extra[id] = old;
    alert("Browser storage is full – use fewer or smaller photos.");
  }
  render();
});
$("#mF").onclick = () => toggleFav(cur.id);
$("#close").onclick = closeP;
$("#aClose").onclick = () => $("#am").classList.add("hidden");
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeP();
    $("#am").classList.add("hidden");
  }
});
[
  "loc",
  "type",
  "bMin",
  "bMax",
  "rMin",
  "rMax",
  "beds",
  "baths",
  "sort",
].forEach((i) => $("#" + i).addEventListener("input", render));
$("#clear").onclick = () => {
  ["loc", "type", "bMin", "bMax", "rMin", "rMax"].forEach(
    (i) => ($("#" + i).value = ""),
  );
  ["beds", "baths"].forEach((i) => ($("#" + i).value = "0"));
  $("#sort").value = "new";
  render();
};
$("#burger").onclick = () => $("#menu").classList.toggle("hidden");
$$("#menu a").forEach((a) =>
  a.addEventListener("click", () => $("#menu").classList.add("hidden")),
);
$("#uGo").onclick = go;
$("#authBtn").onclick = () => {
  if (me) {
    me = null;
    localStorage.removeItem("kr_session");
    render();
    view("site");
  } else openAuth("user");
};

function applyTheme(d) {
  document.documentElement.classList.toggle("dark", d);
  $("#theme").textContent = d ? "☀️" : "🌙";
}
let dark =
  window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches;
const th = load("kr_theme", null);
if (th) dark = th === "dark";
applyTheme(dark);
$("#theme").onclick = () => {
  dark = !dark;
  applyTheme(dark);
  save("kr_theme", dark ? "dark" : "light");
};

const hs = ["b1", "b2", "b3"];
$("#slides").innerHTML = hs
  .map(
    (k, i) =>
      `<img src="${IMG[k]}" alt="" class="hs absolute inset-0 w-full h-full object-cover" style="opacity:${i ? 0 : 1}">`,
  )
  .join("");
let si = 0;
setInterval(() => {
  const im = $$("#slides img");
  im[si].style.opacity = 0;
  si = (si + 1) % im.length;
  im[si].style.opacity = 1;
}, 4500);
gal();
render();

function gal() {
  $("#gTabs").innerHTML = Object.keys(GAL)
    .map(
      (c) =>
        `<button data-gc="${c}" class="px-4 py-2 rounded-full text-sm font-semibold ${c === gc ? "bg-red-600 text-white" : "bg-white dark:bg-stone-800 border border-red-100 dark:border-stone-700"}">${c}</button>`,
    )
    .join("");
  $("#gGrid").innerHTML = GAL[gc]
    .map(
      (k) =>
        `<img src="${src(k)}" data-lb="1" alt="${gc}" loading="lazy" class="mb-3 w-full rounded-xl cursor-zoom-in hover:opacity-90">`,
    )
    .join("");
}

function view(v) {
  const a = v === "admin";
  $("#siteView").classList.toggle("hidden", a);
  $("#adminView").classList.toggle("hidden", !a);
  $("#home").classList.toggle("hidden", a);
  if (a) scrollTo(0, 0);
}
