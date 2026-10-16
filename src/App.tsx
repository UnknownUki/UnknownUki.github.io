import { useEffect, useMemo, useState } from "react";

type Trophy = {
  id: string;
  name: string;
  count: number;
  odds: number;
  sprite: string;
  date: string;
};

type IconProps = { name: "sparkle" | "search" | "minus" | "rotate" | "trophy" | "target" | "clock" | "trash" };

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
        <div className="status"><span /> Datos guardados localmente</div>
      </header>

      <main>
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
              <button onClick={() => setCount(0)}><Icon name="rotate" /> Reiniciar</button>
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
      </main>
      <footer><span>SHINY TRACKER</span><p>La paciencia también forma parte de la aventura.</p><small>Método actual: {selectedOdds.label}</small></footer>
    </div>
  );
}

export default App;
