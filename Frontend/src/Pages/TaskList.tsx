import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { addXp, addCurrency, checkAndUpdateLevel } from '../lib/xp';

// local difficulty -> xp/dmg/gold map (keeps parity with DailyQuest)
const DIFFICULTY_MAP: Record<number, { xp: number; dmg: number; gold: number }> = {
  1: { xp: 8, dmg: 10, gold: 5 },
  2: { xp: 15, dmg: 18, gold: 12 },
  3: { xp: 28, dmg: 32, gold: 25 },
  4: { xp: 45, dmg: 50, gold: 45 },
}


interface Task {
  id: string;
  user_id: string;
  name: string;
  completed?: boolean
  description: string | null;
  completed_at: string | null;
  difficulty: number | null;
  notes: { id: string; text: string; completed: boolean; }[] | string | null;
  rewards: string | null;
  created_at: string;
  xp: number; // XP reward for completing this quest
  recurrence?: any | null;
  next_due?: string | null;
}

async function questComplete(questXp: number, questGold?: number): Promise<void> {
  try{
    const {data, error} = await supabase.auth.getUser()

    if (error || !data?.user){
      throw new Error('User not logged in')
    }

    const userId = data.user.id

  const newXp = await addXp(userId, questXp)
    
    // Check and update level based on new XP
    const { level, leveledUp } = await checkAndUpdateLevel(userId, newXp)
    
    if (leveledUp) {
      console.log(`Level up! You are now level ${level}`)
    }

    console.log(`XP: ${newXp}, Level: ${level}`)
    // award currency if requested
    if (typeof questGold === 'number' && questGold !== 0) {
      try {
        const newBal = await addCurrency(userId, questGold)
        console.log(`Currency awarded: ${questGold}, balance now ${newBal}`)
      } catch (e) {
        console.error('Failed to award currency:', e)
      }
    }
     } catch (err) {
    console.error('Failed to add XP:', (err as Error).message)
    }
  }

