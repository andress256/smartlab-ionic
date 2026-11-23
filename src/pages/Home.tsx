import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  IonBadge,
  IonButton,
  IonButtons,
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonList,
  IonModal,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
  RefresherEventDetail,
} from '@ionic/react';
import {
  addOutline,
  alertCircleOutline,
  arrowUndoOutline,
  checkmarkCircleOutline,
  closeOutline,
  layersOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { FilterOption, Incident, IncidentPriority } from '../types/incident';

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'INC-101',
    title: 'Fallo de enlace en Switch Rack B',
    location: 'Aula 204 - Redes',
    description: 'Pérdida intermitente de paquetes en puertos Gigabit 12 al 16.',
    priority: 'alta',
    status: 'pendiente',
    createdAt: '09:15',
  },
  {
    id: 'INC-102',
    title: 'Actualización de imágenes Docker',
    location: 'Laboratorio DAM 2',
    description: 'Desplegar imagen base Node 22 Alpine en estaciones de trabajo.',
    priority: 'media',
    status: 'pendiente',
    createdAt: '10:30',
  },
  {
    id: 'INC-103',
    title: 'Calibración de proyector láser',
    location: 'Aula Magna',
    description: 'Ajuste trapezoidal y verificación de entrada HDMI.',
    priority: 'baja',
    status: 'resuelta',
    createdAt: 'Ayer',
  },
];

/* ---------- Tokens visuales brutalistas (colores planos + texto negro, contraste AAA) ---------- */

const PRIORITY_TAG_STYLES: Record<IncidentPriority, string> = {
  alta: 'bg-red-400',
  media: 'bg-yellow-300',
  baja: 'bg-lime-300',
};

/** Clases comunes para el efecto "pulsar" brutalista: se levanta al pasar y se hunde al hacer clic. */
const PRESSABLE =
  'transition-all duration-150 ease-out motion-reduce:transition-none ' +
  'hover:-translate-x-0.5 hover:-translate-y-0.5 ' +
  'active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ' +
  'focus:outline-none focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-600';

const FILTER_OPTIONS: { value: FilterOption; label: string }[] = [
  { value: 'todas', label: 'Todas' },
  { value: 'pendiente', label: 'Pendientes' },
  { value: 'resuelta', label: 'Resueltas' },
];

type KpiKey = FilterOption | 'criticas';

