/**
 * Maycie Tracker — Daily progress for Maycie Furniture & Fixture Trading
 * Local-only SPA. Data in localStorage. Asia/Manila dates, PHP currency labels.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "maycie-tracker-v1";
  const TZ = "Asia/Manila";

  const JOB_TYPES = [
    "Kitchen cabinets w/ soft-close hinges & full-extension drawers",
    "Dovetail-joinery drawers/cabinets",
    "Sliding cabinets",
    "Bed frame",
    "Sofa",
    "Spa chair",
    "Other",
  ];

  const STAGES = [
    "Design/Approval",
    "Materials Sourcing",
    "Cutting",
    "Joinery/Assembly",
    "Finishing/Upholstery",
    "Hardware Install",
    "QC",
    "Delivery/Installation",
  ];

  const STATUSES = ["Not started", "In progress", "On hold", "Completed"];
  const PRIORITIES = ["Low", "Medium", "High"];
  const MAT_STATUSES = ["Needed", "Ordered", "Received/Ready"];

  // ---------- utilities ----------
  function uid() {
    return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function todayISO() {
    // Asia/Manila calendar date
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  }

  function formatDate(iso) {
    if (!iso) return "—";
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d, 4, 0, 0)); // midday Manila-ish for display
    return new Intl.DateTimeFormat("en-PH", {
      timeZone: TZ,
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(dt);
  }

  function daysUntil(iso) {
    if (!iso) return null;
    const t = todayISO();
    const a = Date.parse(iso + "T00:00:00+08:00");
    const b = Date.parse(t + "T00:00:00+08:00");
    return Math.round((a - b) / 86400000);
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusClass(status) {
    return "status-" + String(status || "").toLowerCase().replace(/\s+/g, "-");
  }

  function priorityClass(p) {
    return "priority-" + String(p || "").toLowerCase();
  }

  function matClass(s) {
    if (s === "Needed") return "mat-needed";
    if (s === "Ordered") return "mat-ordered";
    return "mat-received";
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add("hidden"), 2800);
  }

  // ---------- data ----------
  function emptyStages() {
    return STAGES.map((name) => ({ name, done: false }));
  }

  function computePct(job) {
    if (!job.stages || !job.stages.length) return 0;
    const done = job.stages.filter((s) => s.done).length;
    return Math.round((done / job.stages.length) * 100);
  }

  function defaultSeed() {
    const staff = [
      { id: "staff_ana", name: "Ana Reyes", role: "Project lead", sample: true },
      { id: "staff_ben", name: "Ben Santos", role: "Carpenter", sample: true },
      { id: "staff_carlo", name: "Carlo Dizon", role: "Finisher / upholstery", sample: true },
      { id: "staff_dina", name: "Dina Cruz", role: "Materials / QC", sample: true },
    ];

    const t = todayISO();
    const addDays = (n) => {
      const base = Date.parse(t + "T00:00:00+08:00");
      const d = new Date(base + n * 86400000);
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);
    };

    const kitchenStages = emptyStages().map((s, i) => ({
      ...s,
      done: i < 3, // Design, Materials, Cutting done
    }));
    const bedStages = emptyStages().map((s, i) => ({
      ...s,
      done: i < 5, // through Finishing
    }));
    const sofaStages = emptyStages().map((s, i) => ({
      ...s,
      done: i < 1,
    }));

    const jobs = [
      {
        id: "job_kitchen",
        name: "Santos kitchen set — soft-close & full-extension",
        client: "Mr. & Mrs. Santos (Quezon City)",
        jobType: JOB_TYPES[0],
        dueDate: addDays(12),
        assignedStaffIds: ["staff_ana", "staff_ben"],
        priority: "High",
        status: "In progress",
        stages: kitchenStages,
        notes: "Island + 12 linear ft wall units. Soft-close Blum hinges; full-extension undermount slides.",
        sample: true,
        createdAt: addDays(-18),
      },
      {
        id: "job_bed",
        name: "Narra king bed frame — Mendoza",
        client: "Dr. Mendoza (Makati)",
        jobType: "Bed frame",
        dueDate: addDays(2),
        assignedStaffIds: ["staff_ben", "staff_carlo"],
        priority: "High",
        status: "In progress",
        stages: bedStages,
        notes: "Solid narra headboard with carved detail. Natural oil finish.",
        sample: true,
        createdAt: addDays(-25),
      },
      {
        id: "job_sofa",
        name: "Spa chairs ×4 — Verdant Wellness",
        client: "Verdant Wellness Spa (Pasig)",
        jobType: "Spa chair",
        dueDate: addDays(-3),
        assignedStaffIds: ["staff_carlo", "staff_dina"],
        priority: "Medium",
        status: "On hold",
        stages: sofaStages,
        notes: "Waiting on marine-grade vinyl color confirmation. Sample swatches sent.",
        sample: true,
        createdAt: addDays(-30),
      },
    ];

    const materials = [
      {
        id: "mat1",
        jobId: "job_kitchen",
        item: "Marine plywood 18mm (cabinet carcass)",
        qty: 22,
        unit: "sheets",
        supplier: "CitiHardwood QC",
        status: "Received/Ready",
        expectedDate: addDays(-5),
        sample: true,
      },
      {
        id: "mat2",
        jobId: "job_kitchen",
        item: "Blum soft-close hinges (pair)",
        qty: 48,
        unit: "pairs",
        supplier: "Hardware Hub Manila",
        status: "Ordered",
        expectedDate: addDays(3),
        sample: true,
      },
      {
        id: "mat3",
        jobId: "job_kitchen",
        item: "Full-extension undermount slides 500mm",
        qty: 28,
        unit: "pairs",
        supplier: "Hardware Hub Manila",
        status: "Needed",
        expectedDate: addDays(5),
        sample: true,
      },
      {
        id: "mat4",
        jobId: "job_bed",
        item: "Narra lumber (kiln-dried)",
        qty: 180,
        unit: "bd ft",
        supplier: "Nueva Ecija Timber",
        status: "Received/Ready",
        expectedDate: addDays(-14),
        sample: true,
      },
      {
        id: "mat5",
        jobId: "job_sofa",
        item: "Marine-grade vinyl (spa green)",
        qty: 28,
        unit: "m",
        supplier: "Upholstery Supply Co.",
        status: "Needed",
        expectedDate: addDays(-1),
        sample: true,
      },
      {
        id: "mat6",
        jobId: "job_sofa",
        item: "High-density foam 4\"",
        qty: 8,
        unit: "sheets",
        supplier: "Foam World Pasig",
        status: "Ordered",
        expectedDate: addDays(4),
        sample: true,
      },
    ];

    const updates = [
      {
        id: "upd1",
        jobId: "job_kitchen",
        date: addDays(-1),
        staffId: "staff_ben",
        stage: "Cutting",
        note: "Finished cutting carcass panels for island base. Labeled A1–A12.",
        pct: 38,
        sample: true,
      },
      {
        id: "upd2",
        jobId: "job_kitchen",
        date: addDays(-3),
        staffId: "staff_ana",
        stage: "Materials Sourcing",
        note: "Confirmed plywood delivery; hinges PO #HH-4412 placed.",
        pct: 25,
        sample: true,
      },
      {
        id: "upd3",
        jobId: "job_bed",
        date: addDays(-1),
        staffId: "staff_carlo",
        stage: "Finishing/Upholstery",
        note: "First coat tung oil on headboard. Sanding between coats tomorrow.",
        pct: 62,
        sample: true,
      },
      {
        id: "upd4",
        jobId: "job_bed",
        date: addDays(-4),
        staffId: "staff_ben",
        stage: "Joinery/Assembly",
        note: "Side rails and slat supports glued and clamped. Dry fit OK.",
        pct: 50,
        sample: true,
      },
      {
        id: "upd5",
        jobId: "job_sofa",
        date: addDays(-6),
        staffId: "staff_dina",
        stage: "Design/Approval",
        note: "Client reviewing vinyl samples. On hold until color pick.",
        pct: 12,
        sample: true,
      },
    ];

    return {
      version: 1,
      seededSample: true,
      staff,
      jobs,
      materials,
      updates,
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const seed = defaultSeed();
        save(seed);
        return seed;
      }
      const data = JSON.parse(raw);
      if (!data.jobs) data.jobs = [];
      if (!data.staff) data.staff = [];
      if (!data.materials) data.materials = [];
      if (!data.updates) data.updates = [];
      return data;
    } catch (e) {
      console.error(e);
      const seed = defaultSeed();
      save(seed);
      return seed;
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  let state = load();
  let view = "dashboard";
  let selectedJobId = null;
  let filters = { status: "", staffId: "", search: "" };

  // ---------- reminders ----------
  function getReminders() {
    const list = [];
    const t = todayISO();

    state.jobs.forEach((j) => {
      if (j.status === "Completed") return;
      const due = daysUntil(j.dueDate);
      if (due != null && due < 0) {
        list.push({
          type: "overdue",
          severity: "red",
          text: `Overdue: ${j.name} (due ${formatDate(j.dueDate)})`,
          jobId: j.id,
        });
      } else if (due != null && due <= 3) {
        list.push({
          type: "due-soon",
          severity: "amber",
          text: `Due in ${due} day${due === 1 ? "" : "s"}: ${j.name}`,
          jobId: j.id,
        });
      }

      const hasToday = state.updates.some((u) => u.jobId === j.id && u.date === t);
      if (!hasToday && j.status === "In progress") {
        list.push({
          type: "no-update",
          severity: "blue",
          text: `No update today: ${j.name}`,
          jobId: j.id,
        });
      }
    });

    state.materials.forEach((m) => {
      const job = state.jobs.find((j) => j.id === m.jobId);
      if (!job || job.status === "Completed") return;
      if (m.status === "Needed") {
        list.push({
          type: "mat-needed",
          severity: "red",
          text: `Not ordered: ${m.item} (${job.name})`,
          jobId: m.jobId,
        });
      } else if (m.status === "Ordered" && m.expectedDate && daysUntil(m.expectedDate) < 0) {
        list.push({
          type: "mat-late",
          severity: "amber",
          text: `Material late: ${m.item} (expected ${formatDate(m.expectedDate)})`,
          jobId: m.jobId,
        });
      }
    });

    const order = { red: 0, amber: 1, blue: 2, green: 3 };
    list.sort((a, b) => order[a.severity] - order[b.severity]);
    return list;
  }

  // ---------- modal / drawer ----------
  function openDrawer() {
    document.getElementById("drawer").classList.remove("hidden");
    document.getElementById("drawer").setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    document.getElementById("drawer").classList.add("hidden");
    document.getElementById("drawer").setAttribute("aria-hidden", "true");
  }

  function openModal(title, bodyHtml, footerHtml) {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("modal-body").innerHTML = bodyHtml;
    document.getElementById("modal-footer").innerHTML = footerHtml || "";
    document.getElementById("modal").classList.remove("hidden");
    document.getElementById("modal").setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    document.getElementById("modal").classList.add("hidden");
    document.getElementById("modal").setAttribute("aria-hidden", "true");
    document.getElementById("modal-body").innerHTML = "";
    document.getElementById("modal-footer").innerHTML = "";
  }

  // ---------- rendering ----------
  function staffName(id) {
    const s = state.staff.find((x) => x.id === id);
    return s ? s.name : "—";
  }

  function staffNames(ids) {
    if (!ids || !ids.length) return "Unassigned";
    return ids.map(staffName).join(", ");
  }

  function renderTodayLabel() {
    const el = document.getElementById("today-label");
    const now = new Date();
    el.textContent = new Intl.DateTimeFormat("en-PH", {
      timeZone: TZ,
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(now) + " · Manila";
  }

  function setActiveTab() {
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.view === view);
    });
  }

  function filteredJobs() {
    return state.jobs.filter((j) => {
      if (filters.status && j.status !== filters.status) return false;
      if (filters.staffId && !(j.assignedStaffIds || []).includes(filters.staffId)) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const hay = [j.name, j.client, j.jobType, j.notes].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderDashboard() {
    const reminders = getReminders();
    const active = state.jobs.filter((j) => j.status !== "Completed").length;
    const overdue = state.jobs.filter(
      (j) => j.status !== "Completed" && daysUntil(j.dueDate) != null && daysUntil(j.dueDate) < 0
    ).length;
    const waitingMats = state.materials.filter((m) => m.status !== "Received/Ready").length;
    const jobs = filteredJobs();

    return `
      <div class="grid-3" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:12px;">
        <div class="stat"><div class="num">${active}</div><div class="lbl">Active jobs</div></div>
        <div class="stat"><div class="num" style="color:var(--danger)">${overdue}</div><div class="lbl">Overdue</div></div>
        <div class="stat"><div class="num" style="color:var(--warn)">${waitingMats}</div><div class="lbl">Materials waiting</div></div>
      </div>

      <div class="card">
        <div class="row between">
          <h2>Reminders</h2>
          <span class="muted">${reminders.length} item${reminders.length === 1 ? "" : "s"}</span>
        </div>
        ${
          reminders.length
            ? `<ul class="reminders">${reminders
                .slice(0, 12)
                .map(
                  (r) => `<li data-job="${esc(r.jobId)}"><span class="dot ${r.severity}"></span><span>${esc(r.text)}</span></li>`
                )
                .join("")}</ul>`
            : `<p class="muted">All clear — no overdue jobs, late materials, or missing daily updates.</p>`
        }
      </div>

      <div class="card">
        <div class="row between">
          <h2>Jobs</h2>
          <button type="button" class="btn btn-primary btn-sm" id="btn-new-job">+ New job</button>
        </div>
        <div class="filters">
          <div class="field">
            <label for="f-status">Status</label>
            <select id="f-status">
              <option value="">All</option>
              ${STATUSES.map((s) => `<option value="${esc(s)}" ${filters.status === s ? "selected" : ""}>${esc(s)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="f-staff">Staff</label>
            <select id="f-staff">
              <option value="">All</option>
              ${state.staff.map((s) => `<option value="${esc(s.id)}" ${filters.staffId === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
            </select>
          </div>
          <div class="field" style="flex:2 1 180px;">
            <label for="f-search">Search</label>
            <input type="search" id="f-search" placeholder="Name, client…" value="${esc(filters.search)}" />
          </div>
        </div>
        <div class="stack" id="job-list">
          ${jobs.length ? jobs.map(jobCardHtml).join("") : `<div class="empty"><strong>No jobs match</strong>Try clearing filters or add a new job.</div>`}
        </div>
      </div>
    `;
  }

  function jobCardHtml(j) {
    const pct = computePct(j);
    const due = daysUntil(j.dueDate);
    let dueLabel = formatDate(j.dueDate);
    if (due != null && j.status !== "Completed") {
      if (due < 0) dueLabel += ` · ${Math.abs(due)}d late`;
      else if (due === 0) dueLabel += " · due today";
      else dueLabel += ` · ${due}d left`;
    }
    return `
      <article class="card job-card" data-job-id="${esc(j.id)}" tabindex="0" role="button">
        <div class="row between">
          <p class="title">${esc(j.name)} ${j.sample ? '<span class="sample-badge">Sample</span>' : ""}</p>
          <span class="progress-label">${pct}%</span>
        </div>
        <p class="muted" style="margin:0;">${esc(j.client)} · ${esc(j.jobType)}</p>
        <div class="job-meta">
          <span class="pill ${statusClass(j.status)}">${esc(j.status)}</span>
          <span class="pill ${priorityClass(j.priority)}">${esc(j.priority)}</span>
          <span class="pill">${esc(staffNames(j.assignedStaffIds))}</span>
        </div>
        <div class="progress" aria-label="${pct}% complete"><span style="width:${pct}%"></span></div>
        <p class="muted" style="margin:8px 0 0;">Due ${esc(dueLabel)}</p>
      </article>
    `;
  }


  function renderJobsView() {
    const jobs = filteredJobs().slice().sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));
    return `
      <div class="card">
        <div class="row between">
          <h2>All jobs</h2>
          <button type="button" class="btn btn-primary btn-sm" id="btn-new-job">+ New job</button>
        </div>
        <div class="filters">
          <div class="field">
            <label for="f-status">Status</label>
            <select id="f-status">
              <option value="">All</option>
              ${STATUSES.map((s) => `<option value="${esc(s)}" ${filters.status === s ? "selected" : ""}>${esc(s)}</option>`).join("")}
            </select>
          </div>
          <div class="field">
            <label for="f-staff">Staff</label>
            <select id="f-staff">
              <option value="">All</option>
              ${state.staff.map((s) => `<option value="${esc(s.id)}" ${filters.staffId === s.id ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
            </select>
          </div>
          <div class="field" style="flex:2 1 180px;">
            <label for="f-search">Search</label>
            <input type="search" id="f-search" placeholder="Name, client…" value="${esc(filters.search)}" />
          </div>
        </div>
        <div class="stack">${jobs.length ? jobs.map(jobCardHtml).join("") : `<div class="empty"><strong>No jobs</strong></div>`}</div>
      </div>
    `;
  }

  function renderJobDetail(jobId) {
    const j = state.jobs.find((x) => x.id === jobId);
    if (!j) return `<div class="empty"><strong>Job not found</strong></div>`;
    const pct = computePct(j);
    const updates = state.updates
      .filter((u) => u.jobId === j.id)
      .sort((a, b) => (b.date + b.id).localeCompare(a.date + a.id));
    const mats = state.materials.filter((m) => m.jobId === j.id);

    return `
      <button type="button" class="back-link" id="btn-back">← Back</button>
      <div class="card">
        <div class="row between">
          <h2 style="margin:0;">${esc(j.name)} ${j.sample ? '<span class="sample-badge">Sample</span>' : ""}</h2>
          <span class="progress-label">${pct}%</span>
        </div>
        <p class="muted">${esc(j.client)}</p>
        <div class="job-meta">
          <span class="pill ${statusClass(j.status)}">${esc(j.status)}</span>
          <span class="pill ${priorityClass(j.priority)}">${esc(j.priority)}</span>
          <span class="pill">${esc(j.jobType)}</span>
        </div>
        <div class="progress" style="margin:10px 0;"><span style="width:${pct}%"></span></div>
        <p><strong>Due:</strong> ${esc(formatDate(j.dueDate))} &nbsp;·&nbsp; <strong>Staff:</strong> ${esc(staffNames(j.assignedStaffIds))}</p>
        ${j.notes ? `<p class="muted">${esc(j.notes)}</p>` : ""}
        <div class="row" style="margin-top:10px;">
          <button type="button" class="btn btn-sm" id="btn-edit-job">Edit job</button>
          <button type="button" class="btn btn-sm btn-primary" id="btn-add-update">+ Progress update</button>
          <button type="button" class="btn btn-sm" id="btn-add-mat">+ Material</button>
          <button type="button" class="btn btn-sm btn-danger" id="btn-delete-job">Delete</button>
        </div>
      </div>

      <div class="card detail-section">
        <h3>Production stages</h3>
        <ul class="stages" id="stage-list">
          ${j.stages
            .map(
              (s, i) => `
            <li>
              <input type="checkbox" data-stage-idx="${i}" id="stage-${i}" ${s.done ? "checked" : ""} />
              <label for="stage-${i}" class="${s.done ? "done" : ""}" style="margin:0;font-weight:500;">${esc(s.name)}</label>
            </li>`
            )
            .join("")}
        </ul>
        <p class="hint">Checking stages updates overall % complete (${pct}% = ${j.stages.filter((s) => s.done).length}/${j.stages.length}).</p>
      </div>

      <div class="card detail-section">
        <div class="row between">
          <h3>Daily progress timeline</h3>
        </div>
        ${
          updates.length
            ? `<ul class="timeline">${updates
                .map(
                  (u) => `
              <li>
                <div class="when">${esc(formatDate(u.date))} · ${esc(staffName(u.staffId))} · ${esc(u.stage)} · ${u.pct != null ? u.pct + "%" : ""}</div>
                <div class="what">${esc(u.note || "")}</div>
                <button type="button" class="btn btn-sm btn-ghost" data-del-update="${esc(u.id)}">Remove</button>
              </li>`
                )
                .join("")}</ul>`
            : `<p class="muted">No updates yet. Tap “+ Progress update”.</p>`
        }
      </div>

      <div class="card detail-section">
        <h3>Materials for this job</h3>
        ${
          mats.length
            ? `<div class="table-wrap"><table class="data"><thead><tr>
                <th>Item</th><th>Qty</th><th>Supplier</th><th>Status</th><th></th>
              </tr></thead><tbody>
              ${mats
                .map(
                  (m) => `<tr>
                  <td>${esc(m.item)}${m.sample ? ' <span class="sample-badge">Sample</span>' : ""}<br/><span class="muted">Expect ${esc(formatDate(m.expectedDate))}</span></td>
                  <td>${esc(m.qty)} ${esc(m.unit)}</td>
                  <td>${esc(m.supplier)}</td>
                  <td><span class="pill ${matClass(m.status)}">${esc(m.status)}</span></td>
                  <td><button type="button" class="btn btn-sm" data-edit-mat="${esc(m.id)}">Edit</button></td>
                </tr>`
                )
                .join("")}
              </tbody></table></div>`
            : `<p class="muted">No materials listed.</p>`
        }
      </div>
    `;
  }

  function renderMaterialsView() {
    const waiting = state.materials
      .filter((m) => m.status !== "Received/Ready")
      .map((m) => ({ ...m, job: state.jobs.find((j) => j.id === m.jobId) }))
      .sort((a, b) => (a.expectedDate || "").localeCompare(b.expectedDate || ""));
    const all = state.materials
      .map((m) => ({ ...m, job: state.jobs.find((j) => j.id === m.jobId) }))
      .sort((a, b) => (a.expectedDate || "").localeCompare(b.expectedDate || ""));

    return `
      <div class="card">
        <div class="row between">
          <h2>Materials waiting</h2>
          <button type="button" class="btn btn-primary btn-sm" id="btn-add-mat-global">+ Material</button>
        </div>
        <p class="muted">Needed or ordered items across all jobs (global view).</p>
        ${
          waiting.length
            ? materialsTable(waiting)
            : `<p class="muted">Nothing waiting — all materials Received/Ready.</p>`
        }
      </div>
      <div class="card">
        <h2>All materials</h2>
        ${all.length ? materialsTable(all) : `<div class="empty"><strong>No materials</strong></div>`}
      </div>
    `;
  }

  function materialsTable(rows) {
    return `<div class="table-wrap"><table class="data"><thead><tr>
      <th>Item</th><th>Job</th><th>Qty</th><th>Status</th><th>Expected</th><th></th>
    </tr></thead><tbody>
    ${rows
      .map(
        (m) => `<tr class="clickable" data-job-id="${esc(m.jobId)}">
        <td>${esc(m.item)}${m.sample ? ' <span class="sample-badge">Sample</span>' : ""}<br/><span class="muted">${esc(m.supplier || "")}</span></td>
        <td>${esc(m.job ? m.job.name : "—")}</td>
        <td>${esc(m.qty)} ${esc(m.unit)}</td>
        <td><span class="pill ${matClass(m.status)}">${esc(m.status)}</span></td>
        <td>${esc(formatDate(m.expectedDate))}</td>
        <td><button type="button" class="btn btn-sm" data-edit-mat="${esc(m.id)}">Edit</button></td>
      </tr>`
      )
      .join("")}
    </tbody></table></div>`;
  }

  function renderStaffView() {
    return `
      <div class="card">
        <div class="row between">
          <h2>Staff</h2>
          <button type="button" class="btn btn-primary btn-sm" id="btn-add-staff">+ Add staff</button>
        </div>
        <div class="stack">
          ${
            state.staff.length
              ? state.staff
                  .map((s) => {
                    const jobs = state.jobs.filter(
                      (j) => (j.assignedStaffIds || []).includes(s.id) && j.status !== "Completed"
                    );
                    return `<div class="card" style="margin:0;box-shadow:none;">
                      <div class="row between">
                        <div>
                          <strong>${esc(s.name)}</strong> ${s.sample ? '<span class="sample-badge">Sample</span>' : ""}
                          <div class="muted">${esc(s.role || "")}</div>
                        </div>
                        <div class="row">
                          <button type="button" class="btn btn-sm" data-edit-staff="${esc(s.id)}">Edit</button>
                          <button type="button" class="btn btn-sm btn-danger" data-del-staff="${esc(s.id)}">Remove</button>
                        </div>
                      </div>
                      <p class="muted" style="margin:8px 0 0;">Active jobs: ${
                        jobs.length
                          ? jobs.map((j) => esc(j.name)).join("; ")
                          : "None"
                      }</p>
                    </div>`;
                  })
                  .join("")
              : `<div class="empty"><strong>No staff yet</strong></div>`
          }
        </div>
      </div>
    `;
  }

  function renderReportsView() {
    const byStatus = {};
    STATUSES.forEach((s) => (byStatus[s] = 0));
    state.jobs.forEach((j) => {
      byStatus[j.status] = (byStatus[j.status] || 0) + 1;
    });

    let onTime = 0;
    let late = 0;
    state.jobs.forEach((j) => {
      if (!j.dueDate) return;
      const d = daysUntil(j.dueDate);
      if (j.status === "Completed") {
        // treat completed as on-time if due date not past relative to today? Simple: if due was before today when still open we already counted late elsewhere.
        // For completed: count as on-time for this simple report
        onTime++;
      } else if (d != null && d < 0) late++;
      else onTime++;
    });

    // Updates this week (Mon–Sun Asia/Manila)
    const t = todayISO();
    const tMs = Date.parse(t + "T00:00:00+08:00");
    const dow = new Date(tMs).getUTCDay(); // careful: using +08 fixed
    // get Manila day of week
    const manilaDow = Number(
      new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" })
        .formatToParts(new Date())
        .find(() => true) &&
        ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
          new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(new Date())
        )
    );
    const mondayOffset = manilaDow === 0 ? -6 : 1 - manilaDow;
    const weekStartMs = tMs + mondayOffset * 86400000;
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartMs + i * 86400000);
      weekDates.push(
        new Intl.DateTimeFormat("en-CA", {
          timeZone: "UTC",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(d)
      );
    }
    // Fix week dates: construct from ISO adding days in Manila
    const addDaysISO = (iso, n) => {
      const base = Date.parse(iso + "T00:00:00+08:00");
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: TZ,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(base + n * 86400000));
    };
    const weekStartISO = addDaysISO(t, mondayOffset);
    const weekSet = new Set();
    for (let i = 0; i < 7; i++) weekSet.add(addDaysISO(weekStartISO, i));

    const updatesByStaff = {};
    state.staff.forEach((s) => (updatesByStaff[s.id] = 0));
    state.updates.forEach((u) => {
      if (weekSet.has(u.date)) {
        updatesByStaff[u.staffId] = (updatesByStaff[u.staffId] || 0) + 1;
      }
    });

    return `
      <div class="card">
        <div class="row between">
          <h2>Basic report</h2>
          <button type="button" class="btn btn-sm" id="btn-print">Print</button>
        </div>
        <p class="muted">As of ${esc(formatDate(todayISO()))} (Asia/Manila). Currency notes use PHP when exporting.</p>
      </div>
      <div class="grid-2">
        <div class="card">
          <h3>Jobs by status</h3>
          <ul style="margin:0;padding-left:18px;">
            ${Object.keys(byStatus)
              .map((s) => `<li><strong>${esc(s)}:</strong> ${byStatus[s]}</li>`)
              .join("")}
          </ul>
        </div>
        <div class="card">
          <h3>On-time vs late (open / simple)</h3>
          <p><strong>On track / completed:</strong> ${onTime}</p>
          <p><strong>Currently late (open past due):</strong> ${late}</p>
        </div>
      </div>
      <div class="card">
        <h3>Progress updates this week (per staff)</h3>
        <p class="muted">Week of ${esc(formatDate(weekStartISO))} · Manila</p>
        <div class="table-wrap"><table class="data"><thead><tr><th>Staff</th><th>Updates</th></tr></thead><tbody>
          ${state.staff
            .map((s) => `<tr><td>${esc(s.name)}</td><td>${updatesByStaff[s.id] || 0}</td></tr>`)
            .join("")}
        </tbody></table></div>
      </div>
    `;
  }

  function render() {
    renderTodayLabel();
    setActiveTab();
    const root = document.getElementById("content");
    if (view === "dashboard") root.innerHTML = renderDashboard();
    else if (view === "jobs") {
      if (selectedJobId) root.innerHTML = renderJobDetail(selectedJobId);
      else root.innerHTML = renderJobsView();
    } else if (view === "materials") root.innerHTML = renderMaterialsView();
    else if (view === "staff") root.innerHTML = renderStaffView();
    else if (view === "reports") root.innerHTML = renderReportsView();
    bindViewEvents();
  }

  // ---------- forms ----------
  function jobFormHtml(job) {
    const j = job || {
      name: "",
      client: "",
      jobType: JOB_TYPES[0],
      dueDate: todayISO(),
      assignedStaffIds: [],
      priority: "Medium",
      status: "Not started",
      notes: "",
    };
    return `
      <div class="form-grid">
        <div class="field full"><label>Job name</label><input type="text" id="jf-name" value="${esc(j.name)}" required /></div>
        <div class="field full"><label>Client</label><input type="text" id="jf-client" value="${esc(j.client)}" /></div>
        <div class="field full"><label>Job type</label>
          <select id="jf-type">${JOB_TYPES.map((t) => `<option value="${esc(t)}" ${j.jobType === t ? "selected" : ""}>${esc(t)}</option>`).join("")}</select>
        </div>
        <div class="field"><label>Due date</label><input type="date" id="jf-due" value="${esc(j.dueDate || "")}" /></div>
        <div class="field"><label>Priority</label>
          <select id="jf-priority">${PRIORITIES.map((p) => `<option ${j.priority === p ? "selected" : ""}>${esc(p)}</option>`).join("")}</select>
        </div>
        <div class="field"><label>Status</label>
          <select id="jf-status">${STATUSES.map((s) => `<option ${j.status === s ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
        </div>
        <div class="field full"><label>Assigned staff</label>
          <div class="stack">${state.staff
            .map(
              (s) => `<label class="checkbox-inline"><input type="checkbox" class="jf-staff" value="${esc(s.id)}" ${(j.assignedStaffIds || []).includes(s.id) ? "checked" : ""} /> ${esc(s.name)}</label>`
            )
            .join("") || "<span class='muted'>Add staff first</span>"}</div>
        </div>
        <div class="field full"><label>Notes</label><textarea id="jf-notes">${esc(j.notes || "")}</textarea></div>
      </div>
    `;
  }

  function readJobForm() {
    const staffIds = Array.from(document.querySelectorAll(".jf-staff:checked")).map((el) => el.value);
    return {
      name: document.getElementById("jf-name").value.trim(),
      client: document.getElementById("jf-client").value.trim(),
      jobType: document.getElementById("jf-type").value,
      dueDate: document.getElementById("jf-due").value,
      priority: document.getElementById("jf-priority").value,
      status: document.getElementById("jf-status").value,
      assignedStaffIds: staffIds,
      notes: document.getElementById("jf-notes").value.trim(),
    };
  }

  function showJobModal(existing) {
    openModal(
      existing ? "Edit job" : "New job",
      jobFormHtml(existing),
      `<button type="button" class="btn" id="modal-cancel">Cancel</button>
       <button type="button" class="btn btn-primary" id="modal-save-job">Save</button>`
    );
    document.getElementById("modal-cancel").onclick = closeModal;
    document.getElementById("modal-save-job").onclick = () => {
      const data = readJobForm();
      if (!data.name) {
        toast("Job name is required");
        return;
      }
      if (existing) {
        Object.assign(existing, data);
      } else {
        state.jobs.push({
          id: uid(),
          ...data,
          stages: emptyStages(),
          sample: false,
          createdAt: todayISO(),
        });
      }
      save(state);
      closeModal();
      toast(existing ? "Job updated" : "Job created");
      render();
    };
  }

  function showUpdateModal(job) {
    openModal(
      "Progress update",
      `<div class="form-grid">
        <div class="field"><label>Date</label><input type="date" id="uf-date" value="${todayISO()}" /></div>
        <div class="field"><label>Staff</label>
          <select id="uf-staff">${state.staff.map((s) => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join("")}</select>
        </div>
        <div class="field full"><label>Stage</label>
          <select id="uf-stage">${STAGES.map((s) => `<option>${esc(s)}</option>`).join("")}</select>
        </div>
        <div class="field"><label>% complete (optional)</label><input type="number" id="uf-pct" min="0" max="100" value="${computePct(job)}" /></div>
        <div class="field full"><label>Note</label><textarea id="uf-note" placeholder="What was done today?"></textarea></div>
      </div>`,
      `<button type="button" class="btn" id="modal-cancel">Cancel</button>
       <button type="button" class="btn btn-primary" id="modal-save-upd">Save update</button>`
    );
    document.getElementById("modal-cancel").onclick = closeModal;
    document.getElementById("modal-save-upd").onclick = () => {
      const note = document.getElementById("uf-note").value.trim();
      if (!note) {
        toast("Please add a note");
        return;
      }
      state.updates.push({
        id: uid(),
        jobId: job.id,
        date: document.getElementById("uf-date").value || todayISO(),
        staffId: document.getElementById("uf-staff").value,
        stage: document.getElementById("uf-stage").value,
        note,
        pct: Number(document.getElementById("uf-pct").value) || null,
        sample: false,
      });
      if (job.status === "Not started") job.status = "In progress";
      save(state);
      closeModal();
      toast("Update saved");
      render();
    };
  }

  function showMaterialModal(existing, presetJobId) {
    const m = existing || {
      jobId: presetJobId || (state.jobs[0] && state.jobs[0].id) || "",
      item: "",
      qty: 1,
      unit: "pcs",
      supplier: "",
      status: "Needed",
      expectedDate: todayISO(),
    };
    openModal(
      existing ? "Edit material" : "Add material",
      `<div class="form-grid">
        <div class="field full"><label>Job</label>
          <select id="mf-job">${state.jobs.map((j) => `<option value="${esc(j.id)}" ${m.jobId === j.id ? "selected" : ""}>${esc(j.name)}</option>`).join("")}</select>
        </div>
        <div class="field full"><label>Item</label><input type="text" id="mf-item" value="${esc(m.item)}" /></div>
        <div class="field"><label>Qty</label><input type="number" id="mf-qty" value="${esc(m.qty)}" min="0" step="any" /></div>
        <div class="field"><label>Unit</label><input type="text" id="mf-unit" value="${esc(m.unit)}" /></div>
        <div class="field full"><label>Supplier</label><input type="text" id="mf-supplier" value="${esc(m.supplier)}" /></div>
        <div class="field"><label>Status</label>
          <select id="mf-status">${MAT_STATUSES.map((s) => `<option ${m.status === s ? "selected" : ""}>${esc(s)}</option>`).join("")}</select>
        </div>
        <div class="field"><label>Expected date</label><input type="date" id="mf-expected" value="${esc(m.expectedDate || "")}" /></div>
      </div>`,
      `<button type="button" class="btn" id="modal-cancel">Cancel</button>
       ${existing ? `<button type="button" class="btn btn-danger" id="modal-del-mat">Delete</button>` : ""}
       <button type="button" class="btn btn-primary" id="modal-save-mat">Save</button>`
    );
    document.getElementById("modal-cancel").onclick = closeModal;
    const delBtn = document.getElementById("modal-del-mat");
    if (delBtn) {
      delBtn.onclick = () => {
        if (!confirm("Delete this material?")) return;
        state.materials = state.materials.filter((x) => x.id !== existing.id);
        save(state);
        closeModal();
        toast("Material deleted");
        render();
      };
    }
    document.getElementById("modal-save-mat").onclick = () => {
      const item = document.getElementById("mf-item").value.trim();
      if (!item) {
        toast("Item name required");
        return;
      }
      const payload = {
        jobId: document.getElementById("mf-job").value,
        item,
        qty: Number(document.getElementById("mf-qty").value) || 0,
        unit: document.getElementById("mf-unit").value.trim() || "pcs",
        supplier: document.getElementById("mf-supplier").value.trim(),
        status: document.getElementById("mf-status").value,
        expectedDate: document.getElementById("mf-expected").value,
      };
      if (existing) Object.assign(existing, payload);
      else state.materials.push({ id: uid(), ...payload, sample: false });
      save(state);
      closeModal();
      toast("Material saved");
      render();
    };
  }

  function showStaffModal(existing) {
    const s = existing || { name: "", role: "" };
    openModal(
      existing ? "Edit staff" : "Add staff",
      `<div class="field"><label>Name</label><input type="text" id="sf-name" value="${esc(s.name)}" /></div>
       <div class="field"><label>Role</label><input type="text" id="sf-role" value="${esc(s.role || "")}" /></div>`,
      `<button type="button" class="btn" id="modal-cancel">Cancel</button>
       <button type="button" class="btn btn-primary" id="modal-save-staff">Save</button>`
    );
    document.getElementById("modal-cancel").onclick = closeModal;
    document.getElementById("modal-save-staff").onclick = () => {
      const name = document.getElementById("sf-name").value.trim();
      if (!name) {
        toast("Name required");
        return;
      }
      const role = document.getElementById("sf-role").value.trim();
      if (existing) {
        existing.name = name;
        existing.role = role;
      } else {
        state.staff.push({ id: uid(), name, role, sample: false });
      }
      save(state);
      closeModal();
      toast("Staff saved");
      render();
    };
  }

  // ---------- events ----------
  function bindViewEvents() {
    document.querySelectorAll(".job-card, tr.clickable[data-job-id]").forEach((el) => {
      const open = () => {
        selectedJobId = el.getAttribute("data-job-id");
        view = "jobs";
        render();
      };
      el.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        open();
      });
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      });
    });

    document.querySelectorAll(".reminders li[data-job]").forEach((li) => {
      li.style.cursor = "pointer";
      li.addEventListener("click", () => {
        selectedJobId = li.getAttribute("data-job");
        view = "jobs";
        render();
      });
    });

    const fStatus = document.getElementById("f-status");
    const fStaff = document.getElementById("f-staff");
    const fSearch = document.getElementById("f-search");
    if (fStatus) fStatus.onchange = () => { filters.status = fStatus.value; render(); };
    if (fStaff) fStaff.onchange = () => { filters.staffId = fStaff.value; render(); };
    if (fSearch) {
      fSearch.oninput = () => {
        filters.search = fSearch.value;
        // debounce light
        clearTimeout(fSearch._t);
        fSearch._t = setTimeout(render, 200);
      };
    }

    const newJob = document.getElementById("btn-new-job");
    if (newJob) newJob.onclick = () => showJobModal(null);

    const back = document.getElementById("btn-back");
    if (back)
      back.onclick = () => {
        selectedJobId = null;
        render();
      };

    const editJob = document.getElementById("btn-edit-job");
    if (editJob) {
      editJob.onclick = () => {
        const j = state.jobs.find((x) => x.id === selectedJobId);
        if (j) showJobModal(j);
      };
    }

    const addUpd = document.getElementById("btn-add-update");
    if (addUpd) {
      addUpd.onclick = () => {
        const j = state.jobs.find((x) => x.id === selectedJobId);
        if (j) showUpdateModal(j);
      };
    }

    const addMat = document.getElementById("btn-add-mat");
    if (addMat) addMat.onclick = () => showMaterialModal(null, selectedJobId);

    const addMatG = document.getElementById("btn-add-mat-global");
    if (addMatG) addMatG.onclick = () => showMaterialModal(null, null);

    const delJob = document.getElementById("btn-delete-job");
    if (delJob) {
      delJob.onclick = () => {
        if (!confirm("Delete this job and its updates/materials links?")) return;
        const id = selectedJobId;
        state.jobs = state.jobs.filter((j) => j.id !== id);
        state.updates = state.updates.filter((u) => u.jobId !== id);
        state.materials = state.materials.filter((m) => m.jobId !== id);
        save(state);
        selectedJobId = null;
        toast("Job deleted");
        render();
      };
    }

    document.querySelectorAll("#stage-list input[type=checkbox]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const j = state.jobs.find((x) => x.id === selectedJobId);
        if (!j) return;
        const idx = Number(cb.getAttribute("data-stage-idx"));
        j.stages[idx].done = cb.checked;
        const pct = computePct(j);
        if (pct === 100) j.status = "Completed";
        else if (j.status === "Completed") j.status = "In progress";
        else if (j.status === "Not started" && pct > 0) j.status = "In progress";
        save(state);
        render();
      });
    });

    document.querySelectorAll("[data-del-update]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-del-update");
        state.updates = state.updates.filter((u) => u.id !== id);
        save(state);
        toast("Update removed");
        render();
      };
    });

    document.querySelectorAll("[data-edit-mat]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const m = state.materials.find((x) => x.id === btn.getAttribute("data-edit-mat"));
        if (m) showMaterialModal(m);
      };
    });

    const addStaff = document.getElementById("btn-add-staff");
    if (addStaff) addStaff.onclick = () => showStaffModal(null);

    document.querySelectorAll("[data-edit-staff]").forEach((btn) => {
      btn.onclick = () => {
        const s = state.staff.find((x) => x.id === btn.getAttribute("data-edit-staff"));
        if (s) showStaffModal(s);
      };
    });
    document.querySelectorAll("[data-del-staff]").forEach((btn) => {
      btn.onclick = () => {
        if (!confirm("Remove this staff member?")) return;
        const id = btn.getAttribute("data-del-staff");
        state.staff = state.staff.filter((s) => s.id !== id);
        state.jobs.forEach((j) => {
          j.assignedStaffIds = (j.assignedStaffIds || []).filter((x) => x !== id);
        });
        save(state);
        toast("Staff removed");
        render();
      };
    });

    const printBtn = document.getElementById("btn-print");
    if (printBtn) printBtn.onclick = () => window.print();
  }

  // ---------- import / export ----------
  function exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    downloadBlob(blob, `maycie-tracker-backup-${todayISO()}.json`);
    toast("JSON backup downloaded");
  }

  function exportCSV() {
    const lines = [];
    lines.push("=== JOBS ===");
    lines.push(["id", "name", "client", "jobType", "dueDate", "priority", "status", "pct", "staff", "notes"].join(","));
    state.jobs.forEach((j) => {
      lines.push(
        [j.id, j.name, j.client, j.jobType, j.dueDate, j.priority, j.status, computePct(j), staffNames(j.assignedStaffIds), j.notes]
          .map(csvEsc)
          .join(",")
      );
    });
    lines.push("");
    lines.push("=== MATERIALS ===");
    lines.push(["id", "jobId", "item", "qty", "unit", "supplier", "status", "expectedDate"].join(","));
    state.materials.forEach((m) => {
      lines.push([m.id, m.jobId, m.item, m.qty, m.unit, m.supplier, m.status, m.expectedDate].map(csvEsc).join(","));
    });
    lines.push("");
    lines.push("=== UPDATES ===");
    lines.push(["id", "jobId", "date", "staff", "stage", "pct", "note"].join(","));
    state.updates.forEach((u) => {
      lines.push([u.id, u.jobId, u.date, staffName(u.staffId), u.stage, u.pct, u.note].map(csvEsc).join(","));
    });
    lines.push("");
    lines.push("=== STAFF ===");
    lines.push(["id", "name", "role"].join(","));
    state.staff.forEach((s) => lines.push([s.id, s.name, s.role].map(csvEsc).join(",")));

    const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, `maycie-tracker-export-${todayISO()}.csv`);
    toast("CSV exported");
  }

  function csvEsc(v) {
    const s = String(v == null ? "" : v);
    if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 500);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.jobs || !Array.isArray(data.jobs)) throw new Error("Invalid backup: missing jobs");
        if (!confirm("Replace all current data with this backup?")) return;
        state = {
          version: 1,
          seededSample: !!data.seededSample,
          staff: data.staff || [],
          jobs: data.jobs || [],
          materials: data.materials || [],
          updates: data.updates || [],
        };
        save(state);
        selectedJobId = null;
        toast("Backup imported");
        render();
      } catch (e) {
        console.error(e);
        toast("Import failed: " + e.message);
      }
    };
    reader.readAsText(file);
  }

  function clearSampleData() {
    if (!confirm("Remove all items marked as Sample? Your real entries stay.")) return;
    state.jobs = state.jobs.filter((j) => !j.sample);
    state.staff = state.staff.filter((s) => !s.sample);
    state.materials = state.materials.filter((m) => !m.sample);
    state.updates = state.updates.filter((u) => !u.sample);
    // drop orphan materials/updates
    const jobIds = new Set(state.jobs.map((j) => j.id));
    const staffIds = new Set(state.staff.map((s) => s.id));
    state.materials = state.materials.filter((m) => jobIds.has(m.jobId));
    state.updates = state.updates.filter((u) => jobIds.has(u.jobId));
    state.jobs.forEach((j) => {
      j.assignedStaffIds = (j.assignedStaffIds || []).filter((id) => staffIds.has(id));
    });
    state.seededSample = false;
    save(state);
    selectedJobId = null;
    toast("Sample data cleared");
    render();
  }

  function resetAll() {
    if (!confirm("Erase ALL data in this browser and reload sample data?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = defaultSeed();
    save(state);
    selectedJobId = null;
    filters = { status: "", staffId: "", search: "" };
    toast("Reset to sample data");
    render();
  }

  // ---------- init ----------
  function init() {
    document.getElementById("btn-menu").onclick = openDrawer;
    document.getElementById("btn-close-drawer").onclick = closeDrawer;
    document.getElementById("drawer-backdrop").onclick = closeDrawer;
    document.getElementById("modal-close").onclick = closeModal;
    document.getElementById("modal-backdrop").onclick = closeModal;

    document.getElementById("btn-export-json").onclick = () => {
      closeDrawer();
      exportJSON();
    };
    document.getElementById("btn-export-csv").onclick = () => {
      closeDrawer();
      exportCSV();
    };
    document.getElementById("btn-import-json").onclick = () => {
      document.getElementById("import-file").click();
    };
    document.getElementById("import-file").onchange = (e) => {
      const f = e.target.files && e.target.files[0];
      if (f) importJSON(f);
      e.target.value = "";
      closeDrawer();
    };
    document.getElementById("btn-clear-sample").onclick = () => {
      closeDrawer();
      clearSampleData();
    };
    document.getElementById("btn-reset-all").onclick = () => {
      closeDrawer();
      resetAll();
    };

    document.getElementById("main-tabs").addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      view = btn.dataset.view;
      selectedJobId = null;
      render();
    });

    render();
  }

  // Expose for debugging / tests
  window.MaycieTracker = {
    getState: () => state,
    save,
    render,
    todayISO,
    computePct,
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