const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDifficulty, setNewDifficulty] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editedTask, setEditedTask] = useState<{ name: string; description: string; difficulty: number; notes: { id: string; text: string; completed: boolean; }[] }>({ name: "", description: "", difficulty: 0, notes: [] });
  const [newNoteText, setNewNoteText] = useState("");

  // Load user and fetch tasks on mount
  useEffect(() => {
    let isFetching = false;

    // Fetch tasks from Supabase
    const fetchTasks = async () => {
      if (isFetching) return;

      isFetching = true;
      setLoading(true);
      setError(null);

      try {
        const { data, error } = await supabase
          .from("taskitem")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching tasks:", error);
          setError("Failed to load tasks");
          setTasks([]);
        } else {
          // Parse notes JSON strings back to arrays
          const parsedTasks = (data || []).map(task => ({
            ...task,
            notes: task.notes && typeof task.notes === 'string' 
              ? (() => {
                  try {
                    return JSON.parse(task.notes);
                  } catch {
                    return task.notes; // Keep as string if parsing fails
                  }
                })()
              : task.notes
          }));
          setTasks(parsedTasks);
        }
      } catch (err) {
        console.error("Error fetching tasks:", err);
        setError("Failed to load tasks");
        setTasks([]);
      } finally {
        setLoading(false);
        isFetching = false;
      }
    };

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Only fetch on INITIAL_SESSION - this is the reliable event that fires with session data
          if (event === 'INITIAL_SESSION') {
            await fetchTasks();
          }
        } else {
          // User is not signed in
          setTasks([]);
          setLoading(false);
          if (event !== 'INITIAL_SESSION') {
            setError("Please sign in to view your tasks");
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Add a new task
  const addTask = async () => {
    if (!newTask.trim()) return;
    if (!user) {
      setError("Please sign in to add tasks");
      return;
    }

    setError(null);

    const { data, error } = await supabase
      .from("taskitem")
      .insert([
        {
          user_id: user.id,
          name: newTask.trim(),
          description: newDescription.trim() || null,
          completed_at: null,
          xp: 25,
          difficulty: newDifficulty || null, // Ensure difficulty is included
          notes: null // Initialize with null for new tasks
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error adding task:", error);
      setError("Failed to add task");
    } else {
      setTasks([data, ...tasks]);
      setNewTask("");
      setNewDescription("");
      setNewDifficulty(0); // Reset difficulty after adding task
    }
  };

  // Handler used by modal to add task and close modal
  const handleModalAdd = async () => {
    await addTask();
    // Close modal on success (or even if error, keep UX simple)
    setShowModal(false);
  };

  // Toggle task completion
  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    setError(null);

    // Toggle: if completed_at is null, set to now; if set, set to null
    const newCompletedAt = task.completed_at ? null : new Date().toISOString();

    const { error } = await supabase
      .from("taskitem")
      .update({ completed_at: newCompletedAt })
      .eq("id", id);

    if (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task");
    } else {
      setTasks(
        tasks.map((t) =>
          t.id === id ? { ...t, completed_at: newCompletedAt, completed: !t.completed} : t
        
        )
      );
    }
  if (!task.completed) {
    const diff = task.difficulty || 1
    const { gold } = DIFFICULTY_MAP[diff] || DIFFICULTY_MAP[1]
    await questComplete(task.xp, gold);
  }
  
  };

  // Delete a task
  const deleteTask = async (id: string) => {
    setError(null);

    const { error } = await supabase
      .from("taskitem")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting task:", error);
      setError("Failed to delete task");
    } else {
      setTasks(tasks.filter((t) => t.id !== id));
    }
  };

  // Star rating click handler
  const handleStarClick = (rating: number) => {
    setNewDifficulty(rating);
  };

  const toggleTaskDetails = (taskId: string) => {
    setExpandedTaskId((prev) => (prev === taskId ? null : taskId));
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    
    // Handle different note formats safely
    let notesArray: { id: string; text: string; completed: boolean; }[] = [];
    if (task.notes) {
      if (Array.isArray(task.notes)) {
        notesArray = task.notes;
      } else if (typeof task.notes === 'string') {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(task.notes);
          if (Array.isArray(parsed)) {
            notesArray = parsed;
          } else {
            // Convert single string to array format
            notesArray = [{
              id: Date.now().toString(),
              text: task.notes,
              completed: false
            }];
          }
        } catch {
          // If JSON parsing fails, treat as plain string
          notesArray = [{
            id: Date.now().toString(),
            text: task.notes,
            completed: false
          }];
        }
      }
    }
    
    setEditedTask({
      name: task.name,
      description: task.description || "",
      difficulty: task.difficulty || 0,
      notes: notesArray
    });
  };

  const handleEditChange = (field: keyof typeof editedTask, value: string | number) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
  };

  const addNote = () => {
    if (!newNoteText.trim()) return;
    const newNote = {
      id: Date.now().toString(),
      text: newNoteText.trim(),
      completed: false
    };
    setEditedTask(prev => ({
      ...prev,
      notes: [...prev.notes, newNote]
    }));
    setNewNoteText("");
  };

  const toggleNote = (noteId: string) => {
    setEditedTask(prev => ({
      ...prev,
      notes: prev.notes.map(note =>
        note.id === noteId ? { ...note, completed: !note.completed } : note
      )
    }));
  };

  const deleteNote = (noteId: string) => {
    setEditedTask(prev => ({
      ...prev,
      notes: prev.notes.filter(note => note.id !== noteId)
    }));
  };

  const saveTaskEdit = async () => {
    if (!editingTaskId) return;
    
    setError(null);
    
    const { error } = await supabase
      .from("taskitem")
      .update({
        name: editedTask.name.trim(),
        description: editedTask.description.trim() || null,
        difficulty: editedTask.difficulty || null,
        notes: editedTask.notes.length > 0 ? editedTask.notes : null
      })
      .eq("id", editingTaskId);

    if (error) {
      console.error("Error updating task:", error);
      setError("Failed to update task");
    } else {
      setTasks(tasks.map(t => 
        t.id === editingTaskId 
          ? { ...t, name: editedTask.name, description: editedTask.description, difficulty: editedTask.difficulty, notes: editedTask.notes.length > 0 ? editedTask.notes : null }
          : t
      ));
      setEditingTaskId(null);
    }
  };

  const cancelEditing = () => {
    setEditingTaskId(null);
    setEditedTask({ name: "", description: "", difficulty: 0, notes: [] });
    setNewNoteText("");
  };

  const handleEditStarClick = (rating: number) => {
    handleEditChange("difficulty", rating);
  };

  return (
    <section className="min-h-dvh w-full flex flex-col justify-start items-center text-center bg-gradient-to-br from-green-200 to-amber-400 overflow-hidden pt-4 pb-12">
      <div className="flex flex-col justify-start items-center gap-y-8 max-w-4xl w-full px-4">
        {/* Branding / Logo */}
        <span className="text-[26px] font-bold text-gray-800">
          FocusQuest
        </span>

        {/* Page Title */}
        <h1 className="text-5xl text-gray-900 font-extrabold leading-tight">
          Task List
        </h1>

        {/* Error Message */}
        {error && (
          <div className="w-full max-w-2xl rounded-2xl bg-red-100 border border-red-300 text-red-800 px-6 py-4 shadow-lg">
            <p className="font-semibold">{error}</p>
            {!user && (
              <button
                onClick={() => navigate('/auth')}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Go to Sign In
              </button>
            )}
          </div>
        )}

        {/* Add Task Popup Trigger */}
        <div className="flex gap-4 w-full max-w-md items-center justify-center">
          <button
            onClick={() => setShowModal(true)}
            className="bg-white text-amber-900 hover:bg-amber-800 hover:text-white transition-all px-6 py-3 rounded-full text-lg font-semibold shadow-lg cursor-pointer"
          >
            + New Task
          </button>
        </div>

        {/* New Task Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowModal(false)}
            />

            <div className="relative bg-white rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Task</h2>

              {/* Difficulty Level (Stars) */}
              <div className="flex items-center justify-center mb-4">
                <span className="mr-2 text-lg font-medium text-gray-800">Difficulty:</span>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    className={`text-2xl ${
                      star <= newDifficulty ? "text-yellow-500" : "text-gray-300"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleModalAdd()}
                placeholder="Task name"
                className="w-full px-4 py-3 rounded-lg text-lg border-0 outline-none shadow-sm text-gray-800 placeholder-gray-500 mb-4"
              />

              <textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full px-4 py-3 rounded-lg text-lg border-0 outline-none shadow-sm text-gray-800 placeholder-gray-500 mb-4 resize-none"
                rows={3}
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => { setShowModal(false); setNewTask(''); setNewDescription(''); }}
                  className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleModalAdd}
                  className="px-4 py-2 rounded-lg bg-amber-900 text-white hover:bg-amber-700"
                >
                  Add Task
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task List */}
        <div className="w-full max-w-2xl space-y-4">
          {loading ? (
            <p className="text-lg text-gray-700 py-8">
              Loading tasks...
            </p>
          ) : tasks.length === 0 ? (
            <p className="text-lg text-gray-700 py-8">
              No tasks yet. Add one above to get started!
            </p>
          ) : (
            tasks.map((task) => (
              <div
                key={task.id}
                className={`bg-white rounded-2xl p-6 shadow-lg transition-all hover:shadow-xl ${
                  task.completed_at ? 'opacity-75' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={!!task.completed_at}
                    onChange={() => toggleTask(task.id)}
                    className="w-6 h-6 text-amber-600 rounded border-2 border-gray-300 focus:ring-amber-500"
                  />
                      <div className="flex-1 text-left">
                        <span
                          className={`block text-lg ${task.completed_at ? 'line-through text-gray-500' : 'text-gray-800'}`}
                        >
                          {task.name}
                        </span>
                        {/* Recurrence / repeats info */}
                        {(() => {
                          try {
                            const rec = typeof task.recurrence === 'string' && task.recurrence ? JSON.parse(task.recurrence) : task.recurrence;
                            if (!rec) return null;
                            if (rec.type === 'one-time') {
                              const dateStr = task.next_due ? new Date(task.next_due).toLocaleDateString() : null;
                              return <div className="text-sm text-gray-500 mt-1">One-time{dateStr ? ` — due ${dateStr}` : ''}</div>;
                            }
                            if (rec.type === 'daily') {
                              return <div className="text-sm text-gray-500 mt-1">Repeats daily{rec.count ? ` — ${rec.count}×` : ' — indefinitely'}</div>;
                            }
                            if (rec.type === 'every_n_days') {
                              return <div className="text-sm text-gray-500 mt-1">Repeats every {rec.interval || 1} day(s){rec.count ? ` — ${rec.count}×` : ' — indefinitely'}</div>;
                            }
                            if (rec.type === 'weekly') {
                              // rec.byweekday uses 0 (Sun) - 6 (Sat) per our recurrence.ts
                              const weekdayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
                              let daysStr = ''
                              try {
                                if (Array.isArray(rec.byweekday)) {
                                  daysStr = (rec.byweekday as any[])
                                    .map((d) => {
                                      if (typeof d === 'number') return weekdayNames[d] || String(d)
                                      // handle strings like 'MO' or 'Tue'
                                      if (typeof d === 'string') {
                                        // try to map common two-letter forms
                                        const upper = d.toUpperCase()
                                        const map: Record<string, string> = { MO: 'Mon', TU: 'Tue', TUe: 'Tue', WE: 'Wed', TH: 'Thu', FR: 'Fri', SA: 'Sat', SU: 'Sun' }
                                        if (map[upper.slice(0,2)]) return map[upper.slice(0,2)]
                                        return d
                                      }
                                      return String(d)
                                    })
                                    .join('/')
                                }
                              } catch (e) {
                                daysStr = ''
                              }
                              return <div className="text-sm text-gray-500 mt-1">Repeats weekly{daysStr ? ` — ${daysStr}` : ''}{rec.count ? ` — ${rec.count}×` : ''}</div>;
                            }
                            // fallback
                            return <div className="text-sm text-gray-500 mt-1">Repeats{rec.count ? ` — ${rec.count}×` : ' — indefinitely'}</div>;
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>
                  <span
                    onClick={() => toggleTaskDetails(task.id)}
                    className={`flex-1 text-left text-lg cursor-pointer ${
                      task.completed_at
                        ? 'line-through text-gray-500'
                        : 'text-gray-800'
                    }`}
                  >
                    {task.name}
                  </span>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded"
                  >
                    ✕
                  </button>
                </div>

                {/* Task Details */}
                {expandedTaskId === task.id && (
                  <div className="mt-4 text-left text-gray-700">
                    {editingTaskId === task.id ? (
                      // Edit Mode
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Task Name:</label>
                          <input
                            type="text"
                            value={editedTask.name}
                            onChange={(e) => handleEditChange("name", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description:</label>
                          <textarea
                            value={editedTask.description}
                            onChange={(e) => handleEditChange("description", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                            rows={3}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty:</label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleEditStarClick(star)}
                                className={`text-2xl ${star <= editedTask.difficulty ? "text-yellow-500" : "text-gray-300"} hover:text-yellow-400 transition-colors`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Notes:</label>
                          <div className="space-y-2">
                            {editedTask.notes.map((note) => (
                              <div key={note.id} className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={note.completed}
                                  onChange={() => toggleNote(note.id)}
                                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                                />
                                <span className={`flex-1 ${note.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                  {note.text}
                                </span>
                                <button
                                  onClick={() => deleteNote(note.id)}
                                  className="text-red-500 hover:text-red-700 text-sm"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newNoteText}
                                onChange={(e) => setNewNoteText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addNote()}
                                placeholder="Add a note... (press Enter)"
                                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                              />
                              <button
                                onClick={addNote}
                                className="px-3 py-1 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition-colors"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={saveTaskEdit}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div>
                        <p><strong>Description:</strong> {task.description || "No description"}</p>
                        <p><strong>Difficulty:</strong> 
                          {task.difficulty ? (
                            <span className="ml-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={`${star <= (task.difficulty || 0) ? "text-yellow-500" : "text-gray-300"}`}>★</span>
                              ))}
                            </span>
                          ) : "Not set"}
                        </p>
                        {task.notes && (
                          <div>
                            <p><strong>Notes:</strong></p>
                            {(() => {
                              let notesToDisplay = task.notes;
                              
                              // Parse JSON string if needed
                              if (typeof task.notes === 'string') {
                                try {
                                  notesToDisplay = JSON.parse(task.notes);
                                } catch {
                                  // If parsing fails, display as string
                                  return <p className="mt-1 text-sm text-gray-700">{task.notes}</p>;
                                }
                              }
                              
                              // Display array format
                              if (Array.isArray(notesToDisplay) && notesToDisplay.length > 0) {
                                return (
                                  <ul className="mt-1 space-y-1">
                                    {notesToDisplay.map((note) => (
                                      <li key={note.id} className="flex items-center gap-2 text-sm">
                                        <span className={`w-4 h-4 flex-shrink-0 ${note.completed ? 'text-green-500' : 'text-gray-400'}`}>
                                          {note.completed ? '✓' : '○'}
                                        </span>
                                        <span className={note.completed ? 'line-through text-gray-500' : 'text-gray-700'}>
                                          {note.text}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }
                              
                              return null;
                            })()}
                          </div>
                        )}
                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => startEditing(task)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-8 text-lg text-gray-700">
          <span>Total: {tasks.length}</span>
          <span>Completed: {tasks.filter(t => t.completed_at).length}</span>
          <span>Remaining: {tasks.filter(t => !t.completed_at).length}</span>
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
