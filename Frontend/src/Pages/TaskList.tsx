import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "Complete project proposal", completed: false },
    { id: 2, text: "Review team feedback", completed: true },
    { id: 3, text: "Update documentation", completed: false },
  ]);
  const [newTask, setNewTask] = useState("");

  const addTask = () => {
    if (newTask.trim()) {
      const task: Task = {
        id: Date.now(),
        text: newTask.trim(),
        completed: false,
      };
      setTasks([...tasks, task]);
      setNewTask("");
    }
  };

  const toggleTask = (id: number) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
  };

  const deleteTask = (id: number) => {
    setTasks(tasks.filter(task => task.id !== id));
  };

  return (
    <section className="absolute inset-0 flex flex-col justify-center items-center text-center bg-gradient-to-br from-green-200 to-amber-400 overflow-hidden">
      <div className="flex flex-col justify-center items-center gap-y-8 max-w-4xl w-full px-4">
        {/* Branding / Logo */}
        <span className="text-[26px] font-bold text-gray-800">
          FocusQuest
        </span>

        {/* Page Title */}
        <h1 className="text-5xl text-gray-900 font-extrabold leading-tight">
          Task List
        </h1>

        {/* Add Task Input */}
        <div className="flex gap-4 w-full max-w-md">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a new task..."
            className="flex-1 px-4 py-3 rounded-full text-lg border-0 outline-none shadow-lg text-gray-800 placeholder-gray-500"
          />
          <button
            onClick={addTask}
            className="bg-white text-amber-900 hover:bg-amber-800 hover:text-white transition-all px-6 py-3 rounded-full text-lg font-semibold shadow-lg cursor-pointer"
          >
            Add
          </button>
        </div>

        {/* Task List */}
        <div className="w-full max-w-2xl space-y-4">
          {tasks.length === 0 ? (
            <p className="text-lg text-gray-700 py-8">
              No tasks yet. Add one above to get started!
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl ${
                  task.completed ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="w-6 h-6 text-amber-600 rounded border-2 border-gray-300 focus:ring-amber-500"
                  />
                  <span
                    className={`flex-1 text-left text-lg ${
                      task.completed
                        ? 'line-through text-gray-500'
                        : 'text-gray-800'
                    }`}
                  >
                    {task.text}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-8 text-lg text-gray-700">
          <span>Total: {tasks.length}</span>
          <span>Completed: {tasks.filter(t => t.completed).length}</span>
          <span>Remaining: {tasks.filter(t => !t.completed).length}</span>
        </div>

        {/* Navigation */}
        <button 
          onClick={() => navigate('/')}
          className="bg-white text-amber-900 hover:bg-amber-800 hover:text-white transition-all px-8 py-4 rounded-full text-xl font-semibold shadow-lg cursor-pointer"
        >
          ← Back to Home
        </button>
      </div>
    </section>
  );
};

export default TaskList;
