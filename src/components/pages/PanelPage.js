import { React, useState, useMemo, useEffect } from "react";
import {
  Card, Button, Form, Row, Col, Table, Badge, Modal, Container, Collapse, Alert, Spinner, Pagination
} from "react-bootstrap";
import { Shield, Award, Clock, Settings, Trophy, Users, Minus, Plus, Filter, ChevronDown, ChevronUp, FileText, AlertTriangle, Edit2, Edit, Trash2, Info } from "lucide-react";
import { jednostkiListAll } from "../../services/jednostkiList.mjs";
import { zastepyListAll } from "../../services/zastepyList.mjs";
import { punktacjaListAll } from "../../services/punktacjaList.mjs";
import { useAuth } from "../../AuthContext";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc , getDoc, setDoc} from "firebase/firestore";
import { app } from "../../firebaseConfig";
import "./PanelPage.css";

import { getMessaging, getToken, onMessage, deleteToken} from "firebase/messaging";
import { arrayUnion, arrayRemove , deleteDoc} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { toast } from "react-toastify";

import { addPunktacjaEntry } from "../../services/addPunktacjaEntry";

const VAPID_KEY = "BJEDKEq906Kcu6wrniH5ct2lCxQiFueGKZ5DAAqTwKBsdEEBU2OOLn0FwANsqsKgfz5R1yJcFQibQ1Wk-2kpNxk"; 

const NAV = [
    { key: "team", label: "Moja drużyna", icon: <Users size={18} className="me-2" /> },
    { key: "history", label: "Historia wpisów", icon: <FileText size={18} className="me-2" /> },
    // { key: "settings", label: "Ustawienia", icon: <Settings size={18} className="me-2" /> }, // <- usuń z tej pozycji
  ];

  // Dodaj sekcję Audyt dla audytora
  const NAV_AUDIT = { key: "audit", label: "Audyt punktacji", icon: <AlertTriangle size={18} className="me-2" /> };

  // Dodaj nową pozycję do menu tylko dla adminów
  const NAV_ADMIN = { key: "admin", label: "Administracja", icon: <Shield size={18} className="me-2" /> };

  // Dodaj ustawienia jako ostatni element
  const NAV_SETTINGS = { key: "settings", label: "Ustawienia", icon: <Settings size={18} className="me-2" /> };

// Pomocnicza funkcja do formatu miesiąca
function getMonthLabelFromKey(key) {
  if (!key || key.length !== 6) return "brak";
  const year = key.slice(0, 4);
  const m = parseInt(key.slice(4, 6), 10) - 1;
  const labels = [
    "styczeń", "luty", "marzec", "kwiecień", "maj", "czerwiec",
    "lipiec", "sierpień", "wrzesień", "październik", "listopad", "grudzień"
  ];
  return `${labels[m]} ${year}`;
}

// Dodaj styl dla darkmode
const darkModeStyles = {
  background: "#18181b",
  color: "#e5e7eb",
};
const darkCardStyle = {
  background: "#232326",
  color: "#e5e7eb",
  borderColor: "#333",
};
const darkTableStyle = {
  background: "#232326",
  color: "#e5e7eb",
  borderColor: "#333",
};
const darkTextStyle = {
  color: "#e5e7eb"
};

