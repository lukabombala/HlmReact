import { React, useState, useMemo, useEffect } from "react";
import {
  Card, Button, Form, Row, Col, Table, Badge, Modal, Container, Collapse, Alert, Spinner, Pagination
} from "react-bootstrap";
import { Settings, Trophy, Users, Plus, Filter, ChevronDown, ChevronUp, FileText, AlertTriangle, Edit2, Edit, Trash2, Info } from "lucide-react";
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

// Sidebar navigation items
const NAV = [
  { key: "team", label: "Moja drużyna", icon: <Users size={18} className="me-2" /> },
  { key: "history", label: "Historia wpisów", icon: <FileText size={18} className="me-2" /> },
  { key: "settings", label: "Ustawienia", icon: <Settings size={18} className="me-2" /> }, 
];

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
  const [showAddModal, setShowAddModal] = useState(false);
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

  function handleOpenAddModal(scoutId) {
    setAddScoutId(scoutId);
    setAddCategoryId("");         // resetuj kategorię
    setAddScoutPersonId("");      // resetuj harcerza
    setAddPoints("");             // resetuj punkty
    setAddMonth("");              // resetuj miesiąc
    setAddNotes("");              // resetuj uwagi
    setShowAddModal(true);
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

    setShowAddModal(false);

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
            {NAV.map((item) => (
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
      className="d-flex d-md-none justify-content-around align-items-stretch"
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
      }}
    >
      {NAV.map((item) => (
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
            flex: 1,
            height: "100%",
            minWidth: 0,
            padding: 0,
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
          {/* --- ŁADOWANIE DANYCH UŻYTKOWNIKA --- */}
          {(authLoading || userWebLoading) && (
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
          {!authLoading && !userWebLoading && tab === "team" && (
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
                        Edycja drużyny
                      </Button>
                    </Card.Header>
                    <Card.Body style={darkMode ? darkCardStyle : {}}>
                    <Row>
                      <Col md={3} className="d-flex align-items-center justify-content-center mb-3 mb-md-0">
                        <div className="fs-2 fw-bold text-primary me-3">{teamScouts.length}</div>
                        <div className="text-muted small">Zastępy</div>
                      </Col>
                      <Col md={3} className="d-flex align-items-center justify-content-center mb-3 mb-md-0">
                        <div className="fs-2 fw-bold text-primary me-3">{scoutsCount}</div>
                        <div className="text-muted small">Harcerzy</div>
                      </Col>
                      <Col md={3} className="d-flex align-items-center justify-content-center mb-3 mb-md-0">
                        <div className="fs-2 fw-bold text-primary me-3">{totalPoints}</div>
                        <div className="text-muted small">Łącznie punktów</div>
                      </Col>
                      <Col md={3} className="d-flex align-items-center justify-content-center">
                        <div className="fs-2 fw-bold text-primary me-3">{totalActivities}</div>
                        <div className="text-muted small">Wpisów ogółem</div>
                      </Col>
                    </Row>
                  </Card.Body>
                  </Card>

                  {/* Modal edycji drużyny */}
                  <Modal show={showEditModal} 
                         onHide={() => setShowEditModal(false)} 
                         centered
                         container={typeof window !== "undefined" ? document.body.querySelector('.panel-darkmode') : undefined}>
                    <Modal.Header closeButton>
                      <Modal.Title>Prośba o edycję danych drużyny</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                      {editSent ? (
                        <Alert variant="success" className="mb-0">
                          Prośba o edycję została wysłana do administratora.
                        </Alert>
                      ) : (
                        <Form onSubmit={handleEditSubmit}>
                          <Alert variant="info">
                            Zmiany w danych drużyny może wprowadzić tylko administrator strony.<br />
                            Opisz poniżej, jakie dane chcesz zmienić.
                          </Alert>
                          <Form.Group className="mb-3">
                            <Form.Label>Opis zmian</Form.Label>
                            <Form.Control
                              as="textarea"
                              rows={4}
                              required
                              value={editRequest}
                              onChange={e => setEditRequest(e.target.value)}
                              placeholder="Opisz, jakie dane drużyny wymagają zmiany..."
                            />
                          </Form.Group>
                          <Button type="submit" variant="primary" className="w-100">
                            Wyślij prośbę
                          </Button>
                        </Form>
                      )}
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
                                    </div>
                                  </div>
                                  <div className="d-flex flex-wrap gap-2 mb-2">

                                  <Badge
                                    bg="success"
                                    className="text-xs"
                                    style={{
                                      minWidth: 80,
                                      textAlign: "center",
                                      fontWeight: 500,
                                      border: darkMode ? "1px solid #333" : "1px solid #e5e7eb"
                                    }}
                                  >
                                    Punkty: {scout.points}
                                  </Badge>

                                  <Badge
                                    bg="secondary"
                                    className="text-xs"
                                    style={{
                                      minWidth: 80,
                                      textAlign: "center",
                                      fontWeight: 500,
                                      border: darkMode ? "1px solid #333" : "1px solid #e5e7eb"
                                    }}
                                  >
                                    Wpisów: {scout.activities}
                                  </Badge>

                                  <Badge
                                    bg="secondary"
                                    className="text-xs"
                                    style={{
                                      minWidth: 80,
                                      textAlign: "center",
                                      fontWeight: 500,
                                      border: darkMode ? "1px solid #333" : "1px solid #e5e7eb"
                                    }}
                                  >
                                    Pozycja: {ranking ? ranking.position : "-"}
                                  </Badge>
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
                                <div className="flex-shrink-0 d-flex flex-column gap-1 align-items-end">
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    title="Dodaj punkty"
                                    onClick={() => handleOpenAddModal(scout.id)}
                                  >
                                    <Plus size={16} className="me-1" />
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
                                  >
                                    <Info size={16} className="me-1" />
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

                  {/* Modal dodawania punktów */}
                  <Modal show={showAddModal} 
                      onHide={() => setShowAddModal(false)} 
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
                                className="ms-2"
                              >
                                Odśwież punktację
                              </Button>
                              <div className="text-muted ms-2">
                                Wyświetlono {paginatedHistoryRecords.length} z {totalHistoryRows} wpisów
                              </div>
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
                        <div className="text-muted mt-2">
                          Wyświetlono {paginatedHistoryRecords.length} z {totalHistoryRows} wpisów
                        </div>
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
                            <div className="d-flex align-items-start justify-content-between gap-4">
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
                                  className="mb-1"
                                  title="Edytuj"
                                >
                                  <Edit size={14} />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => openDeleteEntryModal(rec)}
                                  title="Usuń"
                                >
                                  <Trash2 size={14} />
                                </Button>
                                {rec.scoreInfo && (
                                  <Button
                                    size="sm"
                                    variant="outline-primary"
                                    className="mt-1"
                                    title="Pokaż uwagi"
                                    onClick={() => {
                                      setNotesHtml(rec.scoreInfo);
                                      setNotesTitle("Uwagi do wpisu");
                                      setShowNotesModal(true);
                                    }}
                                  >
                                    <Info size={16} />
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
            {/* Karta: Funkcje eksperymentalne */}
            <Card className="mb-4" style={darkMode ? darkCardStyle : {}}>
              <Card.Header className="d-flex align-items-center gap-2">
                <Info size={20} className="me-2" />
                <span className="fw-semibold">Funkcje eksperymentalne (w trakcie testowania)</span>
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
                <span className="fw-semibold">Zgłoś błąd</span>
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
        </div>
      </Container>
    </div>
  );
}