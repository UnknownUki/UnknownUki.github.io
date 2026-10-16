import { useEffect, useMemo, useState } from "react";

type Trophy = {
  id: string;
  name: string;
  count: number;
  odds: number;
  sprite: string;
  date: string;
};

type IconProps = { name: "sparkle" | "search" | "minus" | "rotate" | "trophy" | "target" | "clock" | "trash" | "book" | "home" | "close" };

type Era = "classic" | "modern";

const oddsByEra = {
  classic: [
    { value: 8192, label: "Probabilidad base", detail: "1 / 8.192" },
    { value: 2731, label: "Amuleto Iris (Gen. V)", detail: "1 / 2.731" },
    { value: 1638, label: "Método Masuda", detail: "1 / 1.638" },
    { value: 1024, label: "Masuda + Amuleto", detail: "1 / 1.024" },
  ],
  modern: [
    { value: 4096, label: "Probabilidad base", detail: "1 / 4.096" },
    { value: 1365, label: "Amuleto Iris", detail: "1 / 1.365" },
    { value: 683, label: "Método Masuda", detail: "1 / 683" },
    { value: 512, label: "Masuda + Amuleto", detail: "1 / 512" },
  ],
};

const guideSections = [
  {
    id: "fundamentos",
    label: "Fundamentos",
    title: "Empieza tu primera cacería",
    intro: "Todo lo necesario para entender qué es un Pokémon shiny y preparar una sesión sin perder encuentros.",
    articles: [
      { title: "¿Qué es un Pokémon shiny?", text: "Es una variante extremadamente rara con una paleta de colores diferente. No mejora sus estadísticas: su valor está en la rareza y en el recuerdo de conseguirlo." },
      { title: "Elige el juego y el objetivo", text: "Confirma que el Pokémon pueda aparecer shiny en tu juego. Algunos encuentros están bloqueados y nunca pueden salir shiny, por muchos intentos que realices." },
      { title: "Prepara la captura", text: "Lleva suficientes Poké Balls, un Pokémon con Falso Tortazo y un movimiento de estado. Guarda antes del encuentro siempre que el método lo permita." },
    ],
  },
  {
    id: "metodos",
    label: "Métodos",
    title: "Escoge el método adecuado",
    intro: "Cada juego ofrece métodos diferentes. Utiliza el que mejor encaje con el Pokémon que buscas y el tiempo que quieras dedicar.",
    articles: [
      { title: "Encuentros aleatorios", text: "Entra y sal de zonas con hierba, cuevas o agua. Es el método más simple y funciona en prácticamente todos los juegos, aunque mantiene la probabilidad base." },
      { title: "Método Masuda", text: "Cría dos Pokémon procedentes de juegos con idiomas distintos. Aumenta considerablemente las probabilidades y puede combinarse con el Amuleto Iris." },
      { title: "Reinicio suave", text: "Guarda antes de un encuentro fijo, comprueba el Pokémon y reinicia si no es shiny. Es útil para legendarios y Pokémon regalados que no estén bloqueados." },
      { title: "Cadenas y brotes", text: "Poké Radar, cadenas de pesca, SOS, brotes masivos y bocadillos dependen del juego. Mantén la cadena o cumple sus requisitos para mejorar las probabilidades." },
    ],
  },
  {
    id: "probabilidades",
    label: "Probabilidades",
    title: "Entiende las probabilidades",
    intro: "Cada encuentro es independiente. Superar la cifra esperada no garantiza el shiny, pero registrar los intentos ayuda a medir y disfrutar el proceso.",
    articles: [
      { title: "Generaciones I–V", text: "La probabilidad base clásica es de 1 entre 8.192. El Método Masuda se introdujo en la generación IV y el Amuleto Iris apareció en Pokémon Negro 2 y Blanco 2." },
      { title: "Generaciones VI–IX", text: "Desde Pokémon X e Y, la probabilidad base es de 1 entre 4.096. El Amuleto Iris y el Método Masuda pueden reducirla todavía más." },
      { title: "Probabilidad acumulada", text: "El porcentaje del contador expresa la posibilidad de haber visto al menos un shiny tras varios intentos. No modifica la probabilidad individual del próximo encuentro." },
    ],
  },
  {
    id: "consejos",
    label: "Consejos",
    title: "Haz la cacería más cómoda",
    intro: "Una buena preparación evita errores y convierte las sesiones largas en una experiencia mucho más agradable.",
    articles: [
      { title: "Divide las sesiones", text: "Marca objetivos de 50 o 100 encuentros, descansa con frecuencia y evita jugar con cansancio. La constancia es más útil que una sesión excesivamente larga." },
      { title: "Registra cada encuentro", text: "Utiliza el contador desde el inicio y revisa el método y la generación antes de comenzar. Los datos quedan guardados localmente en este dispositivo." },
      { title: "Evita perder la captura", text: "Desactiva movimientos peligrosos cuando sea posible, vigila los PP del rival y lleva habilidades que impidan la huida o la autodestrucción." },
    ],
  },
];

