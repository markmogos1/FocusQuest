import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Pages/Home'
import TaskList from './Pages/TaskList'
import About from './Pages/About'
import Navbar from './Components/NavBar'
import DailyQuestPage from './Pages/DailyQuest'
import TestTablePage from './Pages/TestDatabaseTable'
import AuthPage from './Pages/AuthPage'
import CalendarComponent from './Pages/CalendarComponent'
import Profile from './Pages/ProfilePage'
import Equipment from './Pages/Equipment'

function App() {

  return (
    <>
      <BrowserRouter>
        <Navbar/>
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/tasks" element={<TaskList/>} />
          <Route path='/about' element={<About/>} />
          <Route path='/daily' element={<DailyQuestPage/>}/>
          <Route path='/test-table' element={<TestTablePage/>}/>
          <Route path='/auth' element={<AuthPage/>}/>
          <Route path='/calendar' element={<CalendarComponent/>}/>
          <Route path="/profile" element={<Profile />} />
          <Route path="/equipment" element={<Equipment />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App