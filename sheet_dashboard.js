import React, { useState, useMemo } from 'react';
import {
  Activity,
  Clock,
  ShieldAlert,
  HeartPulse,
  User,
  Calendar,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit3,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  ArrowUpDown,
  ExternalLink,
  Moon,
  Stethoscope,
  BarChart3,
  Eye,
  FileText,
  AlertCircle
} from 'lucide-react';

function App({ data, updateItem, deleteItem, insertItem, moveItem, followLink }) {
  // 1. Identify dynamic headers and column indices
  const headerRowObj = useMemo(() => {
    return (
      (data || []).find(
        (d) =>
          Array.isArray(d.row) &&
          (d.row.includes('Mission Type') || d.row.includes('Job Ref') || d.row.includes('Flight Time (h)'))
      ) || null
    );
  }, [data]);

  const headerIndex = headerRowObj ? headerRowObj.index_ : 4;
  const headers = useMemo(() => (headerRowObj ? headerRowObj.row : []), [headerRowObj]);

  const colDate = useMemo(() => headers.indexOf('Date') !== -1 ? headers.indexOf('Date') : 0, [headers]);
  const colJobRef = useMemo(() => headers.indexOf('Job Ref') !== -1 ? headers.indexOf('Job Ref') : 1, [headers]);
  const colMissionType = useMemo(() => headers.indexOf('Mission Type') !== -1 ? headers.indexOf('Mission Type') : 2, [headers]);
  const colAircraftType = useMemo(() => headers.indexOf('Aircraft Type') !== -1 ? headers.indexOf('Aircraft Type') : 3, [headers]);
  const colAircraftReg = useMemo(() => headers.indexOf('Aircraft Reg') !== -1 ? headers.indexOf('Aircraft Reg') : 4, [headers]);
  const colCrew = useMemo(() => headers.indexOf('Crew / Pilot') !== -1 ? headers.indexOf('Crew / Pilot') : 5, [headers]);
  const colDispatch = useMemo(() => headers.indexOf('Dispatch') !== -1 ? headers.indexOf('Dispatch') : 6, [headers]);
  const colOnStation = useMemo(() => headers.indexOf('On Station') !== -1 ? headers.indexOf('On Station') : 7, [headers]);
  const colFlightTime = useMemo(() => headers.indexOf('Flight Time (h)') !== -1 ? headers.indexOf('Flight Time (h)') : 8, [headers]);
  const colNvgTime = useMemo(() => headers.indexOf('NVG Time (h)') !== -1 ? headers.indexOf('NVG Time (h)') : 9, [headers]);
  const colNhi = useMemo(() => headers.indexOf('Patient NHI') !== -1 ? headers.indexOf('Patient NHI') : 10, [headers]);
  const colAcuity = useMemo(() => headers.indexOf('Acuity Status') !== -1 ? headers.indexOf('Acuity Status') : 11, [headers]);
  const colDiagnosis = useMemo(
    () =>
      headers.indexOf('Clinical Presentation / Diagnosis') !== -1
        ? headers.indexOf('Clinical Presentation / Diagnosis')
        : 12,
    [headers]
  );
  const colSkills = useMemo(
    () =>
      headers.indexOf('Key Clinical / Operational Skills') !== -1
        ? headers.indexOf('Key Clinical / Operational Skills')
        : 13,
    [headers]
  );
  const colNotes = useMemo(
    () =>
      headers.indexOf('Clinical Notes & Disposition') !== -1
        ? headers.indexOf('Clinical Notes & Disposition')
        : 14,
    [headers]
  );

  // Extract AppSheet or external link if present in metadata rows
  const appSheetUrl = useMemo(() => {
    let url = null;
    (data || []).forEach((d) => {
      if (d.index_ < headerIndex && Array.isArray(d.row)) {
        d.row.forEach((cell) => {
          if (typeof cell === 'string' && cell.startsWith('http')) {
            url = cell;
          }
        });
      }
    });
    return url;
  }, [data, headerIndex]);

  // Parse encounters list strictly reflecting raw data without synthetic fallbacks
  const encounters = useMemo(() => {
    return (data || [])
      .filter((d) => d.index_ > headerIndex && Array.isArray(d.row) && d.row.length > 0)
      .map((d) => {
        const r = d.row;
        const flightTimeVal = parseFloat(r[colFlightTime]);
        const nvgTimeVal = parseFloat(r[colNvgTime]);
        const dateRaw = r[colDate] ? String(r[colDate]).trim() : '';

        return {
          index_: d.index_,
          dateStr: dateRaw,
          jobRef: r[colJobRef] !== null && r[colJobRef] !== undefined ? String(r[colJobRef]) : '',
          jobRefNum: Number(r[colJobRef]) || 0,
          missionType: r[colMissionType] ? String(r[colMissionType]).trim() : '',
          aircraftType: r[colAircraftType] ? String(r[colAircraftType]).trim() : '',
          aircraftReg: r[colAircraftReg] ? String(r[colAircraftReg]).trim() : '',
          crew: r[colCrew] ? String(r[colCrew]).trim() : '',
          dispatch: r[colDispatch] ? String(r[colDispatch]).trim() : '',
          onStation: r[colOnStation] ? String(r[colOnStation]).trim() : '',
          flightTime: isNaN(flightTimeVal) ? 0 : flightTimeVal,
          nvgTime: isNaN(nvgTimeVal) ? 0 : nvgTimeVal,
          patientNhi: r[colNhi] ? String(r[colNhi]).trim() : '',
          acuity: r[colAcuity] ? String(r[colAcuity]).trim() : '',
          diagnosis: r[colDiagnosis] ? String(r[colDiagnosis]).trim() : '',
          skills: r[colSkills] ? String(r[colSkills]).trim() : '',
          notes: r[colNotes] ? String(r[colNotes]).trim() : '',
          raw: r
        };
      });
  }, [
    data,
    headerIndex,
    colDate,
    colJobRef,
    colMissionType,
    colAircraftType,
    colAircraftReg,
    colCrew,
    colDispatch,
    colOnStation,
    colFlightTime,
    colNvgTime,
    colNhi,
    colAcuity,
    colDiagnosis,
    colSkills,
    colNotes
  ]);

  // UI state
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'logbook' | 'procedures'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAcuity, setSelectedAcuity] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedAircraft, setSelectedAircraft] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedCrew, setSelectedCrew] = useState('ALL');
  const [sortField, setSortField] = useState('date'); // 'date' | 'jobRef' | 'flightTime' | 'nvgTime'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Modals & Drawers
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [editModalItem, setEditModalItem] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState(null);

  // Dynamic KPI calculations strictly aligned with dataset ground truth
  const kpis = useMemo(() => {
    const totalMissions = encounters.length;
    const totalFlightHours = encounters.reduce((acc, curr) => acc + curr.flightTime, 0);
    const totalNvgHours = encounters.reduce((acc, curr) => acc + curr.nvgTime, 0);
    const criticalCases = encounters.filter(
      (e) => e.acuity === 'Status 0' || e.acuity === 'Status 1'
    ).length;

    // Advanced Procedures: strictly records with populated entries in 'Key Clinical / Operational Skills'
    const advProceduresCount = encounters.filter(
      (e) => Boolean(e.skills && e.skills.trim().length > 0)
    ).length;

    const winchMissions = encounters.filter(
      (e) =>
        (e.skills && e.skills.toLowerCase().includes('winch')) ||
        (e.notes && e.notes.toLowerCase().includes('winch')) ||
        (e.diagnosis && e.diagnosis.toLowerCase().includes('winch'))
    ).length;

    return {
      totalMissions,
      totalFlightHours: totalFlightHours.toFixed(1),
      totalNvgHours: totalNvgHours.toFixed(1),
      criticalCases,
      advProceduresCount,
      winchMissions
    };
  }, [encounters]);

  // Unique options for filters
  const uniqueYears = useMemo(() => {
    const set = new Set();
    encounters.forEach((e) => {
      if (e.dateStr && e.dateStr.length >= 4) {
        set.add(e.dateStr.substring(0, 4));
      }
    });
    return Array.from(set).sort().reverse();
  }, [encounters]);

  const uniqueAircraft = useMemo(() => {
    const set = new Set();
    encounters.forEach((e) => {
      if (e.aircraftReg) set.add(e.aircraftReg);
    });
    return Array.from(set).sort();
  }, [encounters]);

  const uniqueCrew = useMemo(() => {
    const set = new Set();
    encounters.forEach((e) => {
      if (e.crew) set.add(e.crew);
    });
    return Array.from(set).sort();
  }, [encounters]);

  // Filtered encounters
  const filteredEncounters = useMemo(() => {
    return encounters.filter((e) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          e.jobRef.toLowerCase().includes(q) ||
          e.patientNhi.toLowerCase().includes(q) ||
          e.diagnosis.toLowerCase().includes(q) ||
          e.skills.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q) ||
          e.crew.toLowerCase().includes(q) ||
          e.aircraftReg.toLowerCase().includes(q) ||
          e.dateStr.toLowerCase().includes(q);
        if (!match) return false;
      }

      if (selectedAcuity !== 'ALL') {
        if (selectedAcuity === 'STAT0_1') {
          if (e.acuity !== 'Status 0' && e.acuity !== 'Status 1') return false;
        } else if (selectedAcuity === 'STAND_DOWN') {
          if (!e.notes.toLowerCase().includes('stand down') && !e.diagnosis.toLowerCase().includes('stand down'))
            return false;
        } else if (e.acuity !== selectedAcuity) {
          return false;
        }
      }

      if (selectedType !== 'ALL') {
        if (selectedType === 'Other') {
          if (['PT', 'PM', 'IHT', 'T'].includes(e.missionType)) return false;
        } else if (e.missionType !== selectedType) {
          return false;
        }
      }

      if (selectedAircraft !== 'ALL') {
        if (selectedAircraft === 'UNASSIGNED') {
          if (e.aircraftReg) return false;
        } else if (e.aircraftReg !== selectedAircraft) {
          return false;
        }
      }

      if (selectedCrew !== 'ALL' && e.crew !== selectedCrew) {
        return false;
      }

      if (selectedYear !== 'ALL' && !e.dateStr.startsWith(selectedYear)) {
        return false;
      }

      return true;
    });
  }, [
    encounters,
    searchQuery,
    selectedAcuity,
    selectedType,
    selectedAircraft,
    selectedCrew,
    selectedYear
  ]);

  const sortedEncounters = useMemo(() => {
    const list = [...filteredEncounters];
    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') {
        cmp = a.dateStr.localeCompare(b.dateStr);
      } else if (sortField === 'jobRef') {
        cmp = a.jobRefNum - b.jobRefNum;
      } else if (sortField === 'flightTime') {
        cmp = a.flightTime - b.flightTime;
      } else if (sortField === 'nvgTime') {
        cmp = a.nvgTime - b.nvgTime;
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredEncounters, sortField, sortOrder]);

  // Paginated encounters
  const totalPages = Math.max(1, Math.ceil(sortedEncounters.length / pageSize));
  const paginatedEncounters = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedEncounters.slice(start, start + pageSize);
  }, [sortedEncounters, currentPage, pageSize]);

  // Analytics Aggregations
  const monthlyData = useMemo(() => {
    const map = {};
    encounters.forEach((e) => {
      if (!e.dateStr || e.dateStr.length < 7) return;
      const monthKey = e.dateStr.substring(0, 7); // "YYYY-MM"
      if (!map[monthKey]) {
        map[monthKey] = { month: monthKey, count: 0, flightHours: 0, nvgHours: 0 };
      }
      map[monthKey].count += 1;
      map[monthKey].flightHours += e.flightTime;
      map[monthKey].nvgHours += e.nvgTime;
    });

    const sortedKeys = Object.keys(map).sort();
    return sortedKeys.map((k) => ({
      ...map[k],
      flightHours: parseFloat(map[k].flightHours.toFixed(1)),
      nvgHours: parseFloat(map[k].nvgHours.toFixed(1))
    }));
  }, [encounters]);

  const missionTypeDistribution = useMemo(() => {
    const map = {};
    encounters.forEach((e) => {
      const t = e.missionType || 'Other';
      map[t] = (map[t] || 0) + 1;
    });
    const total = encounters.length || 1;
    return Object.entries(map).map(([type, count]) => ({
      type,
      count,
      pct: ((count / total) * 100).toFixed(1)
    }));
  }, [encounters]);

  const acuityDistribution = useMemo(() => {
    const map = {
      'Status 0': 0,
      'Status 1': 0,
      'Status 2': 0,
      'Status 3': 0,
      'Status 4': 0,
      Other: 0
    };
    encounters.forEach((e) => {
      if (map[e.acuity] !== undefined) {
        map[e.acuity] += 1;
      } else {
        map['Other'] += 1;
      }
    });
    return map;
  }, [encounters]);

  // Fleet utilization strictly maps actual registered aircraft in the dataset
  const fleetUtilization = useMemo(() => {
    const map = {};
    encounters.forEach((e) => {
      if (!e.aircraftReg) return; // Never attribute unassigned sorties to a real tail number
      const reg = e.aircraftReg;
      if (!map[reg]) {
        map[reg] = { reg, hours: 0, missions: 0 };
      }
      map[reg].hours += e.flightTime;
      map[reg].missions += 1;
    });
    return Object.values(map)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 6);
  }, [encounters]);

  const topCrewList = useMemo(() => {
    const map = {};
    encounters.forEach((e) => {
      if (!e.crew || e.crew.length < 2) return;
      if (!map[e.crew]) {
        map[e.crew] = { name: e.crew, hours: 0, missions: 0 };
      }
      map[e.crew].hours += e.flightTime;
      map[e.crew].missions += 1;
    });
    return Object.values(map)
      .sort((a, b) => b.missions - a.missions)
      .slice(0, 8);
  }, [encounters]);

  // Handler helpers
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getAcuityBadge = (acuity) => {
    switch (acuity) {
      case 'Status 0':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-900 text-white shadow-xs">
            Status 0 · Deceased/Arrest
          </span>
        );
      case 'Status 1':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            Status 1 · Critical / Stat
          </span>
        );
      case 'Status 2':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            Status 2 · Urgent / Serious
          </span>
        );
      case 'Status 3':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            Status 3 · Moderate
          </span>
        );
      case 'Status 4':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
            Status 4 · Minor
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
            {acuity || 'Unassigned'}
          </span>
        );
    }
  };

  const getMissionTypeBadge = (type) => {
    switch (type) {
      case 'PT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            PT (Trauma)
          </span>
        );
      case 'PM':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            PM (Medical)
          </span>
        );
      case 'IHT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            IHT (Transfer)
          </span>
        );
      case 'T':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
            T (Training)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded font-mono text-xs font-medium bg-slate-100 text-slate-700">
            {type || 'Other'}
          </span>
        );
    }
  };

  // Form handling: Save Edit
  const handleSaveEdit = (updatedItem) => {
    const rowArr = new Array(15).fill(undefined);
    rowArr[colDate] = updatedItem.dateStr;
    rowArr[colJobRef] = updatedItem.jobRef ? Number(updatedItem.jobRef) || updatedItem.jobRef : null;
    rowArr[colMissionType] = updatedItem.missionType || null;
    rowArr[colAircraftType] = updatedItem.aircraftType ? updatedItem.aircraftType.trim() : null;
    rowArr[colAircraftReg] = updatedItem.aircraftReg ? updatedItem.aircraftReg.trim() : null;
    rowArr[colCrew] = updatedItem.crew ? updatedItem.crew.trim() : null;
    rowArr[colDispatch] = updatedItem.dispatch || null;
    rowArr[colOnStation] = updatedItem.onStation || null;
    rowArr[colFlightTime] = parseFloat(updatedItem.flightTime) || 0;
    rowArr[colNvgTime] = parseFloat(updatedItem.nvgTime) || 0;
    rowArr[colNhi] = updatedItem.patientNhi ? updatedItem.patientNhi.trim() : null;
    rowArr[colAcuity] = updatedItem.acuity || null;
    rowArr[colDiagnosis] = updatedItem.diagnosis || null;
    rowArr[colSkills] = updatedItem.skills ? updatedItem.skills.trim() : null;
    rowArr[colNotes] = updatedItem.notes ? updatedItem.notes.trim() : null;

    updateItem(updatedItem.index_, rowArr);
    setEditModalItem(null);
  };

  // Form handling: Add Encounter
  const handleCreateEncounter = (newItem) => {
    const rowArr = new Array(15).fill(null);
    rowArr[colDate] = newItem.dateStr || new Date().toISOString().substring(0, 10);
    rowArr[colJobRef] = newItem.jobRef ? Number(newItem.jobRef) || newItem.jobRef : null;
    rowArr[colMissionType] = newItem.missionType || 'PM';
    rowArr[colAircraftType] = newItem.aircraftType ? newItem.aircraftType.trim() : null;
    rowArr[colAircraftReg] = newItem.aircraftReg ? newItem.aircraftReg.trim() : null;
    rowArr[colCrew] = newItem.crew ? newItem.crew.trim() : null;
    rowArr[colDispatch] = newItem.dispatch || null;
    rowArr[colOnStation] = newItem.onStation || null;
    rowArr[colFlightTime] = parseFloat(newItem.flightTime) || 0;
    rowArr[colNvgTime] = parseFloat(newItem.nvgTime) || 0;
    rowArr[colNhi] = newItem.patientNhi ? newItem.patientNhi.trim() : null;
    rowArr[colAcuity] = newItem.acuity || 'Status 3';
    rowArr[colDiagnosis] = newItem.diagnosis || '';
    rowArr[colSkills] = newItem.skills ? newItem.skills.trim() : null;
    rowArr[colNotes] = newItem.notes ? newItem.notes.trim() : null;

    insertItem(undefined, rowArr);
    setIsAddModalOpen(false);
  };

  // Delete handling
  const handleDeleteConfirm = () => {
    if (deleteConfirmIndex !== null) {
      deleteItem(deleteConfirmIndex);
      setDeleteConfirmIndex(null);
      if (detailModalItem && detailModalItem.index_ === deleteConfirmIndex) {
        setDetailModalItem(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-600 text-white rounded-lg shadow-sm">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-bold text-lg sm:text-xl text-slate-900 tracking-tight">
                    AEROMEDICAL CLINICAL LOGBOOK
                  </h1>
                  <span className="hidden sm:inline-block px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded">
                    HEMS RETRIEVAL
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Operational Flight Time, Emergency Interventions & Encounter Registry
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {appSheetUrl && (
                <button
                  onClick={() => followLink(appSheetUrl)}
                  className="hidden md:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
                  title="Open AppSheet Mission Companion"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>AppSheet App</span>
                </button>
              )}
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Log Encounter</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-6 -mb-px border-t border-slate-100">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'overview'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Overview & Telemetry</span>
            </button>
            <button
              onClick={() => setActiveTab('logbook')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'logbook'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Mission Encounter Log ({filteredEncounters.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('procedures')}
              className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center space-x-2 ${
                activeTab === 'procedures'
                  ? 'border-red-600 text-red-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Resuscitation & Stat 0/1 Cases</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* KPI Cards Grid - Directly computed from ground truth */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {/* Card 1: Total Missions */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Missions
              </span>
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{kpis.totalMissions}</span>
              <span className="text-xs text-slate-500 font-medium">sorties logged</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>PT: {encounters.filter((e) => e.missionType === 'PT').length}</span>
              <span>PM: {encounters.filter((e) => e.missionType === 'PM').length}</span>
              <span>IHT: {encounters.filter((e) => e.missionType === 'IHT').length}</span>
            </div>
          </div>

          {/* Card 2: Total Flight Hours */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Flight Time
              </span>
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{kpis.totalFlightHours}</span>
              <span className="text-xs text-slate-500 font-medium">hours</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Avg per mission</span>
              <span className="font-semibold text-slate-700">
                {kpis.totalMissions > 0
                  ? (parseFloat(kpis.totalFlightHours) / kpis.totalMissions).toFixed(1)
                  : 0}
                h
              </span>
            </div>
          </div>

          {/* Card 3: NVG Night Hours */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                NVG Night Hours
              </span>
              <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
                <Moon className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{kpis.totalNvgHours}</span>
              <span className="text-xs text-slate-500 font-medium">night hrs</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Night ops share</span>
              <span className="font-semibold text-slate-700">
                {parseFloat(kpis.totalFlightHours) > 0
                  ? (
                      (parseFloat(kpis.totalNvgHours) / parseFloat(kpis.totalFlightHours)) *
                      100
                    ).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>

          {/* Card 4: Critical Cases (Stat 0/1) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Critical (Stat 0/1)
              </span>
              <div className="p-1.5 bg-red-50 text-red-600 rounded-md">
                <HeartPulse className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-red-600">{kpis.criticalCases}</span>
              <span className="text-xs text-slate-500 font-medium">critical</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Critical Case Rate</span>
              <span className="font-semibold text-red-600">
                {kpis.totalMissions > 0
                  ? ((kpis.criticalCases / kpis.totalMissions) * 100).toFixed(1)
                  : 0}
                %
              </span>
            </div>
          </div>

          {/* Card 5: Advanced Procedures - Strictly reflects non-empty Key Clinical / Operational Skills (66) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Adv. Procedures
              </span>
              <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                <Stethoscope className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-slate-900">{kpis.advProceduresCount}</span>
              <span className="text-xs text-slate-500 font-medium">procedures logged</span>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
              <span>Winch operations</span>
              <span className="font-semibold text-purple-700">{kpis.winchMissions} rescues</span>
            </div>
          </div>
        </div>

        {/* TAB 1: OVERVIEW & TELEMETRY */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Row: Mission Volume Trend & Acuity Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Monthly Missions & Flight Time Trend */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs lg:col-span-2 flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-slate-100 gap-2">
                  <div>
                    <h2 className="font-semibold text-slate-900 text-base flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-red-600" />
                      <span>Monthly Mission Volume & Flight Hours</span>
                    </h2>
                    <p className="text-xs text-slate-500">
                      Encounter volume and cumulative flight duration by calendar month
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 bg-red-600 rounded-xs"></span>
                      <span className="text-slate-600">Flight Hours</span>
                    </span>
                    <span className="flex items-center space-x-1.5">
                      <span className="w-3 h-3 bg-slate-300 rounded-xs"></span>
                      <span className="text-slate-600">Missions Count</span>
                    </span>
                  </div>
                </div>

                {/* Monthly Trend Bars */}
                <div className="mt-4 w-full h-56 relative">
                  {monthlyData.length > 0 ? (
                    <div className="w-full h-full flex flex-col justify-end">
                      <div className="flex-1 w-full flex items-end justify-between gap-1 sm:gap-2 px-2">
                        {monthlyData.slice(-18).map((m) => {
                          const maxHours = Math.max(
                            ...monthlyData.map((d) => d.flightHours),
                            30
                          );
                          const barHeightPct = Math.min(
                            100,
                            Math.max(8, (m.flightHours / maxHours) * 100)
                          );
                          const countHeightPct = Math.min(
                            100,
                            Math.max(6, (m.count / 30) * 100)
                          );

                          return (
                            <div
                              key={m.month}
                              className="flex-1 flex flex-col items-center justify-end h-full group relative"
                            >
                              {/* Tooltip */}
                              <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col bg-slate-900 text-white text-xs rounded px-2.5 py-1.5 z-20 pointer-events-none shadow-lg whitespace-nowrap">
                                <span className="font-bold">{m.month}</span>
                                <span>{m.count} missions</span>
                                <span>{m.flightHours} flight hrs</span>
                                <span>{m.nvgHours} NVG hrs</span>
                              </div>

                              {/* Bars container */}
                              <div className="w-full max-w-[28px] flex items-end justify-center space-x-0.5 h-full">
                                <div
                                  style={{ height: `${countHeightPct}%` }}
                                  className="w-1/2 bg-slate-200 group-hover:bg-slate-300 rounded-t-xs transition-all"
                                ></div>
                                <div
                                  style={{ height: `${barHeightPct}%` }}
                                  className="w-1/2 bg-red-600 group-hover:bg-red-500 rounded-t-xs transition-all"
                                ></div>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono mt-2 truncate w-full text-center">
                                {m.month.substring(5)}/{m.month.substring(2, 4)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 text-sm">
                      No monthly records available
                    </div>
                  )}
                </div>
              </div>

              {/* Acuity Status Breakdown */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
                <div className="pb-3 border-b border-slate-100">
                  <h2 className="font-semibold text-slate-900 text-base flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-red-600" />
                    <span>Acuity Distribution</span>
                  </h2>
                  <p className="text-xs text-slate-500">Patient severity triage classification</p>
                </div>

                <div className="mt-4 space-y-3 flex-1 flex flex-col justify-around">
                  {/* Status 0 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-900"></span>
                        <span>Status 0 (Fatal / Ceased)</span>
                      </span>
                      <span className="font-mono text-slate-600">
                        {acuityDistribution['Status 0'] || 0} (
                        {encounters.length > 0
                          ? (
                              ((acuityDistribution['Status 0'] || 0) / encounters.length) *
                              100
                            ).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-slate-900 h-full rounded-full"
                        style={{
                          width: `${
                            encounters.length > 0
                              ? ((acuityDistribution['Status 0'] || 0) / encounters.length) * 100
                              : 0
                          }%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Status 1 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                        <span>Status 1 (Immediate Threat)</span>
                      </span>
                      <span className="font-mono text-slate-600">
                        {acuityDistribution['Status 1'] || 0} (
                        {encounters.length > 0
                          ? (
                              ((acuityDistribution['Status 1'] || 0) / encounters.length) *
                              100
                            ).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-red-600 h-full rounded-full"
                        style={{
                          width: `${
                            encounters.length > 0
                              ? ((acuityDistribution['Status 1'] || 0) / encounters.length) * 100
                              : 0
                          }%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Status 2 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>Status 2 (Severe / Unstable)</span>
                      </span>
                      <span className="font-mono text-slate-600">
                        {acuityDistribution['Status 2'] || 0} (
                        {encounters.length > 0
                          ? (
                              ((acuityDistribution['Status 2'] || 0) / encounters.length) *
                              100
                            ).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-amber-500 h-full rounded-full"
                        style={{
                          width: `${
                            encounters.length > 0
                              ? ((acuityDistribution['Status 2'] || 0) / encounters.length) * 100
                              : 0
                          }%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Status 3 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                        <span>Status 3 (Moderate / Urgent)</span>
                      </span>
                      <span className="font-mono text-slate-600">
                        {acuityDistribution['Status 3'] || 0} (
                        {encounters.length > 0
                          ? (
                              ((acuityDistribution['Status 3'] || 0) / encounters.length) *
                              100
                            ).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{
                          width: `${
                            encounters.length > 0
                              ? ((acuityDistribution['Status 3'] || 0) / encounters.length) * 100
                              : 0
                          }%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Status 4 */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-800 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
                        <span>Status 4 (Minor / Stable)</span>
                      </span>
                      <span className="font-mono text-slate-600">
                        {acuityDistribution['Status 4'] || 0} (
                        {encounters.length > 0
                          ? (
                              ((acuityDistribution['Status 4'] || 0) / encounters.length) *
                              100
                            ).toFixed(1)
                          : 0}
                        %)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-sky-500 h-full rounded-full"
                        style={{
                          width: `${
                            encounters.length > 0
                              ? ((acuityDistribution['Status 4'] || 0) / encounters.length) * 100
                              : 0
                          }%`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Row: Mission Types, Fleet Utilization, Top Crew */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Mission Type Split */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">Mission Classification</h3>
                  <span className="text-xs text-slate-400">Type ratio</span>
                </div>
                <div className="mt-4 space-y-3">
                  {missionTypeDistribution.map((item) => (
                    <div
                      key={item.type}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100"
                    >
                      <div className="flex items-center space-x-2">
                        {getMissionTypeBadge(item.type)}
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-slate-900">{item.count}</span>
                        <span className="text-xs text-slate-500 ml-1.5">({item.pct}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Aircraft Fleet Usage - strictly real tail registrations */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">Fleet Aircraft Activity</h3>
                  <span className="text-xs text-slate-400">Total hours logged</span>
                </div>
                <div className="mt-4 space-y-3">
                  {fleetUtilization.map((f) => {
                    const maxFleetHours = fleetUtilization[0]?.hours || 1;
                    const pct = Math.round((f.hours / maxFleetHours) * 100);
                    return (
                      <div key={f.reg} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-800 font-mono">{f.reg}</span>
                          <span className="text-slate-600 font-mono">
                            {f.hours.toFixed(1)} hrs ({f.missions} missions)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-indigo-600 h-full rounded-full"
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Top Crew Members */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 text-sm">Lead Crew / Pilots</h3>
                  <span className="text-xs text-slate-400">Sorties logged</span>
                </div>
                <div className="mt-4 divide-y divide-slate-100">
                  {topCrewList.map((c, i) => (
                    <div key={c.name} className="py-2 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold text-[10px]">
                          {i + 1}
                        </span>
                        <span className="font-medium text-slate-800">{c.name}</span>
                      </div>
                      <div className="font-mono text-slate-600">
                        <span className="font-bold text-slate-900">{c.missions}</span> missions ·{' '}
                        {c.hours.toFixed(1)}h
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: INTERACTIVE LOGBOOK TABLE */}
        {activeTab === 'logbook' && (
          <div className="space-y-4">
            {/* Filter & Search Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {/* Search Bar */}
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search by diagnosis, skills, crew, NHI, notes..."
                    className="w-full pl-9 pr-8 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Acuity Filter */}
                <div>
                  <select
                    value={selectedAcuity}
                    onChange={(e) => {
                      setSelectedAcuity(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 font-medium text-slate-700"
                  >
                    <option value="ALL">All Acuity Levels</option>
                    <option value="STAT0_1">Critical (Stat 0 & 1)</option>
                    <option value="Status 0">Status 0 (Fatal/Ceased)</option>
                    <option value="Status 1">Status 1 (Immediate Threat)</option>
                    <option value="Status 2">Status 2 (Serious/Urgent)</option>
                    <option value="Status 3">Status 3 (Moderate)</option>
                    <option value="Status 4">Status 4 (Minor)</option>
                    <option value="STAND_DOWN">Stand Down / Non-Transport</option>
                  </select>
                </div>

                {/* Mission Type Filter */}
                <div>
                  <select
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full py-2 px-3 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-red-500 font-medium text-slate-700"
                  >
                    <option value="ALL">All Mission Types</option>
                    <option value="PT">Primary Trauma (PT)</option>
                    <option value="PM">Primary Medical (PM)</option>
                    <option value="IHT">Inter-Hospital Transfer (IHT)</option>
                    <option value="T">Training (T)</option>
                    <option value="Other">Other / Stand Down</option>
                  </select>
                </div>
              </div>

              {/* Secondary Filter Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Aircraft Reg */}
                  <div className="flex items-center space-x-1.5">
                    <span>Aircraft:</span>
                    <select
                      value={selectedAircraft}
                      onChange={(e) => {
                        setSelectedAircraft(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="py-1 px-2 border border-slate-200 rounded bg-white font-mono text-slate-700"
                    >
                      <option value="ALL">All Fleet</option>
                      {uniqueAircraft.map((reg) => (
                        <option key={reg} value={reg}>
                          {reg}
                        </option>
                      ))}
                      <option value="UNASSIGNED">Unassigned / Unrecorded</option>
                    </select>
                  </div>

                  {/* Year */}
                  <div className="flex items-center space-x-1.5">
                    <span>Year:</span>
                    <select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="py-1 px-2 border border-slate-200 rounded bg-white font-mono text-slate-700"
                    >
                      <option value="ALL">All Years</option>
                      {uniqueYears.map((yr) => (
                        <option key={yr} value={yr}>
                          {yr}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Crew */}
                  <div className="flex items-center space-x-1.5">
                    <span>Crew:</span>
                    <select
                      value={selectedCrew}
                      onChange={(e) => {
                        setSelectedCrew(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="py-1 px-2 border border-slate-200 rounded bg-white text-slate-700 max-w-[140px]"
                    >
                      <option value="ALL">All Crew</option>
                      {uniqueCrew.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span>
                    Showing {sortedEncounters.length} of {encounters.length} records
                  </span>
                  {(searchQuery ||
                    selectedAcuity !== 'ALL' ||
                    selectedType !== 'ALL' ||
                    selectedAircraft !== 'ALL' ||
                    selectedYear !== 'ALL' ||
                    selectedCrew !== 'ALL') && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedAcuity('ALL');
                        setSelectedType('ALL');
                        setSelectedAircraft('ALL');
                        setSelectedYear('ALL');
                        setSelectedCrew('ALL');
                        setCurrentPage(1);
                      }}
                      className="text-red-600 hover:text-red-700 font-semibold underline ml-2"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Encounters Data Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                    <tr>
                      <th
                        scope="col"
                        className="py-3 px-3.5 cursor-pointer hover:bg-slate-100 transition select-none"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Date</span>
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="py-3 px-3 cursor-pointer hover:bg-slate-100 transition select-none"
                        onClick={() => handleSort('jobRef')}
                      >
                        <div className="flex items-center space-x-1">
                          <span>Job Ref</span>
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </th>
                      <th scope="col" className="py-3 px-3">
                        Type
                      </th>
                      <th scope="col" className="py-3 px-3">
                        Acuity
                      </th>
                      <th scope="col" className="py-3 px-4">
                        Clinical Presentation / Diagnosis
                      </th>
                      <th scope="col" className="py-3 px-3">
                        Key Skills / Procedures
                      </th>
                      <th scope="col" className="py-3 px-3">
                        Crew
                      </th>
                      <th scope="col" className="py-3 px-2">
                        Aircraft
                      </th>
                      <th
                        scope="col"
                        className="py-3 px-3 text-right cursor-pointer hover:bg-slate-100 transition select-none"
                        onClick={() => handleSort('flightTime')}
                      >
                        <div className="flex items-center justify-end space-x-1">
                          <span>Flight (h)</span>
                          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      </th>
                      <th scope="col" className="py-3 px-3 text-center">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {paginatedEncounters.length > 0 ? (
                      paginatedEncounters.map((item) => (
                        <tr
                          key={item.index_}
                          className="hover:bg-slate-50/80 transition-colors group"
                        >
                          {/* Date */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-slate-800">
                            {item.dateStr || '—'}
                          </td>

                          {/* Job Ref */}
                          <td className="py-2.5 px-3 whitespace-nowrap font-mono text-slate-600 font-medium">
                            {item.jobRef ? `#${item.jobRef}` : '—'}
                          </td>

                          {/* Mission Type */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {getMissionTypeBadge(item.missionType)}
                          </td>

                          {/* Acuity Status */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {getAcuityBadge(item.acuity)}
                          </td>

                          {/* Diagnosis */}
                          <td className="py-2.5 px-4 font-medium text-slate-900 max-w-xs truncate">
                            <span title={item.diagnosis}>{item.diagnosis || '—'}</span>
                            {item.patientNhi && (
                              <span className="ml-2 px-1.5 py-0.2 bg-slate-100 font-mono text-[10px] text-slate-600 rounded">
                                {item.patientNhi}
                              </span>
                            )}
                          </td>

                          {/* Key Skills */}
                          <td className="py-2.5 px-3 text-slate-700 max-w-[170px] truncate">
                            {item.skills ? (
                              <span
                                title={item.skills}
                                className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100"
                              >
                                {item.skills}
                              </span>
                            ) : (
                              <span className="text-slate-400 font-sans">—</span>
                            )}
                          </td>

                          {/* Crew */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-slate-700">
                            {item.crew || <span className="text-slate-400 font-sans">—</span>}
                          </td>

                          {/* Aircraft Reg */}
                          <td className="py-2.5 px-2 whitespace-nowrap font-mono text-slate-600 text-[11px]">
                            {item.aircraftReg ? (
                              item.aircraftReg
                            ) : (
                              <span className="text-slate-400 font-sans">—</span>
                            )}
                          </td>

                          {/* Flight Time & NVG */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-right font-mono">
                            <span className="font-bold text-slate-900">
                              {item.flightTime.toFixed(1)}h
                            </span>
                            {item.nvgTime > 0 && (
                              <span className="block text-[10px] text-indigo-600 font-medium">
                                NVG {item.nvgTime.toFixed(1)}h
                              </span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-2.5 px-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => setDetailModalItem(item)}
                                className="p-1 rounded text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition"
                                title="View Encounter Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditModalItem(item)}
                                className="p-1 rounded text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition"
                                title="Edit Record"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmIndex(item.index_)}
                                className="p-1 rounded text-slate-500 hover:text-red-600 hover:bg-red-50 transition"
                                title="Delete Record"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="py-12 text-center text-slate-400">
                          <div className="flex flex-col items-center justify-center space-y-2">
                            <Search className="w-8 h-8 text-slate-300" />
                            <p className="font-medium text-slate-600">No mission encounters found</p>
                            <p className="text-xs text-slate-400">
                              Try clearing filters or adjusting your search term.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="border border-slate-200 rounded px-2 py-1 bg-white font-medium text-slate-700"
                  >
                    <option value={15}>15</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                  <span>
                    Showing {paginatedEncounters.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}{' '}
                    - {Math.min(currentPage * pageSize, sortedEncounters.length)} of{' '}
                    {sortedEncounters.length}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-2 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: RESUSCITATION & CRITICAL CASES */}
        {activeTab === 'procedures' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <HeartPulse className="w-5 h-5 text-red-600" />
                    <span>Resuscitation, Advanced Interventions & High-Acuity Sorties</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Dedicated registry of Status 0, Status 1 emergencies, and complex surgical / critical procedures.
                  </p>
                </div>
                <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 font-bold rounded-full text-xs">
                  {
                    encounters.filter(
                      (e) =>
                        e.acuity === 'Status 0' ||
                        e.acuity === 'Status 1' ||
                        (e.skills && e.skills.trim().length > 0)
                    ).length
                  }{' '}
                  High Acuity Cases
                </span>
              </div>

              {/* Critical Case Highlights Cards */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {encounters
                  .filter(
                    (e) =>
                      e.acuity === 'Status 0' ||
                      e.acuity === 'Status 1' ||
                      (e.skills && e.skills.trim().length > 0)
                  )
                  .map((item) => (
                    <div
                      key={item.index_}
                      className="bg-slate-50/70 rounded-xl border border-slate-200 p-4 flex flex-col justify-between hover:border-red-300 hover:shadow-xs transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <span className="text-xs font-mono text-slate-500">{item.dateStr}</span>
                          <div>{getAcuityBadge(item.acuity)}</div>
                        </div>

                        <div className="font-bold text-slate-900 text-sm">{item.diagnosis}</div>

                        {item.patientNhi && (
                          <div className="text-xs font-mono text-slate-500">
                            NHI:{' '}
                            <span className="font-bold text-slate-700">{item.patientNhi}</span> ·
                            Job #{item.jobRef || '—'}
                          </div>
                        )}

                        {item.skills && (
                          <div className="p-2 bg-white rounded-lg border border-purple-200 text-xs text-slate-800">
                            <span className="font-semibold text-purple-700 block text-[11px] uppercase tracking-wider mb-0.5">
                              Clinical Skills / Procedures:
                            </span>
                            {item.skills}
                          </div>
                        )}

                        {item.notes && (
                          <p className="text-xs text-slate-600 italic line-clamp-2">
                            "{item.notes}"
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 font-mono">
                        <span>
                          {[item.crew, item.aircraftReg].filter(Boolean).join(' · ') || '—'}
                        </span>
                        <button
                          onClick={() => setDetailModalItem(item)}
                          className="text-red-600 font-semibold hover:underline flex items-center space-x-1"
                        >
                          <span>Full Detail</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* DETAIL MODAL DRAWER */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-red-400" />
                <h3 className="font-bold text-base">
                  Mission Record: #{detailModalItem.jobRef || detailModalItem.index_}
                </h3>
              </div>
              <button
                onClick={() => setDetailModalItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {/* Top Banner with Acuity & Type */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Triage Acuity:</span>
                  {getAcuityBadge(detailModalItem.acuity)}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 uppercase font-semibold">Type:</span>
                  {getMissionTypeBadge(detailModalItem.missionType)}
                </div>
                <div className="text-xs font-mono text-slate-600">
                  Date: <span className="font-bold text-slate-900">{detailModalItem.dateStr || '—'}</span>
                </div>
              </div>

              {/* Diagnosis / Presentation */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Clinical Presentation / Diagnosis
                </h4>
                <div className="p-3 bg-white rounded-lg border border-slate-200 font-semibold text-slate-900 text-base">
                  {detailModalItem.diagnosis || 'No presentation recorded'}
                </div>
              </div>

              {/* Patient NHI & Flight Timings */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Patient NHI</span>
                  <span className="font-mono font-bold text-slate-900">
                    {detailModalItem.patientNhi || 'None'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Flight Time</span>
                  <span className="font-mono font-bold text-slate-900">
                    {detailModalItem.flightTime.toFixed(1)} hrs
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">NVG Night</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {detailModalItem.nvgTime.toFixed(1)} hrs
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Job Reference</span>
                  <span className="font-mono font-bold text-slate-900">
                    {detailModalItem.jobRef ? `#${detailModalItem.jobRef}` : '—'}
                  </span>
                </div>
              </div>

              {/* Operational Dispatch / Times */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Dispatch Time</span>
                  <span className="font-mono font-medium text-slate-900">
                    {detailModalItem.dispatch || '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">On Station</span>
                  <span className="font-mono font-medium text-slate-900">
                    {detailModalItem.onStation || '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Aircraft</span>
                  <span className="font-mono font-medium text-slate-900">
                    {[detailModalItem.aircraftType, detailModalItem.aircraftReg].filter(Boolean).join(' · ') || '—'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-xs text-slate-500 block">Pilot / Crew</span>
                  <span className="font-medium text-slate-900">{detailModalItem.crew || '—'}</span>
                </div>
              </div>

              {/* Key Skills */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Key Clinical & Operational Skills
                </h4>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 font-mono text-xs">
                  {detailModalItem.skills || 'Standard monitoring / care protocol'}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Clinical Notes & Disposition
                </h4>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-800 text-xs leading-relaxed">
                  {detailModalItem.notes || 'No operational notes logged.'}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => {
                  const toEdit = detailModalItem;
                  setDetailModalItem(null);
                  setEditModalItem(toEdit);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-xs flex items-center space-x-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Encounter</span>
              </button>
              <button
                onClick={() => setDetailModalItem(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 rounded-lg hover:bg-slate-900 shadow-xs"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModalItem && (
        <EditEncounterModal
          item={editModalItem}
          onClose={() => setEditModalItem(null)}
          onSave={handleSaveEdit}
          uniqueAircraft={uniqueAircraft}
        />
      )}

      {/* ADD NEW ENCOUNTER MODAL */}
      {isAddModalOpen && (
        <AddEncounterModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleCreateEncounter}
          uniqueAircraft={uniqueAircraft}
        />
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <AlertCircle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-base text-slate-900">Delete Encounter Record?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently remove this clinical mission from the logbook?
              This mutation will synchronize directly back to the database.
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setDeleteConfirmIndex(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Add Encounter Modal
function AddEncounterModal({ onClose, onSave, uniqueAircraft }) {
  const [dateStr, setDateStr] = useState(new Date().toISOString().substring(0, 10));
  const [jobRef, setJobRef] = useState('');
  const [missionType, setMissionType] = useState('PM');
  const [aircraftType, setAircraftType] = useState('');
  const [aircraftReg, setAircraftReg] = useState('');
  const [crew, setCrew] = useState('');
  const [dispatch, setDispatch] = useState('');
  const [onStation, setOnStation] = useState('');
  const [flightTime, setFlightTime] = useState('1.5');
  const [nvgTime, setNvgTime] = useState('0.0');
  const [patientNhi, setPatientNhi] = useState('');
  const [acuity, setAcuity] = useState('Status 3');
  const [diagnosis, setDiagnosis] = useState('');
  const [skills, setSkills] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      return;
    }
    onSave({
      dateStr,
      jobRef,
      missionType,
      aircraftType,
      aircraftReg,
      crew,
      dispatch,
      onStation,
      flightTime,
      nvgTime,
      patientNhi,
      acuity,
      diagnosis,
      skills,
      notes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 bg-red-600 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <h3 className="font-bold text-base">Log New Clinical Mission</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Date & Job Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mission Date *</label>
              <input
                type="date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Job Reference #</label>
              <input
                type="number"
                value={jobRef}
                onChange={(e) => setJobRef(e.target.value)}
                placeholder="e.g. 245"
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mission Type</label>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
              >
                <option value="PM">Primary Medical (PM)</option>
                <option value="PT">Primary Trauma (PT)</option>
                <option value="IHT">Inter-Hospital Transfer (IHT)</option>
                <option value="T">Training (T)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Acuity & NHI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Acuity Status *</label>
              <select
                value={acuity}
                onChange={(e) => setAcuity(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-semibold text-slate-800"
              >
                <option value="Status 1">Status 1 · Critical / Immediate Threat</option>
                <option value="Status 2">Status 2 · Urgent / Severe</option>
                <option value="Status 3">Status 3 · Moderate</option>
                <option value="Status 4">Status 4 · Minor</option>
                <option value="Status 0">Status 0 · Fatal / Resuscitation Ceased</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Patient NHI</label>
              <input
                type="text"
                value={patientNhi}
                onChange={(e) => setPatientNhi(e.target.value.toUpperCase())}
                placeholder="e.g. UKB6199"
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono uppercase"
              />
            </div>
          </div>

          {/* Row 3: Diagnosis */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Clinical Presentation / Diagnosis *
            </label>
            <input
              type="text"
              required
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Acute STEMI, Tension Pneumothorax, Fracture Dislocation"
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
            />
          </div>

          {/* Row 4: Aircraft & Crew */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Aircraft Type</label>
              <input
                type="text"
                value={aircraftType}
                onChange={(e) => setAircraftType(e.target.value)}
                placeholder="Leave blank if unrecorded"
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Aircraft Reg</label>
              <input
                type="text"
                value={aircraftReg}
                onChange={(e) => setAircraftReg(e.target.value.toUpperCase())}
                placeholder="e.g. ZK-HUP"
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pilot / Crew</label>
              <input
                type="text"
                value={crew}
                onChange={(e) => setCrew(e.target.value)}
                placeholder="Crew member name"
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
              />
            </div>
          </div>

          {/* Row 5: Flight & NVG Time */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Dispatch Time</label>
              <input
                type="text"
                value={dispatch}
                onChange={(e) => setDispatch(e.target.value)}
                placeholder="HH:MM:SS"
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">On Station Time</label>
              <input
                type="text"
                value={onStation}
                onChange={(e) => setOnStation(e.target.value)}
                placeholder="HH:MM:SS"
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Flight Time (h)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={flightTime}
                onChange={(e) => setFlightTime(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">NVG Time (h)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={nvgTime}
                onChange={(e) => setNvgTime(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
          </div>

          {/* Row 6: Skills */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Key Clinical / Operational Skills
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. RSI, Endotracheal intubation, Alpine Winch, Metaraminol"
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
            />
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Clinical Notes & Disposition
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Summary of patient management and handoff"
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
            >
              Add Encounter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponent: Edit Encounter Modal
function EditEncounterModal({ item, onClose, onSave, uniqueAircraft }) {
  const [dateStr, setDateStr] = useState(item.dateStr || '');
  const [jobRef, setJobRef] = useState(item.jobRef || '');
  const [missionType, setMissionType] = useState(item.missionType || 'PM');
  const [aircraftType, setAircraftType] = useState(item.aircraftType || '');
  const [aircraftReg, setAircraftReg] = useState(item.aircraftReg || '');
  const [crew, setCrew] = useState(item.crew || '');
  const [dispatch, setDispatch] = useState(item.dispatch || '');
  const [onStation, setOnStation] = useState(item.onStation || '');
  const [flightTime, setFlightTime] = useState(item.flightTime.toString());
  const [nvgTime, setNvgTime] = useState(item.nvgTime.toString());
  const [patientNhi, setPatientNhi] = useState(item.patientNhi || '');
  const [acuity, setAcuity] = useState(item.acuity || 'Status 3');
  const [diagnosis, setDiagnosis] = useState(item.diagnosis || '');
  const [skills, setSkills] = useState(item.skills || '');
  const [notes, setNotes] = useState(item.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      index_: item.index_,
      dateStr,
      jobRef,
      missionType,
      aircraftType,
      aircraftReg,
      crew,
      dispatch,
      onStation,
      flightTime,
      nvgTime,
      patientNhi,
      acuity,
      diagnosis,
      skills,
      notes
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-base">Edit Mission Encounter #{item.jobRef || item.index_}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Date & Job Ref */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Date</label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Job Reference</label>
              <input
                type="text"
                value={jobRef}
                onChange={(e) => setJobRef(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Mission Type</label>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
              >
                <option value="PM">Primary Medical (PM)</option>
                <option value="PT">Primary Trauma (PT)</option>
                <option value="IHT">Inter-Hospital Transfer (IHT)</option>
                <option value="T">Training (T)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Acuity & NHI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Acuity Status</label>
              <select
                value={acuity}
                onChange={(e) => setAcuity(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-semibold"
              >
                <option value="Status 1">Status 1 · Critical / Immediate Threat</option>
                <option value="Status 2">Status 2 · Urgent / Severe</option>
                <option value="Status 3">Status 3 · Moderate</option>
                <option value="Status 4">Status 4 · Minor</option>
                <option value="Status 0">Status 0 · Fatal / Resuscitation Ceased</option>
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Patient NHI</label>
              <input
                type="text"
                value={patientNhi}
                onChange={(e) => setPatientNhi(e.target.value.toUpperCase())}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono uppercase"
              />
            </div>
          </div>

          {/* Row 3: Diagnosis */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Clinical Presentation / Diagnosis
            </label>
            <input
              type="text"
              required
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-medium"
            />
          </div>

          {/* Row 4: Aircraft & Crew */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Aircraft Type</label>
              <input
                type="text"
                value={aircraftType}
                onChange={(e) => setAircraftType(e.target.value)}
                placeholder="Leave blank if unrecorded"
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Aircraft Reg</label>
              <input
                type="text"
                value={aircraftReg}
                onChange={(e) => setAircraftReg(e.target.value.toUpperCase())}
                placeholder="Leave blank if unrecorded"
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Pilot / Crew</label>
              <input
                type="text"
                value={crew}
                onChange={(e) => setCrew(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
              />
            </div>
          </div>

          {/* Row 5: Flight & NVG Time */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Dispatch Time</label>
              <input
                type="text"
                value={dispatch}
                onChange={(e) => setDispatch(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">On Station Time</label>
              <input
                type="text"
                value={onStation}
                onChange={(e) => setOnStation(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Flight Time (h)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={flightTime}
                onChange={(e) => setFlightTime(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">NVG Time (h)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={nvgTime}
                onChange={(e) => setNvgTime(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 font-mono"
              />
            </div>
          </div>

          {/* Row 6: Skills */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Key Clinical / Operational Skills
            </label>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
            />
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Clinical Notes & Disposition
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-black rounded-lg shadow-sm"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}