function Icon({ name }: IconProps) {
  const paths = {
    sparkle: <path d="m12 3 1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3Zm6 11 .7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z" />,
    search: <><circle cx="11" cy="11" r="6" /><path d="m16 16 4 4" /></>,
    minus: <path d="M5 12h14" />,
    rotate: <><path d="M4 12a8 8 0 1 0 2.3-5.7L4 8.6" /><path d="M4 4v4.6h4.6" /></>,
    trophy: <><path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" /><path d="M8 6H5v1a4 4 0 0 0 4 4m7-5h3v1a4 4 0 0 1-4 4m-3 1v5m-4 3h8m-6-3h4" /></>,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>,
    clock: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
    trash: <><path d="M5 7h14M9 7V4h6v3m2 0-1 13H8L7 7" /></>,
    book: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v17H7.5A3.5 3.5 0 0 0 4 22V5.5ZM20 5.5A3.5 3.5 0 0 0 16.5 2H13v17h3.5A3.5 3.5 0 0 1 20 22V5.5Z" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
  };
  return <svg aria-hidden="true" className="icon" viewBox="0 0 24 24" fill={name === "sparkle" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function App() {
  const [count, setCount] = useState(0);
  const [name, setName] = useState("");
  const [era, setEra] = useState<Era>("modern");
  const [odds, setOdds] = useState(4096);
  const [sprite, setSprite] = useState("");
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [pokemonNames, setPokemonNames] = useState<string[]>([]);
  const [searchFocused, setSearchFocused] = useState(false);
  const [trophies, setTrophies] = useState<Trophy[]>([]);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<"tracker" | "guides">(() => window.location.hash === "#guias" ? "guides" : "tracker");
  const [activeGuide, setActiveGuide] = useState("fundamentos");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("shinyHunterProData") || "{}");
      setCount(saved.count || 0);
      setName(saved.currentPokemon || "");
      setOdds(Number(saved.currentOdds) || 4096);
      setEra(saved.era || (Number(saved.currentOdds) > 4096 ? "classic" : "modern"));
      setTrophies(saved.trophies || []);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    const handleHash = () => setView(window.location.hash === "#guias" ? "guides" : "tracker");
    window.addEventListener("hashchange", handleHash);
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem("shinyHunterProData", JSON.stringify({
      count,
      currentPokemon: name,
      currentOdds: odds,
      era,
      trophies,
    }));
  }, [count, name, odds, era, trophies, ready]);

  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon-species?limit=2000")
      .then((response) => response.json())
      .then((data) => setPokemonNames(data.results.map((pokemon: { name: string }) => pokemon.name)))
      .catch(() => setPokemonNames([]));
  }, []);

  useEffect(() => {
    if (!name.trim()) {
      setSprite("");
      setNotFound(false);
      return;
    }
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase().trim()}`);
        if (!response.ok) throw new Error();
        const data = await response.json();
        setSprite(data.sprites.front_shiny || data.sprites.front_default || "");
        setNotFound(false);
      } catch {
        setSprite("");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [name]);

  const probability = useMemo(() => (1 - Math.pow(1 - 1 / odds, count)) * 100, [count, odds]);
  const expectedProgress = Math.min((count / odds) * 100, 100);
  const oddsOptions = oddsByEra[era];
  const selectedOdds = oddsOptions.find((option) => option.value === odds) || oddsOptions[0];
  const suggestions = useMemo(() => {
    const query = name.toLowerCase().trim();
    if (!query || pokemonNames.includes(query)) return [];
    return pokemonNames
      .filter((pokemon) => pokemon.startsWith(query))
      .concat(pokemonNames.filter((pokemon) => !pokemon.startsWith(query) && pokemon.includes(query)))
      .slice(0, 6);
  }, [name, pokemonNames]);

  const selectEra = (nextEra: Era) => {
    setEra(nextEra);
    setOdds(oddsByEra[nextEra][0].value);
  };

  const navigate = (nextView: "tracker" | "guides") => {
    window.location.hash = nextView === "guides" ? "guias" : "";
    setView(nextView);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveCatch = () => {
    if (!name.trim() || count < 1) return;
    setTrophies((items) => [{
      id: crypto.randomUUID(),
      name: name.trim(),
      count,
      odds,
      sprite,
      date: new Date().toISOString(),
    }, ...items]);
    setCount(0);
    setName("");
    setSprite("");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark"><Icon name="sparkle" /></span>
          <div><strong>SHINY</strong><span>TRACKER</span></div>
        </div>
        <nav className="main-nav" aria-label="Navegación principal">
          <button className={view === "tracker" ? "active" : ""} onClick={() => navigate("tracker")}><Icon name="home" /> Contador</button>
          <button className={view === "guides" ? "active" : ""} onClick={() => navigate("guides")}><Icon name="book" /> Guías</button>
        </nav>
        <div className="status"><span /> Datos guardados localmente</div>
      </header>

      {view === "tracker" ? <main>
        <section className="intro">
          <p className="eyebrow"><Icon name="target" /> CACERÍA ACTIVA</p>
          <h1>Tu próximo shiny<br />está más cerca.</h1>
          <p>Registra cada encuentro, controla tus probabilidades y construye tu colección.</p>
        </section>

        <div className="dashboard">
          <section className="hunt-card">
            <div className="pokemon-search">
              <div className="pokemon-avatar">
                {sprite ? <img src={sprite} alt={`Sprite shiny de ${name}`} /> : <Icon name={loading ? "clock" : "sparkle"} />}
              </div>
              <label>
                <span>POKÉMON OBJETIVO</span>
                <div className="input-wrap"><Icon name="search" /><input value={name} onChange={(event) => setName(event.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 150)} placeholder="Escribe un nombre..." autoComplete="off" role="combobox" aria-expanded={searchFocused && suggestions.length > 0} aria-controls="pokemon-suggestions" /></div>
                {searchFocused && suggestions.length > 0 && (
                  <div className="suggestions" id="pokemon-suggestions" role="listbox">
                    {suggestions.map((pokemon) => <button key={pokemon} role="option" onMouseDown={() => setName(pokemon)}><Icon name="search" /><span>{pokemon.replaceAll("-", " ")}</span></button>)}
                  </div>
                )}
                {notFound && <small>No encontramos ese Pokémon. Revisa el nombre.</small>}
              </label>
            </div>

            <div className="counter-block">
              <span>ENCUENTROS</span>
              <strong>{count.toLocaleString("es-ES")}</strong>
              <div className="probability-pill"><Icon name="sparkle" /> {probability.toFixed(2)}% de probabilidad acumulada</div>
            </div>

            <button className="primary-action" onClick={() => setCount((value) => value + 1)}>
              <span>+1</span> Registrar encuentro
            </button>
            <div className="secondary-actions">
              <button onClick={() => setCount((value) => Math.max(0, value - 1))}><Icon name="minus" /> Restar uno</button>
              <button onClick={() => setConfirmReset(true)}><Icon name="rotate" /> Reiniciar</button>
            </div>
          </section>

          <aside className="settings-card">
            <div className="section-heading"><span><Icon name="target" /></span><div><p>CONFIGURACIÓN</p><h2>Método de caza</h2></div></div>
            <div className="generation-selector">
              <span>GENERACIÓN DEL JUEGO</span>
              <div>
                <button className={era === "classic" ? "active" : ""} onClick={() => selectEra("classic")}><strong>Gen. I–V</strong><small>Base 1/8.192</small></button>
                <button className={era === "modern" ? "active" : ""} onClick={() => selectEra("modern")}><strong>Gen. VI–IX</strong><small>Base 1/4.096</small></button>
              </div>
            </div>
            <div className="odds-list">
              {oddsOptions.map((option) => (
                <button key={option.value} className={odds === option.value ? "selected" : ""} onClick={() => setOdds(option.value)}>
                  <span className="radio" />
                  <span><strong>{option.label}</strong><small>{option.detail}</small></span>
                </button>
              ))}
            </div>
            <div className="progress-card">
              <div><span>Progreso estimado</span><strong>{Math.round(expectedProgress)}%</strong></div>
              <div className="progress-track"><span style={{ width: `${expectedProgress}%` }} /></div>
              <p>{count.toLocaleString("es-ES")} de {odds.toLocaleString("es-ES")} encuentros esperados</p>
            </div>
            <button className="catch-button" disabled={!name.trim() || count < 1} onClick={saveCatch}><Icon name="sparkle" /> Registrar shiny capturado</button>
          </aside>
        </div>

        <section className="collection">
          <div className="collection-header">
            <div className="section-heading"><span><Icon name="trophy" /></span><div><p>COLECCIÓN</p><h2>Sala de trofeos</h2></div></div>
            <span className="count-badge">{trophies.length} {trophies.length === 1 ? "captura" : "capturas"}</span>
          </div>
          {trophies.length === 0 ? (
            <div className="empty-state"><span><Icon name="sparkle" /></span><h3>Tu vitrina te espera</h3><p>Cuando captures tu primer shiny, aparecerá aquí con todos los detalles de la cacería.</p></div>
          ) : (
            <div className="trophy-grid">
              {trophies.map((trophy) => (
                <article className="trophy-card" key={trophy.id || `${trophy.name}-${trophy.date}`}>
                  <div className="trophy-sprite">{trophy.sprite ? <img src={trophy.sprite} alt="" /> : <Icon name="sparkle" />}</div>
                  <div><small>SHINY CAPTURADO</small><h3>{trophy.name || "Desconocido"}</h3><p>{trophy.count.toLocaleString("es-ES")} encuentros · 1/{trophy.odds}</p></div>
                  <button aria-label={`Eliminar ${trophy.name}`} onClick={() => setTrophies((items) => items.filter((item) => item !== trophy))}><Icon name="trash" /></button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main> : (
        <main className="guides-page">
          <section className="guides-hero">
            <p className="eyebrow"><Icon name="book" /> GUÍAS DE SHINY HUNTING</p>
            <h1>Aprende, prepárate<br />y empieza a buscar.</h1>
            <p>Guías prácticas para entender los métodos, mejorar tus probabilidades y capturar cada shiny de forma segura.</p>
          </section>
          <div className="guides-layout">
            <aside className="guide-menu">
              <span>CONTENIDOS</span>
              {guideSections.map((section, index) => (
                <button key={section.id} className={activeGuide === section.id ? "active" : ""} onClick={() => setActiveGuide(section.id)}>
                  <span>{String(index + 1).padStart(2, "0")}</span>{section.label}
                </button>
              ))}
              <button className="start-hunt" onClick={() => navigate("tracker")}><Icon name="target" /> Abrir contador</button>
            </aside>
            {guideSections.filter((section) => section.id === activeGuide).map((section) => (
              <section className="guide-content" key={section.id}>
                <span className="guide-kicker">{section.label}</span>
                <h2>{section.title}</h2>
                <p className="guide-intro">{section.intro}</p>
                <div className="article-list">
                  {section.articles.map((article, index) => (
                    <article key={article.title}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <div><h3>{article.title}</h3><p>{article.text}</p></div>
                    </article>
                  ))}
                </div>
                <div className="guide-note"><Icon name="sparkle" /><p><strong>Consejo del cazador</strong>Comprueba siempre que el encuentro elegido no tenga bloqueo shiny antes de comenzar.</p></div>
              </section>
            ))}
          </div>
        </main>
      )}
      {confirmReset && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setConfirmReset(false)}>
          <div className="confirm-modal" role="alertdialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" aria-label="Cerrar" onClick={() => setConfirmReset(false)}><Icon name="close" /></button>
            <span className="warning-icon"><Icon name="rotate" /></span>
            <p className="modal-kicker">ACCIÓN IRREVERSIBLE</p>
            <h2 id="reset-title">¿Reiniciar el progreso?</h2>
            <p>El contador volverá a cero y no podrás recuperar los <strong>{count.toLocaleString("es-ES")} encuentros</strong> de esta cacería.</p>
            <div className="modal-actions">
              <button onClick={() => setConfirmReset(false)}>Cancelar</button>
              <button onClick={() => { setCount(0); setConfirmReset(false); }}>Sí, reiniciar contador</button>
            </div>
          </div>
        </div>
      )}
      <footer><span>SHINY TRACKER</span><p>La paciencia también forma parte de la aventura.</p><small>Método actual: {selectedOdds.label}</small></footer>
    </div>
  );
}

export default App;
