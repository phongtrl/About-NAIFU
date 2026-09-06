/* =========================================================
   NAIFU — In-page editor (loads only with ?edit or #edit)
   Click text to type over it, replace the photo, swap videos,
   then "Publish" to download an updated index.html.
   ========================================================= */
(function () {
  "use strict";

  // Snapshot the untouched page BEFORE we add any editor markup.
  const ORIGINAL_HTML = "<!DOCTYPE html>\n" + document.documentElement.outerHTML;

  const STORE_KEY = "naifu-edits-v1";
  const load = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
    catch (e) { return {}; }
  };
  const save = (data) => localStorage.setItem(STORE_KEY, JSON.stringify(data));
  let edits = load();

  // --- element collections (stable order = stable keys) ---
  const TEXT_SELECTOR = "h1, h2, h3, h4, p, li, figcaption, .partner__code, .stat__label";
  const isExcluded = (el) =>
    el.closest("#nav") || el.closest("#loader") || el.closest(".editor-ui") ||
    el.classList.contains("stat__num") || el.id === "loaderCount";

  const textEls = () =>
    Array.from(document.querySelectorAll(TEXT_SELECTOR)).filter((el) => {
      if (isExcluded(el)) return false;
      // skip if an ancestor is also a text element (avoid nested editing)
      let p = el.parentElement;
      while (p) { if (p.matches && p.matches(TEXT_SELECTOR) && !isExcluded(p)) return false; p = p.parentElement; }
      return true;
    });

  const imgEls = () =>
    Array.from(document.querySelectorAll("img")).filter((el) => !isExcluded(el));

  const videoEls = () =>
    Array.from(document.querySelectorAll("figure.video blockquote.tiktok-embed"));

  // ---------- styles ----------
  const style = document.createElement("style");
  style.id = "editor-style";
  style.textContent = `
    .editor-on [contenteditable="true"] { outline: 1px dashed rgba(200,69,47,.5); outline-offset: 4px; cursor: text; border-radius: 3px; transition: background .15s; }
    .editor-on [contenteditable="true"]:hover { background: rgba(200,69,47,.06); }
    .editor-on [contenteditable="true"]:focus { outline: 2px solid #c8452f; background: rgba(200,69,47,.04); }
    .editor-img { position: relative; cursor: pointer; }
    .editor-img::after { content: "Click to replace photo"; position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      background: rgba(20,18,15,.55); color: #f6f4ee; font-family: Inter, sans-serif; font-size: .8rem; letter-spacing: .12em; text-transform: uppercase;
      opacity: 0; transition: opacity .2s; border-radius: inherit; pointer-events: none; }
    .editor-img:hover::after { opacity: 1; }
    .editor-vidbtn { display: inline-block; margin-top: .6rem; font-family: Inter, sans-serif; font-size: .72rem; letter-spacing: .1em; text-transform: uppercase;
      background: #14120f; color: #f6f4ee; border: 0; border-radius: 999px; padding: .5rem 1rem; cursor: pointer; }
    .editor-vidbtn:hover { background: #c8452f; }
    #editor-toolbar { position: fixed; z-index: 2000; left: 50%; bottom: 22px; transform: translateX(-50%);
      display: flex; align-items: center; gap: .55rem; padding: .6rem .7rem; background: #14120f; color: #f6f4ee;
      border-radius: 999px; box-shadow: 0 10px 40px rgba(0,0,0,.35); font-family: Inter, sans-serif; }
    #editor-toolbar .tb-tag { font-size: .68rem; letter-spacing: .18em; text-transform: uppercase; color: #c8bfb2; padding: 0 .5rem 0 .7rem; }
    #editor-toolbar button { font-family: Inter, sans-serif; font-size: .78rem; font-weight: 600; border: 0; border-radius: 999px; padding: .55rem 1rem; cursor: pointer; }
    #editor-toolbar .tb-publish { background: #c8452f; color: #fff; }
    #editor-toolbar .tb-publish:hover { background: #a5361f; }
    #editor-toolbar .tb-ghost { background: transparent; color: #f6f4ee; border: 1px solid rgba(246,244,238,.25); }
    #editor-toolbar .tb-ghost:hover { background: rgba(246,244,238,.12); }
    #editor-toast { position: fixed; z-index: 2000; left: 50%; bottom: 82px; transform: translateX(-50%);
      background: #6f7d5f; color: #fff; font-family: Inter, sans-serif; font-size: .82rem; padding: .6rem 1.1rem; border-radius: 999px;
      opacity: 0; transition: opacity .25s, transform .25s; pointer-events: none; }
    #editor-toast.show { opacity: 1; transform: translateX(-50%) translateY(-6px); }
  `;
  document.head.appendChild(style);
  document.documentElement.classList.add("editor-on");

  // remove the intro loader so editing starts immediately
  const loader = document.getElementById("loader");
  if (loader) loader.remove();
  document.body.style.overflow = "";

  // ---------- apply saved edits to the live page ----------
  function applyEdits() {
    textEls().forEach((el, i) => {
      const v = edits["txt-" + i];
      if (typeof v === "string") el.innerHTML = v;
    });
    imgEls().forEach((el, i) => {
      const v = edits["img-" + i];
      if (v) { el.src = v; el.style.display = ""; el.parentElement.classList.remove("hero__portrait--empty"); }
    });
    videoEls().forEach((bq, i) => {
      const v = edits["vid-" + i];
      if (v && v.id) setVideo(bq, v.id);
    });
  }

  function setVideo(bq, id) {
    bq.setAttribute("data-video-id", id);
    const cite = bq.getAttribute("cite") || "https://www.tiktok.com/@knifesharpening/video/";
    bq.setAttribute("cite", cite.replace(/video\/\d+.*/, "video/" + id));
    const a = bq.querySelector("a[href]");
    if (a) a.setAttribute("href", "https://www.tiktok.com/@knifesharpening/video/" + id);
  }

  // ---------- wire up text editing ----------
  function enableText() {
    textEls().forEach((el, i) => {
      el.setAttribute("contenteditable", "true");
      el.dataset.editKey = "txt-" + i;
      el.addEventListener("input", () => {
        edits[el.dataset.editKey] = el.innerHTML;
        save(edits);
      });
      // prevent link navigation while editing
      el.addEventListener("click", (e) => {
        const link = e.target.closest("a");
        if (link) e.preventDefault();
      });
    });
  }

  // ---------- wire up image replacing ----------
  const filePicker = document.createElement("input");
  filePicker.type = "file";
  filePicker.accept = "image/*";
  filePicker.className = "editor-ui";
  filePicker.style.display = "none";
  document.body.appendChild(filePicker);
  let pendingImg = null;

  function enableImages() {
    imgEls().forEach((el, i) => {
      const wrap = el.parentElement;
      wrap.classList.add("editor-img");
      wrap.dataset.editKey = "img-" + i;
      wrap.addEventListener("click", (e) => {
        e.preventDefault();
        pendingImg = { el, key: "img-" + i };
        filePicker.click();
      });
    });
  }

  filePicker.addEventListener("change", () => {
    const file = filePicker.files && filePicker.files[0];
    if (!file || !pendingImg) return;
    const reader = new FileReader();
    reader.onload = () => {
      pendingImg.el.src = reader.result;
      pendingImg.el.style.display = "";
      pendingImg.el.parentElement.classList.remove("hero__portrait--empty");
      edits[pendingImg.key] = reader.result;
      save(edits);
      toast("Photo updated");
      pendingImg = null;
      filePicker.value = "";
    };
    reader.readAsDataURL(file);
  });

  // ---------- wire up video swapping ----------
  function enableVideos() {
    videoEls().forEach((bq, i) => {
      const fig = bq.closest("figure.video");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "editor-vidbtn editor-ui";
      btn.textContent = "Change video";
      btn.addEventListener("click", () => {
        const url = prompt("Paste the TikTok video URL:", bq.getAttribute("cite") || "");
        if (!url) return;
        const m = url.match(/video\/(\d+)/) || url.match(/(\d{6,})/);
        if (!m) { alert("Couldn't find a video ID in that URL."); return; }
        setVideo(bq, m[1]);
        edits["vid-" + i] = { id: m[1] };
        save(edits);
        toast("Video saved — appears live after Publish");
      });
      fig.appendChild(btn);
    });
  }

  // ---------- toolbar ----------
  const bar = document.createElement("div");
  bar.id = "editor-toolbar";
  bar.className = "editor-ui";
  bar.innerHTML =
    '<span class="tb-tag">Edit mode</span>' +
    '<button class="tb-publish" id="tbPublish">Publish (download)</button>' +
    '<button class="tb-ghost" id="tbReset">Reset</button>' +
    '<button class="tb-ghost" id="tbExit">Exit</button>';
  document.body.appendChild(bar);

  const toastEl = document.createElement("div");
  toastEl.id = "editor-toast";
  toastEl.className = "editor-ui";
  document.body.appendChild(toastEl);
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
  }

  document.getElementById("tbReset").addEventListener("click", () => {
    if (!confirm("Discard all your edits and reload the original page?")) return;
    localStorage.removeItem(STORE_KEY);
    const url = location.href.replace(/[?#].*$/, "") + "?edit";
    location.href = url;
  });

  document.getElementById("tbExit").addEventListener("click", () => {
    location.href = location.href.replace(/[?#].*$/, "");
  });

  document.getElementById("tbPublish").addEventListener("click", publish);

  // ---------- publish: bake edits into a clean index.html ----------
  function publish() {
    const doc = new DOMParser().parseFromString(ORIGINAL_HTML, "text/html");

    const filter = (el) =>
      el.closest("#nav") || el.closest("#loader") || el.closest(".editor-ui") ||
      el.classList.contains("stat__num") || el.id === "loaderCount";

    const dTextEls = Array.from(doc.querySelectorAll(TEXT_SELECTOR)).filter((el) => {
      if (filter(el)) return false;
      let p = el.parentElement;
      while (p) { if (p.matches && p.matches(TEXT_SELECTOR) && !filter(p)) return false; p = p.parentElement; }
      return true;
    });
    dTextEls.forEach((el, i) => {
      const v = edits["txt-" + i];
      if (typeof v === "string") el.innerHTML = v;
    });

    Array.from(doc.querySelectorAll("img")).filter((el) => !filter(el)).forEach((el, i) => {
      const v = edits["img-" + i];
      if (v) { el.setAttribute("src", v); el.removeAttribute("onerror"); el.style.display = ""; }
    });

    Array.from(doc.querySelectorAll("figure.video blockquote.tiktok-embed")).forEach((bq, i) => {
      const v = edits["vid-" + i];
      if (v && v.id) {
        bq.setAttribute("data-video-id", v.id);
        const cite = bq.getAttribute("cite") || "https://www.tiktok.com/@knifesharpening/video/";
        bq.setAttribute("cite", cite.replace(/video\/\d+.*/, "video/" + v.id));
        const a = bq.querySelector("a[href]");
        if (a) a.setAttribute("href", "https://www.tiktok.com/@knifesharpening/video/" + v.id);
      }
    });

    // strip anything editor-related that may have been captured
    doc.querySelectorAll('#editor-toolbar, #editor-style, #editor-toast, .editor-ui, script[src="editor.js"]')
      .forEach((n) => n.remove());
    doc.documentElement.classList.remove("editor-on");
    doc.querySelectorAll("[contenteditable]").forEach((n) => n.removeAttribute("contenteditable"));
    doc.querySelectorAll("[data-edit-key]").forEach((n) => n.removeAttribute("data-edit-key"));

    const html = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    const blob = new Blob([html], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "index.html";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
    toast("Downloaded index.html — upload it to publish");
  }

  // ---------- go ----------
  applyEdits();
  enableText();
  enableImages();
  enableVideos();
  toast("Edit mode on — click any text to edit");
})();
