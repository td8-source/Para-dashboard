(async function runHemsScraperV5() {
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  console.log("Starting mission scrape with flight hours and patient extraction...");

  const incidentRegex = /\b\d{4}-\d-\d{4}\/\d{2}\/\d{2}\b/;

  // 1. Gather all mission items in the left search results sidebar
  const candidateElements = Array.from(document.querySelectorAll("*")).filter((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.left > window.innerWidth * 0.45) return false;
    if (rect.width === 0 || rect.height === 0) return false;

    const style = window.getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") return false;

    const text = el.innerText || "";
    const matches = text.match(new RegExp(incidentRegex, "g"));
    return matches && matches.length === 1;
  });

  const leafCandidates = candidateElements.filter(
    (el) => !candidateElements.some((other) => other !== el && el.contains(other))
  );

  const missionElements = [];
  const seenNodes = new Set();
  for (const leaf of leafCandidates) {
    const clickable = leaf.closest("a, button, [role='button'], li, tr, .card, div[onclick]") || leaf;
    if (!seenNodes.has(clickable)) {
      seenNodes.add(clickable);
      missionElements.push({
        element: clickable,
        label: clickable.innerText.replace(/\s+/g, " ").trim(),
        incident: (clickable.innerText.match(incidentRegex) || [""])[0]
      });
    }
  }

  console.log(`Found ${missionElements.length} mission(s) in search results.`);
  if (missionElements.length === 0) {
    console.error("No missions detected. Make sure the search results are visible on screen.");
    return;
  }

  // 2. Tab Locator: strictly distinguishes tab links from form labels
  function getTabElements() {
    const tabMap = { mission: null, crew: null, patient: null, events: null };

    // Locate dedicated tab strips first
    const navBars = Array.from(
      document.querySelectorAll(".nav-tabs, .nav-pills, [role='tablist'], .nav, .tabs, ul")
    );
    let tabStrip = null;
    for (const nb of navBars) {
      const txt = (nb.innerText || "").toLowerCase();
      const matchCount = ["mission", "crew", "patient", "event"].filter((w) =>
        new RegExp(`\\b${w}`, "i").test(txt)
      ).length;
      if (matchCount >= 3) {
        tabStrip = nb;
        break;
      }
    }

    const clickables = tabStrip
      ? Array.from(tabStrip.querySelectorAll("a, button, [role='tab'], li"))
      : Array.from(document.querySelectorAll("a, button, [role='tab']")).filter(
          (el) => el.getBoundingClientRect().left >= window.innerWidth * 0.3
        );

    for (const el of clickables) {
      const txt = (el.innerText || "").trim();
      if (/^mission(\s*\(\d+\))?$/i.test(txt) && !tabMap.mission) tabMap.mission = el;
      if (/^crew(\s*\(\d+\))?$/i.test(txt) && !tabMap.crew) tabMap.crew = el;
      if (/^patient(s)?(\s*\(\d+\))?$/i.test(txt) && !tabMap.patient) tabMap.patient = el;
      if (/^event(s)?(\s*\(\d+\))?$/i.test(txt) && !tabMap.events) tabMap.events = el;
    }

    return tabMap;
  }

  async function activateTab(tabElement) {
    if (!tabElement) return null;
    tabElement.scrollIntoView({ block: "nearest" });

    if (window.jQuery) {
      try {
        window.jQuery(tabElement).tab("show");
        window.jQuery(tabElement).trigger("click");
      } catch (e) {}
    }

    const target = tabElement.tagName === "A" || tabElement.tagName === "BUTTON"
      ? tabElement
      : (tabElement.querySelector("a, button") || tabElement);

    ["pointerdown", "mousedown", "pointerup", "mouseup", "click"].forEach((evt) => {
      target.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true, view: window }));
    });
    if (typeof target.click === "function") target.click();

    await sleep(700);

    const selector = target.getAttribute("href") || target.dataset?.target;
    if (selector && selector.startsWith("#")) {
      const pane = document.querySelector(selector);
      if (pane) return pane;
    }

    const activePane = document.querySelector(
      ".tab-pane.active, .tab-pane[class*='active'], [role='tabpanel']:not([hidden])"
    );
    if (activePane) return activePane;

    return document.body;
  }

  // 3. Extraction Handlers

  // Helper to resolve input label text
  function getFieldLabel(el) {
    let label = "";
    if (el.id) {
      const l = document.querySelector(`label[for="${el.id}"]`);
      if (l) label = l.innerText;
    }
    if (!label) {
      const parent = el.closest("label, .form-group, .field, tr, td, div");
      const l = parent?.querySelector("label, strong, b, .label");
      if (l && l !== el) label = l.innerText;
    }
    if (!label) label = el.name || el.placeholder || el.id || "";
    return label.replace(/[:*]/g, "").trim();
  }

  // Mission Tab
  function extractMissionFields(container) {
    const out = {};
    const exclude = [
      /Persons_name/i, /Date_of_birth/i, /^Mission_Sex$/i, /Root_cause/i,
      /Terrain_type/i, /Recovery_technique/i, /Number_in_party/i,
      /injured_or_deceased/i, /Number_at_risk/i, /Preparedness/i,
      /Equipment/i, /Experience/i, /Police_cost_centre/i
    ];

    const inputs = container.querySelectorAll("input, select, textarea");
    inputs.forEach((el) => {
      if (el.type === "hidden" || el.type === "submit" || el.type === "button") return;
      if (el.closest(".sidebar, nav, header") || el.name?.startsWith("filter")) return;

      const label = getFieldLabel(el);
      if (!label) return;

      const key = `Mission_${label}`.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
      if (exclude.some((rgx) => rgx.test(key))) return;

      let val = el.tagName === "SELECT" ? (el.options[el.selectedIndex]?.text || el.value) : el.value;
      if (el.type === "checkbox") val = el.checked ? "Yes" : "No";
      if (el.type === "radio") {
        if (!el.checked) return;
        val = el.value || "Selected";
      }

      out[key] = (val || "").trim();
    });
    return out;
  }

  // Crew Tab
  function extractCrewFields(container) {
    const out = {};
    const summary = [];
    let idx = 1;

    // Table rows
    const tables = container.querySelectorAll("table");
    tables.forEach((table) => {
      const headers = Array.from(table.querySelectorAll("th")).map((th) => th.innerText.trim());
      const rows = Array.from(table.querySelectorAll("tbody tr, tr")).filter((r) => !r.querySelector("th"));

      rows.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll("td"));
        if (!cells.length) return;
        const rowData = {};
        const rowParts = [];

        cells.forEach((td, cIdx) => {
          const colName = headers[cIdx] || `Col_${cIdx + 1}`;
          const input = td.querySelector("input, select");
          let val = input
            ? (input.tagName === "SELECT" ? input.options[input.selectedIndex]?.text : input.value)
            : td.innerText;
          val = (val || "").trim();
          const cleanCol = colName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
          rowData[cleanCol] = val;
          if (val && val !== "Choose option ...") rowParts.push(`${colName}: ${val}`);
        });

        if (Object.values(rowData).some((v) => v.length > 0 && v !== "Choose option ...")) {
          for (const [col, val] of Object.entries(rowData)) {
            out[`Crew_${idx}_${col}`] = val;
          }
          summary.push(rowParts.join(" | "));
          idx++;
        }
      });
    });

    // Crew form fields
    const inputs = container.querySelectorAll("input, select, textarea");
    const counts = {};
    inputs.forEach((el) => {
      if (el.type === "hidden" || el.type === "submit" || el.type === "button") return;
      if (el.closest(".sidebar, nav, header") || el.name?.startsWith("filter")) return;

      const label = getFieldLabel(el);
      if (!label) return;

      let val = (el.tagName === "SELECT" ? (el.options[el.selectedIndex]?.text || el.value) : el.value || "").trim();
      if (!val || val === "Choose option ...") return;

      counts[label] = (counts[label] || 0) + 1;
      const suffix = counts[label] > 1 ? `_${counts[label]}` : "";
      out[`Crew_Field_${label.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")}${suffix}`] = val;
      if (!summary.some((s) => s.includes(val))) summary.push(`${label}: ${val}`);
    });

    out["Crew_Summary"] = summary.join(" ; ");
    return out;
  }

  // Patient Tab (Age, Sex, Diagnostic Category)
  function extractPatientFields(container) {
    const patientData = {
      Patient_Age: "",
      Patient_Sex: "",
      Patient_Diagnostic_Category: ""
    };

    const inputs = container.querySelectorAll("input, select, textarea");
    inputs.forEach((el) => {
      const label = getFieldLabel(el).toLowerCase();
      let val = (el.tagName === "SELECT" ? (el.options[el.selectedIndex]?.text || el.value) : el.value || "").trim();
      if (!val || val.includes("Choose option")) return;

      if (/\bage\b|\bdob\b|\byears\b|\bmonths\b/i.test(label) && !patientData.Patient_Age) {
        patientData.Patient_Age = val;
      } else if (/\bsex\b|\bgender\b/i.test(label) && !patientData.Patient_Sex) {
        patientData.Patient_Sex = val;
      } else if (/\bdiagnos|\bcategory\b|\bcondition\b|\bpresentation\b/i.test(label) && !patientData.Patient_Diagnostic_Category) {
        patientData.Patient_Diagnostic_Category = val;
      }
    });

    // Table scan
    const tables = container.querySelectorAll("table");
    tables.forEach((table) => {
      const trs = Array.from(table.querySelectorAll("tr"));
      trs.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll("td, th"));
        if (cells.length >= 2) {
          const rowLabel = cells[0].innerText.trim().toLowerCase();
          const rowVal = cells[1].innerText.trim();
          if (!rowVal || rowVal.includes("Choose option")) return;
          if (/\bage\b/i.test(rowLabel) && !patientData.Patient_Age) patientData.Patient_Age = rowVal;
          if (/\bsex\b|\bgender\b/i.test(rowLabel) && !patientData.Patient_Sex) patientData.Patient_Sex = rowVal;
          if (/\bdiagnos|\bcategory\b/i.test(rowLabel) && !patientData.Patient_Diagnostic_Category) patientData.Patient_Diagnostic_Category = rowVal;
        }
      });
    });

    // Plain text / definition list scan
    const textNodes = Array.from(container.querySelectorAll("div, p, span, td, dl, dt, dd"));
    textNodes.forEach((el) => {
      const text = el.innerText || "";
      const ageMatch = text.match(/\b(?:Age|DOB):\s*([^\n\r,;]+)/i);
      if (ageMatch && !patientData.Patient_Age) patientData.Patient_Age = ageMatch[1].trim();

      const sexMatch = text.match(/\b(?:Sex|Gender):\s*([^\n\r,;]+)/i);
      if (sexMatch && !patientData.Patient_Sex && !sexMatch[1].includes("Choose option")) {
        patientData.Patient_Sex = sexMatch[1].trim();
      }

      const catMatch = text.match(/\b(?:Diagnostic Category|Diagnosis|Category):\s*([^\n\r,;]+)/i);
      if (catMatch && !patientData.Patient_Diagnostic_Category && !catMatch[1].includes("Choose option")) {
        patientData.Patient_Diagnostic_Category = catMatch[1].trim();
      }
    });

    return patientData;
  }

  // Events Tab: extracts both operational form inputs (flight hours) and milestone events
  function extractEventsFields(container) {
    const out = {
      Total_Flight_Hours: "",
      Total_Mission_Time: ""
    };
    const eventsList = [];
    let evtIdx = 1;

    // 1. Operational Form Inputs (Total flight time, Total mission time, activation, etc.)
    const inputs = container.querySelectorAll("input, select, textarea");
    inputs.forEach((el) => {
      if (el.type === "hidden" || el.type === "submit" || el.type === "button") return;
      if (el.closest(".sidebar, nav, header") || el.name?.startsWith("filter")) return;

      const label = getFieldLabel(el);
      if (!label) return;

      let val = (el.tagName === "SELECT" ? (el.options[el.selectedIndex]?.text || el.value) : el.value || "").trim();
      if (!val || val === "Choose option ...") return;

      const key = `Events_${label}`.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "");
      out[key] = val;

      // Map flight hours and mission time
      if (/total\s*flight\s*(?:time|hours?)|\bflight\s*(?:time|hours?)\b/i.test(label)) {
        out.Total_Flight_Hours = val;
      }
      if (/total\s*mission\s*(?:time|hours?)|\bmission\s*(?:time|hours?|duration)\b/i.test(label)) {
        out.Total_Mission_Time = val;
      }
    });

    // 2. Timeline Tables (excluding Vis.js keyboard helper)
    const tables = container.querySelectorAll("table");
    tables.forEach((table) => {
      const tableText = (table.innerText || "").toLowerCase();
      if (tableText.includes("move left") || tableText.includes("zoom in") || tableText.includes("jump left")) {
        return;
      }

      const headers = Array.from(table.querySelectorAll("th")).map((th) => th.innerText.trim());
      const rows = Array.from(table.querySelectorAll("tbody tr, tr")).filter((r) => !r.querySelector("th"));

      rows.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll("td"));
        if (!cells.length) return;
        const rowParts = [];
        cells.forEach((td, cIdx) => {
          const colName = headers[cIdx] || `Col_${cIdx + 1}`;
          const input = td.querySelector("input, select");
          let val = input
            ? (input.tagName === "SELECT" ? input.options[input.selectedIndex]?.text : input.value)
            : td.innerText;
          val = (val || "").trim();
          if (val) {
            out[`Events_${evtIdx}_${colName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_]/g, "")}`] = val;
            rowParts.push(`${colName}: ${val}`);
          }
        });
        if (rowParts.length > 0) {
          eventsList.push(rowParts.join(" | "));
          evtIdx++;
        }
      });
    });

    out["Events_Summary"] = eventsList.join(" ; ");
    return out;
  }

  // 4. Main Execution Loop
  const collectedMissions = [];

  for (let i = 0; i < missionElements.length; i++) {
    const item = missionElements[i];

    item.element.scrollIntoView({ block: "center" });
    item.element.click();
    ["mousedown", "mouseup", "click"].forEach((evt) => {
      item.element.dispatchEvent(new MouseEvent(evt, { bubbles: true, cancelable: true }));
    });
    await sleep(750);

    const tabs = getTabElements();
    const record = {
      Search_Result_Number: i + 1,
      Mission_Sidebar_Label: item.label,
      Mission_Incident_Number: item.incident,
      Total_Flight_Hours: "",
      Total_Mission_Time: "",
      Patient_Age: "",
      Patient_Sex: "",
      Patient_Diagnostic_Category: "",
      Crew_Summary: ""
    };

    // Tab 1: Mission
    if (tabs.mission) {
      const missionPane = await activateTab(tabs.mission);
      if (missionPane) Object.assign(record, extractMissionFields(missionPane));
    }

    // Tab 2: Crew
    if (tabs.crew) {
      const crewPane = await activateTab(tabs.crew);
      if (crewPane) {
        const crewData = extractCrewFields(crewPane);
        record.Crew_Summary = crewData.Crew_Summary || "";
        Object.assign(record, crewData);
      }
    }

    // Tab 3: Patient
    if (tabs.patient) {
      const patientPane = await activateTab(tabs.patient);
      if (patientPane) {
        const ptData = extractPatientFields(patientPane);
        record.Patient_Age = ptData.Patient_Age || "";
        record.Patient_Sex = ptData.Patient_Sex || "";
        record.Patient_Diagnostic_Category = ptData.Patient_Diagnostic_Category || "";
      }
    }

    // Tab 4: Events (Flight hours + timeline milestones)
    if (tabs.events) {
      const eventsPane = await activateTab(tabs.events);
      if (eventsPane) {
        const evData = extractEventsFields(eventsPane);
        if (evData.Total_Flight_Hours) record.Total_Flight_Hours = evData.Total_Flight_Hours;
        if (evData.Total_Mission_Time) record.Total_Mission_Time = evData.Total_Mission_Time;
        Object.assign(record, evData);
      }
    }

    // Log progress directly in console
    console.log(
      `[${i + 1}/${missionElements.length}] ${record.Mission_Incident_Number} | ` +
      `Flight Hours: "${record.Total_Flight_Hours || 'N/A'}", Mission Time: "${record.Total_Mission_Time || 'N/A'}" | ` +
      `Pt: Age="${record.Patient_Age || 'N/A'}", Sex="${record.Patient_Sex || 'N/A'}", Cat="${record.Patient_Diagnostic_Category || 'N/A'}"`
    );

    collectedMissions.push(record);
  }

  // 5. Structure CSV with prioritized columns first
  const primaryCols = [
    "Search_Result_Number",
    "Mission_Sidebar_Label",
    "Mission_Incident_Number",
    "Total_Flight_Hours",
    "Total_Mission_Time",
    "Patient_Age",
    "Patient_Sex",
    "Patient_Diagnostic_Category",
    "Crew_Summary"
  ];

  const allKeys = new Set(primaryCols);
  collectedMissions.forEach((row) => Object.keys(row).forEach((k) => allKeys.add(k)));
  const headers = Array.from(allKeys);

  const csvRows = [headers.join(",")];
  collectedMissions.forEach((row) => {
    const line = headers.map((h) => {
      const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : "";
      return `"${val.replace(/"/g, '""')}"`;
    });
    csvRows.push(line.join(","));
  });

  const blob = new Blob(["\uFEFF" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const dlUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = dlUrl;
  a.download = `hems_missions_final_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(dlUrl);

  console.log(`Scrape finished. All ${collectedMissions.length} missions exported with flight hours.`);
})();
