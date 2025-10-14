import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Pages/Home'
import TaskList from './Pages/TaskList'
import About from './Pages/About'
import Navbar from './Components/NavBar'

function App() {

  return (
    <>
  
    <BrowserRouter>
  <Navbar/>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/tasks" element={<TaskList/>} />
        <Route path='/about' element={<About/>} />
      </Routes>
      
    </BrowserRouter>
    </>
  )
}

export default App
