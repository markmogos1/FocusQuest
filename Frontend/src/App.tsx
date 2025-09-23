import './App.css'
import { BrowserRouter, Route } from 'react-router'
import {Routes} from 'react-router-dom'
import Home from './Pages/Home'

function App() {

  return (
    <>
    <BrowserRouter>

      <Routes>
        <Route path="/" element={<Home/>} />
      </Routes>
      
    </BrowserRouter>
    </>
  )
}

export default App
