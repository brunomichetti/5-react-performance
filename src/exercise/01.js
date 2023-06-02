// Code splitting
// http://localhost:3000/isolated/exercise/01.js

import * as React from 'react'

// Como lo que exporta por default ../globe es pesado y puede enlentencer, se hace un lazy import
// Se define la función loadGlobe que hace el import, y se define Globe como lazy tomando dicha función
// Es importante que Globe sea un componente exportado con default
const loadGlobe = () => import('../globe')
const Globe = React.lazy(loadGlobe)

// Otro caso------------------------------------------------------------------------------------------------------------
// Usar magick comment de webpack (si se está trabajando con webpack) para que haga el load en el browser previamente
// e ir adelantandose
// const Globe = React.lazy(() => import(/* webpackPrefetch: true */ '../globe'))
// ---------------------------------------------------------------------------------------------------------------------
function App() {
  const [showGlobe, setShowGlobe] = React.useState(false)

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        padding: '2rem',
      }}
    >
      <label
        style={{marginBottom: '1rem'}}
        // Si pasa una de estas dos cosas ya se empieza a cargar
        // Se asocian esas dos con que el usuario tiene la intencion de ir a clickear la label
        onMouseEnter={loadGlobe}
        onFocus={loadGlobe}
      >
        <input
          type="checkbox"
          checked={showGlobe}
          onChange={e => setShowGlobe(e.target.checked)}
        />
        {' show globe'}
      </label>
      {/* Wrappeo el componente pesado a importar con React.Suspense 
      y pongo un default fallback para mostrar mientras carga */}
      <React.Suspense fallback={<div>loading...</div>}>
        <div style={{width: 400, height: 400}}>
          {showGlobe ? <Globe /> : null}
        </div>
      </React.Suspense>
    </div>
  )
}

export default App
