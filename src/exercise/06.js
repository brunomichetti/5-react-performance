// Fix "perf death by a thousand cuts"
// http://localhost:3000/isolated/exercise/06.js

import * as React from 'react'
import {
  useForceRerender,
  useDebouncedState,
  AppGrid,
  updateGridState,
  updateGridCellState,
} from '../utils'

const AppStateContext = React.createContext()
const AppDispatchContext = React.createContext()
// creo contexto del perro
const DogContext = React.createContext()

const initialGrid = Array.from({length: 100}, () =>
  Array.from({length: 100}, () => Math.random() * 100),
)

// Creo reducer del perro
function dogReducer(state, action) {
  switch (action.type) {
    case 'TYPED_IN_DOG_INPUT': {
      return {...state, dogName: action.dogName}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

// creo dog provider
function DogProvider(props) {
  const [state, dispatch] = React.useReducer(dogReducer, {dogName: ''})
  const value = [state, dispatch]
  return <DogContext.Provider value={value} {...props} />
}

// creo hook para el perro
function useDogState() {
  const context = React.useContext(DogContext)
  if (!context) {
    throw new Error('useDogState must be used within the DogStateProvider')
  }
  return context
}

function appReducer(state, action) {
  switch (action.type) {
    // we're no longer managing the dogName state in our reducer
    // 💣 remove this case
    // case 'TYPED_IN_DOG_INPUT': {
    //   return {...state, dogName: action.dogName}
    // }
    case 'UPDATE_GRID_CELL': {
      return {...state, grid: updateGridCellState(state.grid, action)}
    }
    case 'UPDATE_GRID': {
      return {...state, grid: updateGridState(state.grid)}
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`)
    }
  }
}

function AppProvider({children}) {
  const [state, dispatch] = React.useReducer(appReducer, {
    // 💣 remove the dogName state because we're no longer managing that
    // dogName: '',
    grid: initialGrid,
  })
  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  )
}

function useAppState() {
  const context = React.useContext(AppStateContext)
  if (!context) {
    throw new Error('useAppState must be used within the AppProvider')
  }
  return context
}

function useAppDispatch() {
  const context = React.useContext(AppDispatchContext)
  if (!context) {
    throw new Error('useAppDispatch must be used within the AppProvider')
  }
  return context
}

function Grid() {
  const dispatch = useAppDispatch()
  const [rows, setRows] = useDebouncedState(50)
  const [columns, setColumns] = useDebouncedState(50)
  const updateGridData = () => dispatch({type: 'UPDATE_GRID'})
  return (
    <AppGrid
      onUpdateGrid={updateGridData}
      rows={rows}
      handleRowsChange={setRows}
      columns={columns}
      handleColumnsChange={setColumns}
      Cell={Cell}
    />
  )
}
Grid = React.memo(Grid)

// extra 2:
// Crea CellImpl, que es el memoizado con react memo.
// function CellImpl({cell, row, column}) {
//   const dispatch = useAppDispatch()
//   const handleClick = () => dispatch({type: 'UPDATE_GRID_CELL', row, column})
//   return (
//     <button
//       className="cell"
//       onClick={handleClick}
//       style={{
//         color: cell > 50 ? 'white' : 'black',
//         backgroundColor: `rgba(0, 0, 0, ${cell / 100})`,
//       }}
//     >
//       {Math.floor(cell)}
//     </button>
//   )
// }
// CellImpl = React.memo(CellImpl)

// extra 2: Cell usa CellImpl, y usa el useAppState
// si hay una actualización de estado, Cell se re-renderiza y por lo tanto
// re-renderiza a CellImpl que esta memoizado. Dado que Cell maneja estado
// CellImpl va a re-renderizarse cuando cambie la Cell padre.
// function Cell({row, column}) {
//   const state = useAppState()
//   const cell = state.grid[row][column]
//   return <CellImpl cell={cell} row={row} column={column} />
// }
// Cell = React.memo(Cell)

// extra 3
// Crea un HOC: withStateSlice
function withStateSlice(Comp, slice) {
  // componente memoized
  const MemoComp = React.memo(Comp)
  // crea wrapper
  function Wrapper(props, ref) {
    const state = useAppState()
    return <MemoComp ref={ref} state={slice(state, props)} {...props} />
  }
  Wrapper.displayName = `withStateSlice(${Comp.displayName || Comp.name})`
  // Retorna memoizado, un memocomp con referencia al padre de memoconf
  return React.memo(React.forwardRef(Wrapper))
}
// extra 3: Cell no maneja el AppState, lo hace su padre (memocomp).
function Cell({state: cell, row, column}) {
  const dispatch = useAppDispatch()
  const handleClick = () => dispatch({type: 'UPDATE_GRID_CELL', row, column})
  return (
    <button
      className="cell"
      onClick={handleClick}
      style={{
        color: cell > 50 ? 'white' : 'black',
        backgroundColor: `rgba(0, 0, 0, ${cell / 100})`,
      }}
    >
      {Math.floor(cell)}
    </button>
  )
}
Cell = withStateSlice(Cell, (state, {row, column}) => state.grid[row][column])

function DogNameInput() {
  const [state, dispatch] = useDogState()
  const {dogName} = state

  function handleChange(event) {
    const newDogName = event.target.value
    // 🐨 change this to call your state setter that you get from useState
    dispatch({type: 'TYPED_IN_DOG_INPUT', dogName: newDogName})
  }

  return (
    <form onSubmit={e => e.preventDefault()}>
      <label htmlFor="dogName">Dog Name</label>
      <input
        value={dogName}
        onChange={handleChange}
        id="dogName"
        placeholder="Toto"
      />
      {dogName ? (
        <div>
          <strong>{dogName}</strong>, I've a feeling we're not in Kansas anymore
        </div>
      ) : null}
    </form>
  )
}
function App() {
  const forceRerender = useForceRerender()
  return (
    <div className="grid-app">
      <button onClick={forceRerender}>force rerender</button>
      {/* Dado que necesitaba tener (porque sí) el estado del perro global
      separa contextos. En DogProvider tiene el estado del perro
      y en AppProvider tiene el estado de la grilla */}
      <DogProvider>
        <DogNameInput />
      </DogProvider>
      <AppProvider>
        <Grid />
      </AppProvider>
    </div>
  )
}

export default App

/*
eslint
  no-func-assign: 0,
*/
