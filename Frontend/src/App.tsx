import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Pages/Home'
import TaskList from './Pages/TaskList'
import About from './Pages/About'
import Navbar from './Components/NavBar'
import DailyQuestPage from './Pages/DailyQuest'
import TestTablePage from './Pages/TestDatabaseTable'
import AuthPage from './Pages/AuthPage'
import ProtectedRoute from './Components/ProtectedRoute'
import CalendarComponent from './Pages/CalendarComponent'
import Profile from './Pages/ProfilePage'
import Shop from './Pages/Shop'
import Equipment from './Pages/Equipment'

function App() {

  return (
    <>
      <BrowserRouter>
        <Navbar/>
        <div className="pt-16">
          <Routes>
          <Route path="/" element={<Home/>} />
          <Route
          path="/tasks"
          element={
            <ProtectedRoute>
              <TaskList/>
            </ProtectedRoute>
          }
        />
          <Route path='/about' element={<About/>} />
          <Route
          path='/daily'
          element={
            <ProtectedRoute>
              <DailyQuestPage/>
            </ProtectedRoute>
          }
        />
          <Route path='/shop' element={<Shop/>}/>
          <Route path='/test-table' element={<TestTablePage/>}/>
          <Route path='/auth' element={<AuthPage/>}/>
          <Route path='/calendar' element={<CalendarComponent/>}/>
          <Route path="/profile" element={<Profile />} />
          <Route path="/equipment" element={<Equipment />} />
          </Routes>
        </div>
      </BrowserRouter>
    </>
  )
}

export default App