export default function PanelPage() {
  const [tab, setTab] = useState("team");
  const [addScoutId, setAddScoutId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRequest, setEditRequest] = useState("");
  const [editSent, setEditSent] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showScoutInfoModal, setShowScoutInfoModal] = useState(false);
  const [scoutInfoData, setScoutInfoData] = useState(null);
  const [showCatDesc, setShowCatDesc] = useState(false);
  const [catDescHtml, setCatDescHtml] = useState("");
  const [catDescTitle, setCatDescTitle] = useState("");
  const [showEditEntryModal, setShowEditEntryModal] = useState(false);
  const [editEntryData, setEditEntryData] = useState(null);
  const [editEntrySuccess, setEditEntrySuccess] = useState(false);
  const [showDeleteEntryModal, setShowDeleteEntryModal] = useState(false);
  const [deleteEntryData, setDeleteEntryData] = useState(null);
  const [deleteEntrySuccess, setDeleteEntrySuccess] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notesHtml, setNotesHtml] = useState("");
  const [notesTitle, setNotesTitle] = useState("");
  const { user, loading: authLoading } = useAuth();
  const [userWeb, setUserWeb] = useState(null);
  const [userWebLoading, setUserWebLoading] = useState(true);
  const [userWebError, setUserWebError] = useState(null);
  const [addCategoryId, setAddCategoryId] = useState("");
  const [addScoutPersonId, setAddScoutPersonId] = useState("");
  const [addPoints, setAddPoints] = useState("");
  const [addMonth, setAddMonth] = useState("");
  const [scoringCategories, setScoringCategories] = useState([]);
  const [addNotes, setAddNotes] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editScoutId, setEditScoutId] = useState("");
  const [editScoutPersonId, setEditScoutPersonId] = useState("");
  const [editPoints, setEditPoints] = useState("");
  const [editMonth, setEditMonth] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [configSettings, setConfigSettings] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalText, setInfoModalText] = useState("");
  const [infoModalVersion, setInfoModalVersion] = useState("");
  const [infoModalToggle, setInfoModalToggle] = useState(false);
  
    // Bulk selection / bulk actions for history
  const [selectedHistoryIds, setSelectedHistoryIds] = useState(new Set());
  const [selectAllPage, setSelectAllPage] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditMonth, setBulkEditMonth] = useState("");
  const [bulkEditNotes, setBulkEditNotes] = useState("");
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

   // Ustawienie: wyświetlaj przyciski akcji masowych w historii (domyślnie wyłączone)
 const [enableBulkActionsInHistory, setEnableBulkActionsInHistory] = useState(() => {
    const stored = localStorage.getItem("enableBulkActionsInHistory");
    return stored === "true" ? true : false;
  });
  function handleEnableBulkActionsToggle(val) {
    setEnableBulkActionsInHistory(val);
    localStorage.setItem("enableBulkActionsInHistory", val ? "true" : "false");
    if (!val) {
      // wyczyść zaznaczenia gdy wyłączone
      setSelectedHistoryIds(new Set());
      setSelectAllPage(false);
    }
  }

  function toggleSelectHistory(id) {
    setSelectedHistoryIds(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  }

  function handleSelectAllVisible(visibleIds) {
    setSelectedHistoryIds(prev => {
      const s = new Set(prev);
      const allSelected = visibleIds.every(id => s.has(id));
      if (allSelected) {
        // unselect visible
        visibleIds.forEach(id => s.delete(id));
        setSelectAllPage(false);
      } else {
        // select visible
        visibleIds.forEach(id => s.add(id));
        setSelectAllPage(true);
      }
      return s;
    });
  }

  async function handleBulkDeleteConfirm() {
    if (selectedHistoryIds.size === 0) return;
    if (!window.confirm(`Usunąć ${selectedHistoryIds.size} zaznaczonych wpisów? Ta operacja jest nieodwracalna.`)) return;
    setBulkActionLoading(true);
    try {
      const ids = Array.from(selectedHistoryIds);
      await Promise.all(ids.map(id => deleteDoc(doc(db, "Punktacja", id))));
      toast.success(`Usunięto ${ids.length} wpisów.`);
      setSelectedHistoryIds(new Set());
      // odśwież dane
      setPunktacjeLoading(true);
      const data = await punktacjaListAll();
      setPunktacje(data);
      setPunktacjeLoading(false);
    } catch (err) {
      console.error("Błąd kasowania wielu wpisów:", err);
      alert("Błąd kasowania wpisów: " + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  }

  async function handleBulkEditSubmit(e) {
    e.preventDefault();
    if (selectedHistoryIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const updates = {};
      if (bulkEditMonth) updates.miesiac = bulkEditMonth;
      if (bulkEditNotes) updates.scoreInfo = bulkEditNotes;

      const ids = Array.from(selectedHistoryIds);
      await Promise.all(ids.map(id => updateDoc(doc(db, "Punktacja", id), updates)));
      toast.success(`Zaktualizowano ${ids.length} wpisów.`);
      setSelectedHistoryIds(new Set());
      setShowBulkEditModal(false);
      setBulkEditMonth("");
      setBulkEditNotes("");
      // odśwież dane
      setPunktacjeLoading(true);
      const data = await punktacjaListAll();
      setPunktacje(data);
      setPunktacjeLoading(false);
    } catch (err) {
      console.error("Błąd masowej edycji:", err);
      alert("Błąd masowej edycji: " + err.message);
    } finally {
      setBulkActionLoading(false);
    }
  }

  // Pobierz dane z config (id: zzzzzzzzzzzzzzzzzzzt)
  useEffect(() => {
    const db = getFirestore(app);
    getDoc(doc(db, "config", "zzzzzzzzzzzzzzzzzzzt")).then(snap => {
      if (snap.exists()) {
        const { settingsText, settingsValue, settingsToggle} = snap.data();
        setInfoModalText(settingsText || "");
        setInfoModalVersion(settingsValue || "");
        setInfoModalToggle(settingsToggle);
        // Sprawdź w localStorage czy modal był ukryty dla tej wersji
        const hiddenVersion = localStorage.getItem("panelInfoModalHiddenVersion");
        if (settingsValue && hiddenVersion !== settingsValue) {
          setShowInfoModal(true);
        }
      }
    });
  }, []);

  // Funkcja obsługi "Nie pokazuj więcej"
  function handleHideInfoModal() {
    localStorage.setItem("panelInfoModalHiddenVersion", infoModalVersion);
    setShowInfoModal(false);
  }
  // Dodaj stan do obsługi obecności harcerzy w modalu zbiórki
  const [meetingPresence, setMeetingPresence] = useState([]);

  // Funkcja do obsługi zaznaczania obecności
  function handleMeetingPresenceChange(harcerzId) {
    setMeetingPresence(prev => {
      if (prev.includes(harcerzId)) {
        return prev.filter(id => id !== harcerzId);
      } else {
        // Pozwól maksymalnie 7 harcerzy
        if (prev.length >= 7) return prev;
        return [...prev, harcerzId];
      }
    });
  }

  // Funkcja do obsługi wysłania formularza zbiórki
  async function handleAddMeetingSubmit(e) {
    e.preventDefault();
    const selectedScoutTeam = zastepy.find(z => z.id === addScoutId);
    const meetingCat = scoringCategories.find(cat => cat.scoringKey === "obecnosc");
    if (!selectedScoutTeam || !meetingCat) return;

    try {
      for (const harcerzId of meetingPresence) {
        const harcerz = selectedScoutTeam.harcerze.find(h => h.id === harcerzId);
        await addPunktacjaEntry({
          selectedCategory: meetingCat,
          selectedScoutTeam,
          points: 1,
          month: addMonth,
          userEmail: user.email,
          notes: addNotes,
          selectedScoutPerson: harcerz,
        });
      }
      setShowAddMeetingModal(false);
      setMeetingPresence([]);
      setAddMonth("");
      setAddNotes("");
      setPunktacjeLoading(true);
      punktacjaListAll().then((data) => {
        setPunktacje(data);
        setPunktacjeLoading(false);
      });
      toast.success("Dodano obecność na zbiórce!");
    } catch (err) {
      alert("Błąd dodawania obecności: " + err.message);
      console.error("Błąd dodawania obecności:", err);
    }
  }

  // Dodaj funkcję do resetowania formularza zbiórki
  function resetMeetingForm() {
    setMeetingPresence([]);
    setAddMonth("");
    setAddNotes("");
  }

  // Dodaj stany dla osobnych modali:
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [showAddTripModal, setShowAddTripModal] = useState(false);
  const [showAddMeetingModal, setShowAddMeetingModal] = useState(false);
  const [showAddCeremonyModal, setShowAddCeremonyModal] = useState(false);
  const [showAddSingleModal, setShowAddSingleModal] = useState(false);

  // Formularz wnioskowania o dostęp
  const [requestUnitId, setRequestUnitId] = useState("");
  const [requestRole, setRequestRole] = useState("");
  const [requestOtherRole, setRequestOtherRole] = useState("");
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  // Responsive helpers
  const isMobile = typeof window !== "undefined" ? window.innerWidth < 768 : false;
  const isDesktopWide = typeof window !== "undefined" ? window.innerWidth >= 992 : false;

  // Powiadomienia push
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const messaging = getMessaging(app);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // store how many entries to add per ceremony type (0..4)
  const [ceremonyCounts, setCeremonyCounts] = useState({
    proporzec: 0,
    mundur: 0,
    dodatkowa: 0,
  });
  const ceremonyMonth = addMonth;
  const ceremonyNotes = addNotes;

  function handleCeremonyCountChange(type, value) {
    const v = Math.max(0, Math.min(6, Number(value) || 0));
    setCeremonyCounts(prev => ({ ...prev, [type]: v }));
  }

  
  // Funkcja obsługi dodania obrzędowości (bez przypisywania do pojedynczych harcerzy)
  async function handleAddCeremonySubmit(e) {
    e.preventDefault();
    const selectedScoutTeam = zastepy.find(z => z.id === addScoutId);
    const obrzedCat = scoringCategories.find(cat => cat.scoringKey === "ceremony" || cat.scoringKey === "obrzedowosc");
    if (!selectedScoutTeam || !obrzedCat) return;

    const types = [
      { key: "proporzec", label: "Proporzec" },
      { key: "mundur", label: "Oznaczenie na mundurze" },
      { key: "dodatkowa", label: "Dodatkowa obrzędowość" },
    ];

    try {
      for (const t of types) {
        const count = ceremonyCounts[t.key] || 0;
        if (count <= 0) continue;
        // dodaj `count` wpisów przypisanych do zastępu (bez selectedScoutPerson)
        for (let i = 0; i < count; i++) {
          const notesWithType = `${ceremonyNotes || ""}${ceremonyNotes ? " — " : ""}${t.label}`;
          await addPunktacjaEntry({
            selectedCategory: obrzedCat,
            selectedScoutTeam,
            points: 1,
            month: ceremonyMonth,
            userEmail: user.email,
            notes: notesWithType,
            // selectedScoutPerson omitted on purpose
          });
        }
      }

      setShowAddCeremonyModal(false);
      setCeremonyCounts({ proporzec: 0, mundur: 0, dodatkowa: 0 });
      setAddMonth("");
      setAddNotes("");
      setPunktacjeLoading(true);
      punktacjaListAll().then((data) => {
        setPunktacje(data);
        setPunktacjeLoading(false);
      });
      toast.success("Dodano obrzędowość!");
    } catch (err) {
      alert("Błąd dodawania obrzędowości: " + err.message);
      console.error("Błąd dodawania obrzędowości:", err);
    }
  }

    // Funkcja zamykająca modal obrzędowości i resetująca formularz
  function handleCloseAddCeremonyModal() {
    setShowAddCeremonyModal(false);
    setCeremonyCounts({ proporzec: 0, mundur: 0, dodatkowa: 0 });
    setAddMonth("");
    setAddNotes("");
  }

  // Zmień funkcję otwierania modala dodawania punktów:
  function handleOpenAddModal(scoutId) {
    setAddScoutId(scoutId);
    setAddCategoryId("");
    setAddScoutPersonId("");
    setAddPoints("");
   // ustaw domyślny miesiąc jeśli użytkownik ma włączone auto-sugestie
   setAddMonth(autoSuggestCurrentMonth ? getCurrentMonthKey() : "");
    setAddNotes("");
    if (advancedAddPoints) {
      setShowAddTypeModal(true); // okno wyboru typu
    } else {
      setShowAddSingleModal(true); // od razu zwykły modal
    }
  }
  
  // Funkcja do obsługi kafelków
  function handleAddType(type) {
    setShowAddTypeModal(false);
    // domyślny miesiąc przy otwieraniu konkretnego modalu
    const defaultMonth = autoSuggestCurrentMonth ? getCurrentMonthKey() : "";
    setAddMonth(defaultMonth);
    if (type === "single") {
      setShowAddSingleModal(true);
    } else if (type === "trip") {
      setShowAddTripModal(true);
    } else if (type === "meeting") {
      setShowAddMeetingModal(true);
    } else if (type === "ceremony") {
      setShowAddCeremonyModal(true);
    }
  }
  // Funckja do usuwania wpisu
  async function handleDeleteEntryConfirm() {
    if (!deleteEntryData?.id) return;
    try {
      await deleteDoc(doc(db, "Punktacja", deleteEntryData.id));
      setDeleteEntrySuccess(true);

      setPunktacjeLoading(true);
      punktacjaListAll().then((data) => {
        setPunktacje(data);
        setPunktacjeLoading(false);
      });

      console.log("Usunięto wpis punktacji!", deleteEntryData.id);
      setTimeout(() => {
        setShowDeleteEntryModal(false);
        setDeleteEntryData(null);
        setDeleteEntrySuccess(false);
      }, 1200);
    } catch (err) {
      alert("Błąd usuwania wpisu: " + err.message);
      console.error("Błąd usuwania wpisu punktacji:", err);
    }
  }

  // Firestore data
  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [zastepy, setZastepy] = useState([]);
  const [zastepyLoading, setZastepyLoading] = useState(true);
  const [punktacje, setPunktacje] = useState([]);
  const [punktacjeLoading, setPunktacjeLoading] = useState(true);

  // Wybrana drużyna (id)
  const [selectedTeam, setSelectedTeam] = useState("");

  // Historia wpisów - filtry
  const [historyMonth, setHistoryMonth] = useState([]);
  const [historyCat, setHistoryCat] = useState([]);
  const [historyScout, setHistoryScout] = useState([]);
  const [historyRowsPerPage, setHistoryRowsPerPage] = useState(20);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyDateFrom, setHistoryDateFrom] = useState("");
  const [historyDateTo, setHistoryDateTo] = useState("");

  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      const db = getFirestore(app);
      const q = query(collection(db, "scoring_categories"), where("scoringToggle", "==", true));
      const snap = await getDocs(q);
      setScoringCategories(
        snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    const db = getFirestore(app);
    getDoc(doc(db, "config", "zzzzzzzzzzzzzzzzzzzv")).then(snap => {
      if (snap.exists()) {
        setConfigSettings(snap.data());
      }
    });
  }, []);

const deadlineDayOfMonth = configSettings?.settingsValue !== undefined
  ? Number(configSettings.settingsValue)
  : undefined;

const flaggedEntries = useMemo(() => {
  if (!punktacje || !Array.isArray(punktacje) || !deadlineDayOfMonth) return [];
  return punktacje.filter(rec => {
    if (!rec.miesiac || !rec.scoreAddDate) return false;
    // rec.miesiac: np. "202510"
    const year = parseInt(rec.miesiac.slice(0, 4), 10);
    const month = parseInt(rec.miesiac.slice(4, 6), 10);
    // Kolejny miesiąc
    let nextMonth = month + 1;
    let nextYear = year;
    if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    // Deadline: koniec settingsValue dnia kolejnego miesiąca
    const deadlineDate = new Date(nextYear, nextMonth - 1, deadlineDayOfMonth, 23, 59, 59, 999);

    // Data dodania wpisu
    let addDate;
    if (typeof rec.scoreAddDate === "object" && rec.scoreAddDate.seconds) {
      addDate = new Date(rec.scoreAddDate.seconds * 1000);
    } else if (typeof rec.scoreAddDate === "string") {
      addDate = new Date(rec.scoreAddDate);
    } else {
      return false;
    }

    // Jeśli wpis dodano po deadline, oflaguj
    return addDate > deadlineDate;
  });
}, [punktacje, deadlineDayOfMonth]);

  // Pobierz preferencję z Firestore (np. w useEffect po zalogowaniu)
  useEffect(() => {
    if (user && user.uid) {
      const userRef = doc(db, "users", user.uid);
      getDoc(userRef).then(snap => {
        if (snap.exists() && snap.data().notificationsEnabled) {
          setNotificationsEnabled(true);
        }
      });
    }
  }, [user, db]);

  // Funkcja do obsługi zgody i tokenu
async function handleNotificationToggle(checked) {
  setNotificationsEnabled(checked);
  if (checked) {
    try {
      const permission = await Notification.requestPermission();
      console.log("Permission:", permission);
      if (permission === "granted") {
        const currentToken = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: await navigator.serviceWorker.ready,
        });
        console.log("CurrentToken:", currentToken, "User:", user);
        if (currentToken && user) {
          await setDoc(
            doc(db, "users", user.uid),
            {
              fcmTokens: arrayUnion(currentToken),
              notificationsEnabled: true,
            },
            { merge: true }
          );
          console.log("Token zapisany w Firestore!");
          onMessage(messaging, (payload) => {
            toast.info(`${payload.notification.title}: ${payload.notification.body}`);
          });
        }
      } else {
        setNotificationsEnabled(false);
      }
    } catch (e) {
      setNotificationsEnabled(false);
      alert("Nie udało się włączyć powiadomień: " + e.message);
      console.error(e);
    }
  } else if (user) {
  // Pobierz aktualny token
  const currentToken = await getToken(messaging, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: await navigator.serviceWorker.ready,
  });
  // Usuń token z Firestore
  await setDoc(
    doc(db, "users", user.uid),
    { notificationsEnabled: false, fcmTokens: arrayRemove(currentToken) },
    { merge: true }
  );
  // Usuń token z przeglądarki
  await deleteToken(messaging);
  console.log("Wyłączono powiadomienia i usunięto token FCM");
}
}

  // Zapisz preferencję darkmode w localStorage
  useEffect(() => {
    const stored = localStorage.getItem("panelDarkMode");
    if (stored === "true") setDarkMode(true);
  }, []);
  useEffect(() => {
    localStorage.setItem("panelDarkMode", darkMode ? "true" : "false");
  }, [darkMode]);
  
  // Ustaw domyślną drużynę dla admina z jednostką LUB zwykłego użytkownika z jednostką
  useEffect(() => {
    if (
      userWeb &&
      Array.isArray(userWeb.jednostka) &&
      userWeb.jednostka[0]?.id &&
      teams.length > 0
    ) {
      setSelectedTeam(userWeb.jednostka[0].id);
    }
  }, [userWeb, teams]);

  // Dodaj do menu Audyt jeśli użytkownik ma uprawnienia audytora
  const navItems = useMemo(() => {
    let items = [...NAV];
    if (userWeb && userWeb.auditor === true) items.push(NAV_AUDIT);
    if (userWeb && userWeb.admin === true) items.push(NAV_ADMIN);
    items.push(NAV_SETTINGS); // ustawienia zawsze na końcu
    return items;
  }, [userWeb]);

  useEffect(() => {
    if (!user || !user.email) {
      setUserWeb(null);
      setUserWebLoading(false);
      return;
    }
    setUserWebLoading(true);
    setUserWebError(null);
    const db = getFirestore(app);
    const q = query(collection(db, "usersWeb"), where("email", "==", user.email));
    getDocs(q)
      .then(snapshot => {
        if (!snapshot.empty) {
          setUserWeb({ ...snapshot.docs[0].data(), _docId: snapshot.docs[0].id });
        } else {
          setUserWeb(null);
        }
        setUserWebLoading(false);
      })
      .catch(err => {
        setUserWebError("Błąd pobierania danych użytkownika: " + err.message);
        setUserWebLoading(false);
      });
  }, [user]);

  // Ustaw domyślną drużynę dla admina z jednostką
  useEffect(() => {
    if (
      userWeb &&
      userWeb.admin === true &&
      Array.isArray(userWeb.jednostka) &&
      userWeb.jednostka[0]?.id &&
      teams.length > 0
    ) {
      setSelectedTeam(userWeb.jednostka[0].id);
    }
  }, [userWeb, teams]);

  async function getMailingRecipientsFromFirestore() {
    const db = getFirestore(app);
    const mailingsSnap = await getDocs(collection(db, "mailings"));
    const recipients = [];
    mailingsSnap.forEach(doc => {
      const data = doc.data();
      if (data.user && Array.isArray(data.user) && data.user[0]?.snapshot?.email) {
        recipients.push(data.user[0].snapshot.email);
      }
    });
    return recipients;
  }

  // Obsługa wysyłki wniosku o dostęp
  async function handleRequestAccess(e) {
    e.preventDefault();
    if (!requestUnitId || !requestRole || (requestRole === "inna" && !requestOtherRole)) return;
    setRequestSubmitting(true);
    try {
      const db = getFirestore(app);
      const docRef = doc(db, "usersWeb", userWeb._docId);
      const unitObj = teams.find(t => t.id === requestUnitId);
      const jednostkaNazwa = unitObj?.shortName || unitObj?.name || unitObj?.nazwa || "";

      await updateDoc(docRef, {
        active: jednostkaNazwa,
        funkcja: requestRole === "inna" ? requestOtherRole : requestRole
      });
      setRequestSuccess(true);

      // Pobierz odbiorców z Firestore
      const recipients = await getMailingRecipientsFromFirestore();

      // Wyślij maila przez endpoint Vercel
      await fetch("/api/send-account-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jednostka: jednostkaNazwa,
          funkcja: requestRole === "inna" ? requestOtherRole : requestRole,
          name: user?.displayName || "",
          email: user?.email || "",
          recipients
        })
      });

      // Odśwież dane użytkownika
      setTimeout(() => {
        setUserWeb({
          ...userWeb,
          active: jednostkaNazwa,
          funkcja: requestRole === "inna" ? requestOtherRole : requestRole
        });
      }, 1000);
    } catch (err) {
      setUserWebError("Błąd wysyłania wniosku: " + err.message);
    }
    setRequestSubmitting(false);
  }

  // Pobierz drużyny z Firestore
  useEffect(() => {
    setTeamsLoading(true);
    jednostkiListAll().then((data) => {
      setTeams(data);
      setTeamsLoading(false);
    });
  }, []);

  // Pobierz zastępy z Firestore
  useEffect(() => {
    setZastepyLoading(true);
    zastepyListAll().then((data) => {
      setZastepy(data);
      setZastepyLoading(false);
    });
  }, []);
  
  // Pobierz punktacje z Firestore
  useEffect(() => {
    setPunktacjeLoading(true);
    punktacjaListAll().then((data) => {
      setPunktacje(data);
      setPunktacjeLoading(false);
    });
  }, []);

  function handleOpenEditModal() {
    setEditRequest("");
    setEditSent(false);
    setShowEditModal(true);
  }

  function handleEditSubmit(e) {
    e.preventDefault();
    setEditSent(true);
  }

 async function handleAddPointsSubmit(e) {
  e.preventDefault();
  const selectedCategory = scoringCategories.find(cat => cat.id === addCategoryId);
  const selectedScoutTeam = zastepy.find(z => z.id === addScoutId);

  // Pobierz obiekt harcerza jeśli wybrano
  let selectedScoutPerson = undefined;
  if (
    addScoutPersonId &&
    scoringCategories.find(cat => cat.id === addCategoryId)?.scoringScoutInd
  ) {
    const zastęp = zastepy.find(z => z.id === addScoutId);
    selectedScoutPerson = zastęp?.harcerze?.find(h => h.id === addScoutPersonId);
  }

  try {
    await addPunktacjaEntry({
      selectedCategory,
      selectedScoutTeam,
      points: addPoints,
      month: addMonth,
      userEmail: user.email,
      notes: addNotes,
      selectedScoutPerson, 
    });

    setShowAddSingleModal(false);

    setAddCategoryId("");
    setAddScoutPersonId("");
    setAddPoints("");
    setAddMonth("");
    setAddNotes("");

    setPunktacjeLoading(true);
    punktacjaListAll().then((data) => {
      setPunktacje(data);
      setPunktacjeLoading(false);
    });

    console.log("Dodano wpis punktacji!");
  } catch (err) {
    alert("Błąd dodawania wpisu: " + err.message);
    console.error("Błąd dodawania wpisu punktacji:", err);
  }
}

  // Wybrane dane drużyny
  const selectedTeamData = useMemo(
    () => teams.find((t) => t.id === selectedTeam),
    [teams, selectedTeam]
  );

  // Zastępy tej drużyny
  const teamZastepy = useMemo(
    () => zastepy.filter((z) => z.jednostka && z.jednostka[0]?.id === selectedTeam),
    [zastepy, selectedTeam]
  );

  // Liczba harcerzy w drużynie (suma harcerzy w zastępach)
  const scoutsCount = useMemo(
    () => teamZastepy.reduce((sum, z) => sum + (Array.isArray(z.harcerze) ? z.harcerze.length : 0), 0),
    [teamZastepy]
  );

  // Punktacja tej drużyny (suma punktów wszystkich zastępów tej drużyny)
  const teamPunktacje = useMemo(
    () => punktacje.filter(
      (p) => p.scoreTeam && p.scoreTeam[0]?.id && teamZastepy.some(z => z.id === p.scoreTeam[0].id)
    ),
    [punktacje, teamZastepy]
  );

  // Suma punktów
  const totalPoints = useMemo(
    () => teamPunktacje.reduce((sum, p) => sum + (p.scoreValue || 0), 0),
    [teamPunktacje]
  );

  // Liczba wpisów punktacji
  const totalActivities = teamPunktacje.length;

    // Dodaj stan dla ustawienia zaawansowanego okna dodawania punktów
  const [advancedAddPoints, setAdvancedAddPoints] = useState(() => {
    const stored = localStorage.getItem("advancedAddPoints");
    return stored === null ? false : stored === "true";
  });

  
  // Obsługa zmiany toggle i zapis do localStorage
  function handleAdvancedAddPointsToggle(val) {
    setAdvancedAddPoints(val);
    localStorage.setItem("advancedAddPoints", val ? "true" : "false");
  }

  // Nowe ustawienie: automatycznie proponuj obecny miesiąc przy dodawaniu punktacji
  const [autoSuggestCurrentMonth, setAutoSuggestCurrentMonth] = useState(() => {
    const stored = localStorage.getItem("autoSuggestCurrentMonth");
    // domyślnie false (wyłączone) jeśli brak ustawienia
    return stored === null ? false : stored === "true";
  });

  function handleAutoSuggestToggle(val) {
    setAutoSuggestCurrentMonth(val);
    localStorage.setItem("autoSuggestCurrentMonth", val ? "true" : "false");
  }

  function getCurrentMonthKey() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${year}${month}`;
  }

  // Reset formularzy dodawania (wywoływane przy zamknięciu modalów add)
  function resetAddForm() {
    setAddCategoryId("");
    setAddScoutPersonId("");
    setAddPoints("");
    setAddMonth("");
    setAddNotes("");
    // nie ruszamy punktacji/edytowanych danych (te są inne stany)
  }

  // Zastępy z sumą punktów i wpisów
  const teamScouts = useMemo(() => {
    return teamZastepy.map(z => {
      const zPunktacje = punktacje.filter(
        (p) => p.scoreTeam && p.scoreTeam[0]?.id === z.id
      );
      return {
        id: z.id,
        name: z.fullName || z.name || "Zastęp",
        points: zPunktacje.reduce((sum, p) => sum + (p.scoreValue || 0), 0),
        activities: zPunktacje.length,
        last: zPunktacje.length > 0
          ? zPunktacje
              .map(p => p.scoreAddDate)
              .filter(Boolean)
              .sort()
              .reverse()[0]
          : null,
      };
    });
  }, [teamZastepy, punktacje]);

  // Kategorie z punktacji tej drużyny
  const historyCatOptions = useMemo(() => {
    const catsSet = new Map();
    teamPunktacje.forEach(rec => {
      const catId = rec.scoreCat?.[0]?.id;
      const catName = rec.scoreCat?.[0]?.snapshot?.scoringName;
      if (catId && catName) catsSet.set(catId, catName);
    });
    return Array.from(catsSet.entries()).map(([id, name]) => ({ id, name }));
  }, [teamPunktacje]);

  // Miesiące z punktacji tej drużyny
  const historyMonthOptions = useMemo(() => {
    const monthsSet = new Set(teamPunktacje.map((rec) => rec.miesiac));
    return Array.from(monthsSet)
      .filter(Boolean)
      .map((key) => ({
        key,
        label: getMonthLabelFromKey(key)
      }))
      .filter(m => m && typeof m.key === "string")
      .sort((a, b) => a.key.localeCompare(b.key));
  }, [teamPunktacje]);

  // Zastępy do filtracji
  const historyScoutOptions = useMemo(() =>
    teamScouts.map(z => ({ id: z.id, name: z.name })),
    [teamScouts]
  );

  // Filtrowane rekordy historii
  const filteredHistoryRecords = useMemo(() => {
  let records = teamPunktacje;
  if (historyScout.length > 0 && !historyScout.includes("ALL"))
    records = records.filter(r => historyScout.includes(r.scoreTeam?.[0]?.id));
  if (historyCat.length > 0 && !historyCat.includes("ALL"))
    records = records.filter(r => historyCat.includes(r.scoreCat?.[0]?.id));
  if (historyMonth.length > 0 && !historyMonth.includes("ALL"))
    records = records.filter(r => historyMonth.includes(r.miesiac));
  if (historyDateFrom) {
    const from = new Date(historyDateFrom);
    records = records.filter(r => {
      const d = r.scoreAddDate
        ? (typeof r.scoreAddDate === "object" && r.scoreAddDate.seconds
            ? new Date(r.scoreAddDate.seconds * 1000)
            : new Date(r.scoreAddDate))
        : null;
      return d && d >= from;
    });
  }
  if (historyDateTo) {
    const to = new Date(historyDateTo);
    records = records.filter(r => {
      const d = r.scoreAddDate
        ? (typeof r.scoreAddDate === "object" && r.scoreAddDate.seconds
            ? new Date(r.scoreAddDate.seconds * 1000)
            : new Date(r.scoreAddDate))
        : null;
      return d && d <= to;
    });
  }
  // Sortuj od najnowszej daty
  records = records.slice().sort((a, b) => {
    const da = a.scoreAddDate
      ? (typeof a.scoreAddDate === "object" && a.scoreAddDate.seconds
          ? a.scoreAddDate.seconds * 1000
          : new Date(a.scoreAddDate).getTime())
      : 0;
    const db = b.scoreAddDate
      ? (typeof b.scoreAddDate === "object" && b.scoreAddDate.seconds
          ? b.scoreAddDate.seconds * 1000
          : new Date(b.scoreAddDate).getTime())
      : 0;
    return db - da;
  });
  return records;
}, [teamPunktacje, historyScout, historyCat, historyMonth, historyDateFrom, historyDateTo]);

  // Paginacja historii
  const totalHistoryRows = filteredHistoryRecords.length;
  const totalHistoryPages = Math.max(1, Math.ceil(totalHistoryRows / historyRowsPerPage));
  const paginatedHistoryRecords = filteredHistoryRecords.slice(
    (historyCurrentPage - 1) * historyRowsPerPage,
    historyCurrentPage * historyRowsPerPage
  );

  // Reset paginacji przy zmianie filtrów
  useEffect(() => {
    setHistoryCurrentPage(1);
  }, [historyScout, historyCat, historyMonth, historyRowsPerPage, historyDateFrom, historyDateTo]);

  function handleMultiSelectChange(setter, values, allValue) {
    const arr = Array.from(values, option => option.value);
    if (arr.includes(allValue)) {
      setter([allValue]);
    } else {
      setter(arr);
    }
  }

  function handleResetFilters() {
    setHistoryScout([]);
    setHistoryCat([]);
    setHistoryMonth([]);
    setHistoryDateFrom("");
    setHistoryDateTo("");
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    if (typeof dateStr === "string") {
      return dateStr.split(" ")[0];
    }
    if (dateStr instanceof Date) {
      return dateStr.toISOString().slice(0, 10);
    }
    if (typeof dateStr === "object" && typeof dateStr.seconds === "number") {
      const d = new Date(dateStr.seconds * 1000);
      return d.toISOString().slice(0, 10);
    }
    return "";
  }

  function openEditEntryModal(entry) {
  setEditEntryData(entry);
  setEditEntrySuccess(false);
  setShowEditEntryModal(true);

  setEditCategoryId(entry.scoreCat?.[0]?.id || "");
  setEditScoutId(entry.scoreTeam?.[0]?.id || "");
  setEditScoutPersonId(entry.scoreScout?.[0]?.id || "");
  setEditPoints(entry.scoreValue || "");
  setEditMonth(entry.miesiac || "");
  setEditNotes(entry.scoreInfo || "");
  }
  function closeEditEntryModal() {
    setShowEditEntryModal(false);
    setEditEntryData(null);
    setEditEntrySuccess(false);
  }

  async function handleEditEntrySubmit(e) {
  e.preventDefault();
  const selectedCategory = scoringCategories.find(cat => cat.id === editCategoryId);
  const selectedScoutTeam = zastepy.find(z => z.id === editScoutId);

  let selectedScoutPerson = undefined;
  if (
    editScoutPersonId &&
    scoringCategories.find(cat => cat.id === editCategoryId)?.scoringScoutInd
  ) {
    const zastęp = zastepy.find(z => z.id === editScoutId);
    selectedScoutPerson = zastęp?.harcerze?.find(h => h.id === editScoutPersonId);
  }

  try {
    await addPunktacjaEntry({
      selectedCategory,
      selectedScoutTeam,
      points: editPoints,
      month: editMonth,
      userEmail: user.email,
      notes: editNotes,
      selectedScoutPerson,
      isEdit: true,
      entryId: editEntryData.id,
    });

    setShowEditEntryModal(false);
    setEditEntrySuccess(true);

    setPunktacjeLoading(true);
    punktacjaListAll().then((data) => {
      setPunktacje(data);
      setPunktacjeLoading(false);
    });

    console.log("Zaktualizowano wpis punktacji!");
  } catch (err) {
    alert("Błąd edycji wpisu: " + err.message);
    console.error("Błąd edycji wpisu punktacji:", err);
  }
}

  function openDeleteEntryModal(entry) {
    setDeleteEntryData(entry);
    setDeleteEntrySuccess(false);
    setShowDeleteEntryModal(true);
  }
  function closeDeleteEntryModal() {
    setShowDeleteEntryModal(false);
    setDeleteEntryData(null);
    setDeleteEntrySuccess(false);
  }

  const allZastepyRanking = useMemo(() => {
    // Zlicz sumę punktów dla każdego zastępu ze wszystkich drużyn
    const zastepPoints = zastepy.map(z => {
      const zPunktacje = punktacje.filter(
        (p) => p.scoreTeam && p.scoreTeam[0]?.id === z.id
      );
      return {
        id: z.id,
        points: zPunktacje.reduce((sum, p) => sum + (p.scoreValue || 0), 0),
      };
    });
    // Posortuj malejąco po punktach
    zastepPoints.sort((a, b) => b.points - a.points);
    // Nadaj pozycje w rankingu
    return zastepPoints.map((z, idx) => ({
      ...z,
      position: idx + 1,
    }));
  }, [zastepy, punktacje]);

  // --- UI LOGIKA DOSTĘPU ---
  // 1. Admin bez jednostki: wybierz drużynę
  const showTeamSelect =
    userWeb &&
    userWeb.admin === true &&
    (!userWeb.jednostka || !Array.isArray(userWeb.jednostka) || !userWeb.jednostka[0]?.id);

  // 2. Zwykły użytkownik bez jednostki i nie admin: ukryj wybierz drużynę, pokaż formularz wniosku
  const isNormalUserNoUnit =
    userWeb &&
    userWeb.admin !== true &&
    (!userWeb.jednostka || !Array.isArray(userWeb.jednostka) || !userWeb.jednostka[0]?.id);

  // 3. Zwykły użytkownik bez jednostki, nie admin, brak .active: pokaż formularz wniosku
  const showRequestForm =
    isNormalUserNoUnit && !userWeb?.active;

  // 4. Zwykły użytkownik bez jednostki, nie admin, z .active: pokaż oczekiwanie na akceptację
  const showRequestPending =
    isNormalUserNoUnit && !!userWeb?.active;

  // 5. Admin z jednostką: wybierz drużynę, domyślnie ustawioną
  const showTeamSelectForAdminWithUnit =
    userWeb &&
    userWeb.admin === true &&
    Array.isArray(userWeb.jednostka) &&
    userWeb.jednostka[0]?.id;
  // --- KONIEC LOGIKI DOSTĘPU ---
  
  return (
    <div
      className={darkMode ? "panel-darkmode" : ""}
      style={{
        display: "flex",
        minHeight: "100vh",
        ...(darkMode ? darkModeStyles : { background: "#f8f9fa" }),
      }}
    >
      {/* Sidebar for desktop */}
      <aside
        className="d-none d-md-block"
        style={{
          width: 230,
          background: darkMode ? "#232326" : "#fff",
          borderRight: darkMode ? "1px solid #333" : "1px solid #e5e7eb",
          padding: "2.5rem 0 2.5rem 0",
          minHeight: "100vh",
          position: "sticky",
          top: 0,
          zIndex: 2,
          color: darkMode ? "#e5e7eb" : undefined,
        }}
      >
        <div className="d-flex flex-column align-items-stretch h-100">
          <div className="px-4 mb-4">
            <div className="fw-bold fs-5 mb-2" style={{ letterSpacing: 1 }}>Panel</div>
          </div>
          <nav className="flex-grow-1">
            {navItems.map((item) => (
              <Button
                key={item.key}
                variant={tab === item.key ? "primary" : "light"}
                className="w-100 text-start mb-2 d-flex align-items-center"
                style={{
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 500,
                  background: tab === item.key ? "#e0e7ff" : "transparent",
                  color: tab === item.key ? "#1e293b" : "#374151",
                  boxShadow: tab === item.key ? "0 1px 4px #0001" : "none",
                }}
                onClick={() => setTab(item.key)}
              >
                {item.icon}
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Top nav for mobile */}
         <nav
          className="d-flex d-md-none justify-content-start align-items-stretch"
          style={{
            position: "fixed",
            top: 72,
            left: 0,
            right: 0,
            height: 54,
            background: darkMode ? "#232326" : "#fff",
            borderBottom: darkMode ? "1px solid #333" : "1px solid #e5e7eb",
            zIndex: 100,
            color: darkMode ? "#e5e7eb" : undefined,
            overflowX: "auto",
            whiteSpace: "nowrap",
            scrollbarWidth: "thin",
          }}
        >
          {navItems.map((item, idx) => (
            <Button
              key={item.key}
              variant={tab === item.key ? "primary" : "light"}
              className="d-flex flex-column align-items-center justify-content-center px-2 py-1"
              style={{
                border: "none",
                borderRadius: 0,
                fontWeight: 500,
                background: tab === item.key ? "#e0e7ff" : "transparent",
                color: tab === item.key ? "#1e293b" : "#374151",
                boxShadow: "none",
                width: 100, // stała szerokość
                minWidth: 100,
                maxWidth: 100,
                height: "100%",
                padding: 0,
                marginRight: idx !== navItems.length - 1 ? 8 : 0, // odstęp tylko po prawej, oprócz ostatniego
              }}
              onClick={() => setTab(item.key)}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                <div style={{ height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.icon}
                </div>
                <span style={{ fontSize: 12, marginTop: 2 }}>{item.label}</span>
              </div>
            </Button>
          ))}
        </nav>

      {/* Main content */}
      {infoModalToggle && showInfoModal && (
      <Modal
        show={showInfoModal}
        onHide={() => setShowInfoModal(false)}
        centered
        container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}
      >
        <Modal.Header closeButton>
          <Modal.Title>Informacja</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div dangerouslySetInnerHTML={{ __html: infoModalText }} />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowInfoModal(false)}>
            OK
          </Button>
          <Button variant="outline-secondary" onClick={handleHideInfoModal}>
            Nie pokazuj więcej
          </Button>
        </Modal.Footer>
      </Modal>
      )}
      <Container
          fluid
          style={{
            maxWidth: "100%",
            margin: "0 auto",
            padding: isMobile ? "0" : "0 2rem",
            flex: 1,
            marginTop: isMobile ? 145 : "6rem",
            ...(darkMode ? darkModeStyles : {}),
          }}
        >
        <div
          style={{
            maxWidth: "100%",
            margin: "0 auto",
            marginBottom: isMobile ? "1rem" : "3rem"
          }}
        >
          {(authLoading || userWebLoading || teamsLoading || zastepyLoading || punktacjeLoading) && (
            <div className="text-center py-5">
              <Spinner animation="border" />
              <div className="mt-2 text-muted">Ładowanie danych użytkownika...</div>
            </div>
          )}
          {userWebError && (
            <Alert variant="danger" className="mb-4">
              {userWebError}
            </Alert>
          )}

          {/* --- PANEL DRUŻYNOWY --- */}
          {!authLoading && !userWebLoading && !teamsLoading && !zastepyLoading && !punktacjeLoading && tab === "team" && (
            <>
              <div className="mb-4" style={{ padding: isMobile ? "1.2rem" : "0 2rem", textAlign: "center" }}>
                <h1 className="fw-bold mb-2" style={{ fontSize: "2rem", ...(darkMode ? darkTextStyle : {}) }}>Panel Drużynowego</h1>
                <div className="text-muted mb-3" style={darkMode ? darkTextStyle : {}}>
                  Zarządzaj punktacją zastępów w Twojej drużynie.
                </div>
              </div>

              {/* --- ADMIN BEZ JEDNOSTKI: WYBÓR DRUŻYNY --- */}
              {showTeamSelect && (
                <Card className="mb-4" style={darkMode ? darkCardStyle : {}}>
                  <Card.Header className="d-flex align-items-center gap-2">
                    <Users size={20} className="me-2" />
                    <span className="fw-semibold">Wybierz drużynę do zarządzania</span>
                  </Card.Header>
                  <Card.Body>
                    {teamsLoading ? (
                      <Spinner animation="border" />
                    ) : (
                      <Form.Select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        style={{ maxWidth: 400 }}
                      >
                        <option value="">Wybierz drużynę do zarządzania</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.shortName || team.name || team.nazwa || "Drużyna"}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* --- ZWYKŁY UŻYTKOWNIK BEZ JEDNOSTKI: FORMULARZ WNIOSKU O DOSTĘP --- */}
              {showRequestForm && (
                <Card className="mb-4" style={darkMode ? darkCardStyle : {}}>
                  <Card.Body>
                    <Alert variant="info">
                      Twoje konto zostało utworzone.<br />
                      Aby uzyskać dostęp do panelu drużyny, złóż wniosek o dostęp do wybranej drużyny i podaj swoją funkcję.
                    </Alert>
                    <Form onSubmit={handleRequestAccess}>
                      <Form.Group className="mb-3">
                        <Form.Label>Wybierz drużynę</Form.Label>
                        <Form.Select
                          value={requestUnitId}
                          onChange={e => setRequestUnitId(e.target.value)}
                          required
                        >
                          <option value="">Wybierz drużynę</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>
                              {team.shortName || team.name || team.nazwa || "Drużyna"}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                        <Form.Label>Funkcja</Form.Label>
                        <Form.Select
                          value={requestRole}
                          onChange={e => setRequestRole(e.target.value)}
                          required
                        >
                          <option value="">Wybierz funkcję</option>
                          <option value="drużynowy">Drużynowy</option>
                          <option value="przyboczny">Przyboczny</option>
                          <option value="inna">Inna (wpisz jaka)</option>
                        </Form.Select>
                      </Form.Group>
                      {requestRole === "inna" && (
                        <Form.Group className="mb-3">
                          <Form.Label>Podaj funkcję</Form.Label>
                          <Form.Control
                            type="text"
                            value={requestOtherRole}
                            onChange={e => setRequestOtherRole(e.target.value)}
                            required
                          />
                        </Form.Group>
                      )}
                      <Button
                        type="submit"
                        variant="primary"
                        className="w-100"
                        disabled={requestSubmitting}
                      >
                        {requestSubmitting ? "Wysyłanie..." : "Wyślij wniosek"}
                      </Button>
                      {requestSuccess && (
                        <Alert variant="success" className="mt-3 mb-0">
                          Wniosek został wysłany. Oczekuj na akceptację przez administratora.
                        </Alert>
                      )}
                    </Form>
                  </Card.Body>
                </Card>
              )}

              {/* --- ZWYKŁY UŻYTKOWNIK BEZ JEDNOSTKI: WNIOSEK OCZEKUJE NA AKCEPTACJĘ --- */}
              {showRequestPending && (
                <Card className="mb-4">
                  <Card.Header>
                    <span className="fw-semibold">Wniosek oczekuje na akceptację</span>
                  </Card.Header>
                  <Card.Body>
                    <Alert variant="info">
                      Twój wniosek o dostęp do drużyny oczekuje na akceptację przez administratora.
                    </Alert>
                    <div>
                      <b>Wnioskowana drużyna:</b> {userWeb.active || "-"}<br />
                      <b>Funkcja:</b> {userWeb.funkcja || "-"}
                    </div>
                  </Card.Body>
                </Card>
              )}

              {/* --- ADMIN Z JEDNOSTKĄ: WYBÓR DRUŻYNY (DOMYŚLNIE USTAWIONA) --- */}
              {showTeamSelectForAdminWithUnit && (
                <Card className="mb-4" style={darkMode ? darkCardStyle : {}}>
                  <Card.Header className="d-flex align-items-center gap-2">
                    <Users size={20} className="me-2" />
                    <span className="fw-semibold">Wybierz drużynę</span>
                  </Card.Header>
                  <Card.Body style={darkMode ? darkCardStyle : {}}>
                    {teamsLoading ? (
                      <Spinner animation="border" />
                    ) : (
                      <Form.Select
                        value={selectedTeam}
                        onChange={(e) => setSelectedTeam(e.target.value)}
                        style={{ maxWidth: 400 }}
                      >
                        <option value="">Wybierz drużynę do zarządzania</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.shortName || team.name || team.nazwa || "Drużyna"}
                          </option>
                        ))}
                      </Form.Select>
                    )}
                  </Card.Body>
                </Card>
              )}

              {/* --- RESZTA PANELU DRUŻYNOWEGO --- */}
              {/* Wyświetl statystyki, zastępy, itd. tylko jeśli użytkownik ma przypisaną jednostkę */}
              {(
                (userWeb && Array.isArray(userWeb.jednostka) && userWeb.jednostka[0]?.id) ||
                (userWeb && userWeb.admin === true && selectedTeam)
              ) && (
                <>
                  {/* Statystyki drużyny */}
                  <Card className="mb-4" style={darkMode ? darkCardStyle : {}}>
                    <Card.Header className="d-flex align-items-center justify-content-between">
                      <span className="fw-semibold">
                        Moja drużyna: {selectedTeamData?.shortName || selectedTeamData?.name || selectedTeamData?.nazwa}
                      </span>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={handleOpenEditModal}
                        className="d-flex align-items-center"
                      >
                        <Edit2 size={16} className="me-1" />
                        Edytuj
                      </Button>
                    </Card.Header>
                    <Card.Body style={darkMode ? darkCardStyle : {}}>
                      {isMobile ? (
                        <Row>
                          <Col xs={6} className="d-flex flex-column justify-content-center align-items-start mb-2" style={{ minWidth: 120 }}>
                            <div className="d-flex align-items-center mb-2" style={{ minWidth: 120 }}>
                              <div className="text-muted small" style={{ minWidth: 80 }}>Zastępy</div>
                              <div className="fs-2 fw-bold text-primary" style={{ minWidth: 60, textAlign: "right", marginLeft: 16 }}>{teamScouts.length}</div>
                            </div>
                            <div className="d-flex align-items-center" style={{ minWidth: 120 }}>
                              <div className="text-muted small" style={{ minWidth: 80 }}>Harcerzy</div>
                              <div className="fs-2 fw-bold text-primary" style={{ minWidth: 60, textAlign: "right", marginLeft: 16 }}>{scoutsCount}</div>
                            </div>
                          </Col>
                          <Col xs={6} className="d-flex flex-column justify-content-center align-items-start mb-2" style={{ minWidth: 120 }}>
                            <div className="d-flex align-items-center mb-2" style={{ minWidth: 120 }}>
                              <div className="text-muted small" style={{ minWidth: 80 }}>Łącznie punktów</div>
                              <div className="fs-2 fw-bold text-primary" style={{ minWidth: 60, textAlign: "right", marginLeft: 16 }}>{totalPoints}</div>
                            </div>
                            <div className="d-flex align-items-center" style={{ minWidth: 120 }}>
                              <div className="text-muted small" style={{ minWidth: 80 }}>Wpisów ogółem</div>
                              <div className="fs-2 fw-bold text-primary" style={{ minWidth: 60, textAlign: "right", marginLeft: 16 }}>{totalActivities}</div>
                            </div>
                          </Col>
                        </Row>
                      ) : (
                        <Row>
                          <Col md={3} className="d-flex align-items-center justify-content-center mb-3 mb-md-0">
                            <div className="text-muted small me-2">Zastępy</div>
                            <div className="fs-2 fw-bold text-primary">{teamScouts.length}</div>
                          </Col>
                          <Col md={3} className="d-flex align-items-center justify-content-center mb-3 mb-md-0">
                            <div className="text-muted small me-2">Harcerzy</div>
                            <div className="fs-2 fw-bold text-primary">{scoutsCount}</div>
                          </Col>
                          <Col md={3} className="d-flex align-items-center justify-content-center mb-3 mb-md-0">
                            <div className="text-muted small me-2">Łącznie punktów</div>
                            <div className="fs-2 fw-bold text-primary">{totalPoints}</div>
                          </Col>
                          <Col md={3} className="d-flex align-items-center justify-content-center">
                            <div className="text-muted small me-2">Wpisów ogółem</div>
                            <div className="fs-2 fw-bold text-primary">{totalActivities}</div>
                          </Col>
                        </Row>
                      )}
                    </Card.Body>
                  </Card>

                  {/* Modal edycji drużyny */}
                  <Modal show={showEditModal} 
                      onHide={() => setShowEditModal(false)} 
                      centered
                      container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}>
                  <Modal.Header closeButton>
                    <Modal.Title>Edycja danych drużyny</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Alert variant="info">
                      Na ten moment zmiana danych drużyny wymaga kontaktu z administratorem strony.<br />
                      <br />Napisz na adres: <br /><a href="mailto:piotr.duda-klimaszewski@zhr.pl">piotr.duda-klimaszewski@zhr.pl</a>
                    </Alert>
                  </Modal.Body>
                </Modal>

                  {/* Lista zastępów */}
                  <Card className="mb-4" style={darkMode ? darkCardStyle : {}}>
                  <Card.Header className="d-flex align-items-center gap-2">
                    <Trophy size={20} className="me-2" />
                    <span className="fw-semibold">Moje zastępy</span>
                  </Card.Header>
                  <Card.Body style={darkMode ? darkCardStyle : {}}>
                    <div className={isDesktopWide ? "row gx-3 gy-3" : "space-y-3"}>
                      {teamScouts.map((scout) => {
                  const ranking = allZastepyRanking.find(z => z.id === scout.id);
                  return (
                    <div
                      key={scout.id}
                      className={isDesktopWide ? "col-md-6" : ""}
                      style={isDesktopWide ? { display: "flex" } : {}}
                    >
                      <div
                        className="bg-light rounded-lg border w-100"
                        style={{
                          padding: isMobile ? "0.75rem" : "1.5rem",
                          minHeight: isDesktopWide ? 0 : undefined
                        }}
                      >
                        <div className="d-flex align-items-start justify-content-between gap-4">
                          <div className="flex-grow-1">
                            <div className="d-flex align-items-center gap-3 mb-2">
                              <div>
                                <Users size={20} />
                              </div>
                              <div>
                                <h4 className="fw-semibold mb-1" style={{ fontSize: "1rem" }}>
                                  {scout.name}
                                </h4>
                                <div className="d-flex align-items-center gap-2 mt-1">
                                  <Badge
                                    bg="success"
                                    className="text-xs"
                                    style={{
                                      minWidth: 60,
                                      textAlign: "center",
                                      fontWeight: 500,
                                      border: darkMode ? "1px solid #333" : "1px solid #e5e7eb"
                                    }}
                                  >
                                    Pozycja: {ranking ? ranking.position : "-"}
                                  </Badge>
                                  <Badge
                                    bg="secondary"
                                    className="text-xs ms-auto"
                                    style={{
                                      minWidth: 60,
                                      textAlign: "center",
                                      fontWeight: 500,
                                      border: darkMode ? "1px solid #333" : "1px solid #e5e7eb"
                                    }}
                                  >
                                    Wpisów: {scout.activities}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-muted small mb-2">
                              Ostatni wpis: {scout.last
                                ? (() => {
                                    if (typeof scout.last === "object" && scout.last.seconds) {
                                      return new Date(scout.last.seconds * 1000).toLocaleDateString("pl-PL");
                                    }
                                    if (typeof scout.last === "string") {
                                      return new Date(scout.last).toLocaleDateString("pl-PL");
                                    }
                                    return "Brak wpisów";
                                  })()
                                : "Brak wpisów"}
                            </div>
                          </div>
                          {/* Punkty na lewo od przycisków, wyśrodkowane w pionie */}
                          <div className="d-flex flex-column align-items-center justify-content-center" style={{ alignSelf: "center" }}>
                            <div className="fs-2 fw-bold text-primary" style={{ lineHeight: 1 }}>
                              {scout.points}
                            </div>
                            <div className="text-xs text-muted" style={{ lineHeight: 1 }}>
                              pkt
                            </div>
                          </div>
                          <div className="flex-shrink-0 d-flex flex-column gap-1 align-items-end">
                            <Button
                          variant="outline-primary"
                          size="sm"
                          title="Dodaj punkty"
                          onClick={() => handleOpenAddModal(scout.id)}
                          className="d-flex align-items-center"
                        >
                          <Plus size={16} className="me-1" />
                          {!isMobile && <span>Dodaj punkty</span>}
                        </Button>
                            <Button
                              variant="outline-secondary"
                              size="sm"
                              title="Informacje o zastępie"
                              onClick={() => {
                                const scoutData = zastepy.find(z => z.id === scout.id);
                                setScoutInfoData(scoutData);
                                setShowScoutInfoModal(true);
                              }}
                              className="d-flex align-items-center"
                            >
                              <Info size={16} className="me-1" />
                              {!isMobile && <span>Dane zastępu</span>}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                    </div>
                  </Card.Body>
                </Card>

                    <Modal show={showScoutInfoModal} 
                           onHide={() => setShowScoutInfoModal(false)} 
                           centered
                           container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}>
                      <Modal.Header closeButton>
                        <Modal.Title>
                          {scoutInfoData?.fullName || scoutInfoData?.name || "Informacje o zastępie"}
                        </Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        {scoutInfoData ? (
                          <>
                            <div className="mb-2">
                              <b>Nazwa:</b> {scoutInfoData.fullName || scoutInfoData.name}
                            </div>
                            {scoutInfoData.jednostka && scoutInfoData.jednostka[0]?.snapshot?.shortName && (
                              <div className="mb-2">
                                <b>Drużyna:</b> {scoutInfoData.jednostka[0].snapshot.shortName}
                              </div>
                            )}
                            <div className="mb-2">
                              <b>Liczba harcerzy:</b> {Array.isArray(scoutInfoData.harcerze) ? scoutInfoData.harcerze.length : 0}
                            </div>
                            <div className="mb-2">
                              <b>Lista harcerzy:</b>
                              <ul className="mt-1 mb-0 ps-3">
                                {Array.isArray(scoutInfoData.harcerze) && scoutInfoData.harcerze.length > 0 ? (
                                  scoutInfoData.harcerze.map(h => (
                                    <li key={h.id}>
                                      {h.name} {h.surname}
                                      {h.zastepowy && (
                                        <span className="ms-2" style={{ color: "#0d7337", fontWeight: 500 }}>
                                          (zastępowy)
                                        </span>
                                      )}
                                    </li>
                                  ))
                                ) : (
                                  <li className="text-muted">Brak harcerzy w tym zastępie.</li>
                                )}
                              </ul>
                            </div>
                            {scoutInfoData.blog && (
                              <div className="mb-2">
                                <b>Blog:</b>{" "}
                                <a href={scoutInfoData.blog} target="_blank" rel="noopener noreferrer">
                                  {scoutInfoData.blog}
                                </a>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="text-muted">Brak danych o zastępie.</div>
                        )}
                      </Modal.Body>
                    </Modal>

                  {/* MODAL WYBORU TYPU WPISU */}
                  <Modal
                    show={showAddTypeModal}
                    onHide={() => setShowAddTypeModal(false)}
                    centered
                    container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}
                  >
                    <Modal.Header closeButton>
                      <Modal.Title>Wybierz typ wpisu</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      <Row className="g-3">
                        <Col xs={12} md={6}>
                          <Button
                            variant="outline-primary"
                            className="w-100 py-4 d-flex flex-column align-items-center"
                            onClick={() => handleAddType("single")}
                          >
                            <Trophy size={36} className="mb-2" />
                            <span className="fw-bold">Dodaj pojedyńczy wpis</span>
                          </Button>
                        </Col>
                        <Col xs={12} md={6}>
                          <Button
                            variant="outline-success"
                            className="w-100 py-4 d-flex flex-column align-items-center"
                            onClick={() => handleAddType("trip")}
                          >
                            <Users size={36} className="mb-2" />
                            <span className="fw-bold">Dodaj wyjazd</span>
                          </Button>
                        </Col>
                        <Col xs={12} md={6}>
                          <Button
                            variant="outline-warning"
                            className="w-100 py-4 d-flex flex-column align-items-center"
                            onClick={() => handleAddType("meeting")}
                          >
                            <Clock size={36} className="mb-2" />
                            <span className="fw-bold">Dodaj zbiórkę</span>
                          </Button>
                        </Col>
                        <Col xs={12} md={6}>
                          <Button
                            variant="outline-secondary"
                            className="w-100 py-4 d-flex flex-column align-items-center"
                            onClick={() => handleAddType("ceremony")}
                          >
                            <Award size={36} className="mb-2" />
                            <span className="fw-bold">Dodaj obrzędowość</span>
                          </Button>
                        </Col>
                      </Row>
                    </Modal.Body>
                  </Modal>
                  
                  {/* Modal dodawania punktów */}
                  <Modal show={showAddSingleModal} 
                      onHide={() => { setShowAddSingleModal(false); resetAddForm(); }} 
                      centered
                      container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}>
                  <Modal.Header closeButton>
                    <Modal.Title>Dodawanie wpisu punktacji</Modal.Title>
                  </Modal.Header>
                  <Modal.Body>
                    <Form onSubmit={handleAddPointsSubmit}>
                      <Form.Group className="mb-3">
                        <Form.Label>Zastęp</Form.Label>
                        <Form.Select value={addScoutId || ""} disabled>
                          <option>Wybierz zastęp</option>
                          {teamScouts.map((scout) => (
                            <option key={scout.id} value={scout.id}>{scout.name}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group className="mb-3">
                      <Form.Label>Kategoria</Form.Label>
                      <Form.Select
                        value={addCategoryId}
                        onChange={e => setAddCategoryId(e.target.value)}
                        required
                      >
                        <option value="">Wybierz kategorię</option>
                        {scoringCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>
                            {cat.scoringName}
                          </option>
                        ))}
                      </Form.Select>
                      {/* Opcjonalnie opis kategorii */}
                      {addCategoryId && (
                        <div className="text-muted mt-1" 
                        style={{ fontSize: "0.95rem" , paddingTop: "0.5rem" }}>
                          <span dangerouslySetInnerHTML={{ __html: scoringCategories.find(cat => cat.id === addCategoryId)?.scoringDesc }} />
                        </div>
                      )}
                    </Form.Group>
                      {/* Pole harcerz jeśli scoringScoutInd === true */}
                      {addCategoryId && scoringCategories.find(cat => cat.id === addCategoryId)?.scoringScoutInd && (
                      <Form.Group className="mb-3">
                      <Form.Label>Harcerz</Form.Label>
                      <Form.Select
                        value={addScoutPersonId}
                        onChange={e => setAddScoutPersonId(e.target.value)}
                        required={scoringCategories.find(cat => cat.id === addCategoryId)?.scoringScoutInd}
                        disabled={!scoringCategories.find(cat => cat.id === addCategoryId)?.scoringScoutInd}
                      >
                        <option value="">Wybierz harcerza</option>
                        {zastepy.find(z => z.id === addScoutId)?.harcerze?.map(h => (
                          <option key={h.id} value={h.id}>{h.name} {h.surname}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    )}
                      <Row>
                        <Col>
                          <Form.Group className="mb-3">
                          <Form.Label>
                            Punkty ({addCategoryId && scoringCategories.find(cat => cat.id === addCategoryId)?.scoringMaxVal
                              ? `1-${scoringCategories.find(cat => cat.id === addCategoryId).scoringMaxVal}`
                              : "1-10"})
                          </Form.Label>
                          <Form.Control
                            type="number"
                            min={1}
                            max={addCategoryId && scoringCategories.find(cat => cat.id === addCategoryId)?.scoringMaxVal
                              ? scoringCategories.find(cat => cat.id === addCategoryId).scoringMaxVal
                              : 10}
                            value={addPoints}
                            onChange={e => setAddPoints(e.target.value)}
                            required
                          />
                        </Form.Group>
                        </Col>
                        <Col>
                          <Form.Group className="mb-3">
                            <Form.Label>Klasyfikacja miesięczna</Form.Label>
                            <Form.Select
                              value={addMonth}
                              onChange={e => setAddMonth(e.target.value)}
                              required
                            >
                              <option value="">Wybierz miesiąc</option>
                              <option value="202509">wrzesień 2025</option>
                              <option value="202510">październik 2025</option>
                              <option value="202511">listopad 2025</option>
                              <option value="202512">grudzień 2025</option>
                              <option value="202601">styczeń 2026</option>
                              <option value="202602">luty 2026</option>
                              <option value="202603">marzec 2026</option>
                              <option value="202604">kwiecień 2026</option>
                              <option value="202605">maj 2026</option>
                              <option value="202606">czerwiec 2026</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                      </Row>
                      <Form.Group className="mb-3">
                      <Form.Label>Uwagi (opcjonalnie)</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        value={addNotes}
                        onChange={e => setAddNotes(e.target.value)}
                        placeholder="Dodaj uwagi do wpisu (opcjonalnie)"
                      />
                    </Form.Group>
                      <Button
                      type="submit"
                      variant="primary"
                      className="w-100"
                      disabled={
                        !addCategoryId ||
                        !addScoutId ||
                        !addPoints ||
                        !addMonth ||
                        (scoringCategories.find(cat => cat.id === addCategoryId)?.scoringScoutInd && !addScoutPersonId)
                      }
                    >
                      Dodaj punkty
                    </Button>
                    </Form>
                  </Modal.Body>
                </Modal>
                </>
              )}
            </>
          )}

                    {/*MODAL DODAWANIA WYJAZDU */}
          <Modal
            show={showAddTripModal}
            onHide={() => { setShowAddTripModal(false); resetAddForm(); }}
            centered
            container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}
          >
            <Modal.Header closeButton>
              <Modal.Title>Dodaj wyjazd</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="text-center text-muted py-5">
                Formularz dodawania wyjazdu w przygotowaniu.
              </div>
            </Modal.Body>
          </Modal>
          
          {/* MODAL DODAWANIA ZBIÓRKI */}
          <Modal
            show={showAddMeetingModal}
            onHide={() => {
              setShowAddMeetingModal(false);
              resetMeetingForm(); // resetuj formularz po zamknięciu
            }}
            centered
            container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}
          >
            <Modal.Header closeButton>
              <Modal.Title>Dodaj zbiórkę</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={e => {
                handleAddMeetingSubmit(e);
                resetMeetingForm(); // resetuj formularz po dodaniu punktów
              }}>
                <Form.Group className="mb-3">
                  <Form.Label>Zastęp</Form.Label>
                  <Form.Select value={addScoutId || ""} disabled>
                    <option>Wybierz zastęp</option>
                    {teamScouts.map((scout) => (
                      <option key={scout.id} value={scout.id}>{scout.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Kategoria</Form.Label>
                  <Form.Select value="obecnosc_na_zbiorce" disabled>
                    <option value="obecnosc_na_zbiorce">Obecność na zbiórce</option>
                  </Form.Select>
                  <div className="text-muted mt-1" style={{ fontSize: "0.95rem", paddingTop: "0.5rem" }}>
                    <span dangerouslySetInnerHTML={{ __html: scoringCategories.find(cat => cat.scoringKey === "obecnosc")?.scoringDesc }} />
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                <Form.Label>Zaznacz obecnych harcerzy (max 7)</Form.Label>
                <div className="d-flex flex-column gap-2">
                  {zastepy.find(z => z.id === addScoutId)?.harcerze?.map(h => (
                    <div
                      key={h.id}
                      className="d-flex align-items-center"
                      style={{ cursor: "pointer" }}
                      onClick={() => handleMeetingPresenceChange(h.id)}
                    >
                      <Form.Check
                        type="checkbox"
                        label=""
                        checked={meetingPresence.includes(h.id)}
                        onChange={() => handleMeetingPresenceChange(h.id)}
                        disabled={
                          !meetingPresence.includes(h.id) && meetingPresence.length >= 7
                        }
                        style={{ marginRight: 8, pointerEvents: "none" }} // blokuj kliknięcie bezpośrednio na checkbox
                      />
                      <span
                        style={{
                          userSelect: "none",
                          color: meetingPresence.includes(h.id) ? "#0d7337" : undefined,
                          fontWeight: meetingPresence.includes(h.id) ? 600 : 400,
                          fontSize: "1.08em"
                        }}
                      >
                        {h.name} {h.surname}
                      </span>
                    </div>
                  ))}
                </div>
                {meetingPresence.length >= 7 && (
                  <div className="text-danger mt-2" style={{ fontSize: "0.95rem" }}>
                    Możesz zaznaczyć maksymalnie 7 harcerzy.
                  </div>
                )}
              </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Klasyfikacja miesięczna</Form.Label>
                  <Form.Select
                    value={addMonth}
                    onChange={e => setAddMonth(e.target.value)}
                    required
                  >
                    <option value="">Wybierz miesiąc</option>
                    <option value="202509">wrzesień 2025</option>
                    <option value="202510">październik 2025</option>
                    <option value="202511">listopad 2025</option>
                    <option value="202512">grudzień 2025</option>
                    <option value="202601">styczeń 2026</option>
                    <option value="202602">luty 2026</option>
                    <option value="202603">marzec 2026</option>
                    <option value="202604">kwiecień 2026</option>
                    <option value="202605">maj 2026</option>
                    <option value="202606">czerwiec 2026</option>
                  </Form.Select>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Uwagi (opcjonalnie)</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={addNotes}
                    onChange={e => setAddNotes(e.target.value)}
                    placeholder="Dodaj uwagi do wpisu (opcjonalnie)"
                  />
                </Form.Group>
                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={
                    !addScoutId ||
                    !addMonth ||
                    meetingPresence.length === 0
                  }
                >
                  Dodaj obecność
                </Button>
              </Form>
            </Modal.Body>
          </Modal>

          {/* MODAL DODAWANIA OBRZĘDOWOŚCI */}
            <Modal
              show={showAddCeremonyModal}
              onHide={handleCloseAddCeremonyModal}
              centered
              container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}
            >
              <Modal.Header closeButton>
                <Modal.Title>Dodaj obrzędowość</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Form onSubmit={handleAddCeremonySubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Zastęp</Form.Label>
                    <Form.Select value={addScoutId || ""} disabled>
                      <option>Wybierz zastęp</option>
                      {teamScouts.map((scout) => (
                        <option key={scout.id} value={scout.id}>{scout.name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Kategoria</Form.Label>
                    <Form.Select value="ceremony" disabled>
                      <option value="ceremony">Obrzędowość zastępów</option>
                    </Form.Select>
                    {/* Opis kategorii */}
                    <div className="text-muted mt-1" style={{ fontSize: "0.95rem", paddingTop: "0.5rem" }}>
                      <span dangerouslySetInnerHTML={{ __html: scoringCategories.find(cat => cat.scoringKey === "ceremony")?.scoringDesc }} />
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Rodzaj obrzędowości — wybierz ile punktów dodać <br/>(max 1 pkt/kategoria/zbiórka)</Form.Label>
                    {[
                      { key: "proporzec", label: "Proporzec" },
                      { key: "mundur", label: "Oznaczenie na mundurze" },
                      { key: "dodatkowa", label: "Dodatkowa obrzędowość" }
                    ].map(t => (
                      <div key={t.key} className="d-flex align-items-center justify-content-between mb-2 p-2 border rounded" style={{ background: darkMode ? "#1b1b1d" : "#fff" }}>
                        <div style={{ 
                          fontWeight: (ceremonyCounts[t.key] || 0) > 0 ? 600 : 400, 
                          color: (ceremonyCounts[t.key] || 0) > 0 ? "#0d7337" : undefined 
                          }}>
                          {t.label}
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline-danger"
                            onClick={() => handleCeremonyCountChange(t.key, (ceremonyCounts[t.key] || 0) - 1)}
                            aria-label={`Zmniejsz ${t.label}`}
                            className="d-flex align-items-center justify-content-center"
                            style={{ minWidth: 36, minHeight: 32, padding: "0.25rem" }}
                          >
                            <Minus size={16} />
                          </Button>
                          <div style={{ 
                            minWidth: 28, 
                            textAlign: "center", 
                            fontWeight: 700, 
                            color: (ceremonyCounts[t.key] || 0) > 0 ? "#0d7337" : undefined 
                            }}>
                            {ceremonyCounts[t.key]}
                          </div>
                          <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleCeremonyCountChange(t.key, (ceremonyCounts[t.key] || 0) + 1)}
                          aria-label={`Zwiększ ${t.label}`}
                          className="d-flex align-items-center justify-content-center"
                          style={{ minWidth: 36, minHeight: 32, padding: "0.25rem" }}
                        >
                          <Plus size={16} />
                        </Button>
                        </div>
                      </div>
                    ))}
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Klasyfikacja miesięczna</Form.Label>
                    <Form.Select
                      value={addMonth}
                      onChange={e => setAddMonth(e.target.value)}
                      required
                    >
                      <option value="">Wybierz miesiąc</option>
                      <option value="202509">wrzesień 2025</option>
                      <option value="202510">październik 2025</option>
                      <option value="202511">listopad 2025</option>
                      <option value="202512">grudzień 2025</option>
                      <option value="202601">styczeń 2026</option>
                      <option value="202602">luty 2026</option>
                      <option value="202603">marzec 2026</option>
                      <option value="202604">kwiecień 2026</option>
                      <option value="202605">maj 2026</option>
                      <option value="202606">czerwiec 2026</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Uwagi (opcjonalnie)</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      value={addNotes}
                      onChange={e => setAddNotes(e.target.value)}
                      placeholder="Dodaj uwagi do wpisu (opcjonalnie)"
                    />
                  </Form.Group>
                  <Alert variant="info" className="mb-3" style={{ fontSize: "0.98em" }}>
                    <strong>Uwaga:</strong> Dla każdego zaznaczonego rodzaju obrzędowości dodana zostanie wybrana liczba osobnych wpisów.
                  </Alert>
                  <Button
                    type="submit"
                    variant="primary"
                    className="w-100"
                    disabled={
                      !addScoutId ||
                      !addMonth ||
                      (
                        (ceremonyCounts.proporzec || 0) === 0 &&
                        (ceremonyCounts.mundur || 0) === 0 &&
                        (ceremonyCounts.dodatkowa || 0) === 0
                      )
                    }
                  >
                    Dodaj punkty
                  </Button>
                </Form>
              </Modal.Body>
            </Modal>

          {tab === "history" && (
          <Container
            fluid
            style={{
              maxWidth: "100%",
              margin: "0 auto",
              padding: isMobile ? "0" : "0 2rem",
              flex: 1,
              marginTop: isMobile ? 0 : 0,
              ...(darkMode ? darkModeStyles : {}),
            }}
          >
            <Card style={darkMode ? darkCardStyle : {}}>
              <Card.Header className="d-flex align-items-center gap-2">
                <FileText size={20} className="me-2" />
                <span className="fw-semibold">Historia wpisów punktacji</span>
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="ms-auto d-md-none"
                  onClick={() => setShowFilters((v) => !v)}
                >
                  <Filter size={16} className="me-1" />
                  {showFilters ? "Ukryj filtry" : "Pokaż filtry"}
                  {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </Button>
              </Card.Header>
              <Card.Body style={darkMode ? darkCardStyle : {}}>
                <Collapse in={showFilters || !isMobile}>
                  <div>
                    {isMobile ? (
                      <Row className="g-3 mb-3">
                        <Col xs={6}>
                          <Form.Label>Zastęp</Form.Label>
                          <Form.Select
                            value={historyScout.length === 0 ? "ALL" : historyScout[0]}
                            onChange={e => {
                              const val = e.target.value;
                              setHistoryScout(val === "ALL" ? [] : [val]);
                            }}
                          >
                            <option value="ALL">Wszystkie</option>
                            {historyScoutOptions.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.name}</option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Label>Kategoria</Form.Label>
                          <Form.Select
                            value={historyCat.length === 0 ? "ALL" : historyCat[0]}
                            onChange={e => {
                              const val = e.target.value;
                              setHistoryCat(val === "ALL" ? [] : [val]);
                            }}
                          >
                            <option value="ALL">Wszystkie</option>
                            {historyCatOptions.map(opt => (
                              <option key={opt.id} value={opt.id}>{opt.name}</option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Label>Miesiąc</Form.Label>
                          <Form.Select
                            value={historyMonth.length === 0 ? "ALL" : historyMonth[0]}
                            onChange={e => {
                              const val = e.target.value;
                              setHistoryMonth(val === "ALL" ? [] : [val]);
                            }}
                          >
                            <option value="ALL">Wszystkie</option>
                            {historyMonthOptions.map(opt => (
                              <option key={opt.key} value={opt.key}>{opt.label}</option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Label>Wierszy na stronę</Form.Label>
                          <Form.Select
                            value={historyRowsPerPage}
                            onChange={e => setHistoryRowsPerPage(Number(e.target.value))}
                          >
                            {[10, 20, 50, 100].map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </Form.Select>
                        </Col>
                        <Col xs={6}>
                          <Form.Label>Data od</Form.Label>
                          <Form.Control
                            type="date"
                            value={historyDateFrom}
                            onChange={e => setHistoryDateFrom(e.target.value)}
                          />
                        </Col>
                        <Col xs={6}>
                          <Form.Label>Data do</Form.Label>
                          <Form.Control
                            type="date"
                            value={historyDateTo}
                            onChange={e => setHistoryDateTo(e.target.value)}
                          />
                        </Col>
                      </Row>
                    ) : (
                      <>
                        <Row className="g-3 mb-3">
                          <Col md={3}>
                            <Form.Label>Zastęp</Form.Label>
                            <Form.Select
                              value={historyScout.length === 0 ? "ALL" : historyScout[0]}
                              onChange={e => {
                                const val = e.target.value;
                                setHistoryScout(val === "ALL" ? [] : [val]);
                              }}
                            >
                              <option value="ALL">Wszystkie</option>
                              {historyScoutOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col md={3}>
                            <Form.Label>Kategoria</Form.Label>
                            <Form.Select
                              value={historyCat.length === 0 ? "ALL" : historyCat[0]}
                              onChange={e => {
                                const val = e.target.value;
                                setHistoryCat(val === "ALL" ? [] : [val]);
                              }}
                            >
                              <option value="ALL">Wszystkie</option>
                              {historyCatOptions.map(opt => (
                                <option key={opt.id} value={opt.id}>{opt.name}</option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col md={3}>
                            <Form.Label>Miesiąc</Form.Label>
                            <Form.Select
                              value={historyMonth.length === 0 ? "ALL" : historyMonth[0]}
                              onChange={e => {
                                const val = e.target.value;
                                setHistoryMonth(val === "ALL" ? [] : [val]);
                              }}
                            >
                              <option value="ALL">Wszystkie</option>
                              {historyMonthOptions.map(opt => (
                                <option key={opt.key} value={opt.key}>{opt.label}</option>
                              ))}
                            </Form.Select>
                          </Col>
                          <Col md={3}>
                            <Form.Label>Wierszy na stronę</Form.Label>
                            <Form.Select
                              value={historyRowsPerPage}
                              onChange={e => setHistoryRowsPerPage(Number(e.target.value))}
                            >
                              {[10, 20, 50, 100].map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </Form.Select>
                          </Col>
                        </Row>
                        <Row className="g-3 mb-3">
                          <Col md={3}>
                            <Form.Label>Data od</Form.Label>
                            <Form.Control
                              type="date"
                              value={historyDateFrom}
                              onChange={e => setHistoryDateFrom(e.target.value)}
                            />
                          </Col>
                          <Col md={3}>
                            <Form.Label>Data do</Form.Label>
                            <Form.Control
                              type="date"
                              value={historyDateTo}
                              onChange={e => setHistoryDateTo(e.target.value)}
                            />
                          </Col>
                          {!isMobile && (
                            <Col md={6} className="d-flex align-items-end justify-content-end gap-2">
                              <Button variant="outline-secondary" 
                              size="sm" 
                              onClick={handleResetFilters}>
                                Resetuj filtry
                              </Button>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => {
                                  setPunktacjeLoading(true);
                                  punktacjaListAll().then((data) => {
                                    setPunktacje(data);
                                    setPunktacjeLoading(false);
                                  });
                                }}
                                className="ms-2"
                              >
                                Odśwież punktację
                              </Button>
                          
                        {enableBulkActionsInHistory && (
                          <div className="d-flex gap-2">
                            <Button variant="outline-danger" size="sm" disabled={selectedHistoryIds.size === 0 || bulkActionLoading} onClick={handleBulkDeleteConfirm}>
                              Usuń zaznaczone
                            </Button>
                            <Button variant="outline-primary" size="sm" disabled={selectedHistoryIds.size === 0} onClick={() => setShowBulkEditModal(true)}>
                              Edytuj zaznaczone
                            </Button>
                          </div>
                        )}
                            </Col>
                          )}
                        </Row>
                      </>
                    )}
                    {isMobile && (
                      <div className="d-flex flex-column gap-2 mt-2">
                        <Button variant="outline-secondary" size="sm" onClick={handleResetFilters}>
                          Resetuj filtry
                        </Button>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => {
                            setPunktacjeLoading(true);
                            punktacjaListAll().then((data) => {
                              setPunktacje(data);
                              setPunktacjeLoading(false);
                            });
                          }}
                        >
                          Odśwież punktację
                        </Button>
                      </div>
                    )}
                  </div>
                </Collapse>
                {punktacjeLoading ? (
                  <Spinner animation="border" />
                ) : paginatedHistoryRecords.length === 0 ? (
                  <div className="text-muted py-5 text-center">Brak wpisów punktacji dla wybranych filtrów.</div>
                ) : (
                  <>
                        {/* Bulk actions toolbar */}
                    {enableBulkActionsInHistory && (
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <Form.Check
                            type="checkbox"
                            id="select-all-visible"
                            checked={paginatedHistoryRecords.length > 0 && paginatedHistoryRecords.every(r => selectedHistoryIds.has(r.id))}
                            onChange={() => handleSelectAllVisible(paginatedHistoryRecords.map(r => r.id))}
                            label={`Zaznacz wszystkie (${paginatedHistoryRecords.length})`}
                          />
                        </div>
                        {isMobile && (
                        <div className="d-flex gap-2">
                          <Button variant="outline-danger" size="sm" disabled={selectedHistoryIds.size === 0 || bulkActionLoading} onClick={handleBulkDeleteConfirm}>
                            Usuń zaznaczone
                          </Button>
                          <Button variant="outline-primary" size="sm" disabled={selectedHistoryIds.size === 0} onClick={() => setShowBulkEditModal(true)}>
                            Edytuj zaznaczone
                          </Button>
                        </div>
                        )}
                      </div>
                    )}

                    <div className={isDesktopWide ? "row gx-3 gy-3" : "space-y-3"} >
                      {paginatedHistoryRecords.map((rec) => (
                        <div
                          key={rec.id}
                          className={isDesktopWide ? "col-md-6" : ""}
                          style={isDesktopWide ? { display: "flex" } : {}}
                        >
                          <div
                            className="bg-light rounded-lg border w-100"
                            style={{
                              padding: isMobile ? "0.75rem" : "1.5rem",
                              minHeight: isDesktopWide ? 0 : undefined
                            }}
                          >
                            <div className={`d-flex history-record-row ${enableBulkActionsInHistory ? "bulk-enabled align-items-center" : "align-items-start"} justify-content-between ${enableBulkActionsInHistory ? "" : "gap-4"}`}>
                              {enableBulkActionsInHistory ? (
                              <div className="history-select-container">
                                  <Form.Check
                                    type="checkbox"
                                    checked={selectedHistoryIds.has(rec.id)}
                                    onChange={() => toggleSelectHistory(rec.id)}
                                    className="history-select-checkbox"
                                    style={{ marginRight: 6, padding: 0 }}
                                  />
                                </div>
                              ) : null}                    
                              <div className="flex-grow-1">
                                <div className="d-flex align-items-center gap-3 mb-2">
                                  <div>
                                    {(() => {
                                      const catId = rec.scoreCat?.[0]?.id;
                                      const cat = scoringCategories.find(c => c.id === catId);
                                      if (cat?.scoringIcon) {
                                        // Jeśli scoringIcon to nazwa z lucide-react, np. "Trophy", "Star", "Award"
                                        const IconComponent = require("lucide-react")[cat.scoringIcon];
                                        return IconComponent ? <IconComponent size={20} /> : <Trophy size={20} />;
                                      }
                                      return <Trophy size={20} />;
                                    })()}
                                  </div>
                                  <div>
                                    <h4 className="fw-semibold mb-1" style={{ fontSize: "1rem" }}>
                                      {rec.scoreCat?.[0]?.snapshot?.scoringName || "Brak kategorii"}
                                    </h4>
                                  </div>
                                </div>
                                <div className="d-flex flex-column flex-md-row align-items-md-center gap-2 text-xs text-muted mb-2">
                                  <div
                                    style={isMobile ? { fontSize: "0.85rem" } : {}}
                                  >
                                    {formatDate(rec.scoreAddDate)} • {getMonthLabelFromKey(rec.miesiac)}
                                  </div>
                                  <div className="d-block d-md-none mt-1">
                                    <Badge bg="secondary" className="text-xs">
                                      {teamScouts.find(z => z.id === rec.scoreTeam?.[0]?.id)?.name || "?"}
                                    </Badge>
                                    {rec.scoreScout?.[0]?.snapshot?.name && rec.scoreScout?.[0]?.snapshot?.surname && (
                                      <Badge bg="success" className="text-xs ms-2">
                                        {rec.scoreScout[0].snapshot.name} {rec.scoreScout[0].snapshot.surname}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="d-none d-md-block ms-3">
                                    <Badge bg="secondary" className="text-xs">
                                      {teamScouts.find(z => z.id === rec.scoreTeam?.[0]?.id)?.name || "?"}
                                    </Badge>
                                    {rec.scoreScout?.[0]?.snapshot?.name && rec.scoreScout?.[0]?.snapshot?.surname && (
                                      <Badge bg="success" className="text-xs ms-2">
                                        {rec.scoreScout[0].snapshot.name} {rec.scoreScout[0].snapshot.surname}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="text-center flex-shrink-0 px-2">
                                <div className="fs-2 fw-bold text-primary">
                                  {rec.scoreValue}
                                </div>
                                <div className="text-xs text-muted">
                                  pkt
                                </div>
                              </div>
                              <div className="flex-shrink-0 d-flex flex-column gap-1 align-items-end">
                                <Button
                                  size="sm"
                                  variant="outline-secondary"
                                  onClick={() => openEditEntryModal(rec)}
                                  className="mb-1 d-flex align-items-center"
                                  title="Edytuj"
                                  style={{
                                    minWidth: !isMobile ? 75 : undefined,
                                    justifyContent: "flex-start",
                                    textAlign: "left",
                                  }}
                                >
                                  <Edit size={14} />
                                  {!isMobile && <span className="ms-1">Edytuj</span>}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => openDeleteEntryModal(rec)}
                                  className="d-flex align-items-center"
                                  title="Usuń"
                                  style={{
                                    minWidth: !isMobile ? 75 : undefined,
                                    justifyContent: "flex-start",
                                    textAlign: "left",
                                  }}
                                >
                                  <Trash2 size={14} />
                                  {!isMobile && <span className="ms-1">Usuń</span>}
                                </Button>
                                {rec.scoreInfo && (
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    className="mt-1 d-flex align-items-center"
                                    title="Pokaż uwagi"
                                    onClick={() => {
                                      setNotesHtml(rec.scoreInfo);
                                      setNotesTitle("Uwagi do wpisu");
                                      setShowNotesModal(true);
                                    }}
                                    style={{
                                      minWidth: !isMobile ? 75 : undefined,
                                      justifyContent: "flex-start",
                                      textAlign: "left",
                                    }}
                                  >
                                    <Info size={16} />
                                    {!isMobile && <span className="ms-1">Uwagi</span>}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Bulk edit modal */}
                      <Modal show={showBulkEditModal} onHide={() => setShowBulkEditModal(false)} centered container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}>
                        <Modal.Header closeButton>
                          <Modal.Title>Edytuj zaznaczone wpisy ({selectedHistoryIds.size})</Modal.Title>
                        </Modal.Header>
                        <Form onSubmit={handleBulkEditSubmit}>
                          <Modal.Body>
                            <Form.Group className="mb-3">
                              <Form.Label>Nowa klasyfikacja miesięczna (opcjonalnie)</Form.Label>
                              <Form.Select value={bulkEditMonth} onChange={e => setBulkEditMonth(e.target.value)}>
                                <option value="">Nie zmieniaj miesiąca</option>
                                {historyMonthOptions.map(opt => (
                                  <option key={opt.key} value={opt.key}>{opt.label}</option>
                                ))}
                              </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                              <Form.Label>Uwagi (nadpisz jeśli uzupełnione)</Form.Label>
                              <Form.Control as="textarea" rows={3} value={bulkEditNotes} onChange={e => setBulkEditNotes(e.target.value)} placeholder="Wprowadź nowe uwagi (opcjonalnie)" />
                            </Form.Group>
                            <div className="text-muted small">Masowa edycja obsługuje zmianę miesiąca i uwag. Jeśli chcesz bardziej zaawansowanej edycji (kategoria/punkty), użyj indywidualnej edycji.</div>
                          </Modal.Body>
                          <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowBulkEditModal(false)}>Anuluj</Button>
                            <Button type="submit" variant="primary" disabled={bulkActionLoading || selectedHistoryIds.size === 0}>
                              Zapisz zmiany
                            </Button>
                          </Modal.Footer>
                        </Form>
                      </Modal>
                    <Modal show={showNotesModal} 
                          onHide={() => setShowNotesModal(false)} 
                          centered
                          container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}>
                      <Modal.Header closeButton>
                        <Modal.Title>{notesTitle}</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <div dangerouslySetInnerHTML={{ __html: notesHtml }} />
                      </Modal.Body>
                    </Modal>
                    {totalHistoryPages > 1 && (
                      <div className="d-flex justify-content-center mt-3">
                        <Pagination>
                          <Pagination.First onClick={() => setHistoryCurrentPage(1)} disabled={historyCurrentPage === 1} />
                          <Pagination.Prev onClick={() => setHistoryCurrentPage(p => Math.max(1, p - 1))} disabled={historyCurrentPage === 1} />
                          {Array.from({ length: totalHistoryPages }).map((_, i) => (
                            <Pagination.Item
                              key={i + 1}
                              active={historyCurrentPage === i + 1}
                              onClick={() => setHistoryCurrentPage(i + 1)}
                            >
                              {i + 1}
                            </Pagination.Item>
                          ))}
                          <Pagination.Next onClick={() => setHistoryCurrentPage(p => Math.min(totalHistoryPages, p + 1))} disabled={historyCurrentPage === totalHistoryPages} />
                          <Pagination.Last onClick={() => setHistoryCurrentPage(totalHistoryPages)} disabled={historyCurrentPage === totalHistoryPages} />
                        </Pagination>
                      </div>
                    )}
                    <Modal show={showCatDesc} 
                          onHide={() => setShowCatDesc(false)} 
                          centered
                          container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}>
                      <Modal.Header closeButton>
                        <Modal.Title>{catDescTitle}</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <div dangerouslySetInnerHTML={{ __html: catDescHtml }} />
                      </Modal.Body>
                    </Modal>
                    <Modal show={showEditEntryModal} 
                        onHide={closeEditEntryModal} 
                        centered
                        container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}>
                      <Modal.Header closeButton>
                        <Modal.Title>Edytuj wpis punktacji</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        <Modal.Body>
                          {editEntrySuccess ? (
                            <Alert variant="success" className="mb-0">
                              Wpis został zaktualizowany.
                            </Alert>
                          ) : editEntryData && (
                            <Form onSubmit={handleEditEntrySubmit}>
                              <Form.Group className="mb-3">
                                <Form.Label>Zastęp</Form.Label>
                                <Form.Select value={editScoutId || ""} disabled>
                                  <option>Wybierz zastęp</option>
                                  {teamScouts.map((scout) => (
                                    <option key={scout.id} value={scout.id}>{scout.name}</option>
                                  ))}
                                </Form.Select>
                              </Form.Group>
                              <Form.Group className="mb-3">
                                <Form.Label>Kategoria</Form.Label>
                                <Form.Select
                                  value={editCategoryId}
                                  onChange={e => setEditCategoryId(e.target.value)}
                                  required
                                >
                                  <option value="">Wybierz kategorię</option>
                                  {scoringCategories.map(cat => (
                                    <option key={cat.id} value={cat.id}>
                                      {cat.scoringName}
                                    </option>
                                  ))}
                                </Form.Select>
                                {editCategoryId && (
                                  <div className="text-muted mt-1" style={{ fontSize: "0.95rem", paddingTop: "0.5rem" }}>
                                    <span dangerouslySetInnerHTML={{ __html: scoringCategories.find(cat => cat.id === editCategoryId)?.scoringDesc }} />
                                  </div>
                                )}
                              </Form.Group>
                              {editCategoryId && scoringCategories.find(cat => cat.id === editCategoryId)?.scoringScoutInd && (
                                <Form.Group className="mb-3">
                                  <Form.Label>Harcerz</Form.Label>
                                  <Form.Select
                                    value={editScoutPersonId}
                                    onChange={e => setEditScoutPersonId(e.target.value)}
                                    required={scoringCategories.find(cat => cat.id === editCategoryId)?.scoringScoutInd}
                                    disabled={!scoringCategories.find(cat => cat.id === editCategoryId)?.scoringScoutInd}
                                  >
                                    <option value="">Wybierz harcerza</option>
                                    {zastepy.find(z => z.id === editScoutId)?.harcerze?.map(h => (
                                      <option key={h.id} value={h.id}>{h.name} {h.surname}</option>
                                    ))}
                                  </Form.Select>
                                </Form.Group>
                              )}
                              <Row>
                                <Col>
                                  <Form.Group className="mb-3">
                                    <Form.Label>
                                      Punkty ({editCategoryId && scoringCategories.find(cat => cat.id === editCategoryId)?.scoringMaxVal
                                        ? `1-${scoringCategories.find(cat => cat.id === editCategoryId).scoringMaxVal}`
                                        : "1-10"})
                                    </Form.Label>
                                    <Form.Control
                                      type="number"
                                      min={1}
                                      max={editCategoryId && scoringCategories.find(cat => cat.id === editCategoryId)?.scoringMaxVal
                                        ? scoringCategories.find(cat => cat.id === editCategoryId).scoringMaxVal
                                        : 10}
                                      value={editPoints}
                                      onChange={e => setEditPoints(e.target.value)}
                                      required
                                    />
                                  </Form.Group>
                                </Col>
                                <Col>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Klasyfikacja miesięczna</Form.Label>
                                    <Form.Select
                                      value={editMonth}
                                      onChange={e => setEditMonth(e.target.value)}
                                      required
                                    >
                                      <option value="">Wybierz miesiąc</option>
                                      <option value="202509">wrzesień 2025</option>
                                      <option value="202510">październik 2025</option>
                                      <option value="202511">listopad 2025</option>
                                      <option value="202512">grudzień 2025</option>
                                      <option value="202601">styczeń 2026</option>
                                      <option value="202602">luty 2026</option>
                                      <option value="202603">marzec 2026</option>
                                      <option value="202604">kwiecień 2026</option>
                                      <option value="202605">maj 2026</option>
                                      <option value="202606">czerwiec 2026</option>
                                    </Form.Select>
                                  </Form.Group>
                                </Col>
                              </Row>
                              <Form.Group className="mb-3">
                                <Form.Label>Uwagi (opcjonalnie)</Form.Label>
                                <Form.Control
                                  as="textarea"
                                  rows={2}
                                  value={editNotes}
                                  onChange={e => setEditNotes(e.target.value)}
                                  placeholder="Dodaj uwagi do wpisu (opcjonalnie)"
                                />
                              </Form.Group>
                              <Button
                                type="submit"
                                variant="primary"
                                className="w-100"
                                disabled={
                                  !editCategoryId ||
                                  !editScoutId ||
                                  !editPoints ||
                                  !editMonth ||
                                  (scoringCategories.find(cat => cat.id === editCategoryId)?.scoringScoutInd && !editScoutPersonId)
                                }
                              >
                                Zapisz zmiany
                              </Button>
                            </Form>
                          )}
                        </Modal.Body>
                      </Modal.Body>
                    </Modal>
                    <Modal show={showDeleteEntryModal} 
                          onHide={closeDeleteEntryModal} 
                          centered
                          container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}>
                      <Modal.Header closeButton>
                        <Modal.Title>Usuń wpis punktacji</Modal.Title>
                      </Modal.Header>
                      <Modal.Body>
                        {deleteEntrySuccess ? (
                          <Alert variant="success" className="mb-0">
                            Wpis został usunięty.
                          </Alert>
                        ) : deleteEntryData && (
                          <>
                            <Alert variant="danger">
                              Czy na pewno chcesz usunąć ten wpis punktacji?
                            </Alert>
                            <div className="mb-2">
                              <b>Zastęp:</b> {teamScouts.find(z => z.id === deleteEntryData.scoreTeam?.[0]?.id)?.name || "?"}<br />
                              <b>Kategoria:</b> {deleteEntryData.scoreCat?.[0]?.snapshot?.scoringName || "Brak"}<br />
                              <b>Punkty:</b> {deleteEntryData.scoreValue}<br />
                              <b>Data:</b> {formatDate(deleteEntryData.scoreAddDate)}<br />
                              <b>Miesiąc:</b> {getMonthLabelFromKey(deleteEntryData.miesiac)}
                            </div>
                            <Button variant="danger" className="w-100" onClick={handleDeleteEntryConfirm}>
                              Potwierdź usunięcie
                            </Button>
                          </>
                        )}
                      </Modal.Body>
                    </Modal>
                  </>
                )}
              </Card.Body>
            </Card>
          </Container>
        )}
            {tab === "settings" && (
        <Card style={darkMode ? darkCardStyle : {}}>
          <Card.Header className="d-flex align-items-center gap-2">
            <Settings size={20} className="me-2" />
            <span className="fw-semibold">Ustawienia</span>
          </Card.Header>
          <Card.Body>

            {/* Nowa karta: Główne ustawienia */}
                          {userWeb?.admin === true && (
              <Card className="mb-4" style={darkMode ? darkCardStyle : {}}>
                <Card.Header className="d-flex align-items-center gap-2">
                  <Settings size={20} className="me-2" />
                  <span className="fw-semibold">Główne ustawienia</span>
                </Card.Header>
                <Card.Body>
                  <Form>
                    <Form.Check
                      type="switch"
                      id="advanced-add-points-switch"
                      label="Wyświetlaj zaawansowane okna dodawania punktacji"
                      checked={advancedAddPoints}
                      onChange={e => handleAdvancedAddPointsToggle(e.target.checked)}
                      style={{ fontWeight: 500, fontSize: "1.1rem" }}
                    />
                    <div className="text-muted mt-2" style={{ fontSize: "0.95rem" }}>
                      Jeśli wyłączysz tę opcję, po kliknięciu „Dodaj punkty” w sekcji Moje zastępy od razu otworzy się zwykłe okno dodawania punktów.
                    </div>
                    <Form.Check
                      type="switch"
                      id="auto-suggest-month-switch"
                      label="Automatycznie proponuj obecny miesiąc przy dodawaniu punktacji"
                      checked={autoSuggestCurrentMonth}
                      onChange={e => handleAutoSuggestToggle(e.target.checked)}
                      style={{ fontWeight: 500, fontSize: "1.1rem", marginTop: 12 }}
                    />
                    <Form.Check
                      type="switch"
                      id="enable-bulk-actions-switch"
                      label="Wyświetlaj przyciski akcji masowych w historii wpisów"
                      checked={enableBulkActionsInHistory}
                      onChange={e => handleEnableBulkActionsToggle(e.target.checked)}
                      style={{ fontWeight: 500, fontSize: "1.1rem", marginTop: 12 }}
                  />
                  </Form>
                </Card.Body>
              </Card>
            )}
            {/* Karta: Funkcje eksperymentalne */}
            <Card className="mb-4" style={darkMode ? darkCardStyle : {}}>
              <Card.Header className="d-flex align-items-center gap-2">
                <Info size={20} className="me-2" />
                <span className="fw-semibold">Funkcje eksperymentalne (w trakcie rozwoju lub testowania)</span>
              </Card.Header>
              <Card.Body>
                <Form>
                  <Form.Check
                    type="switch"
                    id="notifications-switch"
                    label="Włącz powiadomienia push"
                    checked={notificationsEnabled}
                    onChange={e => handleNotificationToggle(e.target.checked)}
                    disabled={!user}
                    style={{ fontWeight: 500, fontSize: "1.1rem" }}
                  />
                  {!user && (
                    <div className="text-muted mt-2" style={{ fontSize: "0.95rem" }}>
                      Zaloguj się, aby włączyć powiadomienia.
                    </div>
                  )}
                  <Form.Check
                    type="switch"
                    id="darkmode-switch"
                    label="Włącz tryb ciemny"
                    checked={darkMode}
                    onChange={() => setDarkMode((v) => !v)}
                    style={{ fontWeight: 500, fontSize: "1.1rem", marginTop: 16 }}
                  />
                </Form>
              </Card.Body>
            </Card>
            {/* Przeniesiona karta zgłoś błąd */}
            <Card className="mb-4" style={darkMode ? darkCardStyle : {}}>
              <Card.Header className="d-flex align-items-center gap-2">
                <AlertTriangle size={20} className="me-2" />
                <span className="fw-semibold">Zgłoś błąd lub sugestię</span>
              </Card.Header>
              <Card.Body>
                <div className="text-center text-muted py-5">
                  <div>
                    Formularz zgłaszania błędów będzie dostępny wkrótce.<br />
                    <span className="mt-2 d-block">
                      Na razie prosimy o zgłoszenia mailowo na adres:{" "}
                      <a href="mailto:lukasz.bombala@zhr.pl" style={{ color: "#0d7337", textDecoration: "underline" }}>
                        lukasz.bombala@zhr.pl
                      </a>
                    </span>
                  </div>
                </div>
              </Card.Body>
                </Card>
              </Card.Body>
            </Card>
          )}

          {/* Sekcja Audyt dla audytora */}
        {tab === "audit" && (
          <Card style={darkMode ? darkCardStyle : {}}>
            <Card.Header className="d-flex align-items-center gap-2">
              <AlertTriangle size={20} className="me-2" />
              <span className="fw-semibold">Audyt</span>
            </Card.Header>
            <Card.Body>
              <h5 className="mb-4 fw-semibold">
                Wpisy dodane po terminie
              </h5>
              {configSettings === null ? (
                <div className="text-muted py-4 text-center">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Ładowanie ustawień audytu...
                </div>
              ) : flaggedEntries.length === 0 ? (
                <div className="text-muted py-4 text-center">
                  Brak wpisów dodanych po terminie.
                </div>
              ) : (
                <Table bordered hover responsive style={darkMode ? darkTableStyle : {}}>
              <thead>
                <tr>
                  <th>Zastęp</th>
                  <th>Drużyna</th>
                  <th>Kategoria</th>
                  <th>Miesiąc</th>
                  <th>Dodano</th>
                  <th>Przekroczono</th>
                  <th>Ostatni modyfikujący</th>
                </tr>
              </thead>
              <tbody>
                {flaggedEntries.map(rec => {
                  const year = parseInt(rec.miesiac.slice(0, 4), 10);
                  const month = parseInt(rec.miesiac.slice(4, 6), 10);
                  let nextMonth = month + 1;
                  let nextYear = year;
                  if (nextMonth > 12) {
                    nextMonth = 1;
                    nextYear += 1;
                  }
                  const deadlineDate = new Date(nextYear, nextMonth - 1, deadlineDayOfMonth, 23, 59, 59, 999);
                  let addDate;
                  if (typeof rec.scoreAddDate === "object" && rec.scoreAddDate.seconds) {
                    addDate = new Date(rec.scoreAddDate.seconds * 1000);
                  } else if (typeof rec.scoreAddDate === "string") {
                    addDate = new Date(rec.scoreAddDate);
                  }
                  // Wylicz przekroczenie w godzinach
                  let przekroczono = "-";
                  if (addDate && deadlineDate && addDate > deadlineDate) {
                    const diffMs = addDate.getTime() - deadlineDate.getTime();
                    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
                    przekroczono = `${diffHours} h`;
                  }
                  return (
                    <tr key={rec.id}>
                      <td>{rec.scoreTeam?.[0]?.snapshot?.fullName || rec.scoreTeam?.[0]?.snapshot?.name || "-"}</td>
                      <td>{rec.scoreTeam?.[0]?.snapshot?.teamName || rec.scoreTeam?.[0]?.snapshot?.druzyna || "-"}</td>
                      <td>{rec.scoreCat?.[0]?.snapshot?.scoringName || "-"}</td>
                      <td>{getMonthLabelFromKey(rec.miesiac)}</td>
                      <td>
                        {addDate
                          ? addDate.toLocaleDateString("pl-PL") + " " + addDate.toLocaleTimeString("pl-PL")
                          : "-"}
                      </td>
                      <td>{przekroczono}</td>
                      <td>{rec.scoreModifiedBy || "-"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
              )}
              <div className="mt-3 text-muted" style={{ fontSize: "0.95em" }}>
                Wpis za dany miesiąc należy dodać do końca dnia <b>{deadlineDayOfMonth}</b> dnia miesiąca kolejnego.<br />
                Aplikacja sprawdza wpisy dodane po tym terminie i oflagowuje je powyżej.
              </div>
            </Card.Body>
          </Card>
        )}

        {/* .Tab administracyjny */}
        {tab === "admin" && userWeb?.admin === true && (
          <Card style={darkMode ? darkCardStyle : {}}>
            <Card.Header className="d-flex align-items-center gap-2">
              <Settings size={20} className="me-2" />
              <span className="fw-semibold">Administracja</span>
            </Card.Header>
            <Card.Body>
              <div className="text-center text-muted py-5">
                Panel administracyjny w przygotowaniu.
              </div>
            </Card.Body>
          </Card>
        )}
        </div>
      </Container>
    </div>
  );
}