const Home: React.FC = () => {
  // Estado principal de datos y controles UI
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('todas');
  const [onlyCritical, setOnlyCritical] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Estado controlado del formulario modal
  const [title, setTitle] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [priority, setPriority] = useState<IncidentPriority>('media');

  // Referencias: lista (cerrar deslizados) y primer campo del modal (foco con teclado)
  const listRef = useRef<HTMLIonListElement | null>(null);
  const titleInputRef = useRef<HTMLIonInputElement | null>(null);

  // Al abrir el modal, el foco pasa al primer campo tras la animación de entrada
  useEffect(() => {
    if (!isModalOpen) return;
    const timer = window.setTimeout(() => {
      void titleInputRef.current?.setFocus();
    }, 350);
    return () => window.clearTimeout(timer);
  }, [isModalOpen]);

  // Cálculo memoizado de indicadores KPI (CE 3.e: optimización de renderizado)
  const metrics = useMemo(() => {
    const total = incidents.length;
    const pending = incidents.filter((item) => item.status === 'pendiente').length;
    const resolved = incidents.filter((item) => item.status === 'resuelta').length;
    const critical = incidents.filter(
      (item) => item.status === 'pendiente' && item.priority === 'alta'
    ).length;
    return { total, pending, resolved, critical };
  }, [incidents]);

  // Filtrado combinado por estado, críticas y búsqueda textual
  const filteredIncidents = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return incidents.filter((item) => {
      const matchesStatus = activeFilter === 'todas' || item.status === activeFilter;
      const matchesCritical =
        !onlyCritical || (item.status === 'pendiente' && item.priority === 'alta');
      const matchesQuery =
        normalizedQuery === '' ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.location.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesCritical && matchesQuery;
    });
  }, [incidents, activeFilter, onlyCritical, searchQuery]);

  const pendingTitles = useMemo(
    () => incidents.filter((item) => item.status === 'pendiente').map((item) => item.title),
    [incidents]
  );

  // Las tarjetas KPI también funcionan como filtros rápidos
  const kpis: {
    key: KpiKey;
    label: string;
    value: number;
    icon: string;
    bg: string;
  }[] = [
    { key: 'todas', label: 'Total', value: metrics.total, icon: layersOutline, bg: 'bg-white' },
    { key: 'pendiente', label: 'Pendientes', value: metrics.pending, icon: timeOutline, bg: 'bg-pink-300' },
    { key: 'criticas', label: 'Críticas', value: metrics.critical, icon: alertCircleOutline, bg: 'bg-red-400' },
    { key: 'resuelta', label: 'Resueltas', value: metrics.resolved, icon: checkmarkCircleOutline, bg: 'bg-lime-300' },
  ];

  const isKpiActive = (key: KpiKey) =>
    key === 'criticas' ? onlyCritical : !onlyCritical && activeFilter === key;

  const handleKpiClick = (key: KpiKey) => {
    if (key === 'criticas') {
      setActiveFilter('todas');
      setOnlyCritical((prev) => !prev);
    } else {
      setOnlyCritical(false);
      setActiveFilter(key);
    }
  };

  const handleFilterClick = (value: FilterOption) => {
    setOnlyCritical(false);
    setActiveFilter(value);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setActiveFilter('todas');
    setOnlyCritical(false);
  };

  // Gesto nativo Pull-to-Refresh
  const handleRefresh = (event: CustomEvent<RefresherEventDetail>) => {
    setTimeout(() => {
      setToastMessage('Estado sincronizado con el servidor');
      event.detail.complete();
    }, 700);
  };

  // Alternar estado pendiente / resuelta
  const handleToggleStatus = async (id: string) => {
    setIncidents((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'pendiente' ? 'resuelta' : 'pendiente' }
          : item
      )
    );
    await listRef.current?.closeSlidingItems();
    setToastMessage('Estado de incidencia actualizado');
  };

  // Eliminación de elemento
  const handleDeleteIncident = async (id: string) => {
    setIncidents((prev) => prev.filter((item) => item.id !== id));
    await listRef.current?.closeSlidingItems();
    setToastMessage(`Incidencia ${id} eliminada`);
  };

  // Creación de nueva incidencia desde IonModal
  const handleCreateIncident = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title.trim() || !location.trim()) {
      setToastMessage('El título y la ubicación son obligatorios');
      return;
    }

    const newIncident: Incident = {
      id: `INC-${Math.floor(104 + Math.random() * 895)}`,
      title: title.trim(),
      location: location.trim(),
      description: description.trim() || 'Sin observaciones adicionales.',
      priority,
      status: 'pendiente',
      createdAt: new Date().toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setIncidents((prev) => [newIncident, ...prev]);
    setTitle('');
    setLocation('');
    setDescription('');
    setPriority('media');
    setIsModalOpen(false);
    setToastMessage(`Incidencia ${newIncident.id} registrada`);
  };

  return (
    <IonPage>
      {/* Cabecera negra con contador dinámico */}
      <IonHeader className="ion-no-border border-b-4 border-black">
        <IonToolbar className="brutal-toolbar">
          <IonTitle className="font-mono text-base font-bold uppercase tracking-widest">
            SmartLab//Monitor
          </IonTitle>
          <IonButtons slot="end">
            <div className="mr-3 flex items-center gap-2">
              <span className="hidden font-mono text-xs font-bold uppercase text-yellow-300 sm:inline">
                Pendientes
              </span>
              <IonBadge
                className="rounded-none border-2 border-yellow-300 bg-black px-2.5 py-1 font-mono font-bold text-yellow-300"
                style={{ '--background': '#000', '--color': '#fde047' } as React.CSSProperties}
                aria-label={`${metrics.pending} incidencias pendientes`}
              >
                {metrics.pending}
              </IonBadge>
            </div>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {/* Control táctil Pull-to-Refresh */}
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent
            pullingText="Desliza para actualizar"
            refreshingSpinner="crescent"
            refreshingText="Sincronizando..."
          />
        </IonRefresher>

        {/* ===== HERO: ocupa una fracción del alto de pantalla (vh) ===== */}
        <section
          aria-labelledby="hero-title"
          className="relative flex min-h-[42vh] flex-col justify-end overflow-hidden border-b-4 border-black bg-yellow-300 px-4 pb-8 pt-10 sm:px-6 md:min-h-[45vh] lg:min-h-[50vh] lg:px-10"
        >
          {/* Bloques decorativos geométricos */}
          <div
            aria-hidden="true"
            className="absolute -right-10 top-6 hidden h-[22vh] w-[22vh] rotate-12 border-4 border-black bg-pink-400 shadow-brutal-lg md:block"
          />
          <div
            aria-hidden="true"
            className="absolute right-[18vh] top-[16vh] hidden h-[10vh] w-[10vh] rounded-full border-4 border-black bg-cyan-300 shadow-brutal lg:block"
          />

          <div className="relative mx-auto w-full max-w-7xl">
            <p className="inline-block border-2 border-black bg-white px-2 py-1 font-mono text-xs font-bold uppercase tracking-widest">
              // Panel de incidencias · DAM 0488
            </p>
            <h1
              id="hero-title"
              className="mt-4 font-display text-[clamp(2.75rem,10vw,7rem)] font-bold uppercase leading-[0.85] tracking-tighter"
            >
              Smart
              <br />
              Lab<span className="text-pink-600">_</span>
            </h1>
            <p className="mt-5 max-w-xl text-base font-medium sm:text-lg">
              Registra, filtra y resuelve las incidencias técnicas del centro en tiempo real.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className={`inline-flex min-h-12 items-center gap-2 border-4 border-black bg-black px-5 font-mono text-sm font-bold uppercase text-yellow-300 shadow-[6px_6px_0_0_#f472b6] hover:shadow-[9px_9px_0_0_#f472b6] ${PRESSABLE}`}
              >
                <IonIcon icon={addOutline} aria-hidden="true" className="text-xl" />
                Nueva incidencia
              </button>
              <a
                href="#listado"
                className={`inline-flex min-h-12 items-center border-4 border-black bg-white px-5 font-mono text-sm font-bold uppercase shadow-brutal hover:shadow-brutal-lg ${PRESSABLE}`}
              >
                Ver listado ↓
              </a>
            </div>
          </div>
        </section>

        {/* ===== Cinta con las incidencias pendientes (decorativa, se detiene con reduced-motion) ===== */}
        <div
          aria-hidden="true"
          className="overflow-hidden border-b-4 border-black bg-black py-2 font-mono text-sm font-bold uppercase text-yellow-300"
        >
          <div className="flex w-max animate-marquee gap-10 whitespace-nowrap motion-reduce:animate-none">
            {[0, 1].map((copy) => (
              <div key={copy} className="flex gap-10">
                {(pendingTitles.length > 0 ? pendingTitles : ['Sin incidencias pendientes']).map(
                  (text, index) => (
                    <span key={`${copy}-${index}`}>
                      ⚠ {text}
                    </span>
                  )
                )}
                <span>★ {metrics.pending} pendientes</span>
              </div>
            ))}
          </div>
        </div>

        {/* ===== Contenido principal ===== */}
        <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-10">
          {/* Bloque 1: KPIs (también son filtros rápidos) */}
          <section aria-labelledby="kpi-title" className="mb-10">
            <h2
              id="kpi-title"
              className="mb-4 inline-block bg-black px-2 py-1 font-mono text-xs font-bold uppercase tracking-widest text-white"
            >
              Estado operativo del centro
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {kpis.map((kpi) => {
                const active = isKpiActive(kpi.key);
                return (
                  <button
                    key={kpi.key}
                    type="button"
                    onClick={() => handleKpiClick(kpi.key)}
                    aria-pressed={active}
                    aria-label={`${kpi.label}: ${kpi.value}. Filtrar listado`}
                    className={`flex min-h-[16vh] flex-col justify-between border-4 border-black p-4 text-left ${kpi.bg} ${PRESSABLE} ${
                      active
                        ? 'translate-x-[6px] translate-y-[6px] shadow-none outline-dashed outline-2 outline-offset-[-10px] outline-black'
                        : 'shadow-brutal hover:shadow-brutal-lg'
                    }`}
                  >
                    <span className="flex w-full items-center justify-between font-mono text-xs font-bold uppercase sm:text-sm">
                      {kpi.label}
                      <IonIcon icon={kpi.icon} aria-hidden="true" className="text-xl" />
                    </span>
                    <span className="mt-3 font-display text-4xl font-bold leading-none sm:text-5xl lg:text-6xl">
                      {kpi.value}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-10">
            {/* Bloque 2: Búsqueda y filtros (columna lateral fija en escritorio) */}
            <section
              aria-label="Filtros de búsqueda"
              className="mb-8 space-y-4 lg:sticky lg:top-6 lg:max-h-[80vh] lg:overflow-y-auto lg:border-4 lg:border-black lg:bg-white lg:p-5 lg:shadow-brutal"
            >
              <h2 className="hidden font-mono text-xs font-bold uppercase tracking-widest lg:block">
                Buscar / filtrar
              </h2>

              <div className="border-4 border-black bg-white shadow-brutal transition-shadow focus-within:shadow-brutal-lg">
                <IonSearchbar
                  value={searchQuery}
                  onIonInput={(e) => setSearchQuery(e.detail.value ?? '')}
                  placeholder="Código, título o aula"
                  debounce={200}
                  className="brutal-search"
                  aria-label="Buscar incidencias"
                />
              </div>

              <div
                role="group"
                aria-label="Filtrar por estado"
                className="grid grid-cols-3 border-4 border-black bg-white shadow-brutal"
              >
                {FILTER_OPTIONS.map((option, index) => {
                  const active = !onlyCritical && activeFilter === option.value;
                  const count =
                    option.value === 'todas'
                      ? metrics.total
                      : option.value === 'pendiente'
                        ? metrics.pending
                        : metrics.resolved;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleFilterClick(option.value)}
                      aria-pressed={active}
                      className={`min-h-12 px-1 font-mono text-[11px] font-bold uppercase transition-colors focus:outline-none focus-visible:outline focus-visible:outline-4 focus-visible:-outline-offset-4 focus-visible:outline-blue-600 sm:text-xs ${
                        index > 0 ? 'border-l-4 border-black' : ''
                      } ${active ? 'bg-black text-yellow-300' : 'bg-white text-black hover:bg-yellow-200'}`}
                    >
                      {option.label}
                      <span className="block text-base">{count}</span>
                    </button>
                  );
                })}
              </div>

              {onlyCritical && (
                <p className="animate-pop-in border-4 border-black bg-red-400 p-3 font-mono text-xs font-bold uppercase">
                  Mostrando solo críticas pendientes
                </p>
              )}
            </section>

            {/* Bloque 3: Listado interactivo con gestos laterales (IonItemSliding) */}
            <section id="listado" aria-labelledby="list-title" className="scroll-mt-6">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                <h2
                  id="list-title"
                  className="font-display text-2xl font-bold uppercase leading-none sm:text-3xl"
                >
                  Incidencias <span className="bg-black px-2 text-yellow-300">{filteredIncidents.length}</span>
                </h2>
                <span className="font-mono text-xs font-bold uppercase">
                  <span className="lg:hidden">← Desliza para acciones</span>
                  <span className="hidden lg:inline">Clic en “+ info” para ampliar</span>
                </span>
              </div>

              {filteredIncidents.length === 0 ? (
                <div className="flex min-h-[30vh] animate-pop-in flex-col items-center justify-center gap-4 border-4 border-dashed border-black bg-white p-8 text-center">
                  <p className="font-display text-4xl font-bold uppercase">0 resultados</p>
                  <p className="text-sm font-medium">
                    Ninguna incidencia coincide con el filtro aplicado.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className={`min-h-11 border-4 border-black bg-yellow-300 px-4 font-mono text-xs font-bold uppercase shadow-brutal hover:shadow-brutal-lg ${PRESSABLE}`}
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : (
                <IonList
                  ref={listRef}
                  lines="none"
                  className="brutal-list grid gap-6 p-0 pb-2 pr-2 md:grid-cols-2"
                >
                  {filteredIncidents.map((incident) => {
                    const isResolved = incident.status === 'resuelta';
                    const isExpanded = expandedId === incident.id;
                    return (
                      <IonItemSliding
                        key={incident.id}
                        className={`animate-pop-in border-4 border-black shadow-brutal transition-all duration-150 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-brutal-lg motion-reduce:transition-none ${
                          isResolved ? 'bg-stone-200' : 'bg-white'
                        }`}
                      >
                        <IonItem className="brutal-item">
                          <div className="w-full py-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="bg-black px-1.5 py-0.5 font-mono text-xs font-bold text-white">
                                  {incident.id}
                                </span>
                                <span
                                  className={`border-2 border-black px-2 py-0.5 font-mono text-xs font-bold uppercase ${
                                    PRIORITY_TAG_STYLES[incident.priority]
                                  }`}
                                >
                                  {incident.priority}
                                </span>
                              </div>
                              <span className="font-mono text-xs font-bold">
                                {incident.createdAt}
                              </span>
                            </div>

                            <h3
                              className={`mt-3 break-words font-display text-lg font-bold leading-tight sm:text-xl ${
                                isResolved ? 'line-through decoration-4' : ''
                              }`}
                            >
                              {incident.title}
                            </h3>

                            {/* Panel desplegable con animación de altura */}
                            <div
                              id={`detalle-${incident.id}`}
                              className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
                                isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                              }`}
                            >
                              <div className="overflow-hidden">
                                <p className="mt-2 border-l-4 border-black pl-3 text-sm">
                                  {incident.description}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t-4 border-black pt-3">
                              <span className="min-w-0 break-words font-mono text-xs font-bold uppercase">
                                📍 {incident.location}
                              </span>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setExpandedId(isExpanded ? null : incident.id)}
                                  aria-expanded={isExpanded}
                                  aria-controls={`detalle-${incident.id}`}
                                  className={`min-h-11 min-w-11 border-2 border-black bg-cyan-300 px-2 font-mono text-xs font-bold uppercase shadow-brutal-sm ${PRESSABLE}`}
                                >
                                  {isExpanded ? '− info' : '+ info'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStatus(incident.id)}
                                  aria-label={`Marcar ${incident.id} como ${isResolved ? 'pendiente' : 'resuelta'}`}
                                  className={`min-h-11 border-2 border-black px-3 font-mono text-xs font-bold uppercase shadow-brutal-sm ${PRESSABLE} ${
                                    isResolved ? 'bg-lime-300' : 'bg-pink-300'
                                  }`}
                                >
                                  {isResolved ? '✓ Resuelta' : '● Pendiente'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </IonItem>

                        {/* Opciones ocultas tras deslizamiento horizontal */}
                        <IonItemOptions side="end" className="border-l-4 border-black">
                          <IonItemOption
                            onClick={() => handleToggleStatus(incident.id)}
                            aria-label={isResolved ? 'Reabrir incidencia' : 'Marcar como resuelta'}
                            style={{ '--background': '#bef264', '--color': '#000' } as React.CSSProperties}
                          >
                            <IonIcon
                              slot="icon-only"
                              icon={isResolved ? arrowUndoOutline : checkmarkCircleOutline}
                            />
                          </IonItemOption>
                          <IonItemOption
                            onClick={() => handleDeleteIncident(incident.id)}
                            aria-label="Eliminar incidencia"
                            className="border-l-4 border-black"
                            style={{ '--background': '#f87171', '--color': '#000' } as React.CSSProperties}
                          >
                            <IonIcon slot="icon-only" icon={trashOutline} />
                          </IonItemOption>
                        </IonItemOptions>
                      </IonItemSliding>
                    );
                  })}
                </IonList>
              )}
            </section>
          </div>
        </main>

        {/* ===== Pie con altura mínima relativa al viewport ===== */}
        <footer className="flex min-h-[14vh] flex-col justify-center gap-1 border-t-4 border-black bg-black px-4 pb-24 pt-6 font-mono text-xs font-bold uppercase text-yellow-300 sm:px-6 lg:px-10 lg:pb-6">
          <div className="mx-auto w-full max-w-7xl">
            <p>SmartLab Monitor — Desarrollo de Interfaces (0488)</p>
            <p className="text-white">Ionic React · TypeScript · Tailwind CSS</p>
          </div>
        </footer>

        {/* Botón de acción flotante (FAB) en móvil/tablet (área >= 48x48px) */}
        <IonFab slot="fixed" vertical="bottom" horizontal="end" className="mb-3 mr-3 lg:hidden">
          <IonFabButton
            className="brutal-fab"
            onClick={() => setIsModalOpen(true)}
            aria-label="Registrar nueva incidencia"
          >
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* Modal de alta de nueva incidencia */}
        <IonModal
          className="brutal-modal"
          isOpen={isModalOpen}
          onDidDismiss={() => setIsModalOpen(false)}
        >
          <IonHeader className="ion-no-border border-b-4 border-black">
            <IonToolbar className="brutal-toolbar">
              <IonTitle className="font-mono text-base font-bold uppercase">
                Nueva incidencia
              </IonTitle>
              <IonButtons slot="end">
                <IonButton
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Cerrar formulario"
                  style={{ '--color': '#fde047' } as React.CSSProperties}
                >
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>

          <IonContent className="ion-padding" style={{ '--background': '#fef9c3' } as React.CSSProperties}>
            <form onSubmit={handleCreateIncident} className="space-y-5" noValidate>
              <IonItem lines="none" className="brutal-field border-4 border-black shadow-brutal-sm">
                <IonInput
                  ref={titleInputRef}
                  label="Título de la incidencia *"
                  labelPlacement="stacked"
                  placeholder="Ej. Error de compilación en SDK"
                  value={title}
                  onIonInput={(e) => setTitle(e.detail.value ?? '')}
                  required
                />
              </IonItem>

              <IonItem lines="none" className="brutal-field border-4 border-black shadow-brutal-sm">
                <IonInput
                  label="Aula o Ubicación *"
                  labelPlacement="stacked"
                  placeholder="Ej. Laboratorio 102"
                  value={location}
                  onIonInput={(e) => setLocation(e.detail.value ?? '')}
                  required
                />
              </IonItem>

              <IonItem lines="none" className="brutal-field border-4 border-black shadow-brutal-sm">
                <IonSelect
                  label="Nivel de Prioridad"
                  labelPlacement="stacked"
                  value={priority}
                  onIonChange={(e) => setPriority(e.detail.value as IncidentPriority)}
                >
                  <IonSelectOption value="alta">Alta (Crítica)</IonSelectOption>
                  <IonSelectOption value="media">Media (Operativa)</IonSelectOption>
                  <IonSelectOption value="baja">Baja (Mantenimiento)</IonSelectOption>
                </IonSelect>
              </IonItem>

              <IonItem lines="none" className="brutal-field border-4 border-black shadow-brutal-sm">
                <IonTextarea
                  label="Descripción técnica"
                  labelPlacement="stacked"
                  rows={4}
                  placeholder="Detalla los síntomas observados..."
                  value={description}
                  onIonInput={(e) => setDescription(e.detail.value ?? '')}
                />
              </IonItem>

              {/* Botón nativo: también permite enviar con Enter */}
              <button
                type="submit"
                className={`w-full min-h-14 border-4 border-black bg-pink-400 font-mono text-base font-bold uppercase shadow-brutal hover:shadow-brutal-lg ${PRESSABLE}`}
              >
                Guardar incidencia →
              </button>
            </form>
          </IonContent>
        </IonModal>

        {/* Notificación Toast de confirmación */}
        <IonToast
          className="brutal-toast"
          isOpen={toastMessage !== null}
          message={toastMessage ?? ''}
          duration={2200}
          position="bottom"
          onDidDismiss={() => setToastMessage(null)}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
